import React, { useState } from 'react'
import UserLayout from '../layouts/UserLayout'

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.newPassword !== formData.confirmPassword) {
      return setMessage({ type: 'error', text: 'Mật khẩu mới không khớp!' })
    }
    
    if (formData.newPassword.length < 6) {
      return setMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự.' })
    }

    try {
      setLoading(true)
      setMessage({ type: '', text: '' })
      
      const token = localStorage.getItem('token')
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' })
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setMessage({ type: 'error', text: data.message || 'Đổi mật khẩu thất bại' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi kết nối máy chủ' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <UserLayout>
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 min-h-[500px]">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Đổi Mật Khẩu</h2>
        
        {message.text && (
          <div className={`p-4 rounded-md mb-6 font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-md">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Mật khẩu hiện tại <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-blue-500"
              required
              minLength="6"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Xác nhận mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-blue-500"
              required
              minLength="6"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-[#8b7355] text-white px-6 py-2 rounded-md hover:bg-[#7a6549] transition-colors disabled:opacity-50"
          >
            {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </form>
      </div>
    </UserLayout>
  )
}

export default ChangePassword
