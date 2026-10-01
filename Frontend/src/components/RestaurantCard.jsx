import { Link } from 'react-router-dom'

function RestaurantCard({ restaurant }) {
  return <article className="restaurant-card">
    <Link to={`/restaurants/${restaurant.id}`} className="restaurant-image-wrap">
    <img src={restaurant.image} alt={restaurant.name} />
    <span className="image-tag">{restaurant.category}</span>
    <span className="rating">
      <span>★</span> {restaurant.rating}</span>
      </Link>
    <div className="restaurant-info">
      <div className="restaurant-title-row">
        <h2>{restaurant.name}</h2>
        <span className="delivery-time">◷ {restaurant.deliveryTime}</span>
        </div>
      <p className="restaurant-tagline">{restaurant.tagline || restaurant.description}</p>
      <div className="restaurant-meta">
        <span>⌖ {restaurant.location}</span>
        <span>Delivery <b>₹40</b></span>
        </div>
      <Link className="card-action" to={`/restaurants/${restaurant.id}`}>View menu <span>↗</span>
      </Link>
    </div>
  </article>
}
export default RestaurantCard
