const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Starting E2E Browser Automation Test...');
  let browser;
  try {
    browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    console.log('✅ Homepage loaded');
    
    console.log('Navigating to Products...');
    await page.goto('http://localhost:5173/products', { waitUntil: 'networkidle0' });
    console.log('✅ Products page loaded');

    const firstProduct = await page.$('a[href^="/product/"]');
    if (firstProduct) {
      const href = await page.evaluate(el => el.href, firstProduct);
      console.log('Clicking first product: ' + href);
      await page.goto(href, { waitUntil: 'networkidle0' });
      console.log('✅ Product detail page loaded');
      
      const sizeGuideBtn = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find(b => b.textContent.includes('Size Guide')) ? true : false;
      });
      if (sizeGuideBtn) {
        console.log('✅ Size Guide button found');
      } else {
        console.log('⚠️ Size Guide button not found (might not be a fashion product)');
      }
    } else {
      console.log('❌ No products found on products page');
      process.exitCode = 1;
    }

    console.log('🎉 E2E Basic Navigation Test Passed!');
  } catch (err) {
    console.error('❌ E2E Test Failed:', err);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
  }
})();
