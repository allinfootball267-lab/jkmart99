import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import CartDrawer from './components/CartDrawer';
import Layout from './components/Layout';
import Home from './pages/Home';
import ProductPage from './pages/ProductPage';
import Checkout from './pages/Checkout';
import TermsAndPolicies from './pages/TermsAndPolicies';
import Auth from './pages/Auth';
import MyOrders from './pages/MyOrders';

import AdminGuard from './components/AdminGuard';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import ProductsAdmin from './pages/admin/Products';
import OrdersAdmin from './pages/admin/Orders';
import UsersAdmin from './pages/admin/Users';
import SettingsAdmin from './pages/admin/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <CartDrawer />
        <Routes>
          {/* Public Customer Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="product/:id" element={<ProductPage />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="checkout/:id" element={<Checkout />} />
            <Route path="policies" element={<TermsAndPolicies />} />
            <Route path="auth" element={<Auth />} />
            <Route path="my-orders" element={<MyOrders />} />
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<AdminGuard />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<ProductsAdmin />} />
              <Route path="orders" element={<OrdersAdmin />} />
              <Route path="users" element={<UsersAdmin />} />
              <Route path="settings" element={<SettingsAdmin />} />
            </Route>
          </Route>
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}
