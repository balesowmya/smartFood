import cors from 'cors'
import express from 'express'
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { readFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import { menuItems, restaurants } from './seed-data.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const databasePath = process.env.DATABASE_FILE === ':memory:' ? ':memory:' : path.resolve(here, process.env.DATABASE_FILE || './database/smart-food.sqlite')
if (databasePath !== ':memory:') mkdirSync(path.dirname(databasePath), { recursive: true })
const db = new DatabaseSync(databasePath)
db.exec(readFileSync(path.join(here, 'schema.sql'), 'utf8'))
db.exec('PRAGMA foreign_keys = ON')

if (db.prepare('SELECT COUNT(*) AS count FROM restaurants').get().count === 0) {
  const addRestaurant = db.prepare('INSERT INTO restaurants (id,name,category,rating,delivery_time,location,image,description) VALUES (?,?,?,?,?,?,?,?)')
  for (const item of restaurants) addRestaurant.run(item.id, item.name, item.category, item.rating, item.deliveryTime, item.location, item.image, item.description)
  const addMenuItem = db.prepare('INSERT INTO menu_items (id,restaurant_id,name,description,price,category,image,available) VALUES (?,?,?,?,?,?,?,?)')
  for (const item of menuItems) addMenuItem.run(item.id, item.restaurantId, item.name, item.description, item.price, item.category, item.image, item.available ? 1 : 0)
}

const app = express()
const port = Number(process.env.PORT || 5000)
const jwtSecret = process.env.JWT_SECRET
if (!jwtSecret) throw new Error('JWT_SECRET is required. Set it in Backend/.env.')
app.use(cors({ origin: (process.env.FRONTEND_ORIGIN || 'http://localhost:5174').split(',').map((entry) => entry.trim()) }))
app.use(express.json({ limit: '1mb' }))

function passwordHash(password, salt = randomBytes(16).toString('hex')) {
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const expected = Buffer.from(hash, 'hex')
  const actual = scryptSync(password, salt, expected.length)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

function createToken(user) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const header = encode({ alg: 'HS256', typ: 'JWT' })
  const payload = encode({ sub: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 })
  const signature = createHmac('sha256', jwtSecret).update(`${header}.${payload}`).digest('base64url')
  return `${header}.${payload}.${signature}`
}

function requireAuth(req, res, next) {
  const token = req.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ message: 'Please sign in to continue.' })
  try {
    const [header, payload, signature] = token.split('.')
    const expected = createHmac('sha256', jwtSecret).update(`${header}.${payload}`).digest()
    const provided = Buffer.from(signature, 'base64url')
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) throw new Error('Invalid token')
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (claims.exp < Date.now() / 1000) throw new Error('Expired token')
    const user = db.prepare('SELECT id,name,email,role FROM users WHERE id=?').get(claims.sub)
    if (!user) throw new Error('Unknown user')
    req.user = user
    next()
  } catch {
    return res.status(401).json({ message: 'Your session has expired. Please sign in again.' })
  }
}

function allowRoles(...roles) {
  return (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'You do not have access to this feature.' })
}

function orderDetails(order) {
  if (!order) return null
  const items = db.prepare('SELECT menu_item_id AS menuItemId,name,quantity,price FROM order_items WHERE order_id=?').all(order.id)
  const restaurant = db.prepare('SELECT name AS restaurantName,category AS restaurantCategory,location FROM restaurants WHERE id=?').get(order.restaurantId ?? order.restaurant_id)
  const review = db.prepare('SELECT id,rating,comment FROM reviews WHERE order_id=?').get(order.id) || null
  return { ...restaurant, ...order, items, review }
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role } = req.body || {}
  const allowedRoles = ['customer', 'restaurant_owner', 'delivery_partner']
  if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email) || typeof password !== 'string' || password.length < 6 || !allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Provide a name, valid email, password of at least 6 characters, and a valid role.' })
  }
  try {
    const result = db.prepare('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)').run(name.trim(), email.trim().toLowerCase(), passwordHash(password), role)
    const user = db.prepare('SELECT id,name,email,role FROM users WHERE id=?').get(result.lastInsertRowid)
    return res.status(201).json({ message: 'Account created. Sign in to continue.', user })
  } catch (error) {
    if (error.code === 'ERR_SQLITE_ERROR' && String(error.message).includes('UNIQUE')) return res.status(409).json({ message: 'An account with this email already exists.' })
    throw error
  }
})

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {}
  if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ message: 'Enter your email and password.' })
  const row = db.prepare('SELECT * FROM users WHERE email=?').get(email.trim().toLowerCase())
  if (!row || !verifyPassword(password, row.password_hash)) return res.status(401).json({ message: 'Invalid email or password' })
  const user = { id: row.id, name: row.name, email: row.email, role: row.role }
  res.json({ token: createToken(user), user })
})

app.get('/api/restaurants', (_req, res) => {
  res.json(db.prepare('SELECT id,name,category,rating,delivery_time AS deliveryTime,location,image,description FROM restaurants ORDER BY id').all())
})

app.post('/api/restaurants', requireAuth, allowRoles('restaurant_owner'), (req, res) => {
  const { name, category, location, description, image } = req.body || {}
  if (![name, category, location, description].every((value) => typeof value === 'string' && value.trim())) return res.status(400).json({ message: 'Name, category, location, and description are required.' })
  const defaultImage = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=85'
  const result = db.prepare('INSERT INTO restaurants (name,category,location,description,image,delivery_time,rating,owner_id) VALUES (?,?,?,?,?,?,?,?)').run(name.trim(), category.trim(), location.trim(), description.trim(), typeof image === 'string' && image ? image : defaultImage, '25–35 min', 4.5, req.user.id)
  res.status(201).json(db.prepare('SELECT id,name,category,rating,delivery_time AS deliveryTime,location,image,description FROM restaurants WHERE id=?').get(result.lastInsertRowid))
})

app.get('/api/restaurants/:id/menu', (req, res) => {
  const restaurant = db.prepare('SELECT id,name,category,rating,delivery_time AS deliveryTime,location,image,description FROM restaurants WHERE id=?').get(Number(req.params.id))
  if (!restaurant) return res.status(404).json({ message: 'Restaurant not found.' })
  const items = db.prepare('SELECT id,restaurant_id AS restaurantId,name,description,price,category,image,available FROM menu_items WHERE restaurant_id=? ORDER BY id').all(restaurant.id).map((item) => ({ ...item, available: Boolean(item.available) }))
  res.json({ restaurant, items })
})

app.post('/api/restaurants/:id/menu', requireAuth, allowRoles('restaurant_owner'), (req, res) => {
  const restaurant = db.prepare('SELECT id FROM restaurants WHERE id=? AND owner_id=?').get(Number(req.params.id), req.user.id)
  if (!restaurant) return res.status(404).json({ message: 'Your restaurant was not found.' })
  const { name, description, price, category, image = '' } = req.body || {}
  if (![name, description, category].every((value) => typeof value === 'string' && value.trim()) || !Number.isInteger(price) || price < 0) return res.status(400).json({ message: 'Enter a name, description, category, and valid price.' })
  const menuImage = image || 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=80'
  const result = db.prepare('INSERT INTO menu_items (restaurant_id,name,description,price,category,image) VALUES (?,?,?,?,?,?)').run(restaurant.id, name.trim(), description.trim(), price, category.trim(), menuImage)
  res.status(201).json({ id: result.lastInsertRowid, restaurantId: restaurant.id, name, description, price, category, image: menuImage, available: true })
})

app.get('/api/restaurant/menu', requireAuth, allowRoles('restaurant_owner'), (req, res) => {
  const restaurant = db.prepare('SELECT id,name FROM restaurants WHERE owner_id=?').get(req.user.id)
  if (!restaurant) return res.json({ restaurant: null, items: [] })
  const items = db.prepare('SELECT id,restaurant_id AS restaurantId,name,description,price,category,image,available FROM menu_items WHERE restaurant_id=? ORDER BY id').all(restaurant.id).map((item) => ({ ...item, available: Boolean(item.available) }))
  res.json({ restaurant, items })
})

app.put('/api/menu/:id', requireAuth, allowRoles('restaurant_owner'), (req, res) => {
  const item = db.prepare('SELECT m.* FROM menu_items m JOIN restaurants r ON r.id=m.restaurant_id WHERE m.id=? AND r.owner_id=?').get(Number(req.params.id), req.user.id)
  if (!item) return res.status(404).json({ message: 'Menu item not found in your restaurant.' })
  const { name = item.name, description = item.description, price = item.price, category = item.category, image = item.image, available = Boolean(item.available) } = req.body || {}
  if (![name, description, category].every((value) => typeof value === 'string' && value.trim()) || !Number.isInteger(price) || price < 0 || typeof available !== 'boolean') return res.status(400).json({ message: 'Enter valid menu item details.' })
  db.prepare('UPDATE menu_items SET name=?,description=?,price=?,category=?,image=?,available=? WHERE id=?').run(name.trim(), description.trim(), price, category.trim(), image, available ? 1 : 0, item.id)
  res.json({ id: item.id, restaurantId: item.restaurant_id, name, description, price, category, image, available })
})

app.delete('/api/menu/:id', requireAuth, allowRoles('restaurant_owner'), (req, res) => {
  const result = db.prepare('DELETE FROM menu_items WHERE id IN (SELECT m.id FROM menu_items m JOIN restaurants r ON r.id=m.restaurant_id WHERE m.id=? AND r.owner_id=?)').run(Number(req.params.id), req.user.id)
  if (!result.changes) return res.status(404).json({ message: 'Menu item not found in your restaurant.' })
  res.status(204).end()
})

app.post('/api/orders', requireAuth, allowRoles('customer'), (req, res) => {
  const { restaurantId, items, deliveryAddress } = req.body || {}
  if (!Number.isInteger(Number(restaurantId)) || !Array.isArray(items) || items.length === 0 || typeof deliveryAddress !== 'string' || !deliveryAddress.trim()) return res.status(400).json({ message: 'Choose food and enter a delivery address.' })
  const restaurant = db.prepare('SELECT id FROM restaurants WHERE id=?').get(Number(restaurantId))
  if (!restaurant) return res.status(404).json({ message: 'Restaurant not found.' })
  const quantities = new Map()
  for (const item of items) {
    if (!Number.isInteger(Number(item.menuItemId)) || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1 || Number(item.quantity) > 50) return res.status(400).json({ message: 'Each item needs a valid menu item and quantity.' })
    quantities.set(Number(item.menuItemId), (quantities.get(Number(item.menuItemId)) || 0) + Number(item.quantity))
  }
  const selectedItems = []
  for (const [menuItemId, quantity] of quantities) {
    const item = db.prepare('SELECT id,restaurant_id,name,price,available FROM menu_items WHERE id=?').get(menuItemId)
    if (!item || item.restaurant_id !== restaurant.id) return res.status(400).json({ message: 'A selected item does not belong to this restaurant.' })
    if (!item.available) return res.status(400).json({ message: `${item.name} is unavailable.` })
    selectedItems.push({ ...item, quantity })
  }
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = subtotal + (subtotal > 500 ? 0 : 40)
  const createOrder = db.prepare('INSERT INTO orders (user_id,restaurant_id,status,total,delivery_address) VALUES (?,?,\'PLACED\',?,?)')
  const addItem = db.prepare('INSERT INTO order_items (order_id,menu_item_id,name,quantity,price) VALUES (?,?,?,?,?)')
  let orderId
  db.exec('BEGIN')
  try {
    orderId = createOrder.run(req.user.id, restaurant.id, total, deliveryAddress.trim()).lastInsertRowid
    for (const item of selectedItems) addItem.run(orderId, item.id, item.name, item.quantity, item.price)
    db.exec('COMMIT')
  } catch (error) { db.exec('ROLLBACK'); throw error }
  const order = orderDetails(db.prepare('SELECT id,user_id AS userId,restaurant_id AS restaurantId,status,total,delivery_address AS deliveryAddress,created_at AS createdAt FROM orders WHERE id=?').get(orderId))
  res.status(201).json(order)
})

app.get('/api/orders', requireAuth, (req, res) => {
  let rows
  if (req.user.role === 'admin') rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all()
  else if (req.user.role === 'customer') rows = db.prepare('SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC').all(req.user.id)
  else if (req.user.role === 'restaurant_owner') rows = db.prepare('SELECT o.* FROM orders o JOIN restaurants r ON r.id=o.restaurant_id WHERE r.owner_id=? ORDER BY o.created_at DESC').all(req.user.id)
  else rows = db.prepare('SELECT * FROM orders WHERE delivery_partner_id=? ORDER BY created_at DESC').all(req.user.id)
  res.json(rows.map(orderDetails))
})

app.get('/api/orders/:id', requireAuth, (req, res) => {
  const order = db.prepare('SELECT o.id,o.user_id AS userId,o.restaurant_id AS restaurantId,o.delivery_partner_id AS deliveryPartnerId,o.status,o.total,o.delivery_address AS deliveryAddress,o.created_at AS createdAt,r.name AS restaurantName,r.category AS restaurantCategory,r.location FROM orders o JOIN restaurants r ON r.id=o.restaurant_id WHERE o.id=?').get(Number(req.params.id))
  if (!order) return res.status(404).json({ message: 'Order not found.' })
  const isOwner = req.user.role === 'restaurant_owner' && db.prepare('SELECT 1 FROM restaurants WHERE id=? AND owner_id=?').get(order.restaurantId, req.user.id)
  if (req.user.role !== 'admin' && order.userId !== req.user.id && !isOwner && order.deliveryPartnerId !== req.user.id) return res.status(403).json({ message: 'You cannot view this order.' })
  res.json(orderDetails(order))
})

app.get('/api/restaurant/orders', requireAuth, allowRoles('restaurant_owner'), (req, res) => {
  const rows = db.prepare('SELECT o.* FROM orders o JOIN restaurants r ON r.id=o.restaurant_id WHERE r.owner_id=? ORDER BY o.created_at DESC').all(req.user.id)
  res.json(rows.map(orderDetails))
})

app.get('/api/delivery/orders', requireAuth, allowRoles('delivery_partner'), (req, res) => {
  const rows = db.prepare("SELECT o.*,o.delivery_partner_id AS deliveryPartnerId,o.delivery_address AS deliveryAddress,r.name AS restaurantName FROM orders o JOIN restaurants r ON r.id=o.restaurant_id WHERE o.status IN ('PREPARING','OUT_FOR_DELIVERY') AND (o.delivery_partner_id IS NULL OR o.delivery_partner_id=?) ORDER BY o.created_at").all(req.user.id)
  res.json(rows.map(orderDetails))
})

app.post('/api/delivery/orders/:id/claim', requireAuth, allowRoles('delivery_partner'), (req, res) => {
  const result = db.prepare("UPDATE orders SET delivery_partner_id=? WHERE id=? AND status='PREPARING' AND delivery_partner_id IS NULL").run(req.user.id, Number(req.params.id))
  if (!result.changes) return res.status(409).json({ message: 'This delivery is no longer available to claim.' })
  res.json({ message: 'Delivery assigned to you.' })
})

app.put('/api/orders/:id/status', requireAuth, (req, res) => {
  const transitions = { PLACED: 'ACCEPTED', ACCEPTED: 'PREPARING', PREPARING: 'OUT_FOR_DELIVERY', OUT_FOR_DELIVERY: 'DELIVERED' }
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(Number(req.params.id))
  if (!order) return res.status(404).json({ message: 'Order not found.' })
  let allowed = req.user.role === 'admin'
  if (req.user.role === 'restaurant_owner') {
    const ownsRestaurant = db.prepare('SELECT 1 FROM restaurants WHERE id=? AND owner_id=?').get(order.restaurant_id, req.user.id)
    allowed = Boolean(ownsRestaurant) && ['PLACED', 'ACCEPTED'].includes(order.status)
  }
  if (req.user.role === 'delivery_partner') allowed = order.delivery_partner_id === req.user.id && ['PREPARING', 'OUT_FOR_DELIVERY'].includes(order.status)
  if (!allowed) return res.status(403).json({ message: 'You cannot update this order status.' })
  const nextStatus = req.body?.status
  if (nextStatus !== transitions[order.status]) return res.status(400).json({ message: 'That status change is not allowed.' })
  db.prepare('UPDATE orders SET status=? WHERE id=?').run(nextStatus, order.id)
  res.json(orderDetails(db.prepare('SELECT id,user_id AS userId,restaurant_id AS restaurantId,status,total,delivery_address AS deliveryAddress,created_at AS createdAt FROM orders WHERE id=?').get(order.id)))
})

app.get('/api/dashboard/summary', requireAuth, (req, res) => {
  const scope = req.user.role === 'customer' ? 'o.user_id=?' : req.user.role === 'restaurant_owner' ? 'o.restaurant_id IN (SELECT id FROM restaurants WHERE owner_id=?)' : req.user.role === 'delivery_partner' ? 'o.delivery_partner_id=?' : '1=1'
  const rows = db.prepare(`SELECT o.status, COUNT(*) AS count, COALESCE(SUM(o.total),0) AS revenue FROM orders o WHERE ${scope} GROUP BY o.status`).all(...(scope === '1=1' ? [] : [req.user.id]))
  res.json({ totalOrders: rows.reduce((sum, row) => sum + row.count, 0), revenue: rows.reduce((sum, row) => sum + row.revenue, 0), byStatus: Object.fromEntries(rows.map((row) => [row.status, row.count])) })
})

app.post('/api/reviews', requireAuth, allowRoles('customer'), (req, res) => {
  const { orderId, rating, comment = '' } = req.body || {}
  const order = db.prepare('SELECT status,user_id FROM orders WHERE id=?').get(Number(orderId))
  if (!order || order.user_id !== req.user.id) return res.status(404).json({ message: 'Delivered order not found.' })
  if (order.status !== 'DELIVERED') return res.status(400).json({ message: 'You can review an order after it is delivered.' })
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ message: 'Choose a rating from 1 to 5.' })
  try {
    const result = db.prepare('INSERT INTO reviews (order_id,user_id,rating,comment) VALUES (?,?,?,?)').run(Number(orderId), req.user.id, rating, String(comment).slice(0, 1000))
    res.status(201).json({ id: result.lastInsertRowid, orderId: Number(orderId), rating, comment })
  } catch { res.status(409).json({ message: 'You have already reviewed this order.' }) }
})

app.use((error, _req, res, _next) => {
  console.error(error)
  if (error instanceof SyntaxError && error.status === 400) return res.status(400).json({ message: 'Request body must be valid JSON.' })
  res.status(500).json({ message: 'Something went wrong. Please try again.' })
})

app.listen(port, () => console.log(`Smart Food API listening on http://localhost:${port}`))
