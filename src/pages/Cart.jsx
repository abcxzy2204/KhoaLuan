import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

const Cart = () => {
  const navigate = useNavigate()
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
  } = useCart()
  const { isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 350)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 rounded-3xl border border-primary-100 bg-gradient-to-r from-white to-primary-50/40 p-6 md:p-8 shadow-sm animate-pulse">
          <div className="h-8 w-56 bg-gray-100 rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                    <div className="h-8 bg-gray-100 rounded w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6 animate-pulse h-64" />
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-xl mx-auto rounded-3xl border border-gray-100 bg-white p-10 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)]">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-3xl font-extrabold mb-3 text-gray-800">Giỏ hàng trống</h2>
          <p className="text-gray-500 mb-8">Hãy thêm sản phẩm vào giỏ để bắt đầu mua sắm nhé.</p>
          <Link
            to="/products"
            className="bg-primary-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary-700 transition inline-block"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    )
  }

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    navigate('/checkout')
  }


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 rounded-3xl border border-primary-100 bg-gradient-to-r from-white to-primary-50/40 p-6 md:p-8 shadow-sm">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800">Giỏ Hàng</h1>
        <p className="text-sm md:text-base text-gray-500 mt-2">Kiểm tra lại sản phẩm trước khi thanh toán.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.cartItemId || `${item.id}-${item.selectedSize || ''}-${item.selectedColor || ''}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-[0_14px_32px_-24px_rgba(0,0,0,0.45)] p-4 md:p-5 flex flex-col md:flex-row gap-4"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 object-cover rounded-xl border border-gray-100 mx-auto md:mx-0"
                />
                <div className="flex-grow">
                  <h3 className="text-lg md:text-xl font-bold mb-1 text-gray-800">{item.name}</h3>
                  <div className="flex flex-wrap gap-2 mb-2 text-gray-500 text-sm">
                    {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                    {item.selectedSize && item.selectedColor && <span>|</span>}
                    {item.selectedColor && <span>Màu: {item.selectedColor}</span>}
                  </div>
                  <p className="text-primary-600 font-extrabold mb-3">
                    {item.price.toLocaleString('vi-VN')}₫
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.cartItemId || `${item.id}-${item.selectedSize || ''}-${item.selectedColor || ''}`, item.quantity - 1)}
                        className="px-3 py-1.5 hover:bg-gray-50"
                      >
                        -
                      </button>
                      <span className="px-4 text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.cartItemId || `${item.id}-${item.selectedSize || ''}-${item.selectedColor || ''}`, item.quantity + 1)}
                        className="px-3 py-1.5 hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.cartItemId || `${item.id}-${item.selectedSize || ''}-${item.selectedColor || ''}`)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-lg md:text-xl font-extrabold text-primary-600">
                    {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={clearCart}
            className="mt-4 text-red-600 hover:text-red-800 text-sm font-semibold"
          >
            Xóa tất cả
          </button>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)] p-5 md:p-6 lg:sticky lg:top-24">
            <h2 className="text-2xl font-extrabold mb-4 text-gray-800">Tổng Kết</h2>
            <div className="space-y-3 mb-5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính:</span>
                <span>{getTotalPrice().toLocaleString('vi-VN')}₫</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển:</span>
                <span>30,000₫</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-xl font-extrabold text-gray-800">
                <span>Tổng cộng:</span>
                <span className="text-primary-600">
                  {(getTotalPrice() + 30000).toLocaleString('vi-VN')}₫
                </span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-primary-600 text-white py-3.5 rounded-xl font-bold hover:bg-primary-700 transition mb-3"
            >
              Thanh Toán
            </button>
            <Link
              to="/products"
              className="block text-center text-primary-600 hover:text-primary-700 font-medium"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
