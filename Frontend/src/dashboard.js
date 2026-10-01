export function dashboardForRole(role) {
  if (role === 'restaurant_owner' || role === 'restaurant owner') return '/restaurant-dashboard'
  if (role === 'delivery_partner' || role === 'delivery partner') return '/delivery-dashboard'
  if (role === 'admin') return '/admin-dashboard'
  return role === 'customer' ? '/customer-dashboard' : '/restaurants'
}
