const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/', (req, res) => {
  res.send('Shopee Price Tracker is live!');
});

app.get('/shopee-price', async (req, res) => {
  const { itemid, shopid } = req.query;

  if (!itemid || !shopid) {
    return res.status(400).json({ error: 'Missing itemid or shopid' });
  }

  const apiUrl = `https://shopee.sg/api/v4/item/get?itemid=${itemid}&shopid=${shopid}`;

  try {
    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Referer': `https://shopee.sg/product/${shopid}/${itemid}`,
        'Accept-Language': 'en-US,en;q=0.9',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    const data = response.data;
    const name = data.item?.name;
    const price = data.item?.price / 100000;

    if (!name || !price) {
      return res.status(500).json({ error: 'Product info not found in response' });
    }

    return res.json({ item_name: name, price: price });
  } catch (error) {
    console.error('Shopee fetch error:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to fetch product data' });
  }
});

app.listen(PORT, () => {
  console.log(`Shopee Price Tracker running on port ${PORT}`);
});
