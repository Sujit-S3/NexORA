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
    return <div className="min-h-[50vh] flex justify-center items-center bg-transparent"><Spinner size="lg" /></div>;
  }

  if (error) {
    return <div className="section container-app"><div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div></div>;
  }

  return (
    <div className="bg-transparent min-h-screen pt-32 pb-20">
      <div className="container-app max-w-5xl">
        <h1 className="text-3xl font-display font-bold text-[#111827] dark:text-[#F5F5F5] mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="glass-panel p-12 text-center max-w-lg mx-auto">
          <div className="text-5xl mb-4">📦</div>
          <h2 className="text-2xl font-bold mb-2 text-[#111827] dark:text-[#F5F5F5]">No orders yet</h2>
          <p className="text-[#6B7280] dark:text-[#9CA3AF] mb-8">Looks like you haven't made any purchases.</p>
          <Link to="/products" className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-[#D4AF37] to-[#B38945] text-white rounded-full font-semibold hover:shadow-[0_4px_20px_rgba(212,175,55,0.4)] transition-all">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order._id} className="glass-panel p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Order <span className="font-mono font-medium text-[#111827] dark:text-[#F5F5F5]">{order.orderNumber}</span></p>
                <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Placed on: <span className="font-medium text-[#111827] dark:text-[#F5F5F5]">{new Date(order.createdAt).toLocaleDateString()}</span></p>
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
                <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm mb-1">Total</p>
                <p className="font-bold text-xl text-[#111827] dark:text-[#F5F5F5] mb-3">₹{order.totalPrice}</p>
                <Link to={`/orders/${order._id}`} className="inline-flex w-full md:w-auto items-center justify-center px-4 py-2 bg-white/5 dark:bg-[#0B1220]/60 border border-gray-200/50 dark:border-[rgba(212,175,55,0.15)] text-[#111827] dark:text-[#F5F5F5] rounded-full hover:shadow-[0_4px_20px_rgba(212,175,55,0.2)] transition-all text-sm font-medium">View Details</Link>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default Orders;
