import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService } from '@services/orderService';
import { paymentService } from '@services/paymentService';
import Spinner from '@components/common/Spinner';

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await orderService.getById(id);
        setOrder(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch order details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleRetryPayment = async () => {
    setIsProcessingPayment(true);
    try {
      const paymentRes = await paymentService.initiate({ orderId: id });
      const paymentId = paymentRes.data.data._id;
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      const isSuccess = Math.random() > 0.2;
      
      await paymentService.verify({ paymentId, simulateStatus: isSuccess ? 'success' : 'failed' });
      
      if (isSuccess) {
        window.location.href = `/payment-success?orderId=${id}&paymentId=${paymentId}`;
      } else {
        window.location.href = `/payment-failure?orderId=${id}&paymentId=${paymentId}`;
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Payment initiation failed');
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-[50vh] flex justify-center items-center"><Spinner size="lg" /></div>;
  }

  if (error || !order) {
    return <div className="section container-app"><div className="p-4 bg-red-50 text-red-600 rounded-lg">{error || 'Order not found'}</div></div>;
  }

  return (
    <div className="section container-app animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">Order Details</h1>
        <Link to="/orders" className="text-primary-600 hover:text-primary-700 font-medium">← Back to Orders</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Items & Details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Status Header */}
          <div className="card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-sm text-gray-500">Order Number</p>
              <p className="font-mono font-bold text-lg text-gray-900 dark:text-white">{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date Placed</p>
              <p className="font-medium text-gray-900 dark:text-white">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={`px-3 py-1 mt-1 inline-block text-sm rounded-full font-bold ${
                order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {order.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Items List */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Items Ordered</h2>
            <div className="space-y-6">
              {order.items.map((item) => (
                <div key={item._id} className="flex gap-4 items-center border-b border-gray-100 dark:border-gray-800 pb-6 last:border-0 last:pb-0">
                  <div className="w-20 h-20 shrink-0 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Image</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Link to={`/product/${item.product}`} className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 transition-colors">
                      {item.name}
                    </Link>
                    <p className="text-gray-500 text-sm mt-1">
                      Quantity: {item.quantity}
                      {item.size && ` • Size: ${item.size}`}
                      {item.color && ` • ${item.color}`}
                    </p>
                    
                    {/* Fit Intelligence Tags */}
                    {(item.fitType || item.fitWarning) && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {item.fitType && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border border-[#D4AF37]/30 text-[#D4AF37] bg-black/5 dark:bg-black/20">
                            Fit: {item.fitType}
                          </span>
                        )}
                        {item.confidence && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border border-gray-500/30 text-gray-500 bg-black/5 dark:bg-black/20">
                            {item.confidence}%
                          </span>
                        )}
                        {item.fitWarning && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border border-red-500/30 text-red-500 bg-red-500/10">
                            {item.fitWarning}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right font-bold text-gray-900 dark:text-white">
                    ₹{item.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Summary & Payment */}
        <div className="space-y-8">
          
          {/* Order Summary */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider">Summary</h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-400 mb-6 border-b border-gray-100 dark:border-gray-800 pb-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900 dark:text-white">₹{order.itemsPrice}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-medium text-gray-900 dark:text-white">₹{order.shippingPrice}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes</span>
                <span className="font-medium text-gray-900 dark:text-white">₹{order.taxPrice}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-900 dark:text-white text-lg">Total</span>
              <span className="font-bold text-primary-600 text-2xl">₹{order.totalPrice}</span>
            </div>
          </div>

          {/* Payment & Shipping Info */}
          <div className="card p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase mb-2">Payment Information</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Method: <span className="font-medium capitalize">{order.paymentInfo.method}</span></p>
              <p className="text-gray-600 dark:text-gray-400 text-sm flex items-center gap-2 mt-1">
                Status: 
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  order.paymentInfo.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {order.paymentInfo.status.toUpperCase()}
                </span>
              </p>
              
              {order.paymentInfo.status !== 'paid' && order.status !== 'cancelled' && (
                <button 
                  onClick={handleRetryPayment}
                  disabled={isProcessingPayment}
                  className="btn-primary w-full py-2 mt-4 text-sm"
                >
                  {isProcessingPayment ? 'Processing...' : 'Pay Now'}
                </button>
              )}
            </div>
            
            <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase mb-2">Shipping Address</h3>
              <address className="not-italic text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                <p>{order.shippingAddress.country}</p>
              </address>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
