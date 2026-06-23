import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '@context/CartContext';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const paymentId = searchParams.get('paymentId');
  const { clearCart } = useCart(); // Backend cleared it, but we force frontend to clear its context too

  useEffect(() => {
    // Optional: force fetchCart or just local clear
    // We already know backend cleared it
  }, []);

  return (
    <div className="section container-app flex justify-center items-center min-h-[60vh] animate-fade-in">
      <div className="card p-12 text-center max-w-lg">
        <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-display font-bold mb-4 text-gray-900 dark:text-white">Payment Successful!</h2>
        <p className="text-gray-500 mb-8">Thank you for your purchase. Your order is now being processed.</p>
        
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-8 text-sm text-left">
          <p className="mb-2"><span className="text-gray-500">Order ID:</span> <span className="font-medium text-gray-900 dark:text-white">{orderId}</span></p>
          <p><span className="text-gray-500">Transaction ID:</span> <span className="font-medium text-gray-900 dark:text-white">{paymentId}</span></p>
        </div>

        <div className="flex gap-4 justify-center">
          <Link to={`/orders/${orderId}`} className="btn-primary">View Order</Link>
          <Link to="/products" className="btn">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
