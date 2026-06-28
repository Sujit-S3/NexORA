require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const SizeChart = require('../models/SizeChart');
const Product = require('../models/Product');

const sizeChartsToSeed = [
  {
    name: "Men's Tops - Standard Size Guide",
    categoryMatcher: /T-Shirts|Shirts|Polo|Hoodies|Jackets|Sweatshirts|Blazers|Sweaters/i,
    measurementType: 'clothing',
    columns: ['Size', 'Chest (in)', 'Shoulder (in)', 'Length (in)'],
    rows: [
      { label: 'XS', measurements: { 'Chest (in)': '34', 'Shoulder (in)': '16.5', 'Length (in)': '26' } },
      { label: 'S', measurements: { 'Chest (in)': '36', 'Shoulder (in)': '17', 'Length (in)': '27' } },
      { label: 'M', measurements: { 'Chest (in)': '38-40', 'Shoulder (in)': '17.5', 'Length (in)': '28' } },
      { label: 'L', measurements: { 'Chest (in)': '42-44', 'Shoulder (in)': '18', 'Length (in)': '29' } },
      { label: 'XL', measurements: { 'Chest (in)': '46', 'Shoulder (in)': '18.5', 'Length (in)': '30' } },
      { label: 'XXL', measurements: { 'Chest (in)': '48', 'Shoulder (in)': '19', 'Length (in)': '31' } },
    ],
    howToMeasure: 'Measure under your arms at the fullest part of your chest. Keep the tape level.',
    fitRecommendation: 'Our tops run true to size for a tailored fit. For a relaxed fit, we recommend sizing up.',
  },
  {
    name: "Women's Tops - Standard Size Guide",
    categoryMatcher: /Tops|Blouses|Kurtis|Tunics|Dresses/i,
    measurementType: 'clothing',
    columns: ['Size', 'Bust (in)', 'Waist (in)', 'Length (in)'],
    rows: [
      { label: 'XS', measurements: { 'Bust (in)': '32', 'Waist (in)': '24', 'Length (in)': '24' } },
      { label: 'S', measurements: { 'Bust (in)': '34', 'Waist (in)': '26', 'Length (in)': '25' } },
      { label: 'M', measurements: { 'Bust (in)': '36', 'Waist (in)': '28', 'Length (in)': '26' } },
      { label: 'L', measurements: { 'Bust (in)': '38', 'Waist (in)': '30', 'Length (in)': '27' } },
      { label: 'XL', measurements: { 'Bust (in)': '40', 'Waist (in)': '32', 'Length (in)': '28' } },
      { label: 'XXL', measurements: { 'Bust (in)': '42', 'Waist (in)': '34', 'Length (in)': '29' } },
    ],
    howToMeasure: 'Measure around the fullest part of your bust. Measure your natural waistline.',
    fitRecommendation: 'True to size. Designed for an elegant, contouring fit.',
  },
  {
    name: 'Bottom Wear - Standard Size Guide',
    categoryMatcher: /Jeans|Trousers|Shorts|Skirts|Leggings|Joggers|Track Pants|Chinos|Cargos/i,
    measurementType: 'bottoms',
    columns: ['Size', 'Waist (in)', 'Inseam (in)'],
    rows: [
      { label: '28', measurements: { 'Waist (in)': '28', 'Inseam (in)': '30' } },
      { label: '30', measurements: { 'Waist (in)': '30', 'Inseam (in)': '31' } },
      { label: '32', measurements: { 'Waist (in)': '32', 'Inseam (in)': '32' } },
      { label: '34', measurements: { 'Waist (in)': '34', 'Inseam (in)': '32' } },
      { label: '36', measurements: { 'Waist (in)': '36', 'Inseam (in)': '33' } },
      { label: '38', measurements: { 'Waist (in)': '38', 'Inseam (in)': '33' } },
      { label: '40', measurements: { 'Waist (in)': '40', 'Inseam (in)': '34' } },
    ],
    howToMeasure: 'Measure around your natural waistline. For inseam, measure from the crotch to the hem.',
    fitRecommendation: 'Our bottoms feature a tailored fit. If you prefer a relaxed fit through the thigh, consider sizing up.',
  },
  {
    name: 'Footwear - Standard Size Guide',
    categoryMatcher: /Sneakers|Shoes|Boots|Heels|Flats|Sandals|Slippers/i,
    measurementType: 'footwear',
    columns: ['UK Size', 'US Size', 'EU Size', 'Foot Length (cm)'],
    rows: [
      { label: 'UK 6', measurements: { 'US Size': '7', 'EU Size': '40', 'Foot Length (cm)': '24.6' } },
      { label: 'UK 7', measurements: { 'US Size': '8', 'EU Size': '41', 'Foot Length (cm)': '25.4' } },
      { label: 'UK 8', measurements: { 'US Size': '9', 'EU Size': '42', 'Foot Length (cm)': '26.2' } },
      { label: 'UK 9', measurements: { 'US Size': '10', 'EU Size': '43', 'Foot Length (cm)': '27.1' } },
      { label: 'UK 10', measurements: { 'US Size': '11', 'EU Size': '44', 'Foot Length (cm)': '27.9' } },
      { label: 'UK 11', measurements: { 'US Size': '12', 'EU Size': '45', 'Foot Length (cm)': '28.8' } },
      { label: 'UK 12', measurements: { 'US Size': '13', 'EU Size': '46', 'Foot Length (cm)': '29.6' } },
    ],
    howToMeasure: 'Measure from the tip of your longest toe to the back of your heel.',
    fitRecommendation: 'Luxury footwear tends to run slightly narrow. We recommend half a size up if you have wider feet.',
  },
  {
    name: 'Accessories - One Size',
    categoryMatcher: /Watches|Bags|Belts|Sunglasses|Hats|Caps|Wallets|Jewellery|Perfumes|Ties|Cufflinks|Socks/i,
    measurementType: 'watches',
    columns: ['Size', 'Dimensions'],
    rows: [
      { label: 'OS', measurements: { 'Dimensions': 'Standard Universal Fit' } },
    ],
    howToMeasure: 'Not applicable for One Size items.',
    fitRecommendation: 'Designed as a universal fit.',
  },
  {
    name: 'Scarves - Length Size Guide',
    categoryMatcher: /Scarf|Scarves/i,
    measurementType: 'clothing',
    columns: ['Size', 'Length (m)'],
    rows: [
      { label: '2 Meters', measurements: { 'Length (m)': '2.0' } },
      { label: '2.5 Meters', measurements: { 'Length (m)': '2.5' } },
      { label: '3 Meters', measurements: { 'Length (m)': '3.0' } },
    ],
    howToMeasure: 'Measurement indicates the full length of the scarf from end to end.',
    fitRecommendation: 'A 2 meter scarf is perfect for a classic drape, while a 3 meter scarf allows for elaborate knots and wrapping.',
  },
];

async function migrateSizeSystem() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    await SizeChart.deleteMany({});
    console.log('Cleared old size charts.');

    const fashionCategory = await Category.findOne({ name: 'Fashion' });
    const watchesCategory = await Category.findOne({ name: 'Watches' });
    const accessoriesCategory = await Category.findOne({ name: 'Accessories' });

    let chartsCreated = 0;
    let productsUpdated = 0;

    // Create the standard size charts in the Fashion category
    const createdCharts = [];
    for (const chartDef of sizeChartsToSeed) {
      let targetCat = fashionCategory?._id;
      if (chartDef.name.includes('Watches')) {targetCat = watchesCategory?._id || targetCat;}
      if (chartDef.name.includes('Accessories')) {targetCat = accessoriesCategory?._id || targetCat;}

      const newSizeChart = await SizeChart.create({
        name: chartDef.name,
        category: targetCat,
        measurementType: chartDef.measurementType,
        columns: chartDef.columns,
        rows: chartDef.rows,
        howToMeasure: chartDef.howToMeasure,
        fitRecommendation: chartDef.fitRecommendation,
        isDefault: true,
      });
      createdCharts.push({ def: chartDef, doc: newSizeChart });
      chartsCreated++;
    }

    // Now loop over ALL products and assign the correct chart based on the product name/tags
    const products = await Product.find({});
    for (const p of products) {
      // Find matching chart by product name or tags
      const searchString = `${p.name} ${p.tags ? p.tags.join(' ') : ''}`.toLowerCase();
      let matchedChart = createdCharts.find(c => c.def.categoryMatcher.test(searchString));
      
      // Default fallback based on product category
      if (!matchedChart) {
        if (p.category.toString() === watchesCategory?._id.toString() || p.category.toString() === accessoriesCategory?._id.toString()) {
           matchedChart = createdCharts[createdCharts.length - 1]; // Accessories
        } else if (p.category.toString() === fashionCategory?._id.toString()) {
           // Default fashion to women's tops if we can't tell, or one size
           if (searchString.includes('women') || searchString.includes('dress') || searchString.includes('skirt')) {
             matchedChart = createdCharts.find(c => c.def.name.includes("Women's Tops"));
           } else {
             matchedChart = createdCharts.find(c => c.def.name.includes("Men's Tops"));
           }
        }
      }

      if (matchedChart) {
        p.sizeChart = matchedChart.doc._id;
        
        // Ensure OS variants exist for accessories if no variants exist
        if (matchedChart.def.measurementType === 'watches' && (!p.variants || p.variants.length === 0)) {
           p.variants = [{ size: 'OS', stock: p.stock > 0 ? p.stock : 10, availability: true }];
        }
        
        await p.save();
        productsUpdated++;
      }
    }

    console.log('Migration Complete.');
    console.log('Size Charts Created:', chartsCreated);
    console.log('Products Updated:', productsUpdated);

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrateSizeSystem();
