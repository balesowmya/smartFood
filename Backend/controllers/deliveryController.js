import { db } from '../config/database.js'
import { orderDetails } from './orderController.js'
import { HttpError, routeId } from '../utils/http.js'

const deliverySelect = 'SELECT d.id,d.order_id AS orderId,d.delivery_partner_id AS deliveryPartnerId,d.status,d.pickup_time AS pickupTime,d.delivery_time AS deliveryTime,d.created_at AS createdAt'

export function listAvailableOrders(req, res) {
  const rows = db.prepare("SELECT o.id,o.user_id AS userId,o.restaurant_id AS restaurantId,o.delivery_partner_id AS deliveryPartnerId,o.status,o.total,o.delivery_address AS deliveryAddress,o.created_at AS createdAt,r.name AS restaurantName FROM orders o JOIN restaurants r ON r.id=o.restaurant_id WHERE o.status IN ('PREPARING','OUT_FOR_DELIVERY') AND (o.delivery_partner_id IS NULL OR o.delivery_partner_id=?) ORDER BY o.created_at").all(req.user.id)
  res.json(rows.map(orderDetails))
}

export function claimDelivery(req, res) {
  const orderId = routeId(req.params.id, 'Order ID')
  const result = db.prepare("UPDATE orders SET delivery_partner_id=? WHERE id=? AND status='PREPARING' AND delivery_partner_id IS NULL").run(req.user.id, orderId)
  if (!result.changes) throw new HttpError(409, 'This delivery is no longer available to claim.')
  db.prepare("UPDATE deliveries SET delivery_partner_id=?,status='ASSIGNED' WHERE order_id=?").run(req.user.id, orderId)
  res.json({ message: 'Delivery assigned to you.' })
}

export function listDeliveries(req, res) {
  let rows
  if (req.user.role === 'delivery_partner') {
    rows = db.prepare(`${deliverySelect},o.status AS orderStatus,o.delivery_address AS deliveryAddress,r.name AS restaurantName FROM deliveries d JOIN orders o ON o.id=d.order_id JOIN restaurants r ON r.id=o.restaurant_id WHERE d.delivery_partner_id=? ORDER BY d.id DESC`).all(req.user.id)
  } else if (req.user.role === 'restaurant_owner') {
    rows = db.prepare(`${deliverySelect},o.status AS orderStatus,o.delivery_address AS deliveryAddress,r.name AS restaurantName FROM deliveries d JOIN orders o ON o.id=d.order_id JOIN restaurants r ON r.id=o.restaurant_id WHERE r.owner_id=? ORDER BY d.id DESC`).all(req.user.id)
  } else if (req.user.role === 'admin') {
    rows = db.prepare(`${deliverySelect},o.status AS orderStatus,o.delivery_address AS deliveryAddress,r.name AS restaurantName FROM deliveries d JOIN orders o ON o.id=d.order_id JOIN restaurants r ON r.id=o.restaurant_id ORDER BY d.id DESC`).all()
  } else throw new HttpError(403, 'You do not have access to delivery records.')
  res.json(rows)
}

export function getDelivery(req, res) {
  const id = routeId(req.params.id, 'Delivery ID')
  const delivery = db.prepare(`${deliverySelect},o.status AS orderStatus,o.user_id AS customerId,o.delivery_address AS deliveryAddress,r.name AS restaurantName,r.owner_id AS restaurantOwnerId FROM deliveries d JOIN orders o ON o.id=d.order_id JOIN restaurants r ON r.id=o.restaurant_id WHERE d.id=?`).get(id)
  if (!delivery) throw new HttpError(404, 'Delivery not found.')
  const allowed = req.user.role === 'admin' || (req.user.role === 'delivery_partner' && delivery.deliveryPartnerId === req.user.id) || (req.user.role === 'restaurant_owner' && delivery.restaurantOwnerId === req.user.id)
  if (!allowed) throw new HttpError(403, 'You cannot view this delivery.')
  const { customerId, restaurantOwnerId, ...result } = delivery
  res.json(result)
}

export function assignDelivery(req, res) {
  const orderId = routeId(req.body?.orderId, 'Order ID')
  const partnerId = routeId(req.body?.deliveryPartnerId, 'Delivery partner ID')
  const order = db.prepare('SELECT o.*,r.owner_id AS restaurantOwnerId FROM orders o JOIN restaurants r ON r.id=o.restaurant_id WHERE o.id=?').get(orderId)
  if (!order) throw new HttpError(404, 'Order not found.')
  if (req.user.role !== 'admin' && order.restaurantOwnerId !== req.user.id) throw new HttpError(403, 'You cannot assign deliveries for this restaurant.')
  if (order.status !== 'PREPARING' || (order.delivery_partner_id && order.delivery_partner_id !== partnerId)) throw new HttpError(409, 'This order is not available for assignment.')
  if (!db.prepare("SELECT id FROM users WHERE id=? AND role='delivery_partner'").get(partnerId)) throw new HttpError(400, 'The selected user is not a delivery partner.')
  db.exec('BEGIN')
  try {
    db.prepare('UPDATE orders SET delivery_partner_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(partnerId, orderId)
    db.prepare("UPDATE deliveries SET delivery_partner_id=?,status='ASSIGNED' WHERE order_id=?").run(partnerId, orderId)
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
  res.json(db.prepare(`${deliverySelect} FROM deliveries d WHERE d.order_id=?`).get(orderId))
}

export function updateDeliveryStatus(req, res) {
  const id = routeId(req.params.id, 'Delivery ID')
  const delivery = db.prepare('SELECT d.*,o.status AS orderStatus FROM deliveries d JOIN orders o ON o.id=d.order_id WHERE d.id=?').get(id)
  if (!delivery) throw new HttpError(404, 'Delivery not found.')
  if (delivery.delivery_partner_id !== req.user.id) throw new HttpError(403, 'Only the assigned delivery partner can update this delivery.')
  const next = req.body?.status
  const valid = (delivery.orderStatus === 'PREPARING' && next === 'OUT_FOR_DELIVERY') || (delivery.orderStatus === 'OUT_FOR_DELIVERY' && next === 'DELIVERED')
  if (!valid) throw new HttpError(400, 'Invalid delivery status transition.')
  db.exec('BEGIN')
  try {
    db.prepare('UPDATE orders SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(next, delivery.order_id)
    db.prepare('INSERT INTO order_status_logs (order_id,status,changed_by) VALUES (?,?,?)').run(delivery.order_id, next, req.user.id)
    if (next === 'OUT_FOR_DELIVERY') db.prepare("UPDATE deliveries SET status=?,pickup_time=COALESCE(pickup_time,CURRENT_TIMESTAMP) WHERE id=?").run(next, id)
    else db.prepare("UPDATE deliveries SET status=?,delivery_time=CURRENT_TIMESTAMP WHERE id=?").run(next, id)
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
  res.json(db.prepare(`${deliverySelect} FROM deliveries d WHERE d.id=?`).get(id))
}
