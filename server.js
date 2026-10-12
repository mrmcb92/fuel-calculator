const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// API: Real-time and cached fuel prices endpoint
app.get('/api/fuel-prices', (req, res) => {
  res.type('application/json');
  res.setHeader('Cache-Control', 'public, max-age=1800');
  const pricesPath = path.join(__dirname, 'fuel-prices.json');
  fs.readFile(pricesPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({
        error: 'Failed to read fuel prices',
        prices: { B95: 9.77, B98: 10.18, Diesel: 10.23, DieselPlus: 10.61, GPL: 4.67 }
      });
    }
    try {
      res.send(data);
    } catch (parseErr) {
      res.status(500).json({ error: 'Invalid fuel prices data' });
    }
  });
});

// Direct asset endpoints with absolute mime types and no-cache guarantees
app.get('/firebase-config.js', (req, res) => {
  res.type('application/javascript');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const config = {
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyCs0hjNhFke5SQsCFFqqaPUJTEOXfOytmc",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "fuel-calculator-faa50.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "fuel-calculator-faa50",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "fuel-calculator-faa50.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "856821371606",
    appId: process.env.FIREBASE_APP_ID || "1:856821371606:web:4a6af821e896677d3c6f77",
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-B9C0C6JHSY"
  };
  res.send(`const FIREBASE_CONFIG = ${JSON.stringify(config, null, 2)};\n`);
});

app.get('/core.js', (req, res) => {
  res.type('application/javascript');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.sendFile(path.join(__dirname, 'core.js'));
});

app.get('/app.js', (req, res) => {
  res.type('application/javascript');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.sendFile(path.join(__dirname, 'app.js'));
});

app.get('/style.css', (req, res) => {
  res.type('text/css');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'style.css'));
});

// Service Worker endpoint with immediate revalidation
app.get('/sw.js', (req, res) => {
  res.type('application/javascript');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.sendFile(path.join(__dirname, 'sw.js'));
});

// Clear stale cache and ensure proper headers for scripts
app.use((req, res, next) => {
  res.setHeader('Clear-Site-Data', '"cache"');
  if (req.path.endsWith('.js')) {
    res.type('application/javascript');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
  next();
});

// Serve static assets from project root
app.use(express.static(path.join(__dirname)));

// Single page application fallback (only for page navigations, not asset requests)
app.get('*', (req, res) => {
  if (req.path.match(/\.(js|css|json|png|jpg|svg|ico|txt|map|webmanifest)$/i)) {
    return res.status(404).type('text/plain').send('Not Found');
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
