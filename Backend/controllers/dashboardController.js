import { db } from '../config/database.js'

export function getSummary(req, res) {
  const where = req.user.role === 'customer'
    ? 'o.user_id=?'
    : req.user.role === 'restaurant_owner'
      ? 'o.restaurant_id IN (SELECT id FROM restaurants WHERE owner_id=?)'
      : req.user.role === 'delivery_partner'
        ? 'o.delivery_partner_id=?'
        : '1=1'
  const args = where === '1=1' ? [] : [req.user.id]
  const rows = db.prepare(`SELECT o.status,COUNT(*) AS count,COALESCE(SUM(o.total),0) AS revenue FROM orders o WHERE ${where} GROUP BY o.status`).all(...args)
  const totalOrders = rows.reduce((sum, row) => sum + row.count, 0)
  const summary = { totalOrders, revenue: rows.reduce((sum, row) => sum + row.revenue, 0), byStatus: Object.fromEntries(rows.map(({ status, count }) => [status, count])) }
  if (req.user.role === 'customer') {
    summary.spending = summary.revenue
    summary.recentOrders = db.prepare('SELECT id,status,total,created_at AS createdAt FROM orders WHERE user_id=? ORDER BY created_at DESC LIMIT 5').all(req.user.id)
  } else if (req.user.role === 'restaurant_owner') {
    summary.restaurantCount = db.prepare('SELECT COUNT(*) AS count FROM restaurants WHERE owner_id=?').get(req.user.id).count
    summary.menuCount = db.prepare('SELECT COUNT(*) AS count FROM menu_items WHERE restaurant_id IN (SELECT id FROM restaurants WHERE owner_id=?)').get(req.user.id).count
    summary.pendingOrders = summary.byStatus.PLACED || 0
    summary.completedOrders = summary.byStatus.DELIVERED || 0
  } else if (req.user.role === 'delivery_partner') {
    summary.assignedDeliveries = db.prepare('SELECT COUNT(*) AS count FROM deliveries WHERE delivery_partner_id=?').get(req.user.id).count
    summary.pendingDeliveries = db.prepare("SELECT COUNT(*) AS count FROM deliveries WHERE delivery_partner_id=? AND status!='DELIVERED'").get(req.user.id).count
    summary.completedDeliveries = db.prepare("SELECT COUNT(*) AS count FROM deliveries WHERE delivery_partner_id=? AND status='DELIVERED'").get(req.user.id).count
  } else {
    summary.totalUsers = db.prepare('SELECT COUNT(*) AS count FROM users').get().count
    summary.totalRestaurants = db.prepare('SELECT COUNT(*) AS count FROM restaurants').get().count
    summary.totalDeliveries = db.prepare('SELECT COUNT(*) AS count FROM deliveries').get().count
  }
  res.json(summary)
}
