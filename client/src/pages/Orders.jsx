import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '@services/orderService';
import Spinner from '@components/common/Spinner';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await orderService.getMyOrders();
        setOrders(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch orders');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (isLoading) {
    return <div className="min-h-[50vh] flex justify-center items-center"><Spinner size="lg" /></div>;
  }

  if (error) {
    return <div className="section container-app"><div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div></div>;
  }

  return (
    <div className="section container-app animate-fade-in">
      <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="card p-12 text-center max-w-lg mx-auto">
          <div className="text-5xl mb-4">📦</div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">No orders yet</h2>
          <p className="text-gray-500 mb-8">Looks like you haven't made any purchases.</p>
          <Link to="/products" className="btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order._id} className="card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Order <span className="font-mono font-medium text-gray-900 dark:text-white">{order.orderNumber}</span></p>
                <p className="text-sm text-gray-500">Placed on: <span className="font-medium text-gray-900 dark:text-white">{new Date(order.createdAt).toLocaleDateString()}</span></p>
                <div className="flex gap-2 mt-2">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {order.status.toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    order.paymentInfo.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    PAYMENT: {order.paymentInfo.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="text-left md:text-right w-full md:w-auto">
                <p className="text-gray-500 text-sm mb-1">Total</p>
                <p className="font-bold text-xl text-primary-600 mb-3">₹{order.totalPrice}</p>
                <Link to={`/orders/${order._id}`} className="btn w-full md:w-auto text-center block">View Details</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
