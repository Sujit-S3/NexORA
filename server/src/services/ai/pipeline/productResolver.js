const Product = require('../../../models/Product');
const Category = require('../../../models/Category');

class ProductResolver {
  /**
   * Resolves products based on detected entities from the Intent Detector
   */
  async resolveProducts(entities = {}) {
    const query = { isActive: true };
    const { brands, categories, budget } = entities;

    // Filter by Brand
    if (brands && brands.length > 0) {
      // Use regex for case-insensitive matching if brands are strings
      query.brand = { $in: brands.map(b => new RegExp(b, 'i')) };
    }

    // Filter by Category
    if (categories && categories.length > 0) {
      const categoryDocs = await Category.find({
        name: { $in: categories.map(c => new RegExp(c, 'i')) }
      });
      if (categoryDocs.length > 0) {
        query.category = { $in: categoryDocs.map(c => c._id) };
      }
    }

    // Filter by Budget (Price)
    if (budget) {
      // Find products where either discountPrice or price is under budget
      query.$or = [
        { discountPrice: { $lte: budget, $ne: null } },
        { price: { $lte: budget }, discountPrice: null }
      ];
    }

    // Only retrieve what we need (avoid sending huge docs to AI)
    // Limit to top 20 matches, Ranking service will refine them later
    const products = await Product.find(query)
      .populate('category', 'name')
      .select('name brand price discountPrice stock attributes images slug category')
      .limit(20)
      .lean();

    // Calculate a simple confidence score
    let confidence = 0;
    if (products.length > 0) {
      confidence += 0.5; // Found something
      if (brands && brands.length > 0) confidence += 0.25;
      if (categories && categories.length > 0) confidence += 0.15;
      if (budget) confidence += 0.10;
    }

    return {
      confidence: Math.min(confidence, 1.0),
      matchedBrand: brands ? brands[0] : null,
      products
    };
  }
}

module.exports = new ProductResolver();
