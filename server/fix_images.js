const mongoose = require('mongoose');
require('./src/models/Category');
const Product = require('./src/models/Product');

mongoose.connect('mongodb://devilgamingdg002_db_user:qmCCAl4CeZvyo74d@ac-vfzsuaj-shard-00-00.asqlgbz.mongodb.net:27017,ac-vfzsuaj-shard-00-01.asqlgbz.mongodb.net:27017,ac-vfzsuaj-shard-00-02.asqlgbz.mongodb.net:27017/?ssl=true&replicaSet=atlas-14fzgi-shard-0&authSource=admin&appName=NexORA')
.then(async () => {
  const genericUrls = [
    '/assets/luxury/lifestyle/designer_living_space.png',
    '/assets/luxury/lifestyle/luxury_interior.png',
    '/assets/luxury/lifestyle/executive_office.png',
    '/assets/placeholders/luxury-placeholder.jpg',
    '/assets/luxury/fallbacks/lifestyle-fallback.webp'
  ];

  const products = await Product.find({ 'images.url': { $in: genericUrls } });
  console.log('Found ' + products.length + ' products with generic images.');

  for (let p of products) {
    const shortName = encodeURIComponent(p.name.split(' ').slice(0, 3).join(' '));
    const newUrl = `https://placehold.co/600x600/0A0A0A/D4AF37.png?text=${shortName}&font=playfair-display`;
    p.images[0].url = newUrl;
    p.images[0].publicId = 'auto-gen-' + shortName;
    await p.save();
    console.log('Updated ' + p.name + ' -> ' + newUrl);
  }
})
.catch(console.error)
.finally(()=>process.exit(0));
