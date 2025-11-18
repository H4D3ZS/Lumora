#!/usr/bin/env node

/**
 * Lumora OTA Dashboard Server
 * Serves the web dashboard for managing OTA updates
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.DASHBOARD_PORT || 3003;

// Serve static dashboard
app.use(express.static(__dirname));

// Redirect root to dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n📊 Lumora OTA Dashboard`);
  console.log(`🌐 Dashboard running on http://localhost:${PORT}`);
  console.log(`\n✅ Ready to manage updates!\n`);
});
