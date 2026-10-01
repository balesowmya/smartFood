import { db } from '../config/database.js'
import { HttpError, routeId } from '../utils/http.js'

const transitions = { PLACED: 'ACCEPTED', ACCEPTED: 'PREPARING', PREPARING: 'OUT_FOR_DELIVERY', OUT_FOR_DELIVERY: 'DELIVERED' }

export function orderDetails(order) {
  const items = db.prepare('SELECT menu_item_id AS menuItemId,name,quantity,price FROM order_items WHERE order_id=?').all(order.id)
  const restaurant = db.prepare('SELECT name AS restaurantName,category AS restaurantCategory,location FROM restaurants WHERE id=?').get(order.restaurantId ?? order.restaurant_id)
  const review = db.prepare('SELECT id,rating,comment FROM reviews WHERE order_id=?').get(order.id) || null
  const statusHistory = db.prepare('SELECT status,changed_by AS changedBy,created_at AS createdAt FROM order_status_logs WHERE order_id=? ORDER BY id').all(order.id)
  return { ...restaurant, ...order, items, review, statusHistory }
}

export function createOrder(req, res) {
  const { restaurantId, items, deliveryAddress } = req.body || {}
  const rid = Number(restaurantId)
  if (!Number.isSafeInteger(rid) || rid < 1 || !Array.isArray(items) || items.length === 0 || items.length > 100 || typeof deliveryAddress !== 'string' || !deliveryAddress.trim()) throw new HttpError(400, 'Choose food and enter a delivery address.')
  if (!db.prepare('SELECT id FROM restaurants WHERE id=?').get(rid)) throw new HttpError(404, 'Restaurant not found.')
  const quantities = new Map()
  for (const entry of items) {
    if (!entry || typeof entry !== 'object') throw new HttpError(400, 'Each item needs a valid menu item and quantity.')
    const itemId = Number(entry.menuItemId)
    const quantity = Number(entry.quantity)
    if (!Number.isSafeInteger(itemId) || itemId < 1 || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 50) throw new HttpError(400, 'Each item needs a valid menu item and quantity.')
    const combined = (quantities.get(itemId) || 0) + quantity
    if (combined > 50) throw new HttpError(400, 'An item quantity cannot exceed 50.')
    quantities.set(itemId, combined)
  }
  const selected = []
  for (const [itemId, quantity] of quantities) {
    const item = db.prepare('SELECT id,restaurant_id,name,price,available FROM menu_items WHERE id=?').get(itemId)
    if (!item || item.restaurant_id !== rid) throw new HttpError(400, 'A selected item does not belong to this restaurant.')
    if (!item.available) throw new HttpError(400, `${item.name} is unavailable.`)
    selected.push({ ...item, quantity })
  }
  const subtotal = selected.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = subtotal + (subtotal > 500 ? 0 : 40)
  let orderId
  db.exec('BEGIN')
  try {
    orderId = db.prepare("INSERT INTO orders (user_id,restaurant_id,status,total,delivery_address) VALUES (?,?,'PLACED',?,?)").run(req.user.id, rid, total, deliveryAddress.trim()).lastInsertRowid
    const addItem = db.prepare('INSERT INTO order_items (order_id,menu_item_id,name,quantity,price) VALUES (?,?,?,?,?)')
    for (const item of selected) addItem.run(orderId, item.id, item.name, item.quantity, item.price)
    db.prepare("INSERT INTO order_status_logs (order_id,status,changed_by) VALUES (?,'PLACED',?)").run(orderId, req.user.id)
    db.prepare("INSERT INTO deliveries (order_id,status) VALUES (?,'PENDING')").run(orderId)
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
  const order = db.prepare('SELECT id,user_id AS userId,restaurant_id AS restaurantId,delivery_partner_id AS deliveryPartnerId,status,total,delivery_address AS deliveryAddress,created_at AS createdAt FROM orders WHERE id=?').get(orderId)
  res.status(201).json(orderDetails(order))
}

export function listOrders(req, res) {
  let rows
  if (req.user.role === 'admin') rows = db.prepare('SELECT id,user_id AS userId,restaurant_id AS restaurantId,delivery_partner_id AS deliveryPartnerId,status,total,delivery_address AS deliveryAddress,created_at AS createdAt FROM orders ORDER BY created_at DESC').all()
  else if (req.user.role === 'customer') rows = db.prepare('SELECT id,user_id AS userId,restaurant_id AS restaurantId,delivery_partner_id AS deliveryPartnerId,status,total,delivery_address AS deliveryAddress,created_at AS createdAt FROM orders WHERE user_id=? ORDER BY created_at DESC').all(req.user.id)
  else if (req.user.role === 'restaurant_owner') rows = db.prepare('SELECT o.id,o.user_id AS userId,o.restaurant_id AS restaurantId,o.delivery_partner_id AS deliveryPartnerId,o.status,o.total,o.delivery_address AS deliveryAddress,o.created_at AS createdAt FROM orders o JOIN restaurants r ON r.id=o.restaurant_id WHERE r.owner_id=? ORDER BY o.created_at DESC').all(req.user.id)
  else rows = db.prepare('SELECT id,user_id AS userId,restaurant_id AS restaurantId,delivery_partner_id AS deliveryPartnerId,status,total,delivery_address AS deliveryAddress,created_at AS createdAt FROM orders WHERE delivery_partner_id=? ORDER BY created_at DESC').all(req.user.id)
  res.json(rows.map(orderDetails))
}

export function getOrder(req, res) {
  const id = routeId(req.params.id, 'Order ID')
  const order = db.prepare('SELECT o.id,o.user_id AS userId,o.restaurant_id AS restaurantId,o.delivery_partner_id AS deliveryPartnerId,o.status,o.total,o.delivery_address AS deliveryAddress,o.created_at AS createdAt,r.name AS restaurantName,r.category AS restaurantCategory,r.location FROM orders o JOIN restaurants r ON r.id=o.restaurant_id WHERE o.id=?').get(id)
  if (!order) throw new HttpError(404, 'Order not found.')
  const ownsRestaurant = req.user.role === 'restaurant_owner' && Boolean(db.prepare('SELECT 1 FROM restaurants WHERE id=? AND owner_id=?').get(order.restaurantId, req.user.id))
  if (req.user.role !== 'admin' && order.userId !== req.user.id && !ownsRestaurant && order.deliveryPartnerId !== req.user.id) throw new HttpError(403, 'You cannot view this order.')
  res.json(orderDetails(order))
}

export function listRestaurantOrders(req, res) {
  const rows = db.prepare('SELECT o.id,o.user_id AS userId,o.restaurant_id AS restaurantId,o.delivery_partner_id AS deliveryPartnerId,o.status,o.total,o.delivery_address AS deliveryAddress,o.created_at AS createdAt FROM orders o JOIN restaurants r ON r.id=o.restaurant_id WHERE r.owner_id=? ORDER BY o.created_at DESC').all(req.user.id)
  res.json(rows.map(orderDetails))
}

export function updateOrderStatus(req, res) {
  const id = routeId(req.params.id, 'Order ID')
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(id)
  if (!order) throw new HttpError(404, 'Order not found.')
  const next = req.body?.status
  if (next !== transitions[order.status]) throw new HttpError(400, 'That status change is not allowed.')
  let allowed = req.user.role === 'admin'
  if (req.user.role === 'restaurant_owner') allowed = Boolean(db.prepare('SELECT 1 FROM restaurants WHERE id=? AND owner_id=?').get(order.restaurant_id, req.user.id)) && ['PLACED', 'ACCEPTED'].includes(order.status)
  if (req.user.role === 'delivery_partner') allowed = order.delivery_partner_id === req.user.id && ['PREPARING', 'OUT_FOR_DELIVERY'].includes(order.status)
  if (!allowed) throw new HttpError(403, 'You cannot update this order status.')
  db.exec('BEGIN')
  try {
    db.prepare('UPDATE orders SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(next, id)
    db.prepare('INSERT INTO order_status_logs (order_id,status,changed_by) VALUES (?,?,?)').run(id, next, req.user.id)
    if (next === 'OUT_FOR_DELIVERY') db.prepare("UPDATE deliveries SET status='OUT_FOR_DELIVERY',pickup_time=COALESCE(pickup_time,CURRENT_TIMESTAMP) WHERE order_id=?").run(id)
    if (next === 'DELIVERED') db.prepare("UPDATE deliveries SET status='DELIVERED',delivery_time=CURRENT_TIMESTAMP WHERE order_id=?").run(id)
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
  const result = db.prepare('SELECT id,user_id AS userId,restaurant_id AS restaurantId,delivery_partner_id AS deliveryPartnerId,status,total,delivery_address AS deliveryAddress,created_at AS createdAt FROM orders WHERE id=?').get(id)
  res.json(orderDetails(result))
}
