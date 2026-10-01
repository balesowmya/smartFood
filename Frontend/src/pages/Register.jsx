import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getApiError } from '../api/errors.js'

function Register() {
  const { isLoggedIn, register } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  if (isLoggedIn) return <Navigate to="/restaurants" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const form = event.currentTarget
    if (!form.reportValidity()) return
    const data = new FormData(form)
    const email = String(data.get('email')).trim()
    const password = String(data.get('password'))
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email address.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== data.get('confirmPassword')) { setError('Your passwords do not match.'); return }
    setLoading(true)
    try {
      await register({ name: data.get('fullName'), email, password, role: data.get('role') })
      navigate('/login', { replace: true, state: { email, message: 'Account created. Sign in to continue.' } })
    } catch (requestError) { setError(getApiError(requestError)) }
    finally { setLoading(false) }
  }

  return <section className="auth-layout page-shell"><div className="auth-art register-art"><span className="eyebrow">A SEAT AT THE TABLE</span><h2>Good things<br />start here.</h2><p>Join the neighborhood’s tastiest little corner.</p><span className="auth-art-mark">S</span></div><div className="auth-form-wrap"><span className="eyebrow">LET’S GET TO KNOW YOU</span><h1>Create account<span className="heading-dot">.</span></h1><p className="auth-intro">A few details, then you’re all set.</p><form className="auth-form" onSubmit={handleSubmit} noValidate><label>Full name<input name="fullName" required autoComplete="name" placeholder="Your name" /></label><label>Email address<input name="email" type="email" required autoComplete="email" placeholder="you@example.com" /></label><div className="form-row"><label>Password<input name="password" type="password" minLength="6" required autoComplete="new-password" placeholder="At least 6 characters" /></label><label>Confirm password<input name="confirmPassword" type="password" minLength="6" required autoComplete="new-password" placeholder="Re-enter password" /></label></div><label>Your role<select name="role" defaultValue="customer" required><option value="customer">Customer</option><option value="restaurant_owner">Restaurant Owner</option><option value="delivery_partner">Delivery Partner</option></select></label>{error && <p className="form-message form-error" role="alert">{error}</p>}<button className="button button-primary" type="submit" disabled={loading}>{loading ? 'Creating account…' : 'Create account'} <span>→</span></button></form><p className="auth-switch">Already have an account? <Link to="/login">Sign in →</Link></p><p className="auth-demo-note">Your account is stored securely by the server.</p></div></section>
}
export default Register
