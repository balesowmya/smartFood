import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Cart from '../components/Cart.jsx'
import { getApiError } from '../api/errors.js'
import api from '../api/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'

function CartPage() {
  const { cartItems, calculateTotal, clearCart } = useCart()
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const subtotal = calculateTotal()
  const deliveryFee = subtotal > 500 ? 0 : 40

  async function placeOrder() {
    if (!isLoggedIn) { navigate('/login'); return }
    const restaurantIds = [...new Set(cartItems.map((item) => item.restaurantId))]
    if (restaurantIds.length !== 1) { setError('Please order from one restaurant at a time.'); return }
    if (!deliveryAddress.trim()) { setError('Enter your delivery address to place the order.'); return }
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/orders', {
        restaurantId: restaurantIds[0],
        items: cartItems.map((item) => ({ menuItemId: item.id, quantity: item.quantity })),
        deliveryAddress: deliveryAddress.trim(),
      })
      clearCart()
      navigate(`/orders/${data.id}`)
    } catch (requestError) { setError(getApiError(requestError, 'Your order could not be placed. Your cart is still saved.')) }
    finally { setLoading(false) }
  }

  if (!cartItems.length) return <section className="empty-cart page-shell"><span className="empty-cart-icon">✳</span><span className="eyebrow">YOUR BAG IS WAITING</span><h1>Your cart is empty</h1><p>Looks like you haven’t found your new favorite yet.</p><Link className="button button-primary" to="/restaurants">Browse restaurants <span>→</span></Link></section>
  return <div className="page-shell cart-page"><span className="eyebrow">ALMOST TIME TO EAT</span><h1>Your bag<span className="heading-dot">.</span></h1><div className="cart-layout"><section className="cart-panel"><div className="cart-panel-head"><h2>Your items <span>({cartItems.reduce((sum, item) => sum + item.quantity, 0)})</span></h2><button className="text-button" onClick={clearCart}>Clear cart</button></div><Cart /><Link className="continue-link" to="/restaurants">← Continue shopping</Link></section>
      <aside className="order-summary"><span className="eyebrow">THE GOOD STUFF</span><h2>Order summary</h2><div className="summary-line"><span>Subtotal</span><span>₹{subtotal}</span></div><div className="summary-line"><span>Delivery fee</span><span>{deliveryFee === 0 ? <b className="free-delivery">Free Delivery</b> : `₹${deliveryFee}`}</span></div><div className="summary-total"><strong>Total</strong><strong>₹{subtotal + deliveryFee}</strong></div><p className="summary-note">{deliveryFee === 0 ? 'Nice! Delivery is on us for this order.' : `Add items worth ₹${501 - subtotal} for free delivery.`}</p><label className="address-field">Delivery address<textarea rows="3" value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} placeholder="House, street, area, city" /></label>{error && <p className="form-message form-error" role="alert">{error}</p>}<button className="button button-primary checkout-button" disabled={loading} onClick={placeOrder}>{loading ? 'Placing order…' : 'Place order'} <span>→</span></button><div className="secure-note">♡ &nbsp;Prices and availability are verified by the kitchen.</div></aside></div></div>
}
export default CartPage
