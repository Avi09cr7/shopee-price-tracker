const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 10000;

app.get('/shopee-price', async (req, res) => {
  const { itemid, shopid } = req.query;

  if (!itemid || !shopid) {
    return res.status(400).json({ error: 'Missing itemid or shopid' });
  }

  const productUrl = `https://shopee.sg/product/${shopid}/${itemid}`;

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await page.goto(productUrl, { waitUntil: 'networkidle2' });

    const data = await page.evaluate(() => {
      const name = document.querySelector('div.page-product__content h1')?.innerText;
      const price = document.querySelector('div.pdp-price')?.innerText ||
                    document.querySelector('div.pdp-mod-product-price__current')?.innerText;
      return { name, price };
    });

    await browser.close();

    if (!data.name || !data.price) {
      return res.status(404).json({ error: 'Product details not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ error: 'Failed to fetch product data' });
  }
});

app.listen(PORT, () => {
  console.log(`Shopee Price Tracker running on port ${PORT}`);
});
