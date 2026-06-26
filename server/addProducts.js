const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Category = require('./src/models/Category');
const Product = require('./src/models/Product');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nexora', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('Connected to MongoDB');

  // Find categories
  const watchCategory = await Category.findOne({ name: 'Watches' });
  const bagCategory = await Category.findOne({ name: 'Bags' });

  if (!watchCategory || !bagCategory) {
    console.error('Categories not found! Please ensure Watches and Bags categories exist.');
    process.exit(1);
  }

  const newProducts = [
    {
      name: 'Rolex Cosmograph Daytona - Gold & Navy',
      slug: 'rolex-cosmograph-daytona-gold-navy',
      description: 'An iconic luxury timepiece crafted in 18 ct gold with an exquisite navy blue dial, designed to meet the demands of professional racing drivers.',
      price: 3200000,
      category: watchCategory._id,
      brand: 'Rolex',
      stock: 5,
      images: [{ url: '/assets/generated/watch_rolex.png', publicId: 'watch_rolex' }],
      specifications: {
        material: '18 ct Gold',
        crystal: 'Sapphire',
        waterResistance: '100m'
      },
      ratings: { average: 5.0, count: 12 },
      tags: ['luxury', 'watch', 'rolex', 'gold', 'navy'],
      conciergeRank: 'Top Pick'
    },
    {
      name: 'Audemars Piguet Royal Oak - Dark Green',
      slug: 'ap-royal-oak-dark-green',
      description: 'The legendary Royal Oak with a stunning dark green Tapisserie dial and signature octagonal bezel.',
      price: 4500000,
      category: watchCategory._id,
      brand: 'Audemars Piguet',
      stock: 3,
      images: [{ url: '/assets/generated/watch_ap.png', publicId: 'watch_ap' }],
      specifications: {
        material: 'Stainless Steel / Ceramic',
        crystal: 'Sapphire',
        waterResistance: '50m'
      },
      ratings: { average: 4.9, count: 8 },
      tags: ['luxury', 'watch', 'ap', 'green', 'royal-oak'],
      conciergeRank: 'Trending'
    },
    {
      name: 'Patek Philippe Nautilus - Rose Gold',
      slug: 'patek-philippe-nautilus-rose-gold',
      description: 'A masterpiece of horology, the Nautilus in warm rose gold features an elegant porthole construction and horizontally embossed dial.',
      price: 8500000,
      category: watchCategory._id,
      brand: 'Patek Philippe',
      stock: 2,
      images: [{ url: '/assets/generated/watch_patek.png', publicId: 'watch_patek' }],
      specifications: {
        material: 'Rose Gold',
        crystal: 'Sapphire',
        waterResistance: '120m'
      },
      ratings: { average: 5.0, count: 5 },
      tags: ['luxury', 'watch', 'patek', 'rose-gold', 'nautilus'],
      conciergeRank: 'Executive'
    },
    {
      name: 'Hermès Birkin 35 - Gold Base',
      slug: 'hermes-birkin-35-gold',
      description: 'The ultimate symbol of luxury, the Birkin 35 crafted with pristine leather and unparalleled artisan attention.',
      price: 2100000,
      category: bagCategory._id,
      brand: 'Hermès',
      stock: 1,
      images: [{ url: '/assets/generated/bag_hermes.png', publicId: 'bag_hermes' }],
      specifications: {
        material: 'Togo Leather',
        hardware: 'Gold Plated'
      },
      ratings: { average: 5.0, count: 34 },
      tags: ['luxury', 'bag', 'hermes', 'birkin'],
      conciergeRank: 'Grail'
    },
    {
      name: 'Chanel Classic Flap - Light Gold',
      slug: 'chanel-classic-flap-light',
      description: 'The timeless Chanel Classic Double Flap bag, featuring signature diamond quilting and interlocking CC clasp.',
      price: 850000,
      category: bagCategory._id,
      brand: 'Chanel',
      stock: 4,
      images: [{ url: '/assets/generated/bag_chanel.png', publicId: 'bag_chanel' }],
      specifications: {
        material: 'Lambskin',
        hardware: 'Gold-Tone Metal'
      },
      ratings: { average: 4.8, count: 42 },
      tags: ['luxury', 'bag', 'chanel', 'classic'],
      conciergeRank: 'Essential'
    },
    {
      name: 'Lady Dior Handbag - Gold Base',
      slug: 'lady-dior-handbag-gold',
      description: 'An architectural piece exuding elegance, the Lady Dior bag with Cannage stitching and elegant charms.',
      price: 520000,
      category: bagCategory._id,
      brand: 'Dior',
      stock: 6,
      images: [{ url: '/assets/generated/bag_dior.png', publicId: 'bag_dior' }],
      specifications: {
        material: 'Patent Calfskin',
        hardware: 'Light Gold-Finish'
      },
      ratings: { average: 4.9, count: 21 },
      tags: ['luxury', 'bag', 'dior', 'lady-dior'],
      conciergeRank: 'Iconic'
    }
  ];

  for (const item of newProducts) {
    const existing = await Product.findOne({ slug: item.slug });
    if (!existing) {
      await Product.create(item);
      console.log('Added:', item.name);
    } else {
      console.log('Already exists:', item.name);
    }
  }

  process.exit(0);
})
.catch(err => {
  console.error(err);
  process.exit(1);
});
