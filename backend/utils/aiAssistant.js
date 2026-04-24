import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Luôn load .env từ thư mục backend (kể cả khi cwd không phải backend)
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config();

const apiKeyChat = (process.env.GEMINI_API_KEY_CHAT || process.env.API_KEY_CHATBOT || process.env.GEMINI_API_KEY || '').trim();
const apiKeyDescription = (process.env.GEMINI_API_KEY_DESCRIPTION || process.env.GEMINI_API_KEY_DESC || process.env.GEMINI_API_KEY || '').trim();
const isApiKeyChatValid = apiKeyChat.length >= 20;
const isApiKeyDescriptionValid = apiKeyDescription.length >= 20;
// Backward compatibility
const apiKey = apiKeyChat;
const isApiKeyValid = isApiKeyChatValid;
/** Xem danh sách model: https://ai.google.dev/gemini-api/docs/models/gemini */
const GEMINI_MODEL = (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();

/**
 * Chỉ thêm model khác qua GEMINI_MODEL_FALLBACK (cách nhau bởi dấu phẩy).
 * Không gắn sẵn gemini-2.0-flash-001: cùng nhóm quota với gemini-2.0-flash — gọi thêm chỉ tốn request mà vẫn 429.
 */
const MODEL_FALLBACK_CHAIN = (process.env.GEMINI_MODEL_FALLBACK || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mỗi lần chờ sau 429: API có thể gợi ý 20–60s — cắt ngắn để UI không "load vô hạn".
 * Có thể tăng qua GEMINI_MAX_RETRY_WAIT_MS (tối đa 15000).
 */
const MAX_RETRY_WAIT_MS = Math.min(
    15000,
    Math.max(2000, parseInt(process.env.GEMINI_MAX_RETRY_WAIT_MS || '5000', 10) || 5000)
);

/**
 * Số lần thử lại cùng model khi 429 (sau mỗi lần chờ ngắn).
 * Mặc định 0 = gặp 429 thì chuyển model ngay, không chờ lặp lại (nhanh nhất).
 */
const RETRIES_ON_429 = Math.min(2, Math.max(0, parseInt(process.env.GEMINI_429_RETRIES || '0', 10) || 0));

/** Timeout toàn bộ chuỗi gọi (đổi model + retry), tránh treo vô hạn */
const TOTAL_TIMEOUT_MS = Math.min(
    120000,
    Math.max(25000, parseInt(process.env.GEMINI_TOTAL_TIMEOUT_MS || '50000', 10) || 50000)
);

/**
 * @param {unknown} err
 * @returns {boolean}
 */
function isRateLimitError(err) {
    const status = err && typeof err === 'object' && 'status' in err ? Number(err.status) : NaN;
    if (status === 429) return true;
    const raw = err && typeof err === 'object' && 'message' in err ? String(err.message) : String(err);
    const lower = raw.toLowerCase();
    return lower.includes('429') || lower.includes('quota') || lower.includes('resource exhausted') || lower.includes('too many requests');
}

/**
 * Trích delay từ thông báo lỗi (vd: "Please retry in 4.9s")
 * @param {unknown} err
 * @returns {number} ms
 */
function parseRetryDelayMs(err) {
    const raw = err && typeof err === 'object' && 'message' in err ? String(err.message) : String(err);
    const m = raw.match(/retry in ([\d.]+)\s*s/i);
    const suggested = m ? Math.ceil(parseFloat(m[1]) * 1000) + 400 : 3000;
    return Math.min(MAX_RETRY_WAIT_MS, Math.max(1500, suggested));
}

function formatGeminiError(err) {
    const raw = err && typeof err === 'object' && 'message' in err ? String(err.message) : String(err);
    const lower = raw.toLowerCase();
    if (lower.includes('api key') || lower.includes('invalid api') || raw.includes('401')) {
        return 'API key Gemini không hợp lệ hoặc bị từ chối. Tạo key mới tại https://aistudio.google.com/apikey và cập nhật GEMINI_API_KEY trong backend/.env';
    }
    if (raw.includes('GEMINI_TIMEOUT') || raw.includes('hết thời gian chờ')) {
        return 'Hết thời gian chờ phản hồi từ Gemini (quá tải hoặc mạng chậm). Thử lại sau vài giây hoặc tăng GEMINI_TOTAL_TIMEOUT_MS trong backend/.env nếu cần.';
    }
    if (isRateLimitError(err)) {
        const limitZero = /limit:\s*0/i.test(raw) || /free_tier.*limit:\s*0/i.test(raw);
        if (limitZero) {
            return 'Hết quota miễn phí Gemini cho dự án này (429, limit 0). Cách xử lý: Google Cloud Console → APIs → Gemini API → bật thanh toán pay-as-you-go, hoặc tạo API key / dự án mới trên https://aistudio.google.com/apikey — Hạn mức: https://ai.google.dev/gemini-api/docs/rate-limits';
        }
        return 'Vượt giới hạn tần suất Gemini (429). Đợi 1–2 phút rồi thử lại; không bấm tạo mô tả liên tục. Xem usage: Google AI Studio hoặc https://ai.google.dev/gemini-api/docs/rate-limits';
    }
    if (lower.includes('404') || lower.includes('not found') || /model.*not found/i.test(raw)) {
        return `Model không khả dụng cho API key này (404). Dùng đúng "Model code" trong Google AI Studio (thường là gemini-2.0-flash cho tài khoản chỉ bật Gemini 2.x). Trong backend/.env: GEMINI_MODEL=gemini-2.0-flash — bỏ GEMINI_MODEL_FALLBACK nếu có model 1.5. Tài liệu: https://ai.google.dev/gemini-api/docs/models/gemini — Chi tiết: ${raw.slice(0, 200)}`;
    }
    return `Lỗi Gemini: ${raw}`;
}

/**
 * Lấy text từ response; xử lý trường hợp bị chặn an toàn / không có candidate
 */
function extractResponseText(response) {
    const c = response?.candidates?.[0];
    if (!c) {
        const br = response?.promptFeedback?.blockReason;
        if (br) {
            throw new Error(`Nội dung bị chặn (blockReason: ${br}). Thử bớt từ khóa nhạy cảm hoặc rút mô tả hiện tại.`);
        }
        throw new Error('Không có phản hồi từ model (0 candidates).');
    }
    return response.text();
}

let genAIChat = null;
let genAIDescription = null;

const getGenAIChat = () => {
    if (!isApiKeyChatValid) return null;
    if (!genAIChat) genAIChat = new GoogleGenerativeAI(apiKeyChat);
    return genAIChat;
};

const getGenAIDescription = () => {
    if (!isApiKeyDescriptionValid) return null;
    if (!genAIDescription) genAIDescription = new GoogleGenerativeAI(apiKeyDescription);
    return genAIDescription;
};

// Backward compatibility
const getGenAI = () => getGenAIChat();

/**
 * Gọi generateContent với nhiều model + tùy chọn chờ ngắn khi 429
 * @param {string} prompt
 * @param {object | null} generationConfig
 * @param {'chat'|'description'} type - Loại API key sử dụng
 * @returns {Promise<string>}
 */
async function generateContentWithFallbacksCore(prompt, generationConfig = null, type = 'chat') {
    const modelChain = [...new Set([GEMINI_MODEL, ...MODEL_FALLBACK_CHAIN])];
    let lastError = null;
    let lastRateLimitError = null;

    for (const modelId of modelChain) {
        for (let attempt = 0; attempt <= RETRIES_ON_429; attempt++) {
            try {
                const genAI = type === 'description' ? getGenAIDescription() : getGenAIChat();
                if (!genAI) {
                    throw new Error(`API key cho ${type} chưa được cấu hình.`);
                }
                const model = genAI.getGenerativeModel({
                    model: modelId,
                    ...(generationConfig ? { generationConfig } : {})
                });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                return extractResponseText(response);
            } catch (err) {
                lastError = err;
                if (isRateLimitError(err)) {
                    lastRateLimitError = err;
                }
                const msg = String(err?.message || err).toLowerCase();
                const modelMissing =
                    msg.includes('404') ||
                    msg.includes('not found') ||
                    msg.includes('invalid model') ||
                    msg.includes('was not found') ||
                    msg.includes('listmodels');
                if (modelMissing) {
                    break;
                }
                if (isRateLimitError(err) && attempt < RETRIES_ON_429) {
                    const waitMs = parseRetryDelayMs(err);
                    console.warn(
                        `Gemini 429 — chờ tối đa ${MAX_RETRY_WAIT_MS}ms (thực tế ${waitMs}ms), thử lại model=${modelId} lần ${attempt + 2}`
                    );
                    await sleep(waitMs);
                    continue;
                }
                if (isRateLimitError(err)) {
                    break;
                }
                throw err;
            }
        }
    }
    // Nếu trước đó đã từng bị 429 (hết quota), ưu tiên trả lỗi 429
    // thay vì lỗi 404 của model fallback (tránh gây hiểu nhầm cho người dùng).
    throw lastRateLimitError ?? lastError ?? new Error('Không gọi được Gemini.');
}

async function generateContentWithFallbacks(prompt, generationConfig = null, type = 'chat') {
    return Promise.race([
        generateContentWithFallbacksCore(prompt, generationConfig, type),
        new Promise((_, reject) =>
            setTimeout(
                () =>
                    reject(
                        new Error(
                            `GEMINI_TIMEOUT:${TOTAL_TIMEOUT_MS} — đã chờ ${TOTAL_TIMEOUT_MS / 1000}s (đổi GEMINI_TOTAL_TIMEOUT_MS nếu cần)`
                        )
                    ),
                TOTAL_TIMEOUT_MS
            )
        )
    ]);
}

/**
 * Hàm gọi Gemini để chat với khách hàng
 * @param {string} prompt - Nội dung khách hàng hỏi
 * @param {Array} history - Lịch sử trò chuyện (tùy chọn)
 * @returns {Promise<string>} - Câu trả lời từ AI
 */
export const getAIChatResponse = async (prompt, history = [], products = []) => {
    try {
        if (!getGenAIChat()) {
            return {
                ok: false,
                disabled: false,
                code: 'AI_NOT_CONFIGURED',
                message: 'Xin lỗi, tính năng Chat AI chưa được cấu hình. Vui lòng liên hệ Admin.'
            };
        }

        const safePrompt = String(prompt ?? '').trim();
        if (!safePrompt) return 'Bạn vui lòng nhập nội dung cần hỏi nhé.';

        const historyArr = Array.isArray(history) ? history : [];
        // Chỉ lấy phần hội thoại gần nhất để giảm token và tránh vượt quota.
        const trimmedHistory = historyArr
            .filter((m) => m && typeof m.text === 'string' && m.text.trim())
            .slice(-10);

        const historyText = trimmedHistory
            .map((m) => {
                const role = m.role === 'user' ? 'Người dùng' : 'Trợ lý';
                return `- ${role}: ${m.text.trim()}`;
            })
            .join('\n');

        const productArr = Array.isArray(products) ? products : [];
        const trimmedProducts = productArr.slice(0, 8).map((p) => {
            const desc = (p?.description ? String(p.description) : '').trim();
            const snippet = desc.length > 130 ? `${desc.slice(0, 130)}...` : desc;
            const price = p?.price != null && p?.price !== '' ? `${Number(p.price).toLocaleString('vi-VN')}₫` : '';
            const name = p?.name ? String(p.name) : '';
            const category = p?.category ? String(p.category) : '';
            const id = p?.id != null ? String(p.id) : '';
            const link = id ? `/product/${id}` : '';
            const image = p?.image ? String(p.image) : '';
            const sizes = Array.isArray(p?.sizes) ? p.sizes.map((s) => String(s)).join(', ') : '';
            const colors = Array.isArray(p?.colors) ? p.colors.map((c) => String(c)).join(', ') : '';
            return {
                name,
                category,
                price,
                snippet,
                id,
                link,
                image,
                sizes,
                colors
            };
        });

        const productText = trimmedProducts.length
            ? trimmedProducts
                .map((p, idx) => {
                    const parts = [
                        `#${idx + 1} ${p.name}${p.category ? ` (${p.category})` : ''}`,
                        p.price ? `Giá: ${p.price}` : null,
                        p.sizes ? `Size: ${p.sizes}` : null,
                        p.colors ? `Màu: ${p.colors}` : null,
                        p.snippet ? `Gợi ý nội dung: ${p.snippet}` : null,
                        p.link ? `Link: ${p.link}` : null,
                        p.image ? `Ảnh: ${p.image}` : null
                    ].filter(Boolean);
                    return `- ${parts.join(' | ')}`;
                })
                .join('\n')
            : '';

        const systemPrompt =
            `Bạn là trợ lý bán hàng của "Shop Quần Áo Trẻ Em" tại Việt Nam.\n` +
            `NHIỆM VỤ: Trả lời câu hỏi của khách hàng về quần áo cho bé, tư vấn chọn size, cách phối đồ, chính sách bán hàng (nếu có).\n` +
            `YÊU CẦU: Trả lời bằng TIẾNG VIỆT, lịch sự, ngắn gọn (2-6 câu). Tránh lời chào mở đầu lặp lại (ví dụ "Chào ba mẹ").\n` +
            `Nếu khách chỉ chào hỏi xã giao (ví dụ "xin chào", "hello") và CHƯA nêu nhu cầu mua hàng, KHÔNG gợi ý sản phẩm, KHÔNG chèn link/ảnh. Chỉ hỏi 1 câu ngắn để làm rõ nhu cầu.\n` +
            `KHÔNG được lặp lại y hệt câu trả lời trước đó. Nếu câu hỏi mới có thêm điều kiện (độ tuổi/size/màu), bắt buộc cập nhật tư vấn theo điều kiện mới.\n` +
            `Nếu khách nêu tuổi (ví dụ 5 tuổi), ưu tiên sản phẩm có size phù hợp trong danh sách và nói rõ size gợi ý.\n` +
            `Nếu bạn không có thông tin chắc chắn về sản phẩm/chính sách, hãy đề nghị khách cung cấp thêm chi tiết hoặc để lại lời nhắn/hotline của shop.\n` +
            `Nếu có DANH SÁCH SẢN PHẨM bên dưới: chỉ gợi ý từ danh sách đó (không bịa thêm sản phẩm/giá).\n` +
            `Nếu người dùng hỏi theo DANH MỤC (ví dụ: "áo", "váy", "đồ bộ", "quần"...), hãy CỐ GẮNG nêu đúng 2 sản phẩm phù hợp nhất từ danh sách (nếu danh sách có từ 2 sản phẩm trở lên). Nếu chỉ có 1 thì nêu 1 và nói rõ.\n` +
            `Nếu DANH SÁCH SẢN PHẨM bên dưới là RỖNG: KHÔNG được nêu tên/giá bất kỳ sản phẩm nào. Hãy hỏi khách cung cấp thêm (tên sản phẩm/danh mục/độ tuổi/size/màu) để tìm đúng.\n` +
            `KHI NÊU TÊN BẤT KỲ SẢN PHẨM NÀO, hãy kèm Link đúng theo danh sách bên dưới (dạng /product/{id}). Không tạo link khác.\n` +
            `Mỗi sản phẩm được gợi ý cần có đúng 1 dòng "Ảnh: <url_or_path>" ngay sau sản phẩm đó. Chấp nhận cả URL đầy đủ (http/https) hoặc đường dẫn nội bộ bắt đầu bằng /uploads/.\n` +
            `Khi người dùng hỏi theo danh mục, tối đa 2 sản phẩm/2 ảnh. Các trường hợp khác tối đa 3 sản phẩm/3 ảnh.\n` +
            `KHÔNG trả về lời giải thích, chỉ trả về nội dung tư vấn.`; 

        const fullPrompt = [
            systemPrompt,
            historyText ? `\n[LỊCH SỬ HỘI THOẠI]\n${historyText}` : '',
            `\n[DANH SÁCH SẢN PHẨM PHÙ HỢP]\n${productText || '(rỗng)'}`
                ,
            `\n[KHÁCH HỎI] ${safePrompt}\n[TRỢ LÝ]:`
        ].join('');

        const generationConfig = {
            temperature: 0.6,
            maxOutputTokens: 512
        };

        const rawText = await generateContentWithFallbacks(fullPrompt, generationConfig, 'chat');
        let text = String(rawText || '').trim();

        // Hậu xử lý: chỉ ép Link/Ảnh khi TIN NHẮN HIỆN TẠI có ý định mua/tìm sản phẩm rõ ràng
        const currentPrompt = String(safePrompt || '').trim().toLowerCase();
        const isGreetingOnly = /^(xin\s*chào|chào|hello|hi|alo|ê|hey)[!.\s]*$/i.test(currentPrompt);
        const isAmbiguousShort = /^\d+$/.test(currentPrompt) || currentPrompt.length <= 2;
        const hasShoppingIntent = /(mua|tìm|gợi ý|xem|cho em|cho tôi|áo|váy|đầm|quần|size|màu|bé|trẻ em|sản phẩm|giá|bao nhiêu)/i.test(currentPrompt);

        if (trimmedProducts.length > 0 && !isGreetingOnly && !isAmbiguousShort && hasShoppingIntent) {
            const hasLink = /\/product\/\d+/i.test(text);
            const hasImage = /(Ảnh\s*:\s*((https?:\/\/|\/(uploads|images)\/|(?:\.\/)?images\/)\S+))/i.test(text);

            if (!hasLink || !hasImage) {
                const fallbackLines = trimmedProducts.slice(0, 2).map((p, idx) => {
                    const lines = [
                        `${idx + 1}. ${p.name}${p.price ? ` - ${p.price}` : ''}`,
                        p.link ? `Link: ${p.link}` : null,
                        p.image ? `Ảnh: ${p.image}` : null
                    ].filter(Boolean);
                    return lines.join('\n');
                }).join('\n\n');

                text = `${text}\n\n${fallbackLines}`.trim();
            }
        }

        return { ok: true, text };
    } catch (error) {
        console.error('Gemini API Error:', error);
        const msg = String(error?.message || '');
        if (msg.includes('GEMINI_TIMEOUT')) {
            return {
                ok: false,
                disabled: false,
                code: 'GEMINI_TIMEOUT',
                message: 'Phản hồi từ AI quá lâu. Vui lòng thử lại sau vài giây nhé!'
            };
        }
        if (isRateLimitError(error)) {
            const limitZero = /limit:\s*0/i.test(msg) || /free_tier.*limit:\s*0/i.test(msg);
            return {
                ok: false,
                disabled: limitZero,
                code: limitZero ? 'GEMINI_QUOTA_ZERO' : 'GEMINI_RATE_LIMIT',
                message: limitZero
                    ? 'AI tạm ngưng do hết quota Gemini (limit=0). Bạn vui lòng đợi hoặc bật billing/đổi API key ở Google AI Studio.'
                    : 'Hệ thống đang quá tải do giới hạn tần suất Gemini (429). Bạn vui lòng thử lại sau vài phút nhé!'
            };
        }
        return {
            ok: false,
            disabled: false,
            code: 'GEMINI_ERROR',
            message: 'Xin lỗi, tôi đang gặp một chút trục trặc kỹ thuật. Bạn vui lòng thử lại sau giây lát nhé!'
        };
    }
};

/**
 * @typedef {Object} ProductDescriptionContext
 * @property {string} productName
 * @property {string} category
 * @property {string} [price] - Giá hiển thị (text), không bắt buộc
 * @property {string} [keywords] - Từ khóa / điểm nhấn thêm
 * @property {'warm'|'professional'|'playful'|'concise'} [tone]
 * @property {'short'|'medium'|'long'} [length]
 * @property {string} [existingDescription] - Mô tả hiện có để AI chỉnh sửa/mở rộng
 * @property {string} [sizesHint] - Gợi ý size (vd: "2-8 tuổi, size S-XL")
 */

/**
 * Gợi ý mô tả sản phẩm cho Admin (Gemini)
 * @param {ProductDescriptionContext} ctx
 * @returns {Promise<{ ok: true, text: string } | { ok: false, error: string }>}
 */
export const generateProductDescription = async (ctx) => {
    if (!getGenAIDescription()) {
        return { ok: false, error: 'Chưa cấu hình GEMINI_API_KEY_DESCRIPTION trong file .env (Google AI Studio).' };
    }

    try {
        const {
            productName,
            category,
            price,
            keywords,
            tone = 'warm',
            length = 'medium',
            existingDescription,
            sizesHint
        } = ctx || {};

        if (!productName?.trim() || !category?.trim()) {
            return { ok: false, error: 'Thiếu tên hoặc danh mục sản phẩm.' };
        }

        const toneHints = {
            warm: 'Giọng văn thân thiện, ấm áp, gần gũi phụ huynh.',
            professional: 'Giọng văn chuyên nghiệp, rõ ràng, tin cậy.',
            playful: 'Giọng văn vui tươi, nhẹ nhàng phù hợp đồ trẻ em.',
            concise: 'Cực kỳ súc tích, ít từ, đi thẳng vào lợi ích.'
        };

        const lengthHints = {
            short: 'Khoảng 2–3 câu (80–150 từ).',
            medium: 'Khoảng 4–6 câu (150–280 từ), có thể thêm 2–4 gạch đầu dòng ngắn sau đoạn mở đầu.',
            long: 'Khoảng 7–10 câu hoặc tương đương (280–450 từ), gồm đoạn giới thiệu + 3–5 gạch đầu dòng (•) nêu đặc điểm nổi bật.'
        };

        const extra = [
            price ? `Giá tham khảo (nếu cần nhắc khéo léo, không lạm dụng): ${price}` : null,
            keywords?.trim() ? `Từ khóa / điểm nhấn cần lồng ghép: ${keywords.trim()}` : null,
            sizesHint?.trim() ? `Gợi ý size/độ tuổi: ${sizesHint.trim()}` : null,
            existingDescription?.trim()
                ? `Mô tả hiện tại (hãy cải thiện, bổ sung, giữ ý đúng nếu có; không sao chép máy móc):\n"""${existingDescription.trim()}"""`
                : null
        ].filter(Boolean).join('\n');

        const prompt = `Bạn là copywriter cho shop quần áo trẻ em online tại Việt Nam.

NHIỆM VỤ: Viết mô tả sản phẩm bằng TIẾNG VIỆT để đăng trên website thương mại.

THÔNG TIN SẢN PHẨM:
- Tên: ${productName.trim()}
- Danh mục: ${category.trim()}
${extra ? `\nBỔ SUNG:\n${extra}\n` : ''}

YÊU CẦU NỘI DUNG:
- ${toneHints[tone] || toneHints.warm}
- Độ dài: ${lengthHints[length] || lengthHints.medium}
- Luôn viết ĐẦY ĐỦ câu, KHÔNG cắt giữa câu. Trả về phần cuối câu hoàn chỉnh (không dừng sau một emoji hoặc dấu cách).
- KHÔNG dùng markdown/định dạng kiểu **...** / *...* / #... (chỉ dùng chữ thường/bình thường).
- Nhấn mạnh: thoáng mát/thấm hút (nếu phù hợp), an toàn cho da trẻ em, form dễ mặc, dễ phối đồ — chỉ mô tả hợp lý, không tuyên bố y tế hoặc cam kết vượt quá thực tế.
- Có thể dùng emoji nhẹ (1–3 chỗ) nếu phù hợp tone; không lạm dụng.
- SEO: tự nhiên lồng ghép từ khóa liên quan tên & danh mục, không nhồi nhét.
- Chỉ trả về NỘI DUNG mô tả sẵn sàng dán vào ô mô tả (không tiêu đề "Mô tả:", không giải thích quy trình).`;

        const generationConfig = {
            temperature: 0.6,
            // Tăng để tránh bị cắt giữa chừng
            maxOutputTokens: length === 'long' ? 1400 : 1100
        };

        const raw = await generateContentWithFallbacks(prompt, generationConfig, 'description');
        let text = (raw || '').trim();
        if (!text) {
            return { ok: false, error: 'AI không trả về nội dung. Thử lại hoặc đổi từ khóa.' };
        }

        // Hậu xử lý chống mô tả bị cụt giữa câu
        text = text.replace(/[\s\u2026]+$/, '').trim();
        const endsWithPunctuation = /[.!?…”"]$/.test(text);
        if (!endsWithPunctuation) {
            text = `${text}.`;
        }

        return { ok: true, text };
    } catch (err) {
        console.error('Gemini Generation Error:', err);
        return { ok: false, error: formatGeminiError(err) };
    }
};
