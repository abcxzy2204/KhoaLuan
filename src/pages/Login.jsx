import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email || !password) {
      setError('Vui lòng điền đầy đủ thông tin')
      setLoading(false)
      return
    }

    const result = await login(email, password)

    if (result.success) {
      addToast('Đăng nhập thành công!', 'success')
      if (result.user?.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/')
      }
    } else {
      setError(result.message || 'Đăng nhập thất bại')
      addToast(result.message || 'Đăng nhập thất bại', 'error')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(900px_360px_at_10%_0%,rgba(91,202,232,0.14),transparent_55%),radial-gradient(900px_360px_at_90%_0%,rgba(242,114,168,0.12),transparent_55%),#f8fafc] py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 overflow-hidden rounded-3xl border border-white/70 bg-white/90 backdrop-blur shadow-[0_30px_70px_-35px_rgba(0,0,0,0.45)]">
        <div className="hidden lg:flex flex-col justify-center p-10 bg-gradient-to-br from-primary-50 via-white to-pink-50 border-r border-gray-100">
          <h1 className="text-4xl font-extrabold leading-tight text-gray-800 mb-4">
            Chào mừng trở lại
            <span className="block text-primary-600">Ricky Baby</span>
          </h1>
          <p className="text-gray-600 text-base leading-relaxed mb-6">
            Đăng nhập để theo dõi đơn hàng, lưu sản phẩm yêu thích và nhận ưu đãi dành riêng cho bạn.
          </p>
          <div className="space-y-3 text-sm text-gray-600">
            <p className="flex items-center gap-2"><span className="text-primary-600">✓</span> Theo dõi trạng thái đơn hàng nhanh chóng</p>
            <p className="flex items-center gap-2"><span className="text-primary-600">✓</span> Lưu lịch sử mua sắm của bé</p>
            <p className="flex items-center gap-2"><span className="text-primary-600">✓</span> Nhận thông báo ưu đãi mới nhất</p>
          </div>
        </div>

        <div className="p-6 sm:p-8 md:p-10">
          <div className="mb-6">
            <h2 className="text-3xl font-extrabold text-gray-800">Đăng nhập</h2>
            <p className="mt-2 text-sm text-gray-500">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
                Đăng ký ngay
              </Link>
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Mật khẩu
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-bold bg-primary-600 hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_16px_30px_-18px_rgba(91,202,232,0.85)]"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>

            <div className="text-sm text-gray-500">
              <Link to="/forgot-password" className="font-semibold text-primary-600 hover:text-primary-700">
                Quên mật khẩu?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
