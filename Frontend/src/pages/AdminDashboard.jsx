import { useEffect, useState } from 'react'
import api from '../api/api.js'
import { getApiError } from '../api/errors.js'
import { useAuth } from '../context/AuthContext.jsx'

function AdminDashboard() {
  const { currentUser } = useAuth()
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => { api.get('/dashboard/summary').then(({ data }) => setSummary(data)).catch((requestError) => setError(getApiError(requestError))).finally(() => setLoading(false)) }, [])
  return <section className="page-shell dashboard-page"><span className="eyebrow">SMART FOOD ADMIN</span><h1>Admin Dashboard<span className="heading-dot">.</span></h1><p>Welcome, {currentUser?.name}. A live summary from the ordering database.</p>
    {error && <div className="form-message form-error" role="alert">{error}</div>}{loading ? <div className="api-state">Loading summary…</div> : summary && <div className="dashboard-cards"><article><span>TOTAL ORDERS</span><strong>{summary.totalOrders}</strong><small>Across the platform</small></article><article><span>REVENUE</span><strong>₹{summary.revenue}</strong><small>Order totals</small></article>{Object.entries(summary.byStatus || {}).map(([status, count]) => <article key={status}><span>{status.replaceAll('_', ' ')}</span><strong>{count}</strong><small>Orders at this stage</small></article>)}</div>}
  </section>
}
export default AdminDashboard
