const { chromium } = require('playwright');

async function renderPage({ url, aspectRatio = '16:9', type = 'html' }) {
  const [w, h] = aspectRatio.split(':').map(Number);
  const width = 1280;
  const height = Math.round(width * (h / w));

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle' });

    if (type === 'pdf') {
      const pdfBuffer = await page.pdf({ format: 'A4' });
      return {
        status: 'success',
        type: 'pdf',
        data: {
          base64: pdfBuffer.toString('base64')
        }
      };
    }

    if (type === 'html') {
      const html = await page.content();
      return {
        status: 'success',
        type: 'html',
        data: {
          html
        }
      };
    }

    throw new Error(`Unsupported type: ${type}`);

  } catch (err) {
    return {
      status: 'error',
      message: err.message
    };
  } finally {
    await browser.close();
  }
}

module.exports = { renderPage };
