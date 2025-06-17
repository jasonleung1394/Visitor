const express = require('express');
const app = express();

app.use(express.json({ limit: '2mb' }));

// Routes
const renderRoute = require('./routes/renderRoute');
app.use('/render', renderRoute);

const renderFrontEnd = require('./routes/renderFrontEnd');
app.use('/render_fe', renderFrontEnd);


// Default
app.get('/', (req, res) => {
  res.send('Microservice is up');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Microservice running on port ${PORT}`));
