// NexORA V9.5 — Inventory Service
const Product = require('../models/Product');

/**
 * Aggregates inventory levels to provide a summarized JSON for the AI.
 */
exports.getInventorySummary = async () => {
  const products = await Product.find({}).select('name brand stock category price isFeatured').lean();

  let totalStockValue = 0;
  let totalItems = 0;
  const lowStockItems = [];
  const outOfStockItems = [];
  const stockByBrand = {};

  products.forEach(p => {
    totalItems += p.stock;
    totalStockValue += p.stock * p.price;

    const brand = p.brand || 'Unknown';
    stockByBrand[brand] = (stockByBrand[brand] || 0) + p.stock;

    if (p.stock === 0) {
      outOfStockItems.push({ name: p.name, brand: p.brand });
    } else if (p.stock < 5) { // Assuming 5 is a low stock threshold for luxury items
      lowStockItems.push({ name: p.name, brand: p.brand, stock: p.stock });
    }
  });

  return {
    totalItemsInStock: totalItems,
    estimatedStockValue: totalStockValue,
    lowStockAlerts: lowStockItems.slice(0, 10), // Top 10 low stock
    outOfStockAlerts: outOfStockItems.slice(0, 5),
    brandStockDistribution: stockByBrand,
  };
};
