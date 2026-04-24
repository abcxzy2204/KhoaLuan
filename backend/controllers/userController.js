import UserModel from '../models/UserModel.js'

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const users = await UserModel.findAll()

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    })
  }
}

export const getUserById = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id)
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' })
    res.status(200).json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message })
  }
}

export const deleteUser = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id)
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' })
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Không thể xóa tài khoản Quản trị viên' })
    
    await UserModel.delete(req.params.id)
    res.status(200).json({ success: true, message: 'Xóa tài khoản thành công' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message })
  }
}

export const adminChangePassword = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id)
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' })
    const { password } = req.body
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' })
    }
    
    await UserModel.updatePassword(req.params.id, password)
    res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message })
  }
}

export const adminToggleUserStatus = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id)
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' })

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Không thể khóa/mở tài khoản Quản trị viên' })
    }

    const { isActive } = req.body
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Trạng thái tài khoản không hợp lệ' })
    }

    await UserModel.setActiveStatus(req.params.id, isActive)
    const updatedUser = await UserModel.findById(req.params.id)

    return res.status(200).json({
      success: true,
      message: isActive ? 'Mở khóa tài khoản thành công' : 'Khóa tài khoản thành công',
      data: updatedUser
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message })
  }
}

export const adminChangeUserRole = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id)
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' })

    const { role } = req.body
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ' })
    }

    if (Number(req.user.userId) === Number(req.params.id) && role !== 'admin') {
      return res.status(400).json({ success: false, message: 'Không thể tự hạ quyền tài khoản đang đăng nhập' })
    }

    await UserModel.setRole(req.params.id, role)
    const updatedUser = await UserModel.findById(req.params.id)

    return res.status(200).json({
      success: true,
      message: 'Cập nhật phân quyền thành công',
      data: updatedUser
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message })
  }
}
