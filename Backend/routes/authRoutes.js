import { Router } from 'express'
import { login, me, register } from '../controllers/authController.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { asyncHandler } from '../utils/http.js'

const router = Router()
router.post('/register', asyncHandler(register))
router.post('/login', asyncHandler(login))
router.get('/me', requireAuth, asyncHandler(me))
export default router
