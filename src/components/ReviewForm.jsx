import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import StarRating from './StarRating'
import { useNavigate } from 'react-router-dom'

const ReviewForm = ({ productId, onReviewSubmitted }) => {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (rating === 0) {
      setError('Vui lòng chọn số sao đánh giá')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating, comment })
      })

      const result = await response.json()

      if (result.success) {
        setRating(0)
        setComment('')
        if (onReviewSubmitted) {
          onReviewSubmitted()
        }
      } else {
        setError(result.message || 'Có lỗi xảy ra khi gửi đánh giá')
      }
    } catch (error) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg text-center">
        <p className="text-gray-600 mb-4">Vui lòng đăng nhập để đánh giá sản phẩm</p>
        <button
          onClick={() => navigate('/login')}
          className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
        >
          Đăng Nhập
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg">
      <h3 className="text-xl font-semibold mb-4">Viết đánh giá</h3>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2">Đánh giá của bạn:</label>
        <StarRating
          rating={rating}
          interactive={true}
          onRatingChange={setRating}
          size="lg"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="comment" className="block text-sm font-semibold mb-2">
          Nhận xét (tùy chọn):
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
        />
      </div>

      <button
        type="submit"
        disabled={loading || rating === 0}
        className="bg-primary-600 text-white px-6 py-2 rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
      </button>
    </form>
  )
}

export default ReviewForm

