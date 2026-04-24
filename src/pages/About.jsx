import React from 'react'
import { Link } from 'react-router-dom'

const About = () => {
  return (
    <div className="bg-white">
      {/* Banner */}
      <div className="bg-[#5bcae8] text-white py-16 text-center">
        <h1 className="text-4xl font-extrabold uppercase mb-4 drop-shadow-md">Giới thiệu về Ricky Baby</h1>
        <p className="text-lg max-w-2xl mx-auto opacity-90">Nơi khởi nguồn cho những bước chân nhỏ xíu, vững chắc và đầy phong cách.</p>
      </div>

      <div className="container mx-auto px-4 max-w-5xl py-16">
        <div className="flex flex-col md:flex-row gap-12 items-center mb-20">
          <div className="w-full md:w-1/2">
            <img 
              src="https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?auto=format&fit=crop&q=80&w=800" 
              alt="Giày trẻ em chất lượng" 
              className="rounded-2xl shadow-lg w-full object-cover h-[400px]"
            />
          </div>
          <div className="w-full md:w-1/2 space-y-6">
            <div className="inline-block bg-pink-100 text-[#f272a8] px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
              Câu chuyện của chúng tôi
            </div>
            <h2 className="text-3xl font-extrabold text-gray-800 leading-tight">Mang đến những điều tuyệt vời nhất cho bé yêu</h2>
            <p className="text-gray-600 leading-relaxed text-lg">
              Được thành lập với tình yêu thương dành cho trẻ nhỏ, <strong>Ricky Baby</strong> hiểu rằng từng bước đi đầu đời của trẻ đều vô cùng quan trọng. Chúng tôi mang đến những sản phẩm giày dép không chỉ thời trang, bắt mắt mà còn phải an toàn và bảo vệ đôi chân non nớt của bé.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Với hơn 5 năm kinh nghiệm trong lĩnh vực thời trang trẻ em, Ricky Baby tự hào là điểm đến tin cậy của hàng ngàn bà mẹ bỉm sữa trên toàn quốc. Chúng tôi không ngừng cập nhật xu hướng và cam kết chất lượng tốt nhất.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center mb-16">
          <div className="p-8 border border-gray-100 rounded-xl bg-gray-50 hover:shadow-md transition">
            <div className="text-5xl mb-4">🛡️</div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Chất lượng hàng đầu</h3>
            <p className="text-gray-500 text-sm">Chất liệu êm ái, an toàn cho da nhạy cảm của bé, được kiểm định nghiêm ngặt.</p>
          </div>
          <div className="p-8 border border-gray-100 rounded-xl bg-gray-50 hover:shadow-md transition">
            <div className="text-5xl mb-4">🌟</div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Mẫu mã đa dạng</h3>
            <p className="text-gray-500 text-sm">Luôn tiên phong cập nhật các thiết kế thời trang mới nhất, đáng yêu nhất.</p>
          </div>
          <div className="p-8 border border-gray-100 rounded-xl bg-gray-50 hover:shadow-md transition">
            <div className="text-5xl mb-4">💖</div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Tận tâm phục vụ</h3>
            <p className="text-gray-500 text-sm">Đội ngũ tư vấn nhiệt tình, sẵn sàng hỗ trợ các mẹ chọn size giày chuẩn xác nhất cho bé.</p>
          </div>
        </div>
        
        <div className="bg-[#fcf8fa] rounded-2xl p-10 text-center border border-pink-50">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Hãy để chúng tôi đồng hành cùng sự phát triển của bé</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">Mua sắm ngay hôm nay để nhận được những ưu đãi tuyệt vời nhất dành cho bé yêu của bạn.</p>
          <Link to="/products" className="bg-[#f272a8] text-white px-8 py-3 rounded-full font-bold uppercase tracking-wider hover:bg-pink-500 transition shadow-md inline-block">
            Bắt đầu mua sắm
          </Link>
        </div>
      </div>
    </div>
  )
}

export default About
