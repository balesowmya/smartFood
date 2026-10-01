import { useCart } from '../context/CartContext.jsx'

function Cart() {
  const { cartItems, removeFromCart, increaseQuantity, decreaseQuantity } = useCart()
  return <div className="cart-items">{cartItems.map((item) => <article className="cart-item" key={item.id}>
    {item.image && <img className="cart-item-image" src={item.image} alt="" />}<div className="cart-item-copy"><h3>{item.name}</h3><span>₹{item.price} each</span></div>
    <div className="quantity-control"><button aria-label={`Decrease ${item.name}`} onClick={() => decreaseQuantity(item.id)}>−</button><span>{item.quantity}</span><button aria-label={`Increase ${item.name}`} onClick={() => increaseQuantity(item.id)}>＋</button></div>
    <strong className="cart-subtotal">₹{item.price * item.quantity}</strong><button className="remove-button" onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name}`}>×</button>
  </article>)}</div>
}
export default Cart
