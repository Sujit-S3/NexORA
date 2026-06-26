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
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${file}`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Add import
  if (!content.includes('getLuxuryFallback')) {
    const importStatement = "import { getLuxuryFallback } from '../utils/getLuxuryFallback';\n";
    // find last import
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfImport = content.indexOf('\n', lastImportIndex);
      content = content.slice(0, endOfImport + 1) + importStatement + content.slice(endOfImport + 1);
    } else {
      content = importStatement + content;
    }
  }

  // 2. Add onError to img tags
  // We'll use a regex to match <img ... /> and inject the global onError handler
  // We can use a try-catch pattern to safely access variables
  const onErrorAttr = ` onError={(e) => {
    let cat = 'default';
    try { if (typeof product !== 'undefined') cat = product?.category?.name || product?.category; } catch(err){}
    try { if (typeof item !== 'undefined' && cat === 'default') cat = item?.category?.name || item?.category; } catch(err){}
    try { if (typeof p !== 'undefined' && cat === 'default') cat = p?.category?.name || p?.category; } catch(err){}
    try { if (typeof r !== 'undefined' && cat === 'default') cat = r?.category?.name || r?.category; } catch(err){}
    try { if (typeof quickViewProduct !== 'undefined' && cat === 'default') cat = quickViewProduct?.category?.name || quickViewProduct?.category; } catch(err){}
    e.currentTarget.src = getLuxuryFallback(cat);
  }}`;

  // Basic regex to find <img ... /> that don't already have onError
  content = content.replace(/<img([^>]*?)\/?>/gi, (match, p1) => {
    if (p1.includes('onError')) return match;
    // ensure it ends with />
    if (match.endsWith('/>')) {
      return `<img${p1}${onErrorAttr} />`;
    } else {
      // It's <img ...>
      return `<img${p1}${onErrorAttr}>`;
    }
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Processed ${file}`);
}
