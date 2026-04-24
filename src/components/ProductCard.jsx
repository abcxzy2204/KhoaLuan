import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import StarRating from './StarRating'
import { useToast } from '../context/ToastContext'

const ProductCard = ({ product }) => {
  const { addToCart } = useCart()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [displayImage, setDisplayImage] = useState(product.image)

  const hasOptions = (product.colors && product.colors.length > 0) || (product.sizes && product.sizes.length > 0) || (product.variations && product.variations.length > 0)

  // Lấy danh sách màu duy nhất kèm mã màu và ảnh từ biến thể (sizes)
  const uniqueColors = useMemo(() => {
    if (!product.sizes || !Array.isArray(product.sizes)) return []
    
    const colorsMap = new Map()
    product.sizes.forEach(sizeVar => {
      if (sizeVar.colors && Array.isArray(sizeVar.colors)) {
        sizeVar.colors.forEach(c => {
          if (c.name && !colorsMap.has(c.name)) {
            colorsMap.set(c.name, {
              name: c.name,
              colorCode: c.colorCode,
              image: c.image
            })
          }
        })
      }
    })
    return Array.from(colorsMap.values())
  }, [product.sizes])

  const handleAddToCart = (e) => {
    e.preventDefault()
    if (hasOptions) {
      navigate(`/product/${product.id}`)
    } else {
      addToCart(product)
      addToast('Đã thêm sản phẩm vào giỏ hàng!', 'success')
    }
  }

  return (
    <div className="group [perspective:1200px] h-full">
      <div className="relative bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col h-full transition-all duration-500 shadow-[0_12px_28px_-20px_rgba(0,0,0,0.35),0_20px_40px_-34px_rgba(0,0,0,0.35)] group-hover:-translate-y-2 group-hover:shadow-[0_24px_56px_-24px_rgba(0,0,0,0.45),0_34px_64px_-40px_rgba(0,0,0,0.45)] group-hover:[transform:rotateX(3deg)_rotateY(-3deg)] [transform-style:preserve-3d] before:content-[''] before:absolute before:inset-0 before:pointer-events-none before:bg-[radial-gradient(1100px_280px_at_50%_-20%,rgba(91,202,232,0.12),transparent_55%)] before:opacity-70">
        <Link to={`/product/${product.id}`} className="block relative overflow-hidden">
          <img
            src={displayImage}
            alt={product.name}
            className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/20 opacity-70 pointer-events-none" />
          {product.sale && (
            <span className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              -{product.sale}%
            </span>
          )}
        </Link>
        <div className="p-5 flex flex-col flex-1 [transform:translateZ(18px)]">
        <Link to={`/product/${product.id}`}>
          <h3 className="text-lg font-bold mb-1 text-gray-900 hover:text-primary-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <p className="text-gray-500 text-sm mb-3 font-medium">{product.category}</p>

        <div className="flex-1">
          {/* Hiển thị ô màu (Visual Swatches) */}
          {uniqueColors.length > 0 ? (
            <div className="mb-4 flex flex-wrap gap-2">
              {uniqueColors.slice(0, 5).map((c, i) => {
                const hasColorCode = c.colorCode && c.colorCode !== '' && c.colorCode !== '#ffffff'
                return (
                  <div
                    key={i}
                    onMouseEnter={() => c.image && setDisplayImage(c.image)}
                    onMouseLeave={() => setDisplayImage(product.image)}
                    className="group/swatch relative"
                  >
                    {hasColorCode ? (
                      <div 
                        className="w-5 h-5 rounded-full border border-gray-200 cursor-pointer shadow-sm transition-transform hover:scale-125"
                        style={{ backgroundColor: c.colorCode }}
                      />
                    ) : (
                      <div className="px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-[10px] text-gray-500 cursor-default">
                        {c.name}
                      </div>
                    )}
                    {/* Tooltip nhỏ */}
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover/swatch:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {c.name}
                    </span>
                  </div>
                )
              })}
              {uniqueColors.length > 5 && (
                <span className="text-[10px] text-gray-400 font-bold self-center">
                  +{uniqueColors.length - 5}
                </span>
              )}
            </div>
          ) : product.colors && product.colors.length > 0 ? (
            // Fallback cho dữ liệu cũ chưa có hex/image chi tiết
            <div className="mb-3 flex flex-wrap gap-1.5">
              {product.colors.filter((c, i, self) => self.findIndex(v => (typeof v === 'object' ? v.name : v) === (typeof c === 'object' ? c.name : c)) === i).slice(0, 4).map((c, i) => {
                const colorName = typeof c === 'object' ? c.name : c;
                return (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-gray-50 rounded-md text-[11px] font-medium border border-gray-200 text-gray-600"
                  >
                    {colorName}
                  </span>
                )
              })}
            </div>
          ) : null}

          {(product.averageRating > 0 || product.ratingCount > 0) && (
            <div className="mb-3 flex items-center gap-2">
              <StarRating rating={product.averageRating || 0} size="sm" showNumber={true} />
              <span className="text-xs text-gray-500 font-medium">
                ({product.ratingCount || 0})
              </span>
            </div>
          )}
        </div>

        <div className="flex items-end justify-between mt-auto pt-4 mb-4">
          <div className="flex flex-col">
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through mb-0.5">
                {product.originalPrice.toLocaleString('vi-VN')}₫
              </span>
            )}
            <span className="text-xl font-extrabold text-primary-600">
              {product.price.toLocaleString('vi-VN')}₫
            </span>
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          className="w-full bg-primary-50 text-primary-700 font-bold py-2.5 rounded-xl hover:bg-primary-600 hover:text-white hover:shadow-lg transition-all active:scale-95"
        >
          {hasOptions ? 'Chọn tùy chọn' : 'Thêm vào giỏ'}
        </button>
      </div>
    </div>
    </div>
  )
}

export default ProductCard

