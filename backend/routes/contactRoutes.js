import express from 'express'
import { submitContact, getContacts, updateContactStatus, deleteContact } from '../controllers/contactController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

// Public route to submit contact
router.post('/', submitContact)

// Admin routes
router.get('/', protect, authorize('admin'), getContacts)
router.put('/:id', protect, authorize('admin'), updateContactStatus)
router.delete('/:id', protect, authorize('admin'), deleteContact)

export default router
