/**
 * RUST TACTICAL COMPANION v2.1 — Pterodactyl Node.js Server + Rust+ Desktop Auto-Pairing
 * --------------------------------------------------------------------------------------
 * - Zero-crash startup on any Node.js 16/18/20/22 Pterodactyl Egg
 * - Auto-binds to Pterodactyl's SERVER_PORT or PORT environment variable
 * - Built-in Rust+ Desktop Style Auto-Pairing (FCM Push Receiver + Facepunch Companion API)
 *   Catches "Pair with Server" & "Pair Smart Switch" clicks directly from inside Rust!
 * - Real-time Squad Sync via Server-Sent Events (SSE) + JSON file persistence
 * - Built-in BattleMetrics API Proxy + Discord Webhook notifications
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const { URL } = require('url');

let RustPlus = null;
let PushReceiver = null;

function loadRustPlusDependencies() {
  try {
    RustPlus = require('@liamcottle/rustplus.js');
  } catch (_) {}
  try {
    PushReceiver = require('@liamcottle/push-receiver');
  } catch (_) {}
}

loadRustPlusDependencies();

// Auto-install missing npm dependencies on Pterodactyl startup if AUTO_UPDATE pulled new package.json
if ((!RustPlus || !PushReceiver) && fs.existsSync(path.join(__dirname, 'package.json'))) {
  try {
    console.log('[Startup] Installing @liamcottle/rustplus.js and @liamcottle/push-receiver...');
    execSync('npm install --production --no-audit --no-fund', {
      cwd: __dirname,
      stdio: 'inherit',
      timeout: 120000
    });
    loadRustPlusDependencies();
  } catch (err) {
    console.warn('[Startup] Auto npm install skipped or failed:', err.message);
  }
}

const PORT = parseInt(process.env.SERVER_PORT || process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const SQUAD_PIN = process.env.SQUAD_PIN || '';
const BM_TOKEN = process.env.BATTLEMETRICS_TOKEN || '';

// Facepunch Official Rust+ Firebase Sender ID
const FACEPUNCH_GCM_SENDER_ID = '976529667804';

const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'squad-state.json');
const FCM_FILE = path.join(DATA_DIR, 'fcm-credentials.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_STATE = {
  squadName: 'RUST SQUAD ALPHA',
  mapConfig: {
    seed: '1337420',
    size: 3500,
    customImageUrl: '',
    wipeDate: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  rustPlus: {
    connected: false,
    fcmListening: false,
    mode: 'simulated_live',
    authToken: '',
    steamId: '',
    lastHistoryNotificationId: 0,
    pairedServers: [],
    config: {
      serverName: "[EU] Willjum's Casual Solo/Duo Monthly",
      ip: process.env.RUSTPLUS_IP || '185.83.154.88',
      port: process.env.RUSTPLUS_PORT || '28017',
      playerId: process.env.RUSTPLUS_PLAYER_ID || '76561198025882443',
      playerToken: process.env.RUSTPLUS_PLAYER_TOKEN || ''
    },
    serverTime: '14:39',
    isDaytime: true,
    liveMarkers: [],
    teamMembers: [
      { id: '76561198025882443', name: 'Smiguel', x: 0.2261, y: 0.6572, grid: 'S6', isOnline: true, isAlive: true, deathX: null, deathY: null, deathGrid: '' },
      { id: '76561198122964735', name: 'Kanki', x: 0.2258, y: 0.6552, grid: 'S6', isOnline: true, isAlive: true, deathX: null, deathY: null, deathGrid: '' }
    ],
    smartDevices: [
      { id: 'sd-16114601', entityId: '16114601', name: 'Smart Alarm', type: 'alarm', active: true, triggered: false, grid: 'S6' },
      { id: 'sd-1', entityId: '1048291', name: 'Compound Auto Turrets (12x)', type: 'switch', active: true, grid: 'S6' },
      { id: 'sd-2', entityId: '1048295', name: 'Roof SAM Sites (3x)', type: 'switch', active: false, grid: 'S6' }
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
          { item: 'LR-300 Assault Rifle', qty: 1, costItem: 'Scrap', costQty: 500, stock: 10 }
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

function normalizedToGrid(nx, ny) {
  const col = Math.min(25, Math.max(0, Math.floor(nx * 26)));
  const row = Math.min(25, Math.max(0, Math.floor(ny * 26)));
  return `${String.fromCharCode(65 + col)}${row}`;
}

// ============================================================================
// NATIVE RUST+ WEBSOCKET CONNECTOR (WITH AUTO FACEPUNCH PROXY FALLBACK)
// ============================================================================
let activeRustPlusClient = null;
let rustPlusPollTimer = null;
let cachedRustPlusMapBuffer = null;

function connectRustPlusSocket(cfg, triedProxyFallback = false) {
  if (!RustPlus || !cfg || !cfg.ip || !cfg.playerId || !cfg.playerToken) {
    return false;
  }

  try {
    if (activeRustPlusClient) {
      try { activeRustPlusClient.disconnect(); } catch (_) {}
    }
    if (rustPlusPollTimer) clearInterval(rustPlusPollTimer);

    const useProxy = Boolean(cfg.useFacepunchProxy);
    const rp = new RustPlus(
      cfg.ip,
      cfg.port || 28082,
      cfg.playerId,
      cfg.playerToken,
      useProxy
    );
    activeRustPlusClient = rp;

    let didConnect = false;
    const fallbackTimeout = setTimeout(() => {
      if (!didConnect && !triedProxyFallback) {
        console.log(`[Rust+] Direct connection to ${cfg.ip}:${cfg.port} timed out; auto-retrying via Facepunch Proxy...`);
        cfg.useFacepunchProxy = !useProxy;
        connectRustPlusSocket(cfg, true);
      }
    }, 6500);

    rp.on('connected', () => {
      didConnect = true;
      clearTimeout(fallbackTimeout);
      console.log(`[Rust+] Connected to live Rust server ${cfg.ip}:${cfg.port} (proxy=${useProxy})`);
      squadState.rustPlus.connected = true;
      squadState.rustPlus.mode = 'real_rustplus';
      saveState(squadState);
      broadcastState('rustplus_connected');

      // 1. Fetch high-res map image & monuments once connected
      rp.getMap((msg) => {
        const mapData = msg?.response?.map;
        if (mapData?.jpgImage) {
          cachedRustPlusMapBuffer = Buffer.from(mapData.jpgImage);
          squadState.mapConfig.customImageUrl = `/api/rustplus/map-image?t=${Date.now()}`;
          saveState(squadState);
          broadcastState('state_update');
        }
      });

      // 2. Poll live markers, team info & server time every 4s
      const pollTelemetry = () => {
        const mapSize = squadState.mapConfig?.size || 3500;

        rp.getInfo((msg) => {
          const info = msg?.response?.info;
          if (info) {
            squadState.mapConfig.size = info.mapSize || mapSize;
            squadState.mapConfig.seed = String(info.seed || squadState.mapConfig.seed);
            if (info.name) squadState.rustPlus.config.serverName = info.name;
            if (info.players !== undefined && info.maxPlayers !== undefined) {
              squadState.rustPlus.playersOnline = `${info.players}/${info.maxPlayers}`;
            }
          }
        });

        rp.getTime?.((msg) => {
          const timeObj = msg?.response?.time;
          if (timeObj && typeof timeObj.time === 'number') {
            const hrs = Math.floor(timeObj.time);
            const mins = Math.floor((timeObj.time - hrs) * 60);
            squadState.rustPlus.serverTime = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
            squadState.rustPlus.isDaytime = hrs >= 7 && hrs < 19;
          }
        });

        rp.getTeamInfo((msg) => {
          const team = msg?.response?.teamInfo;
          if (team && Array.isArray(team.members)) {
            squadState.rustPlus.teamMembers = team.members.map((m) => {
              const nx = Math.min(1, Math.max(0, m.x / mapSize));
              const ny = Math.min(1, Math.max(0, 1 - m.y / mapSize));
              return {
                id: String(m.steamId),
                steamId: String(m.steamId),
                name: m.name,
                wx: m.x,
                wy: m.y,
                x: Number(nx.toFixed(4)),
                y: Number(ny.toFixed(4)),
                grid: normalizedToGrid(nx, ny),
                isOnline: Boolean(m.isOnline),
                isAlive: Boolean(m.isAlive)
              };
            });
            broadcastState('rustplus_telemetry');
          }
        });

        rp.getMapMarkers((msg) => {
          const markers = msg?.response?.mapMarkers?.markers;
          if (Array.isArray(markers)) {
            const liveVms = [];
            const liveEvts = [];
            markers.forEach((mk) => {
              const nx = Math.min(1, Math.max(0, mk.x / mapSize));
              const ny = Math.min(1, Math.max(0, 1 - mk.y / mapSize));
              const grid = normalizedToGrid(nx, ny);
              if (mk.type === 3 && Array.isArray(mk.sellOrders) && mk.sellOrders.length > 0) {
                liveVms.push({
                  id: `vm-${mk.id}`,
                  name: mk.name || `Vending Shop [${grid}]`,
                  type: 'player',
                  x: Number(nx.toFixed(4)),
                  y: Number(ny.toFixed(4)),
                  grid,
                  inStock: true,
                  orders: mk.sellOrders.slice(0, 8).map((so) => ({
                    item: `Item #${so.itemId}`,
                    qty: so.quantity || 1,
                    costItem: `Item #${so.currencyId}`,
                    costQty: so.costPerItem || 1,
                    stock: so.amountInStock || 0
                  }))
                });
              } else if ([2, 4, 5, 6, 8].includes(mk.type)) {
                liveEvts.push({
                  id: mk.id,
                  type: mk.type,
                  x: Number(nx.toFixed(4)),
                  y: Number(ny.toFixed(4)),
                  grid
                });
              }
            });
            if (liveVms.length > 0) squadState.rustPlus.vendingMachines = liveVms;
            squadState.rustPlus.liveMarkers = liveEvts;
          }
        });
      };

      pollTelemetry();
      rustPlusPollTimer = setInterval(pollTelemetry, 4000);
    });

    rp.on('message', (msg) => {
      const tmMsg = msg?.broadcast?.teamMessage?.message;
      if (tmMsg) {
        squadState.rustPlus.teamChat.push({
          id: 'tc-' + Date.now(),
          author: tmMsg.name || 'Teammate',
          text: tmMsg.message || '',
          time: new Date().toTimeString().slice(0, 5),
          color: '#4ade80'
        });
        if (squadState.rustPlus.teamChat.length > 40) squadState.rustPlus.teamChat.shift();
        saveState(squadState);
        broadcastState('state_update');
      }

      const entChanged = msg?.broadcast?.entityChanged;
      if (entChanged) {
        const dev = (squadState.rustPlus.smartDevices || []).find(
          (d) => String(d.entityId) === String(entChanged.entityId)
        );
        if (dev) {
          dev.active = Boolean(entChanged.payload?.value);
          saveState(squadState);
          broadcastState('state_update');
        }
      }
    });

    rp.on('disconnected', () => {
      clearTimeout(fallbackTimeout);
      squadState.rustPlus.connected = false;
      if (rustPlusPollTimer) clearInterval(rustPlusPollTimer);
      broadcastState('rustplus_disconnected');
    });

    rp.on('error', (err) => {
      console.error('[Rust+ Socket Error]', err.message || err);
      if (!didConnect && !triedProxyFallback) {
        clearTimeout(fallbackTimeout);
        cfg.useFacepunchProxy = !useProxy;
        connectRustPlusSocket(cfg, true);
      }
    });

    rp.connect();
    return true;
  } catch (err) {
    console.error('[Rust+ Connect Failed]', err.message);
    return false;
  }
}

// ============================================================================
// OVERHAULED RUST+ PAIRING ENGINE v3.0:
// 1. Facepunch Code Exchange (/login/exchange) + 1-Click Popup Trampoline
// 2. Instant & Continuous Facepunch Cloud History Sync (/api/history/read)
// 3. 2026 Native 4-Step Android Firebase (FIS_v2) + C2DM + Expo Registration
// ============================================================================
let fcmClient = null;
let historySyncTimer = null;

function postJsonHttps(urlStr, bodyObj, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const payload = JSON.stringify(bodyObj);
    const req = https.request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'User-Agent': 'okhttp/4.9.2',
          ...headers
        },
        timeout: 12000
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            const json = data ? JSON.parse(data) : {};
            if (res.statusCode >= 200 && res.statusCode < 300) resolve(json);
            else reject(new Error(json?.error || `HTTP ${res.statusCode}: ${data.slice(0, 140)}`));
          } catch (_) {
            if (res.statusCode >= 200 && res.statusCode < 300) resolve({ raw: data });
            else reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 140)}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function postFormHttps(urlStr, formParams, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const payload = new URLSearchParams(formParams).toString();
    const req = https.request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(payload),
          'User-Agent': 'okhttp/4.9.2',
          ...headers
        },
        timeout: 12000
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(data);
          else reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 140)}`));
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function exchangeCodeForToken(code) {
  const res = await postJsonHttps('https://companion-rust.facepunch.com/login/exchange', {
    code: String(code).trim()
  });
  const token = res?.token || res?.Token || res?.auth_token || res?.rustplus_auth_token || '';
  const steamId = String(res?.steamId || res?.SteamId || res?.steam_id || '');
  if (!token) {
    throw new Error('Facepunch /login/exchange did not return a valid token.');
  }
  return { token, steamId };
}

async function resolveFacepunchAuth(rawInput) {
  const str = String(rawInput || '').trim();
  if (!str) return null;

  // 1. JSON object (rustplusjs-config.json, {"code":"..."}, or {"Token":"..."})
  try {
    const j = JSON.parse(str);
    if (j.fcm_credentials && j.fcm_credentials.gcm && j.fcm_credentials.fcm) {
      return {
        fcmCredentials: j.fcm_credentials,
        expoPushToken: j.expo_push_token || '',
        token: j.rustplus_auth_token || j.Token || j.token || '',
        steamId: String(j.steam_id || j.SteamId || j.steamId || '')
      };
    }
    if (j.Token || j.token || j.rustplus_auth_token || j.AuthToken) {
      return {
        token: j.Token || j.token || j.rustplus_auth_token || j.AuthToken,
        steamId: String(j.SteamId || j.steamId || j.steam_id || '')
      };
    }
    if (j.code || j.Code) {
      return await exchangeCodeForToken(j.code || j.Code);
    }
  } catch (_) {}

  // 2. URL or query/hash string containing ?code=..., #code=..., or ?token=...
  const codeMatch = str.match(/[?#&]code=([^&#\s"']+)/i);
  if (codeMatch && codeMatch[1]) {
    const decodedCode = decodeURIComponent(codeMatch[1]);
    return await exchangeCodeForToken(decodedCode);
  }
  const urlTokenMatch = str.match(/[?#&](?:token|auth_token)=([^&#\s"']+)/i);
  const urlSteamMatch = str.match(/[?#&](?:steamId|steam_id)=(\d+)/i);
  if (urlTokenMatch && urlTokenMatch[1]) {
    return {
      token: decodeURIComponent(urlTokenMatch[1]),
      steamId: urlSteamMatch ? urlSteamMatch[1] : ''
    };
  }

  // 3. Extracted from HTML DOM / page source
  const tokenMatch = str.match(/["'](?:Token|rustplus_auth_token)["']\s*:\s*["']([^"']+)["']/i);
  const steamMatch = str.match(/["'](?:SteamId|steam_id)["']\s*:\s*["']?(\d+)["']?/i);
  if (tokenMatch) {
    return { token: tokenMatch[1], steamId: steamMatch ? steamMatch[1] : '' };
  }

  // 4. Raw JWT / token or short exchange code
  if (!str.includes(' ') && !str.includes('<html')) {
    if (str.length > 45 && str.includes('.')) {
      return { token: str, steamId: '' };
    }
    if (str.length >= 12 && str.length <= 90) {
      try {
        return await exchangeCodeForToken(str);
      } catch (_) {
        return { token: str, steamId: '' };
      }
    }
  }

  return null;
}

function applyIncomingPairingPayload(body, notificationId = 0) {
  if (!body || typeof body !== 'object') return { serverPaired: null, entityPaired: null };
  let serverPaired = null;
  let entityPaired = null;

  if (body.ip && body.playerToken) {
    const srvObj = {
      id: body.id || `${body.ip}:${body.port || '28082'}`,
      serverName: body.name || `${body.ip}:${body.port || '28082'}`,
      ip: String(body.ip),
      port: String(body.port || '28082'),
      playerId: String(body.playerId || squadState.rustPlus.steamId || ''),
      playerToken: String(body.playerToken),
      img: body.img || '',
      desc: body.desc || '',
      pairedAt: Date.now()
    };

    if (!Array.isArray(squadState.rustPlus.pairedServers)) {
      squadState.rustPlus.pairedServers = [];
    }
    const existingIdx = squadState.rustPlus.pairedServers.findIndex(
      (s) => s.ip === srvObj.ip && String(s.port) === String(srvObj.port)
    );
    if (existingIdx >= 0) {
      squadState.rustPlus.pairedServers[existingIdx] = srvObj;
    } else {
      squadState.rustPlus.pairedServers.unshift(srvObj);
    }

    if (body.type === 'server' || !squadState.rustPlus.config?.playerToken) {
      squadState.rustPlus.config = {
        serverName: srvObj.serverName,
        ip: srvObj.ip,
        port: srvObj.port,
        playerId: srvObj.playerId,
        playerToken: srvObj.playerToken
      };
      serverPaired = srvObj;
    }
  }

  if (body.entityId) {
    const entityIdStr = String(body.entityId);
    const devType = String(body.entityType) === '2' ? 'alarm' : String(body.entityType) === '3' ? 'monitor' : 'switch';
    const devName =
      body.entityName ||
      (devType === 'alarm' ? `Smart Alarm #${entityIdStr}` : `Smart Switch #${entityIdStr}`);

    if (!Array.isArray(squadState.rustPlus.smartDevices)) {
      squadState.rustPlus.smartDevices = [];
    }
    const existing = squadState.rustPlus.smartDevices.find(
      (d) => String(d.entityId) === entityIdStr
    );
    if (!existing) {
      squadState.rustPlus.smartDevices.unshift({
        id: 'sd-' + entityIdStr,
        entityId: entityIdStr,
        name: devName,
        type: devType === 'alarm' ? 'alarm' : 'switch',
        active: false,
        grid: 'PAIRED'
      });
      entityPaired = { entityId: entityIdStr, name: devName, type: devType };
    }
  }

  if (notificationId && notificationId > (squadState.rustPlus.lastHistoryNotificationId || 0)) {
    squadState.rustPlus.lastHistoryNotificationId = notificationId;
  }

  return { serverPaired, entityPaired };
}

/**
 * Syncs all paired servers and Smart Switches/Alarms directly from Facepunch's
 * official cloud notification history: POST https://companion-rust.facepunch.com/api/history/read
 */
async function syncPairingsFromFacepunchHistory(authToken, isBackgroundPoll = false) {
  const token = authToken || squadState.rustPlus.authToken;
  if (!token) return { serversFound: 0, devicesFound: 0 };

  const res = await postJsonHttps(
    'https://companion-rust.facepunch.com/api/history/read',
    { AuthToken: token },
    { Authorization: `Bearer ${token}` }
  );

  const notifications = Array.isArray(res?.notifications)
    ? res.notifications
    : Array.isArray(res?.messages)
      ? res.messages
      : [];

  // Process oldest to newest so the newest server becomes the active one
  const sorted = [...notifications].sort((a, b) => (a.notificationId || 0) - (b.notificationId || 0));
  const prevMaxId = squadState.rustPlus.lastHistoryNotificationId || 0;

  let serversFound = 0;
  let devicesFound = 0;
  let newestServer = null;
  let newestEntity = null;

  for (const item of sorted) {
    const nid = Number(item.notificationId || 0);
    if (isBackgroundPoll && prevMaxId > 0 && nid <= prevMaxId) {
      continue;
    }
    const rawData = item.data || item.body;
    if (!rawData) continue;
    try {
      const parsed = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      const { serverPaired, entityPaired } = applyIncomingPairingPayload(parsed, nid);
      if (serverPaired) {
        serversFound++;
        newestServer = serverPaired;
      }
      if (entityPaired) {
        devicesFound++;
        newestEntity = entityPaired;
      }
    } catch (_) {}
  }

  if (serversFound > 0 || devicesFound > 0 || !isBackgroundPoll) {
    squadState.rustPlus.fcmListening = true;
    saveState(squadState);
    if (newestServer) {
      connectRustPlusSocket(squadState.rustPlus.config);
      if (isBackgroundPoll) {
        broadcastState('rustplus_paired_server', { pairedServer: newestServer });
      }
    }
    if (newestEntity && isBackgroundPoll) {
      broadcastState('rustplus_paired_entity', { pairedEntity: newestEntity });
    }
    if (!isBackgroundPoll) {
      broadcastState('state_update');
    }
  }

  return {
    serversFound,
    devicesFound,
    totalHistoryItems: notifications.length,
    activeServer: squadState.rustPlus.config
  };
}

function startHistorySyncPoller(authToken) {
  if (authToken) {
    squadState.rustPlus.authToken = authToken;
  }
  if (historySyncTimer) clearInterval(historySyncTimer);
  squadState.rustPlus.fcmListening = true;
  historySyncTimer = setInterval(() => {
    if (squadState.rustPlus.authToken) {
      syncPairingsFromFacepunchHistory(squadState.rustPlus.authToken, true).catch(() => {});
    }
  }, 6000);
}

function handleIncomingFcmNotification(notification) {
  try {
    const data = notification?.notification?.data || notification?.data;
    if (!data || !data.body) return;
    const body = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
    console.log('[Rust+ FCM Push Received]', body.type, body.name || body.entityName || '');

    const { serverPaired, entityPaired } = applyIncomingPairingPayload(body);
    saveState(squadState);
    if (serverPaired) {
      connectRustPlusSocket(squadState.rustPlus.config);
      broadcastState('rustplus_paired_server', { pairedServer: serverPaired });
    }
    if (entityPaired) {
      broadcastState('rustplus_paired_entity', { pairedEntity: entityPaired });
    }
  } catch (err) {
    console.error('[Rust+ FCM Parse Error]', err.message);
  }
}

async function startFcmPairingListener(credentials) {
  if (!credentials) return false;
  if (credentials.authToken || credentials.rustplus_auth_token) {
    startHistorySyncPoller(credentials.authToken || credentials.rustplus_auth_token);
  }
  if (!PushReceiver || !credentials.gcm || !credentials.fcm) {
    return Boolean(squadState.rustPlus.authToken);
  }
  try {
    if (fcmClient) {
      try { fcmClient.destroy?.(); } catch (_) {}
    }
    fcmClient = await PushReceiver.listen(credentials, handleIncomingFcmNotification);
    squadState.rustPlus.fcmListening = true;
    saveState(squadState);
    broadcastState('state_update');
    console.log('[Rust+ FCM] Live In-Game Pairing Listener + Cloud History Poller ACTIVE!');
    return true;
  } catch (err) {
    console.warn('[Rust+ FCM Socket Warning]', err.message);
    return Boolean(squadState.rustPlus.authToken);
  }
}

function generateFirebaseFid() {
  const bytes = crypto.randomBytes(17);
  bytes[0] = 0b01110000 | (bytes[0] & 0b00001111);
  return bytes.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '').slice(0, 22);
}

/**
 * 2026 Native 4-Step Android Firebase (FIS_v2) + C2DM + Expo Registration
 * Plus immediate & continuous Facepunch Cloud History Sync (/api/history/read)!
 */
async function registerFacepunchFcm(authToken, steamId = '') {
  squadState.rustPlus.authToken = authToken;
  if (steamId) squadState.rustPlus.steamId = steamId;

  // 1. Immediately sync all existing paired servers & Smart Switches from Facepunch Cloud History!
  const historySyncResult = await syncPairingsFromFacepunchHistory(authToken, false).catch((err) => {
    console.warn('[Rust+ History Sync Warning]', err.message);
    return { serversFound: 0, devicesFound: 0 };
  });

  // 2. Start continuous 6s Cloud History Poller (catches in-game pairings over HTTPS Port 443!)
  startHistorySyncPoller(authToken);

  // 3. Also attempt 2026 Native 4-Step Android Firebase + Expo Push Registration in background
  try {
    const checkinRes = await postJsonHttps('https://android.clients.google.com/checkin', {
      checkin: {
        type: 3,
        chromeBuild: { platform: 2, chromeVersion: '63.0.3234.0', channel: 1 }
      },
      version: 3
    });
    const androidId = String(checkinRes.androidId || checkinRes.android_id || '');
    const securityToken = String(checkinRes.securityToken || checkinRes.security_token || '');

    if (androidId && securityToken) {
      const fid = generateFirebaseFid();
      const fisRes = await postJsonHttps(
        'https://firebaseinstallations.googleapis.com/v1/projects/rust-companion-app/installations',
        {
          fid,
          appId: '1:976529667804:android:d6f1ddeb4403b338fea619',
          authVersion: 'FIS_v2',
          sdkVersion: 'a:17.0.0'
        },
        {
          'x-goog-api-key': 'AIzaSyB5y2y-Tzqb4-I4Qnlsh_9naYv_TD8pCvY',
          'X-Android-Package': 'com.facepunch.rust.companion',
          'X-Android-Cert': 'E28D05345FB78A7A1A63D70F4A302DBF426CA5AD',
          'x-firebase-client': 'fire-abt/21.1.1 fire-installations/17.0.0 fire-android/ fire-core/20.3.1',
          'x-firebase-app-name-hash': 'R1dAH9Ui7M-ynoznwBdw01tLxhI'
        }
      );

      const fisToken = fisRes?.authToken?.token;
      if (fisToken) {
        const c2dmRaw = await postFormHttps(
          'https://android.clients.google.com/c2dm/register3',
          {
            'X-subtype': '976529667804',
            sender: '976529667804',
            'X-app_ver': '25',
            'X-osv': '29',
            'X-cliv': 'fiid-21.1.1',
            'X-gmsv': '220217001',
            'X-scope': '*',
            'X-Goog-Firebase-Installations-Auth': fisToken,
            'X-gms_app_id': '1:976529667804:android:d6f1ddeb4403b338fea619',
            'X-Firebase-Client': 'fire-abt/21.1.1 fire-installations/17.0.0 fire-android/ fire-core/20.3.1',
            'X-firebase-app-name-hash': 'R1dAH9Ui7M-ynoznwBdw01tLxhI',
            'X-Goog-Firebase-Installations-Auth-Version': 'FIS_v2',
            app: 'com.facepunch.rust.companion',
            device: androidId,
            cert: 'e28d05345fb78a7a1a63d70f4a302dbf426ca5ad',
            target_ver: '31'
          },
          { Authorization: `AidLogin ${androidId}:${securityToken}` }
        );

        const fcmToken = c2dmRaw.startsWith('token=') ? c2dmRaw.replace('token=', '').trim() : '';
        if (fcmToken) {
          const deviceId = crypto.randomUUID ? crypto.randomUUID() : 'rustplus-' + Date.now();
          const expoRes = await postJsonHttps('https://exp.host/--/api/v2/push/getExpoPushToken', {
            type: 'fcm',
            deviceId,
            development: false,
            appId: 'com.facepunch.rust.companion',
            deviceToken: fcmToken,
            projectId: '49451aca-a822-41e6-ad59-955718d0ff9c'
          });

          const expoPushToken = expoRes?.data?.expoPushToken;
          if (expoPushToken) {
            await postJsonHttps(
              'https://companion-rust.facepunch.com/api/push/register',
              {
                AuthToken: authToken,
                DeviceId: deviceId,
                PushKind: 3,
                PushToken: expoPushToken
              },
              { Authorization: `Bearer ${authToken}` }
            );
          }
        }
      }
    }
  } catch (fcmErr) {
    console.log('[Rust+ Push Registration Note] Using Facepunch Cloud History Poller:', fcmErr.message);
  }

  fs.writeFileSync(
    FCM_FILE,
    JSON.stringify({ authToken, steamId, updatedAt: Date.now() }, null, 2),
    'utf8'
  );
  saveState(squadState);
  broadcastState('state_update');
  return historySyncResult;
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

    // 3A. 1-Click Steam Popup OAuth Redirect -> Facepunch Companion Login
    if (pathname === '/api/rustplus/login' && req.method === 'GET') {
      const proto = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;
      const callbackUrl = `${proto}://${host}/api/rustplus/callback`;
      const targetUrl = `https://companion-rust.facepunch.com/login?returnUrl=${encodeURIComponent(callbackUrl)}`;
      res.writeHead(302, { Location: targetUrl });
      return res.end();
    }

    // 3B. Facepunch Companion Login Callback Trampoline Page (reads ?code=... and #code=... hash fragment)
    if (pathname === '/api/rustplus/callback' && req.method === 'GET') {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Rust+ Companion Pairing</title>
  <style>
    body { background: #0f172a; color: #f8fafc; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 28px 32px; max-width: 460px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    h2 { margin: 0 0 10px; color: #4ade80; font-size: 20px; }
    p { margin: 0 0 16px; color: #94a3b8; font-size: 14px; line-height: 1.5; }
    .status { font-family: monospace; font-size: 12px; color: #38bdf8; word-break: break-all; padding: 10px; background: #090d16; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="card">
    <h2 id="title">Completing Rust+ Pairing...</h2>
    <p id="desc">Exchanging Facepunch token & syncing your paired servers and Smart Switches...</p>
    <div class="status" id="statusBox">Reading callback parameters...</div>
  </div>
  <script>
    (async function() {
      const statusBox = document.getElementById('statusBox');
      const titleEl = document.getElementById('title');
      const descEl = document.getElementById('desc');
      try {
        const payload = {
          fullUrl: window.location.href,
          search: window.location.search,
          hash: window.location.hash
        };
        statusBox.textContent = 'Registering with Facepunch Cloud & syncing servers...';
        const res = await fetch('/api/rustplus/callback/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || 'Failed to complete pairing');
        }
        titleEl.textContent = '✅ Rust+ Paired & Synced!';
        descEl.textContent = data.message || 'Your servers and Smart Switches are now active.';
        statusBox.textContent = 'Closing window...';
        if (window.opener) {
          window.opener.postMessage({ type: 'RUSTPLUS_AUTH_SUCCESS', data }, '*');
        }
        setTimeout(() => window.close(), 1200);
      } catch (err) {
        titleEl.style.color = '#f87171';
        titleEl.textContent = '⚠️ Automatic Callback Needs URL Copy';
        descEl.textContent = err.message;
        statusBox.textContent = window.location.href;
      }
    })();
  </script>
</body>
</html>`;
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }

    // 3C. Callback Submit & Rust+ Auto-Pairing (2026 OAuth Code Exchange + Cloud History Sync + FCM v1)
    if ((pathname === '/api/rustplus/callback/submit' || pathname === '/api/rustplus/fcm-register') && req.method === 'POST') {
      if (pathname === '/api/rustplus/fcm-register' && !checkPin(req, res)) return;
      const body = await readJsonBody(req);
      const rawCandidate = body.tokenInput || body.fullUrl || body.hash || body.search || body.code || body.token || '';

      // Check for direct fcm_credentials import from RustPlusDesk's rustplusjs-config.json
      const extractedSync = extractFacepunchToken(rawCandidate);
      const directFcm = body.fcmCredentials || extractedSync?.fcmCredentials;

      // Also resolve token or one-time OAuth code asynchronously
      const resolvedAuth = await resolveFacepunchAuth(rawCandidate).catch(() => null);
      const authToken = resolvedAuth?.token || extractedSync?.token || body.authToken || '';
      const steamId = resolvedAuth?.steamId || extractedSync?.steamId || body.steamId || '';

      if (directFcm && directFcm.gcm && directFcm.fcm) {
        try {
          fs.writeFileSync(FCM_FILE, JSON.stringify(directFcm, null, 2), 'utf8');
          const ok = await startFcmPairingListener(directFcm);
          let historyResult = { serversAdded: 0, devicesAdded: 0 };
          if (authToken) {
            squadState.rustPlus.authToken = authToken;
            if (steamId) squadState.rustPlus.steamId = steamId;
            startHistorySyncPoller(authToken);
            historyResult = await syncPairingsFromFacepunchHistory(authToken, false).catch(() => ({ serversAdded: 0, devicesAdded: 0 }));
          }
          saveState(squadState);
          broadcastState('state_update');
          return sendJson(res, 200, {
            ok: true,
            fcmActive: ok,
            pairedServers: squadState.rustPlus.pairedServers || [],
            message: `Imported Rust+ Desktop config! Live Listener active${historyResult.serversAdded ? ` + synced ${historyResult.serversAdded} server(s) from Facepunch Cloud` : ''}.`
          });
        } catch (err) {
          return sendJson(res, 500, { error: err.message });
        }
      }

      if (!authToken) {
        return sendJson(res, 400, {
          error:
            'Could not find a Facepunch Token or Login Code (?code=...). Click "1-Click Sign In with Steam (Auto-Pair Popup)", or after signing in on companion-rust.facepunch.com/login copy the URL from your browser address bar and paste it here, or upload %APPDATA%\\RustPlusDesk\\profiles.json / rustplusjs-config.json!'
        });
      }

      try {
        const regResult = await registerFacepunchFcm(authToken, steamId);
        const totalServers = (squadState.rustPlus.pairedServers || []).length;
        return sendJson(res, 200, {
          ok: true,
          ...regResult,
          pairedServers: squadState.rustPlus.pairedServers || [],
          message: `Rust+ Cloud Pairing Active! Synced ${totalServers} paired server(s) from Facepunch Cloud. Any new "Pair with Server" or Smart Switch click in-game will appear automatically!`
        });
      } catch (err) {
        return sendJson(res, 500, { error: err.message });
      }
    }

    // 3D. On-Demand Facepunch Cloud Notification History Sync (/api/history/read)
    if (pathname === '/api/rustplus/sync-history' && req.method === 'POST') {
      if (!checkPin(req, res)) return;
      const body = await readJsonBody(req);
      let tokenToUse = body.authToken || squadState.rustPlus.authToken || '';
      if (body.tokenInput) {
        const resolved = await resolveFacepunchAuth(body.tokenInput).catch(() => null);
        if (resolved?.token) tokenToUse = resolved.token;
      }
      if (!tokenToUse) {
        return sendJson(res, 400, {
          error: 'No Facepunch AuthToken saved yet. Please sign in via Step 1 or import your rustplusjs-config.json first.'
        });
      }
      squadState.rustPlus.authToken = tokenToUse;
      startHistorySyncPoller(tokenToUse);
      const syncStats = await syncPairingsFromFacepunchHistory(tokenToUse, false);
      if (!syncStats.ok) {
        return sendJson(res, 502, { error: syncStats.error || 'Failed to read Facepunch cloud history' });
      }
      saveState(squadState);
      broadcastState('state_update');
      return sendJson(res, 200, {
        ok: true,
        ...syncStats,
        pairedServers: squadState.rustPlus.pairedServers || [],
        activeConfig: squadState.rustPlus.config,
        message: `Synced Facepunch Cloud History (${syncStats.totalNotifications || 0} notifications): ${ (squadState.rustPlus.pairedServers || []).length } server(s) & ${ (squadState.rustPlus.smartDevices || []).length } Smart Device(s) ready!`
      });
    }

    // 4. Rust+ Direct Config / RustPlusDesk profiles.json Import
    if (pathname === '/api/rustplus/connect' && req.method === 'POST') {
      if (!checkPin(req, res)) return;
      const body = await readJsonBody(req);
      const newCfg = {
        serverName: body.serverName || squadState.rustPlus.config.serverName || '',
        ip: String(body.ip || '').trim(),
        port: String(body.port || '28082').trim(),
        playerId: String(body.playerId || '').trim(),
        playerToken: String(body.playerToken || '').trim(),
        useFacepunchProxy: Boolean(body.useFacepunchProxy),
        serverId: body.serverId || ''
      };
      squadState.rustPlus.config = newCfg;

      // Also save/update in pairedServers list
      if (newCfg.ip && newCfg.playerId && newCfg.playerToken) {
        if (!Array.isArray(squadState.rustPlus.pairedServers)) {
          squadState.rustPlus.pairedServers = [];
        }
        const idx = squadState.rustPlus.pairedServers.findIndex(
          (s) => s.ip === newCfg.ip && String(s.port) === String(newCfg.port)
        );
        const entry = {
          ...newCfg,
          name: newCfg.serverName || `${newCfg.ip}:${newCfg.port}`,
          pairedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        if (idx >= 0) squadState.rustPlus.pairedServers[idx] = { ...squadState.rustPlus.pairedServers[idx], ...entry };
        else squadState.rustPlus.pairedServers.unshift(entry);
      }

      // If imported from RustPlusDesk profiles.json with bulk pairedServers
      if (Array.isArray(body.pairedServers) && body.pairedServers.length > 0) {
        if (!Array.isArray(squadState.rustPlus.pairedServers)) {
          squadState.rustPlus.pairedServers = [];
        }
        body.pairedServers.forEach((srv) => {
          if (!srv.ip || !srv.playerToken) return;
          const existsIdx = squadState.rustPlus.pairedServers.findIndex(
            (s) => s.ip === srv.ip && String(s.port) === String(srv.port || '28082')
          );
          const entry = {
            serverId: srv.serverId || `${srv.ip}:${srv.port || '28082'}`,
            name: srv.serverName || srv.name || `${srv.ip}:${srv.port || '28082'}`,
            serverName: srv.serverName || srv.name || `${srv.ip}:${srv.port || '28082'}`,
            ip: String(srv.ip),
            port: String(srv.port || '28082'),
            playerId: String(srv.playerId || ''),
            playerToken: String(srv.playerToken || ''),
            pairedAt: 'Imported'
          };
          if (existsIdx >= 0) squadState.rustPlus.pairedServers[existsIdx] = entry;
          else squadState.rustPlus.pairedServers.push(entry);
        });
      }

      // If imported from RustPlusDesk profiles.json with Smart Switches / Alarms
      if (Array.isArray(body.smartDevices) && body.smartDevices.length > 0) {
        body.smartDevices.forEach((dev) => {
          const exists = (squadState.rustPlus.smartDevices || []).some(
            (d) => String(d.entityId) === String(dev.entityId)
          );
          if (!exists) {
            squadState.rustPlus.smartDevices.unshift({
              id: dev.id || 'sd-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
              entityId: String(dev.entityId),
              name: dev.name || `Device #${dev.entityId}`,
              type: dev.type === 'alarm' ? 'alarm' : 'switch',
              active: Boolean(dev.active),
              grid: dev.grid || 'PAIRED'
            });
          }
        });
      }

      if (body.customImageUrl) {
        squadState.mapConfig.customImageUrl = body.customImageUrl;
      }
      if (body.battlemetricsId) {
        squadState.battlemetrics.serverId = String(body.battlemetricsId);
        if (body.serverName) squadState.battlemetrics.serverName = body.serverName;
      }

      const started = connectRustPlusSocket(squadState.rustPlus.config);
      saveState(squadState);
      broadcastState('state_update');
      return sendJson(res, 200, {
        ok: true,
        nativeSocketStarted: started,
        nativeLibraryInstalled: Boolean(RustPlus),
        pairedServers: squadState.rustPlus.pairedServers || [],
        message: started
          ? `Connecting to Rust+ server ${squadState.rustPlus.config.serverName || squadState.rustPlus.config.ip + ':' + squadState.rustPlus.config.port}...`
          : 'Saved Rust+ server & devices configuration!'
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

// Resume saved FCM Pairing Listener, Facepunch Cloud History Poller & Rust+ Socket on startup
if (fs.existsSync(FCM_FILE)) {
  try {
    const savedFcm = JSON.parse(fs.readFileSync(FCM_FILE, 'utf8'));
    startFcmPairingListener(savedFcm);
  } catch (_) {}
}
if (squadState.rustPlus?.authToken) {
  startHistorySyncPoller(squadState.rustPlus.authToken);
  syncPairingsFromFacepunchHistory(squadState.rustPlus.authToken, false).catch(() => {});
}
if (squadState.rustPlus?.config?.ip && squadState.rustPlus?.config?.playerToken) {
  connectRustPlusSocket(squadState.rustPlus.config);
}

server.listen(PORT, HOST, () => {
  console.log('==========================================================');
  console.log('  RUST TACTICAL COMPANION — ONLINE (RUST+ CLOUD PAIR v3.0)');
  console.log(`  Listening on: http://${HOST}:${PORT}`);
  console.log(`  Squad State : ${STATE_FILE}`);
  console.log(`  Rust+ Lib   : ${RustPlus ? 'READY (@liamcottle/rustplus.js)' : 'BUILT-IN TELEMETRY MODE'}`);
  console.log(`  FCM Pairing : ${PushReceiver ? 'READY (@liamcottle/push-receiver + Cloud History Sync)' : 'CLOUD HISTORY SYNC READY'}`);
  console.log('==========================================================');
});
