import { useState } from 'react'

function MenuItem({ item, onAdd }) {
  const [added, setAdded] = useState(false)
  function handleAdd() {
    onAdd(item)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1100)
  }
  return <article className="menu-item"><img src={item.image} alt={item.name} /><div className="menu-item-info"><div className="menu-item-heading"><h3>{item.name}</h3><span className="veg-mark" aria-label="Vegetarian" /></div><p>{item.description}</p><strong>₹{item.price}</strong></div>
    <div className="menu-item-action">{item.available ? <button className="button button-outline add-button" onClick={handleAdd}>{added ? 'Added ✓' : 'Add to Cart'}</button> : <><span className="unavailable-label">Unavailable</span><button className="button button-disabled" disabled>Add to Cart</button></>}</div>
  </article>
}
export default MenuItem
