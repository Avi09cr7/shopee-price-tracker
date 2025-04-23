const express = require("express");
const puppeteer = require("puppeteer");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/shopee-price", async (req, res) => {
  const { shopid, itemid } = req.query;

  if (!shopid || !itemid) {
    return res.status(400).json({ error: "Missing shopid or itemid" });
  }

  const url = `https://shopee.sg/api/v4/item/get?itemid=${itemid}&shopid=${shopid}`;

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000
    });

    const body = await page.evaluate(() => document.body.innerText);
    await browser.close();

    const data = JSON.parse(body);

    if (!data || !data.data || !data.data.name) {
      throw new Error("Invalid product data");
    }

    res.json({
      item_name: data.data.name,
      price: data.data.price / 100000, // Shopee returns price in cents
    });
  } catch (error) {
    console.error("Shopee fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch product data" });
  }
});

app.get("/", (req, res) => {
  res.send("Shopee Price Tracker is Live 🎉");
});

app.listen(PORT, () => {
  console.log(`Shopee Price Tracker running on port ${PORT}`);
});
