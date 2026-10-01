import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { dashboardForRole } from '../dashboard.js'
import { getApiError } from '../api/errors.js'

function Login() {
  const { currentUser, isLoggedIn, login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState(location.state?.email || '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  if (isLoggedIn) return <Navigate to={dashboardForRole(currentUser.role)} replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (!email.trim() || !password) { setError('Enter your email and password.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid email address.'); return }
    setLoading(true)
    try {
      const user = await login(email, password)
      navigate(dashboardForRole(user.role), { replace: true })
    } catch (requestError) { setError(getApiError(requestError, 'Unable to sign in right now. Please try again.')) }
    finally { setLoading(false) }
  }

  return <section className="auth-layout page-shell"><div className="auth-art"><span className="eyebrow">WELCOME BACK</span><h2>Something good<br />is waiting.</h2><p>Your next favorite meal is only a few clicks away.</p><span className="auth-art-mark">S</span></div><div className="auth-form-wrap"><span className="eyebrow">COME ON IN</span><h1>Sign in<span className="heading-dot">.</span></h1><p className="auth-intro">Good to have you back at the table.</p>{location.state?.message && <p className="form-message" role="status">{location.state.message}</p>}<form className="auth-form" onSubmit={handleSubmit} noValidate><label>Email address<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label><label>Password<input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /></label>{error && <p className="form-message form-error" role="alert">{error}</p>}<button className="button button-primary" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'} <span>→</span></button></form><p className="auth-switch">New to Smart Food? <Link to="/register">Create an account →</Link></p><p className="auth-demo-note">Sign in with the account registered through this service.</p></div></section>
}
export default Login
