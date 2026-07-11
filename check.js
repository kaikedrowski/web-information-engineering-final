const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('request', req => console.log('REQUEST:', req.url()));
  page.on('response', response => {
    if (!response.ok()) console.log('RESPONSE FAILED:', response.url(), response.status());
  });
  await page.goto('https://appl-tree.netlify.app/login');
  await new Promise(r => setTimeout(r, 2000));
  await page.click('.switchAuthButton');
  await new Promise(r => setTimeout(r, 1000));
  const inputs = await page.$$('input.authField');
  await inputs[0].type('testuser99');
  await inputs[1].type('testpass99');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
})();
