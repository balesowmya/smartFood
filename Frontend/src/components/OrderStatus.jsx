const statuses = [
  ['PLACED', 'Placed'],
  ['ACCEPTED', 'Accepted'],
  ['PREPARING', 'Preparing'],
  ['OUT_FOR_DELIVERY', 'Out for Delivery'],
  ['DELIVERED', 'Delivered'],
]

function OrderStatus({ currentStatus }) {
  const currentIndex = statuses.findIndex(([value]) => value === currentStatus)
  return <div className="order-timeline">{statuses.map(([value, label], index) => <div className={`timeline-step ${index < currentIndex ? 'complete' : ''} ${index === currentIndex ? 'current' : ''}`} key={value}>
    <div className="timeline-marker">{index < currentIndex ? '✓' : String(index + 1).padStart(2, '0')}</div><div className="timeline-copy"><strong>{label}</strong>{index === currentIndex && <span>Happening now</span>}</div>{index < statuses.length - 1 && <div className="timeline-line" />}
  </div>)}</div>
}
export default OrderStatus
