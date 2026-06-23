import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '@context/CartContext';
import { useAuth } from '@context/AuthContext';
import { orderService } from '@services/orderService';
import { paymentService } from '@services/paymentService';
import Spinner from '@components/common/Spinner';

const Checkout = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { items, totalPrice, itemCount, isLoading: cartLoading } = useCart();
  
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'India'
  });
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Set default address if user has one
  useEffect(() => {
    if (user?.addresses?.length > 0) {
      const defaultAddr = user.addresses.find(a => a.isDefault) || user.addresses[0];
      setAddress({
        street: defaultAddr.street || '',
        city: defaultAddr.city || '',
        state: defaultAddr.state || '',
        zip: defaultAddr.zip || '',
        country: defaultAddr.country || 'India'
      });
    }
  }, [user]);

  // Redirection rules
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login?redirect=/checkout');
    } else if (!cartLoading && items.length === 0) {
      navigate('/cart');
    }
  }, [authLoading, isAuthenticated, cartLoading, items, navigate]);

  const handleChange = (e) => {
    setAddress(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!address.street || !address.city || !address.state || !address.zip || !address.country) {
      setError('Please fill in all address fields to continue.');
      window.scrollTo(0, 0);
      return;
    }

    if (items.some(item => item.product.stock < item.quantity)) {
      setError('Some items in your cart exceed available stock. Please return to cart and adjust quantities.');
      window.scrollTo(0, 0);
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      // 1. Create Order
      const orderData = {
        shippingAddress: address,
        paymentMethod: 'card' // defaulting to card for simulation
      };
      const orderRes = await orderService.placeOrder(orderData);
      const orderId = orderRes.data.data._id;

      // 2. Clear frontend cart context since backend cleared it
      // Actually the next fetchCart() will clear it, but we can force it or let it be.

      // 3. Initiate Payment
      const paymentRes = await paymentService.initiate({ orderId });
      const paymentId = paymentRes.data.data._id;

      // 4. Simulate Payment Gateway (Random Success/Fail)
      // Wait 1.5 seconds to simulate processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // We will let it succeed 80% of the time, fail 20%
      const isSuccess = Math.random() > 0.2;
      
      const verifyRes = await paymentService.verify({ 
        paymentId, 
        simulateStatus: isSuccess ? 'success' : 'failed' 
      });

      if (isSuccess) {
        navigate(`/payment-success?orderId=${orderId}&paymentId=${paymentId}`);
      } else {
        navigate(`/payment-failure?orderId=${orderId}&paymentId=${paymentId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed. Please try again.');
      window.scrollTo(0, 0);
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading || cartLoading) {
    return <div className="min-h-[50vh] flex justify-center items-center"><Spinner size="lg" /></div>;
  }

  if (!isAuthenticated || items.length === 0) return null; // Wait for redirect

  return (
    <div className="section container-app animate-fade-in">
      <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-8">Checkout</h1>
      
      {error && <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-lg font-medium">{error}</div>}

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Forms */}
        <div className="flex-1 space-y-8">
          
          {/* Shipping Address */}
          <div className="card p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Shipping Address</h2>
            <form id="checkout-form" onSubmit={handleProceedToPayment} className="space-y-4">
              <div>
                <label className="label">Street Address</label>
                <input required type="text" name="street" className="input" value={address.street} onChange={handleChange} placeholder="123 Main St" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">City</label>
                  <input required type="text" name="city" className="input" value={address.city} onChange={handleChange} />
                </div>
                <div>
                  <label className="label">State / Province</label>
                  <input required type="text" name="state" className="input" value={address.state} onChange={handleChange} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">ZIP / Postal Code</label>
                  <input required type="text" name="zip" className="input" value={address.zip} onChange={handleChange} />
                </div>
                <div>
                  <label className="label">Country</label>
                  <select required name="country" className="input" value={address.country} onChange={handleChange}>
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
              </div>
            </form>
          </div>

        </div>

        {/* Right Side: Order Summary */}
        <div className="w-full lg:w-[400px] shrink-0">
          <div className="card p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider">Order Summary</h2>
            
            {/* Items Mini List */}
            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto custom-scrollbar pr-2">
              {items.map(item => (
                <div key={item.product._id} className="flex gap-4 items-center">
                  <div className="w-16 h-16 shrink-0 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                    {item.product.images?.[0] ? (
                      <img src={item.product.images[0].url} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No Image</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">{item.product.name}</p>
                    <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right font-medium text-gray-900 dark:text-white">
                    ₹{item.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 text-gray-600 dark:text-gray-400 mb-6 border-y border-gray-100 dark:border-gray-800 py-6">
              <div className="flex justify-between">
                <span>Subtotal ({itemCount} items)</span>
                <span className="font-medium text-gray-900 dark:text-white">₹{totalPrice}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes</span>
                <span className="font-medium text-gray-900 dark:text-white">₹0</span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-8">
              <span className="font-bold text-gray-900 dark:text-white text-xl">Total</span>
              <span className="font-bold text-primary-600 text-3xl">₹{totalPrice}</span>
            </div>

            <div className="space-y-3">
              <button 
                type="submit" 
                form="checkout-form"
                className="btn-primary w-full shadow-glow py-4 text-lg"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing Payment...' : 'Proceed to Payment'}
              </button>
              <Link to="/cart" className="btn w-full py-3">Return to Cart</Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;
