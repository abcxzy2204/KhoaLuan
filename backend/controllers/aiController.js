import { getAIChatResponse, generateProductDescription } from '../utils/aiAssistant.js'
import ProductModel from '../models/ProductModel.js'

const dedupeAiProductMentions = (text) => {
  const raw = String(text || '').trim()
  if (!raw) return raw

  const lines = raw.split('\n')
  const seenLinks = new Set()
  const output = []

  const isProductLine = (line) =>
    /\/product\/\d+/i.test(line) || /^\s*\d+\./.test(line) || /^\s*link\s*:/i.test(line)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const linkMatch = line.match(/\/product\/(\d+)/i)

    if (linkMatch) {
      const key = linkMatch[1]
      if (seenLinks.has(key)) {
        // Bỏ dòng trùng link và cả tiêu đề sản phẩm ngay trước nó (nếu có)
        if (output.length > 0 && isProductLine(output[output.length - 1])) {
          output.pop()
        }
        continue
      }
      seenLinks.add(key)
      output.push(line)
      continue
    }

    // Loại dòng rác lặp kiểu "Sản phẩm" đứng riêng lẻ
    if (/^\s*Sản phẩm\s*$/i.test(line)) {
      const prev = output[output.length - 1] || ''
      if (/^\s*Sản phẩm\s*$/i.test(prev)) continue
    }

    output.push(line)
  }

  return output.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

/**
 * @route   POST /api/ai/chat
 * @desc    Chat với AI assistant
 * @access  Public
 */
export const chatWithAI = async (req, res, next) => {
  try {
    const { message, history, products } = req.body

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      })
    }

    const userText = String(message || '').trim().toLowerCase()

    // Nhận diện số lượng khách yêu cầu (vd: "2 sản phẩm")
    const countMatch = userText.match(/(\d+)\s*(sản phẩm|mẫu|item)/i)
    const requestedCount = countMatch ? Math.max(1, Math.min(3, parseInt(countMatch[1], 10))) : null

    // Nhận diện ý định danh mục phổ biến (ưu tiên cụm cụ thể trước)
    const categoryHints = [
      { key: 'đồ bộ', aliases: ['đồ bộ', 'bộ quần áo', 'set đồ', 'set bộ', 'bộ'] },
      { key: 'váy', aliases: ['váy', 'đầm'] },
      { key: 'áo', aliases: ['áo', 'thun', 'sơ mi'] },
      { key: 'quần', aliases: ['quần', 'short'] }
    ]
    const inferredCategory = categoryHints.find((c) => c.aliases.some((a) => userText.includes(a))) || null

    // Ưu tiên danh sách sản phẩm người dùng gửi lên; nếu thiếu thì tự lấy từ DB
    // để AI có ngữ cảnh tư vấn tốt hơn (đặc biệt theo màu sắc)
    const normalizedProducts = Array.isArray(products) && products.length
      ? products
      : await ProductModel.findAll({ limit: 200 })

    // Nhận diện màu cơ bản trong câu hỏi
    const colorKeywords = [
      'đỏ', 'xanh', 'xanh dương', 'xanh lá', 'hồng', 'vàng', 'đen', 'trắng',
      'cam', 'tím', 'nâu', 'xám', 'be', 'kem', 'pastel'
    ]
    const matchedColors = colorKeywords.filter((c) => userText.includes(c))

    // Nhận diện ngữ cảnh thời tiết/mùa lạnh
    const winterIntent = /(đông|mùa đông|lạnh|rét|giữ ấm|ấm áp|trời lạnh)/i.test(userText)
    const winterKeywords = ['áo khoác', 'khoác', 'áo len', 'len', 'pijama', 'dài tay', 'nỉ']

    // Nếu người dùng có nhắc danh mục thì lọc theo danh mục trước
    // Lọc cứng cho các cụm cụ thể (vd: áo sơ mi) để tránh gợi ý sai loại
    const specificTypeHints = [
      { key: 'áo sơ mi', aliases: ['áo sơ mi', 'sơ mi'] },
      { key: 'áo polo', aliases: ['áo polo', 'polo'] },
      { key: 'áo thun', aliases: ['áo thun', 'thun'] },
      { key: 'quần short', aliases: ['quần short', 'short'] },
      { key: 'legging', aliases: ['legging'] },
      { key: 'váy xòe', aliases: ['váy xòe', 'đầm xòe'] }
    ]
    const inferredSpecificType = specificTypeHints.find((s) => s.aliases.some((a) => userText.includes(a))) || null

    let categoryFilteredProducts = normalizedProducts
    if (inferredSpecificType) {
      const strictSpecific = normalizedProducts.filter((p) => {
        const category = String(p?.category || '').toLowerCase()
        const name = String(p?.name || '').toLowerCase()
        return inferredSpecificType.aliases.some((kw) => category.includes(kw) || name.includes(kw))
      })
      if (strictSpecific.length > 0) {
        categoryFilteredProducts = strictSpecific
      }
    }

    if (inferredCategory) {
      const strictKeywords = inferredCategory.key === 'đồ bộ'
        ? ['đồ bộ', 'bộ quần áo', 'set đồ', 'set bộ', 'set', 'bộ']
        : inferredCategory.aliases

      const strictMatched = categoryFilteredProducts.filter((p) => {
        const category = String(p?.category || '').toLowerCase()
        const name = String(p?.name || '').toLowerCase()
        return strictKeywords.some((kw) => category.includes(kw) || name.includes(kw))
      })

      // fallback mềm nếu lọc cứng không ra dữ liệu
      categoryFilteredProducts = strictMatched.length > 0
        ? strictMatched
        : categoryFilteredProducts.filter((p) => {
            const category = String(p?.category || '').toLowerCase()
            const name = String(p?.name || '').toLowerCase()
            return inferredCategory.aliases.some((a) => category.includes(a) || name.includes(a))
          })
    }

    // Nếu có ngữ cảnh mùa đông/lạnh: ưu tiên item giữ ấm (áo khoác, áo len...)
    const winterFilteredProducts = winterIntent
      ? (() => {
          const strict = categoryFilteredProducts.filter((p) => {
            const name = String(p?.name || '').toLowerCase()
            const category = String(p?.category || '').toLowerCase()
            const desc = String(p?.description || '').toLowerCase()
            const text = `${name} ${category} ${desc}`
            return winterKeywords.some((kw) => text.includes(kw))
          })
          return strict.length > 0 ? strict : categoryFilteredProducts
        })()
      : categoryFilteredProducts

    // Nếu người dùng có nhắc màu thì lọc sản phẩm có màu tương ứng trước
    const colorFilteredProducts = matchedColors.length
      ? winterFilteredProducts.filter((p) => {
          const colors = Array.isArray(p?.colors)
            ? p.colors.map((c) => String(c).toLowerCase())
            : []
          return matchedColors.some((kw) => colors.some((c) => c.includes(kw) || kw.includes(c)))
        })
      : winterFilteredProducts

    // Lọc thêm theo từ khóa tên/danh mục để tăng độ liên quan
    const tokens = userText
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2)

    // Nhận diện ý định theo giá
    const wantsExpensive = /đắt\s*nhất|cao\s*nhất|giá\s*cao|max|đắt/i.test(userText)
    const wantsCheapest = /rẻ\s*nhất|thấp\s*nhất|giá\s*rẻ|min|tiết\s*kiệm/i.test(userText)

    // Map tuổi -> size gợi ý (rule cứng)
    const ageMatch = userText.match(/(\d{1,2})\s*tuổi/i)
    const age = ageMatch ? Number(ageMatch[1]) : null
    const inferSizeByAge = (n) => {
      if (!Number.isFinite(n)) return null
      if (n <= 1) return '0-1T'
      if (n <= 2) return '1-2T'
      if (n <= 4) return '3-4T'
      if (n <= 6) return '5-6T'
      if (n <= 8) return '7-8T'
      if (n <= 10) return '9-10T'
      return '11-12T'
    }
    const targetSize = inferSizeByAge(age)

    const scored = colorFilteredProducts
      .map((p) => {
        const name = String(p?.name || '').toLowerCase()
        const category = String(p?.category || '').toLowerCase()
        const desc = String(p?.description || '').toLowerCase()
        const colors = Array.isArray(p?.colors)
          ? p.colors.map((c) => String(c).toLowerCase()).join(' ')
          : ''
        const priceNum = Number(p?.price || 0)

        let score = 0
        for (const t of tokens) {
          if (name.includes(t)) score += 3
          if (category.includes(t)) score += 2
          if (colors.includes(t)) score += 2
          if (desc.includes(t)) score += 1
        }
        if (matchedColors.length > 0 && colors) score += 2

        if (targetSize) {
          const sizesRaw = p?.sizes
          const sizeTexts = []
          if (Array.isArray(sizesRaw)) {
            for (const s of sizesRaw) {
              if (typeof s === 'string') sizeTexts.push(s.toLowerCase())
              else if (s?.size) sizeTexts.push(String(s.size).toLowerCase())
            }
          }
          if (sizeTexts.some((s) => s.includes(targetSize.toLowerCase()))) {
            score += 6
          }
        }

        return { p, score, priceNum }
      })
      .sort((a, b) => {
        if (wantsExpensive) {
          if (b.priceNum !== a.priceNum) return b.priceNum - a.priceNum
          return b.score - a.score
        }
        if (wantsCheapest) {
          if (a.priceNum !== b.priceNum) return a.priceNum - b.priceNum
          return b.score - a.score
        }
        return b.score - a.score
      })

    const candidateCount = requestedCount || (inferredCategory ? 2 : 12)
    const topProducts = scored.slice(0, candidateCount).map((x) => x.p)

    const sizeHint = targetSize ? `\n\n[HỆ THỐNG] Người dùng ${age} tuổi. Ưu tiên tư vấn size ${targetSize} nếu sản phẩm có hỗ trợ.` : ''

    const messageForAI = inferredCategory && requestedCount
      ? `${message}\n\n[HỆ THỐNG] Người dùng muốn đúng ${requestedCount} sản phẩm thuộc danh mục ${inferredCategory.key}. Nếu danh sách đủ thì nêu đúng số lượng này.${sizeHint}`
      : inferredCategory
        ? `${message}\n\n[HỆ THỐNG] Người dùng đang hỏi theo danh mục ${inferredCategory.key}. Nếu danh sách đủ, hãy nêu 2 sản phẩm phù hợp nhất.${sizeHint}`
        : `${message}${sizeHint}`

    const result = await getAIChatResponse(messageForAI, history || [], topProducts)

    if (!result.ok) {
      const statusCode = result.code === 'GEMINI_TIMEOUT' ? 504 : 400
      return res.status(statusCode).json({
        success: false,
        disabled: !!result.disabled,
        code: result.code || 'AI_ERROR',
        message: result.message || 'AI service unavailable'
      })
    }

    const cleanedText = dedupeAiProductMentions(result.text)

    res.status(200).json({
      success: true,
      data: {
        text: cleanedText,
        ok: true,
        productCount: topProducts.length,
        matchedColors
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    })
  }
}

/**
 * @route   POST /api/ai/suggest-description
 * @desc    Gợi ý mô tả sản phẩm từ AI
 * @access  Private/Admin
 */
export const suggestDescription = async (req, res, next) => {
  try {
    const body = req.body || {}
    const normalizedProductData = {
      ...body,
      name: body.name || body.productName || '',
      category: body.category || ''
    }

    if (!normalizedProductData.name || !normalizedProductData.category) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu tên hoặc danh mục sản phẩm.'
      })
    }

    const result = await generateProductDescription(normalizedProductData)
    
    if (!result.ok) {
      return res.status(400).json({
        success: false,
        message: result.error || 'AI description generation failed'
      })
    }

    res.status(200).json({
      success: true,
      data: result.text
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    })
  }
}

