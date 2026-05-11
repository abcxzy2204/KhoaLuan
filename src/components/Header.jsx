import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

const Header = () => {
  const { getTotalItems } = useCart()
  const { user, logout, isAuthenticated } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const navItemClass = (path) =>
    `px-4 py-2 rounded-xl text-sm font-semibold transition ${
      isActive(path)
        ? 'bg-primary-600 text-white shadow-sm'
        : 'text-gray-600 hover:text-primary-700 hover:bg-primary-50'
    }`

  const handleSearch = () => {
    const query = searchTerm.trim()
    navigate(`/products${query ? `?q=${encodeURIComponent(query)}` : ''}`)
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <span className="text-xl md:text-2xl font-extrabold tracking-tight">
              <span className="text-[#5bcae8]">Ricky</span>{' '}
              <span className="text-[#f272a8]">Baby</span>
            </span>
          </Link>

          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <input
              type="text"
              placeholder="Tìm sản phẩm cho bé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full px-4 py-2.5 rounded-l-xl border border-gray-200 border-r-0 focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
            <button onClick={handleSearch} className="px-5 rounded-r-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition">
              Tìm
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {isAuthenticated ? (
              <>
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="hidden sm:inline-flex text-xs bg-purple-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-purple-700 transition font-bold"
                  >
                    Quản trị
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="text-sm font-semibold text-gray-700 hover:text-primary-600 hidden sm:inline"
                >
                  {user?.name}
                </Link>
                <button
                  onClick={logout}
                  className="text-xs md:text-sm text-gray-500 hover:text-gray-700"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <Link to="/login" className="text-sm font-semibold text-gray-600 hover:text-primary-700">
                Đăng nhập
              </Link>
            )}

            <Link
              to="/cart"
              className="relative inline-flex items-center gap-2 border border-primary-200 rounded-xl px-3 py-1.5 hover:bg-primary-50 transition"
            >
              <span className="hidden sm:inline text-sm font-semibold text-primary-700">Giỏ hàng</span>
              <span className="text-primary-700">🛒</span>
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </Link>
          </div>
        </div>

        <div className="md:hidden mt-3 flex gap-2">
          <input
            type="text"
            placeholder="Tìm sản phẩm cho bé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
          <button onClick={handleSearch} className="px-4 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition">
            Tìm
          </button>
        </div>

        <nav className="mt-3 flex flex-nowrap md:flex-wrap justify-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <Link to="/" className={`${navItemClass('/')} whitespace-nowrap shrink-0`}>Trang chủ</Link>
          <Link to="/products" className={`${navItemClass('/products')} whitespace-nowrap shrink-0`}>Sản phẩm</Link>
          <Link to="/about" className={`${navItemClass('/about')} whitespace-nowrap shrink-0`}>Giới thiệu</Link>
          <Link to="/contact" className={`${navItemClass('/contact')} whitespace-nowrap shrink-0`}>Liên hệ</Link>
        </nav>
      </div>
    </header>
  )
}

export default Header
