import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { addToast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return

    try {
      setLoading(true)
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const result = await res.json()
      if (result.success) {
        setSent(true)
        addToast('Mã xác thực đã được gửi về email (nếu email tồn tại).', 'success')
      } else {
        addToast(result.message || 'Không thể gửi mã xác thực', 'error')
      }
    } catch {
      addToast('Lỗi kết nối máy chủ', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(900px_360px_at_10%_0%,rgba(91,202,232,0.14),transparent_55%),radial-gradient(900px_360px_at_90%_0%,rgba(242,114,168,0.12),transparent_55%),#f8fafc] py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-xl rounded-3xl border border-white/70 bg-white/90 backdrop-blur shadow-[0_30px_70px_-35px_rgba(0,0,0,0.45)] p-6 sm:p-8 md:p-10">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Quên mật khẩu</h1>
        <p className="text-sm text-gray-500 mb-6">Nhập email để nhận mã xác thực đặt lại mật khẩu.</p>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-white font-bold bg-primary-600 hover:bg-primary-700 transition disabled:opacity-50"
          >
            {loading ? 'Đang gửi mã...' : 'Gửi mã xác thực'}
          </button>
        </form>

        {sent && (
          <button
            type="button"
            onClick={() => navigate('/reset-password', { state: { email } })}
            className="w-full mt-4 py-3 rounded-xl border border-primary-300 text-primary-700 font-semibold hover:bg-primary-50 transition"
          >
            Tôi đã có mã, đặt lại mật khẩu
          </button>
        )}

        <p className="text-sm text-gray-500 mt-6">
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">Quay lại đăng nhập</Link>
        </p>
      </div>
    </div>
  )
}

export default ForgotPassword
