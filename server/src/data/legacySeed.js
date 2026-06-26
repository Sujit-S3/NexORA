// DO NOT USE - REPLACED BY luxurySeed.js
const categories = [
  { name: 'Watches', description: 'Luxury timepieces', slug: 'watches' },
  { name: 'Vehicles', description: 'Premium electric vehicles', slug: 'vehicles' },
  { name: 'Accessories', description: 'High-end accessories', slug: 'accessories' },
  { name: 'Electronics', description: 'Premium tech', slug: 'electronics' }
];

const products = [
  {
    name: 'Rolex Submariner Date',
    description: 'The archetype of the diver’s watch. Unmistakable dial with large luminescent hour markers.',
    price: 1250000,
    stock: 5,
    brand: 'Rolex',
    isFeatured: true,
    images: [{ url: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', publicId: 'rolex_submariner' }]
  },
  {
    name: 'Tesla Model S Plaid',
    description: 'The quickest accelerating car in production today. Tri motor all-wheel drive.',
    price: 11000000,
    stock: 2,
    brand: 'Tesla',
    isFeatured: true,
    images: [{ url: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', publicId: 'tesla_model_s' }]
  },
  {
    name: 'Apple Vision Pro',
    description: 'A revolutionary spatial computer that seamlessly blends digital content with your physical space.',
    price: 349000,
    stock: 15,
    brand: 'Apple',
    isFeatured: true,
    images: [{ url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', publicId: 'vision_pro' }]
  },
  {
    name: 'Dior Saddle Bag',
    description: 'Maria Grazia Chiuri brings a fresh update to the iconic Saddle bag. Crafted in black ultramatte calfskin.',
    price: 320000,
    stock: 8,
    brand: 'Dior',
    isFeatured: false,
    images: [{ url: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', publicId: 'dior_saddle' }]
  },
  {
    name: 'Patek Philippe Nautilus',
    description: 'The Nautilus has epitomized the elegant sports watch since 1976. Steel casing with a stunning blue dial.',
    price: 8500000,
    stock: 1,
    brand: 'Patek Philippe',
    isFeatured: true,
    images: [{ url: 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', publicId: 'patek_nautilus' }]
  },
  {
    name: 'Hermès Birkin 30',
    description: 'The iconic Birkin bag in Togo leather with gold hardware. A masterpiece of craftsmanship.',
    price: 1800000,
    stock: 3,
    brand: 'Hermès',
    isFeatured: false,
    images: [{ url: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', publicId: 'hermes_birkin' }]
  }
];

module.exports = { categories, products };
