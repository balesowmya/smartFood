import cors from 'cors'
import express from 'express'
import { db } from './config/database.js'
import authRoutes from './routes/authRoutes.js'
import restaurantRoutes from './routes/restaurantRoutes.js'
import menuRoutes from './routes/menuRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import deliveryRoutes from './routes/deliveryRoutes.js'
import reviewRoutes from './routes/reviewRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import { errorMiddleware, notFoundMiddleware } from './middleware/errorMiddleware.js'

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || /^replace[_-]/i.test(process.env.JWT_SECRET)) {
  throw new Error('Set JWT_SECRET to a private random value of at least 32 characters in Backend/.env or the host environment.')
}

const app = express()
const PORT = process.env.PORT || 5000
const configuredOrigins = [process.env.FRONTEND_URL]
  .filter(Boolean)
  .flatMap((value) => value.split(','))
  .map((value) => value.trim())
  .filter(Boolean)
const allowedOrigins = new Set(['http://localhost:5173', 'http://localhost:5174', ...configuredOrigins])

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true)
    return callback(new Error('Origin not allowed by CORS'))
  },
}))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  try {
    db.prepare('SELECT 1').get()
    res.json({
      status: 'ok',
      service: 'smart-food-delivery-api',
      database: 'ok',
    })
  } catch (error) {
    console.error('Health check database query failed:', error)
    res.status(500).json({
      status: 'error',
      service: 'smart-food-delivery-api',
      database: 'error',
    })
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/restaurants', restaurantRoutes)
app.use('/api', menuRoutes)
app.use('/api', orderRoutes)
app.use('/api', deliveryRoutes)
app.use('/api', reviewRoutes)
app.use('/api', dashboardRoutes)
app.use(notFoundMiddleware)
app.use(errorMiddleware)

app.listen(PORT, '0.0.0.0', () => console.log(`Smart Food API listening on port ${PORT}`))
