const express = require('express');
const { nanoid } = require('nanoid');
const { logger } = require('../Logging Middleware');

const app = express();
const PORT = process.env.PORT || 3001;

// in memory storage not in the database
const urlDatabase = new Map();
const analytics = new Map();

app.use(express.json());

// Request logging middleware
app.use(async (req, res, next) => {
  const requestId = nanoid(8);
  req.requestId = requestId;

  await logger.info('backend', 'middleware', `Request ${requestId} received: ${req.method} ${req.path}`);
  next();
});

// Utility functions
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function isValidShortcode(shortcode) {
  return /^[a-zA-Z0-9]{3,10}$/.test(shortcode);
}

function generateShortcode() {
  return nanoid(6);
}

function isExpired(expiresAt) {
  return new Date() > new Date(expiresAt);
}

function getMockGeoLocation(ip) {
  const locations = ['India', 'USA', 'Germany', 'Brazil', 'Canada'];
  return locations[Math.floor(Math.random() * locations.length)];
}

// API Endpoints

// Create shortened URL
app.post('/shorturls', async (req, res) => {
  try {
    await logger.info('backend', 'api', `URL shortening request ${req.requestId} started`);

    const { url, validity = 30, shortcode: customShortcode } = req.body;

    if (!url) {
      await logger.error('backend', 'handler', `Missing URL in request ${req.requestId}`);
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!isValidUrl(url)) {
      await logger.error('backend', 'handler', `Invalid URL format in request ${req.requestId}: ${url}`);
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    if (typeof validity !== 'number' || validity <= 0) {
      await logger.error('backend', 'handler', `Invalid validity minutes in request ${req.requestId}: ${validity}`);
      return res.status(400).json({ error: 'Validity must be a positive number' });
    }

    let shortcode;

    if (customShortcode) {
      if (!isValidShortcode(customShortcode)) {
        await logger.error('backend', 'handler', `Invalid custom shortcode format: ${customShortcode}`);
        return res.status(400).json({ error: 'Custom shortcode must be 3-10 alphanumeric characters' });
      }

      if (urlDatabase.has(customShortcode)) {
        await logger.error('backend', 'handler', `Shortcode collision detected: ${customShortcode}`);
        return res.status(409).json({ error: 'Custom shortcode already exists' });
      }

      shortcode = customShortcode;
      await logger.info('backend', 'handler', `Using custom shortcode: ${shortcode}`);
    } else {
      do {
        shortcode = generateShortcode();
      } while (urlDatabase.has(shortcode));
      await logger.info('backend', 'handler', `Generated shortcode: ${shortcode}`);
    }

    const expiresAt = new Date(Date.now() + validity * 60 * 1000);

    const urlData = {
      originalUrl: url,
      shortcode,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      accessCount: 0
    };

    urlDatabase.set(shortcode, urlData);
    analytics.set(shortcode, []);

    await logger.info('backend', 'api', `URL shortened successfully: ${shortcode} -> ${url}`);

    res.status(201).json({
      shortLink: `${req.protocol}://${req.get('host')}/${shortcode}`,
      expiry: urlData.expiresAt
    });

  } catch (error) {
    await logger.fatal('backend', 'api', `URL shortening failed for ${req.requestId}: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get short URL statistics and analytics
app.get('/shorturls/:shortcode', async (req, res) => {
  try {
    const { shortcode } = req.params;

    await logger.info('backend', 'api', `Stats request for shortcode: ${shortcode}`);

    if (!urlDatabase.has(shortcode)) {
      await logger.warn('backend', 'handler', `Shortcode not found: ${shortcode}`);
      return res.status(404).json({ error: 'Shortcode not found' });
    }

    const urlData = urlDatabase.get(shortcode);

    if (isExpired(urlData.expiresAt)) {
      await logger.warn('backend', 'handler', `Expired shortcode accessed: ${shortcode}`);
      return res.status(410).json({ error: 'Shortened URL has expired' });
    }

    const accessHistory = analytics.get(shortcode) || [];

    res.json({
      shortcode,
      originalUrl: urlData.originalUrl,
      createdAt: urlData.createdAt,
      expiresAt: urlData.expiresAt,
      accessCount: urlData.accessCount,
      accessHistory: accessHistory.slice(-10) 
    });

  } catch (error) {
    await logger.fatal('backend', 'api', `Stats retrieval failed: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Redirect shortened URL
app.get('/:shortcode', async (req, res) => {
  try {
    const { shortcode } = req.params;

    await logger.info('backend', 'redirect', `Redirect request for shortcode: ${shortcode}`);

    if (!urlDatabase.has(shortcode)) {
      await logger.warn('backend', 'handler', `Redirect attempted for non-existent shortcode: ${shortcode}`);
      return res.status(404).json({ error: 'Shortcode not found' });
    }

    const urlData = urlDatabase.get(shortcode);

    if (isExpired(urlData.expiresAt)) {
      await logger.warn('backend', 'handler', `Redirect attempted for expired shortcode: ${shortcode}`);
      return res.status(410).json({ error: 'Shortened URL has expired' });
    }

    urlData.accessCount++;
    const accessRecord = {
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      location: getMockGeoLocation(req.ip)
    };

    analytics.get(shortcode).push(accessRecord);

    await logger.info('backend', 'redirect', `Successful redirect: ${shortcode} -> ${urlData.originalUrl}`);

    res.redirect(302, urlData.originalUrl);

  } catch (error) {
    await logger.fatal('backend', 'redirect', `Redirect failed for shortcode ${req.params.shortcode}: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  await logger.info('backend', 'api', 'Health check requested');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    totalUrls: urlDatabase.size
  });
});

// Global error handler
app.use(async (error, req, res, next) => {
  await logger.fatal('backend', 'middleware', `Unhandled error: ${error.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 fallback
app.use(async (req, res) => {
  await logger.warn('backend', 'middleware', `404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, async () => {
  await logger.info('backend', 'server', `URL Shortener service started on port ${PORT}`);
  console.log(`URL Shortener service running on port ${PORT}`);
});

module.exports = app;
