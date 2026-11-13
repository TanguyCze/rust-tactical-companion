/**
 * RUST TACTICAL COMPANION — CORE FRONTEND APPLICATION
 * Handles Squad SSE Sync, Raid & Sulfur Combo Optimizer, Monument Keycard/Fuse Guide,
 * Live Audio Timers, 6-Gene Crossbreeding Solver,
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
      document.getElementById('settingBmToken').value = getBmToken();
      const whEl = document.getElementById('settingDiscordWebhook');
      if (whEl) whEl.value = appState.discordWebhookUrl || '';
      modal.classList.add('open');
    });

    document.getElementById('closeSettingsModalBtn').addEventListener('click', () => {
      modal.classList.remove('open');
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
      localStorage.setItem(PIN_STORAGE_KEY, document.getElementById('settingSquadPin').value);
      localStorage.setItem(BM_TOKEN_KEY, document.getElementById('settingBmToken').value.trim());
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
  // MODULE 2: MONUMENT GUIDE (KEYCARDS, FUSES, CRATES & RESPAWN TIMERS)
  // =========================================================================
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

      const fuseBadge =
        m.fusesNeeded > 0
          ? `<span class="keycard-tag keycard-Fuse">🔌 ${m.fusesNeeded}x Electric Fuse</span>`
          : `<span class="keycard-tag keycard-Green">✅ No Fuse Needed (0 Fuse)</span>`;

      const foundBadges =
        m.cardsFound.length > 0
          ? m.cardsFound.map((c) => `<span class="keycard-tag keycard-${c}">Gives ${c} Card</span>`).join(' ')
          : '<span class="target-tier-tag">Endgame Elite Loot</span>';

      const utilitiesHtml =
        Array.isArray(m.utilities) && m.utilities.length > 0
          ? `<div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px;">
              ${m.utilities
                .map(
                  (u) =>
                    `<span style="font-size:10.5px; font-family:var(--font-mono); background:rgba(59,130,246,0.14); border:1px solid rgba(96,165,250,0.35); color:#93c5fd; padding:2px 7px; border-radius:4px;">⚙️ ${u}</span>`
                )
                .join('')}
            </div>`
          : '';

      detailEl.innerHTML = `
        <div style="background:linear-gradient(155deg, rgba(205,65,43,0.14), var(--bg-card)); border:1px solid var(--rust-orange); border-radius:8px; padding:14px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; flex-wrap:wrap;">
            <div>
              <div style="font-family:var(--font-display); font-size:18px; font-weight:700; color:#fff;">
                🏛️ ${m.name} <span style="font-family:var(--font-mono); font-size:12px; color:var(--sulfur-yellow);">[${m.defaultPos.grid}]</span>
              </div>
              <div style="font-size:12px; color:var(--text-secondary); margin-top:2px;">
                Tier ${m.tier} Monument • Radiation: <strong style="color:#fff;">${m.radRequired}</strong>
                ${m.rusthelpUrl ? ` • <a href="${m.rusthelpUrl}" target="_blank" rel="noopener" style="color:#60a5fa; text-decoration:none; font-weight:600;">📖 RustHelp Wiki ↗</a>` : ''}
              </div>
            </div>
            <button class="btn btn-primary btn-sm" id="startMonumentTimerBtn" data-mid="${m.id}">
              ⏱️ Completed! Start ${m.respawnMin}m Timer
            </button>
          </div>

          <div style="display:flex; gap:8px; flex-wrap:wrap; margin:10px 0;">
            <div><span style="font-size:11px; color:var(--text-secondary);">NEED:</span> ${neededBadges}</div>
            <div>${fuseBadge}</div>
            <div><span style="font-size:11px; color:var(--text-secondary);">GET:</span> ${foundBadges}</div>
          </div>

          ${utilitiesHtml}

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
        const fusePill =
          item.fusesNeeded > 0
            ? `<span class="keycard-tag keycard-Fuse">🔌 ${item.fusesNeeded} Fuse</span>`
            : `<span class="keycard-tag keycard-Green">✅ 0 Fuse</span>`;
        return `
          <div class="monument-item ${isAct ? 'active' : ''}" data-mid="${item.id}">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div style="font-family:var(--font-display); font-weight:700; font-size:14px; color:#fff;">
                ${item.name} <span style="font-family:var(--font-mono); font-size:11px; color:var(--text-secondary);">[${item.defaultPos.grid}]</span>
              </div>
              ${fusePill}
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
      });
    });
  }

  function initMonumentsModule() {
    document.querySelectorAll('#monumentFilterBar .filter-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#monumentFilterBar .filter-pill').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMonumentFilter = btn.getAttribute('data-mfilter');
        renderMonumentAtlas();
      });
    });
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
        seed: details.rust_world_seed || '-',
        size: details.rust_world_size || '-',
        lastWipe: details.rust_last_wipe ? new Date(details.rust_last_wipe).toLocaleString() : 'Active Wipe',
        hourlyPop: hourly
      };

      appState.battlemetrics.serverId = srv.id;
      appState.battlemetrics.serverName = currentServerTelemetry.name;

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
  // MODULE 7: SMART BASE FINDER (RUSTMAPS URL ANALYZER)
  // =========================================================================
  let bfMapData = null;
  let bfLoadedImage = null;
  let bfLandMask = null;
  let bfTopSpots = [];
  let bfSelectedIdx = 0;
  let bfActiveHeatmap = 'none';
  let bfHeatmapImages = {};
  let bfHeatmapGrids = {};
  let bfFarmingSpots = [];
  let bfSelectedFarmIdx = -1;

  function bfColLabel(idx) {
    let s = '';
    let n = idx + 1;
    while (n > 0) {
      n--;
      s = String.fromCharCode(65 + (n % 26)) + s;
      n = Math.floor(n / 26);
    }
    return s;
  }

  function bfWorldToGrid(wx, wy, mapSize) {
    const count = Math.max(1, Math.ceil(mapSize / 150));
    const cellSize = mapSize / count;
    const col = Math.min(count - 1, Math.max(0, Math.floor((wx + mapSize / 2) / cellSize)));
    const row = Math.min(count - 1, Math.max(0, Math.floor((mapSize / 2 - wy) / cellSize)));
    return `${bfColLabel(col)}${row}`;
  }

  function bfMatchesTarget(typeStr, targetKey) {
    const t = String(typeStr || '').toLowerCase();
    if (targetKey === 'powerplant') return t.includes('powerplant') || t.includes('power plant');
    if (targetKey === 'water_treatment') return t.includes('water treatment');
    if (targetKey === 'train_yard') return t.includes('train yard') || t.includes('trainyard');
    if (targetKey === 'airfield') return t.includes('airfield');
    if (targetKey === 'launch_site') return t.includes('launch site');
    if (targetKey === 'missile_silo') return t.includes('missile silo');
    if (targetKey === 'military_tunnels') return t.includes('military tunnel');
    if (targetKey === 'sewer_branch') return t.includes('sewer branch');
    return false;
  }

  function bfIsHighTraffic(typeStr) {
    const t = String(typeStr || '').toLowerCase();
    return (
      t.includes('outpost') ||
      t.includes('bandit') ||
      t.includes('launch site') ||
      t.includes('missile silo') ||
      t.includes('military tunnel') ||
      t.includes('excavator') ||
      t.includes('airfield') ||
      t.includes('train yard') ||
      t.includes('arctic research')
    );
  }

  function bfIsBoatHub(typeStr) {
    const t = String(typeStr || '').toLowerCase();
    return t.includes('fishing village') || t.includes('harbor') || t.includes('ferry terminal');
  }

  function bfIsStealthCover(typeStr) {
    const t = String(typeStr || '').toLowerCase();
    return t.includes('god rock') || t.includes('anvil rock') || t.includes('3 wall rock') || t.includes('cave');
  }

  function bfIsNoBuildSource(typeStr) {
    const t = String(typeStr || '').toLowerCase();
    if (bfIsStealthCover(t) || t.includes('iceberg') || t.includes('powerline')) return 0;
    if (t.includes('launch site')) return 240;
    if (
      t.includes('powerplant') ||
      t.includes('airfield') ||
      t.includes('water treatment') ||
      t.includes('train yard') ||
      t.includes('outpost') ||
      t.includes('bandit') ||
      t.includes('missile silo') ||
      t.includes('military') ||
      t.includes('excavator') ||
      t.includes('harbor') ||
      t.includes('ferry') ||
      t.includes('fishing village') ||
      t.includes('sphere tank') ||
      t.includes('satellite') ||
      t.includes('sewer') ||
      t.includes('junkyard') ||
      t.includes('radtown')
    ) {
      return 175;
    }
    if (t.includes('substation') || t.includes('water well') || t.includes('warehouse') || t.includes('lighthouse') || t.includes('supermarket') || t.includes('gas station')) {
      return 95;
    }
    return 0;
  }

  function bfBuildLandMask(img, mapSize) {
    const N = 160;
    const off = document.createElement('canvas');
    off.width = N;
    off.height = N;
    const ctx = off.getContext('2d');
    ctx.drawImage(img, 0, 0, N, N);
    const pixels = ctx.getImageData(0, 0, N, N).data;
    const isWater = new Uint8Array(N * N);

    for (let i = 0; i < N * N; i++) {
      const r = pixels[i * 4];
      const g = pixels[i * 4 + 1];
      const b = pixels[i * 4 + 2];
      // RustMaps ocean is deep teal/blue where Blue clearly exceeds Red
      if (b > r + 14 && r < 95 && b > 70) {
        isWater[i] = 1;
      }
    }

    const oceanPts = [];
    for (let gy = 0; gy < N; gy++) {
      for (let gx = 0; gx < N; gx++) {
        if (!isWater[gy * N + gx]) continue;
        // Edge of ocean (adjacent to land) speeds up distance checks dramatically
        const hasLandNeighbor =
          (gx > 0 && !isWater[gy * N + (gx - 1)]) ||
          (gx < N - 1 && !isWater[gy * N + (gx + 1)]) ||
          (gy > 0 && !isWater[(gy - 1) * N + gx]) ||
          (gy < N - 1 && !isWater[(gy + 1) * N + gx]);
        if (hasLandNeighbor) {
          const wx = ((gx + 0.5) / N - 0.5) * mapSize;
          const wy = (0.5 - (gy + 0.5) / N) * mapSize;
          oceanPts.push({ wx, wy });
        }
      }
    }
    return { N, isWater, oceanPts };
  }

  function bfBuildDensityGrid(img) {
    const N = 120;
    const off = document.createElement('canvas');
    off.width = N;
    off.height = N;
    const ctx = off.getContext('2d');
    ctx.drawImage(img, 0, 0, N, N);
    const data = ctx.getImageData(0, 0, N, N).data;
    const raw = new Float32Array(N * N);
    for (let i = 0; i < N * N; i++) {
      const a = data[i * 4 + 3];
      const lum = Math.max(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
      raw[i] = a > 12 ? (a / 255) * (0.4 + 0.6 * (lum / 255)) : 0;
    }
    // Smooth neighborhood density (radius 4 cells ~ 120-150m)
    const smooth = new Float32Array(N * N);
    let maxV = 0.001;
    const R = 4;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        let sum = 0;
        let cnt = 0;
        for (let dy = -R; dy <= R; dy++) {
          const yy = y + dy;
          if (yy < 0 || yy >= N) continue;
          for (let dx = -R; dx <= R; dx++) {
            const xx = x + dx;
            if (xx < 0 || xx >= N) continue;
            sum += raw[yy * N + xx];
            cnt++;
          }
        }
        const v = cnt ? sum / cnt : 0;
        smooth[y * N + x] = v;
        if (v > maxV) maxV = v;
      }
    }
    for (let i = 0; i < N * N; i++) smooth[i] = Math.min(1, smooth[i] / maxV);
    return { N, grid: smooth };
  }

  function bfSampleDensity(gridObj, nx, ny) {
    if (!gridObj) return 0;
    const gx = Math.min(gridObj.N - 1, Math.max(0, Math.floor(nx * gridObj.N)));
    const gy = Math.min(gridObj.N - 1, Math.max(0, Math.floor(ny * gridObj.N)));
    return gridObj.grid[gy * gridObj.N + gx] || 0;
  }

  function computeFarmingSpots(mask, selectedSpot) {
    if (!bfMapData || !bfMapData.size) return [];
    const mapSize = bfMapData.size;
    const mons = bfMapData.monuments || [];
    const results = [];
    const baseSpot = selectedSpot || bfTopSpots[bfSelectedIdx] || bfTopSpots[0] || null;
    const distFromBase = (wx, wy) => (baseSpot ? Math.round(Math.hypot(wx - baseSpot.wx, wy - baseSpot.wy)) : null);
    const maxQuarryDist = Math.max(1000, Math.round(mapSize * 0.30));
    const maxFarmDist = Math.max(750, Math.round(mapSize * 0.24));

    // 1. Mining Quarries nearby the selected spot
    const nearbyQuarries = [];
    mons.forEach((m) => {
      const t = m.type.toLowerCase();
      if (t.includes('quarry')) {
        const d = distFromBase(m.x, m.y);
        if (d !== null && d > maxQuarryDist) return;
        nearbyQuarries.push({
          kind: 'quarry',
          icon: '🏭',
          title: m.type,
          detail: t.includes('sulfur') ? 'Passive Sulfur Ore + Stone (needs Diesel)' : t.includes('hqm') ? 'Passive HQM + Metal Ore (needs Diesel)' : 'Passive Stone + Metal (needs Diesel)',
          wx: m.x,
          wy: m.y,
          grid: bfWorldToGrid(m.x, m.y, mapSize),
          distBase: d
        });
      }
    });
    nearbyQuarries.sort((a, b) => (a.distBase ?? 99999) - (b.distBase ?? 99999));
    results.push(...nearbyQuarries);

    // 2. Nearby hotspots from RustMaps heatmaps (Nodes, Hemp, Berries)
    const extractPeaks = (gridKey, kind, icon, title, detail) => {
      const g = bfHeatmapGrids[gridKey];
      if (!g) return;
      const pts = [];
      for (let y = 3; y < g.N - 3; y++) {
        for (let x = 3; x < g.N - 3; x++) {
          const val = g.grid[y * g.N + x];
          if (val < 0.30) continue;
          const nx = (x + 0.5) / g.N;
          const ny = (y + 0.5) / g.N;
          if (mask) {
            const mx = Math.min(mask.N - 1, Math.max(0, Math.floor(nx * mask.N)));
            const my = Math.min(mask.N - 1, Math.max(0, Math.floor(ny * mask.N)));
            if (mask.isWater[my * mask.N + mx]) continue;
          }
          const wx = (nx - 0.5) * mapSize;
          const wy = (0.5 - ny) * mapSize;
          const dist = distFromBase(wx, wy);
          if (baseSpot && dist > maxFarmDist) continue;
          const score = baseSpot ? val * (1 - 0.35 * (dist / maxFarmDist)) : val;
          pts.push({ wx, wy, val, dist, score });
        }
      }
      pts.sort((a, b) => b.score - a.score);
      const chosen = [];
      const minSep = Math.max(220, mapSize * 0.07);
      for (const p of pts) {
        if (chosen.every((c) => Math.hypot(c.wx - p.wx, c.wy - p.wy) >= minSep)) {
          chosen.push(p);
          results.push({
            kind,
            icon,
            title: `${title} (${Math.round(p.val * 100)}% density)`,
            detail,
            wx: p.wx,
            wy: p.wy,
            grid: bfWorldToGrid(p.wx, p.wy, mapSize),
            distBase: p.dist
          });
          if (chosen.length >= 2) break;
        }
      }
    };

    extractPeaks('Nodes', 'ore', '⛏️', 'Rich Ore Ridge', 'High Sulfur / Metal / Stone node spawn cluster');
    extractPeaks('Hemp', 'hemp', '🌿', 'Hemp / Cloth Field', 'Dense wild Hemp spawns (fast early cloth & bags)');
    extractPeaks('Berries', 'berry', '🫐', 'Berry Tea Valley', 'Dense Berry spawns for Pure Ore & Scrap Teas');

    return results;
  }

  function computeRecommendedBuildSpots() {
    if (!bfMapData || !bfMapData.size) return [];
    const mapSize = bfMapData.size;
    const half = mapSize / 2;
    const mons = bfMapData.monuments || [];

    const targetKey = document.getElementById('bfTargetMonumentSelect')?.value || 'powerplant';
    const wantDeepSea = Boolean(document.getElementById('bfDeepSeaCb')?.checked);
    const wantLowTraffic = Boolean(document.getElementById('bfLowTrafficCb')?.checked);
    const wantStealthRock = Boolean(document.getElementById('bfStealthRockCb')?.checked);
    const wantFarmOre = Boolean(document.getElementById('bfFarmOreCb')?.checked);
    const oreGrid = bfHeatmapGrids.Nodes || null;
    const spawnGrid = bfHeatmapGrids.PlayerSpawns || null;

    const targetMons = mons.filter((m) => bfMatchesTarget(m.type, targetKey));
    const trafficMons = mons.filter((m) => bfIsHighTraffic(m.type) && !bfMatchesTarget(m.type, targetKey));
    const boatHubs = mons.filter((m) => bfIsBoatHub(m.type));
    const stealthCovers = mons.filter((m) => bfIsStealthCover(m.type));
    const noBuildList = mons
      .map((m) => ({ ...m, blockR: bfIsNoBuildSource(m.type) }))
      .filter((m) => m.blockR > 0);

    const mask = bfLoadedImage ? bfBuildLandMask(bfLoadedImage, mapSize) : null;
    const STEP_G = 72;
    const candidates = [];

    for (let gy = 2; gy < STEP_G - 2; gy++) {
      for (let gx = 2; gx < STEP_G - 2; gx++) {
        const nx = (gx + 0.5) / STEP_G;
        const ny = (gy + 0.5) / STEP_G;
        const wx = (nx - 0.5) * mapSize;
        const wy = (0.5 - ny) * mapSize;

        // 1. Land & coast check via image mask (or fallback radial check)
        let coastDist = Math.max(0, half * 0.85 - Math.hypot(wx, wy));
        if (mask) {
          const mx = Math.min(mask.N - 1, Math.max(0, Math.floor(nx * mask.N)));
          const my = Math.min(mask.N - 1, Math.max(0, Math.floor(ny * mask.N)));
          if (mask.isWater[my * mask.N + mx]) continue;
          // Require surrounding pixels to also be land so we don't pick tiny ocean rocks
          let landNeighbors = 0;
          for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const nmx = Math.min(mask.N - 1, Math.max(0, mx + dx));
            const nmy = Math.min(mask.N - 1, Math.max(0, my + dy));
            if (!mask.isWater[nmy * mask.N + nmx]) landNeighbors++;
          }
          if (landNeighbors < 3) continue;

          if (mask.oceanPts.length > 0) {
            let minCoast = Infinity;
            for (const op of mask.oceanPts) {
              const d = Math.hypot(wx - op.wx, wy - op.wy);
              if (d < minCoast) minCoast = d;
            }
            coastDist = minCoast;
          }
        } else {
          if (Math.hypot(wx, wy) > half * 0.86) continue;
        }

        // 2. Skip building-blocked monument zones
        let blocked = false;
        for (const nb of noBuildList) {
          if (Math.hypot(wx - nb.x, wy - nb.y) < nb.blockR) {
            blocked = true;
            break;
          }
        }
        if (blocked) continue;

        // 3. Target Monument Score (Power Plant sweet spot: 240m - 580m)
        let targetDist = Infinity;
        let nearestTarget = null;
        for (const tm of targetMons) {
          const d = Math.hypot(wx - tm.x, wy - tm.y);
          if (d < targetDist) {
            targetDist = d;
            nearestTarget = tm;
          }
        }
        let targetScore = 0;
        if (nearestTarget) {
          if (targetDist >= 220 && targetDist <= 480) targetScore = 100;
          else if (targetDist < 220) targetScore = 60;
          else targetScore = Math.max(0, 100 - ((targetDist - 480) / (mapSize * 0.35)) * 100);
        } else {
          targetScore = 50; // Map has no instance of selected monument
        }

        // 4. Deep Sea / Coast + Boat Access Score
        let nearestBoat = null;
        let boatDist = Infinity;
        for (const bh of boatHubs) {
          const d = Math.hypot(wx - bh.x, wy - bh.y);
          if (d < boatDist) {
            boatDist = d;
            nearestBoat = bh;
          }
        }
        let deepSeaScore = 50;
        if (wantDeepSea) {
          // Best coast distance is 45m..260m (right near water to launch a boat/sub into Deep Sea)
          const coastPts =
            coastDist <= 220
              ? 100
              : coastDist <= 420
                ? 80 - ((coastDist - 220) / 200) * 25
                : Math.max(0, 55 - ((coastDist - 420) / 600) * 55);
          const boatPts = nearestBoat
            ? boatDist <= 750
              ? 100
              : Math.max(15, 100 - ((boatDist - 750) / 1200) * 85)
            : 50;
          deepSeaScore = coastPts * 0.68 + boatPts * 0.32;
        }

        // 5. Low Traffic / Anti-Day-1-Raid Score
        let minTrafficDist = Infinity;
        let nearestTraffic = null;
        let trafficPenalty = 0;
        for (const hm of trafficMons) {
          const d = Math.hypot(wx - hm.x, wy - hm.y);
          if (d < minTrafficDist) {
            minTrafficDist = d;
            nearestTraffic = hm;
          }
          const tLower = hm.type.toLowerCase();
          const dangerR = tLower.includes('outpost') || tLower.includes('launch') || tLower.includes('silo') ? 1050 : 800;
          if (d < dangerR) {
            trafficPenalty += ((dangerR - d) / dangerR) * 42;
          }
        }
        const centerDist = Math.hypot(wx, wy);
        if (centerDist < half * 0.36) {
          trafficPenalty += 22 * (1 - centerDist / (half * 0.36));
        }
        if (spawnGrid) {
          trafficPenalty += bfSampleDensity(spawnGrid, nx, ny) * 18;
        }
        const lowTrafficScore = Math.max(0, Math.min(100, 100 - trafficPenalty));

        // 5B. Real Ore Node Density Score (from RustMaps Nodes heatmap)
        const oreDensity = oreGrid ? bfSampleDensity(oreGrid, nx, ny) : 0.5;
        const oreScore = Math.round(oreDensity * 100);

        // 6. Stealth Cover (Cave / God Rock) Bonus
        let nearestCover = null;
        let coverDist = Infinity;
        for (const sc of stealthCovers) {
          const d = Math.hypot(wx - sc.x, wy - sc.y);
          if (d < coverDist) {
            coverDist = d;
            nearestCover = sc;
          }
        }
        const coverBonus = wantStealthRock && nearestCover && coverDist <= 280 ? (1 - coverDist / 280) * 14 : 0;

        // Weighted final score
        const wTarget = nearestTarget ? 0.34 : 0;
        const wDeep = wantDeepSea ? 0.28 : 0.06;
        const wTraffic = wantLowTraffic ? 0.26 : 0.10;
        const wOre = wantFarmOre && oreGrid ? 0.12 : 0;
        const wSum = wTarget + wDeep + wTraffic + wOre || 1;
        const total = Math.min(
          100,
          Math.round((targetScore * wTarget + deepSeaScore * wDeep + lowTrafficScore * wTraffic + oreScore * wOre) / wSum + coverBonus)
        );

        candidates.push({
          wx,
          wy,
          nx,
          ny,
          grid: bfWorldToGrid(wx, wy, mapSize),
          score: total,
          targetScore: Math.round(targetScore),
          deepSeaScore: Math.round(deepSeaScore),
          lowTrafficScore: Math.round(lowTrafficScore),
          oreScore,
          targetDist: Math.round(targetDist),
          targetName: nearestTarget?.type || targetKey,
          coastDist: Math.round(coastDist),
          boatDist: Math.round(boatDist),
          boatName: nearestBoat?.type || 'Coast',
          minTrafficDist: Math.round(minTrafficDist),
          nearestTrafficName: nearestTraffic?.type || 'None',
          coverDist: Math.round(coverDist),
          coverName: nearestCover && coverDist <= 320 ? nearestCover.type : ''
        });
      }
    }

    candidates.sort((a, b) => b.score - a.score);

    // Pick Top 5 spatially distinct spots (at least 300m apart)
    const picked = [];
    const minSep = Math.max(260, mapSize * 0.09);
    for (const c of candidates) {
      if (picked.every((p) => Math.hypot(p.wx - c.wx, p.wy - c.wy) >= minSep)) {
        picked.push(c);
        if (picked.length >= 5) break;
      }
    }
    return picked;
  }

  function renderBaseFinderMap() {
    const canvas = document.getElementById('bfMapCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0b3a4a';
    ctx.fillRect(0, 0, W, H);

    if (!bfMapData) {
      ctx.fillStyle = '#64748b';
      ctx.font = '600 15px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Paste a RustMaps URL above to visualize the map & best build grids', W / 2, H / 2);
      return;
    }

    if (bfLoadedImage) {
      ctx.drawImage(bfLoadedImage, 0, 0, W, H);
    }

    if (bfActiveHeatmap !== 'none' && bfHeatmapImages[bfActiveHeatmap]) {
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.drawImage(bfHeatmapImages[bfActiveHeatmap], 0, 0, W, H);
      ctx.restore();
    }

    const mapSize = bfMapData.size || 4000;
    const toPx = (wx, wy) => ({
      px: ((wx + mapSize / 2) / mapSize) * W,
      py: (1 - (wy + mapSize / 2) / mapSize) * H
    });

    // 1. Rust-accurate grid overlay
    const count = Math.max(1, Math.ceil(mapSize / 150));
    const cellPx = W / count;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1;
    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    for (let i = 0; i <= count; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellPx, 0);
      ctx.lineTo(i * cellPx, H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellPx);
      ctx.lineTo(W, i * cellPx);
      ctx.stroke();
      if (i < count) {
        ctx.fillText(bfColLabel(i), i * cellPx + 3, 11);
        ctx.fillText(String(i), 3, i * cellPx + 20);
      }
    }
    ctx.restore();

    const targetKey = document.getElementById('bfTargetMonumentSelect')?.value || 'powerplant';
    const showZones = Boolean(document.getElementById('bfShowHeatmapCb')?.checked);
    const mons = bfMapData.monuments || [];

    // 2. Traffic danger zones + target sweet-spot ring
    if (showZones) {
      mons.forEach((m) => {
        const { px, py } = toPx(m.x, m.y);
        if (bfMatchesTarget(m.type, targetKey)) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(px, py, (450 / mapSize) * W, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.stroke();
          ctx.restore();
        } else if (bfIsHighTraffic(m.type)) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(px, py, (650 / mapSize) * W, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.14)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.restore();
        }
      });
    }

    // 3. Key monument pins
    mons.forEach((m) => {
      const { px, py } = toPx(m.x, m.y);
      let color = '';
      let short = '';
      if (bfMatchesTarget(m.type, targetKey)) {
        color = '#38bdf8';
        short = `⚡ ${m.type}`;
      } else if (bfIsBoatHub(m.type)) {
        color = '#2dd4bf';
        short = m.type.replace(' A', '').replace(' B', '').replace(' C', '');
      } else if (bfIsHighTraffic(m.type)) {
        color = '#ef4444';
        short = m.type;
      } else if (bfIsStealthCover(m.type) && (m.type.includes('Cave') || m.type.includes('Large God'))) {
        color = '#c084fc';
        short = '';
      }
      if (!color) return;

      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, short ? 5.5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#090b0e';
      ctx.stroke();
      if (short) {
        ctx.font = '700 10px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0,0,0,0.88)';
        ctx.lineWidth = 3;
        ctx.strokeText(short, px, py - 9);
        ctx.fillStyle = '#fff';
        ctx.fillText(short, px, py - 9);
      }
      ctx.restore();
    });

    // 4. Top 5 Recommended Build Spots
    bfTopSpots.forEach((spot, idx) => {
      const { px, py } = toPx(spot.wx, spot.wy);
      const isSel = idx === bfSelectedIdx;
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, isSel ? 18 : 13, 0, Math.PI * 2);
      ctx.fillStyle = isSel ? 'rgba(34, 197, 94, 0.38)' : 'rgba(34, 197, 94, 0.22)';
      ctx.fill();
      ctx.lineWidth = isSel ? 2.8 : 1.8;
      ctx.strokeStyle = idx === 0 ? '#facc15' : '#4ade80';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(px, py, 9, 0, Math.PI * 2);
      ctx.fillStyle = idx === 0 ? '#eab308' : '#16a34a';
      ctx.fill();

      ctx.font = '800 10.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = idx === 0 ? '#090b0e' : '#ffffff';
      ctx.fillText(`#${idx + 1}`, px, py + 0.5);

      ctx.textBaseline = 'alphabetic';
      ctx.font = '700 10.5px "JetBrains Mono", monospace';
      ctx.strokeStyle = 'rgba(0,0,0,0.9)';
      ctx.lineWidth = 3;
      const lbl = `[${spot.grid}] ${spot.score}/100`;
      ctx.strokeText(lbl, px, py + 22);
      ctx.fillStyle = idx === 0 ? '#facc15' : '#4ade80';
      ctx.fillText(lbl, px, py + 22);
      ctx.restore();
    });

    // 5. Top Farming Hotspots (Ore Ridges, Hemp/Berry Fields, Mining Quarries)
    bfFarmingSpots.forEach((fm, fIdx) => {
      const { px, py } = toPx(fm.wx, fm.wy);
      const isSel = fIdx === bfSelectedFarmIdx;
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, isSel ? 13 : 8.5, 0, Math.PI * 2);
      ctx.fillStyle = isSel ? 'rgba(245, 158, 11, 0.45)' : 'rgba(245, 158, 11, 0.25)';
      ctx.fill();
      ctx.lineWidth = isSel ? 2.4 : 1.5;
      ctx.strokeStyle = '#fbbf24';
      ctx.stroke();

      ctx.font = '700 10px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,0.9)';
      ctx.lineWidth = 3;
      const tag = `${fm.icon} [${fm.grid}]`;
      ctx.strokeText(tag, px, py - 11);
      ctx.fillStyle = '#fde047';
      ctx.fillText(tag, px, py - 11);
      ctx.restore();
    });
  }

  function renderBaseFinderResults() {
    const listEl = document.getElementById('bfResultsList');
    if (!listEl) return;
    if (!bfTopSpots || bfTopSpots.length === 0) {
      listEl.innerHTML = `<div style="padding:20px; text-align:center; color:var(--text-muted);">No valid build spots found for these filters.</div>`;
      return;
    }

    listEl.innerHTML = bfTopSpots
      .map((s, idx) => {
        const isSel = idx === bfSelectedIdx;
        const riskLabel = s.lowTrafficScore >= 82 ? 'VERY LOW' : s.lowTrafficScore >= 62 ? 'LOW' : 'MEDIUM';
        const riskColor = s.lowTrafficScore >= 82 ? '#4ade80' : s.lowTrafficScore >= 62 ? '#facc15' : '#f87171';
        const rankBadge = idx === 0 ? '🥇 #1 BEST OVERALL' : `#${idx + 1} OPTION`;
        return `
          <div class="monument-item bf-spot-card ${isSel ? 'active' : ''}" data-bf-idx="${idx}">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
              <div style="font-family:var(--font-display); font-size:15px; font-weight:700; color:#fff;">
                ${rankBadge} — Grid <span style="color:var(--sulfur-yellow); font-family:var(--font-mono);">[${s.grid}]</span>
              </div>
              <span class="combo-badge" style="font-size:12px;">${s.score}/100</span>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap; margin:8px 0; font-family:var(--font-mono); font-size:11px;">
              <span style="color:#38bdf8;">⚡ ${s.targetName}: ${s.targetDist < 99999 ? s.targetDist + 'm' : 'N/A'}</span>
              <span style="color:#2dd4bf;">🌊 Coast: ${s.coastDist}m</span>
              <span style="color:#93c5fd;">⚓ ${s.boatName}: ${s.boatDist < 99999 ? s.boatDist + 'm' : 'N/A'}</span>
              <span style="color:#fbbf24;">⛏️ Ore: ${s.oreScore >= 65 ? 'HIGH' : s.oreScore >= 35 ? 'MED' : 'LOW'} (${s.oreScore}%)</span>
              <span style="color:${riskColor};">🛡️ Raid Risk: ${riskLabel}</span>
            </div>
            <div style="font-size:12px; color:var(--text-secondary);">
              Nearest hotspot: <strong style="color:#e2e8f0;">${s.nearestTrafficName}</strong> (${s.minTrafficDist < 99999 ? s.minTrafficDist + 'm away' : 'none'})
              ${s.coverName ? ` • <span style="color:#c084fc;">🪨 Cover nearby: ${s.coverName} (${s.coverDist}m)</span>` : ''}
            </div>
          </div>
        `;
      })
      .join('');

    listEl.querySelectorAll('.bf-spot-card').forEach((card) => {
      card.addEventListener('click', () => {
        bfSelectedIdx = parseInt(card.getAttribute('data-bf-idx'), 10) || 0;
        bfSelectedFarmIdx = -1;
        bfFarmingSpots = computeFarmingSpots(bfLandMask, bfTopSpots[bfSelectedIdx]);
        renderBaseFinderResults();
        renderBaseFinderFarming();
        renderBaseFinderMap();
      });
    });
  }

  function renderBaseFinderFarming() {
    const farmEl = document.getElementById('bfFarmingList');
    if (!farmEl) return;
    const selSpot = bfTopSpots[bfSelectedIdx] || null;
    const selLabel = selSpot ? `#${bfSelectedIdx + 1} [${selSpot.grid}]` : 'selected spot';

    if (!bfFarmingSpots || bfFarmingSpots.length === 0) {
      farmEl.innerHTML = `<div style="padding:14px; text-align:center; color:var(--text-muted); font-size:12px;">No quarries or resource hotspots detected near ${selLabel} (or heatmaps still loading).</div>`;
      return;
    }

    farmEl.innerHTML =
      `<div style="font-size:11px; color:var(--text-muted); padding:0 2px 6px 2px;">Showing farming spots nearby <strong style="color:#fff;">${selLabel}</strong></div>` +
      bfFarmingSpots
        .map((fm, idx) => {
          const isSel = idx === bfSelectedFarmIdx;
          return `
            <div class="monument-item bf-farm-card ${isSel ? 'active' : ''}" data-farm-idx="${idx}" style="padding:10px 12px;">
              <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                <div style="font-family:var(--font-display); font-weight:700; font-size:13.5px; color:#fff;">
                  ${fm.icon} ${fm.title}
                </div>
                <span class="keycard-tag keycard-Fuse">[${fm.grid}]${fm.distBase !== null ? ` • ${fm.distBase}m from ${selLabel}` : ''}</span>
              </div>
              <div style="font-size:11.5px; color:var(--text-secondary); margin-top:4px;">${fm.detail}</div>
            </div>
          `;
        })
        .join('');

    farmEl.querySelectorAll('.bf-farm-card').forEach((card) => {
      card.addEventListener('click', () => {
        bfSelectedFarmIdx = parseInt(card.getAttribute('data-farm-idx'), 10);
        renderBaseFinderFarming();
        renderBaseFinderMap();
      });
    });
  }

  function rerunBaseFinderScoring() {
    if (!bfMapData) return;
    bfLandMask = bfLoadedImage ? bfBuildLandMask(bfLoadedImage, bfMapData.size) : null;
    bfTopSpots = computeRecommendedBuildSpots();
    bfSelectedIdx = 0;
    bfSelectedFarmIdx = -1;
    bfFarmingSpots = computeFarmingSpots(bfLandMask, bfTopSpots[0]);
    renderBaseFinderResults();
    renderBaseFinderFarming();
    renderBaseFinderMap();
  }

  function initBaseFinderModule() {
    const analyzeBtn = document.getElementById('bfAnalyzeBtn');
    const urlInput = document.getElementById('bfMapUrlInput');
    const statusEl = document.getElementById('bfStatusBar');
    const metaEl = document.getElementById('bfMapMetaLabel');

    async function runAnalyze() {
      const url = urlInput?.value.trim();
      if (!url) {
        alert('Paste a RustMaps.com URL (e.g. https://rustmaps.com/map/4250_1337420) or BattleMetrics server URL first!');
        return;
      }
      if (!isServerConnected) {
        alert('Backend server required to fetch RustMaps data.');
        return;
      }

      const oldText = analyzeBtn.textContent;
      analyzeBtn.textContent = '⏳ Analyzing Map...';
      analyzeBtn.disabled = true;
      if (statusEl) statusEl.textContent = 'Fetching map & monuments from RustMaps...';

      try {
        const res = await fetch('/api/rustmaps/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || 'Failed to analyze map');
        }

        bfMapData = data;
        bfHeatmapImages = {};
        bfHeatmapGrids = {};
        if (metaEl) {
          metaEl.textContent = `Size: ${data.size} • Seed: ${data.seed} • ${data.monuments.length} map features detected`;
        }
        if (statusEl) {
          statusEl.textContent = `✓ Loaded ${data.size}_${data.seed} (${data.monuments.length} monuments). Scanning coast, ore nodes & low-traffic grids...`;
        }

        // Preload RustMaps resource heatmaps (Nodes, Hemp, Berries, Horses, PlayerSpawns) in parallel
        const hmKeys = ['Nodes', 'Hemp', 'Berries', 'Horses', 'PlayerSpawns'];
        const hmPromises = hmKeys.map((key) => {
          const hmUrl = data.heatMaps?.[key];
          if (!hmUrl) return Promise.resolve();
          return new Promise((resolve) => {
            const hImg = new Image();
            hImg.onload = () => {
              bfHeatmapImages[key] = hImg;
              if (key === 'Nodes' || key === 'Hemp' || key === 'Berries' || key === 'PlayerSpawns') {
                bfHeatmapGrids[key] = bfBuildDensityGrid(hImg);
              }
              resolve();
            };
            hImg.onerror = () => resolve();
            hImg.src = `/api/rustmaps/image?url=${encodeURIComponent(hmUrl)}`;
          });
        });

        const baseImgPromise = data.imageUrl
          ? new Promise((resolve) => {
              const img = new Image();
              img.onload = () => {
                bfLoadedImage = img;
                resolve();
              };
              img.onerror = () => {
                bfLoadedImage = null;
                resolve();
              };
              img.src = `/api/rustmaps/image?url=${encodeURIComponent(data.imageUrl)}`;
            })
          : Promise.resolve((bfLoadedImage = null));

        await Promise.all([baseImgPromise, ...hmPromises]);
        rerunBaseFinderScoring();
        if (statusEl) {
          statusEl.textContent = `✓ Analysis complete for ${data.size}_${data.seed}! Top spot: Grid ${bfTopSpots[0]?.grid || '-'} (${bfTopSpots[0]?.score || 0}/100)`;
        }
      } catch (err) {
        if (statusEl) statusEl.textContent = `⚠️ ${err.message}`;
        alert(err.message);
      } finally {
        analyzeBtn.textContent = oldText;
        analyzeBtn.disabled = false;
      }
    }

    analyzeBtn?.addEventListener('click', runAnalyze);
    urlInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') runAnalyze();
    });

    ['bfTargetMonumentSelect', 'bfDeepSeaCb', 'bfLowTrafficCb', 'bfStealthRockCb', 'bfFarmOreCb', 'bfShowHeatmapCb'].forEach((id) => {
      document.getElementById(id)?.addEventListener('change', rerunBaseFinderScoring);
    });

    document.querySelectorAll('#bfHeatmapPills .filter-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#bfHeatmapPills .filter-pill').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        bfActiveHeatmap = btn.getAttribute('data-hm') || 'none';
        renderBaseFinderMap();
      });
    });

    renderBaseFinderMap();
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
    initMonumentsModule();
    initTimerModule();
    initGeneticsModule();
    initRecyclerDieselDecayModule();
    initBattleMetricsModule();
    initBaseFinderModule();
    renderAll();
    initSquadSSE();
  });
})();
