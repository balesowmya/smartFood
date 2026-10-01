import dotenv from 'dotenv'
import { mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

dotenv.config()

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const configuredPath = process.env.DATABASE_PATH || './food_delivery.db'
export const databasePath = configuredPath === ':memory:' ? ':memory:' : path.resolve(backendRoot, configuredPath)
if (databasePath !== ':memory:') mkdirSync(path.dirname(databasePath), { recursive: true })

export const db = new DatabaseSync(databasePath)
db.exec('PRAGMA foreign_keys = ON')
db.exec(readFileSync(path.join(backendRoot, 'database', 'schema.sql'), 'utf8'))

function ensureColumn(table, column, definition) {
  const exists = db.prepare(`PRAGMA table_info(${table})`).all().some((entry) => entry.name === column)
  if (!exists) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
}

// Keep databases made by the earlier API version usable without replacing their data.
ensureColumn('restaurants', 'phone', 'TEXT')
ensureColumn('restaurants', 'created_at', 'TEXT')
ensureColumn('menu_items', 'created_at', 'TEXT')
ensureColumn('orders', 'updated_at', 'TEXT')
ensureColumn('reviews', 'restaurant_id', 'INTEGER REFERENCES restaurants(id)')
db.exec("UPDATE restaurants SET created_at=COALESCE(created_at,CURRENT_TIMESTAMP)")
db.exec("UPDATE menu_items SET created_at=COALESCE(created_at,CURRENT_TIMESTAMP)")
db.exec("UPDATE orders SET updated_at=COALESCE(updated_at,created_at,CURRENT_TIMESTAMP)")
db.exec('UPDATE reviews SET restaurant_id=(SELECT restaurant_id FROM orders WHERE orders.id=reviews.order_id) WHERE restaurant_id IS NULL')
db.exec('CREATE INDEX IF NOT EXISTS idx_reviews_restaurant ON reviews(restaurant_id, created_at)')
db.exec('INSERT INTO order_status_logs (order_id,status,changed_by) SELECT o.id,o.status,o.user_id FROM orders o WHERE NOT EXISTS (SELECT 1 FROM order_status_logs l WHERE l.order_id=o.id)')

const restaurants = [
  ['Spice Garden','Indian','Bold spices and homestyle Indian comfort.','Hyderabad','https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=85'],
  ['Urban Bites','Fast Food','Handcrafted burgers, crispy sides and more.','Hyderabad','https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85'],
  ['Green Bowl','Healthy','Fresh ingredients and feel-good food.','Hyderabad','https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=85'],
  ['Pizza House','Pizza','Stone-baked pizzas with generous toppings.','Hyderabad','https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=900&q=85'],
  ['Hyderabad Biryani Hub','Biryani','Dum-cooked biryani made the Hyderabadi way.','Hyderabad','https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=900&q=85'],
  ['South Indian Delight','South Indian','Crisp dosas and comforting South Indian staples.','Hyderabad','https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=900&q=85'],
  ['Burger Junction','Burgers','Juicy burgers stacked fresh to order.','Hyderabad','https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85'],
  ['Sweet Treats','Desserts','A sweet finish for every kind of day.','Hyderabad','https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=85'],
]
const seedRestaurants = db.prepare('INSERT OR IGNORE INTO restaurants (id,name,category,description,location,image,rating,delivery_time) VALUES (?,?,?,?,?,?,?,?)')
if (db.prepare('SELECT COUNT(*) AS count FROM restaurants').get().count === 0) {
  for (const [index, item] of restaurants.entries()) seedRestaurants.run(index + 1, ...item, [4.5,4.3,4.6,4.4,4.7,4.5,4.2,4.8][index], '25–35 min')
}

const menuSeed = [
  [1,'Chicken Biryani','Aromatic rice with slow-cooked spiced chicken.',250,'Main Course','https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=700&q=80',1],
  [1,'Paneer Butter Masala','Soft paneer in a rich tomato gravy.',230,'Main Course','https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=700&q=80',1],
  [1,'Veg Biryani','Seasonal vegetables and basmati with warming spices.',180,'Main Course','https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=700&q=80',1],
  [2,'Chicken Burger','Grilled chicken, crisp lettuce and house sauce.',180,'Burgers','https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80',1],
  [2,'French Fries','Golden fries tossed with sea salt.',100,'Sides','https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=700&q=80',1],
  [2,'Chicken Nuggets','Crispy bite-sized chicken with a dip.',160,'Sides','https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=700&q=80',0],
  [3,'Veg Salad','Crunchy greens, cucumber and lemon dressing.',180,'Healthy','https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=700&q=80',1],
  [3,'Grilled Chicken Bowl','Lean grilled chicken with grains and greens.',300,'Main Course','https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=700&q=80',0],
  [4,'Margherita Pizza','Tomato, mozzarella and fresh basil.',250,'Pizza','https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=700&q=80',1],
  [4,'Farmhouse Pizza','Garden-fresh vegetables and cheese.',320,'Pizza','https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=700&q=80',1],
  [5,'Hyderabadi Chicken Dum Biryani','Classic dum biryani with tender chicken.',260,'Biryani','https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=700&q=80',1],
  [5,'Mutton Dum Biryani','Slow-cooked mutton and long-grain basmati.',340,'Biryani','https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=700&q=80',1],
  [6,'Masala Dosa','Crisp dosa filled with spiced potato masala.',100,'Main Course','https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=700&q=80',1],
  [6,'Idli','Soft steamed rice cakes with chutneys.',60,'Breakfast','https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=700&q=80',1],
  [7,'Classic Chicken Burger','Juicy chicken patty with lettuce and sauce.',190,'Burgers','https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80',1],
  [7,'Cold Coffee','Chilled coffee blended smooth and creamy.',120,'Drinks','https://images.unsplash.com/photo-1513558161293-cafb7b2fa68d?auto=format&fit=crop&w=700&q=80',0],
  [8,'Chocolate Cake','Rich chocolate sponge with silky ganache.',150,'Desserts','https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=700&q=80',1],
  [8,'Brownie','Fudgy chocolate brownie, baked in small batches.',100,'Desserts','https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=700&q=80',1],
]
if (db.prepare('SELECT COUNT(*) AS count FROM menu_items').get().count === 0) {
  const insertMenu = db.prepare('INSERT INTO menu_items (restaurant_id,name,description,price,category,image,available) VALUES (?,?,?,?,?,?,?)')
  for (const row of menuSeed) insertMenu.run(...row)
}
