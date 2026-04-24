import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { fetchProducts } from '../api/client'

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    setError(false)
    const list = await fetchProducts(5, 'popular')
    setFeaturedProducts(list)
    if (list.length === 0) setError(true)
    setLoading(false)
  }

  return (
    <div className="bg-[radial-gradient(1200px_500px_at_50%_-10%,rgba(91,202,232,0.10),transparent_55%),radial-gradient(900px_450px_at_10%_15%,rgba(242,114,168,0.08),transparent_45%),#fff]">
      {/* Master Hero Banner Section */}
      <section className="bg-transparent flex items-center justify-center p-3 md:p-4">
        <div className="container mx-auto max-w-7xl relative rounded-2xl overflow-hidden border border-white/60 shadow-[0_22px_50px_-20px_rgba(0,0,0,0.35)] [perspective:1400px]">
          {/* Using a placeholder kids coat image similar to the mockup */}
          <div 
            className="w-full h-[300px] md:h-[450px] lg:h-[500px] bg-cover bg-center flex items-center relative [transform-style:preserve-3d] transition-transform duration-700 hover:[transform:rotateX(3deg)_rotateY(-3deg)]"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=1200')" }}
          >
            {/* The mockup has illustrative graphics, so we create a semi-transparent overlay box on the left */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/40 to-transparent"></div>
            
            <div className="relative z-10 p-5 md:p-16 max-w-lg">
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-[#f272a8] drop-shadow-sm mb-1 md:mb-2 uppercase leading-tight">
                Khuyến mại
              </h2>
              <h2 className="text-xl sm:text-2xl md:text-5xl font-bold text-orange-400 drop-shadow-sm mb-5 md:mb-8 uppercase">
                Dành riêng cho bé
              </h2>
              <Link
                to="/products"
                className="bg-[#8dc63f] text-white px-5 py-2.5 md:py-4 md:px-10 rounded-full font-bold text-sm sm:text-base md:text-xl shadow-lg hover:bg-[#7ab133] transition transform hover:scale-105 inline-block border-4 border-white"
              >
                Xem ngay
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sub-Banners Grid */}
      <section className="container mx-auto px-4 max-w-7xl relative -mt-4 z-20 mb-16 [perspective:1200px]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Sub Banner 1 - Blue */}
          <Link to="/products" className="block relative h-48 rounded-2xl overflow-hidden border border-white/60 shadow-[0_14px_30px_-18px_rgba(0,0,0,0.35)] group transform transition duration-500 hover:-translate-y-2 hover:[transform:rotateX(4deg)_rotateY(-4deg)]">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=400')" }}
            ></div>
            <div className="absolute inset-0 bg-[#2863a9]/60 group-hover:bg-[#2863a9]/50 transition-colors"></div>
            <div className="absolute inset-0 p-6 flex items-center">
              <div className="text-white">
                <h3 className="text-3xl font-extrabold drop-shadow-md leading-tight">Giày xinh<br/>cho <span className="text-[#f272a8] text-4xl">BÉ</span></h3>
              </div>
            </div>
          </Link>

          {/* Sub Banner 2 - Pink Concept */}
          <Link to="/products" className="block relative h-48 rounded-2xl overflow-hidden border border-white/60 shadow-[0_14px_30px_-18px_rgba(0,0,0,0.35)] group transform transition duration-500 hover:-translate-y-2 hover:[transform:rotateX(4deg)_rotateY(-4deg)]">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&q=80&w=400')" }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-r from-white/90 to-transparent"></div>
            <div className="absolute inset-0 p-6 flex flex-col justify-center">
               <div className="flex items-center gap-1 mb-2 text-[#5bcae8] font-black text-xl">
                 Ricky 👶 Baby
               </div>
               <div className="bg-[#f272a8] w-24 h-24 rounded-full flex flex-col items-center justify-center text-white shadow-lg transform rotate-[-10deg]">
                 <span className="font-bold text-sm uppercase">Giảm tới</span>
                 <span className="font-extrabold text-2xl drop-shadow">40%</span>
               </div>
            </div>
          </Link>

          {/* Sub Banner 3 - Cyan Kid */}
          <Link to="/products" className="block relative h-44 sm:h-48 rounded-xl overflow-hidden shadow-md group transform transition hover:-translate-y-1">
             <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519340333755-56e9c1d04079?auto=format&fit=crop&q=80&w=400')" }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-l from-[#5bcae8]/90 via-[#5bcae8]/60 to-transparent"></div>
            <div className="absolute inset-0 p-6 flex items-center justify-end">
              <div className="text-white text-right">
                <h3 className="text-xl font-bold drop-shadow-md uppercase text-[#fff]">Tất cả</h3>
                <h3 className="text-2xl font-bold drop-shadow-md uppercase">dành cho</h3>
                <h3 className="text-5xl font-black drop-shadow-lg text-white">CON</h3>
              </div>
            </div>
          </Link>
          
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 max-w-7xl py-12">
        <div className="bg-white/80 backdrop-blur-sm border border-white/70 rounded-2xl p-6 md:p-8 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800">Sản phẩm nổi bật</h2>
            <span className="text-xs md:text-sm px-3 py-1 rounded-full bg-primary-50 text-primary-700 font-semibold">Bán chạy nhất</span>
          </div>
          <p className="text-gray-500 mt-[-12px] mb-8 text-sm md:text-base">Những mẫu được ba mẹ yêu thích nhất tuần này.</p>
        
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Đang tải sản phẩm...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Không tải được sản phẩm. Hãy chạy backend và MySQL.</p>
            <button
              type="button"
              onClick={loadProducts}
              className="bg-[#5bcae8] text-white px-4 py-2 rounded hover:bg-[#48accd]"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        <div className="text-center mt-12">
          <Link
            to="/products"
            className="inline-block border border-[#5bcae8] text-[#5bcae8] hover:bg-[#5bcae8] hover:text-white px-8 py-3 rounded uppercase font-semibold transition"
          >
            Xem tất cả sản phẩm
          </Link>
        </div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="container mx-auto px-4 max-w-7xl py-12">
        <div className="flex flex-col md:flex-row gap-10 items-center bg-pink-50/70 rounded-2xl p-8 md:p-12 border border-pink-100 shadow-sm relative overflow-hidden">
          {/* Background Decor */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-100 rounded-full opacity-50 -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#5bcae8]/20 rounded-full opacity-50 translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

          <div className="w-full md:w-1/2 relative z-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-4 leading-tight">Ricky Baby - <span className="text-[#f272a8]">Nâng niu</span> bước chân thiên thần</h2>
            <p className="text-gray-600 mb-6 text-lg leading-relaxed">
              Từ những bước chập chững đầu đời cho đến những ngày tung tăng tới trường, Ricky Baby tự hào mang đến những sản phẩm giày dép không chỉ thời trang, đáng yêu mà còn đảm bảo chất lượng, bảo vệ đôi bàn chân non nớt của bé trong mọi hoạt động.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-gray-700 font-medium">
                <span className="w-6 h-6 rounded-full bg-[#5bcae8] text-white flex items-center justify-center text-sm font-bold">✓</span> Chất liệu êm ái, thoáng khí cho mùa hè
              </li>
              <li className="flex items-center gap-3 text-gray-700 font-medium">
                <span className="w-6 h-6 rounded-full bg-[#f272a8] text-white flex items-center justify-center text-sm font-bold">✓</span> Thiết kế đế chống trơn trượt an toàn tuyệt đối
              </li>
              <li className="flex items-center gap-3 text-gray-700 font-medium">
                <span className="w-6 h-6 rounded-full bg-orange-400 text-white flex items-center justify-center text-sm font-bold">✓</span> Đa dạng mẫu mã, cập nhật xu hướng liên tục
              </li>
            </ul>
            <Link to="/about" className="bg-[#5bcae8] text-white px-8 py-3 rounded-full font-bold uppercase tracking-wider hover:bg-[#48accd] transition shadow-md inline-flex items-center gap-2">
              Tìm hiểu thêm về chúng tôi <span className="text-xl">→</span>
            </Link>
          </div>
          <div className="w-full md:w-1/2 relative z-10 mt-8 md:mt-0">
            <div className="w-full h-[350px] bg-white p-2 rounded-2xl shadow-xl relative z-10 transform rotate-2 hover:rotate-0 transition duration-500">
               <img src="https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?auto=format&fit=crop&q=80&w=800" alt="Giày trẻ em" className="w-full h-full object-cover rounded-xl" />
            </div>
            <div className="absolute -bottom-6 -right-6 w-full h-[350px] border-4 border-[#f272a8] rounded-2xl z-0 hidden md:block opacity-30"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-[#fcf8fa] py-16 mt-12 border-t border-pink-50">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="text-4xl mb-4">🚚</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Giao Hàng Nhanh</h3>
              <p className="text-gray-500 text-sm">Giao hàng toàn quốc trong 24-48h</p>
            </div>
            <div className="text-center bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Chất Lượng Đảm Bảo</h3>
              <p className="text-gray-500 text-sm">100% hàng chính hãng, an toàn tuyệt đối</p>
            </div>
            <div className="text-center bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="text-4xl mb-4">💳</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Thanh Toán Dễ Dàng</h3>
              <p className="text-gray-500 text-sm">Nhiều phương thức linh hoạt tiện lợi</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
