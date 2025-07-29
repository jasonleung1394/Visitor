const express = require('express');
const router = express.Router();
const { renderPage } = require('../services/renderService');

router.post('/', async (req, res) => {
  const { url, type, aspectRatio, aspectMode, customW, customH, css_selector } = req.body;

  if (!url) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing "url" field.'
    });
  }

  if (!['pdf', 'html', 'download_pdf', 'download_pdf_api'].includes(type)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid "type". Must be "pdf", "html", "download_pdf", or "download_pdf_api".'
    });
  }

  // Preset aspect ratio dimensions
  const presetDimensions = {
    '16:9': { width: 1920, height: 1080 },
    '4:3': { width: 1600, height: 1200 },
    '21:9': { width: 2560, height: 1080 },
    '1:1': { width: 1080, height: 1080 },
  };

  let finalW = customW;
  let finalH = customH;

  // If aspectMode is "preset" and aspectRatio exists in presets, use it
  if (aspectMode === 'preset' && presetDimensions[aspectRatio]) {
    finalW = finalW || presetDimensions[aspectRatio].width;
    finalH = finalH || presetDimensions[aspectRatio].height;
  }

  // Final aspect ratio string
  const ratio = (finalW && finalH)
    ? `${finalW}:${finalH}`
    : aspectRatio;

  try {
    if (type === 'download_pdf_api') {
      const pdfBuffer = await renderPage({ url, aspectRatio: ratio, type });

      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBuffer.length,
        'Content-Disposition': 'attachment; filename="rendered.pdf"',
      });

      return res.end(pdfBuffer);
    }

    // For html and pdf
    const result = await renderPage({ url, aspectRatio: ratio, type, css_selector });
    if (result.status === 'error') {
      return res.status(500).json(result);
    }

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
