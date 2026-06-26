const puppeteer = require('puppeteer');
const fs = require('fs');

const OUT_DIR = 'C:\\Users\\sssuj\\.gemini\\antigravity-ide\\brain\\423cbddb-dccc-4cb1-b865-63d1d961385e';
const URL = 'http://localhost:5173';
const delay = ms => new Promise(res => setTimeout(res, ms));

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--window-size=1280,800'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // ── 1. LOGIN ADMIN ──
  console.log('Logging in as admin...');
  await page.goto(`${URL}/login`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('input#email', { timeout: 10000 });
  await page.type('input#email', 'admin_test@nexora.com');
  await page.type('input#password', 'password123');
  await page.click('button[type="submit"]');
  await delay(2000);

  // ── 12. ADMIN ANALYTICS ──
  console.log('Taking admin dashboard screenshot...');
  await page.goto(`${URL}/admin`, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: `${OUT_DIR}\\step12_admin_analytics.png` });

  // ── 1. CREATE PRODUCT ──
  console.log('Creating product...');
  await page.goto(`${URL}/admin/products/new`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('input[placeholder="e.g. Rolex Submariner Date"]', { timeout: 10000 });
  await page.type('input[placeholder="e.g. Rolex Submariner Date"]', 'Test Luxury Watch V8');
  await page.type('input[placeholder="e.g. Rolex"]', 'NexORA Exclusive');
  
  // Set Category
  const categorySelect = await page.$('select');
  if (categorySelect) {
    const options = await page.evaluate(el => Array.from(el.options).map(o => o.value), categorySelect);
    if (options.length > 0) await page.select('select', options[0]);
  }

  await page.type('textarea', 'A brilliant test product for the V8 proof pack.');
  
  const numInputs = await page.$$('input[type="number"]');
  if (numInputs.length >= 3) {
    await numInputs[0].type('15000'); // Price
    await numInputs[2].type('10'); // Stock
  }

  // Submit
  const buttons = await page.$$('button');
  for(let btn of buttons) {
    const txt = await page.evaluate(e => e.textContent, btn);
    if(txt.includes('Publish Product')) {
      await btn.click();
      break;
    }
  }
  await delay(2000);
  await page.screenshot({ path: `${OUT_DIR}\\step1_create_product.png` });

  // ── 2. EDIT PRODUCT ──
  console.log('Editing product...');
  // We are at /admin/products. Find the Edit button for Test Luxury Watch V8.
  let editButtons = await page.$$('a[href^="/admin/products/edit"]');
  if (editButtons.length > 0) {
    // Click the first one (most likely the newest if sorted, or just any)
    await editButtons[editButtons.length - 1].click();
    await delay(1500);
    
    await page.waitForSelector('input[placeholder="e.g. Rolex Submariner Date"]', { timeout: 10000 });
    await page.type('input[placeholder="e.g. Rolex Submariner Date"]', ' - Edited');
    
    // Submit
    const pubBtns = await page.$$('button');
    for(let btn of pubBtns) {
      const txt = await page.evaluate(e => e.textContent, btn);
      if(txt.includes('Save Changes')) {
        await btn.click();
        break;
      }
    }
    await delay(2000);
    await page.screenshot({ path: `${OUT_DIR}\\step2_edit_product.png` });
  }

  // ── 3. DELETE PRODUCT ──
  console.log('Deleting product...');
  await page.goto(`${URL}/admin/products`, { waitUntil: 'networkidle0' });
  let trs = await page.$$('tbody tr');
  if (trs.length > 0) {
    let lastTr = trs[trs.length - 1]; // Let's delete the last one
    let deleteBtn = await lastTr.$('button.text-red-400');
    if (deleteBtn) {
      await deleteBtn.click();
      await delay(1000);
      // Wait for confirmation modal? If there's an alert or modal.
      // Usually browser alert
      page.on('dialog', async dialog => {
        await dialog.accept();
      });
      await delay(1000);
      await page.screenshot({ path: `${OUT_DIR}\\step3_delete_product.png` });
    }
  }

  // ── LOGOUT ADMIN ──
  await page.evaluate(() => { localStorage.removeItem('nexora_token'); });
  await page.goto(`${URL}`, { waitUntil: 'networkidle0' });

  // ── GUEST FLOW ──
  console.log('Starting guest flow...');

  // ── 6. CONCIERGE RECOMMENDATION ──
  console.log('Concierge recommendation...');
  await page.goto(`${URL}/concierge`, { waitUntil: 'networkidle0' });
  await page.type('input[type="text"]', 'I want a luxury watch under $50000');
  await page.keyboard.press('Enter');
  await delay(4000); // Wait for AI response
  await page.screenshot({ path: `${OUT_DIR}\\step6_concierge_recommendation.png` });

  // ── 7. ADD RECOMMENDED TO CART ──
  console.log('Add recommended to cart...');
  // Find Add to Cart button in concierge UI
  const conciergeButtons = await page.$$('button');
  for (let btn of conciergeButtons) {
    const txt = await page.evaluate(e => e.textContent, btn);
    if (txt.includes('Add to Cart')) {
      await btn.click();
      break;
    }
  }
  await delay(1500);
  await page.screenshot({ path: `${OUT_DIR}\\step7_add_recommended_to_cart.png` });

  // ── 4. ADD PRODUCT TO CART (Normal Flow) ──
  console.log('Add product to cart...');
  await page.goto(`${URL}/products`, { waitUntil: 'networkidle0' });
  const productLinks = await page.$$('a[href^="/product/"]');
  if (productLinks.length > 0) {
    await productLinks[0].click();
    await delay(1500);
    const addBtn = await page.$('button.btn-primary');
    if(addBtn) await addBtn.click();
    await delay(1000);
  }
  await page.screenshot({ path: `${OUT_DIR}\\step4_add_product_to_cart.png` });

  // ── 8. REGISTER USER ──
  console.log('Registering user...');
  await page.goto(`${URL}/register`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('input#name', { timeout: 10000 });
  const testEmail = `user${Date.now()}@nexora.com`;
  await page.type('input#name', 'Proof User');
  await page.type('input#email', testEmail);
  await page.type('input#password', 'password123');
  await page.click('button[type="submit"]');
  await delay(2000);
  await page.screenshot({ path: `${OUT_DIR}\\step8_register_user.png` });

  // ── 9. LOGIN USER ──
  console.log('Logging in user...');
  await page.evaluate(() => { localStorage.removeItem('nexora_token'); });
  await page.goto(`${URL}/login`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('input#email', { timeout: 10000 });
  await page.type('input#email', testEmail);
  await page.type('input#password', 'password123');
  await page.click('button[type="submit"]');
  await delay(2000);
  await page.screenshot({ path: `${OUT_DIR}\\step9_login_user.png` });

  // ── 10. GUEST PREFERENCE MERGE ──
  console.log('Checking cart for merged items...');
  await page.goto(`${URL}/cart`, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: `${OUT_DIR}\\step10_guest_preference_merge.png` });

  // ── 11. HOMEPAGE PERSONALIZATION ──
  console.log('Checking homepage personalization...');
  await page.goto(`${URL}`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => window.scrollBy(0, 800));
  await delay(1000);
  await page.screenshot({ path: `${OUT_DIR}\\step11_homepage_personalization.png` });

  // ── 5. CHECKOUT FLOW ──
  console.log('Checkout flow...');
  await page.goto(`${URL}/checkout`, { waitUntil: 'networkidle0' });
  
  // Fill Address
  await page.type('input[name="street"]', '123 Luxury Ave');
  await page.type('input[name="city"]', 'New York');
  await page.type('input[name="state"]', 'NY');
  await page.type('input[name="zip"]', '10001');
  await page.type('input[name="country"]', 'USA');

  // Place Order
  const checkoutBtns = await page.$$('button');
  for (let btn of checkoutBtns) {
    const txt = await page.evaluate(e => e.textContent, btn);
    if (txt.includes('Place Order')) {
      await btn.click();
      break;
    }
  }
  await delay(3000);
  await page.screenshot({ path: `${OUT_DIR}\\step5_checkout_flow.png` });

  console.log('All tests finished.');
  await browser.close();
})();
