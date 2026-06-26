const fs = require('fs');
const path = require('path');

const files = [
  'Wishlist.jsx',
  'Products.jsx',
  'ProductDetail.jsx',
  'Concierge.jsx',
  'Cart.jsx',
  'Checkout.jsx',
  'Home.jsx'
];

const dir = path.join(__dirname, 'client/src/pages');

for (const file of files) {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Add loading="lazy" if not present and not float-hero
  content = content.replace(/<img([^>]*?)\/?>/gi, (match, p1) => {
    if (p1.includes('loading=')) return match;
    if (p1.includes('float-hero')) {
      // It's the hero image, use eager
      return match.replace(/<img/, '<img loading="eager"');
    }
    
    if (match.endsWith('/>')) {
      return `<img loading="lazy"${p1} />`;
    } else {
      return `<img loading="lazy"${p1}>`;
    }
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Processed ${file} for lazy loading`);
}
