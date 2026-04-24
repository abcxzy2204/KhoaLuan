import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'

const ResetPassword = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [email, setEmail] = useState(location.state?.email || '')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [codeVerified, setCodeVerified] = useState(false)

  const handleVerifyCode = async (e) => {
    e.preventDefault()

    if (!email || !code) {
      addToast('Vui lòng nhập email và mã xác thực', 'warning')
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      })
      const result = await res.json()

      if (result.success) {
        setCodeVerified(true)
        addToast('Mã xác thực hợp lệ. Bạn có thể nhập mật khẩu mới.', 'success')
      } else {
        addToast(result.message || 'Mã xác thực không hợp lệ', 'error')
      }
    } catch {
      addToast('Lỗi kết nối máy chủ', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()

    if (!newPassword || !confirmPassword) {
      addToast('Vui lòng nhập đầy đủ mật khẩu mới', 'warning')
      return
    }

    if (newPassword.length < 6) {
      addToast('Mật khẩu mới phải từ 6 ký tự', 'warning')
      return
    }

    if (newPassword !== confirmPassword) {
      addToast('Mật khẩu xác nhận không khớp', 'warning')
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword })
      })
      const result = await res.json()

      if (result.success) {
        addToast('Đặt lại mật khẩu thành công, vui lòng đăng nhập lại.', 'success')
        navigate('/login')
      } else {
        addToast(result.message || 'Không thể đặt lại mật khẩu', 'error')
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
        <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Đặt lại mật khẩu</h1>
        <p className="text-sm text-gray-500 mb-6">
          {!codeVerified
            ? 'Bước 1: Nhập email và mã xác thực để tiếp tục.'
            : 'Bước 2: Nhập mật khẩu mới của bạn.'}
        </p>

        {!codeVerified ? (
          <form className="space-y-5" onSubmit={handleVerifyCode}>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mã xác thực (6 số)</label>
              <input
                type="text"
                inputMode="numeric"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-bold bg-primary-600 hover:bg-primary-700 transition disabled:opacity-50"
            >
              {loading ? 'Đang kiểm tra...' : 'OK'}
            </button>
          </form>
        ) : (
          <form className="space-y-5" onSubmit={handleResetPassword}>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mật khẩu mới</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-bold bg-primary-600 hover:bg-primary-700 transition disabled:opacity-50"
            >
              {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
            </button>
          </form>
        )}

        <p className="text-sm text-gray-500 mt-6">
          <Link to="/forgot-password" className="font-semibold text-primary-600 hover:text-primary-700">Gửi lại mã</Link>
        </p>
      </div>
    </div>
  )
}

export default ResetPassword
