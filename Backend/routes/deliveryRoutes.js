import { Router } from 'express'
import { assignDelivery, claimDelivery, getDelivery, listAvailableOrders, listDeliveries, updateDeliveryStatus } from '../controllers/deliveryController.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/roleMiddleware.js'
import { asyncHandler } from '../utils/http.js'

const router = Router()
router.get('/delivery/orders', requireAuth, requireRole('delivery_partner'), asyncHandler(listAvailableOrders))
router.post('/delivery/orders/:id/claim', requireAuth, requireRole('delivery_partner'), asyncHandler(claimDelivery))
router.get('/deliveries', requireAuth, asyncHandler(listDeliveries))
router.get('/deliveries/:id', requireAuth, asyncHandler(getDelivery))
router.post('/deliveries/assign', requireAuth, requireRole('restaurant_owner', 'admin'), asyncHandler(assignDelivery))
router.put('/deliveries/:id/status', requireAuth, requireRole('delivery_partner'), asyncHandler(updateDeliveryStatus))
export default router
