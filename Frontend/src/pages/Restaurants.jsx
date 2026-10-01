import { useEffect, useMemo, useState } from 'react'
import RestaurantCard from '../components/RestaurantCard.jsx'
import api from '../api/api.js'
import { getApiError } from '../api/errors.js'

function Restaurants() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    api.get('/restaurants').then(({ data }) => setRestaurants(data)).catch((requestError) => setError(getApiError(requestError))).finally(() => setLoading(false))
  }, [])
  const categories = ['All', ...new Set(restaurants.map((restaurant) => restaurant.category))]
  const filtered = useMemo(() => restaurants.filter((restaurant) => {
    const matchesCategory = category === 'All' || restaurant.category === category
    const query = search.trim().toLowerCase()
    return matchesCategory && (!query || `${restaurant.name} ${restaurant.category} ${restaurant.location}`.toLowerCase().includes(query))
  }), [category, restaurants, search])
  return <div className="page-shell">
    <section className="hero-banner"><div className="hero-copy"><span className="eyebrow"><i /> YOUR CITY, YOUR TABLE</span><h1>Good food.<br /><em>Great mood.</em></h1><p>Discover the neighborhood’s best kitchens, delivered fresh to your door.</p><div className="hero-location"><span>⌖</span><div><small>DELIVERING TO</small><strong>Hyderabad <b>⌄</b></strong></div><span className="hero-location-change">Change</span></div></div>
      <div className="hero-photo" role="img" aria-label="Freshly served restaurant meal"><div className="hero-photo-note"><span>✦</span><strong>Made fresh,<br />just for you.</strong></div></div>
      <div className="hero-index"><span>01</span><i /><span>04</span></div>
    </section>
    <section className="discover-section"><div className="section-heading"><div><span className="eyebrow">A LITTLE SOMETHING DELICIOUS</span><h2>Discover restaurants<span className="heading-dot">.</span></h2></div><p>Thoughtfully picked spots, just around the corner.</p></div>
      <div className="listing-tools"><label className="search-box"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search restaurants or cuisines" aria-label="Search restaurants" />{search && <button onClick={() => setSearch('')} aria-label="Clear search">×</button>}<kbd>⌘ K</kbd></label><span className="results-count">{filtered.length} PLACES TO EXPLORE</span></div>
      <div className="category-tabs" aria-label="Filter by category">{categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item === 'All' && <span>✳ </span>}{item}</button>)}</div>
      {loading ? <div className="api-state">Finding good food near you…</div> : error ? <div className="api-state api-error" role="alert">{error} <button onClick={() => window.location.reload()}>Try again</button></div> : filtered.length ? <div className="restaurant-grid">{filtered.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)}</div> : <div className="empty-results"><span>⌕</span><h3>{restaurants.length ? 'No spots found' : 'No restaurants available yet'}</h3><p>{restaurants.length ? 'Try a different restaurant name or cuisine.' : 'Please check back soon.'}</p></div>}
    </section>
    <section className="promo-strip"><span className="promo-icon">✳</span><div><strong>A good meal is closer than you think.</strong><p>Find something you’ll love, in just a few clicks.</p></div><span className="promo-arrow">↗</span></section>
  </div>
}
export default Restaurants
