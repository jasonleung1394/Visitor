const express = require('express');
const router = express.Router();
const { renderPage } = require('../services/renderService');

router.post('/', async (req, res) => {
  const { url, type, aspectRatio, customW, customH } = req.body;

  if (!url) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing "url" field.'
    });
  }

  if (!['pdf', 'html', 'download_pdf', 'download_pdf_api'].includes(type)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid "type". Must be "pdf", "html", or "download_pdf".'
    });
  }

  const ratio = (customW && customH)
    ? `${customW}:${customH}`
    : aspectRatio;

  try {
    if (type === 'download_pdf_api') {
      const pdfBuffer = await renderPage({ url, aspectRatio: ratio, type });

      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBuffer.length,
        'Content-Disposition': 'attachment; filename="rendered.pdf"',
      });

      return res.end(pdfBuffer); // ensures raw binary download
    }

    // Otherwise, keep returning JSON
    const result = await renderPage({ url, aspectRatio: ratio, type });
    if (result.status === 'error') {
      return res.status(500).json(result);
    }

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
