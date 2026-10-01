import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import { CartProvider } from './context/CartContext.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Restaurants from './pages/Restaurants.jsx'
import RestaurantMenu from './pages/RestaurantMenu.jsx'
import CartPage from './pages/CartPage.jsx'
import OrderTracking from './pages/OrderTracking.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import RestaurantDashboard from './pages/RestaurantDashboard.jsx'
import DeliveryDashboard from './pages/DeliveryDashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import CustomerDashboard from './pages/CustomerDashboard.jsx'

function App() {
  return (
    <AuthProvider>
    <CartProvider>
      <Navbar />
      <main className="site-main">
        <Routes>
          <Route path="/" element={<Navigate to="/restaurants" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/restaurants" element={<Restaurants />} />
          <Route path="/restaurants/:id" element={<RestaurantMenu />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders/:id" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
          <Route path="/customer-dashboard" element={<ProtectedRoute role="customer"><CustomerDashboard /></ProtectedRoute>} />
          <Route path="/restaurant-dashboard" element={<ProtectedRoute role="restaurant_owner"><RestaurantDashboard /></ProtectedRoute>} />
          <Route path="/delivery-dashboard" element={<ProtectedRoute role="delivery_partner"><DeliveryDashboard /></ProtectedRoute>} />
          <Route path="/admin-dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/restaurants" replace />} />
        </Routes>
      </main>
      <footer className="site-footer">Good food, right around the corner. <span>© 2026 Smart Food</span></footer>
    </CartProvider>
    </AuthProvider>
  )
}

export default App
