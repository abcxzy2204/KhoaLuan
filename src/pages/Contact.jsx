import React, { useState } from 'react'
import { useToast } from '../context/ToastContext'

const Contact = () => {
  const { addToast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    message: ''
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        addToast('Cảm ơn bạn đã liên hệ! Chúng tôi đã nhận được tin và sẽ phản hồi sớm nhất có thể.', 'success')
        setFormData({
          name: '', email: '', phone: '', address: '', message: ''
        })
      } else {
        addToast(data.message || 'Có lỗi xảy ra, vui lòng thử lại sau.', 'error')
      }
    } catch (error) {
      console.error('Error submitting contact:', error)
      addToast('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối.', 'error')
    }
  }

  return (
    <div className="bg-white">
      {/* Top Banner similar to image */}
      <section className="bg-pink-50 flex items-center justify-center p-4">
        <div className="container mx-auto max-w-7xl">
          <div
            className="w-full h-[250px] md:h-[350px] bg-cover bg-center rounded-xl overflow-hidden shadow-sm flex items-center justify-center relative"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=1200')" }}
          >
            <div className="absolute inset-0 bg-white/70"></div>
            <div className="relative z-10 text-center bg-white/90 p-8 rounded-2xl border-4 border-[#f272a8] shadow-lg max-w-lg">
              <p className="text-[#f272a8] font-bold mb-1 uppercase tracking-wider text-sm">Khuyến mại tới 40%</p>
              <h1 className="bg-[#f272a8] text-white text-2xl md:text-3xl font-extrabold py-2 px-6 rounded my-3 uppercase shadow">
                Thời trang trẻ em
              </h1>
              <h2 className="text-[#5bcae8] text-3xl md:text-4xl font-extrabold uppercase leading-tight drop-shadow-sm">
                Rẻ - Đẹp<br />Chất lượng
              </h2>
              <p className="text-gray-600 font-medium mt-3">Giao hàng COD toàn quốc</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-7xl py-12">
        <div className="flex flex-col md:flex-row gap-12">

          {/* Left Side: Contact Info */}
          <div className="w-full md:w-1/2">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Thông tin liên hệ:</h2>
            <ul className="space-y-4 text-gray-700">
              <li className="flex gap-3">
                <span className="text-xl">▪</span>
                <span><strong className="text-[#5bcae8]">Ricky Baby</strong> (Thời trang giày dép cho bé)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-xl">▪</span>
                <span>Địa chỉ: 68 Nguyễn Chí Thanh, Hà Nội</span>
              </li>
              <li className="flex gap-3">
                <span className="text-xl">▪</span>
                <span>Điện thoại: 0983037644</span>
              </li>
              <li className="flex gap-3">
                <span className="text-xl">▪</span>
                <span>Fanpage: https://www.facebook.com/r1ckkyy/</span>
              </li>
              <li className="flex gap-3">
                <span className="text-xl">▪</span>
                <span>STK: 0983037644</span>
              </li>
              <li className="flex gap-3">
                <span className="text-xl">▪</span>
                <span>Chủ tài khoản: Nguyễn Quang Minh</span>
              </li>
              <li className="flex gap-3">
                <span className="text-xl">▪</span>
                <span>Ngân hàng mbbank</span>
              </li>
            </ul>
          </div>

          {/* Right Side: Contact Form */}
          <div className="w-full md:w-1/2">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  name="name"
                  placeholder="Họ và tên..."
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded focus:outline-none focus:border-[#5bcae8] bg-gray-50"
                />
              </div>
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Địa chỉ email..."
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded focus:outline-none focus:border-[#5bcae8] bg-gray-50"
                />
              </div>
              <div>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Số điện thoại..."
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded focus:outline-none focus:border-[#5bcae8] bg-gray-50"
                />
              </div>
              <div>
                <input
                  type="text"
                  name="address"
                  placeholder="Địa chỉ của bạn..."
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded focus:outline-none focus:border-[#5bcae8] bg-gray-50"
                />
              </div>
              <div>
                <textarea
                  name="message"
                  placeholder="Nội dung liên hệ..."
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-200 rounded focus:outline-none focus:border-[#5bcae8] bg-gray-50 resize-y"
                ></textarea>
              </div>
              <button
                type="submit"
                className="bg-[#f272a8] text-white px-8 py-3 rounded font-bold uppercase transition hover:bg-pink-500 shadow-md inline-block mt-2"
              >
                GỬI LIÊN HỆ
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Google Map Embedded iframe for 68 Nguyen Chi Thanh */}
      <section className="w-full bg-gray-100 border-t border-gray-200">
        <iframe
          title="Bản đồ vị trí"
          src="https://www.google.com/maps?q=68+Nguyen+Chi+Thanh,+Dong+Da,+Ha+Noi&output=embed"
          width="100%"
          height="450"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </section>
    </div>
  )
}

export default Contact
