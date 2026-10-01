import { db } from '../config/database.js'
import { assertRestaurantManager } from './restaurantController.js'
import { HttpError, requireFields, routeId } from '../utils/http.js'

const fallbackImage = 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=80'
const fromDb = (item) => item && ({ ...item, available: Boolean(item.available) })

export function createMenuItem(req, res) {
  const restaurantId = routeId(req.params.restaurantId, 'Restaurant ID')
  assertRestaurantManager(restaurantId, req.user)
  const { name, description, price, category, image = '' } = req.body || {}
  requireFields([name, description, category], 'Name, description, and category are required.')
  if (!Number.isSafeInteger(price) || price < 0) throw new HttpError(400, 'Price must be a non-negative integer.')
  if (typeof image !== 'string') throw new HttpError(400, 'Image must be a string.')
  const imageUrl = image.trim() || fallbackImage
  const result = db.prepare('INSERT INTO menu_items (restaurant_id,name,description,price,category,image) VALUES (?,?,?,?,?,?)').run(restaurantId, name.trim(), description.trim(), price, category.trim(), imageUrl)
  res.status(201).json(fromDb(db.prepare('SELECT id,restaurant_id AS restaurantId,name,description,price,category,image,available FROM menu_items WHERE id=?').get(result.lastInsertRowid)))
}

export function updateMenuItem(req, res) {
  const id = routeId(req.params.id, 'Menu item ID')
  const item = db.prepare('SELECT m.*,r.owner_id FROM menu_items m JOIN restaurants r ON r.id=m.restaurant_id WHERE m.id=?').get(id)
  if (!item) throw new HttpError(404, 'Menu item not found.')
  assertRestaurantManager(item.restaurant_id, req.user)
  const name = req.body?.name ?? item.name
  const description = req.body?.description ?? item.description
  const category = req.body?.category ?? item.category
  const price = req.body?.price ?? item.price
  const image = req.body?.image ?? item.image
  const available = req.body?.available ?? req.body?.availability ?? Boolean(item.available)
  requireFields([name, description, category], 'Name, description, and category are required.')
  if (!Number.isSafeInteger(price) || price < 0 || typeof available !== 'boolean' || typeof image !== 'string') throw new HttpError(400, 'Provide valid menu item details.')
  db.prepare('UPDATE menu_items SET name=?,description=?,category=?,price=?,image=?,available=? WHERE id=?').run(name.trim(), description.trim(), category.trim(), price, image, available ? 1 : 0, id)
  res.json(fromDb(db.prepare('SELECT id,restaurant_id AS restaurantId,name,description,price,category,image,available FROM menu_items WHERE id=?').get(id)))
}

export function deleteMenuItem(req, res) {
  const id = routeId(req.params.id, 'Menu item ID')
  const item = db.prepare('SELECT * FROM menu_items WHERE id=?').get(id)
  if (!item) throw new HttpError(404, 'Menu item not found.')
  assertRestaurantManager(item.restaurant_id, req.user)
  if (db.prepare('SELECT 1 FROM order_items WHERE menu_item_id=? LIMIT 1').get(id)) throw new HttpError(409, 'A menu item included in an order cannot be deleted.')
  db.prepare('DELETE FROM menu_items WHERE id=?').run(id)
  res.status(204).end()
}
