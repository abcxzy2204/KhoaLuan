import StarRating from './StarRating'
import { useAuth } from '../context/AuthContext'

const ReviewList = ({ reviews, onDelete }) => {
  const { user } = useAuth()

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Chưa có đánh giá nào cho sản phẩm này.</p>
        <p className="text-sm mt-2">Hãy là người đầu tiên đánh giá!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-semibold text-gray-900">{review.userName}</span>
                <StarRating rating={review.rating} size="sm" />
              </div>
              <p className="text-sm text-gray-500">
                {formatDate(review.createdAt)}
              </p>
            </div>
            {user && user.id === review.userId && onDelete && (
              <button
                onClick={() => onDelete(review.id)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Xóa
              </button>
            )}
          </div>
          {review.comment && (
            <p className="text-gray-700 mt-2">{review.comment}</p>
          )}
        </div>
      ))}
    </div>
  )
}

export default ReviewList

