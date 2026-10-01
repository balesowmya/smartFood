import { Router } from 'express'
import { createOrder, getOrder, listOrders, listRestaurantOrders, updateOrderStatus } from '../controllers/orderController.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/roleMiddleware.js'
import { asyncHandler } from '../utils/http.js'

const router = Router()
router.post('/orders', requireAuth, requireRole('customer'), asyncHandler(createOrder))
router.get('/orders', requireAuth, asyncHandler(listOrders))
router.get('/orders/:id', requireAuth, asyncHandler(getOrder))
router.put('/orders/:id/status', requireAuth, asyncHandler(updateOrderStatus))
router.get('/restaurant/orders', requireAuth, requireRole('restaurant_owner'), asyncHandler(listRestaurantOrders))
export default router
