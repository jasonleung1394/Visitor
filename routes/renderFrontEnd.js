// in routes/renderFrontEnd.js
const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, '../public/render_fe.html'));
});

module.exports = router;