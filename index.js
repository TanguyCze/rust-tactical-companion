/**
 * RUST TACTICAL COMPANION — Pterodactyl Node.js Server
 * ------------------------------------------------------
 * - Zero-dependency, zero-crash startup on any Node.js 16/18/20/22 Pterodactyl Egg
 * - Auto-binds to Pterodactyl's SERVER_PORT or PORT environment variable
 * - Real-time Squad Sync via Server-Sent Events (SSE) + JSON file persistence
 * - Built-in BattleMetrics API Proxy + Discord Webhook notifications
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = parseInt(process.env.SERVER_PORT || process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const SQUAD_PIN = process.env.SQUAD_PIN || '';
const BM_TOKEN = process.env.BATTLEMETRICS_TOKEN || '';

const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'squad-state.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_STATE = {
  squadName: 'RUST SQUAD ALPHA',
  activeTimers: [],
  raidQueue: [
    { targetId: 'sheet_metal_door', qty: 2, mode: 'combo' },
    { targetId: 'garage_door', qty: 3, mode: 'combo' },
    { targetId: 'stone_wall', qty: 1, mode: 'combo' }
  ],
  savedClones: [
    { id: 'c1', crop: 'Hemp', genes: 'YGYWGG', notes: 'Gen 1 Starter' },
    { id: 'c2', crop: 'Hemp', genes: 'GGYYXW', notes: 'Gen 1 Donor A' },
    { id: 'c3', crop: 'Hemp', genes: 'YYYYGG', notes: 'God Clone (Yield)' },
    { id: 'c4', crop: 'Blue Berry', genes: 'GGGYYY', notes: 'Pure Ore Tea Clone' }
  ],
  battlemetrics: {
    serverId: '',
    serverName: 'Rustoria.co - EU Main',
    watchlist: [
      {
        id: 'w1',
        name: '[ZERG] ChadThundercock',
        grid: 'Q14',
        typicalOffline: '03:30 - 10:00',
        notes: 'Main builder / TC auth, logs off around 3:30 AM CET',
        status: 'offline'
      },
      {
        id: 'w2',
        name: 'xX_OilRigController_Xx',
        grid: 'U4',
        typicalOffline: '02:00 - 09:00',
        notes: 'Counters Small Rig from snow cliff boat base',
        status: 'online'
      }
    ]
  },
  discordWebhookUrl: '',
  updatedAt: Date.now()
};

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf8');
      // Drop legacy Rust+ / live-map data (incl. any saved auth tokens) from older versions
      const { rustPlus, markers, mapConfig, ...parsed } = JSON.parse(raw);
      const state = { ...DEFAULT_STATE, ...parsed };
      if (rustPlus || markers || mapConfig) saveState(state);
      return state;
    }
  } catch (err) {
    console.error('[State] Failed to read squad-state.json, using default:', err.message);
  }
  saveState(DEFAULT_STATE);
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function saveState(state) {
  try {
    state.updatedAt = Date.now();
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('[State] Failed to save squad-state.json:', err.message);
  }
}

let squadState = loadState();
const sseClients = new Set();

function broadcastState(eventType = 'state_update', extra = {}) {
  const payload = JSON.stringify({
    type: eventType,
    state: squadState,
    ...extra,
    timestamp: Date.now()
  });
  for (const res of sseClients) {
    try {
      res.write(`data: ${payload}\n\n`);
    } catch (_) {
      sseClients.delete(res);
    }
  }
}

// ============================================================================
// BATTLEMETRICS PROXY & DISCORD WEBHOOK HELPER
// ============================================================================
const bmCache = new Map();
const BM_CACHE_TTL = 60 * 1000;

function fetchJsonHttps(urlStr, token = '') {
  return new Promise((resolve, reject) => {
    const cached = bmCache.get(urlStr);
    if (cached && Date.now() - cached.time < BM_CACHE_TTL) {
      return resolve(cached.data);
    }

    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'RustTacticalCompanion/2.1'
    };
    if (token || BM_TOKEN) {
      headers['Authorization'] = `Bearer ${token || BM_TOKEN}`;
    }

    const req = https.get(urlStr, { headers, timeout: 8000 }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            bmCache.set(urlStr, { time: Date.now(), data: json });
            resolve(json);
          } else {
            reject(new Error(json?.errors?.[0]?.detail || `BattleMetrics HTTP ${res.statusCode}`));
          }
        } catch (err) {
          reject(new Error(`Invalid JSON from BattleMetrics: ${err.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('BattleMetrics request timed out'));
    });
  });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 2 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Squad-Pin, Authorization'
  });
  res.end(JSON.stringify(data));
}

function checkPin(req, res) {
  if (!SQUAD_PIN) return true;
  const provided = req.headers['x-squad-pin'] || '';
  if (provided !== SQUAD_PIN) {
    sendJson(res, 403, { error: 'Invalid Squad PIN. Set your Squad PIN in the top bar.' });
    return false;
  }
  return true;
}

function sendDiscordWebhook(webhookUrl, title, description, color = 0xcd412b) {
  return new Promise((resolve, reject) => {
    const targetUrl = webhookUrl || squadState.discordWebhookUrl || process.env.DISCORD_WEBHOOK_URL;
    if (!targetUrl || !targetUrl.startsWith('https://discord')) {
      return reject(new Error('No valid Discord Webhook URL configured'));
    }
    const parsed = new URL(targetUrl);
    const payload = JSON.stringify({
      username: `Rust Tactical Companion [${squadState.squadName || 'SQUAD'}]`,
      embeds: [
        {
          title,
          description,
          color,
          timestamp: new Date().toISOString(),
          footer: { text: 'Rust Tactical Companion • Rust+ & Pterodactyl Live Sync' }
        }
      ]
    });

    const req = https.request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 6000
      },
      (res) => {
        res.on('data', () => {});
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(true);
          else reject(new Error(`Discord HTTP ${res.statusCode}`));
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function fetchTextHttps(urlStr, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error('Too many redirects'));
    const parsed = new URL(urlStr);
    const req = https.request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8'
        },
        timeout: 12000
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const nextUrl = new URL(res.headers.location, urlStr).toString();
          res.resume();
          return fetchTextHttps(nextUrl, redirectCount + 1).then(resolve, reject);
        }
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(body);
          else reject(new Error(`HTTP ${res.statusCode} fetching ${parsed.hostname}`));
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error('Request timeout'));
    });
    req.end();
  });
}

function parseRustMapsFromHtml(html) {
  const scriptRe = /<script[^>]*>(\{"status":200[^<]*?)<\/script>/g;
  let match;
  while ((match = scriptRe.exec(html)) !== null) {
    try {
      const outer = JSON.parse(match[1]);
      if (typeof outer?.body === 'string' && outer.body.includes('"monuments"')) {
        const inner = JSON.parse(outer.body);
        if (inner?.data?.monuments && inner?.data?.size) {
          return inner.data;
        }
      }
    } catch (_) {}
  }
  return null;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Squad-Pin, Authorization'
      });
      return res.end();
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // 1. SSE Live Stream
    if (pathname === '/api/events' && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });
      res.write(
        `data: ${JSON.stringify({
          type: 'connected',
          state: squadState,
          pinRequired: Boolean(SQUAD_PIN)
        })}\n\n`
      );
      sseClients.add(res);
      req.on('close', () => sseClients.delete(res));
      return;
    }

    // 2. Get or Update Full Squad State
    if (pathname === '/api/state') {
      if (req.method === 'GET') {
        return sendJson(res, 200, {
          state: squadState,
          pinRequired: Boolean(SQUAD_PIN)
        });
      }
      if (req.method === 'POST' || req.method === 'PUT') {
        if (!checkPin(req, res)) return;
        const body = await readJsonBody(req);
        squadState = {
          ...squadState,
          ...body,
          updatedAt: Date.now()
        };
        saveState(squadState);
        broadcastState('state_update');
        return sendJson(res, 200, { ok: true, state: squadState });
      }
    }

    // 5. BattleMetrics Search Proxy
    if (pathname === '/api/battlemetrics/search' && req.method === 'GET') {
      const q = parsedUrl.searchParams.get('q') || '';
      const token = req.headers['authorization']?.replace('Bearer ', '') || '';
      if (!q.trim()) {
        return sendJson(res, 400, { error: 'Missing search query parameter ?q=' });
      }
      const apiUrl = `https://api.battlemetrics.com/servers?filter[game]=rust&filter[search]=${encodeURIComponent(q)}&page[size]=12`;
      try {
        const data = await fetchJsonHttps(apiUrl, token);
        return sendJson(res, 200, data);
      } catch (err) {
        return sendJson(res, 502, { error: err.message });
      }
    }

    // 6. BattleMetrics Server Detail + Auto Map Image Extraction
    if (pathname.startsWith('/api/battlemetrics/server/') && req.method === 'GET') {
      const serverId = pathname.split('/').pop();
      const token = req.headers['authorization']?.replace('Bearer ', '') || '';
      if (!serverId || !/^\d+$/.test(serverId)) {
        return sendJson(res, 400, { error: 'Invalid BattleMetrics Server ID' });
      }
      const now = new Date();
      const start = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
      const stop = now.toISOString();

      const detailUrl = `https://api.battlemetrics.com/servers/${serverId}?include=player`;
      const historyUrl = `https://api.battlemetrics.com/servers/${serverId}/player-count-history?start=${encodeURIComponent(start)}&stop=${encodeURIComponent(stop)}&resolution=60`;

      try {
        const [detail, history] = await Promise.all([
          fetchJsonHttps(detailUrl, token),
          fetchJsonHttps(historyUrl, token).catch(() => ({ data: [] }))
        ]);
        return sendJson(res, 200, { server: detail, history: history.data || [] });
      } catch (err) {
        return sendJson(res, 502, { error: err.message });
      }
    }

    // 6B. RustMaps URL Analyzer (extracts seed, size, map image & all monument coordinates)
    if (pathname === '/api/rustmaps/analyze' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const rawInput = String(body.url || '').trim();
      if (!rawInput) {
        return sendJson(res, 400, { error: 'Please paste a RustMaps.com URL, BattleMetrics server URL, or size_seed (e.g. 4250_1337420).' });
      }

      try {
        let rustmapsUrl = '';
        const rmMatch = rawInput.match(/https?:\/\/(?:www\.)?rustmaps\.com\/map\/([a-zA-Z0-9_-]+)/i);
        const bmMatch = rawInput.match(/battlemetrics\.com\/servers\/rust\/(\d+)/i);
        const seedSizeMatch = rawInput.match(/^(\d{4})[_\s/:]+(-?\d+)$/);

        if (rmMatch) {
          rustmapsUrl = `https://rustmaps.com/map/${rmMatch[1]}`;
        } else if (seedSizeMatch) {
          rustmapsUrl = `https://rustmaps.com/map/${seedSizeMatch[1]}_${seedSizeMatch[2]}`;
        } else if (bmMatch || /^\d{5,}$/.test(rawInput)) {
          const bmId = bmMatch ? bmMatch[1] : rawInput;
          const token = req.headers['authorization']?.replace('Bearer ', '') || '';
          const bmData = await fetchJsonHttps(`https://api.battlemetrics.com/servers/${bmId}`, token);
          const details = bmData?.data?.attributes?.details || {};
          const rmDirect = details.rust_maps?.url;
          if (rmDirect && rmDirect.includes('rustmaps.com/map/')) {
            rustmapsUrl = rmDirect;
          } else if (details.rust_world_size && details.rust_world_seed !== undefined) {
            rustmapsUrl = `https://rustmaps.com/map/${details.rust_world_size}_${details.rust_world_seed}`;
          } else {
            return sendJson(res, 404, { error: 'This BattleMetrics server does not publish its RustMaps seed/size.' });
          }
        } else {
          return sendJson(res, 400, {
            error: 'Unrecognized URL. Paste a RustMaps link like https://rustmaps.com/map/4250_1337420 or a BattleMetrics server link.'
          });
        }

        const html = await fetchTextHttps(rustmapsUrl);
        const mapData = parseRustMapsFromHtml(html);
        if (!mapData) {
          return sendJson(res, 502, {
            error: 'Could not extract monument data from RustMaps. Make sure the map exists on rustmaps.com and is finished generating.'
          });
        }

        return sendJson(res, 200, {
          ok: true,
          rustmapsUrl,
          id: mapData.id,
          seed: mapData.seed,
          size: mapData.size,
          imageUrl: mapData.imageUrl || '',
          imageIconUrl: mapData.imageIconUrl || '',
          biomePercentages: mapData.biomePercentages || {},
          heatMaps: (Array.isArray(mapData.heatMaps) ? mapData.heatMaps : []).reduce((acc, h) => {
            if (h?.name && h?.url) {
              acc[h.name] = h.url.endsWith('/') ? `${h.url}0/0/0.png` : `${h.url}/0/0/0.png`;
            }
            return acc;
          }, {}),
          monuments: (mapData.monuments || []).map((m) => {
            let hasRedKeycard = null;
            if (typeof m.hasRedKeycard === 'boolean') hasRedKeycard = m.hasRedKeycard;
            else if (typeof m.redKeycard === 'boolean') hasRedKeycard = m.redKeycard;
            else if (Array.isArray(m.modules)) {
              hasRedKeycard = m.modules.some((mod) => String(mod?.name || mod || '').toLowerCase().includes('red'));
            }
            return {
              type: m.type || '',
              nameOverride: m.nameOverride || '',
              hasRedKeycard,
              x: Number(m.coordinates?.x || 0),
              y: Number(m.coordinates?.y || 0)
            };
          })
        });
      } catch (err) {
        return sendJson(res, 502, { error: `Failed to analyze RustMaps URL: ${err.message}` });
      }
    }

    // 6C. Safe Image Proxy for RustMaps CDN (prevents CORS taint on canvas)
    if (pathname === '/api/rustmaps/image' && req.method === 'GET') {
      const target = parsedUrl.searchParams.get('url') || '';
      try {
        const u = new URL(target);
        if (u.protocol !== 'https:' || !u.hostname.endsWith('rustmaps.com')) {
          return sendJson(res, 403, { error: 'Only rustmaps.com image URLs are allowed' });
        }
        const imgReq = https.request(
          {
            hostname: u.hostname,
            path: u.pathname + u.search,
            method: 'GET',
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 12000
          },
          (imgRes) => {
            res.writeHead(imgRes.statusCode || 200, {
              'Content-Type': imgRes.headers['content-type'] || 'image/png',
              'Cache-Control': 'public, max-age=3600'
            });
            imgRes.pipe(res);
          }
        );
        imgReq.on('error', (err) => sendJson(res, 502, { error: err.message }));
        imgReq.end();
        return;
      } catch (_) {
        return sendJson(res, 400, { error: 'Invalid image URL' });
      }
    }

    // 7. Discord Webhook Notification Endpoint
    if (pathname === '/api/discord' && req.method === 'POST') {
      if (!checkPin(req, res)) return;
      const body = await readJsonBody(req);
      try {
        await sendDiscordWebhook(body.webhookUrl, body.title, body.description, body.color);
        return sendJson(res, 200, { ok: true });
      } catch (err) {
        return sendJson(res, 400, { error: err.message });
      }
    }

    // 8. Static File Serving from /public
    let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    if (safePath === '/' || safePath === '\\') {
      safePath = '/index.html';
    }
    const filePath = path.join(PUBLIC_DIR, safePath);

    if (filePath.startsWith(PUBLIC_DIR) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    } else {
      const indexFile = path.join(PUBLIC_DIR, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(indexFile).pipe(res);
      } else {
        sendJson(res, 404, { error: 'Not Found' });
      }
    }
  } catch (err) {
    console.error('[Server Error]', err);
    sendJson(res, 500, { error: 'Internal Server Error', details: err.message });
  }
});

setInterval(() => {
  for (const res of sseClients) {
    try {
      res.write(': heartbeat\n\n');
    } catch (_) {
      sseClients.delete(res);
    }
  }
}, 25000);

server.listen(PORT, HOST, () => {
  console.log('==========================================================');
  console.log('  RUST TACTICAL COMPANION — ONLINE');
  console.log(`  Listening on: http://${HOST}:${PORT}`);
  console.log(`  Squad State : ${STATE_FILE}`);
  console.log('==========================================================');
});
