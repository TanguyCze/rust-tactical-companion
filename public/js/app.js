/**
 * RUST TACTICAL COMPANION — CORE FRONTEND APPLICATION
 * Handles Squad SSE Sync, Raid & Sulfur Combo Optimizer, Interactive Tactical Map,
 * Monument Keycard/Fuse Atlas, Live Audio Timers, 6-Gene Crossbreeding Solver,
 * and BattleMetrics 24h Raid Window Intelligence.
 */

(function () {
  'use strict';

  const DATA = window.RUST_DATA;

  // =========================================================================
  // APPLICATION STATE & SQUAD REAL-TIME SYNC
  // =========================================================================
  const LOCAL_STORAGE_KEY = 'rust_tactical_companion_state_v1';
  const PIN_STORAGE_KEY = 'rust_tactical_companion_pin';
  const BM_TOKEN_KEY = 'rust_tactical_companion_bm_token';

  let appState = {
    squadName: 'RUST SQUAD ALPHA',
    mapConfig: {
      seed: '1337420',
      size: 4250,
      customImageUrl: ''
    },
    rustPlus: {
      connected: false,
      mode: 'simulated_live',
      config: { ip: '', port: '28082', playerId: '', playerToken: '' },
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
        notes: 'T3 Workbench, 2x Wind Turbines, 36h Upkeep'
      },
      {
        id: 'm-default-raid',
        type: 'raid',
        label: 'Roofcamper Clan [2x2 Multi-TC]',
        grid: 'Q14',
        x: 0.64,
        y: 0.56,
        notes: 'Est. 2 Sheet Doors + 3 Garage Doors + 1 Stone Wall to core. Offline ~04:00'
      },
      {
        id: 'm-default-farm',
        type: 'farm',
        label: 'Desert Sulfur Ridge',
        grid: 'L19',
        x: 0.45,
        y: 0.76,
        notes: '15+ Sulfur nodes per run with Pure Ore Tea'
      }
    ],
    activeTimers: [],
    raidQueue: [
      { targetId: 'sheet_metal_door', qty: 2, mode: 'combo' },
      { targetId: 'garage_door', qty: 3, mode: 'combo' },
      { targetId: 'stone_wall', qty: 1, mode: 'combo' }
    ],
    savedClones: [
      { id: 'c1', crop: 'Hemp', genes: 'YGYWGG' },
      { id: 'c2', crop: 'Hemp', genes: 'GGYYXW' },
      { id: 'c3', crop: 'Hemp', genes: 'GWYYYG' },
      { id: 'c4', crop: 'Hemp', genes: 'XGGGYY' },
      { id: 'c5', crop: 'Blue Berry', genes: 'GGGYYY' }
    ],
    battlemetrics: {
      serverId: '',
      serverName: 'Rustoria.co - EU Main',
      watchlist: [
        {
          id: 'w1',
          name: '[ZERG] Roofcampers',
          grid: 'Q14',
          typicalOffline: '03:30 - 10:00',
          notes: '2x2 Multi-TC, 3 Garage Doors + 1 Stone Wall to core'
        },
        {
          id: 'w2',
          name: 'OilRigControllers',
          grid: 'V5',
          typicalOffline: '02:00 - 09:00',
          notes: 'Snow cliff boat base near Large Oil Rig'
        }
      ]
    }
  };

  let isServerConnected = false;
  let audioEnabled = true;
  let selectedRaidCategory = 'All';
  let selectedRaidTargetId = 'garage_door';
  let selectedMonumentFilter = 'all';
  let selectedMonumentId = 'launch_site';
  let selectedCloneCropFilter = 'Hemp';

  // Load local fallback first
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      appState = { ...appState, ...JSON.parse(saved) };
    }
  } catch (_) {}

  function saveLocalFallback() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(appState));
    } catch (_) {}
  }

  function getSquadPin() {
    return localStorage.getItem(PIN_STORAGE_KEY) || '';
  }

  function getBmToken() {
    return localStorage.getItem(BM_TOKEN_KEY) || '';
  }

  async function syncStateToServer() {
    saveLocalFallback();
    if (!isServerConnected) return;
    try {
      const res = await fetch('/api/state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Squad-Pin': getSquadPin()
        },
        body: JSON.stringify(appState)
      });
      if (res.status === 403) {
        alert('Squad PIN required or invalid! Click "⚙️ SQUAD / PIN" in the top bar to enter your Squad PIN.');
      }
    } catch (_) {}
  }

  function initSquadSSE() {
    if (window.location.protocol === 'file:') {
      updateSyncBadge(false, 'LOCAL BROWSER MODE');
      return;
    }

    try {
      const es = new EventSource('/api/events');
      es.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.state) {
            appState = { ...appState, ...msg.state };
            saveLocalFallback();
            renderAll();
          }
          if (msg.type === 'rustplus_paired_server' && msg.pairedServer) {
            playAlertSound('complete');
            alert(`🎉 Auto-Paired with Rust Server: ${msg.pairedServer.serverName || msg.pairedServer.ip}!`);
          }
          if (msg.type === 'rustplus_paired_entity' && msg.pairedEntity) {
            playAlertSound('complete');
            alert(`🔌 Auto-Paired In-Game ${msg.pairedEntity.name} (Entity #${msg.pairedEntity.entityId})!`);
          }
          isServerConnected = true;
          updateSyncBadge(true, 'LIVE SQUAD SYNC');
        } catch (_) {}
      };
      es.onerror = () => {
        isServerConnected = false;
        updateSyncBadge(false, 'LOCAL FALLBACK');
      };
    } catch (_) {
      updateSyncBadge(false, 'LOCAL MODE');
    }
  }

  function updateSyncBadge(online, text) {
    const badge = document.getElementById('syncStatusBadge');
    const label = document.getElementById('syncStatusText');
    if (!badge || !label) return;
    badge.classList.toggle('offline', !online);
    label.textContent = text;
  }

  // =========================================================================
  // WEB AUDIO API SYNTHESIZER (NO EXTERNAL MP3 FILES REQUIRED)
  // =========================================================================
  let audioCtx = null;

  function playAlertSound(type = 'complete') {
    if (!audioEnabled) return;
    try {
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const now = audioCtx.currentTime;
      const notes = type === 'urgent' ? [587.33, 880] : [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type === 'urgent' ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);
        gain.gain.setValueAtTime(0.16, now + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.14);
        osc.stop(now + idx * 0.14 + 0.26);
      });
    } catch (_) {}
  }

  // =========================================================================
  // NAVIGATION & HEADER CONTROLS
  // =========================================================================
  function initNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    const panels = document.querySelectorAll('.tab-panel');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('data-tab');
        tabs.forEach((t) => t.classList.remove('active'));
        panels.forEach((p) => p.classList.remove('active'));
        tab.classList.add('active');
        const panel = document.getElementById(targetId);
        if (panel) panel.classList.add('active');
        if (targetId === 'tab-map') {
          drawTacticalMap();
        }
      });
    });

    // Audio toggle
    const audioBtn = document.getElementById('audioToggleBtn');
    audioBtn.addEventListener('click', () => {
      audioEnabled = !audioEnabled;
      audioBtn.textContent = audioEnabled ? '🔔 AUDIO: ON' : '🔕 AUDIO: OFF';
      if (audioEnabled) playAlertSound('urgent');
    });

    // Settings Modal
    const modal = document.getElementById('settingsModal');
    document.getElementById('openSettingsBtn').addEventListener('click', () => {
      document.getElementById('settingSquadName').value = appState.squadName || '';
      document.getElementById('settingSquadPin').value = getSquadPin();
      document.getElementById('settingMapImageUrl').value = appState.mapConfig?.customImageUrl || '';
      document.getElementById('settingMapSeed').value = appState.mapConfig?.seed || '1337420';
      document.getElementById('settingMapSize').value = appState.mapConfig?.size || 4250;
      document.getElementById('settingBmToken').value = getBmToken();
      const whEl = document.getElementById('settingDiscordWebhook');
      if (whEl) whEl.value = appState.discordWebhookUrl || '';
      modal.classList.add('open');
    });

    document.getElementById('closeSettingsModalBtn').addEventListener('click', () => {
      modal.classList.remove('open');
    });

    document.getElementById('mapCustomUrlBtn').addEventListener('click', () => {
      document.getElementById('openSettingsBtn').click();
    });

    document.getElementById('testDiscordWebhookBtn')?.addEventListener('click', async () => {
      const wh = document.getElementById('settingDiscordWebhook')?.value.trim();
      if (!wh) {
        alert('Paste your Discord Webhook URL first!');
        return;
      }
      appState.discordWebhookUrl = wh;
      const ok = await sendDiscordAlert(
        '🔔 Rust Tactical Companion Connected!',
        `Squad **${appState.squadName}** live alerts are now linked to this Discord channel.`,
        0x22c55e
      );
      if (ok) alert('Discord test message sent!');
    });

    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
      appState.squadName = document.getElementById('settingSquadName').value.trim() || 'RUST SQUAD ALPHA';
      appState.discordWebhookUrl = document.getElementById('settingDiscordWebhook')?.value.trim() || '';
      appState.mapConfig = {
        ...appState.mapConfig,
        customImageUrl: document.getElementById('settingMapImageUrl').value.trim(),
        seed: document.getElementById('settingMapSeed').value.trim() || '1337420',
        size: parseInt(document.getElementById('settingMapSize').value, 10) || 4250
      };
      localStorage.setItem(PIN_STORAGE_KEY, document.getElementById('settingSquadPin').value);
      localStorage.setItem(BM_TOKEN_KEY, document.getElementById('settingBmToken').value.trim());
      loadCustomMapImageIfConfigured();
      syncStateToServer();
      renderAll();
      modal.classList.remove('open');
    });
  }

  async function sendDiscordAlert(title, description, color = 0xcd412b) {
    const webhookUrl = appState.discordWebhookUrl || '';
    try {
      if (isServerConnected) {
        const res = await fetch('/api/discord', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Squad-Pin': getSquadPin()
          },
          body: JSON.stringify({ webhookUrl, title, description, color })
        });
        if (res.ok) return true;
      }
      if (webhookUrl && webhookUrl.startsWith('https://discord')) {
        const direct = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: `Rust Tactical Companion [${appState.squadName}]`,
            embeds: [{ title, description, color, timestamp: new Date().toISOString() }]
          })
        });
        return direct.ok;
      }
    } catch (_) {}
    alert('Configure your Discord Webhook URL in ⚙️ SQUAD / PIN settings first!');
    return false;
  }

  // =========================================================================
  // MODULE 1: RAID CALCULATOR & SULFUR SAVER COMBO ENGINE
  // =========================================================================
  function getBestSulfurForTarget(target) {
    const comboMin = (target.combos || []).reduce((min, c) => Math.min(min, c.sulfur), Infinity);
    const methodMin = (target.methods || []).reduce((min, m) => Math.min(min, m.sulfur), Infinity);
    return Math.min(comboMin, methodMin);
  }

  function renderRaidTargets() {
    const grid = document.getElementById('raidTargetGrid');
    if (!grid) return;

    const filtered = DATA.raidTargets.filter(
      (t) => selectedRaidCategory === 'All' || t.category === selectedRaidCategory
    );

    grid.innerHTML = filtered
      .map((t) => {
        const minSulfur = getBestSulfurForTarget(t);
        const isSelected = t.id === selectedRaidTargetId;
        return `
          <div class="target-card ${isSelected ? 'selected' : ''}" data-target-id="${t.id}">
            <div class="target-card-top">
              <span class="target-tier-tag">${t.tier}</span>
              <span class="target-hp">${t.hp} HP</span>
            </div>
            <div class="target-name">${t.name}</div>
            <div class="target-best-sulfur">
              ⚡ Best: ${minSulfur === 0 ? '0 Sulfur (Fire/Eco)' : minSulfur.toLocaleString() + ' Sulfur'}
            </div>
          </div>
        `;
      })
      .join('');

    grid.querySelectorAll('.target-card').forEach((card) => {
      card.addEventListener('click', () => {
        selectedRaidTargetId = card.getAttribute('data-target-id');
        renderRaidTargets();
        renderSelectedTargetInspector();
      });
    });
  }

  function renderSelectedTargetInspector() {
    const container = document.getElementById('selectedTargetInspector');
    if (!container) return;

    const target = DATA.raidTargets.find((t) => t.id === selectedRaidTargetId) || DATA.raidTargets[0];
    if (!target) return;

    const combosHtml = (target.combos || [])
      .map(
        (c, idx) => `
        <div class="combo-card">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
            <span class="combo-badge">${c.badge}</span>
            ${c.savedSulfur > 0 ? `<span class="combo-save-pill">Saves ${c.savedSulfur.toLocaleString()} Sulfur</span>` : ''}
          </div>
          <div class="combo-title">${c.label}</div>
          <div class="combo-stats">
            <span style="color:var(--sulfur-yellow); font-weight:700;">🟡 ${c.sulfur.toLocaleString()} Sulfur</span>
            ${c.charcoal ? `<span>⚫ ${c.charcoal.toLocaleString()} Charcoal</span>` : ''}
            ${c.lgf ? `<span style="color:#4ade80;">🛢️ ${c.lgf} LGF</span>` : ''}
            <span>⏱️ ~${c.timeSec}s</span>
          </div>
          <div style="font-size:12px; color:var(--text-secondary); flex:1;">${c.notes}</div>
          <button class="btn btn-sm btn-primary add-target-combo-btn" data-target="${target.id}" data-combo-idx="${idx}">
            + Add This Combo to Raid Plan
          </button>
        </div>
      `
      )
      .join('');

    const methodsRows = (target.methods || [])
      .map((m, idx) => {
        const tool = DATA.raidTools[m.toolId] || { name: m.toolId, wb: '-' };
        return `
          <tr>
            <td style="font-weight:700; color:#fff;">${m.qty}x ${tool.name}</td>
            <td><span class="target-tier-tag">${tool.wb}</span></td>
            <td style="color:var(--sulfur-yellow); font-weight:700;">${(m.sulfur || 0).toLocaleString()}</td>
            <td>${(m.charcoal || 0).toLocaleString()}</td>
            <td>${(m.metal || 0).toLocaleString()}</td>
            <td>${(m.lgf || 0).toLocaleString()}</td>
            <td>~${m.timeSec}s</td>
            <td style="font-family:var(--font-sans); font-size:12px; color:var(--text-secondary);">${m.notes || ''}</td>
            <td>
              <button class="btn btn-sm add-single-method-btn" data-target="${target.id}" data-method-idx="${idx}">
                + Plan
              </button>
            </td>
          </tr>
        `;
      })
      .join('');

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
        <div>
          <span style="font-family:var(--font-display); font-size:18px; font-weight:700; color:#fff;">
            ${target.name} (${target.hp} HP)
          </span>
          <span style="margin-left:8px;" class="target-tier-tag">${target.category} • ${target.tier}</span>
        </div>
        <button class="btn btn-sulfur btn-sm" id="addOptimalTargetBtn" data-target="${target.id}">
          ⚡ Quick Add Optimal to Squad Raid Plan
        </button>
      </div>

      <div style="font-family:var(--font-display); font-size:13px; text-transform:uppercase; color:var(--sulfur-yellow); margin-bottom:8px; font-weight:700;">
        ⚡ Recommended Sulfur-Saving Combinations (Mixed Loadouts)
      </div>
      <div class="combo-grid">${combosHtml}</div>

      <div style="font-family:var(--font-display); font-size:13px; text-transform:uppercase; color:var(--text-secondary); margin-bottom:8px; font-weight:700;">
        📊 Single-Method Raid Comparison Table (Pure C4 / Rocket / Explo / Fire / Melee)
      </div>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Method / Quantity</th>
              <th>WB</th>
              <th>Sulfur</th>
              <th>Charcoal</th>
              <th>Metal</th>
              <th>Low Grade</th>
              <th>Time</th>
              <th>Tactical Notes</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>${methodsRows}</tbody>
        </table>
      </div>
    `;

    container.querySelector('#addOptimalTargetBtn')?.addEventListener('click', () => {
      addRaidQueueItem(target.id, 1, 'combo');
    });

    container.querySelectorAll('.add-target-combo-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cIdx = parseInt(btn.getAttribute('data-combo-idx'), 10);
        addRaidQueueItem(target.id, 1, `combo:${cIdx}`);
      });
    });

    container.querySelectorAll('.add-single-method-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mIdx = parseInt(btn.getAttribute('data-method-idx'), 10);
        addRaidQueueItem(target.id, 1, `method:${mIdx}`);
      });
    });
  }

  function addRaidQueueItem(targetId, qty, mode) {
    const existing = appState.raidQueue.find((item) => item.targetId === targetId && item.mode === mode);
    if (existing) {
      existing.qty += qty;
    } else {
      appState.raidQueue.push({ targetId, qty, mode });
    }
    syncStateToServer();
    renderRaidPlanner();
  }

  function resolveQueueItemLoadout(item) {
    const target = DATA.raidTargets.find((t) => t.id === item.targetId) || DATA.raidTargets[0];
    if (!target) return null;

    let chosenLabel = '';
    let sulfur = 0;
    let charcoal = 0;
    let lgf = 0;
    let metal = 0;
    let pipes = 0;
    let techTrash = 0;
    let timeSec = 0;
    let savedSulfur = 0;
    let toolCounts = {};

    if (item.mode.startsWith('combo:')) {
      const idx = parseInt(item.mode.split(':')[1], 10) || 0;
      const c = target.combos[idx] || target.combos[0];
      chosenLabel = c.label;
      sulfur = c.sulfur;
      charcoal = c.charcoal || 0;
      lgf = c.lgf || 0;
      timeSec = c.timeSec || 15;
      savedSulfur = c.savedSulfur || 0;
      (c.items || []).forEach((it) => {
        toolCounts[it.toolId] = (toolCounts[it.toolId] || 0) + it.qty;
        const tool = DATA.raidTools[it.toolId];
        if (tool) {
          metal += (tool.metal || 0) * it.qty;
          pipes += (tool.pipes || 0) * it.qty;
          techTrash += (tool.techTrash || 0) * it.qty;
        }
      });
    } else if (item.mode.startsWith('method:')) {
      const idx = parseInt(item.mode.split(':')[1], 10) || 0;
      const m = target.methods[idx] || target.methods[0];
      const tool = DATA.raidTools[m.toolId] || { name: m.toolId };
      chosenLabel = `${m.qty}x ${tool.name}`;
      sulfur = m.sulfur || 0;
      charcoal = m.charcoal || 0;
      lgf = m.lgf || 0;
      metal = m.metal || 0;
      pipes = m.pipes || 0;
      techTrash = m.techTrash || 0;
      timeSec = m.timeSec || 15;
      toolCounts[m.toolId] = m.qty;
    } else if (item.mode === 'cheapest_single') {
      const sorted = [...target.methods].sort((a, b) => (a.sulfur || 0) - (b.sulfur || 0));
      const m = sorted[0];
      const tool = DATA.raidTools[m.toolId] || { name: m.toolId };
      chosenLabel = `${m.qty}x ${tool.name}`;
      sulfur = m.sulfur || 0;
      charcoal = m.charcoal || 0;
      lgf = m.lgf || 0;
      metal = m.metal || 0;
      pipes = m.pipes || 0;
      techTrash = m.techTrash || 0;
      timeSec = m.timeSec || 15;
      toolCounts[m.toolId] = m.qty;
    } else if (item.mode === 'fastest') {
      const sorted = [...target.methods].sort((a, b) => (a.timeSec || 999) - (b.timeSec || 999));
      const m = sorted[0];
      const tool = DATA.raidTools[m.toolId] || { name: m.toolId };
      chosenLabel = `${m.qty}x ${tool.name}`;
      sulfur = m.sulfur || 0;
      charcoal = m.charcoal || 0;
      lgf = m.lgf || 0;
      metal = m.metal || 0;
      pipes = m.pipes || 0;
      techTrash = m.techTrash || 0;
      timeSec = m.timeSec || 15;
      toolCounts[m.toolId] = m.qty;
    } else if (item.mode === 't1') {
      const t1Method =
        target.methods.find((m) => ['molotov', 'satchel', 'beancan', 'salvaged_sword'].includes(m.toolId)) ||
        target.methods[0];
      const tool = DATA.raidTools[t1Method.toolId] || { name: t1Method.toolId };
      chosenLabel = `${t1Method.qty}x ${tool.name}`;
      sulfur = t1Method.sulfur || 0;
      charcoal = t1Method.charcoal || 0;
      lgf = t1Method.lgf || 0;
      metal = t1Method.metal || 0;
      timeSec = t1Method.timeSec || 30;
      toolCounts[t1Method.toolId] = t1Method.qty;
    } else {
      // Default: 'combo' -> pick lowest sulfur combo (or first combo)
      const c = target.combos[0];
      chosenLabel = c.label;
      sulfur = c.sulfur;
      charcoal = c.charcoal || 0;
      lgf = c.lgf || 0;
      timeSec = c.timeSec || 15;
      savedSulfur = c.savedSulfur || 0;
      (c.items || []).forEach((it) => {
        toolCounts[it.toolId] = (toolCounts[it.toolId] || 0) + it.qty;
        const tool = DATA.raidTools[it.toolId];
        if (tool) {
          metal += (tool.metal || 0) * it.qty;
          pipes += (tool.pipes || 0) * it.qty;
          techTrash += (tool.techTrash || 0) * it.qty;
        }
      });
    }

    return {
      target,
      qty: item.qty,
      chosenLabel,
      totalSulfur: sulfur * item.qty,
      totalCharcoal: charcoal * item.qty,
      totalLgf: lgf * item.qty,
      totalMetal: metal * item.qty,
      totalPipes: pipes * item.qty,
      totalTechTrash: techTrash * item.qty,
      totalTimeSec: timeSec * item.qty,
      totalSavedSulfur: savedSulfur * item.qty,
      toolCounts
    };
  }

  function renderRaidPlanner() {
    const queueContainer = document.getElementById('raidQueueContainer');
    const summaryContainer = document.getElementById('raidTotalSummary');
    const nodeContainer = document.getElementById('sulfurNodeBreakdown');
    if (!queueContainer || !summaryContainer || !nodeContainer) return;

    if (!appState.raidQueue || appState.raidQueue.length === 0) {
      queueContainer.innerHTML = `
        <div style="padding:18px; text-align:center; color:var(--text-muted); background:var(--bg-card); border-radius:6px;">
          No raid targets queued yet. Select any door/wall on the left or use the quick-add bar above.
        </div>
      `;
      summaryContainer.innerHTML = '';
      nodeContainer.innerHTML = '';
      return;
    }

    let grandSulfur = 0;
    let grandCharcoal = 0;
    let grandLgf = 0;
    let grandMetal = 0;
    let grandPipes = 0;
    let grandTech = 0;
    let grandSaved = 0;
    let aggregatedTools = {};

    const rowsHtml = appState.raidQueue
      .map((item, idx) => {
        const res = resolveQueueItemLoadout(item);
        if (!res) return '';
        grandSulfur += res.totalSulfur;
        grandCharcoal += res.totalCharcoal;
        grandLgf += res.totalLgf;
        grandMetal += res.totalMetal;
        grandPipes += res.totalPipes;
        grandTech += res.totalTechTrash;
        grandSaved += res.totalSavedSulfur;

        Object.entries(res.toolCounts).forEach(([tId, count]) => {
          aggregatedTools[tId] = (aggregatedTools[tId] || 0) + count * item.qty;
        });

        return `
          <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:6px; padding:10px 12px; margin-bottom:8px;">
            <div>
              <div style="font-family:var(--font-display); font-weight:700; color:#fff; font-size:14px;">
                ${item.qty}x ${res.target.name}
              </div>
              <div style="font-family:var(--font-mono); font-size:11px; color:var(--text-secondary);">
                Method: <span style="color:#fff;">${res.chosenLabel}</span> (per target)
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
              <div style="text-align:right; font-family:var(--font-mono);">
                <div style="color:var(--sulfur-yellow); font-weight:700;">${res.totalSulfur.toLocaleString()} Sulfur</div>
                ${res.totalSavedSulfur > 0 ? `<div style="font-size:10px; color:var(--card-green);">Saved ${res.totalSavedSulfur.toLocaleString()}</div>` : ''}
              </div>
              <button class="btn btn-sm remove-raid-item-btn" data-idx="${idx}">✕</button>
            </div>
          </div>
        `;
      })
      .join('');

    queueContainer.innerHTML = rowsHtml;

    queueContainer.querySelectorAll('.remove-raid-item-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        appState.raidQueue.splice(idx, 1);
        syncStateToServer();
        renderRaidPlanner();
      });
    });

    const loadoutBadges = Object.entries(aggregatedTools)
      .map(([tId, count]) => {
        const tool = DATA.raidTools[tId] || { shortName: tId, color: '#f97316' };
        return `
          <span style="display:inline-flex; align-items:center; gap:6px; padding:6px 12px; background:var(--bg-card); border:1px solid ${tool.color}; border-radius:5px; font-family:var(--font-mono); font-weight:700; color:#fff;">
            ${count}x ${tool.shortName || tool.name}
          </span>
        `;
      })
      .join('');

    summaryContainer.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <span style="font-family:var(--font-display); font-weight:700; text-transform:uppercase; color:#fff;">
          📦 Total Ordnance to Craft / Bring
        </span>
        ${
          grandSaved > 0
            ? `<span class="keycard-tag keycard-Green">⚡ COMBO SAVED ${grandSaved.toLocaleString()} SULFUR!</span>`
            : ''
        }
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px;">
        ${loadoutBadges}
      </div>

      <div class="resource-grid">
        <div class="resource-box highlight-sulfur">
          <div class="resource-val" style="color:var(--sulfur-yellow);">${grandSulfur.toLocaleString()}</div>
          <div class="resource-label">Total Sulfur</div>
        </div>
        <div class="resource-box">
          <div class="resource-val">${grandCharcoal.toLocaleString()}</div>
          <div class="resource-label">Charcoal</div>
        </div>
        <div class="resource-box">
          <div class="resource-val">${Math.ceil(grandSulfur * 0.5).toLocaleString()}</div>
          <div class="resource-label">Gunpowder</div>
        </div>
        <div class="resource-box">
          <div class="resource-val">${grandMetal.toLocaleString()}</div>
          <div class="resource-label">Metal Frags</div>
        </div>
        <div class="resource-box">
          <div class="resource-val" style="color:#4ade80;">${grandLgf.toLocaleString()}</div>
          <div class="resource-label">Low Grade Fuel</div>
        </div>
        <div class="resource-box">
          <div class="resource-val">${grandPipes} / ${grandTech}</div>
          <div class="resource-label">Pipes / Tech Trash</div>
        </div>
      </div>
    `;

    // Sulfur Node & Ore Tea breakdown
    const nodesNoTea = Math.ceil(grandSulfur / 300);
    const nodesBasic = Math.ceil(grandSulfur / 360);
    const nodesAdv = Math.ceil(grandSulfur / 405);
    const nodesPure = Math.ceil(grandSulfur / 450);

    nodeContainer.innerHTML = `
      <div class="resource-grid" style="margin-top:0;">
        <div class="resource-box">
          <div class="resource-val">${nodesNoTea}</div>
          <div class="resource-label">No Tea (300/node)</div>
        </div>
        <div class="resource-box">
          <div class="resource-val" style="color:#60a5fa;">${nodesBasic}</div>
          <div class="resource-label">Basic Tea (+20%)</div>
        </div>
        <div class="resource-box">
          <div class="resource-val" style="color:#c084fc;">${nodesAdv}</div>
          <div class="resource-label">Adv. Tea (+35%)</div>
        </div>
        <div class="resource-box highlight-sulfur">
          <div class="resource-val" style="color:#4ade80;">${nodesPure}</div>
          <div class="resource-label">Pure Ore Tea (+50%)</div>
        </div>
      </div>
      <div style="margin-top:10px; font-size:12px; color:var(--text-secondary);">
        💡 <strong>Farming Tip:</strong> Drinking a <strong>Pure Ore Tea</strong> (2 Yellow + 2 Blue Berries) saves you <strong>${Math.max(0, nodesNoTea - nodesPure)} Sulfur Nodes</strong> on this raid alone!
      </div>
    `;
  }

  // Dynamic Remaining HP Calculator
  function solveCustomRemainingHp() {
    const targetId = document.getElementById('customHpTargetSelect')?.value || 'garage_door';
    const remainingHp = parseInt(document.getElementById('customHpInput')?.value, 10) || 100;
    const out = document.getElementById('customHpResult');
    if (!out) return;

    const target = DATA.raidTargets.find((t) => t.id === targetId) || DATA.raidTargets[0];
    const ratio = Math.min(1, Math.max(0.01, remainingHp / target.hp));

    // Estimate per-unit damage for this target based on its full-HP methods
    const unitOptions = target.methods.map((m) => {
      const tool = DATA.raidTools[m.toolId] || { name: m.toolId, sulfur: 0 };
      const dmgPerUnit = target.hp / m.qty;
      const unitsNeeded = Math.ceil(remainingHp / dmgPerUnit);
      const totalSulfur = unitsNeeded * (tool.sulfur || 0);
      return {
        toolId: m.toolId,
        toolName: tool.name,
        dmgPerUnit,
        unitsNeeded,
        totalSulfur
      };
    });

    // Also compute best 2-tool combination (e.g. Rockets/C4/Satchels + Explo Ammo/Beancans)
    let bestMix = null;
    const heavyTools = unitOptions.filter((u) => ['c4', 'rocket', 'satchel'].includes(u.toolId));
    const finishTools = unitOptions.filter((u) => ['explo_ammo', 'beancan', 'molotov'].includes(u.toolId));

    heavyTools.forEach((h) => {
      for (let hCount = 0; hCount <= h.unitsNeeded; hCount++) {
        const hpLeft = Math.max(0, remainingHp - hCount * h.dmgPerUnit);
        if (hpLeft === 0) {
          const s = hCount * (DATA.raidTools[h.toolId]?.sulfur || 0);
          if (!bestMix || s < bestMix.sulfur) {
            bestMix = { label: `${hCount}x ${h.toolName}`, sulfur: s };
          }
        } else {
          finishTools.forEach((f) => {
            const fCount = Math.ceil(hpLeft / f.dmgPerUnit);
            const s =
              hCount * (DATA.raidTools[h.toolId]?.sulfur || 0) +
              fCount * (DATA.raidTools[f.toolId]?.sulfur || 0);
            const lbl = hCount > 0 ? `${hCount}x ${h.toolName} + ${fCount}x ${f.toolName}` : `${fCount}x ${f.toolName}`;
            if (!bestMix || s < bestMix.sulfur) {
              bestMix = { label: lbl, sulfur: s };
            }
          });
        }
      }
    });

    unitOptions.sort((a, b) => a.totalSulfur - b.totalSulfur);

    out.innerHTML = `
      <div style="background:var(--bg-card); border:1px solid var(--sulfur-yellow); border-radius:6px; padding:12px;">
        <div style="font-family:var(--font-display); font-weight:700; color:var(--sulfur-yellow); margin-bottom:6px;">
          ⚡ Optimal Finish for ${target.name} @ ${remainingHp} / ${target.hp} HP (${Math.round(ratio * 100)}% HP):
        </div>
        ${
          bestMix
            ? `<div style="font-family:var(--font-mono); font-size:14px; color:#fff; margin-bottom:8px;">
                Best Combo: <strong>${bestMix.label}</strong> → <span style="color:var(--sulfur-yellow);">${bestMix.sulfur.toLocaleString()} Sulfur</span>
              </div>`
            : ''
        }
        <div style="display:flex; gap:8px; flex-wrap:wrap; font-family:var(--font-mono); font-size:12px; color:var(--text-secondary);">
          ${unitOptions
            .map((u) => `<span>• ${u.unitsNeeded}x ${u.toolName} (${u.totalSulfur.toLocaleString()} Sulfur)</span>`)
            .join('')}
        </div>
      </div>
    `;
  }

  function initRaidModule() {
    // Populate dropdowns
    const quickSel = document.getElementById('quickAddTargetSelect');
    const customHpSel = document.getElementById('customHpTargetSelect');
    const optionsHtml = DATA.raidTargets
      .map((t) => `<option value="${t.id}">${t.name} (${t.hp} HP)</option>`)
      .join('');
    if (quickSel) quickSel.innerHTML = optionsHtml;
    if (customHpSel) {
      customHpSel.innerHTML = optionsHtml;
      customHpSel.value = 'garage_door';
    }

    document.querySelectorAll('#raidCategoryPills .filter-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('#raidCategoryPills .filter-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        selectedRaidCategory = pill.getAttribute('data-cat');
        renderRaidTargets();
      });
    });

    document.getElementById('quickAddRaidBtn')?.addEventListener('click', () => {
      const tId = quickSel.value;
      const qty = Math.max(1, parseInt(document.getElementById('quickAddQtyInput').value, 10) || 1);
      const mode = document.getElementById('quickAddModeSelect').value;
      addRaidQueueItem(tId, qty, mode);
    });

    document.getElementById('clearRaidQueueBtn')?.addEventListener('click', () => {
      appState.raidQueue = [];
      syncStateToServer();
      renderRaidPlanner();
    });

    document.getElementById('discordRaidPlanBtn')?.addEventListener('click', async () => {
      if (!appState.raidQueue || appState.raidQueue.length === 0) return;
      let totalSulfur = 0;
      const lines = appState.raidQueue.map((item) => {
        const res = resolveQueueItemLoadout(item);
        totalSulfur += res.totalSulfur;
        return `• **${item.qty}x ${res.target.name}** → ${res.chosenLabel} (**${res.totalSulfur.toLocaleString()} Sulfur**)`;
      });
      lines.push(`\n🟡 **Total Sulfur Required:** ${totalSulfur.toLocaleString()} (${Math.ceil(totalSulfur / 450)} nodes w/ Pure Ore Tea)`);
      const ok = await sendDiscordAlert('💣 Squad Raid Plan & Sulfur Shopping List', lines.join('\n'), 0xeab308);
      if (ok) alert('Raid plan posted to Discord!');
    });

    document.getElementById('solveCustomHpBtn')?.addEventListener('click', solveCustomRemainingHp);
    solveCustomRemainingHp();
  }

  // =========================================================================
  // MODULE 2: RUST+ LIVE MAP, VENDING MACHINES, MONUMENTS & BUILD SPOTS
  // =========================================================================
  let mapZoom = 1.0;
  let mapOffsetX = 0;
  let mapOffsetY = 0;
  let isDraggingMap = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let pointerMoved = false;
  let customMapImg = null;
  let liveEventsSimEnabled = true;
  let selectedVendingId = null;

  const mapLayers = {
    liveEvents: true,
    teamGps: true,
    vending: true,
    monuments: true,
    cardFlow: true,
    buildSpots: true,
    farmZones: true,
    squadPins: true
  };

  function loadCustomMapImageIfConfigured() {
    const url = appState.mapConfig?.customImageUrl;
    if (!url) {
      customMapImg = null;
      drawTacticalMap();
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      customMapImg = img;
      drawTacticalMap();
    };
    img.onerror = () => {
      customMapImg = null;
      drawTacticalMap();
    };
    img.src = url;
  }

  function normalizedToGrid(nx, ny) {
    const col = Math.min(25, Math.max(0, Math.floor(nx * 26)));
    const row = Math.min(25, Math.max(0, Math.floor(ny * 26)));
    const colLetter = String.fromCharCode(65 + col);
    return `${colLetter}${row}`;
  }

  function drawTacticalMap() {
    const canvas = document.getElementById('tacticalMapCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, W, H);

    // Apply Pan & Zoom
    ctx.translate(W / 2 + mapOffsetX, H / 2 + mapOffsetY);
    ctx.scale(mapZoom, mapZoom);
    ctx.translate(-W / 2, -H / 2);

    // 1. Deep Ocean Base
    const oceanGrad = ctx.createRadialGradient(W * 0.5, H * 0.5, W * 0.1, W * 0.5, H * 0.5, W * 0.65);
    oceanGrad.addColorStop(0, '#13334c');
    oceanGrad.addColorStop(1, '#071524');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, W, H);

    if (customMapImg) {
      ctx.drawImage(customMapImg, 0, 0, W, H);
    } else {
      // Draw Procedural Rust Island with Authentic Biomes (Snow North, Temperate Mid, Desert South)
      ctx.save();
      ctx.beginPath();
      const cx = W * 0.5;
      const cy = H * 0.5;
      const rx = W * 0.39;
      const ry = H * 0.39;
      const points = 36;
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const wobble =
          1 +
          0.06 * Math.sin(angle * 3 + 1.2) +
          0.04 * Math.cos(angle * 5 - 0.7) +
          0.025 * Math.sin(angle * 8);
        const px = cx + Math.cos(angle) * rx * wobble;
        const py = cy + Math.sin(angle) * ry * wobble;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();

      // Sandy Coast Outline
      ctx.lineWidth = 18;
      ctx.strokeStyle = '#c2a675';
      ctx.stroke();
      ctx.clip();

      // Biome vertical gradient: Snow (top) -> Forest/Temperate (middle) -> Arid Desert (bottom)
      const biomeGrad = ctx.createLinearGradient(0, H * 0.1, 0, H * 0.9);
      biomeGrad.addColorStop(0.0, '#dce6f2');
      biomeGrad.addColorStop(0.28, '#9ab0bd');
      biomeGrad.addColorStop(0.36, '#3b5e3c');
      biomeGrad.addColorStop(0.66, '#43693d');
      biomeGrad.addColorStop(0.75, '#a8844c');
      biomeGrad.addColorStop(1.0, '#c29253');
      ctx.fillStyle = biomeGrad;
      ctx.fillRect(0, 0, W, H);

      // Ring Road Network
      ctx.beginPath();
      ctx.ellipse(W * 0.5, H * 0.5, W * 0.24, H * 0.24, 0.2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(70, 58, 46, 0.75)';
      ctx.lineWidth = 5;
      ctx.stroke();

      ctx.restore();
    }

    // 2. Draw 26x26 Tactical Grid (A0 - Z25)
    const cells = 26;
    const cellW = W / cells;
    const cellH = H / cells;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';

    for (let i = 0; i <= cells; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellW, 0);
      ctx.lineTo(i * cellW, H);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellH);
      ctx.lineTo(W, i * cellH);
      ctx.stroke();

      if (i < cells) {
        ctx.fillText(String.fromCharCode(65 + i), i * cellW + 10, 12);
        ctx.fillText(String(i), 3, i * cellH + 20);
      }
    }

    // 3. Layer: Card Progression Flow (Green -> Blue -> Red -> Elite)
    if (mapLayers.cardFlow) {
      const flowPairs = [
        ['lighthouse', 'sewer_branch', '#22c55e'],
        ['gas_station', 'radtown', '#22c55e'],
        ['supermarket', 'ferry_terminal', '#22c55e'],
        ['sewer_branch', 'water_treatment', '#3b82f6'],
        ['radtown', 'train_yard', '#3b82f6'],
        ['ferry_terminal', 'power_plant', '#3b82f6'],
        ['water_treatment', 'launch_site', '#ef4444'],
        ['train_yard', 'military_tunnels', '#ef4444'],
        ['power_plant', 'missile_silo', '#ef4444'],
        ['arctic_research', 'large_oil_rig', '#ef4444']
      ];

      flowPairs.forEach(([fromId, toId, color]) => {
        const m1 = DATA.monuments.find((m) => m.id === fromId);
        const m2 = DATA.monuments.find((m) => m.id === toId);
        if (!m1 || !m2) return;
        const x1 = m1.defaultPos.x * W;
        const y1 = m1.defaultPos.y * H;
        const x2 = m2.defaultPos.x * W;
        const y2 = m2.defaultPos.y * H;

        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([6, 6]);
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.65;
        ctx.stroke();
        ctx.restore();
      });
    }

    // 4. Layer: Farming Node Hotspots
    if (mapLayers.farmZones) {
      DATA.farmZones.forEach((fz) => {
        const fx = fz.x * W;
        const fy = fz.y * H;
        ctx.save();
        ctx.beginPath();
        ctx.arc(fx, fy, 26, 0, Math.PI * 2);
        ctx.fillStyle = fz.type === 'Sulfur' ? 'rgba(234, 179, 8, 0.22)' : 'rgba(56, 189, 248, 0.2)';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = fz.type === 'Sulfur' ? '#eab308' : '#38bdf8';
        ctx.stroke();

        ctx.font = '700 10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#fef08a';
        ctx.textAlign = 'center';
        ctx.fillText(`⛏️ ${fz.type.toUpperCase()}`, fx, fy + 4);
        ctx.restore();
      });
    }

    // 5. Layer: Suggested Best Building Spots
    if (mapLayers.buildSpots) {
      const squadFilter = document.getElementById('spotSquadFilter')?.value || 'all';
      const styleFilter = document.getElementById('spotStyleFilter')?.value || 'all';

      DATA.buildSpots.forEach((spot) => {
        const matchSquad = squadFilter === 'all' || spot.squadSize.includes(squadFilter);
        const matchStyle = styleFilter === 'all' || spot.playstyle.includes(styleFilter);
        if (!matchSquad || !matchStyle) return;

        const sx = spot.x * W;
        const sy = spot.y * H;
        ctx.save();
        ctx.beginPath();
        ctx.arc(sx, sy, 22, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = '#c084fc';
        ctx.stroke();

        ctx.font = '700 10px "Chakra Petch", sans-serif';
        ctx.fillStyle = '#f3e8ff';
        ctx.textAlign = 'center';
        ctx.fillText(`🏰 ${spot.tier}`, sx, sy - 26);
        ctx.restore();
      });
    }

    // 6. Layer: Monuments & Keycard Tiers
    if (mapLayers.monuments) {
      DATA.monuments.forEach((m) => {
        const mx = m.defaultPos.x * W;
        const my = m.defaultPos.y * H;
        const isSelected = m.id === selectedMonumentId;

        let tierColor = '#22c55e';
        if (m.tier === 1) tierColor = '#22c55e';
        else if (m.tier === 2) tierColor = '#3b82f6';
        else if (m.tier === 3) tierColor = '#ef4444';
        else tierColor = '#84cc16';

        ctx.save();
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(mx, my, 18, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(205, 65, 43, 0.38)';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#fff';
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(mx, my, 9, 0, Math.PI * 2);
        ctx.fillStyle = tierColor;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#090b0e';
        ctx.stroke();

        // Label box
        ctx.font = '700 10px "Chakra Petch", sans-serif';
        const label = m.name.replace('Abandoned ', '').replace('Oxum\'s ', '');
        const textW = ctx.measureText(label).width + 10;
        ctx.fillStyle = 'rgba(9, 11, 14, 0.85)';
        ctx.fillRect(mx - textW / 2, my + 11, textW, 15);
        ctx.strokeStyle = tierColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(mx - textW / 2, my + 11, textW, 15);

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(label, mx, my + 22);
        ctx.restore();
      });
    }

    // 7. Layer: Shared Squad Map Markers
    if (mapLayers.squadPins && Array.isArray(appState.markers)) {
      appState.markers.forEach((pin) => {
        const px = pin.x * W;
        const py = pin.y * H;
        let icon = '📍';
        let pinColor = '#f97316';
        if (pin.type === 'raid') {
          icon = '🎯';
          pinColor = '#ef4444';
        } else if (pin.type === 'base') {
          icon = '🏠';
          pinColor = '#22c55e';
        } else if (pin.type === 'farm') {
          icon = '⛏️';
          pinColor = '#eab308';
        } else if (pin.type === 'danger') {
          icon = '⚠️';
          pinColor = '#f97316';
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, 12, 0, Math.PI * 2);
        ctx.fillStyle = pinColor;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#fff';
        ctx.stroke();

        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(icon, px, py + 4);

        ctx.font = '700 10px "JetBrains Mono", monospace';
        const tag = `${pin.label} [${pin.grid}]`;
        const tw = ctx.measureText(tag).width + 10;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
        ctx.fillRect(px - tw / 2, py - 27, tw, 14);
        ctx.fillStyle = pinColor;
        ctx.fillText(tag, px, py - 17);
        ctx.restore();
      });
    }

    // 8. Layer: Rust+ Vending Machines (NPC + Player Shops with Search Highlight!)
    if (mapLayers.vending && appState.rustPlus && Array.isArray(appState.rustPlus.vendingMachines)) {
      const searchQ = (document.getElementById('vendingSearchInput')?.value || '').trim().toLowerCase();
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 220);

      appState.rustPlus.vendingMachines.forEach((vm) => {
        const vx = vm.x * W;
        const vy = vm.y * H;
        const matchesSearch =
          searchQ.length > 0 &&
          (vm.name.toLowerCase().includes(searchQ) ||
            (vm.orders || []).some(
              (o) => o.item.toLowerCase().includes(searchQ) || o.costItem.toLowerCase().includes(searchQ)
            ));
        const isSelectedVm = vm.id === selectedVendingId;

        ctx.save();
        if (matchesSearch || isSelectedVm) {
          ctx.beginPath();
          ctx.arc(vx, vy, 18 + pulse * 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(34, 197, 94, 0.32)';
          ctx.fill();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = '#4ade80';
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(vx, vy, 10, 0, Math.PI * 2);
        ctx.fillStyle = vm.type === 'npc' ? '#0d9488' : '#16a34a';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🛒', vx, vy + 3.5);

        if (matchesSearch || isSelectedVm) {
          ctx.font = '700 10px "JetBrains Mono", monospace';
          const lbl = `🛒 ${vm.name} [${vm.grid}]`;
          const lw = ctx.measureText(lbl).width + 10;
          ctx.fillStyle = 'rgba(9, 11, 14, 0.92)';
          ctx.fillRect(vx - lw / 2, vy - 26, lw, 14);
          ctx.strokeStyle = '#4ade80';
          ctx.strokeRect(vx - lw / 2, vy - 26, lw, 14);
          ctx.fillStyle = '#4ade80';
          ctx.fillText(lbl, vx, vy - 16);
        }
        ctx.restore();
      });
    }

    // 9. Layer: Rust+ Live Moving Events (Cargo Ship, Patrol Helicopter, Chinook CH47 & Locked Crates)
    if (mapLayers.liveEvents && liveEventsSimEnabled) {
      const t = Date.now() / 1000;

      // A) Cargo Ship orbiting the outer island perimeter
      const cargoAngle = (t * 0.035) % (Math.PI * 2);
      const cargoNx = 0.5 + Math.cos(cargoAngle) * 0.44;
      const cargoNy = 0.5 + Math.sin(cargoAngle) * 0.44;
      const cx = cargoNx * W;
      const cy = cargoNy * H;
      const cargoGrid = normalizedToGrid(cargoNx, cargoNy);

      ctx.save();
      // Wake trail
      ctx.beginPath();
      ctx.arc(W * 0.5, H * 0.5, W * 0.44, cargoAngle - 0.25, cargoAngle);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Ship hull
      ctx.translate(cx, cy);
      ctx.rotate(cargoAngle + Math.PI / 2);
      ctx.fillStyle = '#0284c7';
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(9, 12);
      ctx.lineTo(-9, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText(`🚢 CARGO [${cargoGrid}]`, cx, cy - 20);
      ctx.restore();

      const cargoHud = document.getElementById('rustPlusCargoDisplay');
      if (cargoHud) cargoHud.textContent = `🚢 Cargo: ACTIVE [${cargoGrid}]`;

      // B) Patrol Helicopter roaming across major monuments
      const heliAngle = t * 0.11;
      const heliNx = 0.5 + Math.sin(heliAngle) * 0.26;
      const heliNy = 0.46 + Math.cos(heliAngle * 1.4) * 0.22;
      const hx = heliNx * W;
      const hy = heliNy * H;
      const heliGrid = normalizedToGrid(heliNx, heliNy);

      ctx.save();
      ctx.beginPath();
      ctx.arc(hx, hy, 26, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.16)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
      ctx.setLineDash([4, 4]);
      ctx.stroke();

      // Spinning Rotor Blades
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(t * 14);
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(14, 0);
      ctx.moveTo(0, -14);
      ctx.lineTo(0, 14);
      ctx.stroke();
      ctx.restore();

      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#f87171';
      ctx.textAlign = 'center';
      ctx.fillText(`🚁 PATROL HELI [${heliGrid}]`, hx, hy - 30);
      ctx.restore();

      const heliHud = document.getElementById('rustPlusHeliDisplay');
      if (heliHud) heliHud.textContent = `🚁 Patrol Heli: ROAMING [${heliGrid}]`;

      // C) Active Locked Crates on Small & Large Oil Rig
      [
        { nx: 0.06, ny: 0.45, name: 'LOCKED CRATE' },
        { nx: 0.94, ny: 0.25, name: 'LOCKED CRATE' }
      ].forEach((cr) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cr.nx * W, cr.ny * H - 16, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#eab308';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🔒', cr.nx * W, cr.ny * H - 13);
        ctx.restore();
      });
    }

    // 10. Layer: Rust+ Live Squad GPS & Death Markers
    if (mapLayers.teamGps && appState.rustPlus && Array.isArray(appState.rustPlus.teamMembers)) {
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 300);

      appState.rustPlus.teamMembers.forEach((tm) => {
        // Draw Death Marker if present
        if (tm.deathX && tm.deathY) {
          const dx = tm.deathX * W;
          const dy = tm.deathY * H;
          ctx.save();
          ctx.font = '700 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('💀', dx, dy + 4);
          ctx.font = '700 9px "JetBrains Mono", monospace';
          ctx.fillStyle = '#f87171';
          ctx.fillText(`${tm.name} Death [${tm.deathGrid}]`, dx, dy - 10);
          ctx.restore();
        }

        const tx = tm.x * W;
        const ty = tm.y * H;

        ctx.save();
        if (tm.isOnline) {
          ctx.beginPath();
          ctx.arc(tx, ty, 10 + pulse * 6, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(74, 222, 128, 0.55)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(tx, ty, 7, 0, Math.PI * 2);
        ctx.fillStyle = tm.isOnline ? '#22c55e' : '#64748b';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.font = '700 10px "JetBrains Mono", monospace';
        const tag = `● ${tm.name} [${tm.grid}]`;
        const tw = ctx.measureText(tag).width + 8;
        ctx.fillStyle = 'rgba(9, 11, 14, 0.88)';
        ctx.fillRect(tx - tw / 2, ty - 22, tw, 13);
        ctx.fillStyle = tm.isOnline ? '#4ade80' : '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText(tag, tx, ty - 12);
        ctx.restore();
      });
    }

    ctx.restore();
  }

  function renderMonumentAtlas() {
    const detailEl = document.getElementById('selectedMonumentDetail');
    const listEl = document.getElementById('monumentAtlasList');
    if (!detailEl || !listEl) return;

    const m = DATA.monuments.find((item) => item.id === selectedMonumentId) || DATA.monuments[0];
    if (m) {
      const neededBadges =
        m.cardsNeeded.length > 0
          ? m.cardsNeeded.map((c) => `<span class="keycard-tag keycard-${c}">${c} Card</span>`).join(' ')
          : '<span class="target-tier-tag">No Card Needed</span>';

      const foundBadges =
        m.cardsFound.length > 0
          ? m.cardsFound.map((c) => `<span class="keycard-tag keycard-${c}">Gives ${c} Card</span>`).join(' ')
          : '<span class="target-tier-tag">Endgame Elite Loot</span>';

      detailEl.innerHTML = `
        <div style="background:linear-gradient(155deg, rgba(205,65,43,0.14), var(--bg-card)); border:1px solid var(--rust-orange); border-radius:8px; padding:14px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; flex-wrap:wrap;">
            <div>
              <div style="font-family:var(--font-display); font-size:18px; font-weight:700; color:#fff;">
                🏛️ ${m.name} <span style="font-family:var(--font-mono); font-size:12px; color:var(--sulfur-yellow);">[${m.defaultPos.grid}]</span>
              </div>
              <div style="font-size:12px; color:var(--text-secondary); margin-top:2px;">
                Tier ${m.tier} Monument • Radiation Required: <strong style="color:#fff;">${m.radRequired}</strong>
              </div>
            </div>
            <button class="btn btn-primary btn-sm" id="startMonumentTimerBtn" data-mid="${m.id}">
              ⏱️ Completed! Start ${m.respawnMin}m Timer
            </button>
          </div>

          <div style="display:flex; gap:8px; flex-wrap:wrap; margin:10px 0;">
            <div><span style="font-size:11px; color:var(--text-secondary);">NEED:</span> ${neededBadges}</div>
            <div>
              <span class="keycard-tag keycard-Fuse">🔌 ${m.fusesNeeded}x Electric Fuse</span>
            </div>
            <div><span style="font-size:11px; color:var(--text-secondary);">GET:</span> ${foundBadges}</div>
          </div>

          <div style="display:flex; gap:12px; flex-wrap:wrap; font-family:var(--font-mono); font-size:11px; background:rgba(0,0,0,0.3); padding:8px 10px; border-radius:5px;">
            ${m.crates.locked ? `<span style="color:#ef4444;">🔒 ${m.crates.locked} Locked Crate</span>` : ''}
            ${m.crates.elite ? `<span style="color:#f87171;">💎 ${m.crates.elite} Elite Crates</span>` : ''}
            <span style="color:#4ade80;">🟢 ${m.crates.military} Military Crates</span>
            <span>📦 ${m.crates.normal} Normal Crates</span>
            ${m.crates.diesel ? `<span style="color:var(--sulfur-yellow);">🛢️ ${m.crates.diesel} Diesel Barrels</span>` : ''}
          </div>

          <ul class="step-list">
            ${m.steps.map((s, idx) => `<li><strong style="color:var(--sulfur-yellow);">#${idx + 1}</strong> <span>${s}</span></li>`).join('')}
          </ul>
        </div>
      `;

      detailEl.querySelector('#startMonumentTimerBtn')?.addEventListener('click', () => {
        startSquadTimer(`${m.name} [${m.defaultPos.grid}] — Respawn`, m.respawnMin * 60, '#3b82f6');
      });
    }

    const filtered = DATA.monuments.filter((item) => {
      if (selectedMonumentFilter === 'get_green') return item.cardsFound.includes('Green');
      if (selectedMonumentFilter === 'get_blue') return item.cardsFound.includes('Blue');
      if (selectedMonumentFilter === 'get_red') return item.cardsFound.includes('Red');
      if (selectedMonumentFilter === 'tier3') return item.tier === 3;
      return true;
    });

    listEl.innerHTML = filtered
      .map((item) => {
        const isAct = item.id === selectedMonumentId;
        return `
          <div class="monument-item ${isAct ? 'active' : ''}" data-mid="${item.id}">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div style="font-family:var(--font-display); font-weight:700; font-size:14px; color:#fff;">
                ${item.name} <span style="font-family:var(--font-mono); font-size:11px; color:var(--text-secondary);">[${item.defaultPos.grid}]</span>
              </div>
              <span class="keycard-tag keycard-Fuse">🔌 ${item.fusesNeeded} Fuse</span>
            </div>
            <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:6px; font-size:11px;">
              <span style="color:var(--text-secondary);">Need: ${item.cardsNeeded.join(' + ') || 'None'}</span>
              <span>→</span>
              <span style="color:var(--card-green); font-weight:600;">Get: ${item.cardsFound.join(', ') || 'Elite Crates'}</span>
              <span style="margin-left:auto; font-family:var(--font-mono); color:var(--text-secondary);">☢️ ${item.radRequired}</span>
            </div>
          </div>
        `;
      })
      .join('');

    listEl.querySelectorAll('.monument-item').forEach((el) => {
      el.addEventListener('click', () => {
        selectedMonumentId = el.getAttribute('data-mid');
        renderMonumentAtlas();
        drawTacticalMap();
      });
    });
  }

  function renderBuildSpotsList() {
    const listEl = document.getElementById('buildSpotsList');
    if (!listEl) return;
    const squadFilter = document.getElementById('spotSquadFilter')?.value || 'all';
    const styleFilter = document.getElementById('spotStyleFilter')?.value || 'all';

    const filtered = DATA.buildSpots.filter((s) => {
      const mSquad = squadFilter === 'all' || s.squadSize.includes(squadFilter);
      const mStyle = styleFilter === 'all' || s.playstyle.includes(styleFilter);
      return mSquad && mStyle;
    });

    listEl.innerHTML = filtered
      .map(
        (s) => `
        <div class="monument-item" data-spot-grid="${s.grid}">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-family:var(--font-display); font-weight:700; font-size:15px; color:#fff;">
              🏰 ${s.name}
            </span>
            <span class="combo-badge">${s.tier} • ${s.grid}</span>
          </div>
          <div style="display:flex; gap:12px; margin:8px 0; font-family:var(--font-mono); font-size:11px;">
            <span style="color:var(--sulfur-yellow);">⛏️ Sulfur: ${s.scores.sulfur}/100</span>
            <span style="color:#60a5fa;">⚙️ Scrap: ${s.scores.scrap}/100</span>
            <span style="color:#4ade80;">🥷 Stealth: ${s.scores.stealth}/100</span>
          </div>
          <div style="font-size:12px; color:#4ade80; margin-bottom:4px;">
            ${s.pros.map((p) => `<div>✓ ${p}</div>`).join('')}
          </div>
          <div style="font-size:12px; color:#f87171;">
            ${s.cons.map((c) => `<div>⚠ ${c}</div>`).join('')}
          </div>
        </div>
      `
      )
      .join('');

    drawTacticalMap();
  }

  function renderSquadMarkersList() {
    const listEl = document.getElementById('squadMarkersList');
    if (!listEl) return;

    if (!appState.markers || appState.markers.length === 0) {
      listEl.innerHTML = `<div style="padding:14px; text-align:center; color:var(--text-muted);">No squad map pins placed yet.</div>`;
      return;
    }

    listEl.innerHTML = appState.markers
      .map(
        (m) => `
        <div class="monument-item" style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
          <div>
            <div style="font-family:var(--font-display); font-weight:700; color:#fff;">
              ${m.type === 'raid' ? '🎯' : m.type === 'base' ? '🏠' : m.type === 'farm' ? '⛏️' : '⚠️'} ${m.label}
              <span style="font-family:var(--font-mono); color:var(--sulfur-yellow);">[${m.grid}]</span>
            </div>
            <div style="font-size:12px; color:var(--text-secondary);">${m.notes || ''}</div>
          </div>
          <button class="btn btn-sm remove-pin-btn" data-pin-id="${m.id}">✕</button>
        </div>
      `
      )
      .join('');

    listEl.querySelectorAll('.remove-pin-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-pin-id');
        appState.markers = appState.markers.filter((m) => m.id !== id);
        syncStateToServer();
        renderSquadMarkersList();
        drawTacticalMap();
      });
    });
  }

  function renderRustPlusSidebar() {
    if (!appState.rustPlus) return;

    // 1. Vending Machine Search & List
    const vmListEl = document.getElementById('vendingMachinesList');
    const searchQ = (document.getElementById('vendingSearchInput')?.value || '').trim().toLowerCase();
    if (vmListEl && Array.isArray(appState.rustPlus.vendingMachines)) {
      const filteredVms = appState.rustPlus.vendingMachines.filter((vm) => {
        if (!searchQ) return true;
        return (
          vm.name.toLowerCase().includes(searchQ) ||
          (vm.orders || []).some(
            (o) => o.item.toLowerCase().includes(searchQ) || o.costItem.toLowerCase().includes(searchQ)
          )
        );
      });

      vmListEl.innerHTML = filteredVms
        .map((vm) => {
          const isSel = vm.id === selectedVendingId;
          const ordersHtml = (vm.orders || [])
            .map(
              (o) => `
              <div style="display:flex; justify-content:space-between; font-family:var(--font-mono); font-size:11px; color:var(--text-main); padding:2px 0;">
                <span><strong style="color:#4ade80;">${o.qty}x ${o.item}</strong> (${o.stock} left)</span>
                <span style="color:var(--sulfur-yellow);">Cost: ${o.costQty} ${o.costItem}</span>
              </div>
            `
            )
            .join('');

          return `
            <div class="monument-item vm-item-card ${isSel ? 'active' : ''}" data-vmid="${vm.id}" style="padding:9px 11px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-family:var(--font-display); font-weight:700; color:#fff; font-size:13px;">
                  🛒 ${vm.name}
                </span>
                <span class="keycard-tag keycard-Green">[${vm.grid}]</span>
              </div>
              <div style="margin-top:5px;">${ordersHtml}</div>
            </div>
          `;
        })
        .join('');

      vmListEl.querySelectorAll('.vm-item-card').forEach((card) => {
        card.addEventListener('click', () => {
          selectedVendingId = card.getAttribute('data-vmid');
          renderRustPlusSidebar();
          drawTacticalMap();
        });
      });
    }

    // 2. Smart Switches & Alarms
    const sdListEl = document.getElementById('smartDevicesList');
    if (sdListEl && Array.isArray(appState.rustPlus.smartDevices)) {
      sdListEl.innerHTML = appState.rustPlus.smartDevices
        .map(
          (sd) => `
          <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-input); border:1px solid ${sd.active ? 'rgba(34,197,94,0.45)' : 'var(--border-subtle)'}; border-radius:5px; padding:8px 10px;">
            <div>
              <div style="font-family:var(--font-display); font-weight:700; color:#fff; font-size:13px;">
                ${sd.type === 'alarm' ? '🚨' : '⚡'} ${sd.name} <span style="font-family:var(--font-mono); font-size:11px; color:var(--sulfur-yellow);">[${sd.grid}]</span>
              </div>
              <div style="font-family:var(--font-mono); font-size:10px; color:var(--text-secondary);">
                Entity ID: ${sd.entityId} • Status: <strong style="color:${sd.active ? '#4ade80' : '#f87171'};">${sd.active ? 'ONLINE / ON' : 'OFFLINE / OFF'}</strong>
              </div>
            </div>
            <button class="btn btn-sm toggle-smart-device-btn ${sd.active ? 'btn-primary' : ''}" data-sdid="${sd.id}">
              ${sd.active ? 'TURN OFF' : 'TURN ON'}
            </button>
          </div>
        `
        )
        .join('');

      sdListEl.querySelectorAll('.toggle-smart-device-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const sdid = btn.getAttribute('data-sdid');
          const dev = appState.rustPlus.smartDevices.find((d) => d.id === sdid);
          if (!dev) return;
          dev.active = !dev.active;
          renderRustPlusSidebar();
          saveLocalFallback();
          if (isServerConnected) {
            try {
              await fetch('/api/rustplus/switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Squad-Pin': getSquadPin() },
                body: JSON.stringify({ id: dev.id, active: dev.active })
              });
            } catch (_) {}
          }
        });
      });
    }

    // 3. Team Chat Box
    const chatBox = document.getElementById('rustPlusChatBox');
    if (chatBox && Array.isArray(appState.rustPlus.teamChat)) {
      chatBox.innerHTML = appState.rustPlus.teamChat
        .map(
          (msg) => `
          <div>
            <span style="font-family:var(--font-mono); font-size:10px; color:var(--text-muted);">[${msg.time}]</span>
            <strong style="color:${msg.color || '#4ade80'};">[TEAM] ${msg.author}:</strong>
            <span style="color:var(--text-main);">${msg.text}</span>
          </div>
        `
        )
        .join('');
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }

  function initMapModule() {
    const canvas = document.getElementById('tacticalMapCanvas');
    if (!canvas) return;

    // Layer toggles
    document.querySelectorAll('#mapLayerToggles .filter-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        const layer = btn.getAttribute('data-layer');
        mapLayers[layer] = !mapLayers[layer];
        btn.classList.toggle('active', mapLayers[layer]);
        drawTacticalMap();
      });
    });

    // Side subtabs
    document.querySelectorAll('#mapSideSubtabs .filter-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#mapSideSubtabs .filter-pill').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.getAttribute('data-subtab');
        document.querySelectorAll('.map-subtab-content').forEach((el) => {
          el.style.display = el.id === target ? 'block' : 'none';
        });
      });
    });

    // Vending search live filter
    document.getElementById('vendingSearchInput')?.addEventListener('input', () => {
      renderRustPlusSidebar();
      drawTacticalMap();
    });

    // Add Smart Switch button
    document.getElementById('addSmartSwitchBtn')?.addEventListener('click', () => {
      const name = prompt('Smart Switch / Alarm Name (e.g. Shooting Floor Shutters):');
      if (!name) return;
      const entityId = prompt('Rust+ Entity ID (from Pairing in-game):', '1049000') || '1049000';
      const grid = prompt('Base Grid Coordinate:', 'N11') || 'N11';
      appState.rustPlus.smartDevices.push({
        id: 'sd-' + Date.now(),
        entityId,
        name,
        type: 'switch',
        active: false,
        grid: grid.toUpperCase()
      });
      syncStateToServer();
      renderRustPlusSidebar();
    });

    // Send Team Chat
    async function sendTeamChatMessage() {
      const inp = document.getElementById('rustPlusChatInput');
      const text = inp?.value.trim();
      if (!text) return;
      inp.value = '';
      const msgObj = {
        id: 'tc-' + Date.now(),
        author: appState.squadName || 'Tang',
        text,
        time: new Date().toTimeString().slice(0, 5),
        color: '#4ade80'
      };
      appState.rustPlus.teamChat.push(msgObj);
      renderRustPlusSidebar();
      saveLocalFallback();
      if (isServerConnected) {
        try {
          await fetch('/api/rustplus/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Squad-Pin': getSquadPin() },
            body: JSON.stringify({ author: msgObj.author, text })
          });
        } catch (_) {}
      }
    }

    document.getElementById('sendRustPlusChatBtn')?.addEventListener('click', sendTeamChatMessage);
    document.getElementById('rustPlusChatInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendTeamChatMessage();
    });

    // Toggle Live Event Simulation
    const simBtn = document.getElementById('toggleLiveEventsSimBtn');
    simBtn?.addEventListener('click', () => {
      liveEventsSimEnabled = !liveEventsSimEnabled;
      simBtn.textContent = liveEventsSimEnabled ? '⚡ Live Event Sim: ON' : '⏸️ Live Event Sim: PAUSED';
      drawTacticalMap();
    });

    // Rust+ Pairing Modal
    const rpModal = document.getElementById('rustPlusModal');
    document.getElementById('openRustPlusModalBtn')?.addEventListener('click', () => {
      const cfg = appState.rustPlus?.config || {};
      document.getElementById('rpServerIp').value = cfg.ip || '';
      document.getElementById('rpServerPort').value = cfg.port || '28082';
      document.getElementById('rpPlayerId').value = cfg.playerId || '';
      document.getElementById('rpPlayerToken').value = cfg.playerToken || '';
      const fcmBadge = document.getElementById('fcmListenerBadge');
      if (fcmBadge) {
        fcmBadge.textContent = appState.rustPlus?.fcmListening ? '🟢 LISTENING FOR IN-GAME PAIR' : 'LISTENER READY';
        fcmBadge.className = appState.rustPlus?.fcmListening ? 'keycard-tag keycard-Green' : 'keycard-tag keycard-Fuse';
      }
      rpModal?.classList.add('open');
    });

    document.getElementById('closeRustPlusModalBtn')?.addEventListener('click', () => {
      rpModal?.classList.remove('open');
    });

    // Copy %APPDATA%\RustPlusDesk path button
    document.getElementById('copyRustPlusDeskPathBtn')?.addEventListener('click', () => {
      const pathStr = '%APPDATA%\\RustPlusDesk';
      navigator.clipboard?.writeText(pathStr);
      const statusBox = document.getElementById('rpImportStatusBox');
      if (statusBox) {
        statusBox.style.display = 'block';
        statusBox.textContent = '✓ Copied "%APPDATA%\\RustPlusDesk" to clipboard! Now click "2. Select profiles.json or rustplusjs-config.json" and press Ctrl+V in the File Explorer address bar.';
      }
    });

    // Copy F12 Console 1-Liner helper
    document.getElementById('copyConsoleExtractorBtn')?.addEventListener('click', () => {
      const snippet = `copy(document.documentElement.outerHTML); alert('Copied! Paste into Rust Tactical Companion.');`;
      navigator.clipboard?.writeText(snippet);
      alert('Copied F12 Console Extractor! On the Facepunch Steam Login page, press F12 -> Console, press Ctrl+V and Enter, then paste into the box below.');
    });

    // Activate Live In-Game FCM Pairing Listener
    document.getElementById('activateFcmListenerBtn')?.addEventListener('click', async () => {
      const tokenInput = document.getElementById('fcmTokenInput')?.value.trim();
      if (!tokenInput) {
        alert('First paste the output from the F12 Console Extractor or upload rustplusjs-config.json from %APPDATA%\\RustPlusDesk!');
        return;
      }
      if (!isServerConnected) {
        alert('Host the app on your Pterodactyl container so the backend can register with Facepunch FCM and listen for in-game pairing!');
        return;
      }
      const btn = document.getElementById('activateFcmListenerBtn');
      const oldText = btn.textContent;
      btn.textContent = '⏳ Registering with Facepunch FCM & Starting Listener...';
      try {
        const res = await fetch('/api/rustplus/fcm-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Squad-Pin': getSquadPin() },
          body: JSON.stringify({ tokenInput })
        });
        const data = await res.json();
        if (res.ok) {
          alert('🎉 ' + data.message);
          const fcmBadge = document.getElementById('fcmListenerBadge');
          if (fcmBadge) {
            fcmBadge.textContent = '🟢 LISTENING FOR IN-GAME PAIR';
            fcmBadge.className = 'keycard-tag keycard-Green';
          }
        } else {
          alert('Error: ' + (data.error || 'Failed to register FCM'));
        }
      } catch (err) {
        alert('Request failed: ' + err.message);
      } finally {
        btn.textContent = oldText;
      }
    });

    // 1-Click Upload from RustPlusDesk (profiles.json or rustplusjs-config.json) or rustplus.config.json
    document.getElementById('rpJsonFileInput')?.addEventListener('change', async (evt) => {
      const files = Array.from(evt.target.files || []);
      if (files.length === 0) return;
      const statusBox = document.getElementById('rpImportStatusBox');

      for (const file of files) {
        try {
          const text = await file.text();
          const parsed = JSON.parse(text);

          // Case 1: RustPlusDesk profiles.json (Array of server profiles with PascalCase keys)
          if (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].Host || parsed[0].PlayerToken)) {
            let profile = parsed[parsed.length - 1];
            if (parsed.length > 1) {
              const names = parsed.map((p, i) => `${i + 1}: ${p.Name || p.Host}`).join('\n');
              const choice = prompt(`Found ${parsed.length} servers in profiles.json:\n${names}\n\nEnter number to import (default ${parsed.length}):`, String(parsed.length));
              const idx = (parseInt(choice, 10) || parsed.length) - 1;
              if (parsed[idx]) profile = parsed[idx];
            }

            const ip = profile.Host || '';
            const port = String(profile.Port || '28082');
            const playerId = String(profile.SteamId64 || '');
            const playerToken = String(profile.PlayerToken || '');
            const serverName = profile.Name || `${ip}:${port}`;
            const useFacepunchProxy = Boolean(profile.UseFacepunchProxy);
            const customImageUrl = profile.CustomMapUrl || '';
            const battlemetricsId = profile.BattleMetricsId || '';

            const smartDevices = Array.isArray(profile.Devices)
              ? profile.Devices.map((d) => ({
                  id: 'sd-' + d.EntityId,
                  entityId: String(d.EntityId),
                  name: d.Name || d.Alias || `Smart Device #${d.EntityId}`,
                  type: d.Kind === 2 ? 'alarm' : 'switch',
                  active: Boolean(d.IsOn),
                  grid: 'PAIRED'
                }))
              : [];

            document.getElementById('rpServerIp').value = ip;
            document.getElementById('rpServerPort').value = port;
            document.getElementById('rpPlayerId').value = playerId;
            document.getElementById('rpPlayerToken').value = playerToken;

            appState.rustPlus.config = { serverName, ip, port, playerId, playerToken, useFacepunchProxy };
            if (smartDevices.length > 0) {
              smartDevices.forEach((sd) => {
                if (!appState.rustPlus.smartDevices.some((existing) => String(existing.entityId) === sd.entityId)) {
                  appState.rustPlus.smartDevices.unshift(sd);
                }
              });
            }
            saveLocalFallback();
            renderRustPlusSidebar();

            if (isServerConnected) {
              const res = await fetch('/api/rustplus/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Squad-Pin': getSquadPin() },
                body: JSON.stringify({
                  serverName,
                  ip,
                  port,
                  playerId,
                  playerToken,
                  useFacepunchProxy,
                  smartDevices,
                  customImageUrl,
                  battlemetricsId
                })
              });
              const data = await res.json();
              if (statusBox) {
                statusBox.style.display = 'block';
                statusBox.textContent = `✓ Imported "${serverName}" + ${smartDevices.length} Smart Device(s) from profiles.json! ${data.message || ''}`;
              }
              alert(`🎉 Imported "${serverName}" (${ip}:${port}) and ${smartDevices.length} Smart Switch/Alarm(s) from Rust+ Desktop!`);
            } else {
              alert(`Imported "${serverName}" (${ip}:${port}) and ${smartDevices.length} Smart Switch(es) from profiles.json!`);
            }
            continue;
          }

          // Case 2: RustPlusDesk rustplusjs-config.json (contains fcm_credentials + rustplus_auth_token)
          if (parsed.fcm_credentials || parsed.rustplus_auth_token) {
            document.getElementById('fcmTokenInput').value = text;
            if (isServerConnected) {
              const res = await fetch('/api/rustplus/fcm-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Squad-Pin': getSquadPin() },
                body: JSON.stringify({
                  fcmCredentials: parsed.fcm_credentials,
                  tokenInput: text
                })
              });
              const data = await res.json();
              if (res.ok) {
                const fcmBadge = document.getElementById('fcmListenerBadge');
                if (fcmBadge) {
                  fcmBadge.textContent = '🟢 LISTENING FOR IN-GAME PAIR';
                  fcmBadge.className = 'keycard-tag keycard-Green';
                }
                if (statusBox) {
                  statusBox.style.display = 'block';
                  statusBox.textContent = `✓ ${data.message}`;
                }
                alert('🎉 ' + data.message);
              } else {
                alert('FCM Import Error: ' + (data.error || 'Failed'));
              }
            } else {
              alert('Loaded rustplusjs-config.json! Click "Activate Live In-Game Pairing Listener" when connected to your Pterodactyl server.');
            }
            continue;
          }

          // Case 3: Standard rustplus.config.json ({ ip, port, playerId, playerToken })
          const ip = parsed.ip || parsed.server?.ip || parsed.Host || '';
          const port = String(parsed.port || parsed.server?.port || parsed.Port || '28082');
          const playerId = String(parsed.playerId || parsed.steamId || parsed.SteamId64 || '');
          const playerToken = String(parsed.playerToken || parsed.token || parsed.PlayerToken || '');
          if (ip) document.getElementById('rpServerIp').value = ip;
          if (port) document.getElementById('rpServerPort').value = port;
          if (playerId) document.getElementById('rpPlayerId').value = playerId;
          if (playerToken) document.getElementById('rpPlayerToken').value = playerToken;
          alert('Loaded credentials from JSON! Click "Connect & Sync Paired Rust+ Server" below.');
        } catch (err) {
          alert(`Failed to parse ${file.name}: ${err.message}`);
        }
      }
      evt.target.value = '';
    });

    document.getElementById('connectRustPlusBtn')?.addEventListener('click', async () => {
      const ip = document.getElementById('rpServerIp').value.trim();
      const port = document.getElementById('rpServerPort').value.trim() || '28082';
      const playerId = document.getElementById('rpPlayerId').value.trim();
      const playerToken = document.getElementById('rpPlayerToken').value.trim();
      appState.rustPlus.config = { ip, port, playerId, playerToken };
      saveLocalFallback();

      if (isServerConnected) {
        try {
          const res = await fetch('/api/rustplus/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Squad-Pin': getSquadPin() },
            body: JSON.stringify({ ip, port, playerId, playerToken })
          });
          const data = await res.json();
          alert(data.message || 'Rust+ configuration updated!');
        } catch (_) {}
      } else {
        alert('Saved Rust+ pairing config locally! Host on your Pterodactyl container for live server socket polling.');
      }
      rpModal?.classList.remove('open');
    });

    document.getElementById('rpFetchBmMapBtn')?.addEventListener('click', async () => {
      const bmId = document.getElementById('rpBmServerIdInput')?.value.trim();
      if (!bmId) return;
      await loadBattleMetricsServerById(bmId);
      rpModal?.classList.remove('open');
    });

    // Monument filters
    document.querySelectorAll('#monumentFilterBar .filter-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#monumentFilterBar .filter-pill').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMonumentFilter = btn.getAttribute('data-mfilter');
        renderMonumentAtlas();
      });
    });

    document.getElementById('spotSquadFilter')?.addEventListener('change', renderBuildSpotsList);
    document.getElementById('spotStyleFilter')?.addEventListener('change', renderBuildSpotsList);

    // Zoom & Reset buttons
    document.getElementById('mapZoomInBtn')?.addEventListener('click', () => {
      mapZoom = Math.min(3.5, mapZoom * 1.25);
      drawTacticalMap();
    });
    document.getElementById('mapZoomOutBtn')?.addEventListener('click', () => {
      mapZoom = Math.max(0.8, mapZoom / 1.25);
      drawTacticalMap();
    });
    document.getElementById('mapResetViewBtn')?.addEventListener('click', () => {
      mapZoom = 1.0;
      mapOffsetX = 0;
      mapOffsetY = 0;
      drawTacticalMap();
    });

    // Canvas Mouse Pan, Zoom & Click
    function getNormalizedCanvasCoord(evt) {
      const rect = canvas.getBoundingClientRect();
      const sx = ((evt.clientX - rect.left) / rect.width) * canvas.width;
      const sy = ((evt.clientY - rect.top) / rect.height) * canvas.height;
      const W = canvas.width;
      const H = canvas.height;
      const wx = (sx - W / 2 - mapOffsetX) / mapZoom + W / 2;
      const wy = (sy - H / 2 - mapOffsetY) / mapZoom + H / 2;
      return { nx: wx / W, ny: wy / H };
    }

    canvas.addEventListener('mousedown', (evt) => {
      isDraggingMap = true;
      pointerMoved = false;
      dragStartX = evt.clientX - mapOffsetX;
      dragStartY = evt.clientY - mapOffsetY;
    });

    window.addEventListener('mousemove', (evt) => {
      if (evt.target === canvas) {
        const { nx, ny } = getNormalizedCanvasCoord(evt);
        const coordEl = document.getElementById('mapCursorCoord');
        if (coordEl && nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1) {
          coordEl.textContent = `GRID: ${normalizedToGrid(nx, ny)}`;
        }
      }
      if (!isDraggingMap) return;
      if (Math.abs(evt.clientX - dragStartX - mapOffsetX) > 4 || Math.abs(evt.clientY - dragStartY - mapOffsetY) > 4) {
        pointerMoved = true;
      }
      mapOffsetX = evt.clientX - dragStartX;
      mapOffsetY = evt.clientY - dragStartY;
      drawTacticalMap();
    });

    window.addEventListener('mouseup', () => {
      isDraggingMap = false;
    });

    canvas.addEventListener('wheel', (evt) => {
      evt.preventDefault();
      const factor = evt.deltaY < 0 ? 1.12 : 0.89;
      mapZoom = Math.min(3.5, Math.max(0.8, mapZoom * factor));
      drawTacticalMap();
    });

    canvas.addEventListener('click', (evt) => {
      if (pointerMoved) return;
      const { nx, ny } = getNormalizedCanvasCoord(evt);
      if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return;

      const mode = document.getElementById('mapClickModeSelect')?.value || 'inspect';
      if (mode === 'inspect') {
        // Check closest Vending Machine first
        let closestVm = null;
        let minVmDist = 0.032;
        (appState.rustPlus?.vendingMachines || []).forEach((vm) => {
          const d = Math.hypot(vm.x - nx, vm.y - ny);
          if (d < minVmDist) {
            minVmDist = d;
            closestVm = vm;
          }
        });
        if (closestVm) {
          selectedVendingId = closestVm.id;
          document.querySelector('[data-subtab="sub-rustplus"]')?.click();
          renderRustPlusSidebar();
          drawTacticalMap();
          return;
        }

        // Otherwise find closest monument
        let closest = null;
        let minDist = 0.045;
        DATA.monuments.forEach((m) => {
          const d = Math.hypot(m.defaultPos.x - nx, m.defaultPos.y - ny);
          if (d < minDist) {
            minDist = d;
            closest = m;
          }
        });
        if (closest) {
          selectedMonumentId = closest.id;
          document.querySelector('[data-subtab="sub-monuments"]')?.click();
          renderMonumentAtlas();
          drawTacticalMap();
        }
      } else if (mode === 'move_gps') {
        const grid = normalizedToGrid(nx, ny);
        if (appState.rustPlus?.teamMembers?.[0]) {
          appState.rustPlus.teamMembers[0].x = Number(nx.toFixed(4));
          appState.rustPlus.teamMembers[0].y = Number(ny.toFixed(4));
          appState.rustPlus.teamMembers[0].grid = grid;
          syncStateToServer();
          drawTacticalMap();
        }
      } else {
        const type = mode.replace('pin_', '');
        const grid = normalizedToGrid(nx, ny);
        const defaultName =
          type === 'raid'
            ? 'Enemy Raid Target'
            : type === 'base'
              ? 'Squad FOB / Base'
              : type === 'farm'
                ? 'Rich Node Cluster'
                : 'Roofcamper / Turret';
        const label = prompt(`Enter label for ${defaultName} at [${grid}]:`, defaultName);
        if (!label) return;
        const notes = prompt('Optional tactical notes (doors, turret count, offline time):', '') || '';

        appState.markers.push({
          id: 'pin-' + Date.now(),
          type,
          label,
          grid,
          x: Number(nx.toFixed(4)),
          y: Number(ny.toFixed(4)),
          notes
        });
        syncStateToServer();
        renderSquadMarkersList();
        drawTacticalMap();
      }
    });

    // Live animation loop for Rust+ moving entities (Cargo, Patrol Heli, Squad GPS pulse)
    setInterval(() => {
      const mapTabActive = document.getElementById('tab-map')?.classList.contains('active');
      if (mapTabActive && (liveEventsSimEnabled || mapLayers.teamGps || mapLayers.vending)) {
        drawTacticalMap();
      }
    }, 80);

    loadCustomMapImageIfConfigured();
    renderRustPlusSidebar();
  }

  // =========================================================================
  // MODULE 3: LIVE MONUMENT & EVENT TIMERS
  // =========================================================================
  const alerted60sIds = new Set();
  const alertedDoneIds = new Set();

  function formatDuration(sec) {
    const s = Math.max(0, Math.floor(sec));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const rem = s % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  }

  function startSquadTimer(name, durationSec, color = '#cd412b') {
    const now = Date.now();
    const timer = {
      id: 't-' + now + '-' + Math.random().toString(36).slice(2, 6),
      name,
      durationSec,
      startedAt: now,
      endsAt: now + durationSec * 1000,
      color
    };
    appState.activeTimers.unshift(timer);
    syncStateToServer();
    renderTimersTick();
  }

  function renderTimerPresets() {
    const grid = document.getElementById('timerPresetsGrid');
    if (!grid) return;

    grid.innerHTML = DATA.timerPresets
      .map(
        (p) => `
        <div class="target-card preset-timer-card" data-pid="${p.id}" style="border-left: 3px solid ${p.color};">
          <div class="target-card-top">
            <span class="target-tier-tag">${p.category}</span>
            <span style="font-family:var(--font-mono); font-size:12px; color:#fff; font-weight:700;">
              ${formatDuration(p.durationSec)}
            </span>
          </div>
          <div class="target-name">${p.name}</div>
          <div style="font-size:11px; color:var(--sulfur-yellow); font-family:var(--font-mono);">
            ▶ Click to Start Live Timer
          </div>
        </div>
      `
      )
      .join('');

    grid.querySelectorAll('.preset-timer-card').forEach((card) => {
      card.addEventListener('click', () => {
        const pid = card.getAttribute('data-pid');
        const preset = DATA.timerPresets.find((p) => p.id === pid);
        if (preset) {
          startSquadTimer(preset.name, preset.durationSec, preset.color);
        }
      });
    });
  }

  function renderTimersTick() {
    const now = Date.now();
    const container = document.getElementById('activeTimersContainer');
    const hudStrip = document.getElementById('hudTimersStrip');
    const navCount = document.getElementById('navTimerCount');

    const timers = appState.activeTimers || [];
    if (navCount) navCount.textContent = String(timers.length);

    // Check audio alerts
    timers.forEach((t) => {
      const remSec = Math.ceil((t.endsAt - now) / 1000);
      if (remSec <= 60 && remSec > 0 && !alerted60sIds.has(t.id)) {
        alerted60sIds.add(t.id);
        playAlertSound('urgent');
      }
      if (remSec <= 0 && !alertedDoneIds.has(t.id)) {
        alertedDoneIds.add(t.id);
        playAlertSound('complete');
      }
    });

    // Update Header HUD Strip
    if (hudStrip) {
      if (timers.length === 0) {
        hudStrip.innerHTML = `<span style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">No active monument timers — start one in Map or Timers</span>`;
      } else {
        hudStrip.innerHTML = timers
          .slice(0, 4)
          .map((t) => {
            const remSec = Math.max(0, Math.ceil((t.endsAt - now) / 1000));
            const isUrgent = remSec <= 60;
            return `
              <div class="hud-timer-pill ${isUrgent ? 'urgent' : ''}" data-tid="${t.id}">
                <span style="color:${t.color || '#cd412b'};">●</span>
                <span>${t.name}</span>
                <strong style="color:#fff;">${remSec <= 0 ? 'READY!' : formatDuration(remSec)}</strong>
              </div>
            `;
          })
          .join('');
      }
    }

    // Update Main Timers Tab
    if (!container) return;
    if (timers.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 26px; text-align: center; background: var(--bg-card); border-radius: 8px; color: var(--text-secondary);">
          No active countdowns running. Click any Monument / Oil Rig / Cargo / Bradley preset below to start a shared squad timer!
        </div>
      `;
      return;
    }

    container.innerHTML = timers
      .map((t) => {
        const remSec = Math.max(0, Math.ceil((t.endsAt - now) / 1000));
        const pct = Math.min(100, Math.max(0, (remSec / (t.durationSec || 1)) * 100));
        const isUrgent = remSec <= 60;
        return `
          <div class="timer-card ${isUrgent ? 'urgent' : ''}">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
              <div style="font-family:var(--font-display); font-weight:700; font-size:15px; color:#fff;">
                ${t.name}
              </div>
              <button class="btn btn-sm remove-timer-btn" data-tid="${t.id}">✕</button>
            </div>
            <div class="timer-countdown" style="color:${remSec <= 0 ? '#4ade80' : isUrgent ? '#f87171' : '#fff'};">
              ${remSec <= 0 ? 'COMPLETED / RESPAWNED!' : formatDuration(remSec)}
            </div>
            <div class="timer-progress-bar">
              <div class="timer-progress-fill" style="width:${pct}%; background:${t.color || '#cd412b'};"></div>
            </div>
          </div>
        `;
      })
      .join('');

    container.querySelectorAll('.remove-timer-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-tid');
        appState.activeTimers = appState.activeTimers.filter((t) => t.id !== id);
        syncStateToServer();
        renderTimersTick();
      });
    });
  }

  function initTimerModule() {
    renderTimerPresets();
    renderTimersTick();
    setInterval(renderTimersTick, 1000);

    document.getElementById('testAudioAlarmBtn')?.addEventListener('click', () => {
      playAlertSound('complete');
    });

    document.getElementById('clearAllTimersBtn')?.addEventListener('click', () => {
      appState.activeTimers = [];
      syncStateToServer();
      renderTimersTick();
    });

    document.getElementById('startCustomTimerBtn')?.addEventListener('click', () => {
      const label = document.getElementById('customTimerLabel')?.value.trim() || 'Custom Squad Timer';
      const mins = parseInt(document.getElementById('customTimerMin')?.value, 10) || 0;
      const secs = parseInt(document.getElementById('customTimerSec')?.value, 10) || 0;
      const total = mins * 60 + secs;
      if (total <= 0) return;
      startSquadTimer(label, total, '#eab308');
      document.getElementById('customTimerLabel').value = '';
    });
  }

  // =========================================================================
  // MODULE 4: PLANT GENETICS CROSSBREEDING SOLVER & BERRY TEA LAB
  // =========================================================================
  function formatGenesCircles(genesStr) {
    return (
      '<div class="gene-slots">' +
      genesStr
        .split('')
        .map((g) => `<span class="gene-circle gene-${g}">${g}</span>`)
        .join('') +
      '</div>'
    );
  }

  function scoreCloneAgainstTarget(genes, targetGoal) {
    let score = 0;
    for (let i = 0; i < 6; i++) {
      const g = genes[i];
      if (g === 'G' || g === 'Y') score += 15;
      else if (g === 'H') score += 8;
      else if (g === 'X') score -= 12;
      else if (g === 'W') score -= 16;
    }
    // Bonus for matching desired ratio
    const gCount = (genes.match(/G/g) || []).length;
    const yCount = (genes.match(/Y/g) || []).length;
    const targetG = (targetGoal.match(/G/g) || []).length;
    const targetY = (targetGoal.match(/Y/g) || []).length;
    score -= Math.abs(gCount - targetG) * 4 + Math.abs(yCount - targetY) * 4;
    return score;
  }

  function simulateCrossbreed(centerGenes, donorClones) {
    const resultGenes = [];
    const slotBreakdown = [];

    for (let slot = 0; slot < 6; slot++) {
      const centerGene = centerGenes[slot];
      const centerWeight = DATA.geneWeights[centerGene]?.weight || 0.6;
      const totals = {};

      donorClones.forEach((d) => {
        const g = d[slot];
        const w = DATA.geneWeights[g]?.weight || 0.6;
        totals[g] = Number(((totals[g] || 0) + w).toFixed(2));
      });

      let bestDonorGene = centerGene;
      let maxDonorWeight = 0;
      Object.entries(totals).forEach(([g, w]) => {
        if (w > maxDonorWeight || (w === maxDonorWeight && (g === 'G' || g === 'Y'))) {
          maxDonorWeight = w;
          bestDonorGene = g;
        }
      });

      const finalGene = maxDonorWeight > centerWeight ? bestDonorGene : centerGene;
      resultGenes.push(finalGene);
      slotBreakdown.push({
        slot: slot + 1,
        centerGene,
        winningGene: finalGene,
        winningWeight: maxDonorWeight > centerWeight ? maxDonorWeight : centerWeight,
        totals
      });
    }

    return {
      offspring: resultGenes.join(''),
      slotBreakdown
    };
  }

  function solveBestCrossbreed() {
    const container = document.getElementById('crossbreedResultContainer');
    if (!container) return;

    const targetGoal = document.getElementById('geneticsTargetGoal')?.value || 'GGGYYY';
    const crop = document.getElementById('cloneCropSelect')?.value || selectedCloneCropFilter;
    const cropClones = (appState.savedClones || []).filter((c) => c.crop === crop);

    if (cropClones.length < 2) {
      container.innerHTML = `
        <div style="padding:16px; background:var(--bg-card); border-radius:6px; color:var(--text-secondary);">
          Add at least <strong>2 clones</strong> of <strong>${crop}</strong> above (or click "Load Example Batch") to compute the optimal 3x3 crossbreed!
        </div>
      `;
      return;
    }

    const pool = cropClones.slice(0, 10).map((c) => c.genes);
    let bestPlan = null;

    // Test all subsets of size 2..5 from pool with each possible center sapling
    const n = pool.length;
    const maxMask = 1 << n;

    for (let centerIdx = 0; centerIdx < n; centerIdx++) {
      const centerGenes = pool[centerIdx];
      for (let mask = 1; mask < maxMask; mask++) {
        const donors = [];
        for (let j = 0; j < n; j++) {
          if (mask & (1 << j)) donors.push(pool[j]);
        }
        if (donors.length < 2 || donors.length > 8) continue;

        const sim = simulateCrossbreed(centerGenes, donors);
        const score = scoreCloneAgainstTarget(sim.offspring, targetGoal);
        if (!bestPlan || score > bestPlan.score) {
          bestPlan = {
            centerGenes,
            donors,
            offspring: sim.offspring,
            slotBreakdown: sim.slotBreakdown,
            score
          };
        }
      }
    }

    if (!bestPlan) return;

    const greenCount = (bestPlan.offspring.match(/[GYH]/g) || []).length;

    // Build 3x3 Large Planter Box cells (Center is index 4)
    const cellsHtml = [];
    let dIdx = 0;
    for (let i = 0; i < 9; i++) {
      if (i === 4) {
        cellsHtml.push(`
          <div class="planter-cell center-target">
            <span style="font-size:10px; font-family:var(--font-mono); color:var(--sulfur-yellow); font-weight:700;">CENTER SAPLING</span>
            <div style="font-family:var(--font-mono); font-weight:800; color:#fff; letter-spacing:0.08em;">${bestPlan.centerGenes}</div>
            <span style="font-size:10px; color:#4ade80;">→ ${bestPlan.offspring}</span>
          </div>
        `);
      } else if (dIdx < bestPlan.donors.length) {
        const dg = bestPlan.donors[dIdx++];
        cellsHtml.push(`
          <div class="planter-cell">
            <span style="font-size:10px; font-family:var(--font-mono); color:var(--text-secondary);">DONOR #${dIdx}</span>
            <div style="font-family:var(--font-mono); font-weight:700; color:#fff; letter-spacing:0.08em;">${dg}</div>
          </div>
        `);
      } else {
        cellsHtml.push(`
          <div class="planter-cell" style="opacity:0.4;">
            <span style="font-size:10px; font-family:var(--font-mono); color:var(--text-muted);">EMPTY SLOT</span>
          </div>
        `);
      }
    }

    container.innerHTML = `
      <div style="background:linear-gradient(155deg, rgba(34,197,94,0.12), var(--bg-card)); border:1px solid rgba(34,197,94,0.45); border-radius:8px; padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:14px;">
          <div>
            <div style="font-family:var(--font-mono); font-size:11px; color:#4ade80; font-weight:700;">
              ✨ OPTIMAL ${crop.toUpperCase()} CROSSBREED RESULT (${greenCount}/6 GREEN GENES)
            </div>
            <div style="font-family:var(--font-display); font-size:18px; font-weight:700; color:#fff; margin-top:4px;">
              Resulting Clone:
            </div>
          </div>
          <div>${formatGenesCircles(bestPlan.offspring)}</div>
        </div>

        <div class="grid-2" style="align-items:center;">
          <div>
            <div style="font-family:var(--font-display); font-size:12px; text-transform:uppercase; color:var(--sulfur-yellow); margin-bottom:8px; text-align:center;">
              📦 3x3 Large Planter Box Placement
            </div>
            <div class="planter-3x3">${cellsHtml.join('')}</div>
          </div>

          <div>
            <div style="font-family:var(--font-display); font-size:12px; text-transform:uppercase; color:var(--text-secondary); margin-bottom:8px;">
              🔬 Slot-by-Slot Dominance Breakdown
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Slot</th>
                  <th>Center</th>
                  <th>Donor Weights</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                ${bestPlan.slotBreakdown
                  .map(
                    (s) => `
                  <tr>
                    <td>#${s.slot}</td>
                    <td>${s.centerGene}</td>
                    <td style="font-size:11px; color:var(--text-secondary);">
                      ${Object.entries(s.totals)
                        .map(([k, v]) => `${k}:${v}`)
                        .join(', ')}
                    </td>
                    <td><span class="gene-circle gene-${s.winningGene}" style="width:22px; height:22px; font-size:11px;">${s.winningGene}</span></td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function renderSavedClonesAndTeas() {
    const clonesList = document.getElementById('savedClonesList');
    const teasContainer = document.getElementById('teaRecipesContainer');
    if (clonesList) {
      if (!appState.savedClones || appState.savedClones.length === 0) {
        clonesList.innerHTML = `<div style="padding:14px; color:var(--text-muted);">No clones saved yet.</div>`;
      } else {
        clonesList.innerHTML = appState.savedClones
          .map(
            (c, idx) => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:6px; padding:8px 12px; margin-bottom:8px;">
              <div>
                <span class="target-tier-tag" style="margin-right:8px;">${c.crop}</span>
                ${formatGenesCircles(c.genes)}
              </div>
              <button class="btn btn-sm remove-clone-btn" data-idx="${idx}">✕</button>
            </div>
          `
          )
          .join('');

        clonesList.querySelectorAll('.remove-clone-btn').forEach((btn) => {
          btn.addEventListener('click', () => {
            const idx = parseInt(btn.getAttribute('data-idx'), 10);
            appState.savedClones.splice(idx, 1);
            syncStateToServer();
            renderSavedClonesAndTeas();
            solveBestCrossbreed();
          });
        });
      }
    }

    if (teasContainer) {
      teasContainer.innerHTML = DATA.teaRecipes
        .map(
          (t) => `
          <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:6px; padding:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
              <span style="font-family:var(--font-display); font-weight:700; font-size:15px; color:#fff;">🧪 ${t.name}</span>
              <span class="combo-badge">${t.recipe}</span>
            </div>
            <div style="display:flex; gap:12px; flex-wrap:wrap; margin:8px 0; font-family:var(--font-mono); font-size:12px;">
              <span style="color:#60a5fa;">Basic: ${t.basic}</span>
              <span style="color:#c084fc;">Adv: ${t.advanced}</span>
              <span style="color:#4ade80; font-weight:700;">Pure: ${t.pure}</span>
            </div>
            <div style="font-size:12px; color:var(--text-secondary);">${t.notes}</div>
          </div>
        `
        )
        .join('');
    }
  }

  function calculateFertilizerScrap() {
    const dung = parseInt(document.getElementById('fertDungInput')?.value, 10) || 0;
    const fiber = parseInt(document.getElementById('fertFiberInput')?.value, 10) || 0;
    const out = document.getElementById('fertCalcResult');
    if (!out) return;

    // 1 Horse Dung = 10 Fertilizer; 1 Plant Fiber = 0.5 Fertilizer; 2 Fertilizer = 3 Scrap
    const totalFert = Math.floor(dung * 10 + fiber * 0.5);
    const totalScrap = Math.floor(totalFert / 2) * 3;

    out.innerHTML = `
      <div class="resource-grid" style="margin-top:0;">
        <div class="resource-box">
          <div class="resource-val" style="color:#4ade80;">${totalFert.toLocaleString()}</div>
          <div class="resource-label">Total Fertilizer</div>
        </div>
        <div class="resource-box highlight-sulfur">
          <div class="resource-val" style="color:var(--sulfur-yellow);">${totalScrap.toLocaleString()} Scrap</div>
          <div class="resource-label">Bandit Camp Payout</div>
        </div>
      </div>
    `;
  }

  function initGeneticsModule() {
    const input = document.getElementById('cloneGeneInput');
    document.querySelectorAll('.gene-quick-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!input) return;
        if (input.value.length < 6) {
          input.value = (input.value + btn.getAttribute('data-g')).toUpperCase().slice(0, 6);
        }
      });
    });

    document.getElementById('addCloneBtn')?.addEventListener('click', () => {
      const raw = (input?.value || '').toUpperCase().trim();
      if (!/^[GYHWX]{6}$/.test(raw)) {
        alert('Please enter exactly 6 valid genes using G, Y, H, W, or X (e.g. YGYWGG).');
        return;
      }
      const crop = document.getElementById('cloneCropSelect')?.value || 'Hemp';
      appState.savedClones.unshift({
        id: 'c-' + Date.now(),
        crop,
        genes: raw
      });
      if (input) input.value = '';
      syncStateToServer();
      renderSavedClonesAndTeas();
      solveBestCrossbreed();
    });

    document.getElementById('loadSampleClonesBtn')?.addEventListener('click', () => {
      const crop = document.getElementById('cloneCropSelect')?.value || 'Hemp';
      const samples = ['YGYWGG', 'GGYYXW', 'GWYYYG', 'XGGGYY'];
      samples.forEach((genes) => {
        if (!appState.savedClones.some((c) => c.crop === crop && c.genes === genes)) {
          appState.savedClones.push({ id: 'c-' + Math.random(), crop, genes });
        }
      });
      syncStateToServer();
      renderSavedClonesAndTeas();
      solveBestCrossbreed();
    });

    document.getElementById('cloneCropSelect')?.addEventListener('change', (e) => {
      selectedCloneCropFilter = e.target.value;
      solveBestCrossbreed();
    });
    document.getElementById('geneticsTargetGoal')?.addEventListener('change', solveBestCrossbreed);
    document.getElementById('runGeneticsSolverBtn')?.addEventListener('click', solveBestCrossbreed);
    document.getElementById('calcFertilizerBtn')?.addEventListener('click', calculateFertilizerScrap);

    renderSavedClonesAndTeas();
    solveBestCrossbreed();
    calculateFertilizerScrap();
  }

  // =========================================================================
  // MODULE 5: BATTLEMETRICS RAID WINDOW & SERVER INTELLIGENCE
  // =========================================================================
  let currentServerTelemetry = {
    name: 'Rustoria.co - EU Main (High Pop Profile)',
    id: '9565287',
    players: 385,
    maxPlayers: 500,
    queuedPlayers: 14,
    rank: 2,
    seed: '1337420',
    size: 4500,
    lastWipe: '2 days ago',
    hourlyPop: [
      240, 185, 130, 92, 68, 54, 48, 52, 65, 95, 140, 195,
      260, 320, 380, 430, 475, 500, 500, 495, 480, 440, 370, 305
    ]
  };

  async function fetchBattleMetricsSearch(query) {
    const resultsEl = document.getElementById('bmSearchResults');
    if (!resultsEl) return;
    resultsEl.innerHTML = `<div style="padding:10px; font-family:var(--font-mono); color:var(--sulfur-yellow);">📡 Querying BattleMetrics API for "${query}"...</div>`;

    try {
      // If numeric ID entered directly, load server telemetry
      if (/^\d+$/.test(query.trim())) {
        await loadBattleMetricsServerById(query.trim());
        resultsEl.innerHTML = '';
        return;
      }

      let data = null;
      try {
        const res = await fetch(`/api/battlemetrics/search?q=${encodeURIComponent(query)}`, {
          headers: getBmToken() ? { Authorization: `Bearer ${getBmToken()}` } : {}
        });
        if (res.ok) data = await res.json();
      } catch (_) {}

      // Browser direct fallback if running without Node proxy
      if (!data) {
        const directRes = await fetch(
          `https://api.battlemetrics.com/servers?filter[game]=rust&filter[search]=${encodeURIComponent(query)}&page[size]=8`
        );
        data = await directRes.json();
      }

      const list = data?.data || [];
      if (list.length === 0) {
        resultsEl.innerHTML = `<div style="padding:10px; color:var(--text-secondary);">No Rust servers matched "${query}". Try another keyword or Server ID.</div>`;
        return;
      }

      resultsEl.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:6px; max-height:240px; overflow-y:auto; background:var(--bg-input); padding:8px; border-radius:6px; border:1px solid var(--border-subtle);">
          ${list
            .map((srv) => {
              const a = srv.attributes || {};
              return `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 10px; background:var(--bg-card); border-radius:5px;">
                  <div>
                    <div style="font-weight:700; color:#fff;">${a.name}</div>
                    <div style="font-family:var(--font-mono); font-size:11px; color:var(--text-secondary);">
                      ID: ${srv.id} • Pop: <span style="color:#4ade80;">${a.players}/${a.maxPlayers}</span> • Rank #${a.rank || '-'}
                    </div>
                  </div>
                  <button class="btn btn-sm btn-primary select-bm-server-btn" data-sid="${srv.id}">
                    Analyze Raid Window
                  </button>
                </div>
              `;
            })
            .join('')}
        </div>
      `;

      resultsEl.querySelectorAll('.select-bm-server-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          loadBattleMetricsServerById(btn.getAttribute('data-sid'));
          resultsEl.innerHTML = '';
        });
      });
    } catch (err) {
      resultsEl.innerHTML = `<div style="padding:10px; color:#f87171;">BattleMetrics lookup failed (${err.message}). Loaded tactical profile below.</div>`;
    }
  }

  async function loadBattleMetricsServerById(serverId) {
    try {
      let payload = null;
      try {
        const res = await fetch(`/api/battlemetrics/server/${serverId}`, {
          headers: getBmToken() ? { Authorization: `Bearer ${getBmToken()}` } : {}
        });
        if (res.ok) payload = await res.json();
      } catch (_) {}

      if (!payload) {
        const directRes = await fetch(`https://api.battlemetrics.com/servers/${serverId}`);
        const srvJson = await directRes.json();
        payload = { server: srvJson, history: [] };
      }

      const srv = payload.server?.data;
      if (!srv) return;
      const a = srv.attributes || {};
      const details = a.details || {};

      // Build 24h hourly buckets from history or realistic curve scaled to maxPlayers
      const maxP = a.maxPlayers || 300;
      const curP = a.players || 100;
      const hourly = new Array(24).fill(0);

      if (Array.isArray(payload.history) && payload.history.length >= 12) {
        payload.history.slice(-24).forEach((pt, idx) => {
          const val = pt.attributes?.value ?? pt.attributes?.max ?? curP;
          hourly[idx % 24] = val;
        });
      } else {
        const baseCurve = [
          0.42, 0.32, 0.24, 0.18, 0.13, 0.11, 0.10, 0.12, 0.16, 0.24, 0.35, 0.48,
          0.62, 0.74, 0.85, 0.92, 0.98, 1.0, 1.0, 0.96, 0.90, 0.82, 0.68, 0.54
        ];
        baseCurve.forEach((r, hr) => {
          hourly[hr] = Math.round(maxP * r);
        });
      }

      currentServerTelemetry = {
        name: a.name || `Rust Server #${serverId}`,
        id: srv.id,
        players: curP,
        maxPlayers: maxP,
        queuedPlayers: details.rust_queued_players || 0,
        rank: a.rank || '-',
        seed: details.rust_world_seed || appState.mapConfig.seed,
        size: details.rust_world_size || appState.mapConfig.size,
        lastWipe: details.rust_last_wipe ? new Date(details.rust_last_wipe).toLocaleString() : 'Active Wipe',
        hourlyPop: hourly
      };

      appState.battlemetrics.serverId = srv.id;
      appState.battlemetrics.serverName = currentServerTelemetry.name;

      // Auto-extract official procedural map image from BattleMetrics if available
      const bmMapUrl =
        details.rust_maps?.thumbnailUrl ||
        details.rust_maps?.url ||
        details.map_url ||
        '';
      if (bmMapUrl && bmMapUrl.startsWith('http')) {
        appState.mapConfig.customImageUrl = bmMapUrl;
        loadCustomMapImageIfConfigured();
      }

      syncStateToServer();
      renderBattleMetricsDashboard();
    } catch (_) {}
  }

  function renderBattleMetricsDashboard() {
    const cardEl = document.getElementById('bmServerTelemetryCard');
    const summaryEl = document.getElementById('bmRaidWindowSummary');
    const heatmapEl = document.getElementById('bmHeatmapContainer');
    const advisorEl = document.getElementById('bmRaidMethodAdvisor');
    const watchEl = document.getElementById('bmWatchlistContainer');

    const s = currentServerTelemetry;
    const popPct = Math.round((s.players / Math.max(1, s.maxPlayers)) * 100);

    if (cardEl) {
      cardEl.innerHTML = `
        <div style="background:var(--bg-card); border:1px solid var(--border-highlight); border-radius:8px; padding:14px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
            <div>
              <div style="font-family:var(--font-display); font-size:17px; font-weight:700; color:#fff;">
                🌐 ${s.name}
              </div>
              <div style="font-family:var(--font-mono); font-size:11px; color:var(--text-secondary);">
                BattleMetrics ID: ${s.id} • Rank #${s.rank} • Last Wipe: ${s.lastWipe}
              </div>
            </div>
            <span class="keycard-tag ${popPct > 75 ? 'keycard-Red' : popPct > 40 ? 'keycard-Fuse' : 'keycard-Green'}">
              ${popPct}% CAPACITY (${s.players}/${s.maxPlayers})
            </span>
          </div>

          <div class="resource-grid" style="margin-top:12px;">
            <div class="resource-box">
              <div class="resource-val" style="color:#4ade80;">${s.players} / ${s.maxPlayers}</div>
              <div class="resource-label">Online Players</div>
            </div>
            <div class="resource-box">
              <div class="resource-val" style="color:var(--sulfur-yellow);">${s.queuedPlayers}</div>
              <div class="resource-label">Queue Size</div>
            </div>
            <div class="resource-box">
              <div class="resource-val">${s.seed}</div>
              <div class="resource-label">Map Seed (${s.size})</div>
            </div>
          </div>
        </div>
      `;
    }

    // Find lowest 4-hour raid window & peak window
    let minHour = 5;
    let minVal = Infinity;
    let maxHour = 18;
    let maxVal = 0;

    s.hourlyPop.forEach((val, hr) => {
      if (val < minVal) {
        minVal = val;
        minHour = hr;
      }
      if (val > maxVal) {
        maxVal = val;
        maxHour = hr;
      }
    });

    const windowStart = String((minHour + 23) % 24).padStart(2, '0') + ':00';
    const windowEnd = String((minHour + 3) % 24).padStart(2, '0') + ':00';

    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="grid-3">
          <div style="background:rgba(34,197,94,0.12); border:1px solid rgba(34,197,94,0.4); border-radius:6px; padding:12px;">
            <div style="font-family:var(--font-mono); font-size:11px; color:#4ade80; font-weight:700;">🟢 BEST OFFLINE RAID WINDOW</div>
            <div style="font-family:var(--font-display); font-size:20px; font-weight:700; color:#fff; margin:4px 0;">
              ${windowStart} – ${windowEnd}
            </div>
            <div style="font-size:11px; color:var(--text-secondary);">Lowest server pop (~${minVal} players). Minimal counter-raiders.</div>
          </div>

          <div style="background:rgba(234,179,8,0.12); border:1px solid rgba(234,179,8,0.4); border-radius:6px; padding:12px;">
            <div style="font-family:var(--font-mono); font-size:11px; color:var(--sulfur-yellow); font-weight:700;">🟡 LOW-COUNTER SHOULDER</div>
            <div style="font-family:var(--font-display); font-size:20px; font-weight:700; color:#fff; margin:4px 0;">
              01:00 – 04:00
            </div>
            <div style="font-size:11px; color:var(--text-secondary);">Zergs logging off. Ideal for Silenced Explo Ammo + FOB raids.</div>
          </div>

          <div style="background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.4); border-radius:6px; padding:12px;">
            <div style="font-family:var(--font-mono); font-size:11px; color:#f87171; font-weight:700;">🔴 PEAK COUNTER DANGER</div>
            <div style="font-family:var(--font-display); font-size:20px; font-weight:700; color:#fff; margin:4px 0;">
              ${String((maxHour + 22) % 24).padStart(2, '0')}:00 – ${String((maxHour + 2) % 24).padStart(2, '0')}:00
            </div>
            <div style="font-size:11px; color:var(--text-secondary);">Peak pop (~${maxVal} players). Use C4 + Turret FOB if raiding now!</div>
          </div>
        </div>
      `;
    }

    if (heatmapEl) {
      const peak = Math.max(...s.hourlyPop, 1);
      heatmapEl.innerHTML = s.hourlyPop
        .map((val, hr) => {
          const pct = Math.max(6, Math.round((val / peak) * 100));
          let barColor = '#22c55e';
          if (pct > 75) barColor = '#ef4444';
          else if (pct > 45) barColor = '#eab308';
          return `
            <div class="bm-bar-col" title="${String(hr).padStart(2, '0')}:00 — ${val} Players">
              <div class="bm-bar" style="height:${pct}%; background:${barColor};"></div>
              <span class="bm-hour-label">${String(hr).padStart(2, '0')}</span>
            </div>
          `;
        })
        .join('');
    }

    if (advisorEl) {
      let recommendation = '';
      if (popPct >= 70) {
        recommendation = `
          <strong style="color:#f87171;">HIGH POP RAID PROTOCOL (${popPct}% Server Full):</strong>
          Avoid slow Satchel or pure Explosive Ammo raids right now. Use <strong>C4 + Rocket Speed Combos</strong> (e.g. <em>1 Rocket + 8 Explo</em> per Sheet Door, <em>2 C4</em> per Stone Wall) to breach and seal TC in under 45 seconds, and place an Auto Turret Raid Base (FOB) before booming.
        `;
      } else if (popPct >= 35) {
        recommendation = `
          <strong style="color:var(--sulfur-yellow);">MODERATE POP RAID PROTOCOL (${popPct}% Server Full):</strong>
          Optimal time for <strong>Mixed Sulfur-Saving Combos</strong> (<em>2 Rockets + 10 Explo 5.56</em> for Garage Doors, <em>3 C4 + 30 Explo</em> for Metal Walls) with a teammate holding roof watch.
        `;
      } else {
        recommendation = `
          <strong style="color:#4ade80;">LOW POP / OFFLINE RAID WINDOW (${popPct}% Server Full):</strong>
          Prime window for <strong>Silenced Explosive 5.56 Ammo</strong>, <strong>0-Sulfur Molotovs</strong>, and <strong>Jackhammer Soft-Side Eco Raids</strong> to maximize Sulfur savings without drawing counters!
        `;
      }

      advisorEl.innerHTML = `
        <div style="background:var(--bg-card); border-left:4px solid var(--rust-orange); padding:12px 14px; border-radius:5px; font-size:13px;">
          💡 ${recommendation}
        </div>
      `;
    }

    if (watchEl) {
      const list = appState.battlemetrics?.watchlist || [];
      watchEl.innerHTML = list
        .map(
          (w, idx) => `
          <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:6px; padding:12px; display:flex; justify-content:space-between; align-items:center; gap:10px;">
            <div>
              <div style="font-family:var(--font-display); font-weight:700; font-size:15px; color:#fff;">
                🎯 ${w.name} <span style="font-family:var(--font-mono); color:var(--sulfur-yellow);">[${w.grid}]</span>
              </div>
              <div style="font-family:var(--font-mono); font-size:11px; color:#4ade80; margin:3px 0;">
                🕒 Best Raid Window (Offline): ${w.typicalOffline}
              </div>
              <div style="font-size:12px; color:var(--text-secondary);">${w.notes || ''}</div>
            </div>
            <button class="btn btn-sm remove-watch-btn" data-idx="${idx}">✕</button>
          </div>
        `
        )
        .join('');

      watchEl.querySelectorAll('.remove-watch-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-idx'), 10);
          appState.battlemetrics.watchlist.splice(idx, 1);
          syncStateToServer();
          renderBattleMetricsDashboard();
        });
      });
    }
  }

  function initBattleMetricsModule() {
    document.getElementById('bmSearchBtn')?.addEventListener('click', () => {
      const q = document.getElementById('bmSearchInput')?.value.trim();
      if (q) fetchBattleMetricsSearch(q);
    });

    document.getElementById('bmSearchInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = e.target.value.trim();
        if (q) fetchBattleMetricsSearch(q);
      }
    });

    document.getElementById('bmSimulatePresetBtn')?.addEventListener('click', () => {
      renderBattleMetricsDashboard();
    });

    document.getElementById('addWatchlistBtn')?.addEventListener('click', () => {
      const name = document.getElementById('watchNameInput')?.value.trim();
      const grid = document.getElementById('watchGridInput')?.value.trim().toUpperCase() || 'M13';
      const typicalOffline = document.getElementById('watchOfflineInput')?.value.trim() || '04:00 - 09:00';
      const notes = document.getElementById('watchNotesInput')?.value.trim() || '';
      if (!name) return;

      if (!appState.battlemetrics) appState.battlemetrics = { watchlist: [] };
      if (!Array.isArray(appState.battlemetrics.watchlist)) appState.battlemetrics.watchlist = [];

      appState.battlemetrics.watchlist.unshift({
        id: 'w-' + Date.now(),
        name,
        grid,
        typicalOffline,
        notes
      });

      document.getElementById('watchNameInput').value = '';
      document.getElementById('watchNotesInput').value = '';
      syncStateToServer();
      renderBattleMetricsDashboard();
    });

    renderBattleMetricsDashboard();
  }

  // =========================================================================
  // MODULE 6: RECYCLER (60% vs 40%), DIESEL EXCAVATOR & BASE DECAY LAB
  // =========================================================================
  const recyclerCounts = {
    tech_trash: 4,
    rifle_body: 2,
    smg_body: 2,
    semi_body: 5,
    gears: 8,
    spring: 6,
    pipe: 10,
    sheet_metal: 6,
    road_signs: 8,
    sewing_kit: 10
  };

  function renderRecyclerCalculator() {
    const grid = document.getElementById('recyclerComponentsGrid');
    const summary = document.getElementById('recyclerTotalsComparison');
    if (!grid || !summary) return;

    let radScrap = 0, radHqm = 0, radMetal = 0, radCloth = 0;
    let safeScrap = 0, safeHqm = 0, safeMetal = 0, safeCloth = 0;

    grid.innerHTML = (DATA.recyclerComponents || [])
      .map((c) => {
        const qty = recyclerCounts[c.id] || 0;
        radScrap += qty * c.rad.scrap;
        radHqm += qty * c.rad.hqm;
        radMetal += qty * c.rad.metal;
        radCloth += qty * c.rad.cloth;

        safeScrap += qty * c.safe.scrap;
        safeHqm += qty * c.safe.hqm;
        safeMetal += qty * c.safe.metal;
        safeCloth += qty * c.safe.cloth;

        return `
          <div class="target-card ${qty > 0 ? 'selected' : ''}" style="cursor:default;">
            <div class="target-card-top">
              <span class="target-name" style="font-size:13px;">${c.name}</span>
              <span style="font-family:var(--font-mono); font-weight:800; color:var(--sulfur-yellow); font-size:14px;">x${qty}</span>
            </div>
            <div style="font-family:var(--font-mono); font-size:10px; color:var(--text-secondary);">
              Rad: ${c.rad.scrap ? c.rad.scrap + ' Scrap ' : ''}${c.rad.hqm ? c.rad.hqm + ' HQM ' : ''}${c.rad.cloth ? c.rad.cloth + ' Cloth' : ''}
            </div>
            <div style="display:flex; gap:4px; margin-top:4px;">
              <button class="btn btn-sm rec-mod-btn" data-cid="${c.id}" data-delta="-1" style="flex:1;">-1</button>
              <button class="btn btn-sm btn-primary rec-mod-btn" data-cid="${c.id}" data-delta="1" style="flex:1;">+1</button>
              <button class="btn btn-sm rec-mod-btn" data-cid="${c.id}" data-delta="5" style="flex:1;">+5</button>
            </div>
          </div>
        `;
      })
      .join('');

    grid.querySelectorAll('.rec-mod-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cid = btn.getAttribute('data-cid');
        const delta = parseInt(btn.getAttribute('data-delta'), 10);
        recyclerCounts[cid] = Math.max(0, (recyclerCounts[cid] || 0) + delta);
        renderRecyclerCalculator();
      });
    });

    const bonusScrap = radScrap - safeScrap;
    const bonusHqm = radHqm - safeHqm;

    summary.innerHTML = `
      <div class="grid-2" style="gap:12px;">
        <div style="background:rgba(34,197,94,0.12); border:1px solid rgba(34,197,94,0.45); border-radius:6px; padding:12px;">
          <div style="font-family:var(--font-display); font-weight:700; color:#4ade80; margin-bottom:6px;">
            ☢️ MONUMENT RECYCLER (60% Yield • 120% Speed)
          </div>
          <div style="display:flex; justify-content:space-between; font-family:var(--font-mono); font-size:13px; color:#fff; flex-wrap:wrap; gap:8px;">
            <span>⚙️ <strong>${radScrap.toLocaleString()}</strong> Scrap</span>
            <span>💎 <strong>${radHqm.toLocaleString()}</strong> HQM</span>
            <span>🔩 <strong>${radMetal.toLocaleString()}</strong> Metal</span>
            <span>🌿 <strong>${radCloth.toLocaleString()}</strong> Cloth</span>
          </div>
          <div style="margin-top:6px; font-size:11px; color:#4ade80; font-family:var(--font-mono);">
            ⚡ Radtown Bonus: +${bonusScrap.toLocaleString()} Extra Scrap & +${bonusHqm} HQM vs Outpost!
          </div>
        </div>

        <div style="background:rgba(234,179,8,0.1); border:1px solid rgba(234,179,8,0.35); border-radius:6px; padding:12px;">
          <div style="font-family:var(--font-display); font-weight:700; color:var(--sulfur-yellow); margin-bottom:6px;">
            🛡️ SAFE ZONE RECYCLER (40% Yield • Outpost/Bandit)
          </div>
          <div style="display:flex; justify-content:space-between; font-family:var(--font-mono); font-size:13px; color:#fff; flex-wrap:wrap; gap:8px;">
            <span>⚙️ <strong>${safeScrap.toLocaleString()}</strong> Scrap</span>
            <span>💎 <strong>${safeHqm.toLocaleString()}</strong> HQM</span>
            <span>🔩 <strong>${safeMetal.toLocaleString()}</strong> Metal</span>
            <span>🌿 <strong>${safeCloth.toLocaleString()}</strong> Cloth</span>
          </div>
          <div style="margin-top:6px; font-size:11px; color:var(--text-secondary);">
            100% Safe from PvP, but loses ${bonusScrap.toLocaleString()} Scrap on this haul.
          </div>
        </div>
      </div>
    `;
  }

  function renderDieselCalculator() {
    const count = Math.max(1, parseInt(document.getElementById('dieselCountInput')?.value, 10) || 10);
    const out = document.getElementById('dieselYieldResult');
    if (!out) return;

    const runtimeMin = count * 2;
    const excSulfur = count * 2000;
    const excHqm = count * 100;
    const excMetal = count * 5000;
    const excStone = count * 10000;
    const airdrops = Math.floor(count / 5);
    const rocketsEq = (excSulfur / 1400).toFixed(1);
    const c4Eq = (excSulfur / 2200).toFixed(1);
    const pumpjackLgf = count * 240;

    out.innerHTML = `
      <div class="resource-grid" style="margin-top:0;">
        <div class="resource-box highlight-sulfur">
          <div class="resource-val" style="color:var(--sulfur-yellow);">${excSulfur.toLocaleString()}</div>
          <div class="resource-label">Excavator Sulfur</div>
        </div>
        <div class="resource-box">
          <div class="resource-val" style="color:#f87171;">${rocketsEq} / ${c4Eq}</div>
          <div class="resource-label">Rockets / C4 Craftable</div>
        </div>
        <div class="resource-box">
          <div class="resource-val" style="color:#60a5fa;">${excHqm.toLocaleString()} HQM</div>
          <div class="resource-label">Or Excavator HQM</div>
        </div>
        <div class="resource-box">
          <div class="resource-val" style="color:#4ade80;">${pumpjackLgf.toLocaleString()} LGF</div>
          <div class="resource-label">Or Pumpjack Fuel</div>
        </div>
      </div>
      <div style="margin-top:10px; font-size:12px; color:var(--text-secondary); font-family:var(--font-mono);">
        ⏱️ Runtime: <strong>${runtimeMin} mins</strong> • 📦 Supply Drops Triggered: <strong>${airdrops}x</strong> • (Or ${excMetal.toLocaleString()} Metal Frags / ${excStone.toLocaleString()} Stone)
      </div>
    `;
  }

  function renderDecayCalculator() {
    const tierId = document.getElementById('decayTierSelect')?.value || 'metal';
    const curHp = Math.max(1, parseInt(document.getElementById('decayCurrentHpInput')?.value, 10) || 180);
    const grid = document.getElementById('decayGridInput')?.value.trim().toUpperCase() || 'Q14';
    const out = document.getElementById('decayResultBox');
    if (!out) return;

    const rate = (DATA.decayRates || []).find((r) => r.id === tierId) || DATA.decayRates[0];
    const clampedHp = Math.min(rate.maxHp, curHp);
    const hpPerSecond = rate.maxHp / (rate.fullDecayHours * 3600);
    const secondsRemaining = Math.round(clampedHp / hpPerSecond);

    out.innerHTML = `
      <div style="background:var(--bg-card); border:1px solid var(--rust-orange); border-radius:6px; padding:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div>
          <div style="font-family:var(--font-mono); font-size:11px; color:var(--text-secondary);">
            ${rate.name} (${clampedHp} / ${rate.maxHp} HP) at [${grid}]
          </div>
          <div style="font-family:var(--font-display); font-size:20px; font-weight:700; color:#fff;">
            💥 Crumbles in <span style="color:var(--sulfur-yellow);">${formatDuration(secondsRemaining)}</span>
          </div>
        </div>
        <button id="startDecayTimerBtn" class="btn btn-primary btn-sm">
          ⏱️ Start Squad Decay Timer
        </button>
      </div>
    `;

    out.querySelector('#startDecayTimerBtn')?.addEventListener('click', () => {
      startSquadTimer(`🏚️ Decaying ${rate.name} [${grid}]`, secondsRemaining, '#eab308');
      if (appState.discordWebhookUrl) {
        sendDiscordAlert(
          `🏚️ Decaying Base Tracked at [${grid}]`,
          `**${rate.name}** (${clampedHp}/${rate.maxHp} HP) will crumble in **${formatDuration(secondsRemaining)}**!`,
          0xeab308
        );
      }
    });
  }

  function initRecyclerDieselDecayModule() {
    document.getElementById('clearRecyclerBtn')?.addEventListener('click', () => {
      Object.keys(recyclerCounts).forEach((k) => (recyclerCounts[k] = 0));
      renderRecyclerCalculator();
    });

    document.getElementById('dieselCountInput')?.addEventListener('input', renderDieselCalculator);
    document.getElementById('startExcavatorTimerBtn')?.addEventListener('click', () => {
      const count = Math.max(1, parseInt(document.getElementById('dieselCountInput')?.value, 10) || 10);
      startSquadTimer(`🛢️ Giant Excavator (${count}x Diesel)`, count * 120, '#eab308');
    });

    const decaySel = document.getElementById('decayTierSelect');
    if (decaySel && DATA.decayRates) {
      decaySel.innerHTML = DATA.decayRates
        .map((r) => `<option value="${r.id}">${r.name} (Max ${r.maxHp} HP • ${r.fullDecayHours}h Decay)</option>`)
        .join('');
      decaySel.value = 'metal';
    }
    decaySel?.addEventListener('change', renderDecayCalculator);
    document.getElementById('decayCurrentHpInput')?.addEventListener('input', renderDecayCalculator);
    document.getElementById('decayGridInput')?.addEventListener('input', renderDecayCalculator);

    renderRecyclerCalculator();
    renderDieselCalculator();
    renderDecayCalculator();
  }

  // =========================================================================
  // MASTER RENDER & INITIALIZATION
  // =========================================================================
  function renderAll() {
    const badge = document.getElementById('squadNameBadge');
    if (badge) badge.textContent = appState.squadName || 'RUST SQUAD ALPHA';

    renderRaidTargets();
    renderSelectedTargetInspector();
    renderRaidPlanner();
    renderMonumentAtlas();
    renderBuildSpotsList();
    renderSquadMarkersList();
    renderRustPlusSidebar();
    drawTacticalMap();
    renderTimersTick();
    renderSavedClonesAndTeas();
    solveBestCrossbreed();
    renderRecyclerCalculator();
    renderDieselCalculator();
    renderDecayCalculator();
    renderBattleMetricsDashboard();
  }

  window.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initRaidModule();
    initMapModule();
    initTimerModule();
    initGeneticsModule();
    initRecyclerDieselDecayModule();
    initBattleMetricsModule();
    renderAll();
    initSquadSSE();
  });
})();
