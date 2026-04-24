import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="mt-16 border-t border-gray-100 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-extrabold tracking-tight mb-3">
              <span className="text-[#5bcae8]">Ricky</span>{' '}
              <span className="text-[#f272a8]">Baby</span>
            </h3>
            <p className="text-gray-500 leading-relaxed text-sm">
              Thời trang trẻ em mềm mại, an toàn và dễ thương cho từng giai đoạn phát triển của bé.
            </p>
          </div>

          <div>
            <h4 className="text-base font-bold text-gray-800 mb-3">Liên hệ</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p>📞 0983037644</p>
              <p>📧 quanggminkh@gmail.com</p>
              <p>📍 68 Nguyễn Chí Thanh, Hà Nội</p>
            </div>
          </div>

          <div>
            <h4 className="text-base font-bold text-gray-800 mb-3">Khám phá</h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/products" className="text-gray-600 hover:text-primary-700 transition">Sản phẩm</Link>
              <Link to="/about" className="text-gray-600 hover:text-primary-700 transition">Giới thiệu</Link>
              <Link to="/contact" className="text-gray-600 hover:text-primary-700 transition">Liên hệ</Link>
              <Link to="/cart" className="text-gray-600 hover:text-primary-700 transition">Giỏ hàng</Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">© 2026 Ricky Baby. All rights reserved.</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="px-2 py-1 rounded-full bg-white border border-gray-200">Thanh toán linh hoạt</span>
            <span className="px-2 py-1 rounded-full bg-white border border-gray-200">Giao hàng toàn quốc</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

