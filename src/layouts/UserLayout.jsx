import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const UserLayout = ({ children }) => {
  const { user } = useAuth()

  const navItems = [
    { name: 'Tài khoản', path: '/profile', icon: '👤' },
    { name: 'Đơn hàng', path: '/orders', icon: '🛍️' },
    { name: 'Đổi mật khẩu', path: '/change-password', icon: '🔒' },
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Breadcrumb pseudo */}
      <div className="text-gray-500 mb-6 text-sm">
        Trang chủ <span className="mx-2">&gt;</span> <span className="text-gray-900 font-medium">Trang cá nhân</span>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 text-center border border-gray-100">
            <div className="w-20 h-20 bg-[#8b7355] text-white rounded-full mx-auto flex items-center justify-center text-2xl font-bold mb-3 overflow-hidden shadow">
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.name || 'User Avatar'} className="w-full h-full object-cover" />
              ) : (
                (user?.name || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <p className="text-gray-500 text-sm">Xin chào</p>
            <h3 className="font-bold text-lg text-gray-800">{user?.name}</h3>
          </div>

          <nav className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
            {navItems.map((item, index) => (
              <NavLink
                key={index}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-4 text-sm font-medium transition-colors ${
                    isActive && item.path !== '#' && !item.path.startsWith('#')
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}

export default UserLayout
