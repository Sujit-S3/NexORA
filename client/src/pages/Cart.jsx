import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@context/CartContext';
import { useAuth } from '@context/AuthContext';
import Spinner from '@components/common/Spinner';

const Cart = () => {
  const { items, totalPrice, itemCount, isLoading, updateItem, removeItem, clearCart, error } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="section container-app flex justify-center">
        <div className="card p-12 text-center max-w-lg">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Sign in to view your cart</h2>
          <p className="text-gray-500 mb-6">You need an account to add items to the cart and checkout.</p>
          <button onClick={() => navigate('/login?redirect=/cart')} className="btn-primary">Sign In / Register</button>
        </div>
      </div>
    );
  }

  if (isLoading && items.length === 0) {
    return <div className="min-h-[50vh] flex justify-center items-center"><Spinner size="lg" /></div>;
  }

  if (items.length === 0) {
    return (
      <div className="section container-app flex justify-center">
        <div className="card p-12 text-center max-w-lg">
          <div className="text-5xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
          <Link to="/products" className="btn-primary">Start Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section container-app animate-fade-in">
      <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-8">Shopping Cart</h1>
      
      {error && <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-lg">{error}</div>}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="flex-1">
          <div className="card overflow-hidden">
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {items.map((item) => (
                <li key={item.product._id} className="p-6 flex flex-col sm:flex-row items-center gap-6">
                  {/* Image */}
                  <Link to={`/products/${item.product.slug}`} className="w-24 h-24 shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    {item.product.images?.[0] ? (
                      <img src={item.product.images[0].url} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Image</div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <Link to={`/products/${item.product.slug}`} className="font-semibold text-lg text-gray-900 dark:text-white hover:text-primary-600 transition-colors">
                      {item.product.name}
                    </Link>
                    <p className="text-primary-600 font-bold mt-1">₹{item.price}</p>
                    {item.product.stock < item.quantity && (
                      <p className="text-red-500 text-sm mt-1">Only {item.product.stock} left in stock</p>
                    )}
                  </div>

                  {/* Quantity & Actions */}
                  <div className="flex flex-col items-center sm:items-end gap-3">
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                      <button 
                        onClick={() => updateItem(item.product._id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center rounded bg-white dark:bg-gray-700 shadow-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors"
                        disabled={item.quantity <= 1 || isLoading}
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium text-gray-900 dark:text-white">{item.quantity}</span>
                      <button 
                        onClick={() => updateItem(item.product._id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded bg-white dark:bg-gray-700 shadow-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors"
                        disabled={item.quantity >= item.product.stock || isLoading}
                      >
                        +
                      </button>
                    </div>
                    <button 
                      onClick={() => removeItem(item.product._id)}
                      className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
                      disabled={isLoading}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center border-t border-gray-200 dark:border-gray-800">
              <button 
                onClick={() => { if(window.confirm('Clear all items from cart?')) clearCart() }}
                className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
                disabled={isLoading}
              >
                Clear Cart
              </button>
              <Link to="/products" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="card p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider">Order Summary</h2>
            
            <div className="space-y-3 text-gray-600 dark:text-gray-400 mb-6 border-b border-gray-100 dark:border-gray-800 pb-6">
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
                <span>Calculated at checkout</span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-8">
              <span className="font-bold text-gray-900 dark:text-white text-lg">Estimated Total</span>
              <span className="font-bold text-primary-600 text-2xl">₹{totalPrice}</span>
            </div>

            <button 
              onClick={() => navigate('/checkout')}
              className="btn-primary w-full shadow-glow py-3"
              disabled={isLoading || items.some(item => item.product.stock < item.quantity)}
            >
              Proceed to Checkout
            </button>
            {items.some(item => item.product.stock < item.quantity) && (
              <p className="text-red-500 text-xs mt-3 text-center">Please fix quantity issues to checkout.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
