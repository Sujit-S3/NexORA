const puppeteer = require('puppeteer');
const OUT_DIR = 'C:\\Users\\sssuj\\.gemini\\antigravity-ide\\brain\\423cbddb-dccc-4cb1-b865-63d1d961385e';
const URL = 'http://localhost:5173';
const delay = ms => new Promise(res => setTimeout(res, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--window-size=1280,800'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  await page.goto(`${URL}/login`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('input#email', { timeout: 10000 });
  await page.type('input#email', 'admin_test@nexora.com');
  await page.type('input#password', 'password123');
  await page.click('button[type="submit"]');
  await delay(2000);

  await page.goto(`${URL}/admin/products`, { waitUntil: 'networkidle0' });
  await delay(1000);
  
  // Find Edit button
  const editButtons = await page.$$('a[href^="/admin/products/edit"]');
  if (editButtons.length > 0) {
    await editButtons[0].click();
    await delay(1500);
    
    await page.waitForSelector('input[placeholder="e.g. Rolex Submariner Date"]', { timeout: 5000 }).catch(()=>console.log('No placeholder'));
    
    await page.screenshot({ path: `${OUT_DIR}\\step2_edit_product.png` });
  } else {
    // Navigate directly if buttons fail
    await page.goto(`${URL}/admin/products/edit/some_id`, { waitUntil: 'networkidle0' }); // Fallback
    await page.screenshot({ path: `${OUT_DIR}\\step2_edit_product.png` });
  }

  await browser.close();
})();
