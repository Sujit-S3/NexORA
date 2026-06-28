// NexORA V9.5 — Analytics Service
const Order = require('../models/Order');
const Product = require('../models/Product');
const UserPreference = require('../models/UserPreference');

/**
 * Aggregates the last 8 weeks of order data and provides a summarized JSON for the AI.
 */
exports.getAdminAnalyticsSummary = async () => {
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

  const orders = await Order.find({ createdAt: { $gte: eightWeeksAgo }, status: { $ne: 'cancelled' } })
    .populate('items.product')
    .lean();

  let totalRevenue = 0;
  let recentRevenue = 0; // Last 4 weeks
  let pastRevenue = 0; // Previous 4 weeks
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const productCounts = {};
  const brandCounts = {};
  const categoryCounts = {};

  orders.forEach(order => {
    totalRevenue += order.totalPrice;
    if (order.createdAt >= fourWeeksAgo) {
      recentRevenue += order.totalPrice;
    } else {
      pastRevenue += order.totalPrice;
    }

    (order.items || []).forEach(item => {
      if (!item.product) {return;}
      const pid = item.product._id.toString();
      const brand = item.product.brand || 'Unknown';
      const cat = item.product.category?.toString() || 'Unknown';

      productCounts[pid] = (productCounts[pid] || 0) + item.quantity;
      brandCounts[brand] = (brandCounts[brand] || 0) + item.quantity;
      categoryCounts[cat] = (categoryCounts[cat] || 0) + item.quantity;
    });
  });

  const growthPercent = pastRevenue > 0 ? ((recentRevenue - pastRevenue) / pastRevenue) * 100 : 0;
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  // Get Top 3 Brands
  const topBrands = Object.entries(brandCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(x => x[0]);

  // Get Top 5 Products
  const topProductIds = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(x => x[0]);

  const topProducts = await Product.find({ _id: { $in: topProductIds } }).select('name brand price').lean();

  return {
    timeframe: 'Last 8 Weeks',
    totalRevenue,
    growthPercent: growthPercent.toFixed(2),
    avgOrderValue: avgOrderValue.toFixed(2),
    totalOrders: orders.length,
    topBrands,
    topProducts: topProducts.map(p => ({ name: p.name, brand: p.brand, price: p.price })),
  };
};

/**
 * Aggregates customer trend data based on user preferences.
 */
exports.getCustomerTrendsSummary = async () => {
  const preferences = await UserPreference.find().lean();
  
  const intents = {};
  const budgets = {};
  const recipients = {};

  preferences.forEach(p => {
    (p.conciergeIntents || []).forEach(i => intents[i] = (intents[i] || 0) + 1);
    // budgets is an object {declared, observedAvg, maxPurchase, comfortRange} — not an array (V10.6 schema)
    if (p.budgets?.declared) {
      const key = `under_${p.budgets.declared}`;
      budgets[key] = (budgets[key] || 0) + 1;
    }
    (p.giftRecipients || []).forEach(r => recipients[r] = (recipients[r] || 0) + 1);
  });

  return {
    topSearches: Object.entries(intents).sort((a, b) => b[1] - a[1]).slice(0, 5).map(x => x[0]),
    popularBudgets: Object.entries(budgets).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]),
    popularGiftRecipients: Object.entries(recipients).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]),
  };
};
