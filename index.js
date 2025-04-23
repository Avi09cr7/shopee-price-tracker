const chromium = require('chrome-aws-lambda');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 10000;

app.get('/shopee-price', async (req, res) => {
  const { itemid, shopid } = req.query;

  if (!itemid || !shopid) {
    return res.status(400).json({ error: 'Missing itemid or shopid' });
  }

  const productUrl = `https://shopee.sg/product/${shopid}/${itemid}`;

  let browser = null;
  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(productUrl, { waitUntil: 'networkidle2' });

    const data = await page.evaluate(() => {
      const name = document.querySelector('div.page-product__content h1')?.innerText;
      const price = document.querySelector('div.pdp-price')?.innerText ||
                    document.querySelector('div.pdp-mod-product-price__current')?.innerText;
      return { name, price };
    });

    if (!data.name || !data.price) {
      return res.status(404).json({ error: 'Product details not found' });
    }

    res.json(data);
  } catch (err) {
    console.error('Scraping error:', err);
    res.status(500).json({ error: 'Failed to fetch product data' });
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
});

app.listen(PORT, () => {
  console.log(`Shopee Price Tracker running on port ${PORT}`);
});
