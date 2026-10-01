import bcrypt from 'bcryptjs'
import { db } from '../config/database.js'

const demoPassword = process.env.DEMO_SEED_PASSWORD
if (process.env.NODE_ENV === 'production') throw new Error('Demo accounts cannot be seeded in production.')
if (!demoPassword || demoPassword.length < 12) throw new Error('Set DEMO_SEED_PASSWORD to at least 12 characters before running npm run seed:demo.')

const accounts = [
  ['Demo Customer', 'demo.customer@smartfood.local', 'customer'],
  ['Demo Restaurant Owner', 'demo.owner@smartfood.local', 'restaurant_owner'],
  ['Demo Delivery Partner', 'demo.delivery@smartfood.local', 'delivery_partner'],
  ['Demo Administrator', 'demo.admin@smartfood.local', 'admin'],
]
const insert = db.prepare('INSERT OR IGNORE INTO users (name,email,password_hash,role) VALUES (?,?,?,?)')
for (const [name, email, role] of accounts) insert.run(name, email, bcrypt.hashSync(demoPassword, 12), role)
console.log('Demo users are ready. Set the same DEMO_SEED_PASSWORD when signing in locally.')
