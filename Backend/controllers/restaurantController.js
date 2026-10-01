import { db } from '../config/database.js'
import { HttpError, requireFields, routeId } from '../utils/http.js'

const selectRestaurant = 'SELECT id,name,category,rating,delivery_time AS deliveryTime,location,image,description FROM restaurants'
const defaultImage = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=85'
const findById = (id) => db.prepare(`${selectRestaurant} WHERE id=?`).get(id)

function assertManager(restaurant, user) {
  if (!restaurant) throw new HttpError(404, 'Restaurant not found.')
  if (user.role !== 'admin' && restaurant.owner_id !== user.id) throw new HttpError(403, 'You cannot manage this restaurant.')
}

export function listRestaurants(_req, res) {
  res.json(db.prepare(`${selectRestaurant} ORDER BY id`).all())
}

export function getRestaurant(req, res) {
  const restaurant = findById(routeId(req.params.id, 'Restaurant ID'))
  if (!restaurant) throw new HttpError(404, 'Restaurant not found.')
  res.json(restaurant)
}

export function createRestaurant(req, res) {
  const { name, category, location, description, image, phone } = req.body || {}
  requireFields([name, category, location, description], 'Name, category, location, and description are required.')
  const result = db.prepare('INSERT INTO restaurants (owner_id,name,category,description,location,phone,image) VALUES (?,?,?,?,?,?,?)').run(req.user.id, name.trim(), category.trim(), description.trim(), location.trim(), typeof phone === 'string' ? phone.trim() : null, typeof image === 'string' && image.trim() ? image.trim() : defaultImage)
  res.status(201).json(findById(result.lastInsertRowid))
}

export function updateRestaurant(req, res) {
  const id = routeId(req.params.id, 'Restaurant ID')
  const existing = db.prepare('SELECT * FROM restaurants WHERE id=?').get(id)
  assertManager(existing, req.user)
  const fields = ['name', 'category', 'location', 'description']
  const data = Object.fromEntries(fields.map((field) => [field, req.body?.[field] ?? existing[field]]))
  requireFields(Object.values(data), 'Name, category, location, and description are required.')
  const image = req.body?.image ?? existing.image
  if (typeof image !== 'string' || !image.trim()) throw new HttpError(400, 'Image must be a non-empty string.')
  const phone = req.body?.phone ?? existing.phone
  if (phone !== null && typeof phone !== 'string') throw new HttpError(400, 'Phone must be a string.')
  db.prepare('UPDATE restaurants SET name=?,category=?,location=?,description=?,image=?,phone=? WHERE id=?').run(data.name.trim(), data.category.trim(), data.location.trim(), data.description.trim(), image.trim(), phone?.trim() || null, id)
  res.json(findById(id))
}

export function deleteRestaurant(req, res) {
  const id = routeId(req.params.id, 'Restaurant ID')
  const restaurant = db.prepare('SELECT * FROM restaurants WHERE id=?').get(id)
  assertManager(restaurant, req.user)
  if (db.prepare('SELECT 1 FROM orders WHERE restaurant_id=? LIMIT 1').get(id)) throw new HttpError(409, 'A restaurant with existing orders cannot be deleted.')
  db.prepare('DELETE FROM restaurants WHERE id=?').run(id)
  res.status(204).end()
}

export function getRestaurantMenu(req, res) {
  const id = routeId(req.params.id, 'Restaurant ID')
  const restaurant = findById(id)
  if (!restaurant) throw new HttpError(404, 'Restaurant not found.')
  const items = db.prepare('SELECT id,restaurant_id AS restaurantId,name,description,price,category,image,available FROM menu_items WHERE restaurant_id=? ORDER BY id').all(id).map((item) => ({ ...item, available: Boolean(item.available) }))
  res.json({ restaurant, items })
}

export function getOwnerMenu(req, res) {
  const restaurantRow = req.user.role === 'admin'
    ? db.prepare('SELECT * FROM restaurants ORDER BY id LIMIT 1').get()
    : db.prepare('SELECT * FROM restaurants WHERE owner_id=? ORDER BY id LIMIT 1').get(req.user.id)
  if (!restaurantRow) return res.json({ restaurant: null, items: [] })
  const restaurant = findById(restaurantRow.id)
  const items = db.prepare('SELECT id,restaurant_id AS restaurantId,name,description,price,category,image,available FROM menu_items WHERE restaurant_id=? ORDER BY id').all(restaurant.id).map((item) => ({ ...item, available: Boolean(item.available) }))
  res.json({ restaurant, items })
}

export function assertRestaurantManager(restaurantId, user) {
  const restaurant = db.prepare('SELECT * FROM restaurants WHERE id=?').get(restaurantId)
  assertManager(restaurant, user)
  return restaurant
}
