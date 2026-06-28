const User = require('../../../models/User');

class WishlistContext {
  async build(userId) {
    if (!userId) {return null;}
    const user = await User.findById(userId).populate('wishlist', 'name price discountPrice brand');
    if (!user || !user.wishlist || user.wishlist.length === 0) {return null;}

    return user.wishlist.map(item => ({
      name: item.name,
      price: item.discountPrice || item.price,
      brand: item.brand,
    }));
  }
}

module.exports = new WishlistContext();
