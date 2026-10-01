import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import MenuItem from '../components/MenuItem.jsx'
import { useCart } from '../context/CartContext.jsx'
import api from '../api/api.js'
import { getApiError } from '../api/errors.js'

function RestaurantMenu() {
  const { id } = useParams()
  const [category, setCategory] = useState('All')
  const [restaurant, setRestaurant] = useState(null)
  const [loadedId, setLoadedId] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { addToCart, cartItems } = useCart()

  useEffect(() => {
    let active = true
    api.get(`/restaurants/${id}/menu`).then(({ data }) => {
      if (!active) return
      setRestaurant(data.restaurant)
      setItems(data.items)
      setError('')
      setLoadedId(id)
    }).catch((requestError) => { if (active) { setError(getApiError(requestError)); setLoadedId(id) } }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  if (loading || loadedId !== id) return <div className="api-state page-shell">Loading this restaurant’s menu…</div>
  if (error) return <section className="page-shell not-found"><span className="eyebrow">MENU UNAVAILABLE</span><h1>{error}</h1><Link className="button button-primary" to="/restaurants">Browse restaurants</Link></section>
  if (!restaurant) return <section className="page-shell not-found"><span className="eyebrow">RESTAURANT NOT FOUND</span><h1>We couldn’t find that place.</h1><Link className="button button-primary" to="/restaurants">Browse restaurants</Link></section>

  const categories = ['All', ...new Set(items.map((item) => item.category))]
  const visibleItems = category === 'All' ? items : items.filter((item) => item.category === category)
  return <div className="page-shell menu-page"><Link className="back-link" to="/restaurants">← All restaurants</Link>
    <section className="menu-hero"><img src={restaurant.image} alt="" /><div className="menu-hero-content"><span className="eyebrow">{restaurant.category.toUpperCase()} · {restaurant.location.toUpperCase()}</span><h1>{restaurant.name}<span className="heading-dot">.</span></h1><p>{restaurant.description}</p><div className="menu-meta"><span><b>★</b> {restaurant.rating} rating</span><i /><span>◷ {restaurant.deliveryTime}</span><i /><span>₹40 delivery</span></div></div></section>
    <div className="menu-content"><section className="menu-list"><div className="section-heading compact"><div><span className="eyebrow">COOKED WITH CARE</span><h2>Our menu<span className="heading-dot">.</span></h2></div><span className="results-count">{visibleItems.length} ITEMS</span></div>
      <div className="menu-filters">{categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>
      {items.length ? <div className="menu-item-grid">{visibleItems.map((item) => <MenuItem key={item.id} item={item} onAdd={addToCart} />)}</div> : <div className="empty-results">This restaurant has no menu items yet.</div>}
    </section><aside className="menu-aside"><div className="aside-icon">✳</div><span className="eyebrow">A NOTE FROM THE KITCHEN</span><p>Every dish is made to order with fresh ingredients. Settle in, your favorites are on their way.</p><Link to="/cart">Your bag <span>({cartItems.reduce((sum, item) => sum + item.quantity, 0)})</span> →</Link></aside></div>
  </div>
}
export default RestaurantMenu
