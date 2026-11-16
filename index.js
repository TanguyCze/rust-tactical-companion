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
  discordConfig: {
    botToken: '',
    channelId: '',
    dmUserId: '',
    notifyOnComplete: true,
    notifyOn60s: false
  },
  customShops: [],
  rustPlusShopConfig: {
    ip: process.env.RUSTPLUS_IP || '',
    port: process.env.RUSTPLUS_PORT || '28082',
    playerId: process.env.RUSTPLUS_PLAYER_ID || '',
    playerToken: process.env.RUSTPLUS_PLAYER_TOKEN || '',
    useProxy: false,
    autoPoll: false,
    discordAlertSteals: true,
    lastPolledAt: 0,
    lastStatus: '',
    mapSize: 4250
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
        rustPlusShopConfig: { ...DEFAULT_STATE.rustPlusShopConfig, ...(parsed.rustPlusShopConfig || {}) }
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

function inferShopCategoryFromName(name) {
  const s = String(name || '').toLowerCase();
  if (/tea|berry|hemp|clone|seed/.test(s)) return 'teas';
  if (/workbench|furnace|solar/.test(s)) return 'progression';
  if (/garage door|armored|turret|sam site|battery|window|external/.test(s)) return 'defense';
  if (/rocket|explosive|satchel|c4|beancan|grenade/.test(s)) return 'raid';
  if (/rifle|ak|lr-300|sar|thompson|mp5|smg|python|revolver|shotgun|m249|l96|m39|scope|holo/.test(s)) return 'weapons';
  if (/jackhammer|chainsaw|icepick|axe|gloves|syringe|medkit|keycard/.test(s)) return 'tools';
  return 'resources';
}

function resolveRustItemName(itemId) {
  const key = String(itemId);
  return RUST_ITEMS_BY_ID[key] || `Rust Item #${key}`;
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

function encodeRustPlusRequest(seq, playerId, playerToken, fieldNum) {
  const out = [];
  writeVarint(out, (1 << 3) | 0);
  writeVarint(out, seq);
  writeVarint(out, (2 << 3) | 0);
  writeVarint(out, BigInt(String(playerId || '0')));
  writeVarint(out, (3 << 3) | 0);
  writeVarint(out, BigInt(parseInt(String(playerToken || '0'), 10)));
  writeVarint(out, (fieldNum << 3) | 2);
  writeVarint(out, 0);
  return Buffer.from(out);
}

function decodeRustPlusAppInfo(buf) {
  let pos = 0;
  const info = {};
  while (pos < buf.length) {
    const tag = readVarint(buf, pos);
    pos = tag.offset;
    const fn = Number(tag.value >> 3n);
    const wt = Number(tag.value & 7n);
    if (wt === 2 && fn === 1) {
      const len = readVarint(buf, pos);
      pos = len.offset;
      info.name = buf.slice(pos, pos + Number(len.value)).toString('utf8');
      pos += Number(len.value);
    } else if (wt === 0 && (fn === 5 || fn === 7 || fn === 8 || fn === 10)) {
      const v = readVarint(buf, pos);
      pos = v.offset;
      const num = Number(v.value);
      if (fn === 5) info.mapSize = num;
      else if (fn === 7) info.players = num;
      else if (fn === 8) info.maxPlayers = num;
      else if (fn === 10) info.seed = num;
    } else {
      pos = skipWireField(buf, pos, wt);
    }
  }
  return info;
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
  const mk = { id: 0, type: 0, x: 0, y: 0, name: '', outOfStock: false, sellOrders: [] };
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
      else if (fn === 12) mk.outOfStock = v.value !== 0n;
    } else if (wt === 5 && pos + 4 <= buf.length) {
      const val = buf.readFloatLE(pos);
      pos += 4;
      if (fn === 3) mk.x = val;
      else if (fn === 4) mk.y = val;
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
      // Decode AppResponse
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
          if (rfn === 4) resp.error = sub.toString('utf8');
          else if (rfn === 6) resp.info = decodeRustPlusAppInfo(sub);
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

function fetchRustPlusSnapshotAttempt(cfg, useProxy) {
  return new Promise((resolve, reject) => {
    const ip = String(cfg.ip || '').trim();
    const port = parseInt(String(cfg.port || '28082'), 10) || 28082;
    const playerId = String(cfg.playerId || '').trim();
    const playerToken = String(cfg.playerToken || '').trim();
    if (!ip || !playerId || !playerToken) {
      return reject(new Error('Enter Server IP, SteamID64, and PlayerToken first.'));
    }

    const reqOpts = useProxy
      ? {
          hostname: 'companion-rust.facepunch.com',
          port: 443,
          path: `/game/${ip}/${port}`,
          method: 'GET',
          headers: {
            Connection: 'Upgrade',
            Upgrade: 'websocket',
            'Sec-WebSocket-Version': '13',
            'Sec-WebSocket-Key': crypto.randomBytes(16).toString('base64')
          },
          timeout: 6000
        }
      : {
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
          timeout: 5000
        };

    const transport = useProxy ? https : http;
    let settled = false;
    let sock = null;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try { if (sock) sock.destroy(); } catch (_) {}
      reject(new Error(`Timed out connecting to ${useProxy ? 'Facepunch Proxy' : `${ip}:${port}`}`));
    }, 6500);

    const req = transport.request(reqOpts);
    let infoResult = null;
    let markersResult = null;

    req.on('upgrade', (_res, socket) => {
      sock = socket;
      socket.setNoDelay(true);
      try {
        sendRawWsBinary(socket, encodeRustPlusRequest(1, playerId, playerToken, 8)); // getInfo
        sendRawWsBinary(socket, encodeRustPlusRequest(2, playerId, playerToken, 18)); // getMapMarkers
      } catch (err) {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          socket.destroy();
          reject(err);
        }
        return;
      }

      let recvBuf = Buffer.alloc(0);
      let fragChunks = [];
      let fragOpcode = 0;

      socket.on('data', (chunk) => {
        recvBuf = Buffer.concat([recvBuf, chunk]);
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
            // Ping -> Pong
            try {
              const pong = Buffer.from([0x8a, 0x80, 0, 0, 0, 0]);
              socket.write(pong);
            } catch (_) {}
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
            if (resp?.error && resp.seq === 2 && !markersResult) {
              settled = true;
              clearTimeout(timer);
              socket.destroy();
              return reject(new Error(`Rust+ server rejected request (check PlayerToken / pairing): ${resp.error}`));
            }
            if (resp?.info) infoResult = resp.info;
            if (Array.isArray(resp?.markers)) markersResult = resp.markers;
            if (markersResult !== null) {
              settled = true;
              clearTimeout(timer);
              socket.destroy();
              return resolve({ info: infoResult, markers: markersResult, usedProxy: useProxy });
            }
          }
        }
      });

      socket.on('error', (err) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(err);
        }
      });
      socket.on('close', () => {
        if (!settled && markersResult !== null) {
          settled = true;
          clearTimeout(timer);
          resolve({ info: infoResult, markers: markersResult, usedProxy: useProxy });
        } else if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(new Error('Rust+ connection closed before vending markers arrived'));
        }
      });
    });

    req.on('error', (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(err);
      }
    });
    req.on('timeout', () => {
      req.destroy(new Error('WebSocket handshake timeout'));
    });
    req.end();
  });
}

async function fetchRustPlusVendingSnapshot(cfg) {
  const preferProxy = Boolean(cfg.useProxy);
  try {
    return await fetchRustPlusSnapshotAttempt(cfg, preferProxy);
  } catch (err) {
    // Fallback cleanly between direct WS and Facepunch proxy unless creds missing
    if (!cfg.ip || !cfg.playerId || !cfg.playerToken) throw err;
    return await fetchRustPlusSnapshotAttempt(cfg, !preferProxy);
  }
}

const sentShopStealAlerts = new Set();
let rustPlusShopInterval = null;
let isRustPlusPolling = false;

function buildDemoVendingSnapshot(mapSize) {
  const s = Math.max(1000, Number(mapSize) || 4250);
  return {
    info: { name: '[Live Server Demo] Rust Tactical Monthly', mapSize: s, players: 214, maxPlayers: 300 },
    markers: [
      {
        id: 9101,
        type: 3,
        x: s * 0.56,
        y: s * 0.51,
        name: 'TEA SHOP // PURE ORE & SCRAP',
        sellOrders: [
          { itemId: 1729374708, quantity: 1, currencyId: -1581843485, costPerItem: 280, amountInStock: 9 },
          { itemId: 2024467711, quantity: 1, currencyId: -1581843485, costPerItem: 260, amountInStock: 6 },
          { itemId: -557539629, quantity: 1, currencyId: -1581843485, costPerItem: 180, amountInStock: 0 }
        ]
      },
      {
        id: 9102,
        type: 3,
        x: s * 0.44,
        y: s * 0.62,
        name: 'T2 PROGRESSION // DOORS & WB2',
        sellOrders: [
          { itemId: -148794216, quantity: 1, currencyId: -1581843485, costPerItem: 250, amountInStock: 7 },
          { itemId: -41896755, quantity: 1, currencyId: -1581843485, costPerItem: 380, amountInStock: 2 },
          { itemId: -904863145, quantity: 1, currencyId: -1581843485, costPerItem: 300, amountInStock: 4 }
        ]
      },
      {
        id: 9103,
        type: 3,
        x: s * 0.72,
        y: s * 0.34,
        name: 'EXCAVATOR DIESEL & BOOM',
        sellOrders: [
          { itemId: 1568388703, quantity: 1, currencyId: -1581843485, costPerItem: 250, amountInStock: 12 },
          { itemId: 1545779598, quantity: 1, currencyId: -1581843485, costPerItem: 1200, amountInStock: 3 }
        ]
      }
    ]
  };
}

async function applyVendingSnapshotToState(snapshot, cfg, isDemo = false) {
  const mapSize = Number(snapshot?.info?.mapSize || cfg?.mapSize || 4250);
  const vmMarkers = (snapshot?.markers || []).filter(
    (m) => m.type === 3 && Array.isArray(m.sellOrders) && m.sellOrders.length > 0
  );

  const liveShops = [];
  const newSteals = [];
  const nowTs = Date.now();

  for (const mk of vmMarkers) {
    const grid = worldGridLabelFromRustPlus(mk.x, mk.y, mapSize);
    const shopName = String(mk.name || '').trim() || `Vending [${grid}]`;
    for (const so of mk.sellOrders) {
      const baseBuy = resolveRustItemName(so.itemId);
      const buyItem = so.itemIsBlueprint ? `${baseBuy} (BP)` : baseBuy;
      const buyQty = Math.max(1, Number(so.quantity) || 1);
      const payItem = resolveRustItemName(so.currencyId);
      const payQty = Math.max(1, Number(so.costPerItem) || 1);
      const inStock = Math.max(0, Number(so.amountInStock) || 0);
      const id = `rp-${mk.id}-${so.itemId}-${so.currencyId}`;

      const entry = {
        id,
        liveSource: 'rustplus',
        isDemo,
        shopName,
        buyQty,
        buyItem,
        payQty,
        payItem,
        inStock,
        isBlueprint: Boolean(so.itemIsBlueprint),
        category: inferShopCategoryFromName(buyItem),
        grid,
        updatedAt: nowTs,
        notes: `${isDemo ? 'Demo' : 'Live Rust+'} vending "${shopName}" at [${grid}] — ${inStock > 0 ? `${inStock} in stock` : 'SOLD OUT'}.`
      };
      liveShops.push(entry);

      if (inStock > 0 && (payItem === 'Sulfur' || payItem === 'Sulfur Ore')) {
        const lowerName = buyItem.toLowerCase();
        const rule = BACKEND_STEAL_LIMITS.find((r) => lowerName.includes(r.match));
        const effectiveSulfur = payItem === 'Sulfur Ore' ? payQty * 0.9 : payQty;
        if (rule && effectiveSulfur / buyQty <= rule.maxSulfur) {
          const stealKey = `${shopName}:${grid}:${buyItem}:${payQty}:${payItem}`;
          if (!sentShopStealAlerts.has(stealKey)) {
            sentShopStealAlerts.add(stealKey);
            newSteals.push({ ...entry, why: rule.why });
          }
        }
      }
    }
  }

  const manualShops = (Array.isArray(squadState.customShops) ? squadState.customShops : []).filter(
    (cs) => cs && cs.liveSource !== 'rustplus'
  );
  squadState.customShops = [...liveShops, ...manualShops];
  squadState.rustPlusShopConfig = {
    ...DEFAULT_STATE.rustPlusShopConfig,
    ...(squadState.rustPlusShopConfig || {}),
    ...(cfg || {}),
    mapSize,
    lastPolledAt: nowTs,
    lastStatus: `${isDemo ? '🧪 Demo' : '🟢 Live Rust+'} synced ${vmMarkers.length} shops (${liveShops.length} offers)${snapshot?.info?.name ? ` • ${snapshot.info.name}` : ''}`
  };
  saveState(squadState);
  broadcastState('state_update');

  if (squadState.rustPlusShopConfig.discordAlertSteals && newSteals.length > 0 && !isDemo) {
    const settings = resolveDiscordSettings();
    const hasTarget = Boolean(
      (settings.webhookUrl && settings.webhookUrl.startsWith('https://discord')) ||
        (settings.botToken && (settings.channelId || settings.dmUserId))
    );
    if (hasTarget) {
      const topList = newSteals
        .slice(0, 5)
        .map(
          (s) =>
            `• **${s.buyQty}× ${s.buyItem}** for **${s.payQty} ${s.payItem}** at **[${s.grid}]** ("${s.shopName}" • ${s.inStock} stock)`
        )
        .join('\n');
      sendDiscordNotification({
        title: `🔥 S-Tier Player Shop Steal Live on Map!`,
        description: `${topList}\n\nOpen **🛒 Shops & Trades** to reserve via Marketplace Drone.`,
        color: 0xa855f7
      }).catch(() => {});
    }
  }

  return {
    ok: true,
    shopsCount: vmMarkers.length,
    ordersCount: liveShops.length,
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
  if (cfg.autoPoll && cfg.ip && cfg.playerId && cfg.playerToken) {
    rustPlusShopInterval = setInterval(async () => {
      if (isRustPlusPolling) return;
      isRustPlusPolling = true;
      try {
        const snap = await fetchRustPlusVendingSnapshot(squadState.rustPlusShopConfig);
        await applyVendingSnapshotToState(snap, squadState.rustPlusShopConfig, false);
      } catch (err) {
        squadState.rustPlusShopConfig.lastStatus = `⚠️ Poll error: ${err.message}`;
        saveState(squadState);
        broadcastState('state_update');
      } finally {
        isRustPlusPolling = false;
      }
    }, 20000);
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
        squadState = {
          ...squadState,
          ...body,
          discordConfig: {
            ...DEFAULT_STATE.discordConfig,
            ...(squadState.discordConfig || {}),
            ...(body.discordConfig || {})
          },
          rustPlusShopConfig: {
            ...DEFAULT_STATE.rustPlusShopConfig,
            ...(squadState.rustPlusShopConfig || {}),
            ...(body.rustPlusShopConfig || {})
          },
          activeTimers: mergedTimers,
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

        return sendJson(res, 200, {
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

    // 7B. Real-Time Rust+ Vending Machine Poller Endpoints
    if (pathname === '/api/shops/rustplus/config' && req.method === 'POST') {
      if (!checkPin(req, res)) return;
      const body = await readJsonBody(req);
      squadState.rustPlusShopConfig = {
        ...DEFAULT_STATE.rustPlusShopConfig,
        ...(squadState.rustPlusShopConfig || {}),
        ip: String(body.ip ?? squadState.rustPlusShopConfig?.ip ?? '').trim(),
        port: String(body.port ?? squadState.rustPlusShopConfig?.port ?? '28082').trim() || '28082',
        playerId: String(body.playerId ?? squadState.rustPlusShopConfig?.playerId ?? '').trim(),
        playerToken: String(body.playerToken ?? squadState.rustPlusShopConfig?.playerToken ?? '').trim(),
        useProxy: Boolean(body.useProxy),
        autoPoll: Boolean(body.autoPoll),
        discordAlertSteals: body.discordAlertSteals !== false
      };
      configureRustPlusShopPoller();
      saveState(squadState);
      broadcastState('state_update');
      return sendJson(res, 200, { ok: true, rustPlusShopConfig: squadState.rustPlusShopConfig });
    }

    if (pathname === '/api/shops/rustplus/poll' && req.method === 'POST') {
      if (!checkPin(req, res)) return;
      const body = await readJsonBody(req);
      const isDemo = Boolean(body.simulate);
      const nextCfg = {
        ...DEFAULT_STATE.rustPlusShopConfig,
        ...(squadState.rustPlusShopConfig || {}),
        ...(body.ip !== undefined ? { ip: String(body.ip).trim() } : {}),
        ...(body.port !== undefined ? { port: String(body.port).trim() || '28082' } : {}),
        ...(body.playerId !== undefined ? { playerId: String(body.playerId).trim() } : {}),
        ...(body.playerToken !== undefined ? { playerToken: String(body.playerToken).trim() } : {}),
        ...(body.useProxy !== undefined ? { useProxy: Boolean(body.useProxy) } : {}),
        ...(body.autoPoll !== undefined ? { autoPoll: Boolean(body.autoPoll) } : {}),
        ...(body.discordAlertSteals !== undefined ? { discordAlertSteals: Boolean(body.discordAlertSteals) } : {})
      };
      try {
        const snapshot = isDemo
          ? buildDemoVendingSnapshot(nextCfg.mapSize)
          : await fetchRustPlusVendingSnapshot(nextCfg);
        const result = await applyVendingSnapshotToState(snapshot, nextCfg, isDemo);
        if (!isDemo) configureRustPlusShopPoller();
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
