import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const AIChatbot = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'ai', text: 'Chào bạn! Tôi là trợ lý ảo của Shop Quần Áo Trẻ Em. Tôi có thể giúp gì cho bạn?' }
    ]);
    const [isAIEnabled, setIsAIEnabled] = useState(() => {
        try {
            return localStorage.getItem('aiChatDisabled') !== '1';
        } catch {
            return true;
        }
    });
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const { addToast } = useToast();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const renderTextWithLinks = (text) => {
        const raw = String(text ?? '');
        // Tìm link dạng /product/<id> do AI trả về (relative path để không phụ thuộc host)
        const regex = /(\/product\/\d+)/g;
        const parts = raw.split(regex);
        return parts.map((part, i) => {
            if (/^\/product\/\d+$/.test(part)) {
                return (
                    <a
                        key={`${i}-${part}`}
                        href={part}
                        className="text-primary-600 hover:text-primary-700 underline break-all"
                        onClick={(e) => {
                            e.preventDefault();
                            navigate(part);
                        }}
                    >
                        {part}
                    </a>
                );
            }
            return <span key={i}>{part}</span>;
        });
    };

    const renderMessageContent = (text) => {
        const raw = String(text ?? '');
        const lines = raw.split('\n');
        return lines.map((line, idx) => {
            const mdImg = line.match(/!\[[^\]]*\]\(((https?:\/\/|\/(uploads|images)\/|(?:\.\/)?images\/)[^)]+)\)/i);
            const aiImg = mdImg
                ? null
                : line.match(/(Ảnh|Image)\s*:\s*((https?:\/\/|\/(uploads|images)\/|(?:\.\/)?images\/)\S+)/i);

            const bareImg = !mdImg && !aiImg
                ? line.match(/((https?:\/\/|\/(uploads|images)\/|(?:\.\/)?images\/)\S+\.(png|jpe?g|webp|gif)(\?\S*)?)/i)
                : null;

            const imgUrl = mdImg?.[1] || aiImg?.[2] || bareImg?.[1] || null;

            if (imgUrl) {
                return (
                    <span key={idx}>
                        <img
                            src={String(imgUrl)}
                            alt="Sản phẩm"
                            className="mt-2 mb-2 w-full max-h-56 object-cover rounded border border-gray-100"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                        {idx < lines.length - 1 && <br />}
                    </span>
                );
            }

            return (
                <span key={idx}>
                    {renderTextWithLinks(line)}
                    {idx < lines.length - 1 && <br />}
                </span>
            );
        });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!isAIEnabled) return;
        if (!inputValue.trim() || isLoading) return;

        const userMessage = inputValue.trim();
        const nextMessages = [...messages, { role: 'user', text: userMessage }];
        setMessages(nextMessages);
        setInputValue('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: userMessage,
                    // Gửi kèm lịch sử để AI trả lời đúng ngữ cảnh
                    history: nextMessages.slice(0, -1).slice(-10)
                })
            });

            const data = await res.json();
            if (data.success) {
                const aiText =
                    typeof data?.data === 'string'
                        ? data.data
                        : (data?.data?.text || data?.message || 'AI chưa có phản hồi phù hợp.');
                setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
            } else {
                if (data.disabled) {
                    setIsAIEnabled(false);
                    try {
                        localStorage.setItem('aiChatDisabled', '1');
                    } catch {}
                    const text = data.message || 'AI tạm ngưng do hết quota. Vui lòng thử lại sau.';
                    setMessages(prev => [...prev, { role: 'ai', text }]);
                } else {
                    addToast(data.message || 'Lỗi kết nối với AI', 'error');
                }
            }
        } catch (error) {
            console.error('Chat Error:', error);
            addToast('Đã xảy ra lỗi khi gửi tin nhắn.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Nút toggle Chatbot */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
                    isOpen ? 'bg-gray-200 text-gray-700 rotate-90' : 'bg-primary-600 text-white'
                }`}
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <div className="relative">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                        </span>
                    </div>
                )}
            </button>

            {/* Cửa sổ Chat */}
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-[350px] md:w-[400px] h-[500px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 animate-in fade-in zoom-in slide-in-from-bottom-10 duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4 text-white flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            🤖
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Trợ lý ảo thông minh</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                <span className="text-[10px] text-white/80">Đang trực tuyến</span>
                            </div>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                                    msg.role === 'user' 
                                        ? 'bg-primary-600 text-white rounded-tr-none' 
                                        : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                                }`}>
                                    {renderMessageContent(msg.text)}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-100"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-200"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Hỏi AI về sản phẩm..."
                                disabled={!isAIEnabled || isLoading}
                                className="w-full bg-gray-100 rounded-full pl-4 pr-10 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none border-none transition-all"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={!isAIEnabled || isLoading || !inputValue.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-600 hover:text-primary-700 disabled:text-gray-300 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                </svg>
                            </button>
                        </div>
                        {!isAIEnabled && (
                            <p className="text-[10px] text-red-500 text-center mt-2">
                                AI đang tạm ngưng do hết quota. Vui lòng thử lại sau.
                            </p>
                        )}
                        <p className="text-[10px] text-gray-400 text-center mt-2">
                            AI có thể nhầm lẫn. Hãy liên hệ hotline nếu cần hỗ trợ gấp.
                        </p>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AIChatbot;
