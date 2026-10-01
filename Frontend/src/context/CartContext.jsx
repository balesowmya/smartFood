import { createContext, useContext, useEffect, useState } from 'react'

const CartContext = createContext(null)
const CART_KEY = 'smartFoodCart'

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || '[]')
    return Array.isArray(saved) ? saved.filter((item) => item && item.available !== false && item.quantity > 0) : []
  } catch { return [] }
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(loadCart)

  useEffect(() => {
    try { if (cartItems.length) localStorage.setItem(CART_KEY, JSON.stringify(cartItems)); else localStorage.removeItem(CART_KEY) } catch { /* Keep the in-memory cart usable when browser storage is unavailable. */ }
  }, [cartItems])

  function addToCart(item) {
    if (!item || item.available === false) return
    setCartItems((items) => {
      const existing = items.find((entry) => entry.id === item.id)
      if (existing) return items.map((entry) => entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry)
      return [...items, { id: item.id, name: item.name, price: item.price, image: item.image, quantity: 1, restaurantId: item.restaurantId, available: item.available }]
    })
  }

  const removeFromCart = (itemId) => setCartItems((items) => items.filter((item) => item.id !== itemId))
  const increaseQuantity = (itemId) => setCartItems((items) => items.map((item) => item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item))
  const decreaseQuantity = (itemId) => setCartItems((items) => items.flatMap((item) => item.id !== itemId ? [item] : item.quantity > 1 ? [{ ...item, quantity: item.quantity - 1 }] : []))
  const clearCart = () => { setCartItems([]); localStorage.removeItem(CART_KEY) }
  const calculateTotal = () => cartItems.reduce((total, item) => total + item.price * item.quantity, 0)

  const value = { cartItems, addToCart, removeFromCart, increaseQuantity, decreaseQuantity, clearCart, calculateTotal }
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside CartProvider')
  return context
}
