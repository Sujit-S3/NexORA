const Cart = require('../../../models/Cart');

class CartContext {
  async build(userId) {
    if (!userId) {return null;}
    const cart = await Cart.findOne({ user: userId }).populate('items.product', 'name price discountPrice brand category');
    if (!cart || cart.items.length === 0) {return null;}

    return cart.items.map(item => ({
      name: item.product.name,
      price: item.product.discountPrice || item.product.price,
      brand: item.product.brand,
      quantity: item.quantity,
    }));
  }
}

module.exports = new CartContext();
