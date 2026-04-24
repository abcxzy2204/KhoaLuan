import { useEffect, useState } from 'react'
import UserLayout from '../layouts/UserLayout'
import { Link } from 'react-router-dom'
import { useToast } from '../context/ToastContext'

const statusLabels = {
  pending: 'Chờ xử lý',
  processing: 'Đang xử lý',
  shipped: 'Đã giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
}

const paymentStatusLabels = {
  unpaid: 'Chưa thanh toán',
  pending: 'Chờ duyệt thanh toán',
  paid: 'Đã thanh toán',
  failed: 'Thanh toán thất bại',
  refunded: 'Đã hoàn tiền'
}

const getOrderStatusClass = (status) => {
  const s = String(status || '').toLowerCase()
  if (s === 'completed') return 'bg-green-100 text-green-700'
  if (s === 'processing' || s === 'shipped') return 'bg-blue-100 text-blue-700'
  if (s === 'cancelled') return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-700'
}

const getPaymentStatusClass = (status) => {
  const s = String(status || 'unpaid').toLowerCase()
  if (s === 'paid') return 'bg-green-100 text-green-700'
  if (s === 'pending') return 'bg-yellow-100 text-yellow-700'
  if (s === 'failed') return 'bg-red-100 text-red-700'
  if (s === 'refunded') return 'bg-purple-100 text-purple-700'
  return 'bg-gray-100 text-gray-700'
}

const UserOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()
  const [updatingId, setUpdatingId] = useState(null)
  const [activeTab, setActiveTab] = useState('all')

  const tabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'pending', label: 'Chờ xử lý' },
    { id: 'processing', label: 'Đang xử lý' },
    { id: 'shipped', label: 'Đã giao' },
    { id: 'cancelled', label: 'Đã hủy' },
  ]

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch('/api/orders/my', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const result = await res.json()
        if (result.success) {
          setOrders(result.data || [])
        } else {
          addToast(result.message || 'Lỗi khi tải danh sách đơn hàng', 'error')
        }
      } catch {
        setOrders([])
      } finally {
        setLoading(false)
      }
    }
    loadOrders()
  }, [addToast])

  const handleCancel = async (id) => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) return
    try {
      setUpdatingId(id)
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/orders/${id}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      const result = await res.json()
      if (result.success) {
        addToast('Đã hủy đơn hàng thành công', 'success')
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: 'cancelled' } : o))
        )
      } else {
        addToast(result.message || 'Hủy đơn hàng thất bại', 'error')
      }
    } catch {
      addToast('Có lỗi xảy ra. Vui lòng thử lại.', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'all') return true
    return order.status === activeTab
  })

  if (loading) {
    return (
      <UserLayout>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)] p-8 flex items-center justify-center min-h-[400px]">
          <p className="text-gray-500">Đang tải đơn hàng...</p>
        </div>
      </UserLayout>
    )
  }

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-primary-100 bg-gradient-to-r from-white to-primary-50/40 p-6 md:p-8 shadow-sm">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800">Đơn hàng của tôi</h1>
          <p className="text-sm md:text-base text-gray-500 mt-2">Theo dõi trạng thái đơn và thanh toán nhanh chóng.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)] p-5 md:p-6 border border-gray-100 min-h-[500px]">
          <div className="flex flex-wrap gap-2 md:gap-3 mb-6 pb-4 border-b border-gray-100">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors border ${activeTab === tab.id
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-14">
              <div className="text-5xl mb-4">🛒</div>
              <p className="text-gray-500 text-lg">Chưa có đơn hàng nào.</p>
              <Link to="/products" className="inline-block mt-4 px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-semibold">
                Tiếp tục mua sắm
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredOrders.map((order) => {
                const canCancel = order.status === 'pending' || order.status === 'processing'

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-[0_14px_32px_-24px_rgba(0,0,0,0.45)]"
                  >
                    <div className="px-4 md:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center items-start bg-gray-50/60 gap-3">
                      <div>
                        <h3 className="font-extrabold text-gray-800 text-lg">Đơn hàng #{order.id}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                            day: '2-digit', month: '2-digit', year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="text-right space-y-1.5">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${getOrderStatusClass(order.status)}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                        <div>
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${getPaymentStatusClass(order.paymentStatus)}`}>
                            {paymentStatusLabels[String(order.paymentStatus || 'unpaid').toLowerCase()] || String(order.paymentStatus || 'unpaid')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 md:px-6 py-4 space-y-3">
                      {order.items && order.items.map((item, idx) => (
                        <div key={idx} className="flex gap-4 p-2 items-center rounded-xl hover:bg-gray-50 transition-colors">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                            {item.productImage ? (
                              <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">🛍️</div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 text-sm md:text-base">{item.productName}</h4>
                            <p className="text-gray-500 text-sm mt-1">
                              Số lượng: {item.quantity} x {Number(item.price).toLocaleString('vi-VN')} ₫
                            </p>
                            {(item.selectedSize || item.selectedColor) && (
                              <p className="text-gray-400 text-xs mt-1">
                                Phân loại: {item.selectedColor} {item.selectedSize ? `- ${item.selectedSize}` : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="px-5 md:px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="font-extrabold text-lg text-gray-800">
                        Tổng: <span className="text-primary-600">{Number(order.totalAmount).toLocaleString('vi-VN')} ₫</span>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Link
                          to={`/orders/${order.id}`}
                          className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-semibold text-sm text-center border border-primary-200 text-primary-700 hover:bg-primary-50 transition-colors"
                        >
                          Chi tiết
                        </Link>

                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => handleCancel(order.id)}
                            disabled={updatingId === order.id}
                            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-semibold text-sm text-center bg-red-500 text-white hover:bg-red-600 border border-red-500 transition-colors disabled:opacity-50"
                          >
                            {updatingId === order.id ? 'Đang hủy...' : 'Hủy đơn'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  )
}

export default UserOrders
