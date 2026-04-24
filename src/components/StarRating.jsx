import { useState } from 'react'

const StarRating = ({ rating, size = 'md', showNumber = false, interactive = false, onRatingChange }) => {
  const [hoverRating, setHoverRating] = useState(0)
  const [currentRating, setCurrentRating] = useState(rating || 0)

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl'
  }

  const handleClick = (value) => {
    if (interactive && onRatingChange) {
      setCurrentRating(value)
      onRatingChange(value)
    }
  }

  const handleMouseEnter = (value) => {
    if (interactive) {
      setHoverRating(value)
    }
  }

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0)
    }
  }

  const displayRating = hoverRating || currentRating

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
            className={`${sizeClasses[size]} ${
              interactive ? 'cursor-pointer' : ''
            } ${
              star <= displayRating
                ? 'text-yellow-400'
                : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
      </div>
      {showNumber && (
        <span className="text-gray-600 ml-2">
          {currentRating > 0 ? currentRating.toFixed(1) : '0.0'}
        </span>
      )}
    </div>
  )
}

export default StarRating

