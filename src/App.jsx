import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { TitleUpdater } from './hooks/usePageTitle';

// Layout & Route Guards
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import TrackOrder from './pages/TrackOrder';
import Login from './pages/auth/Login';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import NotFound from './pages/NotFound';

function CatchAllRoute() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return <NotFound />;
}

export default function App() {
  return (
    <BrowserRouter>
      <TitleUpdater />
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<TrackOrder />} />
            <Route path="/login" element={<Login />} />

            {/* Authenticated Staff Routes with Top Navigation */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<OrderDetail />} />
              <Route path="/products" element={<Products />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/suppliers" element={<Suppliers />} />

              {/* Legacy route redirects */}
              <Route path="/dashboard" element={<Navigate to="/orders" replace />} />
              <Route path="/shop" element={<Navigate to="/orders" replace />} />
              <Route path="/cart" element={<Navigate to="/orders" replace />} />
              <Route path="/stock-log" element={<Navigate to="/products" replace />} />
              <Route path="/admin-orders" element={<Navigate to="/orders" replace />} />
              <Route path="/admin-orders/:id" element={<Navigate to="/orders" replace />} />
            </Route>

            {/* Catch-All Route (Unauthenticated users to /login, logged-in users to NotFound) */}
            <Route path="*" element={<CatchAllRoute />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
