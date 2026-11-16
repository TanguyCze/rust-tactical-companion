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
const crypto = require('crypto');
const { URL } = require('url');

const PORT = parseInt(process.env.SERVER_PORT || process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const SQUAD_PIN = process.env.SQUAD_PIN || '';
const BM_TOKEN = process.env.BATTLEMETRICS_TOKEN || '';
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID || '';
const DISCORD_DM_USER_ID = process.env.DISCORD_DM_USER_ID || '';
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';

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
  raidStash: {
    sulfur: 0,
    sulfur_ore: 0,
    gunpowder: 0,
    explosives: 0,
    c4: 0,
    rocket: 0,
    explo_ammo: 0,
    satchel: 0,
    beancan: 0,
    hv_rocket: 0,
    incen_rocket: 0,
    molotov: 0,
    charcoal: 0,
    lgf: 0
  },
  savedClones: [
    { id: 'c1', crop: 'Hemp', genes: 'YGYWGG', notes: 'Gen 1 Starter' },
    { id: 'c2', crop: 'Hemp', genes: 'GGYYXW', notes: 'Gen 1 Donor A' },
    { id: 'c3', crop: 'Hemp', genes: 'YYYYGG', notes: 'God Clone (Yield)' },
    { id: 'c4', crop: 'Blue Berry', genes: 'GGGYYY', notes: 'Pure Ore Tea Clone' }
  ],
  battlemetrics: {
    serverId: '',
    serverName: '',
    watchlist: []
  },
  discordWebhookUrl: '',
  discordConfig: {
    botToken: '',
    channelId: '',
    dmUserId: '',
    notifyOnComplete: true,
    notifyOn60s: false
  },
  customShops: [],
  shopWatchlist: [],
  rustPlusShopConfig: {
    ip: process.env.RUSTPLUS_IP || '',
    port: process.env.RUSTPLUS_PORT || '28082',
    serverId: '',
    playerId: process.env.RUSTPLUS_PLAYER_ID || '',
    playerToken: process.env.RUSTPLUS_PLAYER_TOKEN || '',
    serverName: '',
    authToken: '',
    steamId: '',
    pairedServers: [],
    lastHistoryNotificationId: 0,
    useProxy: false,
    autoPoll: false,
    discordAlertSteals: true,
    discordAlertEvents: true,
    lastPolledAt: 0,
    lastStatus: '',
    mapSize: 4250
  },
  rustPlusTelemetry: {
    serverInfo: null,
    time: null,
    mapMeta: null,
    liveEvents: [],
    vendingPins: [],
    teamMembers: [],
    mapNotes: [],
    teamChat: [],
    smartDevices: []
  },
  updatedAt: Date.now()
};

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf8');
      // Drop legacy Rust+ / live-map data (incl. any saved auth tokens) from older versions
      const { rustPlus, markers, mapConfig, ...parsed } = JSON.parse(raw);
      const state = {
        ...DEFAULT_STATE,
        ...parsed,
        discordConfig: { ...DEFAULT_STATE.discordConfig, ...(parsed.discordConfig || {}) },
        rustPlusShopConfig: { ...DEFAULT_STATE.rustPlusShopConfig, ...(parsed.rustPlusShopConfig || {}) },
        rustPlusTelemetry: { ...DEFAULT_STATE.rustPlusTelemetry, ...(parsed.rustPlusTelemetry || {}) }
      };
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
const rustmapsAnalyzeCache = new Map();
const RUSTMAPS_CACHE_TTL_MS = 6 * 3600 * 1000;

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

const dmChannelCache = new Map();
const sentDiscordAlerts = new Set();

function resolveDiscordSettings(overrides = {}) {
  const cfg = squadState.discordConfig || {};
  return {
    webhookUrl: String(overrides.webhookUrl ?? squadState.discordWebhookUrl ?? DISCORD_WEBHOOK_URL ?? '').trim(),
    botToken: String(overrides.botToken ?? cfg.botToken ?? DISCORD_BOT_TOKEN ?? '').trim(),
    channelId: String(overrides.channelId ?? cfg.channelId ?? DISCORD_CHANNEL_ID ?? '').trim(),
    dmUserId: String(overrides.dmUserId ?? cfg.dmUserId ?? DISCORD_DM_USER_ID ?? '').trim(),
    notifyOnComplete: cfg.notifyOnComplete !== false,
    notifyOn60s: Boolean(cfg.notifyOn60s)
  };
}

function discordApiRequest(method, apiPath, botToken, bodyObj) {
  return new Promise((resolve, reject) => {
    const cleanToken = String(botToken || '').replace(/^Bot\s+/i, '').trim();
    if (!cleanToken) return reject(new Error('Missing Discord Bot Token'));
    const payload = bodyObj ? JSON.stringify(bodyObj) : '';
    const headers = {
      Authorization: `Bot ${cleanToken}`,
      'User-Agent': 'RustTacticalCompanion (https://rustmaps.com, 2.1)',
      Accept: 'application/json'
    };
    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = https.request(
      {
        hostname: 'discord.com',
        path: `/api/v10${apiPath}`,
        method,
        headers,
        timeout: 8000
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = raw ? JSON.parse(raw) : {};
          } catch (_) {}
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed || {});
          } else {
            reject(new Error(parsed?.message || `Discord API HTTP ${res.statusCode}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error('Discord API request timed out'));
    });
    if (payload) req.write(payload);
    req.end();
  });
}

function postWebhookEmbed(webhookUrl, payloadObj) {
  return new Promise((resolve, reject) => {
    if (!webhookUrl || !webhookUrl.startsWith('https://discord')) {
      return reject(new Error('Invalid Discord Webhook URL'));
    }
    const parsed = new URL(webhookUrl);
    const payload = JSON.stringify(payloadObj);
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
          else reject(new Error(`Discord Webhook HTTP ${res.statusCode}`));
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error('Discord webhook request timed out'));
    });
    req.write(payload);
    req.end();
  });
}

async function sendDiscordNotification(opts = {}) {
  const settings = resolveDiscordSettings(opts);
  const title = String(opts.title || 'Rust Tactical Companion Alert');
  const description = String(opts.description || '');
  const color = Number.isFinite(Number(opts.color)) ? Number(opts.color) : 0xcd412b;

  const dmUserIds = settings.dmUserId
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter((id) => /^\d{15,22}$/.test(id));
  const cleanChannelId = /^\d{15,22}$/.test(settings.channelId) ? settings.channelId : '';

  const mentionPrefix = dmUserIds.length > 0 ? dmUserIds.map((id) => `<@${id}>`).join(' ') : '';
  const embed = {
    title,
    description,
    color,
    timestamp: new Date().toISOString(),
    footer: { text: 'Rust Tactical Companion • Live Timer & Raid Alert' }
  };
  const webhookPayload = {
    username: `Rust Tactical Companion [${squadState.squadName || 'SQUAD'}]`,
    ...(mentionPrefix ? { content: mentionPrefix } : {}),
    embeds: [embed]
  };
  const channelPayload = {
    ...(mentionPrefix ? { content: mentionPrefix } : {}),
    embeds: [embed]
  };

  const sentVia = [];
  let lastErr = null;

  if (settings.webhookUrl && settings.webhookUrl.startsWith('https://discord')) {
    try {
      await postWebhookEmbed(settings.webhookUrl, webhookPayload);
      sentVia.push('Webhook');
    } catch (err) {
      lastErr = err;
    }
  }

  if (settings.botToken && cleanChannelId) {
    try {
      await discordApiRequest('POST', `/channels/${cleanChannelId}/messages`, settings.botToken, channelPayload);
      sentVia.push('Bot Channel');
    } catch (err) {
      lastErr = err;
    }
  }

  if (settings.botToken && dmUserIds.length > 0) {
    for (const uid of dmUserIds) {
      try {
        let dmChanId = dmChannelCache.get(uid);
        if (!dmChanId) {
          const dmChan = await discordApiRequest('POST', '/users/@me/channels', settings.botToken, { recipient_id: uid });
          dmChanId = dmChan?.id;
          if (dmChanId) dmChannelCache.set(uid, dmChanId);
        }
        if (dmChanId) {
          await discordApiRequest('POST', `/channels/${dmChanId}/messages`, settings.botToken, { embeds: [embed] });
          if (!sentVia.includes('Bot DM')) sentVia.push('Bot DM');
        }
      } catch (err) {
        dmChannelCache.delete(uid);
        lastErr = err;
      }
    }
  }

  if (sentVia.length === 0) {
    throw lastErr || new Error('Configure a Discord Bot Token (+ Channel ID or DM User ID) or Discord Webhook URL in Settings');
  }
  return { ok: true, sentVia };
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

// ============================================================================
// ZERO-DEPENDENCY RUST+ LIVE VENDING MACHINE POLLER (WEBSOCKET + PROTOBUF)
// ============================================================================
const RUST_ITEMS_BY_ID = {
  // Resources & Fuel
  '-1581843485': 'Sulfur',
  '-1157596551': 'Sulfur Ore',
  '-932201673': 'Scrap',
  '-151838493': 'Wood',
  '-2099697608': 'Stone',
  '69511070': 'Metal Fragments',
  '-1059362949': 'Metal Ore',
  '317398316': 'High Quality Metal',
  '-1982036270': 'HQM Ore',
  '-321733511': 'Crude Oil',
  '-946369541': 'Low Grade Fuel',
  '1568388703': 'Diesel Fuel Barrel',
  '-1938052175': 'Charcoal',
  '-265876753': 'Gunpowder',
  '-930193596': 'Fertilizer',
  '-1848736516': 'Cloth',
  '-858312878': 'Cloth',
  '1381010055': 'Leather',
  '609049394': 'Battery - Small',
  '1521286012': 'Hemp Seed',
  // Teas & Farming
  '1729374708': 'Pure Ore Tea',
  '1243083208': 'Pure Ore Tea (Milky)',
  '2063916636': 'Advanced Ore Tea',
  '170147692': 'Ore Tea',
  '2024467711': 'Pure Scrap Tea',
  '-76829520': 'Advanced Scrap Tea',
  '-557539629': 'Pure Wood Tea',
  '1712261904': 'Pure Max Health Tea',
  '-427358086': 'Pure Healing Tea',
  '1819288764': 'Pure Rad. Removal Tea',
  '476066818': 'Pure Warming Tea',
  '1079279582': 'Medical Syringe',
  '-2072273936': 'Bandage',
  '254522515': 'Large Medkit',
  // Workbenches & Base Progression
  '1524187186': 'Workbench Level 1',
  '-41896755': 'Workbench Level 2',
  '-1607980696': 'Workbench Level 3',
  '-1992717673': 'Large Furnace',
  '-1196547867': 'Electric Furnace',
  '2090395347': 'Large Solar Panel',
  '-148794216': 'Garage Door',
  '1221063409': 'Armored Double Door',
  '1390353317': 'Armored Door',
  '1366957135': 'Sheet Metal Double Door',
  '-2139580305': 'Auto Turret',
  '20489901': 'SAM Site',
  '-691113464': 'Large Rechargeable Battery',
  '2096126619': 'Medium Rechargeable Battery',
  '174866732': 'High External Stone Wall',
  // Weapons & Optics
  '1545779598': 'Assault Rifle (AK)',
  '-1812555177': 'LR-300 Assault Rifle',
  '-904863145': 'Semi-Automatic Rifle (SAR)',
  '-1758372725': 'Thompson',
  '1318558775': 'MP5A4',
  '1796682209': 'Custom SMG',
  '1373971859': 'Python Revolver',
  '-852563019': 'M92 Pistol',
  '1367281941': 'Revolver',
  '1588298435': 'Bolt Action Rifle',
  '-778367295': 'L96 Rifle',
  '-2069578888': 'M249',
  '28201841': 'M39 Rifle',
  '-765183617': 'Double Barrel Shotgun',
  '-41440462': 'Spas-12 Shotgun',
  '795371088': 'Pump Shotgun',
  '442289265': 'Holo Sight',
  '567235583': '8x Zoom Scope',
  '174866733': '16x Zoom Scope',
  // Raid & Explosives
  '1248356124': 'Timed Explosive Charge (C4)',
  '-742865266': 'Rocket',
  '-1878475007': 'Satchel Charge',
  '-592016202': 'Explosives',
  '-1321651331': 'Explosive 5.56 Ammo',
  '-1841918730': 'High Velocity Rocket',
  '1638322904': 'Incendiary Rocket',
  '1840822026': 'Beancan Grenade',
  '143803535': 'F1 Grenade',
  '1263920163': 'Smoke Grenade',
  // Tools, Gear & Comps
  '1488979457': 'Jackhammer',
  '1104520648': 'Chainsaw',
  '-1302129395': 'Salvaged Icepick',
  '-262590403': 'Salvaged Axe',
  '-1108136649': 'Tactical Gloves',
  '-2012470695': 'Tech Trash',
  '95950017': 'Rifle Body',
  '1234880403': 'SMG Body',
  '479143914': 'Gears',
  '1882709339': 'Metal Pipe',
  '1199391518': 'Road Signs',
  '736818762': 'Sewing Kit',
  '37122747': 'Blue Keycard',
  '-1880870149': 'Red Keycard',
  '-484206264': 'Green Keycard',
  '-1211166256': '5.56 Rifle Ammo',
  '785728077': 'Pistol Bullet',
  '-1685290200': '12 Gauge Buckshot'
};

const BACKEND_STEAL_LIMITS = [
  { match: 'pure ore tea', maxSulfur: 400, why: '#1 Best Player Shop Buy: +50% Ore yield nets +3,000–6,000 extra Sulfur in 30m!' },
  { match: 'advanced ore tea', maxSulfur: 200, why: '+35% Ore yield — pays off in 2 sulfur nodes.' },
  { match: 'pure scrap tea', maxSulfur: 400, why: '+350% Barrel Scrap — 1,200+ Scrap in 30m road run.' },
  { match: 'pure wood tea', maxSulfur: 280, why: '+200% Wood yield — instant box of Wood/Charcoal.' },
  { match: 'garage door', maxSulfur: 380, why: 'Skips 600+ Scrap of T2 tech-tree tax on Day 1!' },
  { match: 'workbench level 2', maxSulfur: 480, why: 'Saves 500 Scrap + 20 HQM on wipe day!' },
  { match: 'workbench level 3', maxSulfur: 1450, why: 'Saves 1,250 Scrap + 100 HQM endgame tax!' },
  { match: 'electric furnace', maxSulfur: 200, why: 'Zero-wood smelting & zero smoke signature!' },
  { match: 'auto turret', maxSulfur: 850, why: 'Cheaper than 400 Scrap at Outpost!' },
  { match: 'semi-automatic rifle', maxSulfur: 380, why: '1 Sulfur node for a T2 SAR to research or roam.' },
  { match: 'thompson', maxSulfur: 420, why: 'Top T2 SMG before running Oil Rig / Tunnels.' },
  { match: 'assault rifle', maxSulfur: 1400, why: 'Endgame AK saving 50 HQM + Rifle Body + T3 WB.' },
  { match: 'diesel fuel', maxSulfur: 380, why: '1 Diesel = 2,000 Sulfur Ore at Giant Excavator (+1,600+ net)!' },
  { match: 'charcoal', maxSulfur: 320, why: 'Electric furnaces make 0 Charcoal — instant GP fuel.' }
];

let RUST_ITEM_META = {};
try {
  const itemsJsonPath = path.join(PUBLIC_DIR, 'js', 'rust-items.json');
  if (fs.existsSync(itemsJsonPath)) {
    RUST_ITEM_META = JSON.parse(fs.readFileSync(itemsJsonPath, 'utf8')) || {};
  }
} catch (_) {
  RUST_ITEM_META = {};
}

function inferShopCategoryFromName(name) {
  const s = String(name || '').toLowerCase();
  if (/tea|berry|hemp|clone|seed|fertilizer/.test(s)) return 'teas';
  if (/workbench|furnace|solar|research|mixing/.test(s)) return 'progression';
  if (/garage door|armored|turret|sam site|battery|window|external|windmill|trap/.test(s)) return 'defense';
  if (/rocket|explosive|satchel|c4|beancan|grenade|mlrs/.test(s)) return 'raid';
  if (/rifle|ak|lr-300|sar|thompson|mp5|smg|python|revolver|shotgun|m249|l96|m39|hmlmg|sks|scope|holo|ammo|5\.56|buckshot|bullet|facemask|chest plate|hazmat|road sign/.test(s)) return 'weapons';
  if (/jackhammer|chainsaw|icepick|axe|gloves|syringe|medkit|keycard|diving|goggles|smart switch|smart alarm|storage monitor|industrial/.test(s)) return 'tools';
  if (/minicopter|scrap transport|attack helicopter|kayak|tugboat|rhino|submarine|horse|saddle|boogie/.test(s)) return 'vehicles';
  return 'resources';
}

function resolveRustItemInfo(itemId) {
  const key = String(itemId);
  const meta = RUST_ITEM_META[key];
  const name = RUST_ITEMS_BY_ID[key] || (Array.isArray(meta) && meta[0]) || `Rust Item #${key}`;
  const shortname = (Array.isArray(meta) && meta[1]) || '';
  return { name, shortname };
}

function resolveRustItemName(itemId) {
  return resolveRustItemInfo(itemId).name;
}

function worldGridLabelFromRustPlus(rawX, rawY, mapSize) {
  const size = Math.max(1000, Number(mapSize) || 4250);
  const count = Math.max(1, Math.floor((size * 7) / 1024));
  const cellSize = size / count;
  const col = Math.min(count - 1, Math.max(0, Math.floor(rawX / cellSize)));
  const row = Math.min(count - 1, Math.max(0, Math.floor((size - rawY) / cellSize)));
  const colLabel =
    col < 26
      ? String.fromCharCode(65 + col)
      : String.fromCharCode(64 + Math.floor(col / 26)) + String.fromCharCode(65 + (col % 26));
  return `${colLabel}${row}`;
}

function writeVarint(arr, val) {
  let v = BigInt(val);
  if (v < 0n) v = BigInt.asUintN(64, v);
  while (v >= 0x80n) {
    arr.push(Number((v & 0x7fn) | 0x80n));
    v >>= 7n;
  }
  arr.push(Number(v));
}

function readVarint(buf, offset) {
  let res = 0n;
  let shift = 0n;
  let pos = offset;
  while (pos < buf.length) {
    const b = buf[pos++];
    res |= BigInt(b & 0x7f) << shift;
    if ((b & 0x80) === 0) break;
    shift += 7n;
  }
  return { value: res, offset: pos };
}

function skipWireField(buf, offset, wireType) {
  if (wireType === 0) return readVarint(buf, offset).offset;
  if (wireType === 1) return offset + 8;
  if (wireType === 2) {
    const len = readVarint(buf, offset);
    return len.offset + Number(len.value);
  }
  if (wireType === 5) return offset + 4;
  return buf.length;
}

function encodeRustPlusRequest(seq, playerId, playerToken, fieldNum, innerBytesOrObj = []) {
  const out = [];
  writeVarint(out, (1 << 3) | 0);
  writeVarint(out, seq);
  writeVarint(out, (2 << 3) | 0);
  writeVarint(out, BigInt(String(playerId || '0')));
  writeVarint(out, (3 << 3) | 0);
  writeVarint(out, BigInt(parseInt(String(playerToken || '0'), 10)));
  if (innerBytesOrObj && !Array.isArray(innerBytesOrObj) && innerBytesOrObj.entityId != null && innerBytesOrObj.entityId !== '') {
    writeVarint(out, (4 << 3) | 0);
    writeVarint(out, BigInt(String(innerBytesOrObj.entityId).replace(/[^\d]/g, '') || '0'));
  }
  const payload = Array.isArray(innerBytesOrObj) ? innerBytesOrObj : innerBytesOrObj?.bytes || [];
  writeVarint(out, (fieldNum << 3) | 2);
  writeVarint(out, payload.length);
  for (let i = 0; i < payload.length; i++) out.push(payload[i]);
  return Buffer.from(out);
}

function encodeRustPlusSendMessage(text) {
  const strBytes = Buffer.from(String(text || ''), 'utf8');
  const out = [];
  writeVarint(out, (1 << 3) | 2);
  writeVarint(out, strBytes.length);
  for (let i = 0; i < strBytes.length; i++) out.push(strBytes[i]);
  return out;
}

function encodeRustPlusPromoteToLeader(steamId) {
  const out = [];
  writeVarint(out, (1 << 3) | 0);
  writeVarint(out, BigInt(String(steamId || '0').replace(/[^\d]/g, '') || '0'));
  return out;
}

function decodeRustPlusAppInfo(buf) {
  let pos = 0;
  const info = {};
  while (pos < buf.length) {
    const tag = readVarint(buf, pos);
    pos = tag.offset;
    const fn = Number(tag.value >> 3n);
    const wt = Number(tag.value & 7n);
    if (wt === 2 && [1, 2, 3, 4].includes(fn)) {
      const len = readVarint(buf, pos);
      pos = len.offset;
      const str = buf.slice(pos, pos + Number(len.value)).toString('utf8');
      pos += Number(len.value);
      if (fn === 1) info.name = str;
      else if (fn === 2) info.headerImage = str;
      else if (fn === 3) info.url = str;
      else if (fn === 4) info.map = str;
    } else if (wt === 0 && [5, 6, 7, 8, 9, 10, 11].includes(fn)) {
      const v = readVarint(buf, pos);
      pos = v.offset;
      const num = Number(v.value);
      if (fn === 5) info.mapSize = num;
      else if (fn === 6) info.wipeTime = num;
      else if (fn === 7) info.players = num;
      else if (fn === 8) info.maxPlayers = num;
      else if (fn === 9) info.queuedPlayers = num;
      else if (fn === 10) info.seed = num;
      else if (fn === 11) info.salt = num;
    } else {
      pos = skipWireField(buf, pos, wt);
    }
  }
  return info;
}

function decodeRustPlusAppTime(buf) {
  let pos = 0;
  const time = {};
  while (pos < buf.length) {
    const tag = readVarint(buf, pos);
    pos = tag.offset;
    const fn = Number(tag.value >> 3n);
    const wt = Number(tag.value & 7n);
    if (wt === 5 && pos + 4 <= buf.length) {
      const val = buf.readFloatLE(pos);
      pos += 4;
      if (fn === 1) time.dayLengthMinutes = val;
      else if (fn === 2) time.timeScale = val;
      else if (fn === 3) time.sunrise = val;
      else if (fn === 4) time.sunset = val;
      else if (fn === 5) time.time = val;
    } else {
      pos = skipWireField(buf, pos, wt);
    }
  }
  return time;
}

function decodeRustPlusMapMonument(buf) {
  let pos = 0;
  const mon = { token: '', x: 0, y: 0 };
  while (pos < buf.length) {
    const tag = readVarint(buf, pos);
    pos = tag.offset;
    const fn = Number(tag.value >> 3n);
    const wt = Number(tag.value & 7n);
    if (wt === 2 && fn === 1) {
      const len = readVarint(buf, pos);
      pos = len.offset;
      mon.token = buf.slice(pos, pos + Number(len.value)).toString('utf8');
      pos += Number(len.value);
    } else if (wt === 5 && pos + 4 <= buf.length) {
      const val = buf.readFloatLE(pos);
      pos += 4;
      if (fn === 2) mon.x = val;
      else if (fn === 3) mon.y = val;
    } else {
      pos = skipWireField(buf, pos, wt);
    }
  }
  return mon;
}

function decodeRustPlusAppMap(buf) {
  let pos = 0;
  const map = { width: 0, height: 0, oceanMargin: 0, jpgImage: null, background: '', monuments: [] };
  while (pos < buf.length) {
    const tag = readVarint(buf, pos);
    pos = tag.offset;
    const fn = Number(tag.value >> 3n);
    const wt = Number(tag.value & 7n);
    if (wt === 0 && (fn === 1 || fn === 2 || fn === 4)) {
      const v = readVarint(buf, pos);
      pos = v.offset;
      if (fn === 1) map.width = Number(v.value);
      else if (fn === 2) map.height = Number(v.value);
      else if (fn === 4) map.oceanMargin = Number(v.value);
    } else if (wt === 2) {
      const len = readVarint(buf, pos);
      pos = len.offset;
      const sub = buf.slice(pos, pos + Number(len.value));
      pos += Number(len.value);
      if (fn === 3) map.jpgImage = sub;
      else if (fn === 5) map.monuments.push(decodeRustPlusMapMonument(sub));
      else if (fn === 6) map.background = sub.toString('utf8');
    } else {
      pos = skipWireField(buf, pos, wt);
    }
  }
  return map;
}

function decodeRustPlusTeamMember(buf) {
  let pos = 0;
  const m = { steamId: '0', name: '', x: 0, y: 0, isOnline: false, spawnTime: 0, isAlive: false, deathTime: 0 };
  while (pos < buf.length) {
    const tag = readVarint(buf, pos);
    pos = tag.offset;
    const fn = Number(tag.value >> 3n);
    const wt = Number(tag.value & 7n);
    if (wt === 0) {
      const v = readVarint(buf, pos);
      pos = v.offset;
      if (fn === 1) m.steamId = v.value.toString();
      else if (fn === 5) m.isOnline = v.value !== 0n;
      else if (fn === 6) m.spawnTime = Number(v.value);
      else if (fn === 7) m.isAlive = v.value !== 0n;
      else if (fn === 8) m.deathTime = Number(v.value);
    } else if (wt === 2 && fn === 2) {
      const len = readVarint(buf, pos);
      pos = len.offset;
      m.name = buf.slice(pos, pos + Number(len.value)).toString('utf8');
      pos += Number(len.value);
    } else if (wt === 5 && pos + 4 <= buf.length) {
      const val = buf.readFloatLE(pos);
      pos += 4;
      if (fn === 3) m.x = val;
      else if (fn === 4) m.y = val;
    } else {
      pos = skipWireField(buf, pos, wt);
    }
  }
  return m;
}

function decodeRustPlusMapNote(buf) {
  let pos = 0;
  const note = { type: 0, x: 0, y: 0, icon: 0, colourIndex: 0, label: '' };
  while (pos < buf.length) {
    const tag = readVarint(buf, pos);
    pos = tag.offset;
    const fn = Number(tag.value >> 3n);
    const wt = Number(tag.value & 7n);
    if (wt === 0) {
      const v = readVarint(buf, pos);
      pos = v.offset;
      if (fn === 2) note.type = Number(v.value);
      else if (fn === 5) note.icon = Number(v.value);
      else if (fn === 6) note.colourIndex = Number(v.value);
    } else if (wt === 5 && pos + 4 <= buf.length) {
      const val = buf.readFloatLE(pos);
      pos += 4;
      if (fn === 3) note.x = val;
      else if (fn === 4) note.y = val;
    } else if (wt === 2 && fn === 7) {
      const len = readVarint(buf, pos);
      pos = len.offset;
      note.label = buf.slice(pos, pos + Number(len.value)).toString('utf8');
      pos += Number(len.value);
    } else {
      pos = skipWireField(buf, pos, wt);
    }
  }
  return note;
}

function decodeRustPlusTeamInfo(buf) {
  let pos = 0;
  const ti = { leaderSteamId: '0', members: [], mapNotes: [], leaderMapNotes: [] };
  while (pos < buf.length) {
    const tag = readVarint(buf, pos);
    pos = tag.offset;
    const fn = Number(tag.value >> 3n);
    const wt = Number(tag.value & 7n);
    if (wt === 0 && fn === 1) {
      const v = readVarint(buf, pos);
      pos = v.offset;
      ti.leaderSteamId = v.value.toString();
    } else if (wt === 2 && (fn === 2 || fn === 3 || fn === 4)) {
      const len = readVarint(buf, pos);
      pos = len.offset;
      const sub = buf.slice(pos, pos + Number(len.value));
      pos += Number(len.value);
      if (fn === 2) ti.members.push(decodeRustPlusTeamMember(sub));
      else if (fn === 3) ti.mapNotes.push(decodeRustPlusMapNote(sub));
      else if (fn === 4) ti.leaderMapNotes.push(decodeRustPlusMapNote(sub));
    } else {
      pos = skipWireField(buf, pos, wt);
    }
  }
  return ti;
}

function decodeRustPlusTeamMessage(buf) {
  let pos = 0;
  const msg = { steamId: '0', name: '', message: '', color: '#a7f3d0', time: 0 };
  while (pos < buf.length) {
    const tag = readVarint(buf, pos);
    pos = tag.offset;
    const fn = Number(tag.value >> 3n);
    const wt = Number(tag.value & 7n);
    if (wt === 0) {
      const v = readVarint(buf, pos);
      pos = v.offset;
      if (fn === 1) msg.steamId = v.value.toString();
      else if (fn === 5) msg.time = Number(v.value);
    } else if (wt === 2 && [2, 3, 4].includes(fn)) {
      const len = readVarint(buf, pos);
      pos = len.offset;
      const s = buf.slice(pos, pos + Number(len.value)).toString('utf8');
      pos += Number(len.value);
      if (fn === 2) msg.name = s;
      else if (fn === 3) msg.message = s;
      else if (fn === 4) msg.color = s;
    } else {
      pos = skipWireField(buf, pos, wt);
    }
  }
  return msg;
}

function decodeRustPlusTeamChat(buf) {
  let pos = 0;
  const messages = [];
  while (pos < buf.length) {
    const tag = readVarint(buf, pos);
    pos = tag.offset;
    const fn = Number(tag.value >> 3n);
    const wt = Number(tag.value & 7n);
    if (wt === 2 && fn === 1) {
      const len = readVarint(buf, pos);
      pos = len.offset;
      messages.push(decodeRustPlusTeamMessage(buf.slice(pos, pos + Number(len.value))));
      pos += Number(len.value);
    } else {
      pos = skipWireField(buf, pos, wt);
    }
  }
  return messages;
}

function decodeRustPlusEntityItem(buf) {
  let pos = 0;
  const item = { itemId: 0, quantity: 0, itemIsBlueprint: false };
  while (pos < buf.length) {
    const tag = readVarint(buf, pos);
    pos = tag.offset;
    const fn = Number(tag.value >> 3n);
    const wt = Number(tag.value & 7n);
    if (wt === 0) {
      const v = readVarint(buf, pos);
      pos = v.offset;
      if (fn === 1) item.itemId = Number(BigInt.asIntN(32, v.value));
      else if (fn === 2) item.quantity = Number(BigInt.asIntN(32, v.value));
      else if (fn === 3) item.itemIsBlueprint = v.value !== 0n;
    } else {
      pos = skipWireField(buf, pos, wt);
    }
  }
  const info = resolveRustItemInfo(item.itemId);
  return {
    ...item,
    name: item.itemIsBlueprint ? `${info.name} (BP)` : info.name,
    shortname: info.shortname
  };
}

function decodeRustPlusEntityInfo(buf) {
  let pos = 0;
  const ent = { type: 0, value: false, items: [], capacity: 0, hasProtection: false, protectionExpiry: 0 };
  while (pos < buf.length) {
    const tag = readVarint(buf, pos);
    pos = tag.offset;
    const fn = Number(tag.value >> 3n);
    const wt = Number(tag.value & 7n);
    if (wt === 0 && fn === 1) {
      const v = readVarint(buf, pos);
      pos = v.offset;
      ent.type = Number(v.value);
    } else if (wt === 2 && fn === 3) {
      const len = readVarint(buf, pos);
      pos = len.offset;
      const pBuf = buf.slice(pos, pos + Number(len.value));
      pos += Number(len.value);
      let pPos = 0;
      while (pPos < pBuf.length) {
        const pt = readVarint(pBuf, pPos);
        pPos = pt.offset;
        const pfn = Number(pt.value >> 3n);
        const pwt = Number(pt.value & 7n);
        if (pwt === 0) {
          const pv = readVarint(pBuf, pPos);
          pPos = pv.offset;
          if (pfn === 1) ent.value = pv.value !== 0n;
          else if (pfn === 3) ent.capacity = Number(BigInt.asIntN(32, pv.value));
          else if (pfn === 4) ent.hasProtection = pv.value !== 0n;
          else if (pfn === 5) ent.protectionExpiry = Number(pv.value);
        } else if (pwt === 2 && pfn === 2) {
          const ilen = readVarint(pBuf, pPos);
          pPos = ilen.offset;
          const iBuf = pBuf.slice(pPos, pPos + Number(ilen.value));
          pPos += Number(ilen.value);
          ent.items.push(decodeRustPlusEntityItem(iBuf));
        } else {
          pPos = skipWireField(pBuf, pPos, pwt);
        }
      }
    } else {
      pos = skipWireField(buf, pos, wt);
    }
  }
  return ent;
}

function decodeRustPlusSellOrder(buf) {
  let pos = 0;
  const so = {
    itemId: 0,
    quantity: 1,
    currencyId: 0,
    costPerItem: 1,
    amountInStock: 0,
    itemIsBlueprint: false,
    currencyIsBlueprint: false
  };
  while (pos < buf.length) {
    const tag = readVarint(buf, pos);
    pos = tag.offset;
    const fn = Number(tag.value >> 3n);
    const wt = Number(tag.value & 7n);
    if (wt === 0) {
      const v = readVarint(buf, pos);
      pos = v.offset;
      const num = Number(BigInt.asIntN(32, v.value));
      if (fn === 1) so.itemId = num;
      else if (fn === 2) so.quantity = num;
      else if (fn === 3) so.currencyId = num;
      else if (fn === 4) so.costPerItem = num;
      else if (fn === 5) so.amountInStock = num;
      else if (fn === 6) so.itemIsBlueprint = v.value !== 0n;
      else if (fn === 7) so.currencyIsBlueprint = v.value !== 0n;
    } else {
      pos = skipWireField(buf, pos, wt);
    }
  }
  return so;
}

function decodeRustPlusMarker(buf) {
  let pos = 0;
  const mk = { id: 0, type: 0, x: 0, y: 0, steamId: '0', rotation: 0, radius: 0, name: '', outOfStock: false, sellOrders: [] };
  while (pos < buf.length) {
    const tag = readVarint(buf, pos);
    pos = tag.offset;
    const fn = Number(tag.value >> 3n);
    const wt = Number(tag.value & 7n);
    if (wt === 0) {
      const v = readVarint(buf, pos);
      pos = v.offset;
      if (fn === 1) mk.id = Number(v.value);
      else if (fn === 2) mk.type = Number(v.value);
      else if (fn === 5) mk.steamId = v.value.toString();
      else if (fn === 12) mk.outOfStock = v.value !== 0n;
    } else if (wt === 5 && pos + 4 <= buf.length) {
      const val = buf.readFloatLE(pos);
      pos += 4;
      if (fn === 3) mk.x = val;
      else if (fn === 4) mk.y = val;
      else if (fn === 6) mk.rotation = val;
      else if (fn === 7) mk.radius = val;
    } else if (wt === 2 && (fn === 11 || fn === 13)) {
      const len = readVarint(buf, pos);
      pos = len.offset;
      const sub = buf.slice(pos, pos + Number(len.value));
      pos += Number(len.value);
      if (fn === 11) mk.name = sub.toString('utf8');
      else if (fn === 13) mk.sellOrders.push(decodeRustPlusSellOrder(sub));
    } else {
      pos = skipWireField(buf, pos, wt);
    }
  }
  return mk;
}

function decodeRustPlusMapMarkers(buf) {
  let pos = 0;
  const markers = [];
  while (pos < buf.length) {
    const tag = readVarint(buf, pos);
    pos = tag.offset;
    const fn = Number(tag.value >> 3n);
    const wt = Number(tag.value & 7n);
    if (wt === 2 && fn === 1) {
      const len = readVarint(buf, pos);
      pos = len.offset;
      markers.push(decodeRustPlusMarker(buf.slice(pos, pos + Number(len.value))));
      pos += Number(len.value);
    } else {
      pos = skipWireField(buf, pos, wt);
    }
  }
  return markers;
}

function decodeRustPlusAppError(buf) {
  let pos = 0;
  let errMsg = '';
  while (pos < buf.length) {
    const tag = readVarint(buf, pos);
    pos = tag.offset;
    const fn = Number(tag.value >> 3n);
    const wt = Number(tag.value & 7n);
    if (wt === 2 && fn === 1) {
      const len = readVarint(buf, pos);
      pos = len.offset;
      errMsg = buf.slice(pos, pos + Number(len.value)).toString('utf8');
      pos += Number(len.value);
    } else {
      pos = skipWireField(buf, pos, wt);
    }
  }
  return errMsg || buf.toString('utf8').replace(/[^\x20-\x7e]/g, '').trim() || 'unknown_error';
}

function decodeRustPlusResponseMessage(buf) {
  let pos = 0;
  while (pos < buf.length) {
    const tag = readVarint(buf, pos);
    pos = tag.offset;
    const fn = Number(tag.value >> 3n);
    const wt = Number(tag.value & 7n);
    if (wt === 2 && fn === 1) {
      const len = readVarint(buf, pos);
      pos = len.offset;
      const respBuf = buf.slice(pos, pos + Number(len.value));
      pos += Number(len.value);
      let rpos = 0;
      const resp = {};
      while (rpos < respBuf.length) {
        const rtag = readVarint(respBuf, rpos);
        rpos = rtag.offset;
        const rfn = Number(rtag.value >> 3n);
        const rwt = Number(rtag.value & 7n);
        if (rwt === 0 && rfn === 1) {
          const v = readVarint(respBuf, rpos);
          rpos = v.offset;
          resp.seq = Number(v.value);
        } else if (rwt === 2) {
          const rlen = readVarint(respBuf, rpos);
          rpos = rlen.offset;
          const sub = respBuf.slice(rpos, rpos + Number(rlen.value));
          rpos += Number(rlen.value);
          if (rfn === 4) resp.error = decodeRustPlusAppError(sub);
          else if (rfn === 6) resp.info = decodeRustPlusAppInfo(sub);
          else if (rfn === 7) resp.time = decodeRustPlusAppTime(sub);
          else if (rfn === 8) resp.map = decodeRustPlusAppMap(sub);
          else if (rfn === 9) resp.teamInfo = decodeRustPlusTeamInfo(sub);
          else if (rfn === 10) resp.teamChat = decodeRustPlusTeamChat(sub);
          else if (rfn === 11) resp.entityInfo = decodeRustPlusEntityInfo(sub);
          else if (rfn === 13) resp.markers = decodeRustPlusMapMarkers(sub);
        } else {
          rpos = skipWireField(respBuf, rpos, rwt);
        }
      }
      return resp;
    }
    pos = skipWireField(buf, pos, wt);
  }
  return null;
}

function sendRawWsBinary(socket, buf) {
  const mask = crypto.randomBytes(4);
  let header;
  if (buf.length < 126) {
    header = Buffer.alloc(6);
    header[0] = 0x82;
    header[1] = 0x80 | buf.length;
    mask.copy(header, 2);
  } else if (buf.length < 65536) {
    header = Buffer.alloc(8);
    header[0] = 0x82;
    header[1] = 0x80 | 126;
    header.writeUInt16BE(buf.length, 2);
    mask.copy(header, 4);
  } else {
    header = Buffer.alloc(14);
    header[0] = 0x82;
    header[1] = 0x80 | 127;
    header.writeBigUInt64BE(BigInt(buf.length), 2);
    mask.copy(header, 10);
  }
  const masked = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) masked[i] = buf[i] ^ mask[i & 3];
  socket.write(Buffer.concat([header, masked]));
}

function withRustPlusSocket(cfg, mode, handlers, timeoutMs = 8500) {
  return new Promise((resolve, reject) => {
    const ip = String(cfg.ip || '').trim();
    const port = parseInt(String(cfg.port || '28082'), 10) || 28082;
    const serverId = String(cfg.serverId || '').trim();
    const authToken = String(cfg.authToken || '').trim();
    const playerId = String(cfg.playerId || '').trim();
    const playerToken = String(cfg.playerToken || '').trim();
    if ((!ip && !serverId) || !playerId || !playerToken) {
      return reject(new Error('Pair a server or enter Server IP / ID, SteamID64, and PlayerToken first.'));
    }

    let reqOpts;
    let useTls = true;
    let label = 'Facepunch Proxy';

    if (mode === 'socket' && serverId) {
      const b64Url = Buffer.from(authToken || '', 'utf8')
        .toString('base64')
        .replace(/=+$/, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
      const headers = {
        Connection: 'Upgrade',
        Upgrade: 'websocket',
        Origin: 'https://app.playrust.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Sec-WebSocket-Version': '13',
        'Sec-WebSocket-Key': crypto.randomBytes(16).toString('base64')
      };
      if (authToken) {
        headers['Sec-WebSocket-Protocol'] = `rustplus.auth.v1, ${b64Url}`;
      }
      reqOpts = {
        hostname: 'companion-rust.facepunch.com',
        port: 443,
        path: `/socket/${encodeURIComponent(serverId)}?v=0`,
        method: 'GET',
        headers,
        timeout: timeoutMs - 500
      };
      useTls = true;
      label = `Facepunch Relay (${serverId.slice(0, 8)}...)`;
    } else if (mode === 'proxy' && ip) {
      reqOpts = {
        hostname: 'companion-rust.facepunch.com',
        port: 443,
        path: `/game/${ip}/${port}`,
        method: 'GET',
        headers: {
          Connection: 'Upgrade',
          Upgrade: 'websocket',
          Origin: 'https://app.playrust.com',
          'Sec-WebSocket-Version': '13',
          'Sec-WebSocket-Key': crypto.randomBytes(16).toString('base64')
        },
        timeout: timeoutMs - 500
      };
      useTls = true;
      label = `Facepunch Proxy (${ip}:${port})`;
    } else if (ip) {
      reqOpts = {
        hostname: ip,
        port,
        path: '/',
        method: 'GET',
        headers: {
          Connection: 'Upgrade',
          Upgrade: 'websocket',
          'Sec-WebSocket-Version': '13',
          'Sec-WebSocket-Key': crypto.randomBytes(16).toString('base64')
        },
        timeout: timeoutMs - 1000
      };
      useTls = false;
      label = `${ip}:${port}`;
    } else {
      return reject(new Error('No valid server connection mode available'));
    }

    const transport = useTls ? https : http;
    let settled = false;
    let sock = null;
    const finish = (err, val) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { if (sock) sock.destroy(); } catch (_) {}
      if (err) reject(err);
      else resolve(val);
    };

    const timer = setTimeout(() => {
      if (handlers.onTimeout) {
        const fallbackVal = handlers.onTimeout();
        if (fallbackVal !== undefined) return finish(null, fallbackVal);
      }
      finish(new Error(`Timed out connecting to ${label}`));
    }, timeoutMs);

    const req = transport.request(reqOpts);
    req.on('upgrade', (_res, socket, head) => {
      sock = socket;
      socket.setNoDelay(true);
      let recvBuf = head && head.length ? Buffer.from(head) : Buffer.alloc(0);
      let fragChunks = [];
      let fragOpcode = 0;

      const processRecvBuf = () => {
        while (recvBuf.length >= 2) {
          const b0 = recvBuf[0];
          const b1 = recvBuf[1];
          const fin = (b0 & 0x80) !== 0;
          const opcode = b0 & 0x0f;
          const masked = (b1 & 0x80) !== 0;
          let payloadLen = b1 & 0x7f;
          let hdrLen = 2;
          if (payloadLen === 126) {
            if (recvBuf.length < 4) return;
            payloadLen = recvBuf.readUInt16BE(2);
            hdrLen = 4;
          } else if (payloadLen === 127) {
            if (recvBuf.length < 10) return;
            payloadLen = Number(recvBuf.readBigUInt64BE(2));
            hdrLen = 10;
          }
          const maskLen = masked ? 4 : 0;
          if (recvBuf.length < hdrLen + maskLen + payloadLen) return;
          let payload = recvBuf.slice(hdrLen + maskLen, hdrLen + maskLen + payloadLen);
          if (masked) {
            const mkey = recvBuf.slice(hdrLen, hdrLen + 4);
            const unmasked = Buffer.alloc(payload.length);
            for (let i = 0; i < payload.length; i++) unmasked[i] = payload[i] ^ mkey[i & 3];
            payload = unmasked;
          }
          recvBuf = recvBuf.slice(hdrLen + maskLen + payloadLen);

          if (opcode === 0x08) {
            socket.destroy();
            return;
          }
          if (opcode === 0x09) {
            try { socket.write(Buffer.from([0x8a, 0x80, 0, 0, 0, 0])); } catch (_) {}
            continue;
          }

          let fullPayload = null;
          let effectiveOp = opcode;
          if (opcode === 0x00) {
            fragChunks.push(payload);
            if (fin) {
              fullPayload = Buffer.concat(fragChunks);
              fragChunks = [];
              effectiveOp = fragOpcode;
            }
          } else if (!fin) {
            fragOpcode = opcode;
            fragChunks = [payload];
          } else {
            fullPayload = payload;
          }

          if (fullPayload && effectiveOp === 0x02) {
            const resp = decodeRustPlusResponseMessage(fullPayload);
            if (resp) handlers.onResponse(resp, { finish });
          }
        }
      };

      try {
        handlers.onOpen(socket, { playerId, playerToken, mode, finish });
      } catch (err) {
        return finish(err);
      }

      if (recvBuf.length > 0) processRecvBuf();
      socket.on('data', (chunk) => {
        recvBuf = Buffer.concat([recvBuf, chunk]);
        processRecvBuf();
      });

      socket.on('error', (err) => finish(err));
      socket.on('close', () => {
        if (handlers.onClose) {
          const fallbackVal = handlers.onClose();
          if (fallbackVal !== undefined) return finish(null, fallbackVal);
        }
        finish(new Error('Rust+ connection closed unexpectedly'));
      });
    });

    req.on('response', (httpRes) => {
      let errBody = '';
      httpRes.on('data', (c) => {
        if (errBody.length < 300) errBody += c;
      });
      httpRes.on('end', () => {
        const sc = httpRes.statusCode || 0;
        if (sc === 401 || sc === 403) {
          finish(
            new Error(
              `${label} returned HTTP ${sc} (session expired or forbidden — re-sign via Step 1: Steam Popup). ${errBody.slice(0, 120)}`
            )
          );
        } else {
          finish(new Error(`${label} rejected WebSocket (HTTP ${sc}): ${errBody.slice(0, 120)}`));
        }
      });
    });

    req.on('error', (err) => finish(err));
    req.on('timeout', () => req.destroy(new Error('WebSocket handshake timeout')));
    req.end();
  });
}

let cachedRustPlusMap = null;
const lastWorkingRustPlusModeByServer = new Map();

function getRustPlusServerKey(cfg) {
  return `${cfg?.serverId || cfg?.ip || 'live'}:${cfg?.port || '28082'}`;
}

function fetchRustPlusSnapshotAttempt(cfg, mode = 'auto', forceMap = false) {
  const serverKey = getRustPlusServerKey(cfg);
  const needMap = Boolean(forceMap) || !cachedRustPlusMap?.buffer || cachedRustPlusMap.serverKey !== serverKey;
  const entityIds = (Array.isArray(squadState.rustPlusTelemetry?.smartDevices) ? squadState.rustPlusTelemetry.smartDevices : [])
    .map((d) => String(d.entityId || '').replace(/[^\d]/g, ''))
    .filter(Boolean)
    .slice(0, 24);

  let infoResult = null;
  let timeResult = null;
  let teamInfoResult = null;
  let teamChatResult = null;
  let mapResult = null;
  let markersResult = null;
  const entityInfoById = {};
  let graceTimer = null;
  let retryMarkersTimer = null;
  let markerError = '';

  const clearAttemptTimers = () => {
    if (graceTimer) { clearTimeout(graceTimer); graceTimer = null; }
    if (retryMarkersTimer) { clearTimeout(retryMarkersTimer); retryMarkersTimer = null; }
  };

  const buildSnapshot = () => ({
    info: infoResult,
    time: timeResult,
    teamInfo: teamInfoResult,
    teamChat: teamChatResult,
    map: mapResult,
    markers: markersResult,
    entityInfoById,
    markerError,
    mode,
    usedProxy: mode !== 'direct'
  });

  return withRustPlusSocket(
    cfg,
    mode,
    {
      onOpen(socket, { playerId, playerToken }) {
        sendRawWsBinary(socket, encodeRustPlusRequest(1, playerId, playerToken, 8)); // getInfo
        sendRawWsBinary(socket, encodeRustPlusRequest(2, playerId, playerToken, 18)); // getMapMarkers
        sendRawWsBinary(socket, encodeRustPlusRequest(3, playerId, playerToken, 9)); // getTime
        sendRawWsBinary(socket, encodeRustPlusRequest(4, playerId, playerToken, 11)); // getTeamInfo
        sendRawWsBinary(socket, encodeRustPlusRequest(5, playerId, playerToken, 12)); // getTeamChat
        if (needMap) {
          sendRawWsBinary(socket, encodeRustPlusRequest(6, playerId, playerToken, 10)); // getMap
        }
        entityIds.forEach((eid, idx) => {
          sendRawWsBinary(socket, encodeRustPlusRequest(100 + idx, playerId, playerToken, 14, { entityId: eid })); // getEntityInfo
        });
        // Auto-retry getMapMarkers once if relay/rate-limit dropped seq 2 during initial burst
        retryMarkersTimer = setTimeout(() => {
          if (markersResult === null && !socket.destroyed) {
            try {
              sendRawWsBinary(socket, encodeRustPlusRequest(92, playerId, playerToken, 18));
            } catch (_) {}
          }
        }, 1800);
      },
      onResponse(resp, { finish }) {
        if (resp.error && (resp.seq === 2 || resp.seq === 92) && !markersResult) {
          markerError = String(resp.error);
          if (resp.seq === 92 || !/rate_limit|throttle/i.test(markerError)) {
            clearAttemptTimers();
            return finish(new Error(`Rust+ getMapMarkers failed (check PlayerToken / pairing): ${markerError}`));
          }
          return;
        }
        if (resp.info) infoResult = resp.info;
        if (resp.time) timeResult = resp.time;
        if (resp.teamInfo) teamInfoResult = resp.teamInfo;
        if (Array.isArray(resp.teamChat)) teamChatResult = resp.teamChat;
        if (resp.map) mapResult = resp.map;
        if (Array.isArray(resp.markers)) markersResult = resp.markers;
        if (resp.entityInfo && typeof resp.seq === 'number' && resp.seq >= 100) {
          const eid = entityIds[resp.seq - 100];
          if (eid) entityInfoById[eid] = resp.entityInfo;
        }

        const allEntitiesDone = entityIds.every((eid) => entityInfoById[eid] !== undefined);
        const allDone =
          markersResult !== null &&
          infoResult !== null &&
          timeResult !== null &&
          teamInfoResult !== null &&
          allEntitiesDone &&
          (!needMap || mapResult !== null);

        if (allDone) {
          clearAttemptTimers();
          return finish(null, buildSnapshot());
        }
        if (markersResult !== null && !graceTimer) {
          graceTimer = setTimeout(() => {
            clearAttemptTimers();
            finish(null, buildSnapshot());
          }, needMap ? 2000 : 600);
        }
      },
      onTimeout() {
        clearAttemptTimers();
        if (markersResult !== null) return buildSnapshot();
        if (markerError) return undefined;
        return undefined;
      },
      onClose() {
        clearAttemptTimers();
        if (markersResult !== null) return buildSnapshot();
        return undefined;
      }
    },
    needMap ? 10500 : 8500
  );
}

async function runRustPlusModes(cfg, runner) {
  const attempts = [];
  const serverKey = getRustPlusServerKey(cfg);
  const preferred = lastWorkingRustPlusModeByServer.get(serverKey);
  if (preferred) {
    if ((preferred === 'socket' && cfg.serverId) || ((preferred === 'proxy' || preferred === 'direct') && cfg.ip)) {
      attempts.push(preferred);
    }
  }
  if (cfg.serverId && cfg.authToken && !attempts.includes('socket')) attempts.push('socket');
  if (cfg.ip && cfg.useProxy && !attempts.includes('proxy')) attempts.push('proxy');
  if (cfg.ip && !attempts.includes('direct')) attempts.push('direct');
  if (cfg.ip && !cfg.useProxy && !attempts.includes('proxy')) attempts.push('proxy');
  if (cfg.serverId && !attempts.includes('socket')) attempts.push('socket');

  let lastErr = new Error('No Rust+ server configured');
  for (const mode of attempts) {
    try {
      const res = await runner(mode);
      lastWorkingRustPlusModeByServer.set(serverKey, mode);
      return res;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

async function fetchRustPlusVendingSnapshot(cfg, forceMap = false) {
  return runRustPlusModes(cfg, (mode) => fetchRustPlusSnapshotAttempt(cfg, mode, forceMap));
}

async function sendRustPlusCommand(cfg, fieldNum, innerBytesOrObj = []) {
  return runRustPlusModes(cfg, (mode) =>
    withRustPlusSocket(
      cfg,
      mode,
      {
        onOpen(socket, { playerId, playerToken }) {
          sendRawWsBinary(socket, encodeRustPlusRequest(1, playerId, playerToken, fieldNum, innerBytesOrObj));
        },
        onResponse(resp, { finish }) {
          if (resp.error) {
            return finish(new Error(`Rust+ RPC rejected: ${resp.error}`));
          }
          return finish(null, resp);
        }
      },
      6500
    )
  );
}

const sentShopStealAlerts = new Set();
const sentWorldEventAlerts = new Set();
const sentWatchlistAlerts = new Set();
const sentSmartAlarmAlerts = new Set();
const sentLowUpkeepAlerts = new Set();
let prevShopOrderSnapshot = new Map();
let hasSeededShopSnapshot = false;
let rustPlusShopInterval = null;
let isRustPlusPolling = false;

const RUST_EVENT_MARKER_META = {
  2: { label: 'Raid Explosion', icon: '💥', color: '#ef4444' },
  4: { label: 'CH47 Chinook', icon: '✈️', color: '#38bdf8' },
  5: { label: 'Cargo Ship', icon: '🚢', color: '#06b6d4' },
  6: { label: 'Locked Crate', icon: '📦', color: '#f59e0b' },
  8: { label: 'Patrol Helicopter', icon: '🚁', color: '#f43f5e' },
  9: { label: 'Travelling Vendor', icon: '🚐', color: '#a3e635' }
};

function formatRustPlusTimeSummary(timeObj) {
  if (!timeObj || typeof timeObj.time !== 'number') return null;
  const rawHour = ((timeObj.time % 24) + 24) % 24;
  const hrs = Math.floor(rawHour);
  const mins = Math.floor((rawHour - hrs) * 60);
  const formatted = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  const sunrise = typeof timeObj.sunrise === 'number' && timeObj.sunrise > 0 ? timeObj.sunrise : 7.0;
  const sunset = typeof timeObj.sunset === 'number' && timeObj.sunset > sunrise ? timeObj.sunset : 19.5;
  const dayLen = typeof timeObj.dayLengthMinutes === 'number' && timeObj.dayLengthMinutes > 5 ? timeObj.dayLengthMinutes : 45;
  const isDay = rawHour >= sunrise && rawHour < sunset;
  let hoursUntil = 0;
  let nextPhase = 'Night';
  if (isDay) {
    hoursUntil = sunset - rawHour;
    nextPhase = 'Night';
  } else {
    hoursUntil = rawHour >= sunset ? 24 - rawHour + sunrise : sunrise - rawHour;
    nextPhase = 'Day';
  }
  const minutesPerGameHour = dayLen / 24;
  const minutesUntilChange = Math.max(1, Math.round(hoursUntil * minutesPerGameHour));
  return {
    time: Number(rawHour.toFixed(2)),
    sunrise: Number(sunrise.toFixed(2)),
    sunset: Number(sunset.toFixed(2)),
    dayLengthMinutes: Math.round(dayLen),
    formatted,
    isDay,
    nextPhase,
    minutesUntilChange
  };
}

function aggregateEntityStorageItems(rawItems) {
  const byKey = new Map();
  for (const it of rawItems || []) {
    if (!it || !it.quantity) continue;
    const key = `${it.itemId}:${it.itemIsBlueprint ? 1 : 0}`;
    const prev = byKey.get(key);
    if (prev) prev.quantity += Number(it.quantity) || 0;
    else {
      byKey.set(key, {
        itemId: it.itemId,
        name: it.name || resolveRustItemName(it.itemId),
        shortname: it.shortname || '',
        quantity: Number(it.quantity) || 0,
        isBlueprint: Boolean(it.itemIsBlueprint)
      });
    }
  }
  return Array.from(byKey.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 18);
}

async function applyVendingSnapshotToState(snapshot, cfg) {
  const prevInfo = squadState.rustPlusTelemetry?.serverInfo || {};
  const mapSize = Number(snapshot?.info?.mapSize || cfg?.mapSize || prevInfo.mapSize || 4250);
  const serverKey = `${cfg?.serverId || cfg?.ip || 'live'}:${cfg?.port || '28082'}`;
  const rawMarkers = Array.isArray(snapshot?.markers) ? snapshot.markers : [];
  const byType = {};
  for (const m of rawMarkers) {
    const tk = String(m?.type ?? 'u');
    byType[tk] = (byType[tk] || 0) + 1;
  }
  const vmMarkers = rawMarkers.filter((m) => m.type === 3);

  const liveShops = [];
  const vendingPins = [];
  const newSteals = [];
  const newWatchlistHits = [];
  const nextOrderSnapshot = new Map();
  const watchlist = Array.isArray(squadState.shopWatchlist) ? squadState.shopWatchlist : [];
  const nowTs = Date.now();

  for (const mk of vmMarkers) {
    const nx = Math.min(1, Math.max(0, mk.x / mapSize));
    const ny = Math.min(1, Math.max(0, 1 - mk.y / mapSize));
    const wx = Number((mk.x - mapSize / 2).toFixed(1));
    const wy = Number((mk.y - mapSize / 2).toFixed(1));
    const grid = worldGridLabelFromRustPlus(mk.x, mk.y, mapSize);
    const shopName = String(mk.name || '').trim() || `Vending [${grid}]`;
    const pinOrders = [];
    let inStockCount = 0;
    let stealCount = 0;

    for (const so of mk.sellOrders || []) {
      const buyInfo = resolveRustItemInfo(so.itemId);
      const buyItem = so.itemIsBlueprint ? `${buyInfo.name} (BP)` : buyInfo.name;
      const buyQty = Math.max(1, Number(so.quantity) || 1);
      const payInfo = resolveRustItemInfo(so.currencyId);
      const payItem = payInfo.name;
      const payQty = Math.max(1, Number(so.costPerItem) || 1);
      const inStock = Math.max(0, Number(so.amountInStock) || 0);
      if (inStock > 0) inStockCount++;
      const id = `rp-${mk.id}-${so.itemId}-${so.currencyId}`;

      const prevOrder = prevShopOrderSnapshot.get(id);
      nextOrderSnapshot.set(id, { inStock, payQty });
      let stockDelta = '';
      if (hasSeededShopSnapshot) {
        if (!prevOrder && inStock > 0) stockDelta = 'new';
        else if (prevOrder && inStock > prevOrder.inStock) stockDelta = `+${inStock - prevOrder.inStock}`;
        else if (prevOrder && inStock < prevOrder.inStock && inStock > 0) stockDelta = `${inStock - prevOrder.inStock}`;
        else if (prevOrder && payQty < prevOrder.payQty) stockDelta = 'priceDrop';
      }

      let isSteal = false;
      const lowerName = buyItem.toLowerCase();
      if (inStock > 0 && (payItem === 'Sulfur' || payItem === 'Sulfur Ore')) {
        const rule = BACKEND_STEAL_LIMITS.find((r) => lowerName.includes(r.match));
        const effectiveSulfur = payItem === 'Sulfur Ore' ? payQty * 0.9 : payQty;
        if (rule && effectiveSulfur / buyQty <= rule.maxSulfur) {
          isSteal = true;
          stealCount++;
          const stealKey = `${shopName}:${grid}:${buyItem}:${payQty}:${payItem}`;
          if (!sentShopStealAlerts.has(stealKey)) {
            sentShopStealAlerts.add(stealKey);
            newSteals.push({ id, shopName, grid, buyQty, buyItem, payQty, payItem, inStock, why: rule.why });
          }
        }
      }

      let watchlistMatch = false;
      if (inStock > 0 && watchlist.length > 0) {
        for (const wl of watchlist) {
          const q = String(wl?.query || '').trim().toLowerCase();
          if (!q || !lowerName.includes(q)) continue;
          const maxP = Number(wl.maxPrice) || 0;
          if (maxP > 0 && payQty > maxP) continue;
          watchlistMatch = true;
          const wlKey = `${serverKey}:${id}:${payQty}:${q}`;
          if (!sentWatchlistAlerts.has(wlKey)) {
            sentWatchlistAlerts.add(wlKey);
            newWatchlistHits.push({ query: wl.query, shopName, grid, buyQty, buyItem, payQty, payItem, inStock });
          }
          break;
        }
      }

      const entry = {
        id,
        markerId: String(mk.id),
        liveSource: 'rustplus',
        shopName,
        buyQty,
        buyItem,
        buyShort: buyInfo.shortname,
        payQty,
        payItem,
        payShort: payInfo.shortname,
        inStock,
        stockDelta,
        watchlistMatch,
        wx,
        wy,
        nx: Number(nx.toFixed(4)),
        ny: Number(ny.toFixed(4)),
        isBlueprint: Boolean(so.itemIsBlueprint),
        category: inferShopCategoryFromName(buyItem),
        grid,
        updatedAt: nowTs,
        notes: `Live Rust+ vending "${shopName}" at [${grid}] — ${inStock > 0 ? `${inStock} in stock` : 'SOLD OUT'}.`
      };
      liveShops.push(entry);
      pinOrders.push({ id, buyQty, buyItem, payQty, payItem, inStock, isSteal, watchlistMatch });
    }

    vendingPins.push({
      id: `rp-pin-${mk.id}`,
      markerId: String(mk.id),
      name: shopName,
      grid,
      wx,
      wy,
      nx: Number(nx.toFixed(4)),
      ny: Number(ny.toFixed(4)),
      inStockCount,
      totalOrders: pinOrders.length,
      stealCount,
      orders: pinOrders
    });
  }
  if (vmMarkers.length > 0) {
    prevShopOrderSnapshot = nextOrderSnapshot;
    hasSeededShopSnapshot = true;
  }

  // Decode Live World Events (Cargo, Patrol Heli, CH47, Locked Crate, Explosion, Travelling Vendor, Named Event Zones)
  const liveEvents = [];
  const newEvents = [];
  for (const mk of rawMarkers) {
    const meta = RUST_EVENT_MARKER_META[mk.type] || (mk.type === 7 && String(mk.name || '').trim()
      ? { label: String(mk.name).trim(), icon: '📡', color: '#a855f7' }
      : null);
    if (!meta) continue;
    const nx = Math.min(1, Math.max(0, mk.x / mapSize));
    const ny = Math.min(1, Math.max(0, 1 - mk.y / mapSize));
    const wx = Number((mk.x - mapSize / 2).toFixed(1));
    const wy = Number((mk.y - mapSize / 2).toFixed(1));
    const grid = worldGridLabelFromRustPlus(mk.x, mk.y, mapSize);
    const evt = {
      id: `${mk.type}-${mk.id}`,
      markerId: String(mk.id),
      type: mk.type,
      label: mk.name || meta.label,
      icon: meta.icon,
      color: meta.color,
      wx,
      wy,
      nx: Number(nx.toFixed(4)),
      ny: Number(ny.toFixed(4)),
      grid,
      rotation: Number(mk.rotation || 0),
      radius: Number(mk.radius || 0)
    };
    liveEvents.push(evt);
    const evtAlertKey = `${serverKey}:${mk.type}:${mk.id}`;
    if ([2, 5, 6, 8].includes(mk.type) && !sentWorldEventAlerts.has(evtAlertKey)) {
      sentWorldEventAlerts.add(evtAlertKey);
      newEvents.push(evt);
    }
  }

  // Cache AppMap JPEG image in RAM if returned
  let prevMapMeta = squadState.rustPlusTelemetry?.mapMeta || null;
  if (snapshot?.map && snapshot.map.jpgImage && snapshot.map.jpgImage.length > 100) {
    cachedRustPlusMap = {
      serverKey,
      buffer: Buffer.from(snapshot.map.jpgImage),
      width: Number(snapshot.map.width || 1000),
      height: Number(snapshot.map.height || 1000),
      oceanMargin: Number(snapshot.map.oceanMargin || 0),
      mapSize,
      updatedAt: nowTs
    };
    prevMapMeta = {
      width: cachedRustPlusMap.width,
      height: cachedRustPlusMap.height,
      oceanMargin: cachedRustPlusMap.oceanMargin,
      mapSize,
      monumentsCount: Array.isArray(snapshot.map.monuments) ? snapshot.map.monuments.length : 0,
      monuments: (snapshot.map.monuments || []).map((m) => ({
        token: m.token,
        wx: Number((m.x - mapSize / 2).toFixed(1)),
        wy: Number((m.y - mapSize / 2).toFixed(1)),
        grid: worldGridLabelFromRustPlus(m.x, m.y, mapSize)
      })),
      hasImage: true,
      imageUrl: `/api/shops/rustplus/map-image?v=${nowTs}`
    };
  } else if (prevMapMeta) {
    prevMapMeta = {
      ...prevMapMeta,
      hasImage: Boolean(cachedRustPlusMap?.buffer),
      imageUrl: cachedRustPlusMap?.buffer ? `/api/shops/rustplus/map-image?v=${cachedRustPlusMap.updatedAt}` : ''
    };
  }

  // Team Members & Notes
  let teamMembers = Array.isArray(squadState.rustPlusTelemetry?.teamMembers) ? squadState.rustPlusTelemetry.teamMembers : [];
  let mapNotes = Array.isArray(squadState.rustPlusTelemetry?.mapNotes) ? squadState.rustPlusTelemetry.mapNotes : [];
  if (snapshot?.teamInfo && Array.isArray(snapshot.teamInfo.members)) {
    const leaderId = String(snapshot.teamInfo.leaderSteamId || '0');
    teamMembers = snapshot.teamInfo.members.map((m) => {
      const nx = Math.min(1, Math.max(0, m.x / mapSize));
      const ny = Math.min(1, Math.max(0, 1 - m.y / mapSize));
      return {
        steamId: String(m.steamId),
        name: m.name || 'Teammate',
        wx: Number((m.x - mapSize / 2).toFixed(1)),
        wy: Number((m.y - mapSize / 2).toFixed(1)),
        nx: Number(nx.toFixed(4)),
        ny: Number(ny.toFixed(4)),
        grid: worldGridLabelFromRustPlus(m.x, m.y, mapSize),
        isOnline: Boolean(m.isOnline),
        isAlive: Boolean(m.isAlive),
        spawnTime: Number(m.spawnTime || 0),
        deathTime: Number(m.deathTime || 0),
        isLeader: String(m.steamId) === leaderId
      };
    });
    const formatNote = (n, isLeader) => {
      const nx = Math.min(1, Math.max(0, n.x / mapSize));
      const ny = Math.min(1, Math.max(0, 1 - n.y / mapSize));
      return {
        type: n.type || 0,
        icon: n.icon || 0,
        colourIndex: n.colourIndex || 0,
        color: n.colourIndex || 0,
        isLeader: Boolean(isLeader),
        label: n.label || '',
        wx: Number((n.x - mapSize / 2).toFixed(1)),
        wy: Number((n.y - mapSize / 2).toFixed(1)),
        nx: Number(nx.toFixed(4)),
        ny: Number(ny.toFixed(4)),
        grid: worldGridLabelFromRustPlus(n.x, n.y, mapSize)
      };
    };
    mapNotes = [
      ...(snapshot.teamInfo.mapNotes || []).map((n) => formatNote(n, false)),
      ...(snapshot.teamInfo.leaderMapNotes || []).map((n) => formatNote(n, true))
    ];
  }

  let teamChat = Array.isArray(squadState.rustPlusTelemetry?.teamChat) ? squadState.rustPlusTelemetry.teamChat : [];
  if (Array.isArray(snapshot?.teamChat)) {
    teamChat = snapshot.teamChat.slice(-30);
  }

  const triggeredAlarms = [];
  const lowUpkeepDevices = [];
  const smartDevices = (Array.isArray(squadState.rustPlusTelemetry?.smartDevices) ? squadState.rustPlusTelemetry.smartDevices : []).map((dev) => {
    const eid = String(dev.entityId || '').replace(/[^\d]/g, '');
    const liveEnt = snapshot?.entityInfoById?.[eid];
    if (!liveEnt) return dev;
    const mappedType = liveEnt.type === 2 ? 'alarm' : liveEnt.type === 3 ? 'storage' : 'switch';
    const nextActive = Boolean(liveEnt.value);
    if (mappedType === 'alarm' && nextActive && !dev.active) {
      const alarmKey = `${serverKey}:alarm:${eid}:${Math.floor(nowTs / 30000)}`;
      if (!sentSmartAlarmAlerts.has(alarmKey)) {
        sentSmartAlarmAlerts.add(alarmKey);
        triggeredAlarms.push({ entityId: eid, name: dev.name || `Alarm #${eid}` });
      }
    }
    const protectionExpiry = Number(liveEnt.protectionExpiry || 0);
    if (mappedType === 'storage' && liveEnt.hasProtection && protectionExpiry > 0) {
      const remSec = protectionExpiry - Math.floor(nowTs / 1000);
      if (remSec > 0 && remSec < 21600) {
        const ukKey = `${serverKey}:upkeep:${eid}:${Math.floor(protectionExpiry / 3600)}`;
        if (!sentLowUpkeepAlerts.has(ukKey)) {
          sentLowUpkeepAlerts.add(ukKey);
          lowUpkeepDevices.push({ entityId: eid, name: dev.name || `TC #${eid}`, remHours: (remSec / 3600).toFixed(1) });
        }
      }
    }
    const mergedItems = aggregateEntityStorageItems(liveEnt.items || []);
    return {
      ...dev,
      entityType: mappedType,
      active: nextActive,
      capacity: Number(liveEnt.capacity || 0),
      hasProtection: Boolean(liveEnt.hasProtection),
      protectionExpiry: Number(liveEnt.protectionExpiry || 0),
      items: mergedItems,
      lastCheckedAt: nowTs,
      ...(mappedType === 'alarm' && nextActive ? { lastTriggeredAt: nowTs } : {})
    };
  });

  const timeSummary = snapshot?.time ? formatRustPlusTimeSummary(snapshot.time) : squadState.rustPlusTelemetry?.time || null;
  const nextServerInfo = {
    ...prevInfo,
    ...(snapshot?.info || {}),
    mapSize
  };

  const manualShops = (Array.isArray(squadState.customShops) ? squadState.customShops : []).filter(
    (cs) => cs && cs.liveSource !== 'rustplus'
  );
  const markerSummary = {
    total: rawMarkers.length,
    byType,
    vendingCount: vmMarkers.length,
    ordersCount: liveShops.length,
    eventsCount: liveEvents.length,
    mode: snapshot?.mode || 'auto',
    markerError: snapshot?.markerError || '',
    updatedAt: nowTs
  };

  squadState.customShops = [...liveShops, ...manualShops];
  squadState.rustPlusTelemetry = {
    serverInfo: nextServerInfo,
    time: timeSummary,
    mapMeta: prevMapMeta,
    liveEvents,
    vendingPins,
    teamMembers,
    mapNotes,
    teamChat,
    smartDevices,
    markerSummary
  };
  squadState.rustPlusShopConfig = {
    ...DEFAULT_STATE.rustPlusShopConfig,
    ...(squadState.rustPlusShopConfig || {}),
    ...(cfg || {}),
    mapSize,
    ...(nextServerInfo.name ? { serverName: nextServerInfo.name } : {}),
    lastPolledAt: nowTs,
    lastStatus: `🟢 Live Rust+ (${snapshot?.mode || 'relay'}) • ${nextServerInfo.name || 'Server'} • 👥 ${nextServerInfo.players ?? '?'}/${nextServerInfo.maxPlayers ?? '?'}${timeSummary ? ` • 🕒 ${timeSummary.formatted}` : ''} • 🛒 ${vmMarkers.length} shops (${liveShops.length} deals) • ⚡ ${liveEvents.length} events • 📍 ${rawMarkers.length} markers`
  };
  console.log(`[Rust+] Sync OK (${snapshot?.mode}): server=${nextServerInfo.name || serverKey} markers=${rawMarkers.length} byType=${JSON.stringify(byType)} shops=${vmMarkers.length} orders=${liveShops.length} events=${liveEvents.length} team=${teamMembers.length}`);
  saveState(squadState);
  broadcastState('state_update');

  const settings = resolveDiscordSettings();
  const hasTarget = Boolean(
    (settings.webhookUrl && settings.webhookUrl.startsWith('https://discord')) ||
      (settings.botToken && (settings.channelId || settings.dmUserId))
  );
  if (hasTarget) {
    if (squadState.rustPlusShopConfig.discordAlertSteals && newSteals.length > 0) {
      const topList = newSteals
        .slice(0, 5)
        .map((s) => `• **${s.buyQty}× ${s.buyItem}** for **${s.payQty} ${s.payItem}** at **[${s.grid}]** ("${s.shopName}" • ${s.inStock} stock)`)
        .join('\n');
      sendDiscordNotification({
        title: `🔥 S-Tier Player Shop Steal Live on Map!`,
        description: `${topList}\n\nOpen **📍 Base & Trade Hub → 🛒 Trades** to review deals.`,
        color: 0xa855f7
      }).catch(() => {});
    }
    if (squadState.rustPlusShopConfig.discordAlertEvents && newEvents.length > 0) {
      const evtLines = newEvents.slice(0, 4).map((e) => `• ${e.icon} **${e.label}** spotted at **[${e.grid}]**`).join('\n');
      sendDiscordNotification({
        title: `📡 Live Rust+ World Event Alert`,
        description: `${evtLines}${nextServerInfo.name ? `\n\nServer: **${nextServerInfo.name}**` : ''}`,
        color: 0x38bdf8
      }).catch(() => {});
    }
    if (newWatchlistHits.length > 0) {
      const wlLines = newWatchlistHits
        .slice(0, 5)
        .map((w) => `• **[${w.query}]** → **${w.buyQty}× ${w.buyItem}** for **${w.payQty} ${w.payItem}** at **[${w.grid}]** ("${w.shopName}", ${w.inStock} left)`)
        .join('\n');
      sendDiscordNotification({
        title: `🎯 Shop Watchlist Item Live on Map!`,
        description: `${wlLines}`,
        color: 0x22c55e
      }).catch(() => {});
    }
    if (triggeredAlarms.length > 0) {
      const alarmLines = triggeredAlarms.map((a) => `• 🚨 **${a.name}** (ID: ${a.entityId})`).join('\n');
      sendDiscordNotification({
        title: `🚨 BASE SMART ALARM TRIGGERED!`,
        description: `${alarmLines}${nextServerInfo.name ? `\n\nServer: **${nextServerInfo.name}**` : ''}`,
        color: 0xef4444
      }).catch(() => {});
    }
    if (lowUpkeepDevices.length > 0) {
      const ukLines = lowUpkeepDevices.map((d) => `• ⏳ **${d.name}** — **${d.remHours}h** upkeep left!`).join('\n');
      sendDiscordNotification({
        title: `⚠️ TC LOW UPKEEP WARNING (< 6h Remaining)`,
        description: `${ukLines}${nextServerInfo.name ? `\n\nServer: **${nextServerInfo.name}**` : ''}`,
        color: 0xf59e0b
      }).catch(() => {});
    }
  }

  return {
    ok: true,
    shopsCount: vmMarkers.length,
    ordersCount: liveShops.length,
    eventsCount: liveEvents.length,
    teamCount: teamMembers.length,
    stealsCount: newSteals.length,
    lastStatus: squadState.rustPlusShopConfig.lastStatus
  };
}

function configureRustPlusShopPoller() {
  if (rustPlusShopInterval) {
    clearInterval(rustPlusShopInterval);
    rustPlusShopInterval = null;
  }
  const cfg = squadState.rustPlusShopConfig || {};
  if (cfg.autoPoll && (cfg.ip || cfg.serverId) && cfg.playerId && cfg.playerToken) {
    rustPlusShopInterval = setInterval(async () => {
      if (isRustPlusPolling) return;
      isRustPlusPolling = true;
      try {
        const snap = await fetchRustPlusVendingSnapshot(squadState.rustPlusShopConfig);
        await applyVendingSnapshotToState(snap, squadState.rustPlusShopConfig);
      } catch (err) {
        const msg = String(err.message || '');
        const isAuthDenied = /HTTP 401|HTTP 403|Forbidden/i.test(msg);
        if (isAuthDenied) {
          squadState.rustPlusShopConfig.autoPoll = false;
          if (rustPlusShopInterval) {
            clearInterval(rustPlusShopInterval);
            rustPlusShopInterval = null;
          }
          squadState.rustPlusShopConfig.lastStatus = `⚠️ ${msg}`;
        } else {
          squadState.rustPlusShopConfig.lastStatus = `⚠️ Poll error: ${msg}`;
        }
        saveState(squadState);
        broadcastState('state_update');
      } finally {
        isRustPlusPolling = false;
      }
    }, 15000);
  }
}

// ============================================================================
// FACEPUNCH STEAM POPUP OAUTH EXCHANGE & CLOUD PAIRING HISTORY SYNC
// ============================================================================
let rustPlusCloudSyncInterval = null;

function postJsonHttps(urlStr, bodyObj, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const payload = JSON.stringify(bodyObj || {});
    const isFacepunch = parsed.hostname.endsWith('facepunch.com');
    const req = https.request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          ...(isFacepunch
            ? {
                Origin: 'https://app.playrust.com',
                Referer: 'https://app.playrust.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
              }
            : { 'User-Agent': 'RustTacticalCompanion/2.2' }),
          ...headers
        },
        timeout: 12000
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            const parsedJson = data ? JSON.parse(data) : {};
            if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsedJson);
            else reject(new Error(parsedJson?.message || parsedJson?.error || `HTTP ${res.statusCode}: ${data.slice(0, 140)}`));
          } catch (_) {
            if (res.statusCode >= 200 && res.statusCode < 300) resolve({ raw: data });
            else reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 140)}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error('Request timeout'));
    });
    req.write(payload);
    req.end();
  });
}

async function exchangeFacepunchCodeForToken(code) {
  try {
    const res = await postJsonHttps('https://companion-rust.facepunch.com/login/exchange', {
      code: String(code || '').trim()
    });
    const token = res?.token || res?.Token || res?.auth_token || res?.rustplus_auth_token || '';
    const steamId = String(res?.steamId || res?.SteamId || res?.steam_id || '');
    if (!token) {
      throw new Error('Facepunch /login/exchange did not return a valid token.');
    }
    return { token, steamId };
  } catch (err) {
    if (String(err.message || '').includes('HTTP 404') || String(err.message || '').includes('HTTP 400')) {
      const savedToken = squadState.rustPlusShopConfig?.authToken;
      if (savedToken) {
        return {
          token: savedToken,
          steamId: squadState.rustPlusShopConfig?.steamId || extractSteamIdFromJwt(savedToken),
          reusedSession: true
        };
      }
      throw new Error(
        'Login #code= was already consumed or expired (HTTP 404). Click "Step 1: Sign In with Steam (Popup)" to get a fresh #code= URL.'
      );
    }
    throw err;
  }
}

async function resolveFacepunchAuthInput(rawInput) {
  const str = String(rawInput || '').trim();
  if (!str) return null;

  // 1. Direct JSON object (rustplusjs-config.json, {"code":"..."}, or server pairing object)
  try {
    const j = JSON.parse(str);
    if (j.ip && j.playerToken) {
      return {
        token: j.rustplus_auth_token || j.Token || j.token || '',
        steamId: String(j.playerId || j.steam_id || j.SteamId || ''),
        directServer: {
          serverName: j.serverName || j.name || `${j.ip}:${j.port || '28082'}`,
          ip: String(j.ip),
          port: String(j.port || '28082'),
          playerId: String(j.playerId || j.steam_id || ''),
          playerToken: String(j.playerToken)
        }
      };
    }
    if (j.Token || j.token || j.rustplus_auth_token || j.AuthToken) {
      return {
        token: j.Token || j.token || j.rustplus_auth_token || j.AuthToken,
        steamId: String(j.SteamId || j.steamId || j.steam_id || '')
      };
    }
    if (j.code || j.Code) {
      return await exchangeFacepunchCodeForToken(j.code || j.Code);
    }
  } catch (_) {}

  // 2. Popup Redirect URL containing #code=..., ?code=..., or ?token=...
  const codeMatch = str.match(/[?#&]code=([^&#\s"']+)/i);
  if (codeMatch && codeMatch[1]) {
    return await exchangeFacepunchCodeForToken(decodeURIComponent(codeMatch[1]));
  }
  const urlTokenMatch = str.match(/[?#&](?:token|auth_token)=([^&#\s"']+)/i);
  const urlSteamMatch = str.match(/[?#&](?:steamId|steam_id)=(\d+)/i);
  if (urlTokenMatch && urlTokenMatch[1]) {
    return {
      token: decodeURIComponent(urlTokenMatch[1]),
      steamId: urlSteamMatch ? urlSteamMatch[1] : ''
    };
  }

  // 3. Extracted from HTML source
  const tokenMatch = str.match(/["'](?:Token|rustplus_auth_token)["']\s*:\s*["']([^"']+)["']/i);
  const steamMatch = str.match(/["'](?:SteamId|steam_id)["']\s*:\s*["']?(\d+)["']?/i);
  if (tokenMatch) {
    return { token: tokenMatch[1], steamId: steamMatch ? steamMatch[1] : '' };
  }

  // 4. Raw JWT token or exchange code
  if (!str.includes(' ') && !str.includes('<html')) {
    if (str.length > 45 && str.includes('.')) {
      return { token: str, steamId: '' };
    }
    if (str.length >= 10 && str.length <= 120) {
      try {
        return await exchangeFacepunchCodeForToken(str);
      } catch (_) {
        return { token: str, steamId: '' };
      }
    }
  }
  return null;
}

async function registerFacepunchWebPush(authToken) {
  let token = authToken;
  // Full 4-Step Android Firebase (FIS_v2) + C2DM + Expo Registration (PushKind: 3)
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
      const fidBytes = crypto.randomBytes(17);
      fidBytes[0] = 0b01110000 | (fidBytes[0] & 0b00001111);
      const fid = fidBytes.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '').slice(0, 22);

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
        const c2dmPayload = new URLSearchParams({
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
        }).toString();

        const c2dmRaw = await new Promise((resolve, reject) => {
          const req = https.request(
            {
              hostname: 'android.clients.google.com',
              path: '/c2dm/register3',
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(c2dmPayload),
                'User-Agent': 'okhttp/4.9.2',
                Authorization: `AidLogin ${androidId}:${securityToken}`
              },
              timeout: 12000
            },
            (res) => {
              let data = '';
              res.on('data', (c) => (data += c));
              res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) resolve(data);
                else reject(new Error(`C2DM HTTP ${res.statusCode}`));
              });
            }
          );
          req.on('error', reject);
          req.write(c2dmPayload);
          req.end();
        });

        const fcmToken = c2dmRaw.startsWith('token=') ? c2dmRaw.replace('token=', '').trim() : '';
        if (fcmToken) {
          const deviceId = crypto.randomUUID ? crypto.randomUUID() : `rustplus-${Date.now()}`;
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
            const regRes = await postJsonHttps(
              'https://companion-rust.facepunch.com/api/push/register',
              {
                AuthToken: token,
                DeviceId: deviceId,
                PushKind: 3,
                PushToken: expoPushToken
              },
              { Authorization: `Bearer ${token}` }
            );
            if (regRes && typeof regRes.token === 'string' && regRes.token) {
              token = regRes.token;
            }
            return token;
          }
        }
      }
    }
  } catch (err) {
    console.log('[Rust+ Push] Expo registration fallback:', err.message);
  }

  // Web PushKind.Null = 2 fallback
  try {
    const webDeviceId = 'rustplus-' + (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
    const regRes = await postJsonHttps(
      'https://companion-rust.facepunch.com/api/push/register',
      {
        AuthToken: token,
        DeviceId: webDeviceId,
        PushKind: 2,
        PushToken: 'null'
      },
      { Authorization: `Bearer ${token}` }
    );
    if (regRes && typeof regRes.token === 'string' && regRes.token) {
      token = regRes.token;
    }
  } catch (_) {}
  return token;
}

function extractSteamIdFromJwt(token) {
  try {
    const parts = String(token || '').split('.');
    if (parts.length < 2) return '';
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    const sid = json.steamId || json.steam_id || json.sub || json.userId || '';
    return /^\d{15,22}$/.test(String(sid)) ? String(sid) : '';
  } catch (_) {
    return '';
  }
}

function tryParseJsonDeep(val, depth = 0) {
  if (depth > 3 || val === null || val === undefined) return null;
  if (typeof val === 'string') {
    const s = val.trim();
    if (!s.startsWith('{') && !s.startsWith('[')) return null;
    try {
      return tryParseJsonDeep(JSON.parse(s), depth + 1);
    } catch (_) {
      return null;
    }
  }
  return typeof val === 'object' ? val : null;
}

function extractServerPairingFromHistoryItem(item, fallbackSteamId = '') {
  if (!item || typeof item !== 'object') return null;
  const candidates = [
    item.data?.body,
    item.data?.data,
    item.data,
    item.body,
    item.payload,
    item
  ];
  for (const cand of candidates) {
    const parsed = tryParseJsonDeep(cand);
    if (!parsed || typeof parsed !== 'object') continue;
    const obj = parsed.body && typeof parsed.body === 'object' ? parsed.body : parsed;
    const ip = obj.ip || obj.IP || obj.host || '';
    const serverId = obj.id || obj.serverId || item.serverId || '';
    const playerToken = obj.playerToken ?? obj.PlayerToken;
    if ((ip || serverId) && playerToken !== undefined && playerToken !== null && String(playerToken) !== '') {
      const port = String(obj.port || obj.Port || '28082');
      const pid = String(obj.playerId || obj.PlayerId || obj.steamId || obj.SteamId || item.steamId || fallbackSteamId || '');
      const cleanSid = String(serverId || (ip ? `${ip}:${port}` : ''));
      const name = String(obj.name || obj.serverName || item.data?.title || item.title || (ip ? `${ip}:${port}` : cleanSid));
      return {
        id: cleanSid,
        serverId: String(serverId || ''),
        key: cleanSid,
        serverName: name,
        type: String(obj.type || (obj.entityId ? 'entity' : 'server')),
        entityId: obj.entityId ? String(obj.entityId) : '',
        entityName: String(obj.entityName || obj.name || item.data?.title || 'Smart Device'),
        entityType: obj.entityType !== undefined ? String(obj.entityType) : '',
        ip: String(ip || ''),
        port,
        playerId: pid,
        playerToken: String(playerToken),
        pairedAt: Date.now()
      };
    }
  }
  return null;
}

async function fetchSyncDataServersFromFacepunch(token, fallbackSteamId = '') {
  try {
    const res = await postJsonHttps(
      'https://companion-rust.facepunch.com/api/syncData',
      { AuthToken: token },
      { Authorization: `Bearer ${token}` }
    );
    const rawPayload = res?.payload || res?.Payload;
    if (!rawPayload) return [];
    const parsed = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
    const rawServers = Array.isArray(parsed?.servers)
      ? parsed.servers
      : Array.isArray(parsed?.serverList?.servers)
        ? parsed.serverList.servers
        : [];
    const out = [];
    for (const s of rawServers) {
      if (!s || typeof s !== 'object') continue;
      const ip = String(s.ip || '');
      const sid = String(s.id || s.serverId || '');
      const playerToken = s.playerToken ?? s.token;
      if ((!ip && !sid) || playerToken === undefined || playerToken === null || String(playerToken) === '') continue;
      const port = String(s.port || '28082');
      const key = sid || `${ip}:${port}`;
      out.push({
        id: key,
        serverId: sid,
        key,
        serverName: String(s.name || s.serverName || key),
        type: 'server',
        ip,
        port,
        playerId: String(s.playerId || fallbackSteamId || ''),
        playerToken: String(playerToken),
        pairedAt: Date.now()
      });
    }
    return out;
  } catch (_) {
    return [];
  }
}

async function syncPairedServersFromFacepunchCloud(authToken, isBackground = false) {
  const token = authToken || squadState.rustPlusShopConfig?.authToken;
  if (!token) return { serversFound: 0, historyItemsCount: 0, pairedServers: [], activeServer: null };

  const cfg = squadState.rustPlusShopConfig || { ...DEFAULT_STATE.rustPlusShopConfig };
  const jwtSteamId = cfg.steamId || extractSteamIdFromJwt(token);

  let res = null;
  let syncServers = [];
  try {
    [res, syncServers] = await Promise.all([
      postJsonHttps(
        'https://companion-rust.facepunch.com/api/history/read',
        { AuthToken: token },
        { Authorization: `Bearer ${token}` }
      ),
      fetchSyncDataServersFromFacepunch(token, jwtSteamId)
    ]);
  } catch (err) {
    if (/401|403|Forbidden/i.test(String(err.message || ''))) {
      throw new Error(
        'Facepunch Cloud returned HTTP 403 Forbidden (Steam session expired or rate-limited). Click "Step 1: Sign In with Steam (Popup)", copy the #code= URL, and click "Step 2: Auto-Paste & Connect".'
      );
    }
    throw err;
  }

  const notifications = Array.isArray(res?.entries)
    ? res.entries
    : Array.isArray(res?.notifications)
      ? res.notifications
      : Array.isArray(res?.messages)
        ? res.messages
        : Array.isArray(res?.history)
          ? res.history
          : Array.isArray(res)
            ? res
            : [];

  const sorted = [...notifications].sort(
    (a, b) => Number(a.notificationId || a.id || 0) - Number(b.notificationId || b.id || 0)
  );
  const existing = Array.isArray(cfg.pairedServers) ? [...cfg.pairedServers] : [];

  const upsertServer = (srv) => {
    const key = srv.serverId || srv.id || (srv.ip ? `${srv.ip}:${srv.port}` : '');
    const prevIdx = existing.findIndex(
      (s) =>
        (key && (s.serverId === key || s.id === key || s.key === key)) ||
        (srv.ip && s.ip === srv.ip && String(s.port) === String(srv.port))
    );
    const prev = prevIdx >= 0 ? existing[prevIdx] : null;
    const isNewOrUpdated = !prev || String(prev.playerToken) !== String(srv.playerToken);
    if (prevIdx >= 0) existing[prevIdx] = { ...prev, ...srv, key };
    else existing.unshift({ ...srv, key });
    return isNewOrUpdated;
  };

  let serversFound = 0;
  let newestServer = null;
  let maxNid = Number(cfg.lastHistoryNotificationId || 0);

  for (const sSrv of syncServers) {
    const changed = upsertServer(sSrv);
    serversFound++;
    if (!isBackground || changed) {
      if (!newestServer) newestServer = sSrv;
    }
  }

  const smartDevices = Array.isArray(squadState.rustPlusTelemetry?.smartDevices)
    ? [...squadState.rustPlusTelemetry.smartDevices]
    : [];

  for (const item of sorted) {
    const nid = Number(item.notificationId || item.id || 0);
    if (nid > maxNid) maxNid = nid;

    const srv = extractServerPairingFromHistoryItem(item, jwtSteamId);
    if (!srv) continue;

    if (srv.type === 'entity' && srv.entityId) {
      const idx = smartDevices.findIndex((d) => String(d.entityId) === String(srv.entityId));
      const cleanDev = {
        entityId: String(srv.entityId),
        name: srv.entityName || srv.serverName || `Entity #${srv.entityId}`,
        entityType: srv.entityType === '2' || /alarm/i.test(srv.entityName) ? 'alarm' : srv.entityType === '3' ? 'storage' : 'switch',
        serverId: srv.serverId || '',
        ip: srv.ip || '',
        port: srv.port || '28082',
        active: idx >= 0 ? Boolean(smartDevices[idx].active) : false,
        pairedAt: Date.now()
      };
      if (idx >= 0) smartDevices[idx] = { ...smartDevices[idx], ...cleanDev };
      else smartDevices.unshift(cleanDev);
      continue;
    }

    const isNewOrUpdated = upsertServer(srv);
    serversFound++;
    if (!isBackground || isNewOrUpdated) {
      if (srv.type === 'server' || !newestServer) {
        newestServer = srv;
      }
    }
  }

  squadState.rustPlusTelemetry = {
    ...DEFAULT_STATE.rustPlusTelemetry,
    ...(squadState.rustPlusTelemetry || {}),
    smartDevices
  };

  const active = newestServer || (existing.length > 0 ? existing[0] : null);
  const statusMsg = active
    ? `🚀 Synced ${existing.length} paired server(s) (${notifications.length} history, ${syncServers.length} cloud-sync) — active: ${active.serverName}`
    : `✅ Signed in with Facepunch Cloud (${notifications.length} history items, 0 servers). In Rust: click [✕ DISABLE] then [PAIR WITH SERVER] once — auto-detects within 4s!`;

  squadState.rustPlusShopConfig = {
    ...DEFAULT_STATE.rustPlusShopConfig,
    ...cfg,
    authToken: token,
    ...(jwtSteamId ? { steamId: jwtSteamId } : {}),
    pairedServers: existing,
    lastHistoryNotificationId: maxNid,
    lastStatus: statusMsg,
    ...(active
      ? {
          ip: active.ip || cfg.ip || '',
          port: active.port || cfg.port || '28082',
          serverId: active.serverId || active.id || '',
          playerId: active.playerId,
          playerToken: active.playerToken,
          serverName: active.serverName,
          autoPoll: true
        }
      : {})
  };
  saveState(squadState);
  broadcastState('state_update');

  if (active && (!isBackground || newestServer)) {
    configureRustPlusShopPoller();
    try {
      const snap = await fetchRustPlusVendingSnapshot(squadState.rustPlusShopConfig);
      await applyVendingSnapshotToState(snap, squadState.rustPlusShopConfig);
    } catch (pollErr) {
      squadState.rustPlusShopConfig.lastStatus = `✅ Paired "${active.serverName}" — server poll wait: ${pollErr.message}`;
      saveState(squadState);
      broadcastState('state_update');
    }
  }

  return {
    serversFound,
    historyItemsCount: notifications.length,
    syncDataCount: syncServers.length,
    pairedServers: existing,
    activeServer: active,
    lastStatus: squadState.rustPlusShopConfig.lastStatus
  };
}

function configureRustPlusCloudSyncPoller() {
  if (rustPlusCloudSyncInterval) {
    clearInterval(rustPlusCloudSyncInterval);
    rustPlusCloudSyncInterval = null;
  }
  const cfg = squadState.rustPlusShopConfig || {};
  // Only poll Facepunch Cloud while waiting for first server pairing (stop immediately once paired or on 401/403)
  if (cfg.authToken && (!Array.isArray(cfg.pairedServers) || cfg.pairedServers.length === 0)) {
    let attempts = 0;
    rustPlusCloudSyncInterval = setInterval(async () => {
      attempts++;
      const cur = squadState.rustPlusShopConfig || {};
      if (!cur.authToken || (Array.isArray(cur.pairedServers) && cur.pairedServers.length > 0) || attempts > 18) {
        clearInterval(rustPlusCloudSyncInterval);
        rustPlusCloudSyncInterval = null;
        return;
      }
      try {
        await syncPairedServersFromFacepunchCloud(cur.authToken, true);
        if (Array.isArray(squadState.rustPlusShopConfig?.pairedServers) && squadState.rustPlusShopConfig.pairedServers.length > 0) {
          clearInterval(rustPlusCloudSyncInterval);
          rustPlusCloudSyncInterval = null;
        }
      } catch (err) {
        if (/401|403|Forbidden/i.test(String(err.message || ''))) {
          clearInterval(rustPlusCloudSyncInterval);
          rustPlusCloudSyncInterval = null;
        }
      }
    }, 10000);
  }
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
        const prevTimersById = new Map((squadState.activeTimers || []).map((t) => [t.id, t]));
        const incomingTimers = Array.isArray(body.activeTimers) ? body.activeTimers : squadState.activeTimers;
        const mergedTimers = (incomingTimers || []).map((t) => {
          const prev = prevTimersById.get(t?.id);
          if (prev && prev.endsAt === t.endsAt) {
            return {
              ...t,
              discordDoneSent: Boolean(t.discordDoneSent || prev.discordDoneSent),
              discord60sSent: Boolean(t.discord60sSent || prev.discord60sSent)
            };
          }
          return t;
        });
        const preserveRustPlus = !body._syncRustPlus;
        squadState = {
          ...squadState,
          ...body,
          discordConfig: {
            ...DEFAULT_STATE.discordConfig,
            ...(squadState.discordConfig || {}),
            ...(body.discordConfig || {})
          },
          rustPlusShopConfig: preserveRustPlus
            ? squadState.rustPlusShopConfig
            : {
                ...DEFAULT_STATE.rustPlusShopConfig,
                ...(squadState.rustPlusShopConfig || {}),
                ...(body.rustPlusShopConfig || {})
              },
          rustPlusTelemetry: preserveRustPlus ? squadState.rustPlusTelemetry : body.rustPlusTelemetry || DEFAULT_STATE.rustPlusTelemetry,
          activeTimers: mergedTimers,
          updatedAt: Date.now()
        };
        delete squadState._syncRustPlus;
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

        const cachedRm = rustmapsAnalyzeCache.get(rustmapsUrl);
        if (cachedRm && Date.now() - cachedRm.time < RUSTMAPS_CACHE_TTL_MS) {
          return sendJson(res, 200, cachedRm.payload);
        }

        let html = '';
        let rmFetchErr = null;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            html = await fetchTextHttps(rustmapsUrl);
            rmFetchErr = null;
            break;
          } catch (err) {
            rmFetchErr = err;
            if (attempt === 0) await new Promise((r) => setTimeout(r, 700));
          }
        }
        if (rmFetchErr) throw rmFetchErr;

        const mapData = parseRustMapsFromHtml(html);
        if (!mapData) {
          return sendJson(res, 502, {
            error: 'Could not extract monument data from RustMaps. Make sure the map exists on rustmaps.com and is finished generating.'
          });
        }

        let buildingBlockArea = null;
        if (mapData.buildingBlockAreaUrl) {
          try {
            const bbUrl = new URL(mapData.buildingBlockAreaUrl);
            if (bbUrl.protocol === 'https:' && bbUrl.hostname.endsWith('rustmaps.com')) {
              const bbRaw = await fetchTextHttps(bbUrl.toString());
              const bbParsed = JSON.parse(bbRaw);
              if (bbParsed && (Array.isArray(bbParsed.boxes) || Array.isArray(bbParsed.spheres))) {
                buildingBlockArea = {
                  boxes: Array.isArray(bbParsed.boxes) ? bbParsed.boxes : [],
                  spheres: Array.isArray(bbParsed.spheres) ? bbParsed.spheres : []
                };
              }
            }
          } catch (_) {
            buildingBlockArea = null;
          }
        }

        const rmPayload = {
          ok: true,
          rustmapsUrl,
          id: mapData.id,
          seed: mapData.seed,
          size: mapData.size,
          imageUrl: mapData.imageUrl || '',
          imageIconUrl: mapData.imageIconUrl || '',
          buildingBlockAreaUrl: mapData.buildingBlockAreaUrl || '',
          buildingBlockArea,
          biomePercentages: mapData.biomePercentages || {},
          waterPipeMarkers: Array.isArray(mapData.waterPipeMarkers) ? mapData.waterPipeMarkers : [],
          heatMaps: (Array.isArray(mapData.heatMaps) ? mapData.heatMaps : []).reduce((acc, h) => {
            if (h?.name && h?.url) {
              acc[h.name] = h.url.endsWith('/') ? `${h.url}0/0/0.png` : `${h.url}/0/0/0.png`;
            }
            return acc;
          }, {}),
          heatMapBaseUrls: (Array.isArray(mapData.heatMaps) ? mapData.heatMaps : []).reduce((acc, h) => {
            if (h?.name && h?.url) {
              acc[h.name] = h.url.endsWith('/') ? h.url : `${h.url}/`;
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
        };
        rustmapsAnalyzeCache.set(rustmapsUrl, { time: Date.now(), payload: rmPayload });
        return sendJson(res, 200, rmPayload);
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

    // 7. Discord Bot & Webhook Notification Endpoints
    if (pathname === '/api/discord' && req.method === 'POST') {
      if (!checkPin(req, res)) return;
      const body = await readJsonBody(req);
      try {
        const result = await sendDiscordNotification(body);
        return sendJson(res, 200, { ok: true, sentVia: result.sentVia });
      } catch (err) {
        return sendJson(res, 400, { error: err.message });
      }
    }

    if (pathname === '/api/discord/timer-alert' && req.method === 'POST') {
      if (!checkPin(req, res)) return;
      const body = await readJsonBody(req);
      try {
        const timerId = String(body.timerId || '');
        const eventType = body.eventType === '60s' ? '60s' : 'complete';
        const settings = resolveDiscordSettings();
        const hasTarget = Boolean(
          (settings.webhookUrl && settings.webhookUrl.startsWith('https://discord')) ||
            (settings.botToken && (settings.channelId || settings.dmUserId))
        );
        if (!hasTarget) {
          return sendJson(res, 200, { ok: false, skipped: 'unconfigured' });
        }
        if (eventType === 'complete' && !settings.notifyOnComplete) {
          return sendJson(res, 200, { ok: false, skipped: 'disabled' });
        }
        if (eventType === '60s' && !settings.notifyOn60s) {
          return sendJson(res, 200, { ok: false, skipped: 'disabled' });
        }
        const timer = (squadState.activeTimers || []).find((t) => t.id === timerId);
        const timerName = timer?.name || String(body.timerName || 'Monument Timer');
        const endsAtKey = timer?.endsAt || body.endsAt || 0;
        const alertKey = `${timerId}:${endsAtKey}:${eventType}`;
        const flagKey = eventType === '60s' ? 'discord60sSent' : 'discordDoneSent';
        if (sentDiscordAlerts.has(alertKey) || timer?.[flagKey]) {
          return sendJson(res, 200, { ok: true, deduplicated: true });
        }
        sentDiscordAlerts.add(alertKey);
        if (timer) {
          timer[flagKey] = true;
          saveState(squadState);
        }
        const result = await sendDiscordNotification(
          eventType === '60s'
            ? {
                title: `⏳ 60s Warning: ${timerName}`,
                description: `**${timerName}** finishes in **under 60 seconds**!`,
                color: 0xf59e0b
              }
            : {
                title: `✅ Timer Ready: ${timerName}`,
                description: `**${timerName}** has finished / respawned! Ready to run now.`,
                color: 0x22c55e
              }
        );
        return sendJson(res, 200, { ok: true, sentVia: result.sentVia });
      } catch (err) {
        return sendJson(res, 400, { error: err.message });
      }
    }

    // 7B. Real-Time Rust+ Popup OAuth, Cloud Sync & Vending Machine Poller Endpoints
    if (pathname === '/api/rustplus/login' && req.method === 'GET') {
      const staticCallbackUrl = 'https://app.playrust.com/assets/yandex-browser-manifest.json';
      const targetUrl = `https://companion-rust.facepunch.com/login-direct?returnUrl=${encodeURIComponent(staticCallbackUrl)}`;
      res.writeHead(302, { Location: targetUrl });
      return res.end();
    }

    if (pathname === '/api/shops/rustplus/auth-exchange' && req.method === 'POST') {
      if (!checkPin(req, res)) return;
      const body = await readJsonBody(req);

      try {
        const resolved = await resolveFacepunchAuthInput(body.tokenInput);
        if (!resolved || (!resolved.token && !resolved.directServer)) {
          return sendJson(res, 400, {
            error: 'Could not find a Facepunch OAuth #code=... URL, AuthToken, or Rust+ server config in that input.'
          });
        }
        if (resolved.directServer) {
          const ds = resolved.directServer;
          const prevServers = Array.isArray(squadState.rustPlusShopConfig?.pairedServers)
            ? [...squadState.rustPlusShopConfig.pairedServers]
            : [];
          const idx = prevServers.findIndex((s) => s.ip === ds.ip && String(s.port) === String(ds.port));
          if (idx >= 0) prevServers[idx] = ds;
          else prevServers.unshift(ds);
          const nextCfg = {
            ...DEFAULT_STATE.rustPlusShopConfig,
            ...(squadState.rustPlusShopConfig || {}),
            ...ds,
            pairedServers: prevServers,
            autoPoll: true
          };
          const snap = await fetchRustPlusVendingSnapshot(nextCfg);
          const result = await applyVendingSnapshotToState(snap, nextCfg);
          configureRustPlusShopPoller();
          return sendJson(res, 200, {
            ok: true,
            pairedServers: prevServers,
            activeServer: ds,
            ...result,
            state: squadState
          });
        }

        const initialSteamId = resolved.steamId || extractSteamIdFromJwt(resolved.token) || squadState.rustPlusShopConfig?.steamId || '';
        const regToken = await registerFacepunchWebPush(resolved.token);
        squadState.rustPlusShopConfig = {
          ...DEFAULT_STATE.rustPlusShopConfig,
          ...(squadState.rustPlusShopConfig || {}),
          authToken: regToken,
          steamId: initialSteamId
        };
        configureRustPlusCloudSyncPoller();
        const cloudSync = await syncPairedServersFromFacepunchCloud(regToken, false);
        return sendJson(res, 200, {
          ok: true,
          pairedServers: cloudSync.pairedServers,
          activeServer: cloudSync.activeServer,
          historyItemsCount: cloudSync.historyItemsCount,
          lastStatus: cloudSync.lastStatus,
          state: squadState
        });
      } catch (err) {
        return sendJson(res, 400, { error: err.message });
      }
    }

    if (pathname === '/api/shops/rustplus/cloud-sync' && req.method === 'POST') {
      if (!checkPin(req, res)) return;
      const body = await readJsonBody(req).catch(() => ({}));
      let tokenToUse = squadState.rustPlusShopConfig?.authToken || '';
      if (!tokenToUse && body.tokenInput) {
        const resolved = await resolveFacepunchAuthInput(body.tokenInput).catch(() => null);
        if (resolved?.token) {
          tokenToUse = await registerFacepunchWebPush(resolved.token);
          squadState.rustPlusShopConfig.authToken = tokenToUse;
          configureRustPlusCloudSyncPoller();
        }
      }
      if (!tokenToUse) {
        return sendJson(res, 400, { error: 'Not signed in with Facepunch Steam Popup yet.' });
      }
      try {
        const cloudSync = await syncPairedServersFromFacepunchCloud(tokenToUse, false);
        return sendJson(res, 200, { ok: true, ...cloudSync, state: squadState });
      } catch (err) {
        return sendJson(res, 502, { error: err.message });
      }
    }

    if (pathname === '/api/shops/rustplus/config' && req.method === 'POST') {
      if (!checkPin(req, res)) return;
      const body = await readJsonBody(req);
      squadState.rustPlusShopConfig = {
        ...DEFAULT_STATE.rustPlusShopConfig,
        ...(squadState.rustPlusShopConfig || {}),
        ip: String(body.ip ?? squadState.rustPlusShopConfig?.ip ?? '').trim(),
        port: String(body.port ?? squadState.rustPlusShopConfig?.port ?? '28082').trim() || '28082',
        serverId: String(body.serverId ?? squadState.rustPlusShopConfig?.serverId ?? '').trim(),
        playerId: String(body.playerId ?? squadState.rustPlusShopConfig?.playerId ?? '').trim(),
        playerToken: String(body.playerToken ?? squadState.rustPlusShopConfig?.playerToken ?? '').trim(),
        useProxy: Boolean(body.useProxy),
        autoPoll: Boolean(body.autoPoll),
        discordAlertSteals: body.discordAlertSteals !== false,
        discordAlertEvents: body.discordAlertEvents !== false
      };
      configureRustPlusShopPoller();
      saveState(squadState);
      broadcastState('state_update');
      return sendJson(res, 200, { ok: true, rustPlusShopConfig: squadState.rustPlusShopConfig });
    }

    if (pathname === '/api/shops/rustplus/map-image' && req.method === 'GET') {
      if (!cachedRustPlusMap || !cachedRustPlusMap.buffer) {
        return sendJson(res, 404, { error: 'No Rust+ map image cached yet — connect or poll live server first.' });
      }
      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Content-Length': cachedRustPlusMap.buffer.length,
        'Cache-Control': 'public, max-age=120',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(cachedRustPlusMap.buffer);
    }

    if (pathname === '/api/shops/rustplus/team-chat' && req.method === 'POST') {
      if (!checkPin(req, res)) return;
      const body = await readJsonBody(req);
      const message = String(body.message || '').trim().slice(0, 240);
      if (!message) return sendJson(res, 400, { error: 'Enter a message to send to team chat.' });

      const cfg = squadState.rustPlusShopConfig || {};
      if ((!cfg.ip && !cfg.serverId) || !cfg.playerId || !cfg.playerToken) {
        return sendJson(res, 400, { error: 'Connect to Rust+ first before sending team messages.' });
      }
      try {
        await sendRustPlusCommand(cfg, 13, encodeRustPlusSendMessage(message));
        const prevChat = Array.isArray(squadState.rustPlusTelemetry?.teamChat) ? [...squadState.rustPlusTelemetry.teamChat] : [];
        prevChat.push({
          steamId: cfg.steamId || cfg.playerId || '0',
          name: squadState.squadName || 'You (Companion)',
          message,
          color: '#fde047',
          time: Math.floor(Date.now() / 1000)
        });
        squadState.rustPlusTelemetry = {
          ...DEFAULT_STATE.rustPlusTelemetry,
          ...(squadState.rustPlusTelemetry || {}),
          teamChat: prevChat.slice(-30)
        };
        saveState(squadState);
        broadcastState('state_update');
        return sendJson(res, 200, { ok: true, teamChat: squadState.rustPlusTelemetry.teamChat });
      } catch (err) {
        return sendJson(res, 502, { error: err.message });
      }
    }

    if (pathname === '/api/shops/rustplus/promote' && req.method === 'POST') {
      if (!checkPin(req, res)) return;
      const body = await readJsonBody(req);
      const steamId = String(body.steamId || '').replace(/[^\d]/g, '');
      if (!/^\d{15,22}$/.test(steamId)) {
        return sendJson(res, 400, { error: 'Valid target teammate SteamID64 required.' });
      }
      const cfg = squadState.rustPlusShopConfig || {};
      if ((!cfg.ip && !cfg.serverId) || !cfg.playerId || !cfg.playerToken) {
        return sendJson(res, 400, { error: 'Connect to Rust+ first before promoting team leader.' });
      }
      try {
        await sendRustPlusCommand(cfg, 19, encodeRustPlusPromoteToLeader(steamId));
        const nextMembers = (Array.isArray(squadState.rustPlusTelemetry?.teamMembers) ? squadState.rustPlusTelemetry.teamMembers : []).map((m) => ({
          ...m,
          isLeader: String(m.steamId) === steamId
        }));
        squadState.rustPlusTelemetry = {
          ...DEFAULT_STATE.rustPlusTelemetry,
          ...(squadState.rustPlusTelemetry || {}),
          teamMembers: nextMembers
        };
        saveState(squadState);
        broadcastState('state_update');
        return sendJson(res, 200, { ok: true, leaderSteamId: steamId, teamMembers: nextMembers });
      } catch (err) {
        return sendJson(res, 502, { error: err.message });
      }
    }

    if (pathname === '/api/shops/rustplus/smart-switch' && req.method === 'POST') {
      if (!checkPin(req, res)) return;
      const body = await readJsonBody(req);
      const entityId = parseInt(String(body.entityId || '0'), 10);
      if (!entityId) return sendJson(res, 400, { error: 'Valid Smart Switch Entity ID required.' });
      const nextActive = Boolean(body.active);
      const cfg = squadState.rustPlusShopConfig || {};
      if ((!cfg.ip && !cfg.serverId) || !cfg.playerId || !cfg.playerToken) {
        return sendJson(res, 400, { error: 'Connect to Rust+ first to toggle Smart Switches.' });
      }
      const list = Array.isArray(squadState.rustPlusTelemetry?.smartDevices) ? [...squadState.rustPlusTelemetry.smartDevices] : [];
      const dev = list.find((d) => String(d.entityId) === String(entityId));

      try {
        await sendRustPlusCommand(cfg, 15, { entityId, bytes: [0x08, nextActive ? 0x01 : 0x00] });
        if (dev) {
          dev.active = nextActive;
        } else {
          list.unshift({ entityId: String(entityId), name: `Smart Switch #${entityId}`, entityType: 'switch', active: nextActive, pairedAt: Date.now() });
        }
        squadState.rustPlusTelemetry = {
          ...DEFAULT_STATE.rustPlusTelemetry,
          ...(squadState.rustPlusTelemetry || {}),
          smartDevices: list
        };
        saveState(squadState);
        broadcastState('state_update');
        return sendJson(res, 200, { ok: true, smartDevices: list });
      } catch (err) {
        return sendJson(res, 502, { error: err.message });
      }
    }

    if (pathname === '/api/shops/rustplus/smart-device' && req.method === 'POST') {
      if (!checkPin(req, res)) return;
      const body = await readJsonBody(req);
      const action = String(body.action || 'add');
      const entityId = String(body.entityId || '').replace(/[^\d]/g, '');
      const list = Array.isArray(squadState.rustPlusTelemetry?.smartDevices) ? [...squadState.rustPlusTelemetry.smartDevices] : [];
      if (action === 'remove') {
        const nextList = list.filter((d) => String(d.entityId) !== entityId);
        squadState.rustPlusTelemetry = { ...DEFAULT_STATE.rustPlusTelemetry, ...(squadState.rustPlusTelemetry || {}), smartDevices: nextList };
        saveState(squadState);
        broadcastState('state_update');
        return sendJson(res, 200, { ok: true, smartDevices: nextList });
      }
      if (!entityId) return sendJson(res, 400, { error: 'Enter numeric Entity ID (from Rust+ pairing, Smart Alarm, or Storage Monitor).' });
      if (action === 'refresh') {
        const cfg = squadState.rustPlusShopConfig || {};
        if ((!cfg.ip && !cfg.serverId) || !cfg.playerId || !cfg.playerToken) {
          return sendJson(res, 400, { error: 'Connect to Rust+ first to inspect Smart Devices.' });
        }
        try {
          const resp = await sendRustPlusCommand(cfg, 14, { entityId });
          const ent = resp?.entityInfo;
          const idx = list.findIndex((d) => String(d.entityId) === entityId);
          if (ent && idx >= 0) {
            const mappedType = ent.type === 2 ? 'alarm' : ent.type === 3 ? 'storage' : 'switch';
            list[idx] = {
              ...list[idx],
              entityType: mappedType,
              active: Boolean(ent.value),
              capacity: Number(ent.capacity || 0),
              hasProtection: Boolean(ent.hasProtection),
              protectionExpiry: Number(ent.protectionExpiry || 0),
              items: aggregateEntityStorageItems(ent.items || []),
              lastCheckedAt: Date.now()
            };
          }
          squadState.rustPlusTelemetry = { ...DEFAULT_STATE.rustPlusTelemetry, ...(squadState.rustPlusTelemetry || {}), smartDevices: list };
          saveState(squadState);
          broadcastState('state_update');
          return sendJson(res, 200, { ok: true, smartDevices: list });
        } catch (err) {
          return sendJson(res, 502, { error: err.message });
        }
      }
      const name = String(body.name || '').trim() || `Smart Device #${entityId}`;
      const entityType = body.entityType === 'alarm' ? 'alarm' : body.entityType === 'storage' ? 'storage' : 'switch';
      const idx = list.findIndex((d) => String(d.entityId) === entityId);
      const entry = { entityId, name, entityType, active: idx >= 0 ? Boolean(list[idx].active) : false, pairedAt: Date.now() };
      if (idx >= 0) list[idx] = { ...list[idx], ...entry };
      else list.unshift(entry);
      squadState.rustPlusTelemetry = { ...DEFAULT_STATE.rustPlusTelemetry, ...(squadState.rustPlusTelemetry || {}), smartDevices: list };
      saveState(squadState);
      broadcastState('state_update');
      return sendJson(res, 200, { ok: true, smartDevices: list });
    }

    if (pathname === '/api/shops/rustplus/debug' && req.method === 'GET') {
      const cfg = squadState.rustPlusShopConfig || {};
      const tel = squadState.rustPlusTelemetry || {};
      return sendJson(res, 200, {
        ok: true,
        hasAuthToken: Boolean(cfg.authToken),
        serverId: cfg.serverId || '',
        ip: cfg.ip || '',
        port: cfg.port || '',
        autoPoll: Boolean(cfg.autoPoll),
        lastPolledAt: cfg.lastPolledAt || 0,
        lastStatus: cfg.lastStatus || '',
        pairedServersCount: Array.isArray(cfg.pairedServers) ? cfg.pairedServers.length : 0,
        serverInfo: tel.serverInfo || null,
        markerSummary: tel.markerSummary || null,
        vendingPinsCount: Array.isArray(tel.vendingPins) ? tel.vendingPins.length : 0,
        liveEventsCount: Array.isArray(tel.liveEvents) ? tel.liveEvents.length : 0,
        teamMembersCount: Array.isArray(tel.teamMembers) ? tel.teamMembers.length : 0,
        customShopsCount: Array.isArray(squadState.customShops) ? squadState.customShops.length : 0
      });
    }

    if (pathname === '/api/shops/rustplus/poll' && req.method === 'POST') {
      if (!checkPin(req, res)) return;
      const body = await readJsonBody(req);
      const forceMap = Boolean(body.forceMap);
      const nextCfg = {
        ...DEFAULT_STATE.rustPlusShopConfig,
        ...(squadState.rustPlusShopConfig || {}),
        ...(body.ip !== undefined ? { ip: String(body.ip).trim() } : {}),
        ...(body.port !== undefined ? { port: String(body.port).trim() || '28082' } : {}),
        ...(body.serverId !== undefined ? { serverId: String(body.serverId).trim() } : {}),
        ...(body.playerId !== undefined ? { playerId: String(body.playerId).trim() } : {}),
        ...(body.playerToken !== undefined ? { playerToken: String(body.playerToken).trim() } : {}),
        ...(body.useProxy !== undefined ? { useProxy: Boolean(body.useProxy) } : {}),
        ...(body.autoPoll !== undefined ? { autoPoll: Boolean(body.autoPoll) } : {}),
        ...(body.discordAlertSteals !== undefined ? { discordAlertSteals: Boolean(body.discordAlertSteals) } : {}),
        ...(body.discordAlertEvents !== undefined ? { discordAlertEvents: Boolean(body.discordAlertEvents) } : {})
      };
      try {
        const snapshot = await fetchRustPlusVendingSnapshot(nextCfg, forceMap);
        const result = await applyVendingSnapshotToState(snapshot, nextCfg);
        configureRustPlusShopPoller();
        return sendJson(res, 200, { ...result, state: squadState });
      } catch (err) {
        squadState.rustPlusShopConfig = {
          ...nextCfg,
          lastStatus: `❌ ${err.message}`
        };
        saveState(squadState);
        broadcastState('state_update');
        return sendJson(res, 502, { error: err.message });
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
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      fs.createReadStream(filePath).pipe(res);
    } else {
      const indexFile = path.join(PUBLIC_DIR, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
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

function checkActiveTimersForDiscord() {
  const settings = resolveDiscordSettings();
  const hasTarget = Boolean(
    (settings.webhookUrl && settings.webhookUrl.startsWith('https://discord')) ||
      (settings.botToken && (settings.channelId || settings.dmUserId))
  );
  if (!hasTarget) return;
  const now = Date.now();
  let dirty = false;
  for (const t of squadState.activeTimers || []) {
    if (!t || !t.id || t.paused) continue;
    const remMs = (t.endsAt || 0) - now;
    if (remMs < -300000) {
      if (!t.discordDoneSent) {
        t.discordDoneSent = true;
        dirty = true;
      }
      continue;
    }
    if (remMs <= 0 && !t.discordDoneSent) {
      const doneKey = `${t.id}:${t.endsAt || 0}:complete`;
      t.discordDoneSent = true;
      dirty = true;
      if (!sentDiscordAlerts.has(doneKey) && settings.notifyOnComplete) {
        sentDiscordAlerts.add(doneKey);
        sendDiscordNotification({
          title: `✅ Timer Ready: ${t.name}`,
          description: `**${t.name}** has finished / respawned! Ready to run now.`,
          color: 0x22c55e
        }).catch(() => {});
      }
    } else if (remMs > 0 && remMs <= 60000 && !t.discord60sSent) {
      const warnKey = `${t.id}:${t.endsAt || 0}:60s`;
      t.discord60sSent = true;
      dirty = true;
      if (!sentDiscordAlerts.has(warnKey) && settings.notifyOn60s) {
        sentDiscordAlerts.add(warnKey);
        sendDiscordNotification({
          title: `⏳ 60s Warning: ${t.name}`,
          description: `**${t.name}** finishes in **under 60 seconds**!`,
          color: 0xf59e0b
        }).catch(() => {});
      }
    }
  }
  if (dirty) saveState(squadState);
}

setInterval(checkActiveTimersForDiscord, 1000);
configureRustPlusShopPoller();
configureRustPlusCloudSyncPoller();

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
