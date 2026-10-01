import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/api.js'
import { getApiError } from '../api/errors.js'
import OrderStatus from '../components/OrderStatus.jsx'

function OrderTracking() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rating, setRating] = useState('5')
  const [comment, setComment] = useState('')
  const [reviewMessage, setReviewMessage] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)

  useEffect(() => {
    api.get(`/orders/${id}`).then(({ data }) => setOrder(data)).catch((requestError) => setError(getApiError(requestError))).finally(() => setLoading(false))
  }, [id])

  async function submitReview(event) {
    event.preventDefault()
    setReviewLoading(true)
    setReviewMessage('')
    try {
      await api.post('/reviews', { orderId: order.id, rating: Number(rating), comment })
      setReviewMessage('Thanks for sharing your review!')
      setOrder((current) => ({ ...current, review: { rating: Number(rating), comment } }))
    } catch (requestError) { setReviewMessage(getApiError(requestError, 'Your review could not be submitted.')) }
    finally { setReviewLoading(false) }
  }

  if (loading) return <div className="api-state page-shell">Loading your order…</div>
  if (error) return <section className="page-shell not-found"><span className="eyebrow">ORDER UNAVAILABLE</span><h1>{error}</h1><Link className="button button-primary" to="/restaurants">Back to restaurants</Link></section>

  const statusLabels = { PLACED: 'Placed', ACCEPTED: 'Accepted', PREPARING: 'Preparing', OUT_FOR_DELIVERY: 'Out for Delivery', DELIVERED: 'Delivered' }
  return <div className="page-shell tracking-page"><div className="tracking-top"><div><span className="eyebrow">YOUR ORDER IS IN GOOD HANDS</span><h1>{order.status === 'DELIVERED' ? 'Your order was delivered' : 'Your order is on its way'}<span className="heading-dot">.</span></h1><p>Order #{order.id} · {order.deliveryAddress}</p></div><span className="order-number">ORDER #{String(order.id).padStart(4, '0')}</span></div>
    <div className="tracking-layout"><section className="tracking-panel"><div className="tracking-status-head"><div><span className="eyebrow">CURRENT STATUS</span><h2>{statusLabels[order.status] || order.status}</h2></div><span className="preparing-pill"><i /> {statusLabels[order.status] || order.status}</span></div><OrderStatus currentStatus={order.status} /><div className="tracking-help">Order placed {new Date(order.createdAt).toLocaleString()} <a href="mailto:hello@smartfood.example">Need help? →</a></div></section>
      <aside className="receipt-panel"><div className="receipt-top"><span className="receipt-logo">S</span><span className="eyebrow">YOUR LITTLE FEAST</span></div><h2>{order.restaurantName}</h2><p className="receipt-location">{order.location} · {order.restaurantCategory}</p><div className="receipt-separator" />{order.items.map((item) => <div className="receipt-row" key={item.menuItemId}><span>{item.name} <b>× {item.quantity}</b></span><strong>₹{item.price * item.quantity}</strong></div>)}<div className="receipt-separator" /><div className="receipt-total"><span>Total</span><strong>₹{order.total}</strong></div><div className="receipt-thanks">Thanks for ordering local <span>♡</span></div></aside></div>
    {order.status === 'DELIVERED' && (order.review ? <div className="review-form"><span className="eyebrow">THANKS FOR THE FEEDBACK</span><h2>Your review</h2><p>{order.review.rating} stars · {order.review.comment || 'No written note'}</p></div> : <form className="review-form" onSubmit={submitReview}><span className="eyebrow">HOW WAS YOUR MEAL?</span><h2>Leave a review</h2><label>Rating<select value={rating} onChange={(event) => setRating(event.target.value)}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}</select></label><label>Your note<textarea rows="3" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Tell the kitchen what you thought" /></label><button className="button button-primary" disabled={reviewLoading}>{reviewLoading ? 'Sending…' : 'Send review'}</button>{reviewMessage && <p role="status">{reviewMessage}</p>}</form>)}
    <Link className="continue-link tracking-back" to="/restaurants">← Back to restaurants</Link></div>
}
export default OrderTracking
