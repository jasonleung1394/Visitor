// services/downloadService.js
const { chromium } = require('playwright');
const fs = require('fs');
const axios = require('axios');

async function handleBinaryDownload(url, res) {
  const filenameFromURL = decodeURIComponent(url.split('/').pop());

  try {
    // --- Attempt Playwright download ---
    const browser = await chromium.launch({ args: ['--no-sandbox'] });
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }), // 10s
      page.evaluate(fileUrl => window.location.href = fileUrl, url)
    ]);

    const filePath = await download.path();
    const suggestedName = download.suggestedFilename();
    const buffer = fs.readFileSync(filePath);

    await browser.close();

    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Length': buffer.length,
      'Content-Disposition': `attachment; filename="${suggestedName}"`,
    });
    return res.end(buffer);

  } catch (err) {
    console.warn('Playwright download failed, falling back to Axios:', err.message);

    // --- Fallback to Axios download ---
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const contentType = response.headers['content-type'] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': response.data.length,
        'Content-Disposition': `attachment; filename="${filenameFromURL}"`,
      });
      return res.end(response.data);

    } catch (fallbackErr) {
      return res.status(500).json({
        status: 'error',
        message: `Failed to download via Playwright and Axios: ${fallbackErr.message}`
      });
    }
  }
}

module.exports = { handleBinaryDownload };
