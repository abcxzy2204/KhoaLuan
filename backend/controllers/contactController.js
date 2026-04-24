import ContactModel from '../models/ContactModel.js'

// @desc    Submit new contact message
// @route   POST /api/contacts
// @access  Public
export const submitContact = async (req, res) => {
  try {
    const { name, email, phone, address, message } = req.body

    if (!name || !email || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ các thông tin bắt buộc'
      })
    }

    const contact = await ContactModel.create({ name, email, phone, address, message })

    res.status(201).json({
      success: true,
      message: 'Gửi liên hệ thành công!',
      data: contact
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi gửi liên hệ',
      error: error.message
    })
  }
}

// @desc    Get all contact messages
// @route   GET /api/contacts
// @access  Private/Admin
export const getContacts = async (req, res) => {
  try {
    const contacts = await ContactModel.findAll()
    res.status(200).json({
      success: true,
      data: contacts
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách liên hệ',
      error: error.message
    })
  }
}

// @desc    Update contact status
// @route   PUT /api/contacts/:id
// @access  Private/Admin
export const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body
    const updated = await ContactModel.updateStatus(req.params.id, status)

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy liên hệ'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái thành công'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật trạng thái',
      error: error.message
    })
  }
}

// @desc    Delete contact message
// @route   DELETE /api/contacts/:id
// @access  Private/Admin
export const deleteContact = async (req, res) => {
  try {
    const deleted = await ContactModel.delete(req.params.id)

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy liên hệ'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Xóa liên hệ thành công'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xóa liên hệ',
      error: error.message
    })
  }
}
