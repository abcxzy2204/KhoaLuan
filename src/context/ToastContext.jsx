import React, { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext()

export const useToast = () => {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([])

    const addToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Math.random().toString(36).substr(2, 9)
        setToasts(prev => [...prev, { id, message, type }])

        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id))
        }, duration)
    }, [])

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed top-20 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                {toasts.map(toast => (
                    <ToastItem 
                        key={toast.id} 
                        {...toast} 
                        onClose={() => removeToast(toast.id)} 
                    />
                ))}
            </div>
        </ToastContext.Provider>
    )
}

const ToastItem = ({ message, type, onClose }) => {
    const getStyles = () => {
        switch (type) {
            case 'success':
                return {
                    bg: 'bg-white',
                    border: 'border-green-500',
                    icon: 'text-green-500',
                    progress: 'bg-green-500',
                    symbol: '✅'
                }
            case 'error':
                return {
                    bg: 'bg-white',
                    border: 'border-red-500',
                    icon: 'text-red-500',
                    progress: 'bg-red-500',
                    symbol: '❌'
                }
            case 'warning':
                return {
                    bg: 'bg-white',
                    border: 'border-yellow-500',
                    icon: 'text-yellow-500',
                    progress: 'bg-yellow-500',
                    symbol: '⚠️'
                }
            default:
                return {
                    bg: 'bg-white',
                    border: 'border-blue-500',
                    icon: 'text-blue-500',
                    progress: 'bg-blue-500',
                    symbol: 'ℹ️'
                }
        }
    }

    const { bg, border, icon, progress, symbol } = getStyles()

    return (
        <div className={`pointer-events-auto min-w-[300px] max-w-[400px] ${bg} border-l-4 ${border} shadow-2xl rounded-lg overflow-hidden animate-slide-in-right relative group`}>
            <div className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="text-xl">{symbol}</span>
                    <p className="text-sm font-semibold text-gray-800">{message}</p>
                </div>
                <button 
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gray-100">
                <div className={`h-full ${progress} animate-toast-progress`} />
            </div>
        </div>
    )
}
