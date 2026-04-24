import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('cartItems')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems))
  }, [cartItems])

  const generateCartItemId = (product) => {
    return `${product.id}-${product.selectedSize || ''}-${product.selectedColor || ''}`
  }

  const addToCart = (product) => {
    setCartItems((prevItems) => {
      const cartItemId = generateCartItemId(product)
      const existingItemIndex = prevItems.findIndex((item) => generateCartItemId(item) === cartItemId)
      
      if (existingItemIndex >= 0) {
        const newItems = [...prevItems]
        newItems[existingItemIndex].quantity += (product.quantity || 1)
        return newItems
      }
      return [...prevItems, { ...product, quantity: product.quantity || 1, cartItemId }]
    })
  }

  const removeFromCart = (cartItemId) => {
    setCartItems((prevItems) => prevItems.filter((item) => generateCartItemId(item) !== cartItemId))
  }

  const updateQuantity = (cartItemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId)
      return
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        generateCartItemId(item) === cartItemId ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    setCartItems([])
  }

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

