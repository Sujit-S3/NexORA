import { useState, useEffect } from 'react';
import { orderService } from '@services/orderService';
import Spinner from '@components/common/Spinner';

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await orderService.getAll();
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
      await orderService.updateStatus(orderId, status);
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

  if (isLoading) return <div className="min-h-screen flex justify-center items-center bg-transparent"><Spinner size="lg" /></div>;

  return (
    <div className="bg-transparent min-h-screen pt-32 pb-20">
      <div className="container-app">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-display font-bold text-[#111827] dark:text-[#F5F5F5] mb-0 tracking-tight">Manage Orders</h1>
      </div>

      <div className="glass-panel p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#6B7280] dark:text-[#9CA3AF]">
            <thead className="text-xs uppercase bg-[#D4AF37]/10 dark:bg-white/5 text-[#D4AF37] dark:text-[#F5F5F5]">
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
                <tr key={order._id} className="border-b border-gray-200/50 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs">{order.orderNumber}</td>
                  <td className="px-6 py-4 text-[#111827] dark:text-[#F5F5F5]">{order.user?.name || 'Deleted User'}</td>
                  <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-bold text-[#111827] dark:text-[#F5F5F5]">₹{order.totalPrice}</td>
                  <td className="px-6 py-4">
                    <span className={order.paymentInfo?.status === 'paid' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {order.paymentInfo?.status?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                  <td className="px-6 py-4">
                    <select 
                      className="text-sm bg-transparent border-gray-200 dark:border-white/10 rounded p-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-[#111827] dark:text-[#F5F5F5] outline-none"
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
    </div>
  );
};

export default ManageOrders;
