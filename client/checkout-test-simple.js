import puppeteer from 'puppeteer';

const ARTIFACT_DIR = 'C:\\Users\\sssuj\\.gemini\\antigravity-ide\\brain\\d21927e4-8b4f-4e52-92b1-4a046af1bb99\\';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 1440, height: 900 } });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to origin to set localStorage...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

    // Fetch a real product to use
    console.log('Fetching a real product...');
    const prodRes = await fetch('http://localhost:5000/api/products');
    const prodData = await prodRes.json();
    const realProduct = prodData.data.products[0];
    
    if (!realProduct) throw new Error('No products in database!');
    console.log('Using real product:', realProduct.name);

    // Set cart in localStorage
    console.log('Injecting cart data...');
    await page.evaluate((product) => {
      localStorage.setItem('nexora_cart', JSON.stringify([
        {
          _id: product._id, 
          name: product.name, 
          price: product.price, 
          quantity: 1, 
          image: product.images[0].url
        }
      ]));
    }, realProduct);

    // go to checkout
    console.log('Navigating to checkout...');
    await page.goto('http://localhost:5173/checkout', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: ARTIFACT_DIR + 'debug_checkout_1_shipping.png' });

    // fill form
    console.log('Filling shipping...');
    await page.type('input[name="street"]', '123 Luxury Ave');
    await page.type('input[name="city"]', 'Beverly Hills');
    await page.type('input[name="state"]', 'CA');
    await page.type('input[name="zip"]', '90210');
    await page.type('input[name="country"]', 'USA');
    
    await page.evaluate(() => document.querySelector('button[type="submit"]').click());
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: ARTIFACT_DIR + 'debug_checkout_2.png' });

    await page.evaluate(() => document.querySelector('button[type="submit"]').click());
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: ARTIFACT_DIR + 'debug_checkout_3.png' });

    await page.evaluate(() => document.querySelector('button[type="submit"]').click());
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: ARTIFACT_DIR + 'debug_checkout_4.png' });

    // Apply Discount
    await page.type('input[placeholder="Gift card or discount code"]', 'LUXURY20');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const applyBtn = btns.find(b => b.textContent.includes('Apply'));
      if (applyBtn) applyBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: ARTIFACT_DIR + 'debug_checkout_5_discount.png' });

    await page.evaluate(() => document.querySelector('button[type="submit"]').click());
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    
    await page.screenshot({ path: ARTIFACT_DIR + 'debug_checkout_success.png' });

  } catch (err) {
    console.error('Error:', err);
    await page.screenshot({ path: ARTIFACT_DIR + 'debug_error.png' });
  } finally {
    await browser.close();
  }
})();
