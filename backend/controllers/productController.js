import ProductModel from '../models/ProductModel.js'
import ReviewModel from '../models/ReviewModel.js'
import { validateProduct } from '../utils/validators.js'

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const { limit, category, search, sortBy } = req.query
    const filters = { limit, category, search, sortBy }
    
    const products = await ProductModel.findAll(filters)
    
    // Add average rating to each product
    const productsWithRating = await Promise.all(
      products.map(async (product) => {
        const averageRating = await ReviewModel.getAverageRating(product.id)
        const ratingCount = await ReviewModel.getRatingCount(product.id)
        return {
          ...product,
          averageRating: parseFloat(averageRating),
          ratingCount
        }
      })
    )
    
    res.status(200).json({
      success: true,
      count: productsWithRating.length,
      data: productsWithRating
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    })
  }
}

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id)
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }
    
    // Add rating info
    const averageRating = await ReviewModel.getAverageRating(product.id)
    const ratingCount = await ReviewModel.getRatingCount(product.id)
    
    res.status(200).json({
      success: true,
      data: {
        ...product,
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

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  try {
    const { name, price, costPrice, category, description, image, sizes, colors, stock, originalPrice, sale } = req.body
    
    // Validation
    const validation = validateProduct(req.body)
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      })
    }
    
    const productData = {
      name,
      price: parseFloat(price),
      costPrice: costPrice === undefined || costPrice === null || costPrice === '' ? null : parseFloat(costPrice),
      category,
      description: description || '',
      image: image || 'https://via.placeholder.com/400x400',
      sizes: sizes || [],
      colors: colors || [],
      stock: stock === undefined || stock === null || stock === '' ? 0 : parseInt(stock, 10),
      originalPrice:
        originalPrice === undefined || originalPrice === null || originalPrice === '' ? null : parseFloat(originalPrice),
      sale: sale === undefined || sale === null || sale === '' ? null : parseInt(sale, 10)
    }
    
    const newProduct = await ProductModel.create(productData)
    
    res.status(201).json({
      success: true,
      data: newProduct
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    })
  }
}

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id)
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }
    
    // Sanitize numeric fields sent từ frontend admin
    const updateData = { ...req.body }
    if (updateData.price !== undefined) updateData.price = parseFloat(updateData.price)
    if (updateData.costPrice !== undefined) {
      updateData.costPrice =
        updateData.costPrice === '' || updateData.costPrice === null
          ? null
          : parseFloat(updateData.costPrice)
    }
    if (updateData.originalPrice !== undefined) {
      updateData.originalPrice =
        updateData.originalPrice === '' || updateData.originalPrice === null
          ? null
          : parseFloat(updateData.originalPrice)
    }
    if (updateData.stock !== undefined) {
      updateData.stock = updateData.stock === '' || updateData.stock === null ? 0 : parseInt(updateData.stock, 10)
    }
    if (updateData.sale !== undefined) {
      updateData.sale = updateData.sale === '' || updateData.sale === null ? null : parseInt(updateData.sale, 10)
    }

    const updatedProduct = await ProductModel.update(req.params.id, updateData)
    
    res.status(200).json({
      success: true,
      data: updatedProduct
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    })
  }
}

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id)
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }
    
    await ProductModel.delete(req.params.id)
    
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    })
  }
}

