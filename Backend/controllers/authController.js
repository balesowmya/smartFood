import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../config/database.js'
import { HttpError } from '../utils/http.js'

const safeUser = (row) => ({ id: row.id, name: row.name, email: row.email, role: row.role })
const roles = new Set(['customer', 'restaurant_owner', 'delivery_partner'])

export function register(req, res) {
  const { name, email, password, role } = req.body || {}
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 120 || typeof email !== 'string' || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email.trim()) || typeof password !== 'string' || password.length < 6 || Buffer.byteLength(password, 'utf8') > 72 || !roles.has(role)) {
    throw new HttpError(400, 'Provide a name, valid email, password between 6 and 72 bytes, and a valid role.')
  }
  try {
    const result = db.prepare('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)').run(name.trim(), email.trim().toLowerCase(), bcrypt.hashSync(password, 12), role)
    const user = safeUser(db.prepare('SELECT * FROM users WHERE id=?').get(result.lastInsertRowid))
    return res.status(201).json({ message: 'Account created. Sign in to continue.', user })
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) throw new HttpError(409, 'An account with this email already exists.')
    throw error
  }
}

export function login(req, res) {
  const { email, password } = req.body || {}
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim()) || typeof password !== 'string' || !password || Buffer.byteLength(password, 'utf8') > 72) throw new HttpError(400, 'Enter a valid email and password.')
  const row = db.prepare('SELECT * FROM users WHERE email=?').get(email.trim().toLowerCase())
  if (!row || !bcrypt.compareSync(password, row.password_hash)) throw new HttpError(401, 'Invalid email or password.')
  const user = safeUser(row)
  const token = jwt.sign({ role: user.role }, process.env.JWT_SECRET, { subject: String(user.id), expiresIn: '24h' })
  return res.json({ token, user })
}

export function me(req, res) {
  res.json({ user: req.user })
}
