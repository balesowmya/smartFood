import { Router } from 'express'
import { createRestaurant, deleteRestaurant, getOwnerMenu, getRestaurant, getRestaurantMenu, listRestaurants, updateRestaurant } from '../controllers/restaurantController.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/roleMiddleware.js'
import { asyncHandler } from '../utils/http.js'

const router = Router()
router.get('/', asyncHandler(listRestaurants))
router.post('/', requireAuth, requireRole('restaurant_owner', 'admin'), asyncHandler(createRestaurant))
router.get('/:id/menu', asyncHandler(getRestaurantMenu))
router.get('/:id', asyncHandler(getRestaurant))
router.put('/:id', requireAuth, requireRole('restaurant_owner', 'admin'), asyncHandler(updateRestaurant))
router.delete('/:id', requireAuth, requireRole('restaurant_owner', 'admin'), asyncHandler(deleteRestaurant))
export default router
