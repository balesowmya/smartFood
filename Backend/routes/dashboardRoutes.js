import { Router } from 'express'
import { getSummary } from '../controllers/dashboardController.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { asyncHandler } from '../utils/http.js'

const router = Router()
router.get('/dashboard/summary', requireAuth, asyncHandler(getSummary))
export default router
