const fs = require('fs');
const path = require('path');

const seedFile = path.join(__dirname, 'server', 'src', 'data', 'luxurySeed.js');
let content = fs.readFileSync(seedFile, 'utf8');

const replacements = [
  // FASHION
  { name: /Gucci Wool Cashmere Jacket/i, url: '/assets/luxury/fashion/gucci_jacket.png' },
  { category: 'fashion', url: '/assets/luxury/fashion/gucci_jacket.png' },

  // WATCHES
  { name: /Rolex Daytona/i, url: '/assets/luxury/watches/rolex_daytona.png' },
  { name: /Rolex Submariner/i, url: '/assets/luxury/watches/rolex_submariner.png' },
  { name: /Omega Speedmaster/i, url: '/assets/luxury/watches/omega_speedmaster.png' },
  { name: /Cartier Santos/i, url: '/assets/luxury/watches/cartier_santos.png' },
  { name: /Audemars Piguet/i, url: '/assets/luxury/watches/ap_royal_oak.png' },
  { name: /Patek Philippe/i, url: '/assets/luxury/watches/ap_royal_oak.png' }, // fallback
  { category: 'watches', url: '/assets/luxury/watches/rolex_daytona.png' },

  // BAGS / ACCESSORIES
  { name: /Hermès Kelly|Hermès/i, url: '/assets/luxury/bags/hermes_kelly.png' },
  { name: /Louis Vuitton/i, url: '/assets/luxury/bags/lv_capucines.png' },
  { name: /Dior/i, url: '/assets/luxury/bags/lady_dior.png' },
  { name: /Chanel/i, url: '/assets/luxury/bags/chanel_flap.png' },
  { category: 'accessories', url: '/assets/luxury/bags/hermes_kelly.png' },

  // ELECTRONICS
  { name: /MacBook/i, url: '/assets/luxury/electronics/macbook_pro.png' },
  { name: /Apple Watch/i, url: '/assets/luxury/electronics/apple_watch_ultra.png' },
  { name: /Sony WH/i, url: '/assets/luxury/electronics/sony_xm6.png' },
  { name: /Leica/i, url: '/assets/luxury/electronics/leica_camera.png' },
  { name: /iPhone|iPad/i, url: '/assets/luxury/electronics/macbook_pro.png' },
  { name: /Samsung|Dell|PlayStation|Microsoft|Bose|Devialet/i, url: '/assets/luxury/electronics/macbook_pro.png' },
  { category: 'electronics', url: '/assets/luxury/electronics/macbook_pro.png' },

  // LIFESTYLE / GIFTS
  { category: 'lifestyle', url: '/assets/luxury/lifestyle/designer_living_space.png' },
  { category: 'luxury-gifts', url: '/assets/luxury/lifestyle/executive_office.png' }
];

// Instead of parsing AST, let's use a regex that matches a block:
// name: '...', \n    brand: '...', category: categoryMap['...'], \n ... images: [{ url: '...' }]

let productRegex = /name:\s*['"]([^'"]+)['"][\s\S]*?category:\s*categoryMap\['([^']+)'\][\s\S]*?images:\s*\[\{\s*url:\s*['"]([^'"]+)['"]/g;

let match;
let newContent = content;

// Replace images line by line
const lines = newContent.split('\n');
let currentName = '';
let currentCategory = '';

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  const nameMatch = line.match(/name:\s*['"]([^'"]+)['"]/);
  if (nameMatch) currentName = nameMatch[1];
  
  const catMatch = line.match(/category:\s*categoryMap\['([^']+)'\]/);
  if (catMatch) currentCategory = catMatch[1];

  if (line.includes("images: [{ url:")) {
    let bestUrl = '';
    
    // Find matching replacement
    for (const r of replacements) {
      if (r.name && r.name.test(currentName)) {
        bestUrl = r.url;
        break;
      }
    }
    
    if (!bestUrl) {
      for (const r of replacements) {
        if (!r.name && r.category === currentCategory) {
          bestUrl = r.url;
          break;
        }
      }
    }

    if (bestUrl) {
      lines[i] = line.replace(/url:\s*['"][^'"]+['"]/, `url: '${bestUrl}'`);
    } else {
       // fallback
       lines[i] = line.replace(/url:\s*['"][^'"]+['"]/, `url: '/assets/luxury/lifestyle/luxury_interior.png'`);
    }
  }
}

fs.writeFileSync(seedFile, lines.join('\n'));
console.log('Successfully updated luxurySeed.js');
