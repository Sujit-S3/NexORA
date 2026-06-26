// NexORA — Admin Controller
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const { categories, products } = require('../data/luxurySeed');
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

  // 7. Orders by Status
  const orderStatusAgg = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const ordersByStatus = orderStatusAgg.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {});

  // 8. Recent Orders
  const recentOrders = await Order.find()
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .limit(5)
    .select('orderNumber totalPrice status createdAt user');

  sendResponse(res, 200, 'Dashboard stats retrieved', {
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue,
    pendingOrders,
    deliveredOrders,
    lowStockProducts,
    topProducts,
    ordersByStatus,
    recentOrders,
    charts: {
      revenueByMonth,
      usersByMonth
    }
  });
});

// @desc    Seed database with luxury product catalog
// @route   POST /api/admin/seed
// @access  Admin
const seedDatabase = asyncHandler(async (req, res) => {
  const { seedLuxuryProducts } = require('../data/luxurySeed');
  const result = await seedLuxuryProducts();
  sendResponse(res, 201, 'Luxury catalog seeded successfully', result);
});

module.exports = { getDashboardStats, seedDatabase };
