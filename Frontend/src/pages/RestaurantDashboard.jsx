import { useCallback, useEffect, useState } from 'react'
import api from '../api/api.js'
import { getApiError } from '../api/errors.js'
import { useAuth } from '../context/AuthContext.jsx'

function RestaurantDashboard() {
  const { currentUser } = useAuth()
  const [orders, setOrders] = useState([])
  const [menu, setMenu] = useState([])
  const [restaurant, setRestaurant] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const loadData = useCallback(async () => {
    setError('')
    try {
      const [orderResponse, menuResponse] = await Promise.all([api.get('/restaurant/orders'), api.get('/restaurant/menu')])
      setOrders(orderResponse.data)
      setRestaurant(menuResponse.data.restaurant)
      setMenu(menuResponse.data.items)
    } catch (requestError) { setError(getApiError(requestError)) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => {
    Promise.all([api.get('/restaurant/orders'), api.get('/restaurant/menu')]).then(([orderResponse, menuResponse]) => {
      setOrders(orderResponse.data)
      setRestaurant(menuResponse.data.restaurant)
      setMenu(menuResponse.data.items)
    }).catch((requestError) => setError(getApiError(requestError))).finally(() => setLoading(false))
  }, [])

  async function createRestaurant(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    try {
      const { data } = await api.post('/restaurants', Object.fromEntries(form))
      setRestaurant(data)
      setMessage('Your restaurant has been created.')
      loadData()
    } catch (requestError) { setError(getApiError(requestError)) }
  }

  async function updateStatus(order) {
    const nextStatus = order.status === 'PLACED' ? 'ACCEPTED' : 'PREPARING'
    try { await api.put(`/orders/${order.id}/status`, { status: nextStatus }); loadData() }
    catch (requestError) { setError(getApiError(requestError)) }
  }

  async function toggleAvailability(item) {
    try { await api.put(`/menu/${item.id}`, { available: !item.available }); loadData() }
    catch (requestError) { setError(getApiError(requestError)) }
  }

  async function addMenuItem(event) {
    event.preventDefault()
    if (!restaurant) return
    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form))
    values.price = Number(values.price)
    try {
      await api.post(`/restaurants/${restaurant.id}/menu`, values)
      form.reset()
      setMessage('Menu item added.')
      loadData()
    } catch (requestError) { setError(getApiError(requestError)) }
  }

  return <section className="page-shell dashboard-page"><span className="eyebrow">SMART FOOD PARTNER</span><h1>Restaurant Dashboard<span className="heading-dot">.</span></h1><p>Welcome, {currentUser?.name}. Manage your menu and incoming orders.</p>
    {error && <div className="form-message form-error" role="alert">{error}</div>}{message && <div className="form-message" role="status">{message}</div>}
    {!loading && !restaurant && <form className="dashboard-create-form" onSubmit={createRestaurant}><h2>Set up your restaurant</h2><label>Name<input name="name" required /></label><label>Category<input name="category" required /></label><label>Location<input name="location" required defaultValue="Hyderabad" /></label><label>Description<textarea name="description" required rows="2" /></label><button className="button button-primary">Create restaurant</button></form>}
    {restaurant && <div className="dashboard-cards"><article><span>ORDERS</span><strong>{orders.length}</strong><small>From {restaurant.name}</small></article><article><span>MENU ITEMS</span><strong>{menu.length}</strong><small>Availability managed below</small></article><article><span>REVENUE</span><strong>₹{orders.reduce((sum, order) => sum + order.total, 0)}</strong><small>From current orders</small></article></div>}
    <div className="dashboard-list-head"><h2>Restaurant orders</h2><button className="text-button" onClick={loadData}>Refresh</button></div>
    {loading ? <div className="api-state">Loading restaurant data…</div> : orders.length ? <div className="dashboard-order-list">{orders.map((order) => <article className="dashboard-order" key={order.id}><span><small>ORDER #{order.id}</small><strong>{order.status.replaceAll('_', ' ')}</strong></span><span>₹{order.total}</span>{['PLACED', 'ACCEPTED'].includes(order.status) && <button className="button button-outline" onClick={() => updateStatus(order)}>{order.status === 'PLACED' ? 'Accept order' : 'Start preparing'}</button>}</article>)}</div> : <div className="api-state">No restaurant orders yet.</div>}
    {restaurant && <><div className="dashboard-list-head"><h2>Your menu</h2></div><form className="dashboard-create-form menu-create-form" onSubmit={addMenuItem}><h3>Add a menu item</h3><div className="form-row"><label>Name<input name="name" required /></label><label>Category<input name="category" required /></label></div><label>Description<input name="description" required /></label><label>Price (₹)<input name="price" type="number" min="0" step="1" required /></label><label>Image URL (optional)<input name="image" type="url" /></label><button className="button button-primary">Add menu item</button></form>{menu.length ? <div className="dashboard-order-list">{menu.map((item) => <article className="dashboard-order" key={item.id}><span><strong>{item.name}</strong><small>₹{item.price} · {item.category}</small></span><span>{item.available ? 'Available' : 'Unavailable'}</span><button className="button button-outline" onClick={() => toggleAvailability(item)}>{item.available ? 'Mark unavailable' : 'Make available'}</button></article>)}</div> : <div className="api-state">No menu items yet.</div>}</>}
  </section>
}
export default RestaurantDashboard
