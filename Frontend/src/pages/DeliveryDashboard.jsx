import { useCallback, useEffect, useState } from 'react'
import api from '../api/api.js'
import { getApiError } from '../api/errors.js'
import { useAuth } from '../context/AuthContext.jsx'

function DeliveryDashboard() {
  const { currentUser } = useAuth()
  const [deliveries, setDeliveries] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const loadDeliveries = useCallback(() => {
    setError('')
    return api.get('/delivery/orders').then(({ data }) => setDeliveries(data)).catch((requestError) => setError(getApiError(requestError))).finally(() => setLoading(false))
  }, [])
  useEffect(() => {
    api.get('/delivery/orders').then(({ data }) => setDeliveries(data)).catch((requestError) => setError(getApiError(requestError))).finally(() => setLoading(false))
  }, [])

  async function claim(orderId) {
    try { await api.post(`/delivery/orders/${orderId}/claim`); await loadDeliveries() }
    catch (requestError) { setError(getApiError(requestError)) }
  }
  async function updateStatus(order) {
    const status = order.status === 'PREPARING' ? 'OUT_FOR_DELIVERY' : 'DELIVERED'
    try { await api.put(`/orders/${order.id}/status`, { status }); await loadDeliveries() }
    catch (requestError) { setError(getApiError(requestError)) }
  }

  return <section className="page-shell dashboard-page"><span className="eyebrow">SMART FOOD PARTNER</span><h1>Delivery Dashboard<span className="heading-dot">.</span></h1><p>Welcome, {currentUser?.name}. Claim an available delivery and keep its status current.</p><div className="dashboard-list-head"><h2>Available deliveries</h2><button className="text-button" onClick={loadDeliveries}>Refresh</button></div>
    {error && <div className="form-message form-error" role="alert">{error}</div>}{loading ? <div className="api-state">Finding deliveries…</div> : deliveries.length ? <div className="dashboard-order-list">{deliveries.map((order) => <article className="dashboard-order" key={order.id}><span><small>ORDER #{order.id}</small><strong>{order.restaurantName}</strong></span><span>{order.status.replaceAll('_', ' ')}</span><span>{order.deliveryAddress}</span>{order.deliveryPartnerId ? <button className="button button-outline" onClick={() => updateStatus(order)}>{order.status === 'PREPARING' ? 'Start delivery' : 'Mark delivered'}</button> : <button className="button button-primary" onClick={() => claim(order.id)}>Claim delivery</button>}</article>)}</div> : <div className="api-state">No deliveries are ready right now.</div>}
  </section>
}
export default DeliveryDashboard
