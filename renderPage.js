const express = require('express');
const { chromium } = require('playwright');

const app = express();
app.use(express.json({ limit: '1mb' }));

app.post('/render', async (req, res) => {
  const { url, aspectRatio = '16:9', pdf = false } = req.body;

  if (!url) return res.status(400).json({ error: 'URL is required.' });

  const [w, h] = aspectRatio.split(':').map(Number);
  const width = 1280;
  const height = Math.round(width * (h / w));

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle' });

    if (pdf) {
      const pdfBuffer = await page.pdf({ format: 'A4' });
      const base64PDF = pdfBuffer.toString('base64');
      res.json({ base64: base64PDF });
    } else {
      const html = await page.content();
      res.json({ html });
    }
  } catch (err) {
    console.error('Error rendering:', err);
    res.status(500).json({ error: 'Failed to render page.' });
  } finally {
    await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
