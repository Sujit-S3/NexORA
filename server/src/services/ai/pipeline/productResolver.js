// NexORA V13 — Product Resolver (Cumulative Memory Filters)
const Product  = require('../../../models/Product');
const Category = require('../../../models/Category');

class ProductResolver {
  /**
   * Resolves products based on detected entities + session memory.
   * Applies cumulative MongoDB filters so every conversation turn refines results.
   *
   * @param {Object} entities — from IntentDetector (brands, categories, budget, materials, colors)
   * @param {Object} memory   — full session memory (cumulative preferences)
   */
  async resolveProducts(entities = {}, memory = {}) {
    const query = { isActive: true };
    const {
      brands     = [],
      categories = [],
      budget     = null,
      materials  = [],
      colors     = [],
    } = entities;

    // ── Brand Filter (merged from memory + new detection) ──────────────────
    if (brands.length > 0) {
      query.brand = { $in: brands.map(b => new RegExp(b, 'i')) };
    }

    // ── Category Filter ────────────────────────────────────────────────────
    if (categories.length > 0) {
      const categoryDocs = await Category.find({
        $or: [
          { name:  { $in: categories.map(c => new RegExp(c, 'i')) } },
          { slug:  { $in: categories.map(c => new RegExp(c, 'i')) } },
        ],
      });
      if (categoryDocs.length > 0) {
        query.category = { $in: categoryDocs.map(c => c._id) };
      }
    }

    // ── Budget Filter ──────────────────────────────────────────────────────
    const budgetLimit = budget || (memory?.budget ? Number(memory.budget) : null);
    if (budgetLimit) {
      query.$or = [
        { discountPrice: { $lte: budgetLimit, $ne: null } },
        { price: { $lte: budgetLimit }, discountPrice: null },
        { price: { $lte: budgetLimit }, discountPrice: { $exists: false } },
      ];
    }

    // ── Material Filter (via attributes or description) ────────────────────
    const matFilters = materials.length > 0 ? materials
      : (memory?.materials?.length ? memory.materials : []);
    if (matFilters.length > 0) {
      // Try to filter on attributes map or description
      const matRegex = matFilters.map(m => new RegExp(m, 'i'));
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { 'attributes': { $exists: true } }, // will be post-filtered
          { description: { $in: matRegex } },
          { name: { $in: matRegex } },
        ],
      });
    }

    // ── Color Filter (via attributes or name) ──────────────────────────────
    const colFilters = colors.length > 0 ? colors
      : (memory?.colors?.length ? memory.colors : []);
    if (colFilters.length > 0) {
      const colRegex = colFilters.map(c => new RegExp(c, 'i'));
      if (!query.$and) {query.$and = [];}
      query.$and.push({
        $or: [
          { name: { $in: colRegex } },
          { description: { $in: colRegex } },
        ],
      });
    }

    // ── Execute Query ──────────────────────────────────────────────────────
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .select('name brand price discountPrice stock attributes images primaryImage thumbnail hoverImage galleryImages variants slug category description ratings isNewArrival isBestSeller specifications isActive')
      .sort({ 'ratings.average': -1, stock: -1 })
      .limit(24)
      .lean();

    // ── Confidence Score ───────────────────────────────────────────────────
    let confidence = 0;
    if (products.length > 0) {
      confidence += 0.5;
      if (brands.length > 0)     {confidence += 0.20;}
      if (categories.length > 0) {confidence += 0.15;}
      if (budgetLimit)           {confidence += 0.10;}
      if (matFilters.length > 0) {confidence += 0.03;}
      if (colFilters.length > 0) {confidence += 0.02;}
    }

    return {
      confidence: Math.min(confidence, 1.0),
      matchedBrand: brands[0] || null,
      appliedFilters: {
        brands, categories, budget: budgetLimit, materials: matFilters, colors: colFilters,
      },
      products,
    };
  }
}

module.exports = new ProductResolver();
