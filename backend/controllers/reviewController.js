import ReviewModel from '../models/ReviewModel.js'

// @desc    Get reviews for a product
// @route   GET /api/products/:productId/reviews
// @access  Public
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params
    const reviews = await ReviewModel.findByProductId(productId)
    const averageRating = await ReviewModel.getAverageRating(productId)
    const ratingCount = await ReviewModel.getRatingCount(productId)
    const ratingDistribution = await ReviewModel.getRatingDistribution(productId)

    res.status(200).json({
      success: true,
      data: {
        reviews,
        averageRating: parseFloat(averageRating),
        ratingCount,
        ratingDistribution
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    })
  }
}

// @desc    Get all reviews (Admin)
// @route   GET /api/reviews
// @access  Private/Admin
export const getAllReviews = async (req, res) => {
  try {
    const reviews = await ReviewModel.findAll()
    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    })
  }
}

// @desc    Create review
// @route   POST /api/products/:productId/reviews
// @access  Private
export const createReview = async (req, res) => {
  try {
    const { productId } = req.params
    const { rating, comment } = req.body
    const userId = req.user.userId

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      })
    }

    // Check if user already reviewed this product
    const existingReview = await ReviewModel.findByUserAndProduct(userId, productId)
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      })
    }

    const review = await ReviewModel.create({
      productId,
      userId,
      rating: parseInt(rating),
      comment: comment || ''
    })

    if (review.error) {
      return res.status(400).json({
        success: false,
        message: review.error
      })
    }

    // Get updated stats
    const averageRating = await ReviewModel.getAverageRating(productId)
    const ratingCount = await ReviewModel.getRatingCount(productId)

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: {
        review,
        averageRating: parseFloat(averageRating),
        ratingCount
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    })
  }
}

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params
    const { rating, comment } = req.body
    const userId = req.user.userId

    const review = await ReviewModel.findById(id)
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      })
    }

    // Check if user owns this review
    if (review.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      })
    }

    // Validation
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      })
    }

    const updateData = {}
    if (rating) updateData.rating = parseInt(rating)
    if (comment !== undefined) updateData.comment = comment

    const updatedReview = await ReviewModel.update(id, updateData)

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: updatedReview
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    })
  }
}

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const review = await ReviewModel.findById(id)
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      })
    }

    // Check if user owns this review or is admin
    if (review.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      })
    }

    await ReviewModel.delete(id)

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    })
  }
}

