// NexORA — Admin Controller
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/ApiResponse');

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  // 1. Basic Counts
  const totalUsers = await User.countDocuments();
  const totalProducts = await Product.countDocuments();
  const totalOrders = await Order.countDocuments();
  
  // 2. Revenue & Order Statuses
  const orders = await Order.find();
  const totalRevenue = orders.reduce((acc, order) => acc + (order.totalPrice || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

  // 3. Low Stock Products
  const lowStockProducts = await Product.find({ stock: { $lt: 10 } })
    .select('name stock price images')
    .sort({ stock: 1 })
    .limit(5);

  // 4. Top Selling Products
  const topProducts = await Product.find()
    .select('name sold price images ratings')
    .sort({ sold: -1 })
    .limit(5);

  // 5. Monthly Revenue Data (Last 6 Months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyRevenueData = await Order.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Format month names
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const revenueByMonth = monthlyRevenueData.map(item => ({
    name: `${monthNames[item._id.month - 1]}`,
    revenue: item.revenue,
    orders: item.orders
  }));

  // 6. User Growth Data (Last 6 Months)
  const monthlyUsersData = await User.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
        users: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const usersByMonth = monthlyUsersData.map(item => ({
    name: `${monthNames[item._id.month - 1]}`,
    users: item.users
  }));

  sendResponse(res, 200, 'Dashboard stats retrieved', {
    kpis: {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      pendingOrders,
      deliveredOrders
    },
    lowStockProducts,
    topProducts,
    charts: {
      revenueByMonth,
      usersByMonth
    }
  });
});

module.exports = { getDashboardStats };
