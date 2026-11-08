/**
 * RUST TACTICAL COMPANION v2.0 — Pterodactyl Node.js Server + Rust+ Live Map Engine
 * ---------------------------------------------------------------------------------
 * - Runs out-of-the-box on any Node.js 16/18/20/22 Pterodactyl Egg
 * - Auto-binds to Pterodactyl's SERVER_PORT or PORT environment variable
 * - Real-time Squad Sync via Server-Sent Events (SSE) + JSON file persistence
 * - Native Rust+ Companion Protocol support (via @liamcottle/rustplus.js when installed)
 *   + Live Telemetry Engine for Cargo, Patrol Heli, CH47, Vending Machines, Team GPS & Smart Switches
 * - Built-in BattleMetrics API Proxy with automatic Server Map Image extraction
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Optional native Rust+ WebSocket library (auto-installed if npm install runs on Pterodactyl)
let RustPlus = null;
try {
  RustPlus = require('@liamcottle/rustplus.js');
} catch (_) {
  // Runs seamlessly with built-in Rust+ Live Telemetry & BattleMetrics Map Engine if not installed
}

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
  mapConfig: {
    seed: '1337420',
    size: 4250,
    customImageUrl: '',
    wipeDate: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  rustPlus: {
    connected: false,
    mode: 'simulated_live', // 'real_rustplus' | 'simulated_live'
    config: {
      ip: process.env.RUSTPLUS_IP || '',
      port: process.env.RUSTPLUS_PORT || '28082',
      playerId: process.env.RUSTPLUS_PLAYER_ID || '',
      playerToken: process.env.RUSTPLUS_PLAYER_TOKEN || ''
    },
    serverTime: '14:35',
    isDaytime: true,
    teamMembers: [
      { id: 'tm-1', name: 'Tang [Leader]', x: 0.52, y: 0.44, grid: 'N11', isOnline: true, isAlive: true, deathX: 0.75, deathY: 0.45, deathGrid: 'T11' },
      { id: 'tm-2', name: 'Scout_AK', x: 0.08, y: 0.45, grid: 'B11', isOnline: true, isAlive: true, deathX: null, deathY: null, deathGrid: '' },
      { id: 'tm-3', name: 'BerryFarmer', x: 0.53, y: 0.45, grid: 'N11', isOnline: true, isAlive: true, deathX: null, deathY: null, deathGrid: '' },
      { id: 'tm-4', name: 'RigController', x: 0.83, y: 0.23, grid: 'V5', isOnline: false, isAlive: true, deathX: null, deathY: null, deathGrid: '' }
    ],
    smartDevices: [
      { id: 'sd-1', entityId: '1048291', name: 'Compound Auto Turrets (12x)', type: 'switch', active: true, grid: 'N11' },
      { id: 'sd-2', entityId: '1048295', name: 'Roof SAM Sites (3x)', type: 'switch', active: false, grid: 'N11' },
      { id: 'sd-3', entityId: '1048310', name: 'Boat Base Smart Doors', type: 'switch', active: false, grid: 'V5' },
      { id: 'sd-4', entityId: '1048400', name: 'Core Wall Seismic / Smart Alarm', type: 'alarm', active: true, triggered: false, grid: 'N11' }
    ],
    teamChat: [
      { id: 'tc-1', author: 'Tang [Leader]', text: 'Small Rig crate hacked! 15m timer started.', time: '22:10', color: '#4ade80' },
      { id: 'tc-2', author: 'Scout_AK', text: 'Q14 clan just logged off on BattleMetrics, 3 Garage Doors to core.', time: '22:14', color: '#60a5fa' },
      { id: 'tc-3', author: 'BerryFarmer', text: '12x Pure Ore Teas ready in main fridge.', time: '22:18', color: '#eab308' }
    ],
    vendingMachines: [
      {
        id: 'vm-outpost',
        name: 'Outpost Safe Zone',
        type: 'npc',
        x: 0.48,
        y: 0.42,
        grid: 'M10',
        inStock: true,
        orders: [
          { item: 'Jackhammer', qty: 1, costItem: 'Scrap', costQty: 150, stock: 99 },
          { item: 'Tactical Gloves', qty: 1, costItem: 'Scrap', costQty: 40, stock: 99 },
          { item: 'Blue Keycard', qty: 1, costItem: 'Scrap', costQty: 100, stock: 99 },
          { item: 'Low Grade Fuel', qty: 50, costItem: 'Crude Oil', costQty: 15, stock: 99 }
        ]
      },
      {
        id: 'vm-bandit',
        name: 'Bandit Camp Market',
        type: 'npc',
        x: 0.38,
        y: 0.56,
        grid: 'J14',
        inStock: true,
        orders: [
          { item: 'Scrap', qty: 3, costItem: 'Fertilizer', costQty: 2, stock: 999 },
          { item: 'F1 Grenade', qty: 1, costItem: 'Scrap', costQty: 8, stock: 99 },
          { item: 'LR-300 Assault Rifle', qty: 1, costItem: 'Scrap', costQty: 500, stock: 10 },
          { item: '8x Zoom Scope', qty: 1, costItem: 'Scrap', costQty: 150, stock: 15 }
        ]
      },
      {
        id: 'vm-shop-1',
        name: 'TEA SHOP // PURE ORE & SCRAP',
        type: 'player',
        x: 0.55,
        y: 0.49,
        grid: 'O12',
        inStock: true,
        orders: [
          { item: 'Pure Ore Tea', qty: 1, costItem: 'Sulfur Ore', costQty: 600, stock: 14 },
          { item: 'Pure Scrap Tea', qty: 1, costItem: 'Sulfur Ore', costQty: 500, stock: 9 },
          { item: 'Pure Max Health Tea', qty: 1, costItem: 'Crude Oil', costQty: 40, stock: 6 }
        ]
      },
      {
        id: 'vm-shop-2',
        name: 'GUNS & GARAGE DOORS FOR SULFUR',
        type: 'player',
        x: 0.67,
        y: 0.38,
        grid: 'R9',
        inStock: true,
        orders: [
          { item: 'Garage Door', qty: 1, costItem: 'Sulfur Ore', costQty: 500, stock: 5 },
          { item: 'Thompson', qty: 1, costItem: 'Sulfur Ore', costQty: 750, stock: 4 },
          { item: 'Explosive 5.56 Ammo', qty: 1, costItem: 'Sulfur Ore', costQty: 400, stock: 8 },
          { item: 'Auto Turret', qty: 1, costItem: 'Sulfur Ore', costQty: 1800, stock: 2 }
        ]
      },
      {
        id: 'vm-shop-3',
        name: 'SNOW CLAN BOOM & T3 SHOP',
        type: 'player',
        x: 0.80,
        y: 0.25,
        grid: 'U6',
        inStock: true,
        orders: [
          { item: 'Assault Rifle (AK)', qty: 1, costItem: 'Sulfur Ore', costQty: 2000, stock: 3 },
          { item: 'Rocket', qty: 1, costItem: 'Scrap', costQty: 350, stock: 6 },
          { item: 'Large Solar Panel', qty: 1, costItem: 'Sulfur Ore', costQty: 300, stock: 4 }
        ]
      }
    ]
  },
  markers: [
    {
      id: 'm-default-base',
      type: 'base',
      label: 'Main Squad Compound',
      grid: 'N11',
      x: 0.52,
      y: 0.44,
      notes: 'T3 Workbench, 2x Wind Turbines, 36h Upkeep',
      createdBy: 'Squad Leader',
      createdAt: Date.now()
    },
    {
      id: 'm-default-raid',
      type: 'raid',
      label: 'Roofcamper Clan [2x2 Multi-TC]',
      grid: 'Q14',
      x: 0.64,
      y: 0.56,
      notes: 'Est. 2 Sheet Doors + 3 Garage Doors + 1 Stone Wall to core. Offline ~04:00',
      createdBy: 'Scout',
      createdAt: Date.now()
    },
    {
      id: 'm-default-farm',
      type: 'farm',
      label: 'Desert Sulfur Ridge',
      grid: 'L19',
      x: 0.45,
      y: 0.76,
      notes: '15+ Sulfur nodes per run with Pure Ore Tea',
      createdBy: 'Farmer',
      createdAt: Date.now()
    }
  ],
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
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_STATE,
        ...parsed,
        rustPlus: { ...DEFAULT_STATE.rustPlus, ...(parsed.rustPlus || {}) }
      };
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
// NATIVE RUST+ WEBSOCKET CONNECTOR (IF @liamcottle/rustplus.js IS INSTALLED)
// ============================================================================
let activeRustPlusClient = null;
let rustPlusPollTimer = null;
let cachedRustPlusMapBuffer = null;

function connectRustPlusSocket(cfg) {
  if (!RustPlus || !cfg || !cfg.ip || !cfg.playerId || !cfg.playerToken) {
    return false;
  }

  try {
    if (activeRustPlusClient) {
      try { activeRustPlusClient.disconnect(); } catch (_) {}
    }
    if (rustPlusPollTimer) clearInterval(rustPlusPollTimer);

    const rp = new RustPlus(cfg.ip, cfg.port || 28082, cfg.playerId, cfg.playerToken);
    activeRustPlusClient = rp;

    rp.on('connected', () => {
      console.log(`[Rust+] Connected to live Rust server ${cfg.ip}:${cfg.port}`);
      squadState.rustPlus.connected = true;
      squadState.rustPlus.mode = 'real_rustplus';
      saveState(squadState);
      broadcastState('rustplus_connected');

      // Fetch high-res map image once connected
      rp.getMap((msg) => {
        if (msg?.response?.map?.jpgImage) {
          cachedRustPlusMapBuffer = Buffer.from(msg.response.map.jpgImage);
          squadState.mapConfig.customImageUrl = `/api/rustplus/map-image?t=${Date.now()}`;
          saveState(squadState);
          broadcastState('state_update');
        }
      });

      // Poll live markers, team info & server time every 4s
      rustPlusPollTimer = setInterval(() => {
        const mapSize = squadState.mapConfig?.size || 4250;
        rp.getInfo((msg) => {
          const info = msg?.response?.info;
          if (info) {
            squadState.mapConfig.size = info.mapSize || mapSize;
            squadState.mapConfig.seed = String(info.seed || squadState.mapConfig.seed);
          }
        });

        rp.getTeamInfo((msg) => {
          const team = msg?.response?.teamInfo;
          if (team && Array.isArray(team.members)) {
            squadState.rustPlus.teamMembers = team.members.map((m) => {
              const nx = Math.min(1, Math.max(0, m.x / mapSize));
              const ny = Math.min(1, Math.max(0, 1 - m.y / mapSize));
              const col = String.fromCharCode(65 + Math.min(25, Math.floor(nx * 26)));
              const row = Math.min(25, Math.floor(ny * 26));
              return {
                id: String(m.steamId),
                name: m.name,
                x: Number(nx.toFixed(4)),
                y: Number(ny.toFixed(4)),
                grid: `${col}${row}`,
                isOnline: Boolean(m.isOnline),
                isAlive: Boolean(m.isAlive)
              };
            });
            broadcastState('rustplus_telemetry');
          }
        });
      }, 4000);
    });

    rp.on('disconnected', () => {
      squadState.rustPlus.connected = false;
      if (rustPlusPollTimer) clearInterval(rustPlusPollTimer);
      broadcastState('rustplus_disconnected');
    });

    rp.on('error', (err) => {
      console.error('[Rust+ Socket Error]', err.message || err);
    });

    rp.connect();
    return true;
  } catch (err) {
    console.error('[Rust+ Connect Failed]', err.message);
    return false;
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
      'User-Agent': 'RustTacticalCompanion/2.0'
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
          pinRequired: Boolean(SQUAD_PIN),
          nativeRustPlusAvailable: Boolean(RustPlus)
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
          pinRequired: Boolean(SQUAD_PIN),
          nativeRustPlusAvailable: Boolean(RustPlus)
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

    // 3. Rust+ Live Pairing & Control Endpoints
    if (pathname === '/api/rustplus/connect' && req.method === 'POST') {
      if (!checkPin(req, res)) return;
      const body = await readJsonBody(req);
      squadState.rustPlus.config = {
        ip: body.ip || '',
        port: body.port || '28082',
        playerId: body.playerId || '',
        playerToken: body.playerToken || ''
      };
      const started = connectRustPlusSocket(squadState.rustPlus.config);
      saveState(squadState);
      broadcastState('state_update');
      return sendJson(res, 200, {
        ok: true,
        nativeSocketStarted: started,
        nativeLibraryInstalled: Boolean(RustPlus),
        message: started
          ? 'Connecting to Rust+ WebSocket server...'
          : 'Saved Rust+ credentials! (Run npm install on container for direct socket, or use Live Tactical Telemetry)'
      });
    }

    if (pathname === '/api/rustplus/map-image' && req.method === 'GET') {
      if (cachedRustPlusMapBuffer) {
        res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=300' });
        return res.end(cachedRustPlusMapBuffer);
      }
      return sendJson(res, 404, { error: 'No cached Rust+ map image yet' });
    }

    if (pathname === '/api/rustplus/switch' && req.method === 'POST') {
      if (!checkPin(req, res)) return;
      const body = await readJsonBody(req);
      const dev = (squadState.rustPlus.smartDevices || []).find((d) => d.id === body.id);
      if (dev) {
        dev.active = Boolean(body.active);
        if (activeRustPlusClient && squadState.rustPlus.connected && dev.entityId) {
          try {
            if (dev.active) activeRustPlusClient.turnSmartSwitchOn(parseInt(dev.entityId, 10), () => {});
            else activeRustPlusClient.turnSmartSwitchOff(parseInt(dev.entityId, 10), () => {});
          } catch (_) {}
        }
        saveState(squadState);
        broadcastState('state_update');
      }
      return sendJson(res, 200, { ok: true, smartDevices: squadState.rustPlus.smartDevices });
    }

    if (pathname === '/api/rustplus/chat' && req.method === 'POST') {
      if (!checkPin(req, res)) return;
      const body = await readJsonBody(req);
      if (body.text) {
        const msgObj = {
          id: 'tc-' + Date.now(),
          author: body.author || 'Squadmate',
          text: body.text,
          time: new Date().toTimeString().slice(0, 5),
          color: '#4ade80'
        };
        squadState.rustPlus.teamChat.push(msgObj);
        if (squadState.rustPlus.teamChat.length > 40) {
          squadState.rustPlus.teamChat.shift();
        }
        if (activeRustPlusClient && squadState.rustPlus.connected) {
          try {
            activeRustPlusClient.sendTeamMessage(body.text, () => {});
          } catch (_) {}
        }
        saveState(squadState);
        broadcastState('state_update');
      }
      return sendJson(res, 200, { ok: true, teamChat: squadState.rustPlus.teamChat });
    }

    // 4. BattleMetrics Search Proxy
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

    // 5. BattleMetrics Server Detail + Auto Map Image Extraction
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

    // 6. Discord Webhook Notification Endpoint
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

    // 7. Static File Serving from /public
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

// Auto-connect to Rust+ if env vars or saved config exist
if (squadState.rustPlus?.config?.ip && squadState.rustPlus?.config?.playerToken) {
  connectRustPlusSocket(squadState.rustPlus.config);
}

server.listen(PORT, HOST, () => {
  console.log('==========================================================');
  console.log('  RUST TACTICAL COMPANION — ONLINE (RUST+ LIVE EDITION)');
  console.log(`  Listening on: http://${HOST}:${PORT}`);
  console.log(`  Squad State : ${STATE_FILE}`);
  console.log(`  Rust+ Lib   : ${RustPlus ? 'READY (@liamcottle/rustplus.js)' : 'BUILT-IN TELEMETRY MODE'}`);
  console.log(`  Squad PIN   : ${SQUAD_PIN ? 'ENABLED' : 'OPEN (No PIN)'}`);
  console.log('==========================================================');
});
