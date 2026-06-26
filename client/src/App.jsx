// NexORA — Root App Component + Router

import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Context providers
import { ThemeProvider } from '@context/ThemeContext';
import { AuthProvider } from '@context/AuthContext';
import { CartProvider } from '@context/CartContext';
import { WishlistProvider } from '@context/WishlistContext';
import { AIProvider } from '@context/AIContext';

// Layout
import Navbar from '@components/layout/Navbar';
import Footer from '@components/layout/Footer';
import AdminLayout from '@components/layout/AdminLayout';

// Public Pages
import GetStarted from '@pages/GetStarted';

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
const Wishlist = lazy(() => import('@pages/Wishlist'));
const Login = lazy(() => import('@pages/Login'));
const Register = lazy(() => import('@pages/Register'));
const Profile = lazy(() => import('@pages/Profile'));
const Orders = lazy(() => import('@pages/Orders'));
const OrderDetail = lazy(() => import('@pages/OrderDetail'));
const OrderSuccess = lazy(() => import('@pages/OrderSuccess'));
const PaymentFailure = lazy(() => import('@pages/PaymentFailure'));
const PaymentSuccess = lazy(() => import('@pages/PaymentSuccess'));
const NotFound = lazy(() => import('@pages/NotFound'));
const Concierge = lazy(() => import('@pages/Concierge'));
const ForgotPassword = lazy(() => import('@pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@pages/ResetPassword'));
const PrivacyPolicy = lazy(() => import('@pages/PrivacyPolicy'));

const TermsOfService = lazy(() => import('@pages/TermsOfService'));
const Contact = lazy(() => import('@pages/Contact'));

// Admin pages
const Dashboard = lazy(() => import('@pages/admin/Dashboard'));
const ManageProducts = lazy(() => import('@pages/admin/ManageProducts'));
const AddProduct = lazy(() => import('@pages/admin/AddProduct'));
const ManageCategories = lazy(() => import('@pages/admin/ManageCategories'));
const ManageOrders = lazy(() => import('@pages/admin/ManageOrders'));
const ManageUsers = lazy(() => import('@pages/admin/ManageUsers'));
const ManageCustomers = lazy(() => import('@pages/admin/ManageCustomers'));
const ManageReviews = lazy(() => import('@pages/admin/ManageReviews'));
const ManageDiscounts = lazy(() => import('@pages/admin/ManageDiscounts'));
const Analytics = lazy(() => import('@pages/admin/Analytics'));
const Reports = lazy(() => import('@pages/admin/Reports'));
const RolesPermissions = lazy(() => import('@pages/admin/RolesPermissions'));
const Settings = lazy(() => import('@pages/admin/Settings'));
const Payments = lazy(() => import('@pages/admin/Payments'));
const Shipping = lazy(() => import('@pages/admin/Shipping'));
const EditProduct = lazy(() => import('@pages/admin/EditProduct'));
const AIStudio = lazy(() => import('@pages/admin/AIStudio'));
const AITest = lazy(() => import('@pages/admin/AITest'));

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
          <WishlistProvider>
            <CartProvider>
              <AIProvider>
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
                  path="/product/:slug"
                  element={
                    <AppLayout>
                      <ProductDetail />
                    </AppLayout>
                  }
                />
                <Route
                  path="/wishlist"
                  element={
                    <AppLayout>
                      <Wishlist />
                    </AppLayout>
                  }
                />

                {/* ── Public routes (no layout) ── */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/get-started" element={<GetStarted />} />

                <Route
                  path="/concierge"
                  element={
                    <AppLayout>
                      <Concierge />
                    </AppLayout>
                  }
                />
                <Route
                  path="/privacy-policy"
                  element={
                    <AppLayout>
                      <PrivacyPolicy />
                    </AppLayout>
                  }
                />
                <Route
                  path="/terms-of-service"
                  element={
                    <AppLayout>
                      <TermsOfService />
                    </AppLayout>
                  }
                />
                <Route
                  path="/contact"
                  element={
                    <AppLayout>
                      <Contact />
                    </AppLayout>
                  }
                />

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
                      <Checkout />
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
                  path="/order-success"
                  element={
                    <AppLayout>
                      <PrivateRoute>
                        <OrderSuccess />
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
                <Route
                  path="/payment-success"
                  element={
                    <AppLayout>
                      <PaymentSuccess />
                    </AppLayout>
                  }
                />

                {/* ── Admin routes (admin guard, with AdminLayout) ── */}
                <Route
                  path="/admin"
                  element={
                    <AdminLayout>
                      <PrivateRoute>
                        <AdminRoute>
                          <Dashboard />
                        </AdminRoute>
                      </PrivateRoute>
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/ai-studio"
                  element={
                    <AdminLayout>
                      <PrivateRoute>
                        <AdminRoute>
                          <AIStudio />
                        </AdminRoute>
                      </PrivateRoute>
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/ai-test"
                  element={
                    <AdminLayout>
                      <PrivateRoute>
                        <AdminRoute>
                          <AITest />
                        </AdminRoute>
                      </PrivateRoute>
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/products"
                  element={
                    <AdminLayout>
                      <PrivateRoute>
                        <AdminRoute>
                          <ManageProducts />
                        </AdminRoute>
                      </PrivateRoute>
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/products/new"
                  element={
                    <AdminLayout>
                      <PrivateRoute>
                        <AdminRoute>
                          <AddProduct />
                        </AdminRoute>
                      </PrivateRoute>
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/orders"
                  element={
                    <AdminLayout>
                      <PrivateRoute>
                        <AdminRoute>
                          <ManageOrders />
                        </AdminRoute>
                      </PrivateRoute>
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <AdminLayout>
                      <PrivateRoute>
                        <AdminRoute>
                          <ManageUsers />
                        </AdminRoute>
                      </PrivateRoute>
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/analytics"
                  element={
                    <AdminLayout>
                      <PrivateRoute>
                        <AdminRoute>
                          <Analytics />
                        </AdminRoute>
                      </PrivateRoute>
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/categories"
                  element={
                    <AdminLayout>
                      <PrivateRoute>
                        <AdminRoute>
                          <ManageCategories />
                        </AdminRoute>
                      </PrivateRoute>
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/customers"
                  element={
                    <AdminLayout>
                      <PrivateRoute>
                        <AdminRoute>
                          <ManageCustomers />
                        </AdminRoute>
                      </PrivateRoute>
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/reviews"
                  element={
                    <AdminLayout>
                      <PrivateRoute>
                        <AdminRoute>
                          <ManageReviews />
                        </AdminRoute>
                      </PrivateRoute>
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/discounts"
                  element={
                    <AdminLayout>
                      <PrivateRoute>
                        <AdminRoute>
                          <ManageDiscounts />
                        </AdminRoute>
                      </PrivateRoute>
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <AdminLayout>
                      <PrivateRoute>
                        <AdminRoute>
                          <Reports />
                        </AdminRoute>
                      </PrivateRoute>
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/roles"
                  element={
                    <AdminLayout>
                      <PrivateRoute>
                        <AdminRoute>
                          <RolesPermissions />
                        </AdminRoute>
                      </PrivateRoute>
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/settings"
                  element={
                    <AdminLayout>
                      <PrivateRoute>
                        <AdminRoute>
                          <Settings />
                        </AdminRoute>
                      </PrivateRoute>
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/payments"
                  element={
                    <AdminLayout>
                      <PrivateRoute>
                        <AdminRoute>
                          <Payments />
                        </AdminRoute>
                      </PrivateRoute>
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/shipping"
                  element={
                    <AdminLayout>
                      <PrivateRoute>
                        <AdminRoute>
                          <Shipping />
                        </AdminRoute>
                      </PrivateRoute>
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/products/edit/:id"
                  element={
                    <AdminLayout>
                      <PrivateRoute>
                        <AdminRoute>
                          <EditProduct />
                        </AdminRoute>
                      </PrivateRoute>
                    </AdminLayout>
                  }
                />
                <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              </AIProvider>
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
