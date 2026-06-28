const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');
const User = require('../models/User');
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

const getCategoryFallback = (categoryName) => {
  const cat = (categoryName || '').toLowerCase();
  if (cat.includes('watch')) {return '/assets/luxury/fallbacks/watch-fallback.webp';}
  if (cat.includes('bag') || cat.includes('accessories')) {return '/assets/luxury/fallbacks/bag-fallback.webp';}
  if (cat.includes('electronic') || cat.includes('tech')) {return '/assets/luxury/fallbacks/electronics-fallback.webp';}
  if (cat.includes('fashion') || cat.includes('clothing')) {return '/assets/luxury/fallbacks/fashion-fallback.webp';}
  if (cat.includes('lifestyle')) {return '/assets/luxury/fallbacks/lifestyle-fallback.webp';}
  return '/assets/luxury/fallbacks/default-luxury.webp';
};

const FASHION_KEYWORDS = ['shirt', 't-shirt', 'jacket', 'hoodie', 'polo', 'jeans', 'shoes', 'sneaker', 'boots', 'ring', 'bracelet', 'belt', 'fashion'];

const requiresVariants = (product, catName) => {
  const name = product.name.toLowerCase();
  const cat = catName.toLowerCase();
  
  // If explicitly fashion or matching keywords
  if (cat.includes('fashion')) {return true;}
  return FASHION_KEYWORDS.some(kw => name.includes(kw));
};

const migrateProducts = async () => {
  await connectDB();
  console.log('🔄 Starting product migration...');

  const report = {
    migrated: 0,
    repaired: 0,
    skipped: 0,
    warnings: [],
    duplicateSKUs: [],
    missingImages: [],
    products: [],
  };

  try {
    const products = await Product.find({}).populate('category');
    const existingSkus = new Set();

    for (const product of products) {
      let isModified = false;
      let repaired = false;
      const catName = product.category ? product.category.name : '';

      // 1. Fix missing SKUs
      if (!product.sku) {
        const brandPrefix = (product.brand || 'NX').substring(0, 3).toUpperCase();
        const catPrefix = catName.substring(0, 3).toUpperCase();
        product.sku = `${catPrefix}-${brandPrefix}-${product._id.toString().substring(0, 6)}`.toUpperCase();
        isModified = true;
        repaired = true;
      }
      
      // Handle SKU duplication (in theory should be unique now, but just in case)
      if (existingSkus.has(product.sku)) {
        report.duplicateSKUs.push({ id: product._id, sku: product.sku });
        product.sku = `${product.sku}-${Math.floor(Math.random() * 1000)}`;
        isModified = true;
        repaired = true;
      }
      existingSkus.add(product.sku);

      // 2. Fix Images
      const legacyImages = product.images || [];
      const fallbackUrl = getCategoryFallback(catName);

      if (!product.primaryImage || !product.primaryImage.url) {
        if (legacyImages.length > 0) {
          product.primaryImage = legacyImages[0];
        } else {
          product.primaryImage = { url: fallbackUrl, publicId: 'fallback' };
          report.missingImages.push(product._id);
        }
        isModified = true;
        repaired = true;
      }

      if (!product.thumbnail || !product.thumbnail.url) {
        product.thumbnail = product.primaryImage;
        isModified = true;
        repaired = true;
      }

      if (!product.hoverImage || !product.hoverImage.url) {
        product.hoverImage = legacyImages.length > 1 ? legacyImages[1] : product.primaryImage;
        isModified = true;
        repaired = true;
      }

      if (!product.galleryImages || product.galleryImages.length === 0) {
        product.galleryImages = legacyImages.length > 0 ? legacyImages : [product.primaryImage];
        isModified = true;
        repaired = true;
      }

      // 3. Fix Variants (Fashion only)
      if (requiresVariants(product, catName)) {
        if (!product.variants || product.variants.length === 0) {
          const sizes = ['S', 'M', 'L'];
          product.variants = sizes.map((size) => ({
            size,
            color: 'Standard',
            sku: `${product.sku}-${size}`,
            stock: Math.floor((product.stock || 10) / sizes.length) || 1,
            priceAdjustment: 0,
            availability: true,
            image: product.primaryImage.url,
          }));
          isModified = true;
          repaired = true;
        } else {
          // Repair existing variants
          product.variants.forEach((v) => {
            let varModified = false;
            if (!v.sku) { v.sku = `${product.sku}-${v.size}`; varModified = true; }
            if (v.stock === undefined) { v.stock = Math.floor(product.stock / product.variants.length) || 0; varModified = true; }
            if (v.availability === undefined) { v.availability = v.stock > 0; varModified = true; }
            if (!v.color) { v.color = 'Standard'; varModified = true; }
            if (!v.image) { v.image = product.primaryImage.url; varModified = true; }
            if (varModified) {
              isModified = true;
              repaired = true;
            }
          });
        }
      }

      if (isModified) {
        await product.save({ validateBeforeSave: false }); // Bypass strict validation during repair if necessary, but preferred to be valid
        report.migrated++;
        if (repaired) {report.repaired++;}
        report.products.push({ id: product._id, status: 'migrated', name: product.name });
      } else {
        report.skipped++;
        report.products.push({ id: product._id, status: 'skipped', name: product.name });
      }
    }

    // Also migrate User wishlists from [ObjectId] to [{product: ObjectId}] if necessary
    console.log('🔄 Checking User wishlists...');
    const users = await User.find({});
    for (const user of users) {
      if (user.wishlist && user.wishlist.length > 0) {
        let userModified = false;
        const newWishlist = [];
        for (const item of user.wishlist) {
          // Check if item is just an ObjectId (or string) rather than an object with .product
          if (item instanceof mongoose.Types.ObjectId || typeof item === 'string') {
            newWishlist.push({ product: item, size: '', color: '' });
            userModified = true;
          } else if (item && item.product) {
            newWishlist.push(item);
          } else if (item && item._id) {
            // Document
            newWishlist.push({ product: item._id, size: '', color: '' });
            userModified = true;
          }
        }
        if (userModified) {
          user.wishlist = newWishlist;
          await user.save({ validateBeforeSave: false });
        }
      }
    }

    fs.writeFileSync(path.join(__dirname, 'migration_report.json'), JSON.stringify(report, null, 2));
    console.log('✅ Migration complete!');
    console.log(`Migrated: ${report.migrated}, Repaired: ${report.repaired}, Skipped: ${report.skipped}`);
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    process.exit(0);
  }
};

migrateProducts();
