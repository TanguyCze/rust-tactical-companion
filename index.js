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
  squadPins: [],
  conveyorFilters: [],
  squadKeycards: {
    green: false,
    blue: false,
    red: false,
    fuses: 0
  },
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
    chatBotEnabled: true,
    chatBotAllowSwitchControl: true,
    discordAlertEvents: true,
    autoEventTimers: true,
    smartAutomation: {
      duskAutoSwitchIds: [],
      alarmDefenseSwitchIds: [],
      switchGroups: []
    },
    lastPolledAt: 0,
    lastStatus: '',
    mapSize: 4250
  },
  rustPlusTelemetry: {
    serverInfo: null,
    time: null,
    mapMeta: null,
    liveEvents: [],
    teamMembers: [],
    recentDeaths: [],
    mapNotes: [],
    teamChat: [],
    smartDevices: [],
    vendingMachines: [],
    activityLog: []
  },
  updatedAt: Date.now()
};

const STATE_BACKUP_FILE = `${STATE_FILE}.bak`;
const STATE_TMP_FILE = `${STATE_FILE}.tmp`;

function safeJsonParse(raw) {
  // Strip prototype-polluting keys from untrusted JSON payloads and persisted files
  return JSON.parse(raw, (key, value) => {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return undefined;
    }
    return value;
  });
}

function hydrateStateFromParsed(rawObj) {
  const parsedObj = rawObj && typeof rawObj === 'object' && !Array.isArray(rawObj) ? rawObj : {};
  // Drop legacy Rust+ / live-map data (incl. any saved auth tokens) from older versions
  const { rustPlus, markers, mapConfig, ...parsed } = parsedObj;
  const state = {
    ...DEFAULT_STATE,
    ...parsed,
    activeTimers: Array.isArray(parsed.activeTimers) ? parsed.activeTimers : [...DEFAULT_STATE.activeTimers],
    raidQueue: Array.isArray(parsed.raidQueue) ? parsed.raidQueue : [...DEFAULT_STATE.raidQueue],
    raidStash: { ...DEFAULT_STATE.raidStash, ...(parsed.raidStash && typeof parsed.raidStash === 'object' ? parsed.raidStash : {}) },
    savedClones: Array.isArray(parsed.savedClones) ? parsed.savedClones : [...DEFAULT_STATE.savedClones],
    battlemetrics: { ...DEFAULT_STATE.battlemetrics, ...(parsed.battlemetrics && typeof parsed.battlemetrics === 'object' ? parsed.battlemetrics : {}) },
    discordConfig: { ...DEFAULT_STATE.discordConfig, ...(parsed.discordConfig && typeof parsed.discordConfig === 'object' ? parsed.discordConfig : {}) },
    squadPins: Array.isArray(parsed.squadPins) ? parsed.squadPins : [],
    conveyorFilters: Array.isArray(parsed.conveyorFilters) ? parsed.conveyorFilters : [],
    squadKeycards: { ...DEFAULT_STATE.squadKeycards, ...(parsed.squadKeycards && typeof parsed.squadKeycards === 'object' ? parsed.squadKeycards : {}) },
    rustPlusShopConfig: {
      ...DEFAULT_STATE.rustPlusShopConfig,
      ...(parsed.rustPlusShopConfig && typeof parsed.rustPlusShopConfig === 'object' ? parsed.rustPlusShopConfig : {}),
      smartAutomation: {
        ...DEFAULT_STATE.rustPlusShopConfig.smartAutomation,
        ...(parsed.rustPlusShopConfig?.smartAutomation && typeof parsed.rustPlusShopConfig.smartAutomation === 'object'
          ? parsed.rustPlusShopConfig.smartAutomation
          : {})
      }
    },
    rustPlusTelemetry: {
      ...DEFAULT_STATE.rustPlusTelemetry,
      ...(parsed.rustPlusTelemetry && typeof parsed.rustPlusTelemetry === 'object' ? parsed.rustPlusTelemetry : {}),
      vendingMachines: Array.isArray(parsed.rustPlusTelemetry?.vendingMachines) ? parsed.rustPlusTelemetry.vendingMachines : []
    }
  };
  return { state, hadLegacy: Boolean(rustPlus || markers || mapConfig) };
}

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      const raw = fs.readFileSync(STATE_FILE, 'utf8');
      const { state, hadLegacy } = hydrateStateFromParsed(safeJsonParse(raw));
      if (hadLegacy) saveState(state);
      return state;
    } catch (err) {
      console.error('[State] Failed to read squad-state.json:', err.message);
      // Preserve corrupt file for diagnostics before attempting backup recovery
      try {
        const corruptPath = path.join(DATA_DIR, `squad-state.corrupt-${Date.now()}.json`);
        fs.copyFileSync(STATE_FILE, corruptPath);
      } catch (_) {}
    }
  }

  if (fs.existsSync(STATE_BACKUP_FILE)) {
    try {
      const bakRaw = fs.readFileSync(STATE_BACKUP_FILE, 'utf8');
      const { state } = hydrateStateFromParsed(safeJsonParse(bakRaw));
      console.warn('[State] Recovered squad state from backup:', STATE_BACKUP_FILE);
      saveState(state);
      return state;
    } catch (bakErr) {
      console.error('[State] Failed to recover backup squad-state.json.bak:', bakErr.message);
    }
  }

  const fresh = JSON.parse(JSON.stringify(DEFAULT_STATE));
  saveState(fresh);
  return fresh;
}

function saveState(state) {
  try {
    state.updatedAt = Date.now();
    const serialized = JSON.stringify(state, null, 2);
    // Keep a rolling backup of the last known good state before atomic replacement
    if (fs.existsSync(STATE_FILE)) {
      try { fs.copyFileSync(STATE_FILE, STATE_BACKUP_FILE); } catch (_) {}
    }
    fs.writeFileSync(STATE_TMP_FILE, serialized, 'utf8');
    fs.renameSync(STATE_TMP_FILE, STATE_FILE);
  } catch (err) {
    try { if (fs.existsSync(STATE_TMP_FILE)) fs.unlinkSync(STATE_TMP_FILE); } catch (_) {}
    console.error('[State] Failed to save squad-state.json:', err.message);
  }
}

let squadState = loadState();
const sseClients = new Set();

function writeSseFrame(res, frame) {
  if (!res || res.destroyed || res.writableEnded || res.writableLength > 512 * 1024) {
    sseClients.delete(res);
    try { if (res && !res.destroyed) res.destroy(); } catch (_) {}
    return;
  }
  try {
    res.write(frame);
  } catch (_) {
    sseClients.delete(res);
    try { if (!res.destroyed) res.destroy(); } catch (_) {}
  }
}

function broadcastState(eventType = 'state_update', extra = {}) {
  const payload = JSON.stringify({
    type: eventType,
    state: squadState,
    ...extra,
    timestamp: Date.now()
  });
  const frame = `data: ${payload}\n\n`;
  for (const res of sseClients) {
    writeSseFrame(res, frame);
  }
}

function isAllowedHost(hostname, allowedRootDomains) {
  const h = String(hostname || '').toLowerCase();
  return allowedRootDomains.some((dom) => h === dom || h.endsWith(`.${dom}`));
}

function assertSafeHttpsUrl(urlStr, allowedRootDomains) {
  const u = new URL(urlStr);
  if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443')) {
    throw new Error(`Blocked unsafe URL protocol/port/credentials for ${u.hostname}`);
  }
  if (!isAllowedHost(u.hostname, allowedRootDomains)) {
    throw new Error(`Host "${u.hostname}" is not in the allowlist`);
  }
  return u;
}

function isValidDiscordWebhookUrl(urlStr) {
  try {
    const u = assertSafeHttpsUrl(String(urlStr || '').trim(), ['discord.com', 'discordapp.com']);
    return u.pathname.startsWith('/api/webhooks/');
  } catch (_) {
    return false;
  }
}

function addBoundedSetEntry(setObj, key, maxSize = 1000) {
  setObj.add(key);
  if (setObj.size > maxSize) {
    const oldest = setObj.values().next().value;
    if (oldest !== undefined) setObj.delete(oldest);
  }
}

function pruneMapCache(mapObj, maxSize = 200, ttlMs = 0) {
  const now = Date.now();
  if (ttlMs > 0) {
    for (const [k, v] of mapObj) {
      if (now - v.time >= ttlMs) mapObj.delete(k);
    }
  }
  while (mapObj.size > maxSize) {
    const oldestKey = mapObj.keys().next().value;
    if (oldestKey === undefined) break;
    mapObj.delete(oldestKey);
  }
}

// ============================================================================
// BATTLEMETRICS PROXY & DISCORD WEBHOOK HELPER
// ============================================================================
const bmCache = new Map();
const BM_CACHE_TTL = 60 * 1000;
const rustmapsAnalyzeCache = new Map();
const RUSTMAPS_CACHE_TTL_MS = 6 * 3600 * 1000;
const rustmapsImageCache = new Map();
const RUSTMAPS_IMG_CACHE_TTL_MS = 3600 * 1000;
const RUSTMAPS_IMG_MAX_ENTRIES = 64;
const RUSTMAPS_IMG_MAX_TOTAL_BYTES = 24 * 1024 * 1024;
const RUSTMAPS_IMG_MAX_SINGLE_BYTES = 4 * 1024 * 1024;
const RUSTMAPS_IMG_HARD_CAP_BYTES = 12 * 1024 * 1024;
let rustmapsImageCacheBytes = 0;

function getCachedRustMapsImage(key) {
  const entry = rustmapsImageCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.time >= RUSTMAPS_IMG_CACHE_TTL_MS) {
    rustmapsImageCache.delete(key);
    rustmapsImageCacheBytes = Math.max(0, rustmapsImageCacheBytes - entry.buffer.length);
    return null;
  }
  // Touch LRU order
  rustmapsImageCache.delete(key);
  rustmapsImageCache.set(key, entry);
  return entry;
}

function setCachedRustMapsImage(key, contentType, buffer) {
  if (!buffer || buffer.length > RUSTMAPS_IMG_MAX_SINGLE_BYTES) return;
  const existing = rustmapsImageCache.get(key);
  if (existing) {
    rustmapsImageCache.delete(key);
    rustmapsImageCacheBytes = Math.max(0, rustmapsImageCacheBytes - existing.buffer.length);
  }
  const now = Date.now();
  for (const [k, v] of rustmapsImageCache.entries()) {
    if (now - v.time >= RUSTMAPS_IMG_CACHE_TTL_MS) {
      rustmapsImageCache.delete(k);
      rustmapsImageCacheBytes = Math.max(0, rustmapsImageCacheBytes - v.buffer.length);
    }
  }
  while (
    rustmapsImageCache.size >= RUSTMAPS_IMG_MAX_ENTRIES ||
    (rustmapsImageCacheBytes + buffer.length > RUSTMAPS_IMG_MAX_TOTAL_BYTES && rustmapsImageCache.size > 0)
  ) {
    const oldestKey = rustmapsImageCache.keys().next().value;
    if (!oldestKey) break;
    const oldest = rustmapsImageCache.get(oldestKey);
    rustmapsImageCache.delete(oldestKey);
    if (oldest) rustmapsImageCacheBytes = Math.max(0, rustmapsImageCacheBytes - oldest.buffer.length);
  }
  rustmapsImageCache.set(key, { time: now, contentType, buffer });
  rustmapsImageCacheBytes += buffer.length;
}

function extractBearerToken(authHeader) {
  const m = String(authHeader || '').match(/^Bearer\s+(.+)$/i);
  if (!m) return '';
  return m[1].replace(/[\r\n]/g, '').trim();
}

function sanitizeSecretInError(msg, secret) {
  const text = String(msg || 'Request failed');
  return secret && text.includes(secret) ? text.replaceAll(secret, '[REDACTED]') : text;
}

function fetchJsonHttps(urlStr, token = '') {
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(urlStr);
      if (
        parsed.protocol !== 'https:' ||
        parsed.hostname !== 'api.battlemetrics.com' ||
        (parsed.port && parsed.port !== '443') ||
        parsed.username ||
        parsed.password
      ) {
        return reject(new Error('Blocked non-BattleMetrics upstream URL'));
      }
    } catch (_) {
      return reject(new Error('Invalid BattleMetrics URL'));
    }

    const cleanToken = String(token || '').replace(/[\r\n]/g, '').trim();
    const effectiveToken = cleanToken || BM_TOKEN;
    const tokenScope = cleanToken
      ? crypto.createHash('sha256').update(cleanToken).digest('hex').slice(0, 12)
      : 'default';
    const cacheKey = `${urlStr}::${tokenScope}`;

    const cached = bmCache.get(cacheKey);
    if (cached && Date.now() - cached.time < BM_CACHE_TTL) {
      return resolve(cached.data);
    }

    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'RustTacticalCompanion/2.1'
    };
    if (effectiveToken) {
      headers['Authorization'] = `Bearer ${effectiveToken}`;
    }

    const req = https.get(urlStr, { headers, timeout: 8000 }, (res) => {
      const chunks = [];
      let totalBytes = 0;
      let aborted = false;
      res.on('data', (chunk) => {
        if (aborted) return;
        totalBytes += chunk.length;
        if (totalBytes > 4 * 1024 * 1024) {
          aborted = true;
          req.destroy();
          return reject(new Error('BattleMetrics response too large'));
        }
        chunks.push(chunk);
      });
      res.on('error', (err) => {
        if (!aborted) reject(new Error(sanitizeSecretInError(err.message, effectiveToken)));
      });
      res.on('end', () => {
        if (aborted) return;
        const body = Buffer.concat(chunks).toString('utf8');
        try {
          const json = safeJsonParse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            pruneMapCache(bmCache, 199, BM_CACHE_TTL);
            bmCache.set(cacheKey, { time: Date.now(), data: json });
            resolve(json);
          } else {
            const detail = json?.errors?.[0]?.detail || `BattleMetrics HTTP ${res.statusCode}`;
            reject(new Error(sanitizeSecretInError(detail, effectiveToken)));
          }
        } catch (err) {
          reject(new Error(`Invalid JSON from BattleMetrics: ${sanitizeSecretInError(err.message, effectiveToken)}`));
        }
      });
    });

    req.on('error', (err) => reject(new Error(sanitizeSecretInError(err.message, effectiveToken))));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('BattleMetrics request timed out'));
    });
  });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;
    let settled = false;
    const fail = (message, statusCode) => {
      if (settled) return;
      settled = true;
      const err = new Error(message);
      err.statusCode = statusCode;
      reject(err);
    };

    req.on('data', (chunk) => {
      if (settled) return;
      totalBytes += chunk.length;
      if (totalBytes > 2 * 1024 * 1024) {
        req.destroy();
        fail('Payload too large', 413);
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (settled) return;
      const body = Buffer.concat(chunks).toString('utf8');
      if (!body) {
        settled = true;
        return resolve({});
      }
      try {
        const parsed = safeJsonParse(body);
        settled = true;
        resolve(parsed);
      } catch (e) {
        fail('Invalid JSON payload', 400);
      }
    });
    req.on('error', (err) => fail(err.message || 'Request body error', 400));
  });
}

function sendJson(res, statusCode, data) {
  if (res.headersSent || res.writableEnded || res.destroyed) return;
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
  const provided = String(req.headers['x-squad-pin'] || '');
  // Constant-time comparison via fixed-length SHA-256 digests prevents PIN length/timing leaks
  const providedHash = crypto.createHash('sha256').update(provided).digest();
  const expectedHash = crypto.createHash('sha256').update(SQUAD_PIN).digest();
  if (!crypto.timingSafeEqual(providedHash, expectedHash)) {
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
    const cleanToken = String(botToken || '').replace(/^Bot\s+/i, '').replace(/[\r\n]/g, '').trim();
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
        res.on('error', reject);
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
    if (!isValidDiscordWebhookUrl(webhookUrl)) {
      return reject(new Error('Invalid Discord Webhook URL'));
    }
    const parsed = new URL(String(webhookUrl).trim());
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
        res.on('error', reject);
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

  if (isValidDiscordWebhookUrl(settings.webhookUrl)) {
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
    let parsed;
    try {
      parsed = assertSafeHttpsUrl(urlStr, ['rustmaps.com']);
    } catch (err) {
      return reject(err);
    }
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
          let nextUrl;
          try {
            nextUrl = new URL(res.headers.location, urlStr).toString();
            assertSafeHttpsUrl(nextUrl, ['rustmaps.com']);
          } catch (err) {
            res.resume();
            return reject(err);
          }
          res.resume();
          return fetchTextHttps(nextUrl, redirectCount + 1).then(resolve, reject);
        }
        const chunks = [];
        let totalBytes = 0;
        let aborted = false;
        res.on('data', (c) => {
          if (aborted) return;
          totalBytes += c.length;
          if (totalBytes > 10 * 1024 * 1024) {
            aborted = true;
            req.destroy();
            return reject(new Error('Upstream response too large'));
          }
          chunks.push(c);
        });
        res.on('error', (err) => { if (!aborted) reject(err); });
        res.on('end', () => {
          if (aborted) return;
          const body = Buffer.concat(chunks).toString('utf8');
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
  // Cap at 10 varint bytes (64-bit) so malformed payloads cannot spin or shift unboundedly
  while (pos < buf.length && shift <= 63n) {
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
  const cleanPlayerId = String(playerId || '0').replace(/[^\d]/g, '') || '0';
  const parsedToken = parseInt(String(playerToken || '0'), 10);
  const safeToken = Number.isFinite(parsedToken) ? parsedToken : 0;
  writeVarint(out, (1 << 3) | 0);
  writeVarint(out, seq);
  writeVarint(out, (2 << 3) | 0);
  writeVarint(out, BigInt(cleanPlayerId));
  writeVarint(out, (3 << 3) | 0);
  writeVarint(out, BigInt(safeToken));
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
          if (rfn === 4) resp.success = true;
          else if (rfn === 5) resp.error = decodeRustPlusAppError(sub);
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
    const parsedPort = parseInt(String(cfg.port || '28082'), 10);
    const port = parsedPort >= 1 && parsedPort <= 65535 ? parsedPort : 28082;
    const serverId = String(cfg.serverId || '').trim();
    const authToken = String(cfg.authToken || '').trim();
    const playerId = String(cfg.playerId || '').trim();
    const playerToken = String(cfg.playerToken || '').trim();
    if ((!ip && !serverId) || !playerId || !playerToken) {
      return reject(new Error('Pair a server or enter Server IP / ID, SteamID64, and PlayerToken first.'));
    }
    if (ip && !/^([a-zA-Z0-9.-]{1,253}|\[[0-9a-fA-F:]+\])$/.test(ip)) {
      return reject(new Error('Invalid Rust+ Server IP / hostname format.'));
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
        path: `/game/${encodeURIComponent(ip)}/${port}`,
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
          if (!Number.isFinite(payloadLen) || payloadLen < 0 || payloadLen > 32 * 1024 * 1024) {
            socket.destroy();
            return;
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

const sentWorldEventAlerts = new Set();
const sentSmartAlarmAlerts = new Set();
const sentLowUpkeepAlerts = new Set();
const processedChatBotKeys = new Set();
const lastAutomationPhaseByServer = new Map();
let hasSeededChatBot = false;
let lastChatBotReplyAt = 0;

function normalizeSmartAutomation(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    duskAutoSwitchIds: Array.isArray(src.duskAutoSwitchIds)
      ? Array.from(new Set(src.duskAutoSwitchIds.map((id) => String(id).replace(/[^\d]/g, '')).filter(Boolean))).slice(0, 24)
      : [],
    alarmDefenseSwitchIds: Array.isArray(src.alarmDefenseSwitchIds)
      ? Array.from(new Set(src.alarmDefenseSwitchIds.map((id) => String(id).replace(/[^\d]/g, '')).filter(Boolean))).slice(0, 24)
      : [],
    switchGroups: Array.isArray(src.switchGroups)
      ? src.switchGroups
          .map((g) => ({
            id: String(g?.id || 'grp-' + Date.now()).slice(0, 40),
            name: String(g?.name || 'Switch Group').trim().slice(0, 40) || 'Switch Group',
            entityIds: Array.isArray(g?.entityIds)
              ? Array.from(new Set(g.entityIds.map((id) => String(id).replace(/[^\d]/g, '')).filter(Boolean))).slice(0, 20)
              : []
          }))
          .filter((g) => g.entityIds.length > 0)
          .slice(0, 12)
      : []
  };
}

function appendActivityLogEntries(existingLog, newEntries) {
  const list = Array.isArray(existingLog) ? [...existingLog] : [];
  const now = Date.now();
  for (const entry of newEntries || []) {
    if (!entry || !entry.text) continue;
    const isDup = list.some(
      (prev) =>
        prev.category === entry.category &&
        prev.text === entry.text &&
        Math.abs(now - Number(prev.ts || 0)) < 45000
    );
    if (isDup) continue;
    list.unshift({
      id: `act-${now}-${Math.random().toString(36).slice(2, 6)}`,
      ts: entry.ts || now,
      icon: entry.icon || '📡',
      category: entry.category || 'info',
      text: String(entry.text).slice(0, 220),
      grid: String(entry.grid || '').slice(0, 12)
    });
  }
  return list.slice(0, 40);
}

function findMatchingSwitchesForQuery(query, smartDevices, switchGroups = []) {
  const q = String(query || '').trim().toLowerCase();
  const switches = (Array.isArray(smartDevices) ? smartDevices : []).filter((d) => d.entityType === 'switch');
  if (!q || switches.length === 0) return [];
  if (q === 'all') return switches;
  const grpMatch = (Array.isArray(switchGroups) ? switchGroups : []).find(
    (g) => String(g.name || '').toLowerCase() === q || String(g.name || '').toLowerCase().includes(q)
  );
  if (grpMatch) {
    const idSet = new Set(grpMatch.entityIds.map(String));
    const grouped = switches.filter((sw) => idSet.has(String(sw.entityId)));
    if (grouped.length) return grouped;
  }
  const exact = switches.filter(
    (sw) => String(sw.name || '').toLowerCase() === q || String(sw.entityId) === q
  );
  if (exact.length) return exact;
  return switches.filter((sw) => String(sw.name || '').toLowerCase().includes(q));
}

async function applySmartSwitchBatch(cfg, targetSwitches, nextActive) {
  const list = Array.isArray(squadState.rustPlusTelemetry?.smartDevices) ? [...squadState.rustPlusTelemetry.smartDevices] : [];
  const changed = [];
  for (const sw of targetSwitches) {
    const eid = parseInt(String(sw.entityId || '0'), 10);
    if (!eid) continue;
    await sendRustPlusCommand(cfg, 15, { entityId: eid, bytes: [0x08, nextActive ? 0x01 : 0x00] });
    const idx = list.findIndex((d) => String(d.entityId) === String(eid));
    if (idx >= 0) list[idx] = { ...list[idx], active: Boolean(nextActive) };
    changed.push(sw.name || `#${eid}`);
  }
  if (changed.length > 0) {
    squadState.rustPlusTelemetry = {
      ...DEFAULT_STATE.rustPlusTelemetry,
      ...(squadState.rustPlusTelemetry || {}),
      smartDevices: list
    };
  }
  return changed;
}

async function evaluateRustPlusAutomation(cfg, telemetry, serverKey, triggeredAlarms = []) {
  const auto = normalizeSmartAutomation(cfg?.smartAutomation);
  const devs = Array.isArray(telemetry?.smartDevices) ? telemetry.smartDevices : [];
  const switches = devs.filter((d) => d.entityType === 'switch');
  const logs = [];

  // 1. Dusk / Dawn Edge-Triggered Lights
  if (telemetry?.time && auto.duskAutoSwitchIds.length > 0 && switches.length > 0) {
    const phase = telemetry.time.isDay ? 'day' : 'night';
    const prevPhase = lastAutomationPhaseByServer.get(serverKey);
    lastAutomationPhaseByServer.set(serverKey, phase);
    if (prevPhase && prevPhase !== phase) {
      const wantOn = phase === 'night';
      const idSet = new Set(auto.duskAutoSwitchIds);
      const targets = switches.filter((sw) => idSet.has(String(sw.entityId)) && Boolean(sw.active) !== wantOn);
      if (targets.length > 0) {
        try {
          const changed = await applySmartSwitchBatch(cfg, targets, wantOn);
          if (changed.length > 0) {
            logs.push({
              icon: wantOn ? '🌙' : '☀️',
              category: 'automation',
              text: `${wantOn ? 'Dusk' : 'Dawn'} auto-switched ${wantOn ? 'ON' : 'OFF'}: ${changed.join(', ')}`
            });
          }
        } catch (err) {
          console.log('[Rust+ Auto Dusk] Switch toggle error:', err.message);
        }
      }
    }
  }

  // 2. Smart Alarm Trigger -> Defense Failsafe ON
  if (triggeredAlarms.length > 0 && auto.alarmDefenseSwitchIds.length > 0 && switches.length > 0) {
    const idSet = new Set(auto.alarmDefenseSwitchIds);
    const targets = switches.filter((sw) => idSet.has(String(sw.entityId)) && !sw.active);
    if (targets.length > 0) {
      try {
        const changed = await applySmartSwitchBatch(cfg, targets, true);
        if (changed.length > 0) {
          const msg = `🚨 FAIL-SAFE ON (${triggeredAlarms.map((a) => a.name).join(', ')}): ${changed.join(', ')}`;
          logs.push({ icon: '🛡️', category: 'automation', text: msg });
          try {
            await sendRustPlusCommand(cfg, 13, encodeRustPlusSendMessage(`🤖 ${msg}`));
          } catch (_) {}
        }
      } catch (err) {
        console.log('[Rust+ Auto Alarm] Failsafe switch error:', err.message);
      }
    }
  }

  if (logs.length > 0) {
    squadState.rustPlusTelemetry.activityLog = appendActivityLogEntries(squadState.rustPlusTelemetry?.activityLog, logs);
    saveState(squadState);
    broadcastState('state_update');
  }
}

function formatBotTcUpkeep(protectionExpirySec, hasProtection) {
  if (!hasProtection && !protectionExpirySec) return 'No Upkeep';
  const remSec = Number(protectionExpirySec || 0) - Math.floor(Date.now() / 1000);
  if (remSec <= 0) return 'DECAYING!';
  const d = Math.floor(remSec / 86400);
  const h = Math.floor((remSec % 86400) / 3600);
  const m = Math.floor((remSec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m!`;
}

async function processTeamChatBotCommands(teamChat, cfg, telemetry) {
  if (cfg?.chatBotEnabled === false || !Array.isArray(teamChat) || teamChat.length === 0) return;
  if (!hasSeededChatBot) {
    for (const m of teamChat) {
      processedChatBotKeys.add(`${m.steamId}:${m.time}:${m.message}`);
    }
    hasSeededChatBot = true;
    return;
  }
  if (Date.now() - lastChatBotReplyAt < 4000) return;
  const nowSec = Math.floor(Date.now() / 1000);

  for (const m of teamChat.slice(-8)) {
    const rawMsg = String(m?.message || '').trim();
    const key = `${m?.steamId}:${m?.time}:${rawMsg}`;
    if (!rawMsg || processedChatBotKeys.has(key)) continue;
    processedChatBotKeys.add(key);
    if (processedChatBotKeys.size > 400) {
      const firstKey = processedChatBotKeys.values().next().value;
      if (firstKey) processedChatBotKeys.delete(firstKey);
    }
    if (rawMsg.startsWith('🤖') || !rawMsg.startsWith('!')) continue;
    if (m.time && Math.abs(nowSec - Number(m.time)) > 180) continue;

    const parts = rawMsg.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ').trim();
    let reply = '';
    if (cmd === '!help' || cmd === '!bot') {
      reply = '🤖 !shops <item> | !raid <qty target> | !events | !time | !pop | !upkeep | !timers | !switches | !on/!off <name>';
    } else if (cmd === '!shops' || cmd === '!shop' || cmd === '!buy') {
      const shops = Array.isArray(telemetry?.vendingMachines) ? telemetry.vendingMachines : [];
      if (!shops.length) {
        reply = '🤖 No Vending Machines cached yet — poll Rust+ or wait for sync.';
      } else if (!arg) {
        const inStockShops = shops.filter((s) => !s.outOfStock).length;
        reply = `🤖 ${shops.length} shops (${inStockShops} stocked). Usage: !shops <item>`;
      } else {
        const q = arg.toLowerCase();
        const hits = [];
        for (const sh of shops) {
          for (const o of sh.sellOrders || []) {
            const iName = String(o.itemName || '');
            const iShort = String(o.itemShortname || '');
            if (iName.toLowerCase().includes(q) || iShort.toLowerCase().includes(q)) {
              const unitCost = o.quantity > 0 ? o.costPerItem / o.quantity : o.costPerItem;
              hits.push({
                grid: sh.grid || '?',
                itemName: iName + (o.itemIsBp ? ' (BP)' : ''),
                qty: o.quantity,
                cost: o.costPerItem,
                currency: o.currencyName || 'Scrap',
                stock: o.amountInStock,
                unitCost
              });
            }
          }
        }
        hits.sort((a, b) => {
          const sa = a.stock > 0 ? 0 : 1;
          const sb = b.stock > 0 ? 0 : 1;
          if (sa !== sb) return sa - sb;
          return a.unitCost - b.unitCost;
        });
        if (!hits.length) {
          reply = `🤖 No shops selling "${arg}".`;
        } else {
          const formatted = hits
            .slice(0, 3)
            .map((h) => `[${h.grid}] ${h.qty}x${h.itemName}=${h.cost} ${h.currency} (${h.stock > 0 ? `x${h.stock}` : 'OUT'})`)
            .join(' | ');
          reply = `🤖 ${formatted}`.slice(0, 235);
        }
      }
    } else if (cmd === '!events' || cmd === '!cargo' || cmd === '!heli' || cmd === '!crate') {
      const evts = Array.isArray(telemetry?.liveEvents) ? telemetry.liveEvents : [];
      reply = evts.length
        ? `🤖 Events: ${evts.slice(0, 5).map((e) => `${e.label}[${e.grid}]`).join(' | ')}`.slice(0, 235)
        : '🤖 No active Cargo / Heli / Crate events right now.';
    } else if (cmd === '!raid') {
      const mQty = /^(\d+)\s+(.+)$/.exec(arg);
      const qty = mQty ? Math.min(50, Math.max(1, parseInt(mQty[1], 10) || 1)) : 1;
      const targetQ = (mQty ? mQty[2] : arg).toLowerCase().trim();
      const BOT_RAID_TABLE = [
        { keys: ['wood door', 'wooden door'], name: 'Wood Door', sulfur: 475, combo: '19 Explo / 2 Molotov (0S)' },
        { keys: ['sheet', 'metal door'], name: 'Sheet Door', sulfur: 1575, combo: '63 Explo / 1R+8 Explo' },
        { keys: ['garage'], name: 'Garage Door', sulfur: 3200, combo: '1C4+40 Explo / 3R=4,200S' },
        { keys: ['armored door', 'hqm door', 'toptier door'], name: 'Armored Door', sulfur: 5150, combo: '2C4+30 Explo / 5R=7,000S' },
        { keys: ['wood wall'], name: 'Wood Wall', sulfur: 1225, combo: '49 Explo / 4 Molotov (0S)' },
        { keys: ['stone', 'high stone', 'high external'], name: 'Stone Wall', sulfur: 4300, combo: '1C4+84 Explo / 4R=5,600S' },
        { keys: ['metal wall', 'sheet wall'], name: 'Metal Wall', sulfur: 8350, combo: '3C4+70 Explo / 8R=11,200S' },
        { keys: ['armored wall', 'hqm wall', 'hqm'], name: 'Armored Wall', sulfur: 16150, combo: '7C4+30 Explo / 15R=21,000S' },
        { keys: ['turret', 'auto turret'], name: 'Auto Turret', sulfur: 600, combo: '3 HV Rockets' },
        { keys: ['window', 'embrasure', 'reinforced'], name: 'Window/Embrasure', sulfur: 2950, combo: '1C4+30 Explo' }
      ];
      const hit = targetQ ? BOT_RAID_TABLE.find((r) => r.keys.some((k) => targetQ.includes(k))) : null;
      if (!targetQ || !hit) {
        reply = '🤖 Usage: !raid <qty> <sheet|garage|armored door|stone|metal|hqm wall|turret>';
      } else {
        const totalSulfur = hit.sulfur * qty;
        reply = `🤖 Raid ${qty}x ${hit.name}: ${totalSulfur.toLocaleString('en-US')} Sulfur (${hit.combo} ea)`;
      }
    } else if (cmd === '!time' || cmd === '!day' || cmd === '!night') {
      const t = telemetry?.time;
      reply = t
        ? `🤖 Clock: ${t.isDay ? 'Day' : 'Night'} ${t.formatted} — ${t.nextPhase} in ${t.minutesUntilChange}m`
        : '🤖 Clock not synced yet.';
    } else if (cmd === '!pop' || cmd === '!wipe') {
      const info = telemetry?.serverInfo;
      if (info) {
        const wipeSec = info.wipeTime ? Math.max(0, nowSec - Number(info.wipeTime)) : 0;
        const wipeStr = wipeSec > 0 ? ` • Wipe ${Math.floor(wipeSec / 86400)}d ${Math.floor((wipeSec % 86400) / 3600)}h` : '';
        const qStr = info.queuedPlayers > 0 ? ` (Q:${info.queuedPlayers})` : '';
        reply = `🤖 ${String(info.name || 'Server').slice(0, 32)}: ${info.players ?? '?'}/${info.maxPlayers ?? '?'}${qStr}${wipeStr}`;
      } else {
        reply = '🤖 Server info not synced yet.';
      }
    } else if (cmd === '!upkeep' || cmd === '!tc') {
      const tcs = (telemetry?.smartDevices || []).filter((d) => d.entityType === 'storage');
      reply = tcs.length
        ? `🤖 TC Upkeep: ${tcs.slice(0, 4).map((tc) => `${tc.name}: ${formatBotTcUpkeep(tc.protectionExpiry, tc.hasProtection)}`).join(' | ')}`
        : '🤖 No TC Storage Monitors linked yet.';
    } else if (cmd === '!timers') {
      const nowMs = Date.now();
      const live = (Array.isArray(squadState.activeTimers) ? squadState.activeTimers : [])
        .filter((t) => !t.paused && t.endsAt > nowMs)
        .sort((a, b) => a.endsAt - b.endsAt)
        .slice(0, 3);
      reply = live.length
        ? `🤖 Timers: ${live
            .map((t) => {
              const s = Math.max(0, Math.round((t.endsAt - nowMs) / 1000));
              return `${String(t.name).slice(0, 22)} (${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s)`;
            })
            .join(' | ')}`
        : '🤖 No active monument/crate timers.';
    } else if (cmd === '!switches' || cmd === '!sw') {
      const sws = (telemetry?.smartDevices || []).filter((d) => d.entityType === 'switch');
      const grps = normalizeSmartAutomation(cfg?.smartAutomation).switchGroups;
      if (!sws.length) {
        reply = '🤖 No Smart Switches linked yet.';
      } else {
        const swList = sws.slice(0, 5).map((s) => `${s.name}[${s.active ? 'ON' : 'OFF'}]`).join(', ');
        const grpTxt = grps.length ? ` | Groups: ${grps.map((g) => g.name).join(', ')}` : '';
        reply = `🤖 Switches: ${swList}${grpTxt}`.slice(0, 230);
      }
    } else if (cmd === '!on' || cmd === '!off') {
      if (cfg?.chatBotAllowSwitchControl === false) {
        reply = '🤖 Switch control via Team Chat is disabled.';
      } else if (!arg) {
        reply = `🤖 Usage: ${cmd} <switch or group name>`;
      } else {
        const desired = cmd === '!on';
        const grps = normalizeSmartAutomation(cfg?.smartAutomation).switchGroups;
        const matched = findMatchingSwitchesForQuery(arg, telemetry?.smartDevices, grps);
        if (!matched.length) {
          reply = `🤖 No Smart Switch matched "${arg}". Try !switches`;
        } else {
          try {
            const changed = await applySmartSwitchBatch(cfg, matched, desired);
            if (changed.length > 0) {
              squadState.rustPlusTelemetry.activityLog = appendActivityLogEntries(
                squadState.rustPlusTelemetry?.activityLog,
                [{ icon: '⚡', category: 'chat', text: `${m.name || 'Chat'} turned ${desired ? 'ON' : 'OFF'}: ${changed.join(', ')}` }]
              );
              reply = `🤖 ⚡ ${changed.join(', ')} turned ${desired ? 'ON' : 'OFF'}`;
            } else {
              reply = `🤖 Could not toggle switch "${arg}".`;
            }
          } catch (err) {
            reply = `🤖 Switch error: ${String(err.message || '').slice(0, 120)}`;
          }
        }
      }
    }

    if (reply) {
      lastChatBotReplyAt = Date.now();
      try {
        await sendRustPlusCommand(cfg, 13, encodeRustPlusSendMessage(reply));
        squadState.rustPlusTelemetry.teamChat = [
          ...(squadState.rustPlusTelemetry.teamChat || []),
          { steamId: cfg.steamId || cfg.playerId || '0', name: '🤖 Companion', message: reply, color: '#a855f7', time: Math.floor(Date.now() / 1000) }
        ].slice(-30);
        saveState(squadState);
        broadcastState('state_update');
      } catch (err) {
        console.log('[Rust+ Bot] Chat reply skipped:', err.message);
      }
      break;
    }
  }
}
let rustPlusShopInterval = null;
let isRustPlusPolling = false;

const RUST_EVENT_MARKER_META = {
  2: { label: 'Raid Explosion', icon: '💥', color: '#ef4444' },
  4: { label: 'CH47 Chinook', icon: '✈️', color: '#38bdf8' },
  5: { label: 'Cargo Ship', icon: '🚢', color: '#06b6d4' },
  6: { label: 'Locked Crate', icon: '📦', color: '#f59e0b' },
  8: { label: 'Patrol Helicopter', icon: '🚁', color: '#f43f5e' },
  9: { label: 'Travelling Vendor', icon: '🚐', color: '#a3e635' },
  10: { label: 'Deep Sea', icon: '🌊', color: '#06b6d4' }
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
  const nowTs = Date.now();

  // Decode Live World Events (Cargo, Patrol Heli, CH47, Locked Crate, Explosion, Travelling Vendor, Named Event Zones)
  const liveEvents = [];
  const newEvents = [];
  for (const mk of rawMarkers) {
    const meta = RUST_EVENT_MARKER_META[mk.type] || ((mk.type === 7 || mk.type >= 9) && String(mk.name || '').trim()
      ? { label: String(mk.name).trim(), icon: /deep|sea/i.test(String(mk.name || '')) ? '🌊' : '📡', color: '#a855f7' }
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
      addBoundedSetEntry(sentWorldEventAlerts, evtAlertKey);
      newEvents.push(evt);
    }
  }

  // Decode Live Vending Machines (type === 3)
  const vendingMachines = [];
  for (const mk of rawMarkers) {
    if (mk.type !== 3) continue;
    const rawOrders = Array.isArray(mk.sellOrders) ? mk.sellOrders.slice(0, 24) : [];
    const orders = rawOrders.map((so) => {
      const itemMeta = resolveRustItemInfo(so.itemId);
      const currMeta = resolveRustItemInfo(so.currencyId);
      return {
        itemId: Number(so.itemId || 0),
        itemName: itemMeta.name,
        itemShortname: itemMeta.shortname,
        itemIsBp: Boolean(so.itemIsBlueprint),
        category: inferShopCategoryFromName(itemMeta.name),
        quantity: Number(so.quantity || 1),
        currencyId: Number(so.currencyId || 0),
        currencyName: currMeta.name,
        currencyShortname: currMeta.shortname,
        currencyIsBp: Boolean(so.currencyIsBlueprint),
        costPerItem: Number(so.costPerItem || 0),
        amountInStock: Number(so.amountInStock || 0)
      };
    });
    const inStockCount = orders.filter((o) => o.amountInStock > 0).length;
    const wx = Number((mk.x - mapSize / 2).toFixed(1));
    const wy = Number((mk.y - mapSize / 2).toFixed(1));
    const grid = worldGridLabelFromRustPlus(mk.x, mk.y, mapSize);
    vendingMachines.push({
      id: String(mk.id),
      name: String(mk.name || 'Vending Machine').trim().slice(0, 48),
      wx,
      wy,
      grid,
      outOfStock: Boolean(mk.outOfStock || inStockCount === 0),
      inStockCount,
      sellOrders: orders
    });
  }
  vendingMachines.sort((a, b) => {
    if (a.outOfStock !== b.outOfStock) return a.outOfStock ? 1 : -1;
    return b.inStockCount - a.inStockCount;
  });
  const boundedVendingMachines = vendingMachines.slice(0, 120);

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

  // Team Members, Persistent 15m Death Markers & Notes
  let teamMembers = Array.isArray(squadState.rustPlusTelemetry?.teamMembers) ? squadState.rustPlusTelemetry.teamMembers : [];
  const prevBySid = new Map(teamMembers.map((m) => [String(m.steamId), m]));
  const nowSec = Math.floor(nowTs / 1000);
  let recentDeaths = (Array.isArray(squadState.rustPlusTelemetry?.recentDeaths) ? squadState.rustPlusTelemetry.recentDeaths : [])
    .filter((d) => d && (nowSec - Number(d.deathTime || 0)) <= 900);
  const newDeaths = [];
  let mapNotes = Array.isArray(squadState.rustPlusTelemetry?.mapNotes) ? squadState.rustPlusTelemetry.mapNotes : [];
  if (snapshot?.teamInfo && Array.isArray(snapshot.teamInfo.members)) {
    const leaderId = String(snapshot.teamInfo.leaderSteamId || '0');
    teamMembers = snapshot.teamInfo.members.map((m) => {
      const nx = Math.min(1, Math.max(0, m.x / mapSize));
      const ny = Math.min(1, Math.max(0, 1 - m.y / mapSize));
      const tmObj = {
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
      const prevM = prevBySid.get(tmObj.steamId);
      const justDied = prevM && prevM.isAlive && !tmObj.isAlive;
      const recordedDeathSec = tmObj.deathTime > 0 ? tmObj.deathTime : justDied ? nowSec : 0;
      if (!tmObj.isAlive && recordedDeathSec > 0 && (nowSec - recordedDeathSec) <= 900) {
        const deathId = `${tmObj.steamId}:${recordedDeathSec}`;
        if (!recentDeaths.some((d) => d.id === deathId)) {
          const dEntry = {
            id: deathId,
            steamId: tmObj.steamId,
            name: tmObj.name,
            wx: tmObj.wx,
            wy: tmObj.wy,
            grid: tmObj.grid,
            deathTime: recordedDeathSec
          };
          recentDeaths.unshift(dEntry);
          newDeaths.push(dEntry);
        }
      }
      return tmObj;
    });
    recentDeaths = recentDeaths.slice(0, 12);
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
        addBoundedSetEntry(sentSmartAlarmAlerts, alarmKey);
        triggeredAlarms.push({ entityId: eid, name: dev.name || `Alarm #${eid}` });
      }
    }
    const protectionExpiry = Number(liveEnt.protectionExpiry || 0);
    if (mappedType === 'storage' && liveEnt.hasProtection && protectionExpiry > 0) {
      const remSec = protectionExpiry - Math.floor(nowTs / 1000);
      if (remSec > 0 && remSec < 21600) {
        const ukKey = `${serverKey}:upkeep:${eid}:${Math.floor(protectionExpiry / 3600)}`;
        if (!sentLowUpkeepAlerts.has(ukKey)) {
          addBoundedSetEntry(sentLowUpkeepAlerts, ukKey);
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

  const markerSummary = {
    total: rawMarkers.length,
    byType,
    eventsCount: liveEvents.length,
    shopsCount: boundedVendingMachines.length,
    mode: snapshot?.mode || 'auto',
    markerError: snapshot?.markerError || '',
    updatedAt: nowTs
  };

  // Auto-start 15:00 Locked Crate timers when enabled
  if ((cfg?.autoEventTimers ?? squadState.rustPlusShopConfig?.autoEventTimers) !== false && newEvents.some((e) => e.type === 6)) {
    const existingTimers = Array.isArray(squadState.activeTimers) ? [...squadState.activeTimers] : [];
    for (const ev of newEvents) {
      if (ev.type !== 6) continue;
      const tid = `rp-evt-${ev.id}`;
      if (!existingTimers.some((t) => String(t.id) === tid && !t.paused && Number(t.endsAt || 0) > nowTs)) {
        existingTimers.unshift({
          id: tid,
          name: `Locked Crate [${ev.grid}]`,
          category: 'Locked Crate',
          durationSec: 900,
          endsAt: nowTs + 900 * 1000,
          startedAt: nowTs,
          paused: false
        });
      }
    }
    squadState.activeTimers = existingTimers.slice(0, 40);
  }

  const newActivityEntries = [
    ...triggeredAlarms.map((a) => ({ icon: '🚨', category: 'alarm', text: `${a.name} RAID ALARM TRIGGERED!` })),
    ...lowUpkeepDevices.map((d) => ({ icon: '⚠️', category: 'upkeep', text: `${d.name} upkeep critical (${d.remHours}h left)` })),
    ...newDeaths.map((d) => ({ icon: '💀', category: 'death', text: `${d.name} died`, grid: d.grid })),
    ...newEvents.map((e) => ({ icon: e.icon || '⚡', category: 'event', text: `${e.label} spotted`, grid: e.grid }))
  ];
  const activityLog = appendActivityLogEntries(squadState.rustPlusTelemetry?.activityLog, newActivityEntries);

  squadState.rustPlusTelemetry = {
    serverInfo: nextServerInfo,
    time: timeSummary,
    mapMeta: prevMapMeta,
    liveEvents,
    teamMembers,
    recentDeaths,
    mapNotes,
    teamChat,
    smartDevices,
    vendingMachines: boundedVendingMachines,
    activityLog,
    markerSummary
  };
  squadState.rustPlusShopConfig = {
    ...DEFAULT_STATE.rustPlusShopConfig,
    ...(squadState.rustPlusShopConfig || {}),
    ...(cfg || {}),
    smartAutomation: normalizeSmartAutomation(cfg?.smartAutomation ?? squadState.rustPlusShopConfig?.smartAutomation),
    mapSize,
    ...(nextServerInfo.name ? { serverName: nextServerInfo.name } : {}),
    lastPolledAt: nowTs,
    lastStatus: `🟢 Live Rust+ (${snapshot?.mode || 'relay'}) • ${nextServerInfo.name || 'Server'} • 👥 ${nextServerInfo.players ?? '?'}/${nextServerInfo.maxPlayers ?? '?'}${timeSummary ? ` • 🕒 ${timeSummary.formatted}` : ''} • ⚡ ${liveEvents.length} events • 🛒 ${boundedVendingMachines.length} shops`
  };
  console.log(`[Rust+] Sync OK (${snapshot?.mode}): server=${nextServerInfo.name || serverKey} markers=${rawMarkers.length} byType=${JSON.stringify(byType)} events=${liveEvents.length} team=${teamMembers.length}`);
  saveState(squadState);
  broadcastState('state_update');

  await processTeamChatBotCommands(teamChat, squadState.rustPlusShopConfig, squadState.rustPlusTelemetry);
  await evaluateRustPlusAutomation(squadState.rustPlusShopConfig, squadState.rustPlusTelemetry, serverKey, triggeredAlarms);

  const settings = resolveDiscordSettings();
  const hasTarget = Boolean(
    isValidDiscordWebhookUrl(settings.webhookUrl) ||
      (settings.botToken && (settings.channelId || settings.dmUserId))
  );
  if (hasTarget) {
    if (squadState.rustPlusShopConfig.discordAlertEvents && newEvents.length > 0) {
      const evtLines = newEvents.slice(0, 4).map((e) => `• ${e.icon} **${e.label}** spotted at **[${e.grid}]**`).join('\n');
      sendDiscordNotification({
        title: `📡 Live Rust+ World Event Alert`,
        description: `${evtLines}${nextServerInfo.name ? `\n\nServer: **${nextServerInfo.name}**` : ''}`,
        color: 0x38bdf8
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
    eventsCount: liveEvents.length,
    shopsCount: boundedVendingMachines.length,
    teamCount: teamMembers.length,
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
    if (parsed.protocol !== 'https:') {
      return reject(new Error('Only HTTPS endpoints are permitted'));
    }
    const payload = JSON.stringify(bodyObj || {});
    const isFacepunch = isAllowedHost(parsed.hostname, ['facepunch.com']);
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
        const chunks = [];
        let totalBytes = 0;
        let aborted = false;
        res.on('data', (c) => {
          if (aborted) return;
          totalBytes += c.length;
          if (totalBytes > 2 * 1024 * 1024) {
            aborted = true;
            req.destroy();
            return reject(new Error('Upstream JSON response too large'));
          }
          chunks.push(c);
        });
        res.on('error', (err) => { if (!aborted) reject(err); });
        res.on('end', () => {
          if (aborted) return;
          const data = Buffer.concat(chunks).toString('utf8');
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
              res.on('error', reject);
              res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) resolve(data);
                else reject(new Error(`C2DM HTTP ${res.statusCode}`));
              });
            }
          );
          req.on('error', reject);
          req.on('timeout', () => {
            req.destroy(new Error('C2DM request timed out'));
          });
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

    let parsedUrl;
    try {
      // Fixed base origin prevents malformed/spoofed Host headers and protocol-relative //host URLs
      parsedUrl = new URL(req.url || '/', 'http://localhost');
    } catch (_) {
      return sendJson(res, 400, { error: 'Invalid request URL' });
    }
    if (parsedUrl.origin !== 'http://localhost') {
      return sendJson(res, 400, { error: 'Invalid request URL' });
    }
    const pathname = parsedUrl.pathname;

    // 1. SSE Live Stream
    if (pathname === '/api/events' && req.method === 'GET') {
      if (req.socket && typeof req.socket.setTimeout === 'function') {
        req.socket.setTimeout(0);
      }
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Access-Control-Allow-Origin': '*'
      });
      sseClients.add(res);
      const cleanupSse = () => {
        sseClients.delete(res);
      };
      req.on('close', cleanupSse);
      res.on('close', cleanupSse);
      res.on('error', cleanupSse);
      writeSseFrame(
        res,
        `data: ${JSON.stringify({
          type: 'connected',
          state: squadState,
          pinRequired: Boolean(SQUAD_PIN)
        })}\n\n`
      );
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
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
          return sendJson(res, 400, { error: 'State payload must be a JSON object' });
        }
        const prevTimersById = new Map((squadState.activeTimers || []).map((t) => [t.id, t]));
        const incomingTimers = Array.isArray(body.activeTimers) ? body.activeTimers : squadState.activeTimers;
        const mergedTimers = (incomingTimers || [])
          .filter((t) => t && typeof t === 'object')
          .map((t) => {
            const prev = prevTimersById.get(t.id);
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
        const mergedShopConfig = preserveRustPlus
          ? squadState.rustPlusShopConfig
          : {
              ...DEFAULT_STATE.rustPlusShopConfig,
              ...(squadState.rustPlusShopConfig || {}),
              ...(body.rustPlusShopConfig && typeof body.rustPlusShopConfig === 'object' ? body.rustPlusShopConfig : {}),
              smartAutomation: normalizeSmartAutomation(
                body.rustPlusShopConfig?.smartAutomation ?? squadState.rustPlusShopConfig?.smartAutomation
              )
            };
        squadState = {
          ...squadState,
          ...body,
          raidStash: {
            ...DEFAULT_STATE.raidStash,
            ...(squadState.raidStash || {}),
            ...(body.raidStash && typeof body.raidStash === 'object' && !Array.isArray(body.raidStash) ? body.raidStash : {})
          },
          battlemetrics: {
            ...DEFAULT_STATE.battlemetrics,
            ...(squadState.battlemetrics || {}),
            ...(body.battlemetrics && typeof body.battlemetrics === 'object' && !Array.isArray(body.battlemetrics) ? body.battlemetrics : {})
          },
          squadKeycards: {
            ...DEFAULT_STATE.squadKeycards,
            ...(squadState.squadKeycards || {}),
            ...(body.squadKeycards && typeof body.squadKeycards === 'object' && !Array.isArray(body.squadKeycards) ? body.squadKeycards : {})
          },
          discordConfig: {
            ...DEFAULT_STATE.discordConfig,
            ...(squadState.discordConfig || {}),
            ...(body.discordConfig && typeof body.discordConfig === 'object' && !Array.isArray(body.discordConfig) ? body.discordConfig : {})
          },
          rustPlusShopConfig: mergedShopConfig,
          rustPlusTelemetry: preserveRustPlus
            ? squadState.rustPlusTelemetry
            : (body.rustPlusTelemetry && typeof body.rustPlusTelemetry === 'object' && !Array.isArray(body.rustPlusTelemetry)
                ? body.rustPlusTelemetry
                : DEFAULT_STATE.rustPlusTelemetry),
          activeTimers: mergedTimers,
          raidQueue: Array.isArray(body.raidQueue) ? body.raidQueue : squadState.raidQueue,
          savedClones: Array.isArray(body.savedClones) ? body.savedClones : squadState.savedClones,
          squadPins: Array.isArray(body.squadPins) ? body.squadPins : squadState.squadPins,
          conveyorFilters: Array.isArray(body.conveyorFilters) ? body.conveyorFilters : squadState.conveyorFilters,
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
      const q = (parsedUrl.searchParams.get('q') || '').trim().slice(0, 120);
      const token = extractBearerToken(req.headers['authorization']);
      if (!q) {
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
      // Match strictly digits directly after /api/battlemetrics/server/ to reject path injection
      const serverId = pathname.slice('/api/battlemetrics/server/'.length);
      const token = extractBearerToken(req.headers['authorization']);
      if (!/^\d{1,20}$/.test(serverId)) {
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
        } else if (bmMatch || /^\d{5,20}$/.test(rawInput)) {
          const bmId = bmMatch ? bmMatch[1] : rawInput;
          const token = extractBearerToken(req.headers['authorization']);
          const bmData = await fetchJsonHttps(`https://api.battlemetrics.com/servers/${bmId}`, token);
          const details = bmData?.data?.attributes?.details || {};
          const rmDirect = details.rust_maps?.url;
          let parsedRmDirectSlug = '';
          if (typeof rmDirect === 'string' && rmDirect) {
            try {
              const rmDirectUrl = assertSafeHttpsUrl(rmDirect, ['rustmaps.com']);
              const slugMatch = rmDirectUrl.pathname.match(/^\/map\/([a-zA-Z0-9_-]+)/);
              if (slugMatch) parsedRmDirectSlug = slugMatch[1];
            } catch (_) {}
          }
          if (parsedRmDirectSlug) {
            rustmapsUrl = `https://rustmaps.com/map/${parsedRmDirectSlug}`;
          } else if (details.rust_world_size && details.rust_world_seed !== undefined) {
            const safeSize = parseInt(String(details.rust_world_size), 10);
            const safeSeed = parseInt(String(details.rust_world_seed), 10);
            if (!Number.isFinite(safeSize) || !Number.isFinite(safeSeed)) {
              return sendJson(res, 404, { error: 'This BattleMetrics server published invalid RustMaps seed/size.' });
            }
            rustmapsUrl = `https://rustmaps.com/map/${safeSize}_${safeSeed}`;
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
            const bbUrl = assertSafeHttpsUrl(mapData.buildingBlockAreaUrl, ['rustmaps.com']);
            const bbRaw = await fetchTextHttps(bbUrl.toString());
            const bbParsed = safeJsonParse(bbRaw);
            if (bbParsed && (Array.isArray(bbParsed.boxes) || Array.isArray(bbParsed.spheres))) {
              buildingBlockArea = {
                boxes: Array.isArray(bbParsed.boxes) ? bbParsed.boxes : [],
                spheres: Array.isArray(bbParsed.spheres) ? bbParsed.spheres : []
              };
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
          isCustomMap: Boolean(mapData.isCustomMap),
          rivers: Number(mapData.rivers || 0),
          lakes: Number(mapData.lakes || 0),
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
        pruneMapCache(rustmapsAnalyzeCache, 99, RUSTMAPS_CACHE_TTL_MS);
        rustmapsAnalyzeCache.set(rustmapsUrl, { time: Date.now(), payload: rmPayload });
        return sendJson(res, 200, rmPayload);
      } catch (err) {
        return sendJson(res, 502, { error: `Failed to analyze RustMaps URL: ${err.message}` });
      }
    }

    // 6C. Safe Image Proxy for RustMaps CDN (prevents CORS taint on canvas)
    if (pathname === '/api/rustmaps/image' && req.method === 'GET') {
      const target = parsedUrl.searchParams.get('url') || '';
      let u;
      try {
        u = assertSafeHttpsUrl(target, ['rustmaps.com']);
      } catch (_) {
        return sendJson(res, target ? 403 : 400, {
          error: target ? 'Only rustmaps.com HTTPS image URLs are allowed' : 'Invalid image URL'
        });
      }
      const cacheKey = u.toString();
      const cachedImg = getCachedRustMapsImage(cacheKey);
      if (cachedImg) {
        res.writeHead(200, {
          'Content-Type': cachedImg.contentType,
          'Content-Length': cachedImg.buffer.length,
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'public, max-age=3600',
          'X-Cache': 'HIT'
        });
        res.end(cachedImg.buffer);
        return;
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
          const status = imgRes.statusCode || 502;
          const ct = String(imgRes.headers['content-type'] || '').toLowerCase();
          if (status < 200 || status >= 300 || !ct.startsWith('image/')) {
            imgRes.resume();
            return sendJson(res, status >= 400 && status < 500 ? status : 502, {
              error: `Upstream image error (HTTP ${status})`
            });
          }
          const chunks = [];
          let totalBytes = 0;
          let streamingOversize = false;
          let aborted = false;
          imgRes.on('data', (chunk) => {
            if (aborted) return;
            totalBytes += chunk.length;
            if (totalBytes > RUSTMAPS_IMG_HARD_CAP_BYTES) {
              aborted = true;
              imgReq.destroy(new Error('Upstream image exceeds 12MB cap'));
              if (!res.destroyed) res.destroy();
              return;
            }
            if (!streamingOversize && totalBytes > RUSTMAPS_IMG_MAX_SINGLE_BYTES) {
              streamingOversize = true;
              res.writeHead(status, {
                'Content-Type': ct,
                'X-Content-Type-Options': 'nosniff',
                'Cache-Control': 'public, max-age=3600',
                'X-Cache': 'MISS'
              });
              for (const prev of chunks) res.write(prev);
              chunks.length = 0;
              res.write(chunk);
            } else if (streamingOversize) {
              res.write(chunk);
            } else {
              chunks.push(chunk);
            }
          });
          imgRes.on('error', () => {
            aborted = true;
            if (!res.headersSent) sendJson(res, 502, { error: 'Upstream image stream error' });
            else if (!res.destroyed) res.destroy();
          });
          imgRes.on('end', () => {
            if (aborted) return;
            if (streamingOversize) {
              if (!res.writableEnded) res.end();
              return;
            }
            const fullBuf = Buffer.concat(chunks);
            if (status === 200) {
              setCachedRustMapsImage(cacheKey, ct, fullBuf);
            }
            res.writeHead(status, {
              'Content-Type': ct,
              'Content-Length': fullBuf.length,
              'X-Content-Type-Options': 'nosniff',
              'Cache-Control': 'public, max-age=3600',
              'X-Cache': 'MISS'
            });
            res.end(fullBuf);
          });
        }
      );
      imgReq.on('timeout', () => imgReq.destroy(new Error('Image request timed out')));
      imgReq.on('error', (err) => {
        if (!res.headersSent) sendJson(res, 502, { error: err.message });
        else if (!res.destroyed) res.destroy();
      });
      req.on('close', () => {
        if (!imgReq.destroyed) imgReq.destroy();
      });
      imgReq.end();
      return;
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
          isValidDiscordWebhookUrl(settings.webhookUrl) ||
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
        addBoundedSetEntry(sentDiscordAlerts, alertKey);
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
        chatBotEnabled: body.chatBotEnabled !== false,
        chatBotAllowSwitchControl: body.chatBotAllowSwitchControl !== false,
        discordAlertEvents: body.discordAlertEvents !== false,
        autoEventTimers: body.autoEventTimers !== false,
        smartAutomation: normalizeSmartAutomation(
          body.smartAutomation ?? squadState.rustPlusShopConfig?.smartAutomation
        )
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
      const rawIds = Array.isArray(body.entityIds) ? body.entityIds : [body.entityId];
      const entityIds = Array.from(new Set(rawIds.map((id) => parseInt(String(id || '0'), 10)).filter((n) => n > 0)));
      if (!entityIds.length) return sendJson(res, 400, { error: 'Valid Smart Switch Entity ID(s) required.' });
      const nextActive = Boolean(body.active);
      const cfg = squadState.rustPlusShopConfig || {};
      if ((!cfg.ip && !cfg.serverId) || !cfg.playerId || !cfg.playerToken) {
        return sendJson(res, 400, { error: 'Connect to Rust+ first to toggle Smart Switches.' });
      }
      const list = Array.isArray(squadState.rustPlusTelemetry?.smartDevices) ? [...squadState.rustPlusTelemetry.smartDevices] : [];
      try {
        const changedNames = [];
        for (const eid of entityIds) {
          await sendRustPlusCommand(cfg, 15, { entityId: eid, bytes: [0x08, nextActive ? 0x01 : 0x00] });
          const dev = list.find((d) => String(d.entityId) === String(eid));
          if (dev) {
            dev.active = nextActive;
            changedNames.push(dev.name || `#${eid}`);
          } else {
            list.unshift({ entityId: String(eid), name: `Smart Switch #${eid}`, entityType: 'switch', active: nextActive, pairedAt: Date.now() });
            changedNames.push(`#${eid}`);
          }
        }
        const activityLog = appendActivityLogEntries(squadState.rustPlusTelemetry?.activityLog, [
          { icon: '⚡', category: 'switch', text: `Toggled ${nextActive ? 'ON' : 'OFF'}: ${changedNames.join(', ')}` }
        ]);
        squadState.rustPlusTelemetry = {
          ...DEFAULT_STATE.rustPlusTelemetry,
          ...(squadState.rustPlusTelemetry || {}),
          smartDevices: list,
          activityLog
        };
        saveState(squadState);
        broadcastState('state_update');
        return sendJson(res, 200, { ok: true, smartDevices: list, activityLog });
      } catch (err) {
        return sendJson(res, 502, { error: err.message });
      }
    }

    if (pathname === '/api/shops/rustplus/activity-clear' && req.method === 'POST') {
      if (!checkPin(req, res)) return;
      squadState.rustPlusTelemetry = {
        ...DEFAULT_STATE.rustPlusTelemetry,
        ...(squadState.rustPlusTelemetry || {}),
        activityLog: []
      };
      saveState(squadState);
      broadcastState('state_update');
      return sendJson(res, 200, { ok: true, activityLog: [] });
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
        chatBotEnabled: cfg.chatBotEnabled !== false,
        lastPolledAt: cfg.lastPolledAt || 0,
        lastStatus: cfg.lastStatus || '',
        pairedServersCount: Array.isArray(cfg.pairedServers) ? cfg.pairedServers.length : 0,
        serverInfo: tel.serverInfo || null,
        markerSummary: tel.markerSummary || null,
        liveEventsCount: Array.isArray(tel.liveEvents) ? tel.liveEvents.length : 0,
        teamMembersCount: Array.isArray(tel.teamMembers) ? tel.teamMembers.length : 0,
        activityLogCount: Array.isArray(tel.activityLog) ? tel.activityLog.length : 0
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
        ...(body.chatBotEnabled !== undefined ? { chatBotEnabled: Boolean(body.chatBotEnabled) } : {}),
        ...(body.chatBotAllowSwitchControl !== undefined ? { chatBotAllowSwitchControl: Boolean(body.chatBotAllowSwitchControl) } : {}),
        ...(body.discordAlertEvents !== undefined ? { discordAlertEvents: Boolean(body.discordAlertEvents) } : {}),
        ...(body.autoEventTimers !== undefined ? { autoEventTimers: Boolean(body.autoEventTimers) } : {}),
        ...(body.smartAutomation !== undefined ? { smartAutomation: normalizeSmartAutomation(body.smartAutomation) } : {})
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
    let decodedPathname;
    try {
      decodedPathname = decodeURIComponent(pathname);
    } catch (_) {
      return sendJson(res, 400, { error: 'Invalid URL encoding' });
    }
    if (decodedPathname.includes('\0')) {
      return sendJson(res, 400, { error: 'Invalid path' });
    }

    const relReq = decodedPathname.replace(/^[/\\]+/, '') || 'index.html';
    const resolvedPublic = path.resolve(PUBLIC_DIR);
    const candidatePath = path.resolve(resolvedPublic, relReq);
    const rel = path.relative(resolvedPublic, candidatePath);
    const isInsidePublic = rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);

    const streamStaticFile = (targetFile, contentType) => {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      const stream = fs.createReadStream(targetFile);
      stream.on('error', () => {
        if (!res.destroyed) res.destroy();
      });
      res.on('close', () => {
        if (!stream.destroyed) stream.destroy();
      });
      stream.pipe(res);
    };

    let served = false;
    if (isInsidePublic && fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()) {
      try {
        const realPublic = fs.realpathSync(resolvedPublic);
        const realTarget = fs.realpathSync(candidatePath);
        const realRel = path.relative(realPublic, realTarget);
        if (realRel !== '' && !realRel.startsWith('..') && !path.isAbsolute(realRel)) {
          const ext = path.extname(realTarget).toLowerCase();
          streamStaticFile(realTarget, MIME_TYPES[ext] || 'application/octet-stream');
          served = true;
        }
      } catch (_) {}
    }

    if (!served) {
      const indexFile = path.join(resolvedPublic, 'index.html');
      if (fs.existsSync(indexFile)) {
        streamStaticFile(indexFile, 'text/html; charset=utf-8');
      } else {
        sendJson(res, 404, { error: 'Not Found' });
      }
    }
  } catch (err) {
    console.error('[Server Error]', err);
    if (res.headersSent) {
      if (!res.destroyed) res.destroy();
      return;
    }
    const statusCode = Number.isInteger(err.statusCode) ? err.statusCode : 500;
    sendJson(res, statusCode, {
      error: statusCode >= 500 ? 'Internal Server Error' : err.message,
      ...(statusCode >= 500 ? { details: err.message } : {})
    });
  }
});

function checkActiveTimersForDiscord() {
  const settings = resolveDiscordSettings();
  const hasTarget = Boolean(
    isValidDiscordWebhookUrl(settings.webhookUrl) ||
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
        addBoundedSetEntry(sentDiscordAlerts, doneKey);
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
        addBoundedSetEntry(sentDiscordAlerts, warnKey);
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
    writeSseFrame(res, ': heartbeat\n\n');
  }
}, 25000);

server.listen(PORT, HOST, () => {
  console.log('==========================================================');
  console.log('  RUST TACTICAL COMPANION — ONLINE');
  console.log(`  Listening on: http://${HOST}:${PORT}`);
  console.log(`  Squad State : ${STATE_FILE}`);
  console.log('==========================================================');
});
