import CouponModel from '../models/CouponModel.js'

// @desc    Get all coupons (Admin)
// @route   GET /api/coupons
// @access  Private/Admin
export const getCoupons = async (req, res) => {
  try {
    const coupons = await CouponModel.findAll()
    res.status(200).json({ success: true, data: coupons })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message })
  }
}

// @desc    Validate coupon (Public)
// @route   POST /api/coupons/validate
// @access  Public
export const validateCoupon = async (req, res) => {
  try {
    const { code, amount } = req.body
    if (!code) return res.status(400).json({ success: false, message: 'Vui lòng nhập mã giảm giá' })

    const coupon = await CouponModel.findByCode(code)

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại hoặc đã hết hạn' })
    }

    // Check status
    if (!coupon.status) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá này đã tạm ngưng sử dụng' })
    }

    // Check dates
    const now = new Date()
    if (coupon.startDate && new Date(coupon.startDate) > now) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá chưa đến ngày sử dụng' })
    }
    if (coupon.endDate && new Date(coupon.endDate) < now) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết hạn sử dụng' })
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt sử dụng' })
    }

    // Check min amount
    if (amount < coupon.minAmount) {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng tối thiểu ${Number(coupon.minAmount).toLocaleString('vi-VN')}₫ để áp dụng mã này`
      })
    }

    // Calculate discount
    let discountAmount = 0
    if (coupon.type === 'fixed') {
      discountAmount = Number(coupon.value)
    } else {
      discountAmount = (amount * Number(coupon.value)) / 100
    }

    res.status(200).json({
      success: true,
      message: 'Áp dụng mã thành công',
      data: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discountAmount: Math.min(discountAmount, amount) // Discount cannot exceed original amount
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message })
  }
}

// @desc    Create coupon (Admin)
// @route   POST /api/coupons
// @access  Private/Admin
export const createCoupon = async (req, res) => {
  try {
    const newCoupon = await CouponModel.create(req.body)
    res.status(201).json({ success: true, data: newCoupon })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Mã giảm giá này đã tồn tại' })
    }
    res.status(500).json({ success: false, message: 'Server Error', error: error.message })
  }
}

// @desc    Update coupon (Admin)
// @route   PUT /api/coupons/:id
// @access  Private/Admin
export const updateCoupon = async (req, res) => {
  try {
    const updatedCoupon = await CouponModel.update(req.params.id, req.body)
    res.status(200).json({ success: true, data: updatedCoupon })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Mã giảm giá này đã tồn tại' })
    }
    res.status(500).json({ success: false, message: 'Server Error', error: error.message })
  }
}

// @desc    Delete coupon (Admin)
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
export const deleteCoupon = async (req, res) => {
  try {
    const deleted = await CouponModel.delete(req.params.id)
    if (deleted) {
      res.status(200).json({ success: true, message: 'Xóa mã giảm giá thành công' })
    } else {
      res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá' })
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message })
  }
}
