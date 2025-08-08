// index.js
require('dotenv').config();          // optional – for env vars
const express = require('express');
const cors    = require('cors');
const axios   = require('axios');
const path    = require('path');

const app = express();

// CORS & static assets
app.use(cors({optionsSuccessStatus: 200}));
app.use(express.static('public'));

// In-memory “database” for recent searches (persists only while server is up)
let recent = [];

// ── ROUTES ────────────────────────────────────────────────────────────────
// 1. Image search endpoint
app.get('/api/imagesearch/:term', async (req, res) => {
  const { term } = req.params;
  const page = Math.max(parseInt(req.query.page) || 1, 1);

  // Save to recent
  recent.unshift({ term, when: new Date().toISOString() });
  recent = recent.slice(0, 10);        // keep only last 10

  try {
    // Example call to Unsplash (you can swap for Pixabay, etc.)
    const apiUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
      term
    )}&page=${page}&per_page=10&client_id=${process.env.UNSPLASH_ACCESS_KEY}`;

    const { data } = await axios.get(apiUrl);

    const results = data.results.map((img) => ({
      url: img.urls.regular,
      description: img.description || img.alt_description || 'No description',
      pageUrl: img.links.html
    }));

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Image service unavailable' });
  }
});

// 2. Latest searches endpoint
app.get('/api/latest/imagesearch', (_, res) => {
  res.json(recent);
});

// 3. Default landing page
app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Spin up server
const listener = app.listen(process.env.PORT || 3000, () =>
  console.log(`Listening on port ${listener.address().port}`)
);