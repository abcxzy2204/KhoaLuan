import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import StarRating from '../components/StarRating'
import ReviewForm from '../components/ReviewForm'
import ReviewList from '../components/ReviewList'
import { useToast } from '../context/ToastContext'

const ProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { addToast } = useToast()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [reviews, setReviews] = useState([])
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    ratingCount: 0,
    ratingDistribution: {}
  })
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [copySuccess, setCopySuccess] = useState(false)
  const [selectedImage, setSelectedImage] = useState('')

  useEffect(() => {
    fetchProduct()
    fetchReviews()
  }, [id])

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${id}`)
      const result = await response.json()
      // API trả về { success, data } hoặc object trực tiếp (fallback)
      const productData = result.data || result

      // Migrate sang variations
      let parsedVariations = [];
      if (Array.isArray(productData.sizes) && productData.sizes.length > 0 && productData.sizes[0].colors) {
        parsedVariations = productData.sizes;
      } else {
        const oldColors = Array.isArray(productData.colors) ? productData.colors.map(c => typeof c === 'string' ? { name: c, stock: 0 } : { name: c.name || '', stock: c.stock || 0 }) : [];
        const oldSizes = Array.isArray(productData.sizes) ? productData.sizes.map(s => typeof s === 'string' ? s : s.name) : [];
        if (oldSizes.length > 0) {
          parsedVariations = oldSizes.map(s => ({
            size: s,
            colors: oldColors.length > 0 ? [...oldColors] : [{ name: 'Mặc định', stock: productData.stock || 0 }]
          }))
        } else if (oldColors.length > 0) {
          parsedVariations = [{ size: 'Free Size', colors: [...oldColors] }]
        } else {
          parsedVariations = [{ size: 'Mặc định', colors: [{ name: 'Mặc định', stock: productData.stock || 0 }] }]
        }
      }
      productData.variations = parsedVariations;

      setProduct(productData)
      if (parsedVariations.length > 0) {
        setSelectedSize(parsedVariations[0].size)
        if (parsedVariations[0].colors.length > 0) {
          const firstColor = parsedVariations[0].colors.find(c => c.stock > 0) || parsedVariations[0].colors[0];
          setSelectedColor(firstColor.name)
          setSelectedImage(firstColor.image || productData.image || '')
        }
      } else {
        setSelectedImage(productData.image || '')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true)
      const response = await fetch(`/api/products/${id}/reviews`)
      const result = await response.json()
      if (result.success) {
        setReviews(result.data.reviews || [])
        setReviewStats({
          averageRating: result.data.averageRating || 0,
          ratingCount: result.data.ratingCount || 0,
          ratingDistribution: result.data.ratingDistribution || {}
        })
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setReviewsLoading(false)
    }
  }

  const handleReviewSubmitted = () => {
    fetchReviews()
    // Refresh product to get updated rating
    fetchProduct()
  }

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()
      if (result.success) {
        addToast('Đã xóa đánh giá thành công', 'success')
        fetchReviews()
        fetchProduct()
      } else {
        addToast(result.message || 'Có lỗi xảy ra', 'error')
      }
    } catch (error) {
      console.error('Error deleting review:', error)
      addToast('Có lỗi xảy ra khi xóa đánh giá', 'error')
    }
  }

  const handleAddToCart = () => {
    if (!product) return

    // Check variation stock
    const currentVar = product.variations.find(v => v.size === selectedSize);
    if (!currentVar) return addToast('Size không hợp lệ', 'error');
    const currentColor = currentVar.colors.find(c => c.name === selectedColor);
    if (!currentColor) return addToast('Màu không hợp lệ', 'error');
    if (quantity > currentColor.stock) return addToast(`Số lượng vượt quá tồn kho (Kho còn ${currentColor.stock})`, 'error');

    for (let i = 0; i < quantity; i++) {
      addToCart({ ...product, selectedSize, selectedColor })
    }
    addToast('Đã thêm sản phẩm vào giỏ hàng!', 'success')
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-600">Đang tải sản phẩm...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-600 text-lg">Không tìm thấy sản phẩm.</p>
        <button
          onClick={() => navigate('/products')}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          Quay lại danh sách sản phẩm
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 rounded-2xl border border-primary-100 bg-gradient-to-r from-white to-primary-50/40 p-4 md:p-5">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-600 hover:text-primary-700 flex items-center gap-2 font-semibold transition-colors"
        >
          &larr; Quay lại phần trước
        </button>
      </div>

      <div className="mb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          <div className="lg:col-span-7">
            <div className="rounded-2xl overflow-hidden bg-black border border-gray-200">
              <img
                src={selectedImage || product.image}
                alt={product.name}
                className="w-full aspect-[4/5] object-cover"
              />
            </div>

            <div className="grid grid-cols-3 gap-3 mt-3">
              {[
                selectedImage || product.image,
                ...(product.galleryImages || []),
              ].filter(Boolean).slice(0, 3).map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  onClick={() => setSelectedImage(img)}
                  className={`rounded-xl overflow-hidden border transition ${selectedImage === img ? 'border-primary-600 ring-2 ring-primary-100' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <img src={img} alt={`${product.name}-${idx}`} className="w-full aspect-square object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <p className="text-xs tracking-[0.16em] uppercase text-gray-400 font-semibold">Sản phẩm cao cấp</p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mt-1">{product.name}</h1>

            <div className="mt-4 flex items-end gap-3">
              <span className="text-2xl md:text-3xl font-bold text-gray-900">{product.price.toLocaleString('vi-VN')}₫</span>
              {product.originalPrice && (
                <span className="text-base text-gray-400 line-through">{product.originalPrice.toLocaleString('vi-VN')}₫</span>
              )}
            </div>

            <div className="mt-4 text-sm text-gray-600">Màu sắc: <span className="font-semibold text-gray-800">{selectedColor || 'Mặc định'}</span></div>

            {product.variations && product.variations.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {(() => {
                  const currentVar = product.variations.find(v => v.size === selectedSize) || product.variations[0]
                  if (!currentVar) return null
                  if (currentVar.colors.length === 1 && currentVar.colors[0].name === 'Mặc định') return null

                  return currentVar.colors.map((c, i) => {
                    const isOutOfStock = c.stock <= 0
                    const hasColorCode = c.colorCode && c.colorCode !== ''

                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => {
                          setSelectedColor(c.name)
                          setSelectedImage(c.image || product.image)
                        }}
                        className={`w-8 h-8 rounded-full border-2 transition ${selectedColor === c.name ? 'border-gray-900 ring-2 ring-gray-200' : 'border-gray-200'} ${isOutOfStock ? 'opacity-40 cursor-not-allowed' : ''}`}
                        style={hasColorCode ? { backgroundColor: c.colorCode } : undefined}
                        title={c.name}
                      >
                        {!hasColorCode && <span className="text-[10px] text-gray-700">{c.name.slice(0, 1)}</span>}
                      </button>
                    )
                  })
                })()}
              </div>
            )}

            {product.variations && product.variations.length > 0 && product.variations[0].size && product.variations[0].size !== 'Mặc định' && (
              <div className="mt-5">
                <p className="text-sm font-medium text-gray-700 mb-2">Chọn kích cỡ</p>
                <div className="flex flex-wrap gap-2">
                  {product.variations.map((v, i) => {
                    const isOutOfStock = v.colors.every(c => c.stock <= 0)
                    return (
                      <button
                        key={i}
                        disabled={isOutOfStock}
                        onClick={() => {
                          setSelectedSize(v.size)
                          const firstAvailable = v.colors.find(c => c.stock > 0) || v.colors[0]
                          if (firstAvailable) {
                            setSelectedColor(firstAvailable.name)
                            setSelectedImage(firstAvailable.image || product.image)
                          }
                        }}
                        className={`px-4 py-2 rounded-full border text-sm font-semibold transition ${selectedSize === v.size ? 'bg-amber-200 border-amber-200 text-gray-900' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'} ${isOutOfStock ? 'opacity-50 line-through cursor-not-allowed' : ''}`}
                      >
                        {v.size}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <div className="flex items-center border rounded-full overflow-hidden">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 text-gray-600 hover:bg-gray-50">-</button>
                <span className="px-4 text-sm font-semibold">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-2 text-gray-600 hover:bg-gray-50">+</button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full mt-5 bg-gradient-to-r from-[#2e83bf] to-[#64b5e6] text-white py-3 rounded-xl font-semibold hover:opacity-95 transition"
            >
              Thêm vào giỏ hàng
            </button>

            <button className="w-full mt-3 border border-gray-200 bg-white text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition">
              Yêu thích
            </button>

            {(product.averageRating > 0 || product.ratingCount > 0) && (
              <div className="mt-6 flex items-center gap-3">
                <StarRating rating={product.averageRating || 0} size="md" showNumber={true} />
                <span className="text-sm text-gray-500">({product.ratingCount || 0} đánh giá)</span>
              </div>
            )}

            {product.description && (
              <div className="mt-6 border-t pt-5">
                <h3 className="font-semibold text-gray-900 mb-2">Chất liệu & Thiết kế</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Đánh Giá Sản Phẩm</h2>

        {/* Review Stats */}
        {reviewStats.ratingCount > 0 && (
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-600">
                  {reviewStats.averageRating.toFixed(1)}
                </div>
                <StarRating rating={reviewStats.averageRating} size="md" />
                <div className="text-sm text-gray-600 mt-2">
                  {reviewStats.ratingCount} đánh giá
                </div>
              </div>
              <div className="flex-1">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviewStats.ratingDistribution[star] || 0
                  const percentage = reviewStats.ratingCount > 0
                    ? (count / reviewStats.ratingCount) * 100
                    : 0
                  return (
                    <div key={star} className="flex items-center gap-2 mb-2">
                      <span className="text-sm w-12">{star} sao</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-12">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Review Form */}
        <div className="mb-8">
          <ReviewForm productId={id} onReviewSubmitted={handleReviewSubmitted} />
        </div>

        {/* Reviews List */}
        {reviewsLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Đang tải đánh giá...</p>
          </div>
        ) : (
          <ReviewList reviews={reviews} onDelete={handleDeleteReview} />
        )}
      </div>
    </div>
  )
}

export default ProductDetail

