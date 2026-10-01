import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { dashboardForRole } from '../dashboard.js'

function Navbar() {
  const { cartItems } = useCart()
  const { currentUser, isLoggedIn, logout } = useAuth()
  const { clearCart } = useCart()
  const navigate = useNavigate()
  const count = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const handleLogout = () => { logout(); clearCart(); navigate('/login') }

  return <header className="navbar"><div className="nav-inner">
    <Link className="brand" to="/restaurants"><span className="brand-mark">S</span><span>smart<span className="brand-accent">food</span><small>GOOD FOOD, DELIVERED</small></span></Link>
    <nav className="nav-links" aria-label="Main navigation">
      {!isLoggedIn && <NavLink to="/restaurants" end>Home</NavLink>}
      <NavLink to="/restaurants">Restaurants</NavLink>
      <NavLink to="/cart" className="cart-link">Cart <span className="cart-count">{count}</span></NavLink>
      {isLoggedIn ? <><NavLink to={dashboardForRole(currentUser.role)}>Dashboard</NavLink><span className="welcome-user">Welcome, {currentUser.name}</span><button className="nav-logout" onClick={handleLogout}>Logout</button></> : <><NavLink to="/login">Login</NavLink><Link className="nav-register" to="/register">Register</Link></>}
    </nav>
  </div></header>
}
export default Navbar
