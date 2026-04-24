import express from 'express'
import { protect, authorize } from '../middleware/auth.js'
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  approvePaymentByAdmin,
  cancelMyOrder,
  getOrderById,
  deleteOrder,
  createPaymentIntent,
  getPaymentStatus,
  paymentCallback,
  getPaymentCheckout,
  confirmPayment,
  getMomoQR,
  getBankQR,
  bankWebhookConfirm
} from '../controllers/orderController.js'

const router = express.Router()

// User tạo đơn hàng
router.post('/', protect, createOrder)

// User xem đơn hàng của mình
router.get('/my', protect, getMyOrders)

// Callback từ cổng thanh toán (mock)
router.post('/payment-callback', paymentCallback)

// Webhook xác nhận chuyển khoản MB/Bank
router.post('/bank/webhook', bankWebhookConfirm)

// Public mock checkout APIs
router.get('/payments/:paymentRef/checkout', getPaymentCheckout)
router.get('/payments/:paymentRef/momo-qr', getMomoQR)
router.get('/payments/:paymentRef/bank-qr', getBankQR)
router.post('/payments/:paymentRef/confirm', confirmPayment)

// Admin xem tất cả đơn hàng
router.get('/', protect, authorize('admin'), getAllOrders)

// User tạo payment intent cho đơn online
router.post('/:id/payment-intent', protect, createPaymentIntent)

// User xem trạng thái thanh toán đơn
router.get('/:id/payment-status', protect, getPaymentStatus)

// Admin cập nhật trạng thái đơn hàng
router.patch('/:id/status', protect, authorize('admin'), updateOrderStatus)

// Admin xác nhận đã thanh toán
router.patch('/:id/approve-payment', protect, authorize('admin'), approvePaymentByAdmin)

// User hủy đơn hàng của mình
router.patch('/:id/cancel', protect, cancelMyOrder)

// User hoặc Admin xem chi tiết đơn hàng
router.get('/:id', protect, getOrderById)

// Admin xóa đơn hàng
router.delete('/:id', protect, authorize('admin'), deleteOrder)

export default router

