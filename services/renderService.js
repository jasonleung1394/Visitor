const { chromium } = require('playwright');

async function renderPage({ url, aspectRatio = '16:9', type = 'html', css_selector = [] }) {
  // simple HTML escaper
  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // compute viewport from aspect ratio
  const [w, h] = aspectRatio.split(':').map(Number);
  const width = w;
  const height = Math.round(w * (h / w));

  // decide if this is “phone” size
  const isPhone = width <= 767;

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width, height },
    // mobile emulation only when isPhone
    isMobile: isPhone,
    hasTouch: isPhone,
    deviceScaleFactor: isPhone ? 2 : 1,
    // override UA for phone so you hit responsive CSS
    userAgent: isPhone
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) ' +
      'AppleWebKit/605.1.15 (KHTML, like Gecko) ' +
      'Version/14.0 Mobile/15E148 Safari/604.1'
      : undefined
  });

  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle' });

    // common PDF settings
    const pdfOpts = {
      width: `${width}px`,
      height: `${height}px`,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      printBackground: true
    };
    if (type === 'pdf' || type === 'download_pdf') {
      const buf = await page.pdf(pdfOpts);
      return {
        status: 'success',
        type,
        aspectRatio,
        data: {
          base64: buf.toString('base64')
        }
      };
    }
    if (type === 'download_pdf_api') {
      const buf = await page.pdf(pdfOpts);
      await browser.close();   // ensure browser closes here
      return buf;              // RAW binary, nothing else
    }

    if (type === 'html') {
      const html = await page.content();
      let selectorResults = {};

      if (Array.isArray(css_selector) && css_selector.length > 0) {
        for (const selector of css_selector) {
          try {
            const matches = await page.$$eval(selector, els =>
              els.map(el => {
                const link = el.querySelector('a');  // find first <a> inside
                return {
                  html: el.outerHTML.trim(),
                  text: el.textContent.trim(),
                  href: link ? link.href : null
                };
              })
            );
            selectorResults[selector] = matches;
          } catch (e) {
            selectorResults[selector] = ["error"];
          }
        }
      }

      return {
        status: 'success',
        type: 'html',
        data: {
          selectors: selectorResults,
          escaped: escapeHtml(html),
        }
      };
    }

    throw new Error(`Unsupported type: ${type}`);
  }
  catch (err) {
    return { status: 'error', message: err.message };
  }
  finally {
    await browser.close();
  }
}

module.exports = { renderPage };
