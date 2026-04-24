import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import UserLayout from '../layouts/UserLayout'

const statusLabels = {
  pending: 'Chờ xử lý',
  processing: 'Đang xử lý',
  shipped: 'Đã giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
}

const paymentMethodLabels = {
  cod: 'Thanh toán khi nhận hàng (COD)',
  online: 'Thanh toán trực tuyến',
}

const paymentStatusLabels = {
  unpaid: 'Chưa thanh toán',
  pending: 'Chờ duyệt thanh toán',
  paid: 'Đã thanh toán',
  failed: 'Thanh toán thất bại',
  refunded: 'Đã hoàn tiền'
}

const OrderDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`/api/orders/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        const result = await res.json()
        if (result.success) {
          setOrder(result.data)
        } else {
          setError(result.message || 'Không thể lấy thông tin đơn hàng')
        }
      } catch {
        setError('Có lỗi kết nối xảy ra')
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchOrderDetail()
  }, [id])

  if (loading) {
    return (
      <UserLayout>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)] p-8 flex items-center justify-center min-h-[420px]">
          <p className="text-gray-500">Đang tải chi tiết đơn hàng...</p>
        </div>
      </UserLayout>
    )
  }

  if (error || !order) {
    return (
      <UserLayout>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)] p-8 text-center py-16 min-h-[420px]">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Lỗi</h2>
          <p className="text-gray-500 mb-6">{error || 'Đơn hàng không tồn tại.'}</p>
          <button
            onClick={() => navigate('/orders')}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700"
          >
            Quay lại danh sách đơn hàng
          </button>
        </div>
      </UserLayout>
    )
  }

  return (
    <UserLayout>
      <div className="rounded-3xl border border-primary-100 bg-gradient-to-r from-white to-primary-50/40 p-5 md:p-6 mb-6">
        <button
          onClick={() => navigate('/orders')}
          className="text-gray-600 hover:text-primary-700 transition font-semibold"
        >
          &larr; Quay lại đơn hàng của tôi
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)] p-6 md:p-8 min-h-[600px]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-4 border-b border-gray-100 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800">Chi tiết đơn hàng #{order.id}</h1>
            <p className="text-gray-500 text-sm mt-1">
              Đặt lúc: {new Date(order.createdAt).toLocaleString('vi-VN', {
                hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
              })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-3 py-1.5 rounded-full font-semibold text-xs border ${
              order.status === 'completed' ? 'bg-green-50 text-green-600 border-green-200' :
              order.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-200' :
              'bg-orange-50 text-orange-600 border-orange-200'
            }`}>
              {statusLabels[order.status] || order.status}
            </span>

            <span className={`px-3 py-1.5 rounded-full font-semibold text-xs border ${
              String(order.paymentStatus || 'unpaid').toLowerCase() === 'paid'
                ? 'bg-green-50 text-green-600 border-green-200'
                : String(order.paymentStatus || 'unpaid').toLowerCase() === 'pending'
                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                  : String(order.paymentStatus || 'unpaid').toLowerCase() === 'failed'
                    ? 'bg-red-50 text-red-600 border-red-200'
                    : 'bg-gray-50 text-gray-600 border-gray-200'
            }`}>
              {paymentStatusLabels[String(order.paymentStatus || 'unpaid').toLowerCase()] || String(order.paymentStatus || 'unpaid')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-50/70 rounded-2xl p-5 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Địa chỉ nhận hàng</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="text-gray-500">Họ và tên:</span> <span className="font-semibold text-gray-900">{order.customerName}</span></p>
              <p><span className="text-gray-500">Số điện thoại:</span> <span className="font-semibold text-gray-900">{order.customerPhone}</span></p>
              <p><span className="text-gray-500">Địa chỉ:</span> <span className="font-semibold text-gray-900">{order.customerAddress}</span></p>
            </div>
          </div>

          <div className="bg-gray-50/70 rounded-2xl p-5 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Hình thức thanh toán</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">{paymentMethodLabels[order.paymentMethod] || 'Thanh toán trực tiếp'}</p>
              <p className="text-gray-500">Mã giao dịch: {order.transactionId || '---'}</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Danh sách sản phẩm</h2>
          <div className="space-y-4">
            {order.items && order.items.map((item, idx) => (
              <div key={idx} className="flex gap-4 p-3 border border-gray-100 rounded-xl items-center">
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                  {item.productImage ? (
                    <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">🛍️</div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 text-base">{item.productName}</h4>
                  {(item.selectedSize || item.selectedColor) && (
                    <p className="text-gray-500 text-sm mt-0.5">
                      Phân loại: {item.selectedColor} {item.selectedSize ? `- ${item.selectedSize}` : ''}
                    </p>
                  )}
                  <div className="text-gray-600 text-sm mt-2 flex justify-between items-center">
                    <span>Số lượng: <span className="font-bold text-gray-800">{item.quantity}</span></span>
                    <span className="font-medium">{Number(item.price).toLocaleString('vi-VN')} ₫</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
          <div className="w-full md:w-1/2 lg:w-1/3">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính:</span>
                <span className="font-medium">{Number(order.totalAmount).toLocaleString('vi-VN')} ₫</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển:</span>
                <span className="font-medium">Miễn phí</span>
              </div>
              <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-base font-bold text-gray-800">Tổng cộng:</span>
                <span className="text-xl font-bold text-primary-600">
                  {Number(order.totalAmount).toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  )
}

export default OrderDetail
