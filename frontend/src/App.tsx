import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import ProductPage from './pages/ProductPage';
import Checkout from './pages/Checkout';
import TermsAndPolicies from './pages/TermsAndPolicies';
import Auth from './pages/Auth';
import MyOrders from './pages/MyOrders';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Customer Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="product/:id" element={<ProductPage />} />
          <Route path="checkout/:id" element={<Checkout />} />
          <Route path="policies" element={<TermsAndPolicies />} />
          <Route path="auth" element={<Auth />} />
          <Route path="my-orders" element={<MyOrders />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
