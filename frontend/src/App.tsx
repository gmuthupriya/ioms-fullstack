import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { CartProvider } from './context/CartContext.js';
import { Navbar } from './components/Navbar.js';

import { Dashboard } from './pages/Dashboard.js';
import { Products } from './pages/Products.js';
import { ProductDetail } from './pages/ProductDetail.js';
import { Cart } from './pages/Cart.js';
import { Checkout } from './pages/Checkout.js';
import { Orders } from './pages/Orders.js';
import { Inventory } from './pages/Inventory.js';
import { Profile } from './pages/Profile.js';
import { Login } from './pages/Login.js';
import { Register } from './pages/Register.js';
import { AdminUsers } from './pages/admin/AdminUsers.js';

import { Payment } from './pages/Payment.js';
import { OrderConfirmation } from './pages/OrderConfirmation.js';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <BrowserRouter>
            <div className="app-container">
              <Navbar />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/payment/:orderId" element={<Payment />} />
                  <Route path="/orders/confirmation/:orderId" element={<OrderConfirmation />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
