import jwt from 'jsonwebtoken'
import { db } from '../config/database.js'

export function requireAuth(req, res, next) {
  const authorization = req.get('authorization') || ''
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  if (!match) return res.status(401).json({ message: 'Please sign in to continue.' })
  try {
    const claims = jwt.verify(match[1], process.env.JWT_SECRET)
    const id = Number(claims.sub)
    if (!Number.isSafeInteger(id) || id < 1) throw new Error('Invalid subject')
    const user = db.prepare('SELECT id,name,email,role,created_at AS createdAt FROM users WHERE id=?').get(id)
    if (!user) return res.status(401).json({ message: 'Your session has expired. Please sign in again.' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ message: 'Your session has expired. Please sign in again.' })
  }
}
