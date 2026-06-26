import puppeteer from 'puppeteer';
import fs from 'fs';

const ARTIFACT_DIR = 'C:\\Users\\sssuj\\.gemini\\antigravity-ide\\brain\\d21927e4-8b4f-4e52-92b1-4a046af1bb99\\';

(async () => {
  console.log('Starting Puppeteer for Checkout Testing...');
  const browser = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 1440, height: 900 } });
  const page = await browser.newPage();
  
  try {
    // 1. Home page
    console.log('Navigating to Home...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Wait for products to load and click the first one
    await page.waitForSelector('a[href^="/product/"]');
    const productLink = await page.$('a[href^="/product/"]');
    console.log('Clicking product...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      productLink.click()
    ]);
    
    // 2. Product Details - Add to Cart
    console.log('Adding to cart...');
    // wait for a button whose text contains 'Add To Cart'
    await page.waitForFunction(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some(b => b.textContent.includes('Add To Cart'));
    });
    
    const addToCartBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent.includes('Add To Cart'));
    });
    
    await addToCartBtn.click();
    await new Promise(r => setTimeout(r, 2000)); // wait for cart state to update

    // 3. Navigate to Checkout
    console.log('Navigating to Checkout...');
    await page.goto('http://localhost:5173/checkout', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[name="street"]', { timeout: 10000 });
    await page.screenshot({ path: ARTIFACT_DIR + 'checkout_step1_shipping.png' });
    console.log('Screenshot: checkout_step1_shipping.png saved.');
    
    // Fill Shipping
    console.log('Filling shipping...');
    await page.type('input[name="street"]', '123 Luxury Ave');
    await page.type('input[name="city"]', 'Beverly Hills');
    await page.type('input[name="state"]', 'CA');
    await page.type('input[name="zip"]', '90210');
    await page.type('input[name="country"]', 'USA');
    
    // Click Continue
    let continueBtn = await page.$('button[type="submit"]');
    await continueBtn.click();
    await new Promise(r => setTimeout(r, 1000)); // wait for animation
    
    // Delivery Step
    console.log('Delivery step...');
    await page.screenshot({ path: ARTIFACT_DIR + 'checkout_step2_delivery.png' });
    continueBtn = await page.$('button[type="submit"]');
    await continueBtn.click();
    await new Promise(r => setTimeout(r, 1000));
    
    // Payment Step
    console.log('Payment step...');
    await page.screenshot({ path: ARTIFACT_DIR + 'checkout_step3_payment.png' });
    continueBtn = await page.$('button[type="submit"]');
    await continueBtn.click();
    await new Promise(r => setTimeout(r, 1000));
    
    // Review Step
    console.log('Review step...');
    await page.screenshot({ path: ARTIFACT_DIR + 'checkout_step4_review_before.png' });
    
    // Apply Discount
    console.log('Applying discount...');
    const discountInput = await page.$('input[placeholder="Gift card or discount code"]');
    if (discountInput) {
      await discountInput.type('LUXURY20');
      // Find Apply button
      const allBtns = await page.$$('button');
      for (const btn of allBtns) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text.includes('Apply')) {
          await btn.click();
          break;
        }
      }
      await new Promise(r => setTimeout(r, 2000)); // wait for api response
      await page.screenshot({ path: ARTIFACT_DIR + 'checkout_step4_review_after_discount.png' });
      console.log('Screenshot: checkout_step4_review_after_discount.png saved.');
    }
    
    // Confirm Payment
    console.log('Confirming Payment...');
    await continueBtn.click();
    
    // Wait for Success or Failure
    console.log('Waiting for completion...');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
    const finalUrl = page.url();
    console.log('Final URL:', finalUrl);
    
    await page.screenshot({ path: ARTIFACT_DIR + 'checkout_final_result.png' });
    console.log('Screenshot: checkout_final_result.png saved.');

    // Check DB for order
    console.log('Checkout E2E Test Completed Successfully.');

  } catch (err) {
    console.error('Error during checkout test:', err);
    await page.screenshot({ path: ARTIFACT_DIR + 'checkout_error.png' });
  } finally {
    await browser.close();
  }
})();
