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
    size: 4250,
    customImageUrl: '',
    wipeDate: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  rustPlus: {
    connected: false,
    fcmListening: false,
    mode: 'simulated_live',
    config: {
      serverName: '',
      ip: process.env.RUSTPLUS_IP || '',
      port: process.env.RUSTPLUS_PORT || '28082',
      playerId: process.env.RUSTPLUS_PLAYER_ID || '',
      playerToken: process.env.RUSTPLUS_PLAYER_TOKEN || ''
    },
    serverTime: '14:35',
    isDaytime: true,
    liveMarkers: [],
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
// NATIVE RUST+ WEBSOCKET CONNECTOR
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

    const rp = new RustPlus(
      cfg.ip,
      cfg.port || 28082,
      cfg.playerId,
      cfg.playerToken,
      Boolean(cfg.useFacepunchProxy)
    );
    activeRustPlusClient = rp;

    rp.on('connected', () => {
      console.log(`[Rust+] Connected to live Rust server ${cfg.ip}:${cfg.port}`);
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
      rustPlusPollTimer = setInterval(() => {
        const mapSize = squadState.mapConfig?.size || 4250;

        rp.getInfo((msg) => {
          const info = msg?.response?.info;
          if (info) {
            squadState.mapConfig.size = info.mapSize || mapSize;
            squadState.mapConfig.seed = String(info.seed || squadState.mapConfig.seed);
            if (info.name) squadState.rustPlus.config.serverName = info.name;
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
                name: m.name,
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
              // Type 3 = VendingMachine
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
      }, 4000);
    });

    // Listen for real-time In-Game Team Chat & Smart Switch changes
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
// RUST+ DESKTOP STYLE AUTO-PAIRING (FCM PUSH RECEIVER + FACEPUNCH REGISTER)
// ============================================================================
let fcmClient = null;

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
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'User-Agent': 'RustTacticalCompanion/2.1',
          ...headers
        },
        timeout: 10000
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            const json = data ? JSON.parse(data) : {};
            if (res.statusCode >= 200 && res.statusCode < 300) resolve(json);
            else reject(new Error(json?.error || `HTTP ${res.statusCode}: ${data.slice(0, 120)}`));
          } catch (_) {
            if (res.statusCode >= 200 && res.statusCode < 300) resolve({ raw: data });
            else reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function extractFacepunchToken(rawInput) {
  const str = String(rawInput || '').trim();
  if (!str) return null;

  // 1. Direct JSON object {"SteamId":"...","Token":"..."} or RustPlusDesk rustplusjs-config.json
  try {
    const j = JSON.parse(str);
    if (j.fcm_credentials && j.fcm_credentials.gcm && j.fcm_credentials.fcm) {
      return {
        fcmCredentials: j.fcm_credentials,
        token: j.rustplus_auth_token || j.Token || j.token || '',
        steamId: j.steam_id || j.SteamId || j.steamId || ''
      };
    }
    if (j.Token || j.token || j.rustplus_auth_token) {
      return {
        token: j.Token || j.token || j.rustplus_auth_token,
        steamId: j.SteamId || j.steamId || j.steam_id || ''
      };
    }
  } catch (_) {}

  // 2. Extracted from HTML DOM / page source of companion-rust.facepunch.com/login
  const tokenMatch = str.match(/["']Token["']\s*:\s*["']([^"']+)["']/i);
  const steamMatch = str.match(/["']SteamId["']\s*:\s*["'](\d+)["']/i);
  if (tokenMatch) {
    return { token: tokenMatch[1], steamId: steamMatch ? steamMatch[1] : '' };
  }

  // 3. Raw token string (JWT / base64 Facepunch token)
  if (str.length > 25 && !str.includes(' ') && !str.includes('<html')) {
    return { token: str, steamId: '' };
  }
  return null;
}

function handleIncomingFcmNotification(notification) {
  try {
    const data = notification?.notification?.data || notification?.data;
    if (!data || !data.body) return;
    const body = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
    console.log('[Rust+ FCM Push Received]', body.type, body.name || body.entityName || '');

    if (body.type === 'server' && body.ip && body.playerToken) {
      // Auto-Pair Server!
      squadState.rustPlus.config = {
        serverName: body.name || `${body.ip}:${body.port}`,
        ip: body.ip,
        port: String(body.port || '28082'),
        playerId: String(body.playerId || ''),
        playerToken: String(body.playerToken || '')
      };
      saveState(squadState);
      connectRustPlusSocket(squadState.rustPlus.config);
      broadcastState('rustplus_paired_server', {
        pairedServer: squadState.rustPlus.config
      });
    } else if (body.type === 'entity' && body.entityId) {
      // Auto-Pair Smart Switch / Smart Alarm / Storage Monitor!
      if (body.ip && body.playerToken && !squadState.rustPlus.config.ip) {
        squadState.rustPlus.config = {
          serverName: body.name || `${body.ip}:${body.port}`,
          ip: body.ip,
          port: String(body.port || '28082'),
          playerId: String(body.playerId || ''),
          playerToken: String(body.playerToken || '')
        };
        connectRustPlusSocket(squadState.rustPlus.config);
      }

      const entityIdStr = String(body.entityId);
      const existing = (squadState.rustPlus.smartDevices || []).find(
        (d) => String(d.entityId) === entityIdStr
      );
      const devType = String(body.entityType) === '2' ? 'alarm' : 'switch';
      const devName = body.entityName || (devType === 'alarm' ? `Smart Alarm #${entityIdStr}` : `Smart Switch #${entityIdStr}`);

      if (!existing) {
        squadState.rustPlus.smartDevices.unshift({
          id: 'sd-' + Date.now(),
          entityId: entityIdStr,
          name: devName,
          type: devType,
          active: false,
          grid: 'PAIRED'
        });
      }
      saveState(squadState);
      broadcastState('rustplus_paired_entity', {
        pairedEntity: { entityId: entityIdStr, name: devName, type: devType }
      });
    }
  } catch (err) {
    console.error('[Rust+ FCM Parse Error]', err.message);
  }
}

async function startFcmPairingListener(credentials) {
  if (!PushReceiver || !credentials) return false;
  try {
    if (fcmClient) {
      try { fcmClient.destroy?.(); } catch (_) {}
    }
    fcmClient = await PushReceiver.listen(credentials, handleIncomingFcmNotification);
    squadState.rustPlus.fcmListening = true;
    saveState(squadState);
    broadcastState('state_update');
    console.log('[Rust+ FCM] Live In-Game Pairing Listener ACTIVE! Click "Pair" in-game anytime.');
    return true;
  } catch (err) {
    console.error('[Rust+ FCM Listen Error]', err.message);
    return false;
  }
}

async function registerFacepunchFcm(authToken) {
  if (!PushReceiver) {
    throw new Error('Package @liamcottle/push-receiver is not installed yet. Run npm install on your container.');
  }

  // 1. Register with Google FCM using Facepunch's Sender ID
  const fcmCredentials = await PushReceiver.register(FACEPUNCH_GCM_SENDER_ID);
  const fcmToken = fcmCredentials?.fcm?.token;
  if (!fcmToken) {
    throw new Error('Failed to obtain FCM token from push-receiver');
  }

  // 2. Fetch Expo Push Token for @facepunch/rustcompanion
  const expoRes = await postJsonHttps('https://exp.host/--/api/v2/push/getExpoPushToken', {
    deviceId: crypto.randomUUID ? crypto.randomUUID() : 'rust-companion-' + Date.now(),
    experienceId: '@facepunch/rustcompanion',
    appId: 'com.facepunch.rust.companion',
    deviceToken: fcmToken,
    type: 'fcm',
    development: false
  });

  const expoPushToken = expoRes?.data?.expoPushToken;
  if (!expoPushToken) {
    throw new Error('Failed to obtain Expo Push Token');
  }

  // 3. Register with Facepunch Rust+ Companion API
  await postJsonHttps(
    'https://companion-rust.facepunch.com:443/api/push/register',
    {
      AuthToken: authToken,
      DeviceId: 'rust-tactical-companion',
      PushKind: 0,
      PushToken: expoPushToken
    },
    { Authorization: `Bearer ${authToken}` }
  );

  // 4. Save FCM credentials & start listening!
  fs.writeFileSync(FCM_FILE, JSON.stringify(fcmCredentials, null, 2), 'utf8');
  await startFcmPairingListener(fcmCredentials);
  return true;
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

    // 3. Rust+ Desktop Style Auto-Pairing (FCM Registration & Listener)
    if (pathname === '/api/rustplus/fcm-register' && req.method === 'POST') {
      if (!checkPin(req, res)) return;
      const body = await readJsonBody(req);

      // Direct fcm_credentials import from RustPlusDesk's rustplusjs-config.json
      const directFcm = body.fcmCredentials || extractFacepunchToken(body.tokenInput)?.fcmCredentials;
      if (directFcm && directFcm.gcm && directFcm.fcm) {
        try {
          fs.writeFileSync(FCM_FILE, JSON.stringify(directFcm, null, 2), 'utf8');
          const ok = await startFcmPairingListener(directFcm);
          if (!ok) {
            return sendJson(res, 500, {
              error: 'Saved FCM credentials, but @liamcottle/push-receiver could not start listener. Check server logs.'
            });
          }
          return sendJson(res, 200, {
            ok: true,
            message: 'Imported Rust+ Desktop FCM Credentials! Live In-Game Pairing Listener is now ACTIVE.'
          });
        } catch (err) {
          return sendJson(res, 500, { error: err.message });
        }
      }

      const extracted = extractFacepunchToken(body.tokenInput);
      if (!extracted || !extracted.token) {
        return sendJson(res, 400, {
          error:
            'No Facepunch Token found! Note: Pressing Ctrl+U on the Facepunch Login page reloads the page and clears your login. Instead, either upload your Rust+ Desktop files (%APPDATA%\\RustPlusDesk\\profiles.json or rustplusjs-config.json) OR press F12 -> Console on the Facepunch page and run the 1-Click Extractor!'
        });
      }
      try {
        await registerFacepunchFcm(extracted.token);
        return sendJson(res, 200, {
          ok: true,
          message: 'Live In-Game Pairing Listener is now ACTIVE! Open Rust and click "Pair with Server" or pair any Smart Switch in-game.'
        });
      } catch (err) {
        return sendJson(res, 500, { error: err.message });
      }
    }

    // 4. Rust+ Direct Config / RustPlusDesk profiles.json Import
    if (pathname === '/api/rustplus/connect' && req.method === 'POST') {
      if (!checkPin(req, res)) return;
      const body = await readJsonBody(req);
      squadState.rustPlus.config = {
        serverName: body.serverName || squadState.rustPlus.config.serverName || '',
        ip: body.ip || '',
        port: String(body.port || '28082'),
        playerId: String(body.playerId || ''),
        playerToken: String(body.playerToken || ''),
        useFacepunchProxy: Boolean(body.useFacepunchProxy)
      };

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
        message: started
          ? `Connected to Rust+ server ${squadState.rustPlus.config.serverName || squadState.rustPlus.config.ip + ':' + squadState.rustPlus.config.port}!`
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

// Resume saved FCM Pairing Listener & Rust+ Socket on startup
if (fs.existsSync(FCM_FILE)) {
  try {
    const savedFcm = JSON.parse(fs.readFileSync(FCM_FILE, 'utf8'));
    startFcmPairingListener(savedFcm);
  } catch (_) {}
}
if (squadState.rustPlus?.config?.ip && squadState.rustPlus?.config?.playerToken) {
  connectRustPlusSocket(squadState.rustPlus.config);
}

server.listen(PORT, HOST, () => {
  console.log('==========================================================');
  console.log('  RUST TACTICAL COMPANION — ONLINE (RUST+ AUTO-PAIR v2.1)');
  console.log(`  Listening on: http://${HOST}:${PORT}`);
  console.log(`  Squad State : ${STATE_FILE}`);
  console.log(`  Rust+ Lib   : ${RustPlus ? 'READY (@liamcottle/rustplus.js)' : 'BUILT-IN TELEMETRY MODE'}`);
  console.log(`  FCM Pairing : ${PushReceiver ? 'READY (@liamcottle/push-receiver)' : 'INSTALL VIA NPM'}`);
  console.log('==========================================================');
});
