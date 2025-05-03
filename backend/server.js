// backend/server.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import path from 'path';
import express from 'express';
import cors from 'cors';
import { fetchCaptcha, fetchVTUResult } from './vtuScraper.js';
import { db } from './firebase.js'; // 📌 Required to access Firestore

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// CAPTCHA Route
app.get('/api/captcha', async (req, res) => {
  try {
    const img = await fetchCaptcha();
    res.type('png').send(img);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch CAPTCHA image', message: e.message });
  }
});

// Single result fetch
app.post('/api/result', async (req, res) => {
  const { usn, captcha } = req.body;
  if (!usn || !captcha) return res.status(400).json({ error: 'Missing USN or CAPTCHA' });

  try {
    const result = await fetchVTUResult(usn.toUpperCase(), captcha);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch VTU result', message: e.message });
  }
});

// Compare multiple USNs
app.post('/api/result/compare', async (req, res) => {
  const { usns, captcha } = req.body;
  if (!usns || usns.length < 2 || !captcha) {
    return res.status(400).json({ error: 'Missing USNs or CAPTCHA' });
  }

  try {
    const results = [];
    for (let usn of usns) {
      const result = await fetchVTUResult(usn.toUpperCase(), captcha);
      if (result.error) {
        return res.status(400).json({ error: `Error fetching result for ${usn}: ${result.error}` });
      }
      results.push(result);
    }

    results.sort((a, b) => b.totalMarks - a.totalMarks);
    results.forEach((result, index) => { result.rank = index + 1; });

    res.json({ results });
  } catch (e) {
    res.status(500).json({ error: 'Failed to compare results', message: e.message });
  }
});

// Fetch class rank
app.get('/api/class-rank', async (req, res) => {
  const { groupKey } = req.query;
  if (!groupKey) return res.status(400).json({ error: 'Missing groupKey' });

  try {
    const doc = await db.collection('class_rankings').doc(groupKey).get();
    if (!doc.exists) return res.status(404).json({ error: 'Class ranking not found' });

    const results = doc.data().results.sort((a, b) => a.rank - b.rank);
    res.json({ results });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch class rankings' });
  }
});

// === NEW === Fetch University Rankings (23CS format, NOT just year)
app.get('/api/university-rank', async (req, res) => {
  const { groupKey } = req.query;
  if (!groupKey) {
    return res.status(400).json({ error: 'Missing groupKey (Example: 23CS)' });
  }

  try {
    const docRef = db.collection('university_rankings').doc(groupKey);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: `Rank not found for ${groupKey}` });
    }

    const results = docSnap.data().results;
    res.json({ results });
  } catch (e) {
    console.error('Failed to fetch university rank:', e);
    res.status(500).json({ error: 'Server error' });
  }
});



// Serve static files from /public
app.use(express.static(path.resolve('public')));

// Serve static files from /public/home (CSS, JS, etc. inside home folder)
app.use('/home', express.static(path.resolve('public', 'home')));

// Redirect root (/) to /home
app.get('/', (req, res) => {
  res.redirect('/home');
});

// Fallback routing for different routes
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  // Serve the home page correctly
  if (req.path === '/home' || req.path === '/home/') {
    return res.sendFile(path.resolve('public', 'home', 'index.html'));
  }

  if (req.path.startsWith('/ranking')) {
    return res.sendFile(path.resolve('public', 'ranking', 'rank.html'));
  }

  if (req.path.startsWith('/compare')) {
    return res.sendFile(path.resolve('public', 'compare', 'compare.html'));
  }

  if (req.path.startsWith('/legal')) {
    return res.sendFile(path.resolve('public', 'legal', 'legal.html'));
  }

  // Default fallback to home/index.html
  res.sendFile(path.resolve('public', 'home', 'index.html'));
});

// Catch-all (404) handler
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
