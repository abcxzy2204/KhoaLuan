import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const Checkout = () => {
  const { cartItems, getTotalPrice, clearCart } = useCart()
  const { user, isAuthenticated } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [customerName, setCustomerName] = useState(user?.name || '')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmingPayment, setConfirmingPayment] = useState(false)
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [momoData, setMomoData] = useState(null)

  // States cho Coupon
  const [couponCodeInput, setCouponCodeInput] = useState('')
  const [couponData, setCouponData] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [validatingCoupon, setValidatingCoupon] = useState(false)

  const handleApplyCoupon = async () => {
    if (!couponCodeInput) return
    setCouponError('')
    setValidatingCoupon(true)
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCodeInput,
          amount: getTotalPrice()
        })
      })
      const result = await res.json()
      if (result.success) {
        setCouponData(result.data)
        setCouponError('')
      } else {
        setCouponError(result.message)
        setCouponData(null)
      }
    } catch (err) {
      setCouponError('Lỗi kiểm tra mã')
    } finally {
      setValidatingCoupon(false)
    }
  }

  useEffect(() => {
    if (!momoData?.orderId) return

    let timer = null

    const checkPayment = async () => {
      try {
        setCheckingPayment(true)
        const token = localStorage.getItem('token')
        const res = await fetch(`/api/orders/${momoData.orderId}/payment-status`, {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        })
        const result = await res.json()

        if (result?.success && String(result?.data?.paymentStatus || '').toLowerCase() === 'paid') {
          addToast('Đã ghi nhận thanh toán thành công tự động!', 'success')
          clearCart()
          setMomoData(null)
          navigate('/orders')
        }
      } catch {
        // Không chặn UI nếu poll lỗi tạm thời
      } finally {
        setCheckingPayment(false)
      }
    }

    timer = setInterval(checkPayment, 5000)
    checkPayment()

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [momoData?.orderId, addToast, clearCart, navigate])

  if (!isAuthenticated) {
    navigate('/login')
    return null
  }

  if (cartItems.length === 0 && !momoData) {
    navigate('/cart')
    return null
  }

  const handleConfirmPayment = async () => {
    if (!momoData?.paymentRef) return
    setConfirmingPayment(true)
    setError('')

    try {
      const res = await fetch(`/api/orders/payments/${momoData.paymentRef}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      const result = await res.json()

      if (!result.success) {
        setError(result.message || 'Xác nhận thanh toán thất bại')
        addToast(result.message || 'Xác nhận thanh toán thất bại', 'error')
        return
      }

      addToast('Đã gửi xác nhận thanh toán. Đơn hàng đang chờ duyệt thanh toán.', 'success')
      clearCart()
      setMomoData(null)
      navigate('/orders')
    } catch (err) {
      setError('Không thể xác nhận thanh toán. Vui lòng thử lại.')
    } finally {
      setConfirmingPayment(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!customerName || !customerPhone || !customerAddress) {
      setError('Vui lòng nhập đầy đủ thông tin giao hàng')
      addToast('Vui lòng nhập đầy đủ thông tin giao hàng', 'warning')
      setLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerAddress,
          paymentMethod,
          items: cartItems.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
          })),
          couponCode: couponData?.code || null,
          discountAmount: couponData?.discountAmount || 0
        }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.message || 'Đặt hàng thất bại')
        addToast(result.message || 'Đặt hàng thất bại', 'error')
      } else {
        // Nếu chọn MoMo/Bank: tạo payment intent + lấy QR đúng số tiền
        if (paymentMethod === 'momo' || paymentMethod === 'bank') {
          const orderId = result?.data?.id
          if (!orderId) {
            setError('Không lấy được mã đơn hàng để tạo thanh toán')
            return
          }

          const provider = paymentMethod === 'bank' ? 'bank' : 'momo'
          const intentRes = await fetch(`/api/orders/${orderId}/payment-intent`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ provider })
          })
          const intentData = await intentRes.json()

          if (!intentData.success) {
            setError(intentData.message || 'Không tạo được yêu cầu thanh toán')
            addToast(intentData.message || 'Không tạo được yêu cầu thanh toán', 'error')
            return
          }

          const paymentRef = intentData?.data?.paymentRef
          const qrEndpoint = provider === 'bank'
            ? `/api/orders/payments/${paymentRef}/bank-qr`
            : `/api/orders/payments/${paymentRef}/momo-qr`

          const qrRes = await fetch(qrEndpoint)
          const qrData = await qrRes.json()

          if (!qrData.success) {
            setError(qrData.message || 'Không lấy được QR thanh toán')
            addToast(qrData.message || 'Không lấy được QR thanh toán', 'error')
            return
          }

          setMomoData({
            orderId,
            paymentRef,
            amount: Number(intentData?.data?.amount || 0),
            provider,
            qrText: qrData?.data?.qrText || '',
            qrImageUrl: qrData?.data?.qrImageUrl || '',
            bankCode: qrData?.data?.bankCode || '',
            accountNo: qrData?.data?.accountNo || '',
            accountName: qrData?.data?.accountName || '',
            addInfo: qrData?.data?.addInfo || '',
            note: qrData?.data?.note || '',
            expiresAt: qrData?.data?.expiresAt || null
          })

          addToast(provider === 'bank'
            ? 'Đã tạo QR VietQR MB. Vui lòng quét bằng app ngân hàng.'
            : 'Đã tạo QR MoMo. Vui lòng quét mã để thanh toán.', 'success')
          return
        }

        addToast('Đặt hàng thành công! Cảm ơn bạn đã mua hàng.', 'success')
        clearCart()
        navigate('/orders')
      }
    } catch (err) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 rounded-3xl border border-primary-100 bg-gradient-to-r from-white to-primary-50/40 p-6 md:p-8 shadow-sm">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800">Thanh Toán</h1>
        <p className="text-sm md:text-base text-gray-500 mt-2">Hoàn tất thông tin để xác nhận đơn hàng của bạn.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form thông tin giao hàng */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-4 bg-white rounded-2xl border border-gray-100 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)] p-5 md:p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1">
              Họ và tên người nhận
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">
              Số điện thoại
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">
              Địa chỉ giao hàng
            </label>
            <textarea
              className="w-full border border-gray-300 rounded px-3 py-2"
              rows={3}
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Phương thức thanh toán
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-400 transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">Thanh toán khi nhận hàng (COD)</p>
                  <p className="text-xs text-gray-500">Trả tiền mặt khi nhận đơn.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-400 transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="momo"
                  checked={paymentMethod === 'momo'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">Ví MoMo</p>
                  <p className="text-xs text-gray-500">Tạo yêu cầu thanh toán MoMo sau khi đặt đơn.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-400 transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank"
                  checked={paymentMethod === 'bank'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">Chuyển khoản ngân hàng (VietQR - MB)</p>
                  <p className="text-xs text-gray-500">Quét bằng app MB để chuyển khoản đúng số tiền.</p>
                </div>
              </label>

undefined            </div>
          </div>

          {momoData && (
            <div className={`p-4 border rounded-lg ${momoData.provider === 'bank' ? 'border-blue-200 bg-blue-50' : 'border-pink-200 bg-pink-50'}`}>
              <h3 className={`font-bold mb-2 ${momoData.provider === 'bank' ? 'text-blue-700' : 'text-pink-700'}`}>
                {momoData.provider === 'bank' ? 'Quét mã VietQR (MB) để chuyển khoản' : 'Quét mã MoMo để thanh toán'}
              </h3>
              <p className="text-sm text-gray-700">Mã đơn: <span className="font-semibold">#{momoData.orderId}</span></p>
              <p className="text-sm text-gray-700">Số tiền: <span className="font-semibold text-primary-700">{Number(momoData.amount || 0).toLocaleString('vi-VN')}₫</span></p>

              {momoData.provider === 'bank' ? (
                <>
                  <p className="text-sm text-gray-700 mt-1">Ngân hàng: <span className="font-semibold">{momoData.bankCode}</span></p>
                  <p className="text-sm text-gray-700">Số tài khoản: <span className="font-semibold">{momoData.accountNo}</span></p>
                  <p className="text-sm text-gray-700">Chủ tài khoản: <span className="font-semibold">{momoData.accountName}</span></p>
                  <p className="text-xs text-gray-500 mt-1">Nội dung chuyển khoản: <span className="font-semibold">{momoData.addInfo}</span></p>
                </>
              ) : (
                momoData.note && <p className="text-xs text-gray-500 mt-1">{momoData.note}</p>
              )}

              <div className="mt-3 flex justify-center">
                <img
                  src={momoData.provider === 'bank'
                    ? momoData.qrImageUrl
                    : `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(momoData.qrText || '')}`}
                  alt={momoData.provider === 'bank' ? 'QR VietQR MB' : 'QR MoMo'}
                  className="rounded-lg border bg-white p-2 w-56 h-56 sm:w-64 sm:h-64 object-contain"
                />
              </div>

              {momoData.provider !== 'bank' && (
                <p className="text-xs text-gray-500 mt-3 break-all">
                  Nội dung QR: {momoData.qrText}
                </p>
              )}
              {momoData.expiresAt && (
                <p className="text-xs text-gray-500 mt-1">
                  Hết hạn: {new Date(momoData.expiresAt).toLocaleString('vi-VN')}
                </p>
              )}

              <div className="mt-2 text-xs text-gray-500">
                {checkingPayment ? 'Đang tự kiểm tra trạng thái thanh toán...' : 'Tự động kiểm tra thanh toán mỗi 5 giây.'}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={confirmingPayment}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                >
                  {confirmingPayment ? 'Đang xác nhận...' : 'Tôi đã thanh toán'}
                </button>
                <button
                  type="button"
                  onClick={() => setMomoData(null)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-300"
                >
                  Đóng QR
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
          </button>
        </form>

        {/* Tóm tắt đơn hàng */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)] p-6 sticky top-24">
          <h2 className="text-xl font-bold mb-4">Đơn hàng của bạn</h2>
          <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  {item.selectedSize && (
                    <p className="text-gray-500 text-xs">
                      Size: {item.selectedSize}
                    </p>
                  )}
                  {item.selectedColor && (
                    <p className="text-gray-500 text-xs">
                      Màu: {item.selectedColor}
                    </p>
                  )}
                  <p className="text-gray-500 text-xs">
                    SL: {item.quantity}
                  </p>
                </div>
                <p className="font-semibold">
                  {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                </p>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Tạm tính:</span>
              <span>{getTotalPrice().toLocaleString('vi-VN')}₫</span>
            </div>
            
            {/* Coupon Input Section */}
            <div className="py-2 border-y border-gray-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã giảm giá..."
                  className={`flex-1 border rounded-lg px-3 py-2 text-sm outline-none transition-all ${couponError ? 'border-red-300' : 'border-gray-200 focus:border-primary-500'}`}
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={validatingCoupon || !couponCodeInput}
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-black disabled:opacity-50 transition-colors"
                >
                  {validatingCoupon ? '...' : 'Áp dụng'}
                </button>
              </div>
              {couponError && <p className="text-red-500 text-[10px] mt-1 ml-1">{couponError}</p>}
              {couponData && <p className="text-green-600 text-[10px] mt-1 ml-1 font-medium">✓ Đã áp dụng mã {couponData.code}</p>}
            </div>

            <div className="flex justify-between text-gray-600">
              <span>Phí vận chuyển:</span>
              <span>30,000₫</span>
            </div>

            {couponData && (
              <div className="flex justify-between text-pink-600 font-medium">
                <span>Giảm giá ({couponData.type === 'percent' ? `${couponData.value}%` : 'Mã KM'}):</span>
                <span>-{Number(couponData.discountAmount).toLocaleString('vi-VN')}₫</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-xl pt-2 border-t">
              <span>Tổng cộng:</span>
              <span className="text-primary-600">
                {(getTotalPrice() + 30000 - (couponData?.discountAmount || 0)).toLocaleString('vi-VN')}₫
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout

