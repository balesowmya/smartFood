import { db } from '../config/database.js'
import { HttpError, routeId } from '../utils/http.js'

export function createReview(req, res) {
  const orderId = routeId(req.body?.orderId, 'Order ID')
  const { rating, comment = '' } = req.body || {}
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new HttpError(400, 'Choose a rating from 1 to 5.')
  if (typeof comment !== 'string' || comment.length > 1000) throw new HttpError(400, 'Review comment must be 1,000 characters or fewer.')
  const order = db.prepare('SELECT id,user_id,restaurant_id,status FROM orders WHERE id=?').get(orderId)
  if (!order || order.user_id !== req.user.id) throw new HttpError(404, 'Delivered order not found.')
  if (order.status !== 'DELIVERED') throw new HttpError(400, 'You can review an order after it is delivered.')
  try {
    const result = db.prepare('INSERT INTO reviews (order_id,user_id,restaurant_id,rating,comment) VALUES (?,?,?,?,?)').run(orderId, req.user.id, order.restaurant_id, rating, comment.trim())
    res.status(201).json({ id: result.lastInsertRowid, orderId, rating, comment: comment.trim() })
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) throw new HttpError(409, 'You have already reviewed this order.')
    throw error
  }
}

export function listRestaurantReviews(req, res) {
  const restaurantId = routeId(req.params.restaurantId, 'Restaurant ID')
  if (!db.prepare('SELECT 1 FROM restaurants WHERE id=?').get(restaurantId)) throw new HttpError(404, 'Restaurant not found.')
  res.json(db.prepare('SELECT v.id,v.rating,v.comment,v.created_at AS createdAt,u.name AS customerName FROM reviews v JOIN users u ON u.id=v.user_id WHERE v.restaurant_id=? ORDER BY v.created_at DESC').all(restaurantId))
}
