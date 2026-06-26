const Order = require('../../../models/Order');

class OrderContext {
  async build(userId) {
    if (!userId) return null;
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('items.product', 'name brand category');
    
    if (!orders || orders.length === 0) return null;

    return orders.map(order => ({
      date: order.createdAt,
      total: order.totalPrice,
      items: order.items.map(item => ({
        name: item.name,
        brand: item.product?.brand
      }))
    }));
  }
}

module.exports = new OrderContext();
