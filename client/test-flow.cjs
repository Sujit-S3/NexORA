const puppeteer = require('puppeteer');
const fs = require('fs');

const OUT_DIR = 'C:\\Users\\sssuj\\.gemini\\antigravity-ide\\brain\\282ae162-c64c-47f3-ab3f-f8c87984d11d\\scratch';
const URL = 'http://localhost:5173';

const delay = ms => new Promise(res => setTimeout(res, ms));

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-software-rasterizer', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log('Navigating to Home...');
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: `${OUT_DIR}\\test4_home_price_format.png` });
  console.log('Took Home screenshot');

  // TEST 1: SEARCH
  console.log('TEST 1: SEARCH');
  await page.goto(`${URL}/products`, { waitUntil: 'networkidle0' });
  await page.type('input[placeholder="Find products..."]', 'Rolex');
  await page.keyboard.press('Enter');
  await delay(1000);
  await page.screenshot({ path: `${OUT_DIR}\\test1_search_rolex.png` });
  
  // Clear search
  const input = await page.$('input[placeholder="Find products..."]');
  await input.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Enter');
  await delay(500);

  // TEST 2: CATEGORY FILTERS
  console.log('TEST 2: CATEGORY FILTERS');
  // Find Watches category button
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('Watches')) {
      await btn.click();
      break;
    }
  }
  await delay(1000);
  await page.screenshot({ path: `${OUT_DIR}\\test2_category_watches.png` });

  // TEST 3: SEARCH + FILTER COMBINED
  console.log('TEST 3: SEARCH + FILTER');
  await page.type('input[placeholder="Find products..."]', 'Omega');
  await page.keyboard.press('Enter');
  await delay(1000);
  await page.screenshot({ path: `${OUT_DIR}\\test3_combined_watches_omega.png` });

  // TEST 4 & 5: CART ADDITION AND PRICE FORMATTING
  console.log('TEST 5: CART & PDP');
  await page.goto(`${URL}/products`, { waitUntil: 'networkidle0' });
  // Click first product
  const products = await page.$$('a[href^="/product/"]');
  if (products.length > 0) {
    await products[0].click();
    await delay(1500);
    await page.screenshot({ path: `${OUT_DIR}\\test4_pdp_price.png` });
    
    // Add to cart
    const addBtn = await page.$('button.btn-primary'); // Assumes add to cart has btn-primary
    if(addBtn) await addBtn.click();
    await delay(1000);
  }

  await page.goto(`${URL}/cart`, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: `${OUT_DIR}\\test5_cart_populated.png` });
  
  // Refresh to test persistence
  await page.reload({ waitUntil: 'networkidle0' });
  await page.screenshot({ path: `${OUT_DIR}\\test5_cart_refreshed.png` });

  // TEST 6: CHECKOUT EMPTY / POPULATED
  console.log('TEST 6: CHECKOUT');
  await page.goto(`${URL}/checkout`, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: `${OUT_DIR}\\test6_checkout_populated.png` });
  
  // Clear cart
  const clearBtn = await page.$('button.text-red-400');
  if (clearBtn) {
      await clearBtn.click();
      await delay(500);
  }
  
  await page.goto(`${URL}/checkout`, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: `${OUT_DIR}\\test6_checkout_empty_redirect.png` });

  // TEST 7: AUTH ERROR CLEARING
  console.log('TEST 7: AUTH');
  await page.goto(`${URL}/login`, { waitUntil: 'networkidle0' });
  await page.type('input[type="email"]', 'bad@email.com');
  await page.type('input[type="password"]', 'badpass');
  await page.click('button[type="submit"]');
  await delay(1000);
  await page.screenshot({ path: `${OUT_DIR}\\test7_login_error.png` });
  
  await page.goto(`${URL}/register`, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: `${OUT_DIR}\\test7_register_error_cleared.png` });

  console.log('Tests complete.');
  await browser.close();
})();
