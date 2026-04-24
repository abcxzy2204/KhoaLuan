import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import UserLayout from '../layouts/UserLayout'

const Profile = () => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    gender: 'Nam',
    phone: '',
    email: '',
  })
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        dob: user.dob ? user.dob.split('T')[0] : '',
        gender: user.gender || 'Nam',
        phone: user.phone || '',
        email: user.email || '',
      })
      setAvatarPreview(user.avatar || null)
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // In a real app, you would upload this file to a server or cloud storage
      // Here we just use a local object URL for preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isEditing) {
      setIsEditing(true)
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...formData, avatar: avatarPreview }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' })
        setIsEditing(false)
        // Refresh page to get latest user info from AuthContext
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setMessage({ type: 'error', text: data.message || 'Cố lỗi xảy ra' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Không thể kết nối với máy chủ' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <UserLayout>
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 h-full">
        <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
          <h2 className="text-xl font-bold text-gray-800">Thông tin cá nhân</h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-500 hover:text-blue-700 flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <span>📝</span> Chỉnh sửa thông tin
            </button>
          ) : (
             <button
              onClick={() => setIsEditing(false)}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-2 text-sm font-medium transition-colors"
            >
              Hủy
            </button>
          )}
        </div>

        {message.text && (
          <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-10">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 rounded-full mb-4 bg-[#8b7355] flex items-center justify-center text-white text-4xl shadow-md">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                (formData.name || 'U').charAt(0).toUpperCase()
              )}
              
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer border border-gray-200 hover:bg-gray-50 transition-colors">
                  <span className="text-blue-500 text-sm">📷</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                </label>
              )}
            </div>
            <p className="text-xs text-gray-500 mb-1">Click vào icon để đổi ảnh</p>
          </div>

          {/* Form Fields Section */}
          <div className="flex-1 space-y-6">
            {/* Họ và tên */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                placeholder="Nhập họ và tên"
                required
              />
            </div>

            {/* Ngày sinh */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ngày sinh</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
              />
            </div>

            {/* Giới tính */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Giới tính</label>
              <div className="flex items-center gap-6 mt-2">
                <label className={`flex items-center gap-2 cursor-pointer ${!isEditing ? 'opacity-70' : ''}`}>
                  <input
                    type="radio"
                    name="gender"
                    value="Nam"
                    checked={formData.gender === 'Nam'}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-gray-700">Nam</span>
                </label>
                <label className={`flex items-center gap-2 cursor-pointer ${!isEditing ? 'opacity-70' : ''}`}>
                  <input
                    type="radio"
                    name="gender"
                    value="Nữ"
                    checked={formData.gender === 'Nữ'}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-gray-700">Nữ</span>
                </label>
              </div>
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
              <div className="flex gap-2">
                <div className="w-24 px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 flex items-center justify-center text-gray-500 font-medium">
                  VN +84
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                  placeholder="Nhập số điện thoại"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                placeholder="Nhập email"
              />
            </div>

            {isEditing && (
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors disabled:opacity-70"
                >
                  {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </UserLayout>
  )
}

export default Profile
