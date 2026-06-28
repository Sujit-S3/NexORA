const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');
const Category = require('../models/Category');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

const FASHION_KEYWORDS = ['shirt', 't-shirt', 'jacket', 'hoodie', 'polo', 'jeans', 'shoes', 'sneaker', 'boots', 'ring', 'bracelet', 'belt', 'fashion'];

const requiresVariants = (product, catName) => {
  const name = product.name.toLowerCase();
  const cat = catName.toLowerCase();
  if (cat.includes('fashion')) {return true;}
  return FASHION_KEYWORDS.some(kw => name.includes(kw));
};

const auditCatalog = async () => {
  await connectDB();
  console.log('🔍 Starting product catalog audit...');

  const report = {
    totalProducts: 0,
    validProducts: 0,
    invalidProducts: 0,
    errors: {
      missingImages: [],
      duplicateImages: [],
      missingSKU: [],
      duplicateSKU: [],
      missingVariants: [],
      invalidStock: [],
      invalidCategory: [],
      missingSlug: [],
      brokenURLs: [],
      invalidPrices: [],
      emptyGallery: [],
    },
  };

  try {
    const products = await Product.find({}).populate('category');
    report.totalProducts = products.length;
    
    const seenSkus = new Set();
    const seenImages = new Set(); // We check primaryImage url

    for (const p of products) {
      let productValid = true;
      const catName = p.category ? p.category.name : '';

      // Check category
      if (!p.category) {
        report.errors.invalidCategory.push(p._id);
        productValid = false;
      }

      // Check slug
      if (!p.slug) {
        report.errors.missingSlug.push(p._id);
        productValid = false;
      }

      // Check prices
      if (p.price == null || p.price < 0 || (p.discountPrice != null && p.discountPrice >= p.price)) {
        report.errors.invalidPrices.push(p._id);
        productValid = false;
      }

      // Check SKUs
      if (!p.sku) {
        report.errors.missingSKU.push(p._id);
        productValid = false;
      } else if (seenSkus.has(p.sku)) {
        report.errors.duplicateSKU.push(p.sku);
        productValid = false;
      } else {
        seenSkus.add(p.sku);
      }

      // Check Images
      if (!p.primaryImage || !p.primaryImage.url || !p.thumbnail || !p.thumbnail.url || !p.hoverImage || !p.hoverImage.url) {
        report.errors.missingImages.push(p._id);
        productValid = false;
      } else if (seenImages.has(p.primaryImage.url) && !p.primaryImage.url.includes('fallback')) {
        report.errors.duplicateImages.push({ id: p._id, url: p.primaryImage.url });
        // NOTE: we ignore fallbacks in duplicate checks, but true unique images shouldn't be duplicated
      } else {
        seenImages.add(p.primaryImage.url);
      }

      if (!p.galleryImages || p.galleryImages.length === 0) {
        report.errors.emptyGallery.push(p._id);
        productValid = false;
      }

      // Check Variants
      if (requiresVariants(p, catName)) {
        if (!p.variants || p.variants.length === 0) {
          report.errors.missingVariants.push(p._id);
          productValid = false;
        } else {
          for (const v of p.variants) {
            if (v.stock == null || v.stock < 0) {
              report.errors.invalidStock.push({ id: p._id, variantSku: v.sku });
              productValid = false;
            }
          }
        }
      }

      if (productValid) {report.validProducts++;}
      else {report.invalidProducts++;}
    }

    fs.writeFileSync(path.join(__dirname, 'catalog_audit_report.json'), JSON.stringify(report, null, 2));
    console.log(`✅ Audit complete! Valid: ${report.validProducts} / ${report.totalProducts}`);
    
  } catch (error) {
    console.error('❌ Audit error:', error);
  } finally {
    process.exit(0);
  }
};

auditCatalog();
