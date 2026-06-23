// NexORA — Root App Component + Router

import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Context providers
import { ThemeProvider } from '@context/ThemeContext';
import { AuthProvider } from '@context/AuthContext';
import { CartProvider } from '@context/CartContext';

// Layout
import Navbar from '@components/layout/Navbar';
import Footer from '@components/layout/Footer';

// Guards
import PrivateRoute from '@components/common/PrivateRoute';
import AdminRoute from '@components/common/AdminRoute';

// Spinner fallback
import Spinner from '@components/common/Spinner';

// ── Pages (lazy-loaded for code splitting) ────────────────────────────────
const Home = lazy(() => import('@pages/Home'));
const Products = lazy(() => import('@pages/Products'));
const ProductDetail = lazy(() => import('@pages/ProductDetail'));
const Cart = lazy(() => import('@pages/Cart'));
const Checkout = lazy(() => import('@pages/Checkout'));
const Login = lazy(() => import('@pages/Login'));
const Register = lazy(() => import('@pages/Register'));
const Profile = lazy(() => import('@pages/Profile'));
const Orders = lazy(() => import('@pages/Orders'));
const OrderDetail = lazy(() => import('@pages/OrderDetail'));
const PaymentSuccess = lazy(() => import('@pages/PaymentSuccess'));
const PaymentFailure = lazy(() => import('@pages/PaymentFailure'));
const NotFound = lazy(() => import('@pages/NotFound'));

// Admin pages
const Dashboard = lazy(() => import('@pages/admin/Dashboard'));
const ManageProducts = lazy(() => import('@pages/admin/ManageProducts'));
const ManageOrders = lazy(() => import('@pages/admin/ManageOrders'));
const ManageUsers = lazy(() => import('@pages/admin/ManageUsers'));

// ── Page loading fallback ─────────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-gray-400 dark:text-gray-500 animate-pulse">Loading...</p>
    </div>
  </div>
);

// ── Layout Wrapper ────────────────────────────────────────────────────────
const AppLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">
      {children}
    </main>
    <Footer />
  </div>
);

// ── App ───────────────────────────────────────────────────────────────────
const App = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* ── Public routes (with layout) ── */}
                <Route
                  path="/"
                  element={
                    <AppLayout>
                      <Home />
                    </AppLayout>
                  }
                />
                <Route
                  path="/products"
                  element={
                    <AppLayout>
                      <Products />
                    </AppLayout>
                  }
                />
                <Route
                  path="/products/:slug"
                  element={
                    <AppLayout>
                      <ProductDetail />
                    </AppLayout>
                  }
                />

                {/* ── Auth pages (full-screen, no layout) ── */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* ── Protected routes (with layout) ── */}
                <Route
                  path="/cart"
                  element={
                    <AppLayout>
                      <Cart />
                    </AppLayout>
                  }
                />
                <Route
                  path="/checkout"
                  element={
                    <AppLayout>
                      <PrivateRoute>
                        <Checkout />
                      </PrivateRoute>
                    </AppLayout>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <AppLayout>
                      <PrivateRoute>
                        <Profile />
                      </PrivateRoute>
                    </AppLayout>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <AppLayout>
                      <PrivateRoute>
                        <Orders />
                      </PrivateRoute>
                    </AppLayout>
                  }
                />
                <Route
                  path="/orders/:id"
                  element={
                    <AppLayout>
                      <PrivateRoute>
                        <OrderDetail />
                      </PrivateRoute>
                    </AppLayout>
                  }
                />
                <Route
                  path="/payment-success"
                  element={
                    <AppLayout>
                      <PrivateRoute>
                        <PaymentSuccess />
                      </PrivateRoute>
                    </AppLayout>
                  }
                />
                <Route
                  path="/payment-failure"
                  element={
                    <AppLayout>
                      <PrivateRoute>
                        <PaymentFailure />
                      </PrivateRoute>
                    </AppLayout>
                  }
                />

                {/* ── Admin routes (admin guard, with layout) ── */}
                <Route
                  path="/admin"
                  element={
                    <AppLayout>
                      <PrivateRoute>
                        <AdminRoute>
                          <Dashboard />
                        </AdminRoute>
                      </PrivateRoute>
                    </AppLayout>
                  }
                />
                <Route
                  path="/admin/products"
                  element={
                    <AppLayout>
                      <PrivateRoute>
                        <AdminRoute>
                          <ManageProducts />
                        </AdminRoute>
                      </PrivateRoute>
                    </AppLayout>
                  }
                />
                <Route
                  path="/admin/orders"
                  element={
                    <AppLayout>
                      <PrivateRoute>
                        <AdminRoute>
                          <ManageOrders />
                        </AdminRoute>
                      </PrivateRoute>
                    </AppLayout>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <AppLayout>
                      <PrivateRoute>
                        <AdminRoute>
                          <ManageUsers />
                        </AdminRoute>
                      </PrivateRoute>
                    </AppLayout>
                  }
                />

                {/* ── 404 ── */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
