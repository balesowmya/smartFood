import { Router } from 'express'
import { createMenuItem, deleteMenuItem, updateMenuItem } from '../controllers/menuController.js'
import { getOwnerMenu } from '../controllers/restaurantController.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/roleMiddleware.js'
import { asyncHandler } from '../utils/http.js'

const router = Router()
router.get('/restaurant/menu', requireAuth, requireRole('restaurant_owner', 'admin'), asyncHandler(getOwnerMenu))
router.post('/restaurants/:restaurantId/menu', requireAuth, requireRole('restaurant_owner', 'admin'), asyncHandler(createMenuItem))
router.put('/menu/:id', requireAuth, requireRole('restaurant_owner', 'admin'), asyncHandler(updateMenuItem))
router.delete('/menu/:id', requireAuth, requireRole('restaurant_owner', 'admin'), asyncHandler(deleteMenuItem))
export default router
