import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

// Đảm bảo thư mục upload tồn tại
const uploadDir = 'uploads/'
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir)
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    )
  },
})

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|webp|gif/
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = filetypes.test(file.mimetype)

  if (extname && mimetype) {
    return cb(null, true)
  } else {
    cb('Chỉ cho phép định dạng ảnh!')
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb)
  },
})

router.post('/', protect, authorize('admin'), upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Chưa đính kèm file' })
  }
  res.status(200).json({ success: true, imageUrl: `/uploads/${req.file.filename}` })
})

export default router
