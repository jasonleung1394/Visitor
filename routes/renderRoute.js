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

  if (!['pdf', 'html', 'download_pdf'].includes(type)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid "type". Must be "pdf" or "html".'
    });
  }
  const ratio = (customW && customH)
    ? `${customW}:${customH}`
    : aspectRatio;

  const result = await renderPage({ url, aspectRatio: ratio, type });

  if (result.status === 'error') {
    return res.status(500).json(result);
  }

  res.status(200).json(result);
});

module.exports = router;
