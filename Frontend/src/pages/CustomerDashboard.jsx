import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/api.js'
import { getApiError } from '../api/errors.js'
import { useAuth } from '../context/AuthContext.jsx'

function CustomerDashboard() {
  const { currentUser } = useAuth()
  const [orders, setOrders] = useState([])
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    Promise.all([api.get('/orders'), api.get('/dashboard/summary')]).then(([orderResponse, summaryResponse]) => {
      setOrders(orderResponse.data)
      setSummary(summaryResponse.data)
    }).catch((requestError) => setError(getApiError(requestError))).finally(() => setLoading(false))
  }, [])
  return <section className="page-shell dashboard-page"><span className="eyebrow">YOUR SMART FOOD</span><h1>Welcome, {currentUser?.name}<span className="heading-dot">.</span></h1><p>Your orders and their latest updates, all in one place.</p>
    {summary && <div className="dashboard-cards"><article><span>TOTAL ORDERS</span><strong>{summary.totalOrders}</strong><small>Placed with Smart Food</small></article><article><span>IN PROGRESS</span><strong>{(summary.byStatus?.PLACED || 0) + (summary.byStatus?.ACCEPTED || 0) + (summary.byStatus?.PREPARING || 0) + (summary.byStatus?.OUT_FOR_DELIVERY || 0)}</strong><small>Still on their way</small></article></div>}
    <div className="dashboard-list-head"><h2>Your orders</h2><Link to="/restaurants">Find something to eat →</Link></div>
    {loading ? <div className="api-state">Loading your orders…</div> : error ? <div className="form-message form-error">{error}</div> : orders.length ? <div className="dashboard-order-list">{orders.map((order) => <Link className="dashboard-order" key={order.id} to={`/orders/${order.id}`}><span><small>ORDER #{order.id}</small><strong>{order.restaurantName}</strong></span><span>{order.status.replaceAll('_', ' ')}</span><b>₹{order.total}</b><span>View →</span></Link>)}</div> : <div className="api-state">No orders yet. <Link to="/restaurants">Browse restaurants</Link></div>}
  </section>
}
export default CustomerDashboard
