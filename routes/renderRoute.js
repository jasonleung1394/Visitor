const express = require('express');
const router = express.Router();
const { renderPage } = require('../services/renderService');

router.post('/', async (req, res) => {
  const { url, aspectRatio, type } = req.body;

  if (!url) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing "url" field.'
    });
  }

  if (!['pdf', 'html'].includes(type)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid "type". Must be "pdf" or "html".'
    });
  }

  const result = await renderPage({ url, aspectRatio, type });

  if (result.status === 'error') {
    return res.status(500).json(result);
  }

  res.status(200).json(result);
});

module.exports = router;
