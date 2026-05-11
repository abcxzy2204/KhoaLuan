import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { fetchProducts as fetchProductsApi } from '../api/client'

const Products = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSize, setSelectedSize] = useState('all')
  const [selectedPriceRange, setSelectedPriceRange] = useState('all')
  const [showFiltersMobile, setShowFiltersMobile] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const initialQuery = searchParams.get('q') || ''
    setSearchTerm(initialQuery)
    loadProducts()

    const handleFocus = () => {
      loadProducts()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  useEffect(() => {
    const query = searchParams.get('q') || ''
    if (query !== searchTerm) {
      setSearchTerm(query)
    }
  }, [searchParams])

  const loadProducts = async () => {
    setLoading(true)
    const list = await fetchProductsApi()
    setProducts(list)
    setLoading(false)
  }

  const categories = ['all', 'Áo', 'Quần', 'Đầm', 'Phụ kiện']

  const allSizes = Array.from(
    new Set(
      products.flatMap((product) => {
        if (!Array.isArray(product?.sizes)) return []
        return product.sizes.map((s) => (typeof s === 'string' ? s : s?.size)).filter(Boolean)
      })
    )
  )

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'all' || product.category === selectedCategory

    const normalizedSearch = searchTerm.toLowerCase().trim()
    const matchesSearch =
      normalizedSearch === '' ||
      product.name.toLowerCase().includes(normalizedSearch) ||
      product.category.toLowerCase().includes(normalizedSearch)

    const productSizes = Array.isArray(product?.sizes)
      ? product.sizes.map((s) => (typeof s === 'string' ? s : s?.size)).filter(Boolean)
      : []

    const matchesSize =
      selectedSize === 'all' || productSizes.some((s) => String(s).toLowerCase() === selectedSize.toLowerCase())

    const price = Number(product.price) || 0
    const matchesPrice =
      selectedPriceRange === 'all' ||
      (selectedPriceRange === 'under100' && price < 100000) ||
      (selectedPriceRange === '100to200' && price >= 100000 && price <= 200000) ||
      (selectedPriceRange === '200to500' && price > 200000 && price <= 500000) ||
      (selectedPriceRange === 'over500' && price > 500000)

    return matchesCategory && matchesSearch && matchesSize && matchesPrice
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 rounded-3xl border border-primary-100 bg-gradient-to-r from-white to-primary-50/40 p-6 md:p-8 shadow-sm">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800">Tất Cả Sản Phẩm</h1>
        <p className="text-sm md:text-base text-gray-500 mt-2">Khám phá bộ sưu tập thời trang cho bé với thiết kế mềm mại và thoải mái.</p>
      </div>

      <div className="lg:hidden mb-4">
        <button
          type="button"
          onClick={() => setShowFiltersMobile((prev) => !prev)}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm"
        >
          {showFiltersMobile ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className={`${showFiltersMobile ? 'block' : 'hidden'} lg:block lg:col-span-1 bg-white/95 border border-gray-100 rounded-2xl p-5 h-fit lg:sticky lg:top-24 shadow-[0_12px_30px_-22px_rgba(0,0,0,0.45)]`}>
          <h2 className="text-lg font-bold mb-4 text-gray-800">Bộ lọc</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Tìm kiếm</label>
              <input
                type="text"
                placeholder="Tên sản phẩm..."
                value={searchTerm}
                onChange={(e) => {
                  const value = e.target.value
                  setSearchTerm(value)
                  setSearchParams(value.trim() ? { q: value.trim() } : {})
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>


            <div>
              <label className="block text-sm font-semibold mb-2">Size</label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="all">Tất cả size</option>
                {allSizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Khoảng giá</label>
              <select
                value={selectedPriceRange}
                onChange={(e) => setSelectedPriceRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="all">Tất cả mức giá</option>
                <option value="under100">Dưới 100.000đ</option>
                <option value="100to200">100.000đ - 200.000đ</option>
                <option value="200to500">200.000đ - 500.000đ</option>
                <option value="over500">Trên 500.000đ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Danh mục</label>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition ${
                      selectedCategory === category
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category === 'all' ? 'Tất cả' : category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                  <div className="h-56 bg-gray-100" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-4 bg-gray-100 rounded w-1/3" />
                    <div className="h-10 bg-gray-100 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">Không tìm thấy sản phẩm nào.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default Products
