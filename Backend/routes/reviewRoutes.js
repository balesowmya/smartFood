import { Router } from 'express'
import { createReview, listRestaurantReviews } from '../controllers/reviewController.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/roleMiddleware.js'
import { asyncHandler } from '../utils/http.js'

const router = Router()
router.post('/reviews', requireAuth, requireRole('customer'), asyncHandler(createReview))
router.get('/restaurants/:restaurantId/reviews', asyncHandler(listRestaurantReviews))
export default router
