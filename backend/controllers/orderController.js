import OrderModel from '../models/OrderModel.js'
import ProductModel from '../models/ProductModel.js'
import CouponModel from '../models/CouponModel.js'
import UserModel from '../models/UserModel.js'

async function modifyStock(productId, quantityToChange, size, color) {
  const product = await ProductModel.findById(productId)
  if (!product) return

  // Đảm bảo stock không âm, nhưng nếu quantityToChange âm thì giảm
  product.stock = Math.max(0, product.stock + quantityToChange)
  let updatedSizes = product.sizes
  let updatedColors = product.colors

  // Cấu trúc sizes mới: [{ size: 'M', colors: [{ name: 'Red', stock: 10 }] }]
  if (updatedSizes && updatedSizes.length > 0 && typeof updatedSizes[0] === 'object') {
    const sizeObj = updatedSizes.find(s => s.size === size)
    if (sizeObj && sizeObj.colors) {
      const colorObj = sizeObj.colors.find(c => c.name === color)
      if (colorObj) {
        colorObj.stock = Math.max(0, colorObj.stock + quantityToChange)
      }
    }
  } 
  // Cấu trúc colors cũ: [{ name: 'Red', stock: 10 }]
  else if (updatedColors && updatedColors.length > 0 && typeof updatedColors[0] === 'object') {
    const colorObj = updatedColors.find(c => c.name === color || c.name === (color || 'Mặc định'))
    if (colorObj) {
      colorObj.stock = Math.max(0, colorObj.stock + quantityToChange)
    }
  }

  await ProductModel.update(productId, {
    stock: product.stock,
    sizes: updatedSizes,
    colors: updatedColors
  })
}
// @desc    Create new order from cart
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const userId = req.user.userId
    const { customerName, customerPhone, customerAddress, items, paymentMethod, couponCode, discountAmount } = req.body

    if (!customerName || !customerPhone || !customerAddress) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ giao hàng',
      })
    }

    const normalizedPaymentMethod = String(paymentMethod || 'cod').trim().toLowerCase()
    const allowedPaymentMethods = ['cod', 'online', 'momo', 'bank']
    if (!allowedPaymentMethods.includes(normalizedPaymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Phương thức thanh toán không hợp lệ. Hỗ trợ: cod, online, momo, bank'
      })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Giỏ hàng trống',
      })
    }

    // Tính lại tổng tiền dựa trên giá sản phẩm trong DB để tránh gian lận
    let totalAmount = 0
    const normalizedItems = []

    for (const item of items) {
      const product = await ProductModel.findById(item.productId)
      if (!product) continue

      const quantity = Number.parseInt(item.quantity, 10) || 1
      const price = product.price
      totalAmount += price * quantity

      normalizedItems.push({
        productId: product.id,
        productName: product.name,
        price,
        quantity,
        selectedSize: item.selectedSize || null,
        selectedColor: item.selectedColor || null,
      })
    }

    if (normalizedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có sản phẩm hợp lệ trong giỏ hàng',
      })
    }

    // Cộng phí ship cố định để khớp tổng tiền hiển thị ở checkout
    const shippingFee = 30000

    // Trừ số tiền giảm giá vào tổng tiền thanh toán (Net Total)
    const netTotal = Math.max(0, totalAmount + shippingFee - (discountAmount || 0))

    // DB hiện tại của nhiều máy chỉ cho paymentMethod ENUM('cod','online')
    // nên map momo/bank -> online để tránh lỗi SQL, provider lưu loại thật
    const isAltOnlinePayment = ['momo', 'bank'].includes(normalizedPaymentMethod)
    const paymentMethodForDb = isAltOnlinePayment ? 'online' : normalizedPaymentMethod
    const paymentProviderForDb = isAltOnlinePayment ? normalizedPaymentMethod : null

    const order = await OrderModel.createOrder(
      userId,
      {
        customerName,
        customerPhone,
        customerAddress,
        totalAmount: netTotal, // Lưu số tiền sau khi đã giảm
        paymentMethod: paymentMethodForDb,
        paymentProvider: paymentProviderForDb,
        couponCode: couponCode || null,
        discountAmount: discountAmount || 0
      },
      normalizedItems
    )

    // Tăng số lượt sử dụng mã giảm giá nếu có
    if (couponCode) {
      try {
        await CouponModel.incrementUsedCount(couponCode)
      } catch (couponError) {
        console.error('Lỗi khi tăng lượt dùng mã giảm giá:', couponError)
        // Không throw lỗi ở đây để tránh làm hỏng đơn hàng đã tạo thành công
      }
    }

    // Cập nhật tồn kho (thêm)
    for (const item of normalizedItems) {
      await modifyStock(item.productId, -item.quantity, item.selectedSize, item.selectedColor)
    }

    res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công',
      data: order,
    })
  } catch (error) {
    console.error('LỖI ĐẶT HÀNG:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xử lý đơn hàng',
      error: error.message,
    })
  }
}

// @desc    Get current user's orders
// @route   GET /api/orders/my
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.userId
    const orders = await OrderModel.findByUser(userId)
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    })
  }
}

// @desc    Get all orders (admin)
// @route   GET /api/orders
// @access  Private/Admin
export const getAllOrders = async (req, res) => {
  try {
    const orders = await OrderModel.findAll()
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    })
  }
}

// @desc    Update order status (admin)
// @route   PATCH /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const allowed = ['pending', 'processing', 'shipped', 'completed', 'cancelled']
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ',
      })
    }

    const oldOrder = await OrderModel.findById(id)
    if (!oldOrder) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng',
      })
    }

    const updated = await OrderModel.updateStatus(id, status)
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Cập nhật trạng thái thất bại',
      })
    }

    // Nếu chuyển sang trạng thái cancelled từ trạng thái khác, hoàn lại số lượng
    if (oldOrder.status !== 'cancelled' && status === 'cancelled') {
      for (const item of oldOrder.items) {
        await modifyStock(item.productId, item.quantity, item.selectedSize, item.selectedColor)
      }
    }

    // Admin xác nhận đã thanh toán: khi đơn được chuyển sang processing/completed
    // và trước đó payment đang pending thì cập nhật paymentStatus = paid
    let merged = updated
    const paidStatuses = ['processing', 'shipped', 'completed']
    if (paidStatuses.includes(status) && String(oldOrder.paymentStatus || '').toLowerCase() === 'pending') {
      merged = await OrderModel.updatePayment(id, {
        paymentStatus: 'paid',
        paidAt: new Date()
      })
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: merged,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    })
  }
}

// @desc    Admin xác nhận đã thanh toán
// @route   PATCH /api/orders/:id/approve-payment
// @access  Private/Admin
export const approvePaymentByAdmin = async (req, res) => {
  try {
    const { id } = req.params
    const order = await OrderModel.findById(id)

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' })
    }

    const currentPayment = String(order.paymentStatus || '').toLowerCase()
    if (currentPayment === 'paid') {
      return res.status(200).json({ success: true, message: 'Đơn hàng đã được xác nhận thanh toán trước đó', data: order })
    }

    const updatedPayment = await OrderModel.updatePayment(id, {
      paymentStatus: 'paid',
      paidAt: new Date(),
      transactionId: order.transactionId || `ADMIN-CONFIRM-${Date.now()}`
    })

    if (String(order.status || '').toLowerCase() === 'pending') {
      await OrderModel.updateStatus(id, 'processing')
    }

    const latest = await OrderModel.findById(id)
    return res.status(200).json({
      success: true,
      message: 'Đã xác nhận thanh toán thành công',
      data: latest || updatedPayment
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message })
  }
}

// @desc    Cancel own order (user)
// @route   PATCH /api/orders/:id/cancel
// @access  Private
export const cancelMyOrder = async (req, res) => {
  try {
    const userId = req.user.userId
    const { id } = req.params

    const order = await OrderModel.findById(id)
    if (!order || order.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng',
      })
    }

    if (!['pending', 'processing'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể hủy đơn hàng ở trạng thái chờ xử lý hoặc đang xử lý',
      })
    }

    const updated = await OrderModel.updateStatus(id, 'cancelled')

    // Hoàn lại số lượng vì user tự hủy đơn hàng
    for (const item of order.items) {
      await modifyStock(item.productId, item.quantity, item.selectedSize, item.selectedColor)
    }

    res.status(200).json({
      success: true,
      message: 'Hủy đơn hàng thành công',
      data: updated,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    })
  }
}

export const getOrderById = async (req, res) => {
  try {
    const order = await OrderModel.findById(req.params.id)
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' })
    
    // JWT hiện chỉ chứa { userId }, nên req.user.role có thể undefined.
    // Lấy role từ DB để kiểm tra admin/ownership.
    const currentUser = await UserModel.findById(req.user.userId)
    const isAdmin = String(currentUser?.role || '').toLowerCase() === 'admin'

    // Check ownership: Admin hoặc chính chủ đơn hàng mới được xem
    if (!isAdmin && order.userId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập đơn hàng này' })
    }

    res.status(200).json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message })
  }
}

export const deleteOrder = async (req, res) => {
  try {
    const order = await OrderModel.findById(req.params.id)
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' })
    
    await OrderModel.delete(req.params.id)
    res.status(200).json({ success: true, message: 'Xóa đơn hàng thành công' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message })
  }
}

// @desc    User tạo yêu cầu thanh toán online (mock)
// @route   POST /api/orders/:id/payment-intent
// @access  Private
export const createPaymentIntent = async (req, res) => {
  try {
    const { id } = req.params
    const order = await OrderModel.findById(id)

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' })
    }

    const currentUser = await UserModel.findById(req.user.userId)
    const isAdmin = String(currentUser?.role || '').toLowerCase() === 'admin'
    if (!isAdmin && order.userId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thao tác đơn hàng này' })
    }

    if (String(order.paymentMethod || '').toLowerCase() === 'cod') {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng COD không cần tạo payment intent online'
      })
    }

    if (String(order.paymentStatus || '').toLowerCase() === 'paid') {
      return res.status(400).json({ success: false, message: 'Đơn hàng đã được thanh toán trước đó' })
    }

    const requestedProvider = String(req.body?.provider || order.paymentProvider || order.paymentMethod || 'mockpay').trim().toLowerCase()
    const provider = requestedProvider === 'momo'
      ? 'momo'
      : requestedProvider === 'bank'
        ? 'bank'
        : 'mockpay'
    const normalizedMethod = 'online'

    const paymentRefPrefix = provider === 'momo' ? 'MOMO' : 'PAY'
    const paymentRef = `${paymentRefPrefix}-${order.id}-${Date.now()}`
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    const updated = await OrderModel.updatePayment(order.id, {
      paymentProvider: provider,
      paymentStatus: 'pending',
      paymentRef,
      paymentExpiresAt: expiresAt,
      paymentMethod: normalizedMethod
    })

    const paymentUrl = provider === 'momo'
      ? `/api/orders/payments/${paymentRef}/checkout?provider=momo`
      : `/api/orders/payments/${paymentRef}/checkout`

    return res.status(200).json({
      success: true,
      message: provider === 'momo' ? 'Tạo yêu cầu thanh toán MoMo thành công' : 'Tạo payment intent thành công',
      data: {
        orderId: updated.id,
        amount: Number(updated.totalAmount),
        paymentMethod: updated.paymentMethod,
        paymentStatus: updated.paymentStatus,
        paymentProvider: updated.paymentProvider,
        paymentRef: updated.paymentRef,
        paymentUrl,
        qrCodeUrl: provider === 'momo' ? `/api/orders/payments/${paymentRef}/momo-qr` : null,
        expiresAt: updated.paymentExpiresAt
      }
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message })
  }
}

// @desc    User kiểm tra trạng thái thanh toán
// @route   GET /api/orders/:id/payment-status
// @access  Private
export const getPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params
    const order = await OrderModel.findById(id)

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' })
    }

    const currentUser = await UserModel.findById(req.user.userId)
    const isAdmin = String(currentUser?.role || '').toLowerCase() === 'admin'
    if (!isAdmin && order.userId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem đơn hàng này' })
    }

    return res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: Number(order.totalAmount),
        paymentMethod: order.paymentMethod || 'cod',
        paymentStatus: order.paymentStatus || 'unpaid',
        paymentProvider: order.paymentProvider || null,
        paymentRef: order.paymentRef || null,
        transactionId: order.transactionId || null,
        paidAt: order.paidAt || null,
        paymentExpiresAt: order.paymentExpiresAt || null
      }
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message })
  }
}

// @desc    Webhook/Callback xác nhận thanh toán (mock)
// @route   POST /api/orders/payment-callback
// @access  Public (nên thêm secret ở production)
export const paymentCallback = async (req, res) => {
  try {
    const { paymentRef, status, transactionId } = req.body || {}

    if (!paymentRef || !status) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu paymentRef hoặc status'
      })
    }

    const normalizedStatus = String(status).toLowerCase()
    const allowed = ['paid', 'failed', 'refunded', 'pending']
    if (!allowed.includes(normalizedStatus)) {
      return res.status(400).json({ success: false, message: 'Trạng thái thanh toán không hợp lệ' })
    }

    const order = await OrderModel.findByPaymentRef(String(paymentRef))
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng theo paymentRef' })
    }

    const payload = {
      paymentStatus: normalizedStatus,
      transactionId: transactionId || order.transactionId || null
    }

    if (normalizedStatus === 'paid') {
      payload.paidAt = new Date()
      if (order.status === 'pending') {
        await OrderModel.updateStatus(order.id, 'processing')
      }
    }

    const updated = await OrderModel.updatePayment(order.id, payload)

    return res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái thanh toán thành công',
      data: updated
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message })
  }
}

// @desc    Lấy thông tin checkout theo paymentRef (mock gateway page data)
// @route   GET /api/orders/payments/:paymentRef/checkout
// @access  Public
export const getPaymentCheckout = async (req, res) => {
  try {
    const { paymentRef } = req.params
    const order = await OrderModel.findByPaymentRef(String(paymentRef || ''))

    if (!order) {
      return res.status(404).json({ success: false, message: 'Payment không tồn tại hoặc đã hết hạn' })
    }

    if (String(order.paymentStatus || '').toLowerCase() === 'paid') {
      return res.status(200).json({
        success: true,
        message: 'Đơn hàng đã thanh toán',
        data: {
          paymentRef: order.paymentRef,
          orderId: order.id,
          amount: Number(order.totalAmount),
          currency: 'VND',
          status: order.paymentStatus,
          paidAt: order.paidAt || null
        }
      })
    }

    if (order.paymentExpiresAt && new Date(order.paymentExpiresAt).getTime() < Date.now()) {
      await OrderModel.updatePayment(order.id, { paymentStatus: 'failed' })
      return res.status(410).json({ success: false, message: 'Phiên thanh toán đã hết hạn' })
    }

    const provider = order.paymentProvider || 'mockpay'
    const data = {
      paymentRef: order.paymentRef,
      orderId: order.id,
      amount: Number(order.totalAmount),
      currency: 'VND',
      status: order.paymentStatus || 'pending',
      provider,
      expiresAt: order.paymentExpiresAt || null
    }

    if (provider === 'momo') {
      data.momo = {
        partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMO_DEMO',
        requestId: `REQ-${order.id}-${Date.now()}`,
        orderInfo: `Thanh toan don hang #${order.id}`,
        deepLink: `momo://payment?ref=${encodeURIComponent(order.paymentRef)}`,
        qrCodeUrl: `/api/orders/payments/${order.paymentRef}/momo-qr`
      }
    }

    if (provider === 'bank') {
      data.bank = {
        bankCode: process.env.BANK_CODE || 'MB',
        accountNo: process.env.BANK_ACCOUNT_NO || '',
        accountName: process.env.BANK_ACCOUNT_NAME || '',
        qrCodeUrl: `/api/orders/payments/${order.paymentRef}/bank-qr`
      }
    }

    return res.status(200).json({ success: true, data })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message })
  }
}

// @desc    Xác nhận thanh toán thành công từ trang checkout (mock)
// @route   POST /api/orders/payments/:paymentRef/confirm
// @access  Public (production nên dùng token/chữ ký)
export const confirmPayment = async (req, res) => {
  try {
    const { paymentRef } = req.params
    const order = await OrderModel.findByPaymentRef(String(paymentRef || ''))

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch thanh toán' })
    }

    const paymentStatus = String(order.paymentStatus || '').toLowerCase()
    if (paymentStatus === 'paid') {
      return res.status(200).json({ success: true, message: 'Đơn hàng đã được thanh toán trước đó', data: order })
    }

    if (order.paymentExpiresAt && new Date(order.paymentExpiresAt).getTime() < Date.now()) {
      await OrderModel.updatePayment(order.id, { paymentStatus: 'failed' })
      return res.status(410).json({ success: false, message: 'Phiên thanh toán đã hết hạn' })
    }

    const isMomo = String(order.paymentProvider || '').toLowerCase() === 'momo'
    const txn = req.body?.transactionId || `${isMomo ? 'MOMO' : 'MOCK'}-TXN-${Date.now()}`
    // Khách bấm "Tôi đã thanh toán" => chuyển sang trạng thái chờ admin duyệt
    const updated = await OrderModel.updatePayment(order.id, {
      paymentStatus: 'pending',
      transactionId: txn,
      paidAt: null
    })

    return res.status(200).json({
      success: true,
      message: isMomo ? 'Đã gửi yêu cầu xác nhận thanh toán MoMo. Vui lòng chờ admin duyệt.' : 'Đã gửi yêu cầu xác nhận thanh toán. Vui lòng chờ admin duyệt.',
      data: {
        orderId: updated.id,
        paymentRef: updated.paymentRef,
        paymentProvider: updated.paymentProvider,
        transactionId: updated.transactionId,
        paymentStatus: updated.paymentStatus,
        paidAt: updated.paidAt
      }
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message })
  }
}

// @desc    Trả dữ liệu QR MoMo (mock)
// @route   GET /api/orders/payments/:paymentRef/momo-qr
// @access  Public
export const getMomoQR = async (req, res) => {
  try {
    const { paymentRef } = req.params
    const order = await OrderModel.findByPaymentRef(String(paymentRef || ''))

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch MoMo' })
    }

    if (String(order.paymentProvider || '').toLowerCase() !== 'momo') {
      return res.status(400).json({ success: false, message: 'Giao dịch này không sử dụng MoMo' })
    }

    const amount = Number(order.totalAmount || 0)
    const qrText = `2|99|${process.env.MOMO_PHONE || '0900000000'}|${process.env.MOMO_ACCOUNT_NAME || 'SHOP TRE EM'}|0|0|${amount}|${paymentRef}`

    return res.status(200).json({
      success: true,
      data: {
        paymentRef,
        provider: 'momo',
        amount,
        qrText,
        note: `Thanh toan don hang #${order.id}`,
        expiresAt: order.paymentExpiresAt || null
      }
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message })
  }
}

// @desc    Trả dữ liệu QR ngân hàng VietQR (MB)
// @route   GET /api/orders/payments/:paymentRef/bank-qr
// @access  Public
export const getBankQR = async (req, res) => {
  try {
    const { paymentRef } = req.params
    const order = await OrderModel.findByPaymentRef(String(paymentRef || ''))

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch ngân hàng' })
    }

    if (String(order.paymentProvider || '').toLowerCase() !== 'bank') {
      return res.status(400).json({ success: false, message: 'Giao dịch này không sử dụng chuyển khoản ngân hàng' })
    }

    const amount = Number(order.totalAmount || 0)
    const bankCode = (process.env.BANK_CODE || 'MB').trim().toUpperCase()
    const accountNo = (process.env.BANK_ACCOUNT_NO || '').trim()
    const accountName = (process.env.BANK_ACCOUNT_NAME || '').trim()
    const addInfo = `DONHANG ${order.id} ${paymentRef}`

    if (!accountNo || !accountName) {
      return res.status(400).json({ success: false, message: 'Thiếu cấu hình BANK_ACCOUNT_NO hoặc BANK_ACCOUNT_NAME trong .env' })
    }

    const vietQrImageUrl = `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(accountName)}`

    return res.status(200).json({
      success: true,
      data: {
        paymentRef,
        provider: 'bank',
        bankCode,
        accountNo,
        accountName,
        amount,
        addInfo,
        qrImageUrl: vietQrImageUrl,
        expiresAt: order.paymentExpiresAt || null
      }
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message })
  }
}

// @desc    Webhook tự xác nhận chuyển khoản ngân hàng (MB)
// @route   POST /api/orders/bank/webhook
// @access  Public (khuyến nghị bảo vệ bằng BANK_WEBHOOK_SECRET)
export const bankWebhookConfirm = async (req, res) => {
  try {
    const headerSecret = String(req.headers['x-webhook-secret'] || '')
    const bodySecret = String(req.body?.secret || '')
    const configuredSecret = String(process.env.BANK_WEBHOOK_SECRET || '')

    if (configuredSecret && headerSecret !== configuredSecret && bodySecret !== configuredSecret) {
      return res.status(401).json({ success: false, message: 'Webhook secret không hợp lệ' })
    }

    const {
      paymentRef,
      transactionId,
      amount,
      status,
      bankCode,
      accountNo,
      transferContent
    } = req.body || {}

    if (!paymentRef || !transactionId || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu dữ liệu bắt buộc: paymentRef, transactionId, amount'
      })
    }

    const normalizedStatus = String(status || 'success').toLowerCase()
    if (!['success', 'paid', 'completed'].includes(normalizedStatus)) {
      return res.status(400).json({ success: false, message: 'Webhook không ở trạng thái thành công' })
    }

    const order = await OrderModel.findByPaymentRef(String(paymentRef))
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng theo paymentRef' })
    }

    if (String(order.paymentProvider || '').toLowerCase() !== 'bank') {
      return res.status(400).json({ success: false, message: 'Đơn hàng không phải thanh toán ngân hàng' })
    }

    const expectedBankCode = String(process.env.BANK_CODE || 'MB').trim().toUpperCase()
    const expectedAccountNo = String(process.env.BANK_ACCOUNT_NO || '').trim()

    if (bankCode && String(bankCode).trim().toUpperCase() !== expectedBankCode) {
      return res.status(400).json({ success: false, message: `Sai mã ngân hàng. Mong đợi ${expectedBankCode}` })
    }

    if (accountNo && expectedAccountNo && String(accountNo).trim() !== expectedAccountNo) {
      return res.status(400).json({ success: false, message: 'Sai số tài khoản nhận tiền' })
    }

    const amountNum = Number(amount)
    const expectedAmount = Number(order.totalAmount || 0)
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return res.status(400).json({ success: false, message: 'Số tiền webhook không hợp lệ' })
    }

    if (Math.abs(amountNum - expectedAmount) > 1) {
      return res.status(400).json({
        success: false,
        message: `Số tiền không khớp. Nhận ${amountNum}, mong đợi ${expectedAmount}`
      })
    }

    if (transferContent) {
      const content = String(transferContent).toUpperCase()
      const ref = String(paymentRef).toUpperCase()
      if (!content.includes(ref)) {
        return res.status(400).json({ success: false, message: 'Nội dung chuyển khoản không chứa paymentRef' })
      }
    }

    const paymentStatus = String(order.paymentStatus || '').toLowerCase()
    if (paymentStatus === 'paid') {
      return res.status(200).json({
        success: true,
        message: 'Đơn hàng đã thanh toán trước đó',
        data: { orderId: order.id, paymentRef: order.paymentRef, paymentStatus: order.paymentStatus }
      })
    }

    const updated = await OrderModel.updatePayment(order.id, {
      paymentStatus: 'paid',
      transactionId: String(transactionId),
      paidAt: new Date()
    })

    if (String(order.status || '').toLowerCase() === 'pending') {
      await OrderModel.updateStatus(order.id, 'processing')
    }

    return res.status(200).json({
      success: true,
      message: 'Xác nhận chuyển khoản thành công',
      data: {
        orderId: updated.id,
        paymentRef: updated.paymentRef,
        paymentStatus: updated.paymentStatus,
        transactionId: updated.transactionId,
        paidAt: updated.paidAt
      }
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message })
  }
}


