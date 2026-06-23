import { useState, useEffect } from 'react';
import { orderService } from '@services/orderService';
import Spinner from '@components/common/Spinner';

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await orderService.getAllOrders();
      setOrders(res.data.data);
    } catch (err) {
      alert('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, status) => {
    try {
      await orderService.updateOrderStatus(orderId, status);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase ${colors[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
  };

  if (isLoading) return <div className="min-h-[50vh] flex justify-center items-center"><Spinner size="lg" /></div>;

  return (
    <div className="section container-app animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1 className="section-title mb-0">Manage Orders</h1>
      </div>

      <div className="card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3">Order ID</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Payment</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Update Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 font-mono text-xs">{order.orderNumber}</td>
                  <td className="px-6 py-4">{order.user?.name || 'Deleted User'}</td>
                  <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">₹{order.totalPrice}</td>
                  <td className="px-6 py-4">
                    <span className={order.paymentInfo?.status === 'paid' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {order.paymentInfo?.status?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                  <td className="px-6 py-4">
                    <select 
                      className="text-sm bg-transparent border-gray-300 dark:border-gray-700 rounded p-1 focus:ring-primary-500 focus:border-primary-500"
                      value={order.status}
                      disabled={order.status === 'cancelled' || order.status === 'delivered'}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan="7" className="px-6 py-8 text-center">No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageOrders;
