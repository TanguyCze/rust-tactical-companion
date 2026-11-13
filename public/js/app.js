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

  const DEFAULT_RAID_STASH = {
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
  };

  let appState = {
    squadName: 'RUST SQUAD ALPHA',
    activeTimers: [],
    raidQueue: [
      { targetId: 'sheet_metal_door', qty: 2, mode: 'combo' },
      { targetId: 'garage_door', qty: 3, mode: 'combo' },
      { targetId: 'stone_wall', qty: 1, mode: 'combo' }
    ],
    raidStash: { ...DEFAULT_RAID_STASH },
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
  let selectedRaidWb = 'All';
  let raidTargetSearch = '';
  let selectedRaidTargetId = 'garage_door';
  let selectedMonumentFilter = 'all';
  let selectedMonumentId = 'launch_site';
  let selectedCloneCropFilter = 'Hemp';

  // Load local fallback first
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsedSaved = JSON.parse(saved);
      appState = { ...appState, ...parsedSaved, raidStash: { ...DEFAULT_RAID_STASH, ...(parsedSaved.raidStash || {}) } };
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
            appState = { ...appState, ...msg.state, raidStash: { ...DEFAULT_RAID_STASH, ...(appState.raidStash || {}), ...(msg.state.raidStash || {}) } };
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
  const MELEE_TOOL_IDS = new Set(['pickaxe', 'jackhammer', 'salvaged_sword']);
  const WB_RANK = { T1: 1, T2: 2, T3: 3 };

  function isRealRaidTool(toolId) {
    return Boolean(toolId) && !MELEE_TOOL_IDS.has(toolId);
  }

  function toolFitsWb(toolId, maxWb) {
    if (!maxWb || maxWb === 'All') return true;
    const tool = DATA.raidTools[toolId];
    if (!tool) return false;
    return (WB_RANK[tool.wb] || 3) <= (WB_RANK[maxWb] || 3);
  }

  function formatRaidTime(seconds) {
    const s = Math.max(1, Math.round(seconds || 0));
    if (s < 60) return `~${s}s`;
    const mins = Math.floor(s / 60);
    const rem = s % 60;
    return rem ? `~${mins}m ${rem}s` : `~${mins}m`;
  }

  function getFilteredMethods(target, maxWb) {
    return (target.methods || [])
      .map((m, idx) => ({ ...m, _origIdx: idx }))
      .filter((m) => isRealRaidTool(m.toolId) && toolFitsWb(m.toolId, maxWb))
      .sort((a, b) => (a.sulfur || 0) - (b.sulfur || 0) || (a.timeSec || 999) - (b.timeSec || 999));
  }

  function getFilteredCombos(target, maxWb) {
    return (target.combos || [])
      .map((c, idx) => ({ ...c, _origIdx: idx }))
      .filter((c) => (c.items || []).every((it) => isRealRaidTool(it.toolId) && toolFitsWb(it.toolId, maxWb)))
      .sort((a, b) => (a.sulfur || 0) - (b.sulfur || 0) || (a.timeSec || 999) - (b.timeSec || 999));
  }

  function getBestEntryForTarget(target, maxWb) {
    const combos = getFilteredCombos(target, maxWb);
    const methods = getFilteredMethods(target, maxWb);
    const candidates = [
      ...combos.map((c) => ({ sulfur: c.sulfur || 0, lgf: c.lgf || 0, isFire: (c.sulfur || 0) === 0, isCombo: true, saved: c.savedSulfur || 0 })),
      ...methods.map((m) => ({ sulfur: m.sulfur || 0, lgf: m.lgf || 0, isFire: (m.sulfur || 0) === 0, isCombo: false, saved: 0 }))
    ];
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => a.sulfur - b.sulfur || a.lgf - b.lgf);
    return candidates[0];
  }

  function renderRaidTargets() {
    const grid = document.getElementById('raidTargetGrid');
    if (!grid) return;

    const query = raidTargetSearch.trim().toLowerCase();
    const filtered = DATA.raidTargets.filter((t) => {
      const catOk = selectedRaidCategory === 'All' || t.category === selectedRaidCategory;
      if (!catOk) return false;
      if (!query) return true;
      return (
        t.name.toLowerCase().includes(query) ||
        t.tier.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
      );
    });

    if (filtered.length === 0) {
      grid.innerHTML =
        '<div class="text-muted text-sm" style="grid-column:1/-1; padding:12px;">No targets match your filter. Clear search or switch category.</div>';
      renderSelectedTargetInspector();
      return;
    }

    if (!filtered.some((t) => t.id === selectedRaidTargetId)) {
      selectedRaidTargetId = filtered[0].id;
    }

    grid.innerHTML = filtered
      .map((t) => {
        const best = getBestEntryForTarget(t, selectedRaidWb);
        const isSelected = t.id === selectedRaidTargetId;
        let bestText = 'Higher WB needed';
        let fireClass = '';
        if (best) {
          if (best.isFire) {
            bestText = `🔥 0 Sulfur (${best.lgf || 50} LGF Fire)`;
            fireClass = ' is-fire';
          } else {
            bestText = `⚡ Best: ${best.sulfur.toLocaleString()} Sulfur`;
          }
        }
        return `
          <div class="target-card ${isSelected ? 'selected' : ''}" data-target-id="${t.id}">
            <div class="target-card-top">
              <span class="target-tier-tag">${t.tier}</span>
              <span class="target-hp">${t.hp} HP</span>
            </div>
            <div class="target-name">${t.name}</div>
            <div class="target-best-sulfur${fireClass}">${bestText}</div>
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

    renderSelectedTargetInspector();
  }

  function renderSelectedTargetInspector() {
    const container = document.getElementById('selectedTargetInspector');
    if (!container) return;

    const target = DATA.raidTargets.find((t) => t.id === selectedRaidTargetId) || DATA.raidTargets[0];
    if (!target) return;

    const combos = getFilteredCombos(target, selectedRaidWb);
    const methods = getFilteredMethods(target, selectedRaidWb);
    const activeWbLabel = selectedRaidWb === 'All' ? 'All Tiers' : `Max ${selectedRaidWb}`;

    const combosHtml =
      combos.length > 0
        ? combos
            .map((c) => {
              const itemsText = (c.items || [])
                .map((it) => {
                  const tool = DATA.raidTools[it.toolId] || { shortName: it.toolId, name: it.toolId };
                  return `${it.qty}x ${tool.shortName || tool.name}`;
                })
                .join(' + ');
              const lgfNote = c.lgf ? `<span>LGF: <strong style="color:#fb923c">${c.lgf}</strong></span>` : '';
              return `
                <div class="combo-card">
                  <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
                    <span class="combo-badge">${c.badge}</span>
                    ${c.savedSulfur > 0 ? `<span class="combo-save-pill">Saves ${c.savedSulfur.toLocaleString()} Sulfur</span>` : ''}
                  </div>
                  <div class="combo-title">${c.label}</div>
                  <div class="text-xs" style="color:#cbd5e1; font-family:var(--font-mono);">${itemsText}</div>
                  <div class="combo-stats">
                    <span>Sulfur: <strong style="color:var(--sulfur-yellow)">${c.sulfur.toLocaleString()}</strong></span>
                    <span>Charcoal: <strong>${(c.charcoal || 0).toLocaleString()}</strong></span>
                    ${lgfNote}
                    <span>Time: <strong>${formatRaidTime(c.timeSec)}</strong></span>
                  </div>
                  <div class="text-xs text-muted">${c.notes || ''}</div>
                  <div style="margin-top:auto; padding-top:6px;">
                    <button class="btn btn-sm btn-primary add-target-combo-btn" data-target="${target.id}" data-combo-idx="${c._origIdx}">
                      + Add Combo to Raid Plan
                    </button>
                  </div>
                </div>
              `;
            })
            .join('')
        : `<div class="text-xs text-muted" style="padding:10px; background:var(--bg-card); border-radius:6px; border:1px solid var(--border-subtle);">No mixed combos available at ${activeWbLabel} for ${target.name} — switch Workbench filter to All/T3 or use pure methods below.</div>`;

    const lowestSulfur = methods.length > 0 ? methods[0].sulfur : Infinity;
    const methodsRows =
      methods.length > 0
        ? methods
            .map((m) => {
              const tool = DATA.raidTools[m.toolId] || { name: m.toolId, wb: '-' };
              const isCheapest = (m.sulfur || 0) === lowestSulfur;
              return `
                <tr class="${isCheapest ? 'method-best-row' : ''}">
                  <td style="font-weight:700; color:#fff;">${m.qty}x ${tool.name}</td>
                  <td style="color:${m.sulfur === 0 ? '#4ade80' : 'var(--sulfur-yellow)'}; font-weight:700;">
                    ${m.sulfur === 0 ? `0 Sulfur (${m.lgf || 0} LGF)` : m.sulfur.toLocaleString()}
                  </td>
                  <td>${formatRaidTime(m.timeSec)}</td>
                  <td><span class="target-tier-tag">${tool.wb}</span></td>
                  <td class="text-xs text-muted" style="font-family:var(--font-body)">${m.notes || ''}</td>
                  <td>
                    <button class="btn btn-sm add-single-method-btn" data-target="${target.id}" data-method-idx="${m._origIdx}">
                      + Add
                    </button>
                  </td>
                </tr>
              `;
            })
            .join('')
        : `<tr><td colspan="6" class="text-xs text-muted">No practical boom/fire tools at ${activeWbLabel}. Try T2/T3.</td></tr>`;

    const softSideHtml = target.softSideNote
      ? `<div class="soft-side-callout"><strong>ℹ️ Eco / Soft-Side Note (Unranked):</strong> ${target.softSideNote}</div>`
      : '';

    container.innerHTML = `
      <div style="border-top:1px solid var(--border-subtle); padding-top:16px; margin-top:4px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
          <div>
            <h3 style="font-family:var(--font-display); font-size:18px; text-transform:uppercase; color:#fff;">
              ${target.name} <span class="text-green">(${target.hp} HP)</span>
            </h3>
            <span class="text-xs text-muted">${target.category} • Material: ${target.tier} • Filter: ${activeWbLabel}</span>
          </div>
          <button class="btn btn-sulfur btn-sm" id="addOptimalTargetBtn" data-target="${target.id}">
            ⚡ Add Optimal to Squad Plan
          </button>
        </div>

        <h4 class="text-xs text-muted" style="margin-bottom:8px; letter-spacing:0.06em;">RECOMMENDED SULFUR-SAVING COMBOS</h4>
        <div class="combo-grid">${combosHtml}</div>

        <h4 class="text-xs text-muted" style="margin-bottom:8px; letter-spacing:0.06em;">PURE SINGLE-TOOL COMPARISON</h4>
        <div style="overflow-x:auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Boom / Fire Tool</th>
                <th>Sulfur</th>
                <th>Time</th>
                <th>WB</th>
                <th>Tactical Note</th>
                <th></th>
              </tr>
            </thead>
            <tbody>${methodsRows}</tbody>
          </table>
        </div>
        ${softSideHtml}
      </div>
    `;

    container.querySelector('#addOptimalTargetBtn')?.addEventListener('click', () => {
      addRaidQueueItem(target.id, 1, 'combo');
    });

    container.querySelectorAll('.add-target-combo-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cIdx = Number(btn.getAttribute('data-combo-idx'));
        addRaidQueueItem(target.id, 1, `combo:${cIdx}`);
      });
    });

    container.querySelectorAll('.add-single-method-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mIdx = Number(btn.getAttribute('data-method-idx'));
        addRaidQueueItem(target.id, 1, `method:${mIdx}`);
      });
    });
  }

  function addRaidQueueItem(targetId, qty, mode) {
    const cleanQty = Math.max(1, Math.min(99, Number(qty) || 1));
    const existing = appState.raidQueue.find((item) => item.targetId === targetId && item.mode === mode);
    if (existing) {
      existing.qty += cleanQty;
    } else {
      appState.raidQueue.push({ targetId, qty: cleanQty, mode });
    }
    renderRaidPlanner();
    renderRaidStashReadiness();
    syncStateToServer();
  }

  function changeRaidQueueQty(idx, delta) {
    const item = appState.raidQueue[idx];
    if (!item) return;
    const next = (Number(item.qty) || 1) + delta;
    if (next <= 0) {
      appState.raidQueue.splice(idx, 1);
    } else {
      item.qty = Math.min(99, next);
    }
    renderRaidPlanner();
    renderRaidStashReadiness();
    syncStateToServer();
  }

  function resolveQueueItemLoadout(item) {
    const target = DATA.raidTargets.find((t) => t.id === item.targetId);
    if (!target) return null;

    const qty = Math.max(1, Number(item.qty) || 1);
    const mode = item.mode || 'combo';
    const validMethods = getFilteredMethods(target, 'All');
    const validCombos = getFilteredCombos(target, 'All');

    let sulfur = 0;
    let charcoal = 0;
    let lgf = 0;
    let metal = 0;
    let pipes = 0;
    let techTrash = 0;
    let timeSec = 0;
    let chosenLabel = '';
    const toolCounts = {};

    const applyMethod = (m) => {
      const tool = DATA.raidTools[m.toolId] || { name: m.toolId };
      sulfur = m.sulfur || 0;
      charcoal = m.charcoal || 0;
      lgf = m.lgf || 0;
      metal = m.metal || 0;
      pipes = m.pipes || 0;
      techTrash = m.techTrash || 0;
      timeSec = m.timeSec || 20;
      chosenLabel = `${m.qty}x ${tool.shortName || tool.name}`;
      toolCounts[m.toolId] = m.qty;
    };

    const applyCombo = (c) => {
      sulfur = c.sulfur || 0;
      charcoal = c.charcoal || 0;
      lgf = c.lgf || 0;
      timeSec = c.timeSec || 20;
      chosenLabel = c.label;
      (c.items || []).forEach((it) => {
        const tool = DATA.raidTools[it.toolId] || {};
        toolCounts[it.toolId] = (toolCounts[it.toolId] || 0) + it.qty;
        metal += (tool.metal || 0) * it.qty;
        pipes += (tool.pipes || 0) * it.qty;
        techTrash += (tool.techTrash || 0) * it.qty;
      });
    };

    if (mode.startsWith('combo:')) {
      const idx = Number(mode.split(':')[1]);
      const c = (target.combos || [])[idx] || validCombos[0];
      if (c) applyCombo(c);
    } else if (mode.startsWith('method:')) {
      const idx = Number(mode.split(':')[1]);
      const m = (target.methods || [])[idx] || validMethods[0];
      if (m) applyMethod(m);
    } else if (mode === 'explo_only') {
      const explo = validMethods.find((m) => m.toolId === 'explo_ammo');
      if (explo) applyMethod(explo);
      else if (validMethods[0]) applyMethod(validMethods[0]);
    } else if (mode === 'cheapest_single') {
      if (validMethods[0]) applyMethod(validMethods[0]);
    } else if (mode === 'fastest') {
      const sortedFast = [...validMethods].sort((a, b) => (a.timeSec || 999) - (b.timeSec || 999));
      if (sortedFast[0]) applyMethod(sortedFast[0]);
    } else if (mode === 't1') {
      const t1Combo = validCombos.find((c) =>
        (c.items || []).every((it) => (WB_RANK[(DATA.raidTools[it.toolId] || {}).wb] || 3) <= 2)
      );
      const t1Method =
        validMethods.find((m) => ['molotov', 'satchel', 'beancan', 'flamethrower', 'hv_rocket'].includes(m.toolId)) ||
        validMethods[0];
      if (t1Combo && (!t1Method || t1Combo.sulfur <= t1Method.sulfur)) {
        applyCombo(t1Combo);
      } else if (t1Method) {
        applyMethod(t1Method);
      }
    } else {
      // 'combo' default: pick lowest sulfur between best combo and cheapest single boom/fire
      const bestCombo = validCombos[0];
      const bestMethod = validMethods[0];
      if (bestCombo && (!bestMethod || bestCombo.sulfur <= bestMethod.sulfur + 25)) {
        applyCombo(bestCombo);
      } else if (bestMethod) {
        applyMethod(bestMethod);
      }
    }

    const scaledToolCounts = {};
    Object.entries(toolCounts).forEach(([id, count]) => {
      scaledToolCounts[id] = count * qty;
    });

    return {
      target,
      chosenLabel,
      totalSulfur: sulfur * qty,
      totalCharcoal: charcoal * qty,
      totalLgf: lgf * qty,
      totalMetal: metal * qty,
      totalPipes: pipes * qty,
      totalTechTrash: techTrash * qty,
      totalTimeSec: timeSec * qty,
      toolCounts: scaledToolCounts
    };
  }

  function renderRaidPlanner() {
    const queueContainer = document.getElementById('raidQueueContainer');
    const summaryContainer = document.getElementById('raidTotalSummary');
    const nodeContainer = document.getElementById('sulfurNodeBreakdown');
    if (!queueContainer || !summaryContainer || !nodeContainer) return;

    if (!appState.raidQueue || appState.raidQueue.length === 0) {
      queueContainer.innerHTML =
        '<div class="text-muted text-sm" style="padding:14px; text-align:center; border:1px dashed var(--border-subtle); border-radius:6px;">No targets queued. Click any structure on the left or use + Add above.</div>';
      summaryContainer.innerHTML = '';
      nodeContainer.innerHTML = '';
      if (typeof renderRaidStashReadiness === 'function') renderRaidStashReadiness();
      return;
    }

    let grandSulfur = 0;
    let grandCharcoal = 0;
    let grandLgf = 0;
    let grandMetal = 0;
    let grandPipes = 0;
    let grandTechTrash = 0;
    let grandTimeSec = 0;
    const shoppingList = {};

    const rowsHtml = appState.raidQueue
      .map((item, idx) => {
        const res = resolveQueueItemLoadout(item);
        if (!res) return '';

        grandSulfur += res.totalSulfur;
        grandCharcoal += res.totalCharcoal;
        grandLgf += res.totalLgf;
        grandMetal += res.totalMetal;
        grandPipes += res.totalPipes;
        grandTechTrash += res.totalTechTrash;
        grandTimeSec += res.totalTimeSec;

        Object.entries(res.toolCounts).forEach(([tId, count]) => {
          shoppingList[tId] = (shoppingList[tId] || 0) + count;
        });

        return `
          <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; padding:10px 12px; background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:6px;">
            <div style="min-width:0; flex:1;">
              <div style="font-weight:700; color:#fff; font-size:14px; display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                <span>${res.target.name}</span>
                <span class="queue-qty-stepper">
                  <button class="queue-qty-btn raid-qty-dec" data-idx="${idx}" title="Decrease quantity">-</button>
                  <span class="queue-qty-num">${item.qty}x</span>
                  <button class="queue-qty-btn raid-qty-inc" data-idx="${idx}" title="Increase quantity">+</button>
                </span>
              </div>
              <div class="text-xs text-muted" style="margin-top:3px;">
                Loadout: <span style="color:var(--sulfur-yellow)">${res.chosenLabel}</span>
                • ${formatRaidTime(res.totalTimeSec)}
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:10px; flex-shrink:0;">
              <div style="text-align:right; font-family:var(--font-mono);">
                <div style="color:${res.totalSulfur === 0 ? '#4ade80' : 'var(--sulfur-yellow)'}; font-weight:700; font-size:13px;">
                  ${res.totalSulfur === 0 ? `${res.totalLgf} LGF` : `${res.totalSulfur.toLocaleString()} S`}
                </div>
                <div class="text-xs text-muted">${res.totalCharcoal.toLocaleString()} Char</div>
              </div>
              <button class="btn btn-sm btn-danger remove-raid-queue-btn" data-idx="${idx}" title="Remove">✕</button>
            </div>
          </div>
        `;
      })
      .join('');

    queueContainer.innerHTML = rowsHtml;

    queueContainer.querySelectorAll('.raid-qty-dec').forEach((btn) => {
      btn.addEventListener('click', () => changeRaidQueueQty(Number(btn.getAttribute('data-idx')), -1));
    });
    queueContainer.querySelectorAll('.raid-qty-inc').forEach((btn) => {
      btn.addEventListener('click', () => changeRaidQueueQty(Number(btn.getAttribute('data-idx')), 1));
    });
    queueContainer.querySelectorAll('.remove-raid-queue-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-idx'));
        appState.raidQueue.splice(idx, 1);
        renderRaidPlanner();
    renderRaidStashReadiness();
        syncStateToServer();
      });
    });

    const shoppingPills = Object.entries(shoppingList)
      .filter(([, count]) => count > 0)
      .map(([toolId, count]) => {
        const tool = DATA.raidTools[toolId] || { shortName: toolId, name: toolId, color: '#eab308' };
        return `<span style="display:inline-flex; align-items:center; gap:6px; padding:6px 12px; background:var(--bg-card); border:1px solid ${tool.color || '#eab308'}; border-radius:5px; font-family:var(--font-mono); font-weight:700; color:#fff;">
          ${count}x ${tool.shortName || tool.name}
        </span>`;
      })
      .join('');

    summaryContainer.innerHTML = `
      <div style="margin-bottom:14px;">
        <div class="text-xs text-muted" style="margin-bottom:6px; letter-spacing:0.05em;">EXPLOSIVES &amp; FIRE SHOPPING LIST (${formatRaidTime(grandTimeSec)} EST. BREACH)</div>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">${shoppingPills}</div>
      </div>

      <div class="resource-grid">
        <div class="resource-box highlight-sulfur">
          <div class="resource-val text-sulfur">${grandSulfur.toLocaleString()}</div>
          <div class="resource-label">Total Sulfur</div>
        </div>
        <div class="resource-box">
          <div class="resource-val">${grandCharcoal.toLocaleString()}</div>
          <div class="resource-label">Charcoal</div>
        </div>
        <div class="resource-box">
          <div class="resource-val">${grandLgf.toLocaleString()}</div>
          <div class="resource-label">Low Grade</div>
        </div>
        <div class="resource-box">
          <div class="resource-val">${grandMetal.toLocaleString()}</div>
          <div class="resource-label">Metal Frags</div>
        </div>
        <div class="resource-box">
          <div class="resource-val">${grandPipes} / ${grandTechTrash}</div>
          <div class="resource-label">Pipes / Tech</div>
        </div>
      </div>
    `;

    // Farming & Furnace Breakdown (1 Sulfur Node = 300 Sulfur Ore = 300 Smelted Sulfur; Pure Ore Tea +50% = 450)
    const nodesNormal = Math.ceil(grandSulfur / 300);
    const nodesPureTea = Math.ceil(grandSulfur / 450);
    const gpNeeded = Math.floor(grandSulfur * 0.45);
    const electricFurnaces = Math.max(1, Math.min(18, Math.ceil(grandSulfur / 2400)));
    const cookMins = grandSulfur > 0 ? Math.max(1, Math.ceil((grandSulfur / (electricFurnaces * 120)))) : 0;

    nodeContainer.innerHTML = `
      <div style="margin-top:14px; padding:12px; background:rgba(234,179,8,0.06); border:1px solid rgba(234,179,8,0.25); border-radius:6px;">
        <div class="text-xs" style="color:var(--sulfur-yellow); font-weight:700; margin-bottom:6px; letter-spacing:0.05em;">⛏️ FARMING &amp; SMELTING LOGISTICS</div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(175px, 1fr)); gap:8px; font-family:var(--font-mono); font-size:12px;">
          <div>No Tea (300/node): <strong style="color:#fff">${nodesNormal} Sulfur Nodes</strong></div>
          <div>Pure Ore Tea (450/node): <strong class="text-green">${nodesPureTea} Sulfur Nodes</strong></div>
          <div>Smelt (~${electricFurnaces} Elec. Furnaces): <strong>${grandSulfur > 0 ? `~${cookMins}m` : '0m'}</strong></div>
          <div>Est. Gunpowder Batch: <strong>~${gpNeeded.toLocaleString()} GP</strong></div>
        </div>
      </div>
    `;
    if (typeof renderRaidStashReadiness === 'function') renderRaidStashReadiness();
  }

  function solveCustomRemainingHp() {
    const targetId = document.getElementById('customHpTargetSelect')?.value || 'sheet_metal_door';
    const remainingHpRaw = Number(document.getElementById('customHpInput')?.value) || 0;
    const resultEl = document.getElementById('customHpResult');
    if (!resultEl) return;

    const target = DATA.raidTargets.find((t) => t.id === targetId);
    if (!target) return;

    const remainingHp = Math.min(target.hp, Math.max(1, remainingHpRaw));
    const ratio = remainingHp / target.hp;
    const validMethods = getFilteredMethods(target, 'All');

    // Pure single boom/fire tool finishes (NO melee tools!)
    const unitOptions = validMethods
      .map((m) => {
        const tool = DATA.raidTools[m.toolId] || { name: m.toolId, sulfur: 0, lgf: 0, wb: '-' };
        const dmgPerUnit = target.hp / m.qty;
        const unitsNeeded = Math.max(1, Math.ceil(remainingHp / dmgPerUnit));
        const totalSulfur = unitsNeeded * (tool.sulfur || 0);
        const totalLgf = unitsNeeded * (m.toolId === 'flamethrower' ? 1 : m.toolId === 'molotov' ? 50 : (tool.lgf || 0));
        const totalTime = Math.max(2, Math.round(unitsNeeded * ((m.timeSec || 20) / m.qty)));
        return {
          toolId: m.toolId,
          toolName: tool.shortName || tool.name,
          wb: tool.wb,
          unitsNeeded,
          totalSulfur,
          totalLgf,
          totalTime
        };
      })
      .sort((a, b) => a.totalSulfur - b.totalSulfur || a.totalLgf - b.totalLgf || a.totalTime - b.totalTime);

    // Compute best mixed explosive sulfur-saver: 1..N heavy boom + fast finish boom/fire
    let bestMix = null;
    const heavyTools = ['c4', 'rocket', 'satchel'];
    const finishTools = ['explo_ammo', 'beancan', 'molotov'];

    heavyTools.forEach((hId) => {
      const hMethod = validMethods.find((m) => m.toolId === hId);
      if (!hMethod) return;
      const hDmg = target.hp / hMethod.qty;
      const hTool = DATA.raidTools[hId];
      const maxHeavy = Math.floor(remainingHp / hDmg);

      for (let hCount = 1; hCount <= maxHeavy; hCount++) {
        const hpLeft = remainingHp - hCount * hDmg;
        if (hpLeft <= 0.1) continue;
        finishTools.forEach((fId) => {
          const fMethod = validMethods.find((m) => m.toolId === fId);
          if (!fMethod) return;
          const fDmg = target.hp / fMethod.qty;
          const fTool = DATA.raidTools[fId];
          const fCount = Math.ceil(hpLeft / fDmg);
          const mixSulfur = hCount * (hTool.sulfur || 0) + fCount * (fTool.sulfur || 0);
          const mixTime = Math.round(
            hCount * ((hMethod.timeSec || 15) / hMethod.qty) + fCount * ((fMethod.timeSec || 15) / fMethod.qty)
          );
          if (!bestMix || mixSulfur < bestMix.sulfur || (mixSulfur === bestMix.sulfur && mixTime < bestMix.time)) {
            bestMix = {
              label: `${hCount}x ${hTool.shortName || hTool.name} + ${fCount}x ${fTool.shortName || fTool.name}`,
              sulfur: mixSulfur,
              time: mixTime
            };
          }
        });
      }
    });

    const bestPure = unitOptions[0];
    const showMixHighlight = bestMix && (!bestPure || bestMix.sulfur < bestPure.totalSulfur);

    const rowsHtml = unitOptions
      .map(
        (opt, i) => `
      <tr class="${i === 0 && !showMixHighlight ? 'method-best-row' : ''}">
        <td style="font-weight:700; color:#fff;">${opt.unitsNeeded}x ${opt.toolName}</td>
        <td style="color:${opt.totalSulfur === 0 ? '#4ade80' : 'var(--sulfur-yellow)'}; font-weight:700;">
          ${opt.totalSulfur === 0 ? `0 Sulfur (${opt.totalLgf} LGF)` : `${opt.totalSulfur.toLocaleString()} Sulfur`}
        </td>
        <td>${formatRaidTime(opt.totalTime)}</td>
        <td><span class="target-tier-tag">${opt.wb}</span></td>
      </tr>
    `
      )
      .join('');

    resultEl.innerHTML = `
      <div style="padding:12px; background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.3); border-radius:6px;">
        <div style="font-family:var(--font-display); font-weight:700; color:#4ade80; margin-bottom:8px;">
          ⚡ Optimal Finish for ${target.name} @ ${remainingHp} / ${target.hp} HP (${Math.round(ratio * 100)}% HP):
        </div>
        ${
          showMixHighlight
            ? `<div style="margin-bottom:10px; padding:8px 10px; background:rgba(234,179,8,0.14); border:1px solid var(--sulfur-yellow); border-radius:4px; font-family:var(--font-mono); font-size:12px;">
                 🔥 <strong>BEST MIXED SULFUR-SAVER:</strong> ${bestMix.label} →
                 <strong style="color:var(--sulfur-yellow)">${bestMix.sulfur.toLocaleString()} Sulfur</strong> (${formatRaidTime(bestMix.time)})
               </div>`
            : ''
        }
        <table class="data-table">
          <thead><tr><th>Single Tool Finish</th><th>Sulfur</th><th>Time</th><th>WB</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    `;
  }

  function initRaidModule() {
    const quickTargetSelect = document.getElementById('quickAddTargetSelect');
    const customTargetSelect = document.getElementById('customHpTargetSelect');

    if (quickTargetSelect) {
      quickTargetSelect.innerHTML = DATA.raidTargets
        .map((t) => `<option value="${t.id}">${t.name} (${t.hp} HP)</option>`)
        .join('');
    }
    if (customTargetSelect) {
      customTargetSelect.innerHTML = DATA.raidTargets
        .map((t) => `<option value="${t.id}" ${t.id === 'sheet_metal_door' ? 'selected' : ''}>${t.name} (${t.hp} HP)</option>`)
        .join('');
    }

    document.querySelectorAll('#raidCategoryPills .filter-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('#raidCategoryPills .filter-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        selectedRaidCategory = pill.getAttribute('data-cat');
        renderRaidTargets();
      });
    });

    document.querySelectorAll('#raidWbPills .filter-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('#raidWbPills .filter-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        selectedRaidWb = pill.getAttribute('data-wb') || 'All';
        renderRaidTargets();
      });
    });

    document.getElementById('raidTargetSearch')?.addEventListener('input', (e) => {
      raidTargetSearch = e.target.value || '';
      renderRaidTargets();
    });

    document.getElementById('quickAddRaidBtn')?.addEventListener('click', () => {
      const tId = document.getElementById('quickAddTargetSelect')?.value;
      const qty = Number(document.getElementById('quickAddQtyInput')?.value) || 1;
      const mode = document.getElementById('quickAddModeSelect')?.value || 'combo';
      if (tId) addRaidQueueItem(tId, qty, mode);
    });

    document.getElementById('clearRaidQueueBtn')?.addEventListener('click', () => {
      appState.raidQueue = [];
      renderRaidPlanner();
    renderRaidStashReadiness();
      syncStateToServer();
    });

    document.getElementById('discordRaidPlanBtn')?.addEventListener('click', () => {
      if (!appState.raidQueue || appState.raidQueue.length === 0) return;
      let totalS = 0;
      let totalChar = 0;
      let totalLgf = 0;
      const totalsMap = {};
      const lines = appState.raidQueue
        .map((item) => {
          const res = resolveQueueItemLoadout(item);
          if (!res) return '';
          totalS += res.totalSulfur;
          totalChar += res.totalCharcoal;
          totalLgf += res.totalLgf;
          Object.entries(res.toolCounts).forEach(([tId, c]) => {
            totalsMap[tId] = (totalsMap[tId] || 0) + c;
          });
          return `• **${item.qty}x ${res.target.name}** → ${res.chosenLabel} (${res.totalSulfur === 0 ? `${res.totalLgf} LGF` : `**${res.totalSulfur.toLocaleString()} Sulfur**`})`;
        })
        .filter(Boolean);

      const carryList = Object.entries(totalsMap)
        .filter(([, c]) => c > 0)
        .map(([tId, c]) => `${c}x ${(DATA.raidTools[tId] || {}).shortName || tId}`)
        .join(' + ');

      const discordMsg =
        `💣 **RAID PLAN — ${appState.squadName}**\n` +
        `${lines.join('\n')}\n` +
        `🎒 **Carry:** ${carryList}\n` +
        `💛 **Total:** **${totalS.toLocaleString()} Sulfur** (${Math.ceil(totalS / 300)} Nodes | ${Math.ceil(totalS / 450)} w/ Pure Ore Tea) • ${totalChar.toLocaleString()} Charcoal${totalLgf ? ` • ${totalLgf} LGF` : ''}`;

      navigator.clipboard?.writeText(discordMsg).catch(() => {});
      const btn = document.getElementById('discordRaidPlanBtn');
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = '✓ Copied Discord Plan!';
        setTimeout(() => {
          btn.textContent = orig;
        }, 1800);
      }
    });

    document.getElementById('solveCustomHpBtn')?.addEventListener('click', solveCustomRemainingHp);
    document.getElementById('customHpTargetSelect')?.addEventListener('change', (e) => {
      const target = DATA.raidTargets.find((t) => t.id === e.target.value);
      const hpInput = document.getElementById('customHpInput');
      if (target && hpInput) {
        hpInput.max = target.hp;
        if (Number(hpInput.value) > target.hp) {
          hpInput.value = Math.max(1, Math.round(target.hp * 0.4));
        }
      }
      solveCustomRemainingHp();
    });
    solveCustomRemainingHp();
  }
  // =========================================================================
  // MODULE 1B: STASH & BOOM LIVE WINDOW/OCR SCANNER + READINESS ENGINE
  // =========================================================================
  const STASH_ITEM_META = {
    sulfur: { name: 'Sulfur', short: 'Sulf', color: '#facc15', sulfurEq: 1 },
    sulfur_ore: { name: 'Sulfur Ore', short: 'Ore', color: '#d97706', sulfurEq: 1 },
    gunpowder: { name: 'Gun Powder', short: 'GP', color: '#94a3b8', sulfurEq: 2 },
    explosives: { name: 'Explosives', short: 'Exp', color: '#84cc16', sulfurEq: 110 },
    c4: { name: 'C4', short: 'C4', color: '#f87171', sulfurEq: 2200 },
    rocket: { name: 'Rocket', short: 'Rkt', color: '#fb923c', sulfurEq: 1400 },
    explo_ammo: { name: 'Explosive 5.56', short: '5.56', color: '#60a5fa', sulfurEq: 25 },
    satchel: { name: 'Satchel Charge', short: 'Sat', color: '#a78bfa', sulfurEq: 480 },
    beancan: { name: 'Beancan Grenade', short: 'Bean', color: '#cbd5e1', sulfurEq: 120 },
    hv_rocket: { name: 'HV Rocket', short: 'HV', color: '#38bdf8', sulfurEq: 200 },
    incen_rocket: { name: 'Incen Rocket', short: 'Inc', color: '#f97316', sulfurEq: 610 },
    molotov: { name: 'Molotov', short: 'Mol', color: '#4ade80', sulfurEq: 0 },
    charcoal: { name: 'Charcoal', short: 'Char', color: '#64748b', sulfurEq: 0 },
    lgf: { name: 'Low Grade Fuel', short: 'LGF', color: '#f59e0b', sulfurEq: 0 }
  };

  const RAID_BOX_GRID_STORAGE_KEY = 'rust_companion_raid_box_grids_v1';
  let raidOcrWorkerPromise = null;
  let raidScannerImg = null;
  let raidScannerCropRect = null;
  let raidBoxGridRect = null;
  let raidDragMode = 'box'; // 'box' | 'inspect'
  let raidLiveStream = null;
  let raidLiveTimer = null;
  let raidLiveBusy = false;
  let raidLiveAutoLoadedGrid = false;
  let raidLastLiveSig = '';
  let raidPrevBoxCanvas = null;
  let raidLastBoxSlot = null;
  let raidLastBoxSlotTags = []; // [{ row, col, key, qty }]
  let raidScannedHistory = [];

  async function ensureRaidOcrWorker(setStatus) {
    if (!raidOcrWorkerPromise) {
      raidOcrWorkerPromise = (async () => {
        setStatus('⏳ Loading in-browser Raid Stash OCR engine (first run downloads ~2MB)...');
        await loadScriptOnce('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
        if (!window.Tesseract) throw new Error('Tesseract failed to initialize.');
        const worker = await window.Tesseract.createWorker('eng');
        return worker;
      })().catch((err) => {
        raidOcrWorkerPromise = null;
        throw err;
      });
    }
    return raidOcrWorkerPromise;
  }

  function getRaidBoxGridDims() {
    const val = document.getElementById('raidScannerBoxLayoutSelect')?.value || '8x6';
    if (val === '6x4') return { rows: 4, cols: 6 };
    if (val === '6x1') return { rows: 1, cols: 6 };
    const [rStr, cStr] = val.split('x');
    return {
      rows: Math.max(1, parseInt(rStr, 10) || 8),
      cols: Math.max(1, parseInt(cStr, 10) || 6)
    };
  }

  /** Detect full-game widescreen frames (16:9 / 16:10 / 21:9) vs tight chest crops. */
  function isWidescreenGameFrame(dims) {
    if (!dims || !dims.w || !dims.h) return false;
    const aspect = dims.w / Math.max(1, dims.h);
    return dims.w >= 720 ? aspect >= 1.45 : aspect >= 1.58;
  }

  function getSavedRaidBoxGrids() {
    try {
      const raw = localStorage.getItem(RAID_BOX_GRID_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function saveRaidBoxGridNorm(layoutVal, rect, dims) {
    if (!layoutVal || !rect || !dims || !dims.w || !dims.h) return;
    if (rect.w < 20 || rect.h < 20) return;
    try {
      const saved = getSavedRaidBoxGrids();
      saved[layoutVal] = {
        rx: Math.max(0, Math.min(0.95, rect.x / dims.w)),
        ry: Math.max(0, Math.min(0.95, rect.y / dims.h)),
        rw: Math.max(0.04, Math.min(1, rect.w / dims.w)),
        rh: Math.max(0.04, Math.min(1, rect.h / dims.h))
      };
      localStorage.setItem(RAID_BOX_GRID_STORAGE_KEY, JSON.stringify(saved));
    } catch (_) {}
  }

  function clearSavedRaidBoxGridNorm(layoutVal) {
    if (!layoutVal) return;
    try {
      const saved = getSavedRaidBoxGrids();
      if (saved && Object.prototype.hasOwnProperty.call(saved, layoutVal)) {
        delete saved[layoutVal];
        localStorage.setItem(RAID_BOX_GRID_STORAGE_KEY, JSON.stringify(saved));
      }
    } catch (_) {}
  }

  /** Compute standard Rust 16:9 (height-scaled, horizontally centered) container bounds. */
  function computeRustDefaultBoxRect(dims, layoutVal) {
    const W = dims.w;
    const H = dims.h;
    const cell = H * 0.06315;
    const rightX = W * 0.5 + H * 0.1975;
    const bottomY = H * 0.8833;
    let raw;
    if (layoutVal === '6x1') {
      raw = { x: W * 0.5 - H * 0.211, y: H * 0.920, w: H * 0.394, h: H * 0.066 };
    } else {
      const rows = layoutVal === '5x6' ? 5 : layoutVal === '6x4' ? 4 : 8;
      const w = 6 * cell;
      const h = rows * cell;
      raw = { x: rightX, y: bottomY - h, w, h };
    }
    const w = Math.min(W, Math.max(24, raw.w));
    const h = Math.min(H, Math.max(24, raw.h));
    const x = Math.max(0, Math.min(W - w, raw.x));
    const y = Math.max(0, Math.min(H - h, raw.y));
    return { x, y, w, h };
  }

  /** Pre-load saved custom normalized grid (or standard Rust preset) onto canvas dims. */
  function applyPreloadedRaidBoxGrid(dims, opts = {}) {
    if (!dims || !dims.w || !dims.h) return null;
    const layoutVal = document.getElementById('raidScannerBoxLayoutSelect')?.value || '8x6';
    if (!opts.forcePreset) {
      const g = getSavedRaidBoxGrids()[layoutVal];
      if (g && g.rw >= 0.04 && g.rh >= 0.04 && g.rw <= 0.96 && g.rh <= 0.96) {
        const w = Math.max(24, Math.min(dims.w, g.rw * dims.w));
        const h = Math.max(24, Math.min(dims.h, g.rh * dims.h));
        raidBoxGridRect = {
          x: Math.max(0, Math.min(dims.w - w, g.rx * dims.w)),
          y: Math.max(0, Math.min(dims.h - h, g.ry * dims.h)),
          w,
          h
        };
        return { source: 'saved', layout: layoutVal };
      }
    }
    if (isWidescreenGameFrame(dims) || opts.isLive) {
      raidBoxGridRect = computeRustDefaultBoxRect(dims, layoutVal);
      return { source: 'preset', layout: layoutVal };
    }
    if (opts.forcePreset) {
      raidBoxGridRect = { x: 0, y: 0, w: dims.w, h: dims.h };
      return { source: 'preset', layout: layoutVal };
    }
    return null;
  }

  function syncStashInputsFromState() {
    const stash = appState.raidStash || DEFAULT_RAID_STASH;
    document.querySelectorAll('#raidStashInputs input[data-stash-key]').forEach((inp) => {
      const k = inp.getAttribute('data-stash-key');
      if (document.activeElement !== inp) {
        inp.value = Math.max(0, Math.floor(Number(stash[k]) || 0));
      }
    });
  }

  function getStashTotals() {
    const raw = appState.raidStash || DEFAULT_RAID_STASH;
    const s = {};
    Object.keys(DEFAULT_RAID_STASH).forEach((k) => {
      s[k] = Math.max(0, Math.floor(Number(raw[k]) || 0));
    });
    const smeltedCraftPool = s.sulfur + s.gunpowder * 2 + s.explosives * 110;
    const withOreCraftPool = smeltedCraftPool + s.sulfur_ore;
    const craftedBoomSulfur =
      s.c4 * 2200 +
      s.rocket * 1400 +
      s.explo_ammo * 25 +
      s.satchel * 480 +
      s.beancan * 120 +
      s.hv_rocket * 200 +
      s.incen_rocket * 610;

    return {
      stash: s,
      smeltedCraftPool,
      withOreCraftPool,
      craftedBoomSulfur,
      totalReadySulfurEq: smeltedCraftPool + craftedBoomSulfur,
      totalWithOreSulfurEq: withOreCraftPool + craftedBoomSulfur
    };
  }

  function getQueuedShoppingRequirements() {
    const queue = appState.raidQueue || [];
    const reqTools = {};
    let planSulfur = 0;
    let planCharcoal = 0;
    let planLgf = 0;

    queue.forEach((item) => {
      const res = resolveQueueItemLoadout(item);
      if (!res) return;
      planSulfur += res.totalSulfur;
      planCharcoal += res.totalCharcoal;
      planLgf += res.totalLgf;
      Object.entries(res.toolCounts).forEach(([tId, count]) => {
        if (count > 0) reqTools[tId] = (reqTools[tId] || 0) + count;
      });
    });

    return { reqTools, planSulfur, planCharcoal, planLgf };
  }

  function renderRaidStashReadiness() {
    syncStashInputsFromState();
    const readinessEl = document.getElementById('raidStashReadiness');
    const affordEl = document.getElementById('raidAffordabilityGrid');
    if (!readinessEl || !affordEl) return;

    const includeUncooked = Boolean(document.getElementById('raidIncludeUncookedCb')?.checked ?? true);
    const furnaceChoice = document.getElementById('raidFurnaceCountSelect')?.value || '6';
    const metrics = getStashTotals();
    const { stash, smeltedCraftPool, withOreCraftPool, craftedBoomSulfur, totalReadySulfurEq, totalWithOreSulfurEq } = metrics;
    const activeCraftPool = includeUncooked ? withOreCraftPool : smeltedCraftPool;
    const activeTotalSulfurEq = includeUncooked ? totalWithOreSulfurEq : totalReadySulfurEq;
    const { reqTools, planSulfur } = getQueuedShoppingRequirements();

    // Match already-crafted boom in stash against queued shopping list first
    let remainingBoomSulfurNeeded = 0;
    const remainingToolsText = [];
    const matchedBoomCounts = {};

    Object.entries(reqTools).forEach(([toolId, needQty]) => {
      const haveQty = Math.min(needQty, stash[toolId] || 0);
      matchedBoomCounts[toolId] = haveQty;
      const stillNeed = Math.max(0, needQty - haveQty);
      if (stillNeed > 0) {
        const tMeta = DATA.raidTools[toolId] || { sulfur: 0, shortName: toolId };
        remainingBoomSulfurNeeded += stillNeed * (tMeta.sulfur || 0);
        remainingToolsText.push(`${stillNeed}x ${tMeta.shortName || toolId}`);
      }
    });

    const spareBoomNotes = [];
    let spareBoomSulfur = 0;
    ['c4', 'rocket', 'explo_ammo', 'satchel', 'beancan', 'hv_rocket', 'incen_rocket'].forEach((tId) => {
      const extraQty = Math.max(0, (stash[tId] || 0) - (matchedBoomCounts[tId] || 0));
      if (extraQty > 0) {
        const tMeta = STASH_ITEM_META[tId];
        spareBoomSulfur += extraQty * tMeta.sulfurEq;
        spareBoomNotes.push(`${extraQty}x ${tMeta.name}`);
      }
    });

    const missingSulfurForPlan = Math.max(0, remainingBoomSulfurNeeded - activeCraftPool);
    const surplusCraftSulfur = Math.max(0, activeCraftPool - remainingBoomSulfurNeeded);
    const pct = planSulfur > 0 ? Math.min(100, Math.round(((planSulfur - missingSulfurForPlan) / planSulfur) * 100)) : 100;

    const nodesNeededNormal = Math.ceil(missingSulfurForPlan / 300);
    const nodesNeededTea = Math.ceil(missingSulfurForPlan / 450);

    // Charcoal math for turning Sulfur + included Ore into Gun Powder (1 Sulfur -> 1.5 Charcoal)
    const rawSulfurAvailable = stash.sulfur + (includeUncooked ? stash.sulfur_ore : 0);
    const craftNeededFromRaw = planSulfur > 0 ? Math.min(rawSulfurAvailable, Math.max(0, remainingBoomSulfurNeeded - stash.gunpowder * 2 - stash.explosives * 110)) : rawSulfurAvailable;
    const estCharcoalNeeded = Math.round(craftNeededFromRaw * 1.5);
    const charcoalGap = Math.max(0, estCharcoalNeeded - stash.charcoal);

    // Uncooked Sulfur Ore Smelting Time & Wood Calculation
    let smeltInfoHtml = '';
    if (stash.sulfur_ore > 0) {
      let smeltLine = '';
      let freeCharcoalFromSmelt = 0;
      if (furnaceChoice.startsWith('large')) {
        const numLarge = parseInt(furnaceChoice.replace('large', ''), 10) || 1;
        // Large furnace: ~2.5s per ore per slot (~15 parallel ore slots -> ~360 ore/min), 1 Wood cooks ~1.5 Ore & makes ~0.75 Charcoal
        const woodForOre = Math.ceil(stash.sulfur_ore / 1.5);
        freeCharcoalFromSmelt = Math.round(woodForOre * 0.75);
        const mins = Math.max(1, Math.ceil(stash.sulfur_ore / (numLarge * 360)));
        smeltLine = `<strong>${numLarge} Large Furnace${numLarge > 1 ? 's' : ''}:</strong> ~${mins >= 60 ? `${Math.floor(mins/60)}h ${mins%60}m` : `${mins}m`} • Needs <strong>${woodForOre.toLocaleString()} Wood</strong> (creates <strong>+${freeCharcoalFromSmelt.toLocaleString()} free Charcoal</strong>!)`;
      } else {
        const numElec = parseInt(furnaceChoice, 10) || 6;
        // Electric furnace: 1 Sulfur Ore/sec = 60 Ore/min per furnace (0 Wood, 0 Charcoal)
        const mins = Math.max(1, Math.ceil(stash.sulfur_ore / (numElec * 60)));
        smeltLine = `<strong>${numElec} Elec. Furnaces:</strong> ~${mins >= 60 ? `${Math.floor(mins/60)}h ${mins%60}m` : `${mins}m`} • <strong>0 Wood</strong> (produces 0 Charcoal)`;
      }

      const netCharcoalGap = Math.max(0, estCharcoalNeeded - stash.charcoal - freeCharcoalFromSmelt);
      const extraWoodForCharcoal = netCharcoalGap > 0 ? Math.ceil(netCharcoalGap / 0.75) : 0;

      smeltInfoHtml = `
        <div style="margin-top:8px; padding:7px 9px; border-radius:5px; background:rgba(217,119,6,0.12); border:1px solid rgba(217,119,6,0.35); font-size:11.5px; color:#fde68a; line-height:1.45;">
          🪨 <strong>Uncooked Ore Smelt (${stash.sulfur_ore.toLocaleString()} Ore):</strong> ${smeltLine}
          ${estCharcoalNeeded > 0 ? `<br/>🔥 <strong>Charcoal for GP:</strong> Need ${estCharcoalNeeded.toLocaleString()} Charcoal (have ${stash.charcoal.toLocaleString()}${freeCharcoalFromSmelt > 0 ? ` + ${freeCharcoalFromSmelt.toLocaleString()} from smelting` : ''})${netCharcoalGap > 0 ? ` → <strong style="color:#fb923c;">short ${netCharcoalGap.toLocaleString()} Charcoal (~${extraWoodForCharcoal.toLocaleString()} Wood)</strong>` : ' → <strong style="color:#4ade80;">Charcoal covered!</strong>'}` : ''}
        </div>
      `;
    } else if (charcoalGap > 0 && rawSulfurAvailable > 0) {
      smeltInfoHtml = `
        <div style="margin-top:6px; font-size:11.5px; color:#fb923c;">
          🔥 Need <strong>${estCharcoalNeeded.toLocaleString()} Charcoal</strong> to convert your ${rawSulfurAvailable.toLocaleString()} Sulfur into GP (short <strong>${charcoalGap.toLocaleString()} Charcoal</strong> ≈ ${Math.ceil(charcoalGap / 0.75).toLocaleString()} Wood).
        </div>
      `;
    }

    let statusClass = 'readiness-banner';
    let headline = '';
    let subDetail = '';

    if (planSulfur <= 0) {
      statusClass += activeTotalSulfurEq > 0 ? ' is-ready' : '';
      headline = `⚡ Active Pool: <strong style="color:var(--sulfur-yellow)">${activeTotalSulfurEq.toLocaleString()} Sulfur Eq.</strong>`;
      subDetail = 'Queue targets in the Squad Raid Planner below to calculate your exact deficit & nodes missing.';
    } else if (missingSulfurForPlan === 0) {
      statusClass += ' is-ready';
      headline = `✅ READY FOR QUEUED RAID PLAN! <span style="color:#4ade80;">(+${surplusCraftSulfur.toLocaleString()} Surplus Craft Sulfur)</span>`;
      subDetail =
        includeUncooked && stash.sulfur_ore > 0 && remainingBoomSulfurNeeded > smeltedCraftPool
          ? `Includes <strong>${Math.min(stash.sulfur_ore, remainingBoomSulfurNeeded - smeltedCraftPool).toLocaleString()} Uncooked Ore</strong> — smelt first to craft the remaining boom!`
          : `You have enough ${includeUncooked ? 'ready + uncooked' : 'cooked'} boom & sulfur for all queued targets (${planSulfur.toLocaleString()} Sulfur).`;
    } else {
      statusClass += ' is-short';
      headline = `⚠️ MISSING <span style="color:#f87171;">${missingSulfurForPlan.toLocaleString()} SULFUR</span> FOR RAID PLAN (${pct}% Funded)`;
      subDetail =
        `⛏️ Farm <strong>${nodesNeededNormal} Sulfur Nodes</strong> (or <strong>${nodesNeededTea} w/ Pure Ore Tea</strong>). ` +
        (remainingToolsText.length ? `Still to craft: <strong>${remainingToolsText.join(' + ')}</strong>.` : '');
    }

    readinessEl.innerHTML = `
      <div class="${statusClass}">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; font-family:var(--font-display); font-size:13.5px; color:#fff;">
          <div>${headline}</div>
          <div style="font-family:var(--font-mono); font-size:11.5px; font-weight:700;">
            <span style="color:#4ade80;">${totalReadySulfurEq.toLocaleString()} Cooked/Ready</span>
            ${stash.sulfur_ore > 0 ? ` + <span style="color:#fbbf24;">${stash.sulfur_ore.toLocaleString()} Uncooked</span> = <span style="color:var(--sulfur-yellow);">${totalWithOreSulfurEq.toLocaleString()}S</span>` : ''}
          </div>
        </div>
        ${
          planSulfur > 0
            ? `<div class="readiness-bar-track">
                 <div class="readiness-bar-fill" style="width:${pct}%; background:${missingSulfurForPlan === 0 ? '#22c55e' : 'linear-gradient(90deg, #eab308, #ef4444)'};"></div>
               </div>`
            : ''
        }
        <div class="text-xs" style="color:#e2e8f0; margin-top:4px; line-height:1.45;">${subDetail}</div>
        <div class="text-xs text-muted" style="margin-top:6px; font-family:var(--font-mono); display:flex; flex-wrap:wrap; gap:10px;">
          <span>Cooked Sulfur: <strong>${stash.sulfur.toLocaleString()}</strong></span>
          <span>Uncooked Ore: <strong style="color:#fbbf24;">${stash.sulfur_ore.toLocaleString()}</strong></span>
          <span>GP (${stash.gunpowder.toLocaleString()}): <strong>${(stash.gunpowder * 2).toLocaleString()}S</strong></span>
          <span>Explosives (${stash.explosives}): <strong>${(stash.explosives * 110).toLocaleString()}S</strong></span>
          <span>Crafted Boom: <strong>${craftedBoomSulfur.toLocaleString()}S</strong></span>
          ${spareBoomNotes.length ? `<span style="color:var(--sulfur-yellow);">Spare Boom: <strong>${spareBoomNotes.join(', ')} (${spareBoomSulfur.toLocaleString()}S)</strong></span>` : ''}
        </div>
        ${smeltInfoHtml}
      </div>
    `;

    const benchmarkTargets = [
      { id: 'sheet_metal_door', short: 'Sheet Metal Door', cost: 1575, via: '63 Explo / 1 Rkt+8' },
      { id: 'garage_door', short: 'Garage Door', cost: 3200, via: '1 C4 + 40 Explo' },
      { id: 'stone_wall', short: 'Stone Wall', cost: 4300, via: '1 C4 + 84 Explo' },
      { id: 'armored_door', short: 'Armored Door', cost: 5150, via: '2 C4 + 30 Explo' },
      { id: 'sheet_metal_wall', short: 'Sheet Metal Wall', cost: 8350, via: '3 C4 + 70 Explo' },
      { id: 'armored_wall', short: 'Armored Wall', cost: 16150, via: '7 C4 + 30 Explo' }
    ];

    affordEl.innerHTML = benchmarkTargets
      .map((bt) => {
        const readyCount = Math.floor(totalReadySulfurEq / bt.cost);
        const totalCount = Math.floor(activeTotalSulfurEq / bt.cost);
        const gap = Math.max(0, bt.cost - activeTotalSulfurEq);
        const subCountNote =
          includeUncooked && stash.sulfur_ore > 0 && totalCount > readyCount
            ? ` <span style="color:#fbbf24; font-size:10px;">(${readyCount} now + ore)</span>`
            : '';
        return `
          <div class="afford-card ${totalCount > 0 ? 'can-raid' : ''}">
            <div class="afford-card-title">${bt.short}</div>
            <div class="afford-card-val" style="color:${totalCount > 0 ? '#4ade80' : '#fca5a5'};">
              ${totalCount > 0 ? `✅ Can raid ${totalCount}×${subCountNote}` : `Need ${gap.toLocaleString()}S (${Math.ceil(gap / 300)} nodes)`}
            </div>
            <div class="text-xs text-muted" style="font-size:10px;">Best: ${bt.cost.toLocaleString()}S (${bt.via})</div>
          </div>
        `;
      })
      .join('');
  }

  function classifyRustBoxSlotPixels(ctx, bx0, by0, cw, ch, maxW, maxH) {
    const clampX = (x) => Math.max(0, Math.min(maxW - 1, Math.floor(x)));
    const clampY = (y) => Math.max(0, Math.min(maxH - 1, Math.floor(y)));

    // Estimate frosted semi-transparent slot background from inner margin points (avoids grid border & top badge)
    const cornerPts = [
      [clampX(bx0 + cw * 0.09), clampY(by0 + ch * 0.45)],
      [clampX(bx0 + cw * 0.91), clampY(by0 + ch * 0.45)],
      [clampX(bx0 + cw * 0.11), clampY(by0 + ch * 0.20)],
      [clampX(bx0 + cw * 0.89), clampY(by0 + ch * 0.20)]
    ];
    let bgR = 0;
    let bgG = 0;
    let bgB = 0;
    cornerPts.forEach(([px, py]) => {
      const p = ctx.getImageData(px, py, 1, 1).data;
      bgR += p[0];
      bgG += p[1];
      bgB += p[2];
    });
    bgR /= 4;
    bgG /= 4;
    bgB /= 4;

    // Rust active cyan-teal highlight when user clicked/selected this slot in-game
    const isCyanSelected = bgG - bgR >= 32 && bgB - bgR >= 28 && bgB >= 100;

    const sx = Math.max(0, Math.floor(bx0 + cw * 0.16));
    const sy = Math.max(0, Math.floor(by0 + ch * 0.24));
    const sw = Math.max(4, Math.min(maxW - sx, Math.floor(cw * 0.68)));
    const sh = Math.max(4, Math.min(maxH - sy, Math.floor(ch * 0.48)));
    const d = ctx.getImageData(sx, sy, sw, sh).data;

    // Scale-invariant gradient step (~1px per 26px cell width so 1080p/1440p live frames match snips)
    const step = Math.max(1, Math.min(4, Math.round(cw / 26)));

    let tot = 0;
    let edgeSum = 0;
    let edgeN = 0;
    let edgeHi = 0;
    let lumaSum = 0;
    let lumaSq = 0;
    let diagEdge = 0;
    let diagN = 0;
    let offEdge = 0;
    let offN = 0;
    let bri145 = 0;
    let bri125 = 0;
    let wVDark = 0;
    let fgCount = 0;
    let cyanShadeCount = 0;
    let fgBrightY = 0;
    let fgMedY = 0;
    let fgOre = 0;
    let fgDark = 0;
    let fgVDark44 = 0;
    let fgVDark50 = 0;
    let fgWarm = 0;
    let fgWhiteGrey = 0;
    let allBrightY = 0;
    let allMedY = 0;
    let allOre = 0;
    let allDark = 0;
    let allWarm = 0;
    let allWhiteGrey = 0;

    for (let py = 0; py < sh; py++) {
      for (let px = 0; px < sw; px++) {
        const i = (py * sw + px) * 4;
        let rr = d[i];
        let gg = d[i + 1];
        let bb = d[i + 2];
        const rawLuma = 0.299 * rr + 0.587 * gg + 0.114 * bb;
        const bgDist = Math.abs(rr - bgR) + Math.abs(gg - bgG) + Math.abs(bb - bgB);
        if (isCyanSelected && (bgG - gg >= 14 || bgB - bb >= 14)) cyanShadeCount++;

        if (isCyanSelected) {
          gg = Math.max(0, gg - Math.max(0, bgG - bgR) * 0.72);
          bb = Math.max(0, bb - Math.max(0, bgB - bgR) * 0.72);
        }

        const mx = Math.max(rr, gg, bb);
        const mn = Math.min(rr, gg, bb);
        const sat = mx ? (mx - mn) / mx : 0;
        const luma = 0.299 * rr + 0.587 * gg + 0.114 * bb;
        lumaSum += luma;
        lumaSq += luma * luma;
        tot++;

        if (px >= step) {
          const j = (py * sw + px - step) * 4;
          const lL = 0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2];
          const diff = Math.abs(rawLuma - lL);
          edgeSum += diff;
          edgeN++;
          if (diff >= 14) edgeHi++;
          const u = px / sw;
          const v = py / sh;
          if (Math.abs(u - v) < 0.26) {
            diagEdge += diff;
            diagN++;
          } else {
            offEdge += diff;
            offN++;
          }
        }
        if (py >= step) {
          const j = ((py - step) * sw + px) * 4;
          const lU = 0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2];
          if (Math.abs(rawLuma - lU) >= 14) edgeHi++;
        }

        if (luma >= 145) bri145++;
        if (luma >= 125) bri125++;
        if (luma < 44) wVDark++;

        const isBY = rr >= 135 && gg >= 130 && gg - bb >= 34 && rr - bb >= 34;
        const isMY = rr >= 78 && gg >= 68 && gg - bb >= 16 && rr < 170;
        const isOre = rr > 55 && rr < 120 && gg > 45 && gg < 105 && bb < 72 && rr - bb >= 12;
        const isDark = luma < 92 && sat < 0.28;
        const isVD44 = luma < 44;
        const isVD50 = luma < 50;
        const isWarm = rr > gg + 6 && gg > bb + 5 && rr > 90;
        const isWG = luma >= 120 && sat < 0.22;

        if (isBY) allBrightY++;
        if (isMY) allMedY++;
        if (isOre) allOre++;
        if (isDark) allDark++;
        if (isWarm) allWarm++;
        if (isWG) allWhiteGrey++;

        if (bgDist >= 22) {
          fgCount++;
          if (isBY) fgBrightY++;
          if (isMY) fgMedY++;
          if (isOre) fgOre++;
          if (isDark) fgDark++;
          if (isVD44) fgVDark44++;
          if (isVD50) fgVDark50++;
          if (isWarm) fgWarm++;
          if (isWG) fgWhiteGrey++;
        }
      }
    }
    if (!tot) return 'empty';

    // Bottom-right white stack digit presence check
    const dx = Math.max(0, Math.floor(bx0 + cw * 0.30));
    const dy = Math.max(0, Math.floor(by0 + ch * 0.70));
    const dw = Math.max(4, Math.min(maxW - dx, Math.floor(cw * 0.68)));
    const dh = Math.max(4, Math.min(maxH - dy, Math.floor(ch * 0.28)));
    const dd = ctx.getImageData(dx, dy, dw, dh).data;
    const dScores = [];
    for (let i = 0; i < dd.length; i += 4) {
      const r = dd[i];
      const g = dd[i + 1];
      const b = dd[i + 2];
      const spread = Math.max(r, g, b) - Math.min(r, g, b);
      dScores.push(0.299 * r + 0.587 * g + 0.114 * b - spread * 0.35);
    }
    dScores.sort((a, b) => a - b);
    const digDiff = (dScores[Math.floor(dScores.length * 0.985)] || 0) - (dScores[Math.floor(dScores.length * 0.45)] || 0);

    const edgeAvg = edgeSum / Math.max(1, edgeN);
    const hiE = edgeHi / Math.max(1, tot * 2);
    const meanLuma = lumaSum / tot;
    const stdLuma = Math.sqrt(Math.max(0, lumaSq / tot - meanLuma * meanLuma));
    const fgFrac = fgCount / tot;
    const diagAvg = diagEdge / Math.max(1, diagN);
    const offAvg = offEdge / Math.max(1, offN);
    const diagRatio = diagAvg / Math.max(0.5, offAvg);
    const pBri145 = bri145 / tot;
    const pBri125 = bri125 / tot;
    const pWVD = wVDark / tot;
    const pCyanShade = cyanShadeCount / tot;

    const useFg = fgFrac >= 0.22;
    const den = useFg ? fgCount : tot;
    const fBY = (useFg ? fgBrightY : allBrightY) / den;
    const fMY = (useFg ? fgMedY : allMedY) / den;
    const fOre = (useFg ? fgOre : allOre) / den;
    const fDk = (useFg ? fgDark : allDark) / den;
    const fVDk44 = (useFg ? fgVDark44 : wVDark) / den;
    const fVDk50 = (useFg ? fgVDark50 : wVDark) / den;
    const fWm = (useFg ? fgWarm : allWarm) / den;
    const fWG = (useFg ? fgWhiteGrey : allWhiteGrey) / den;

    // Handle cyan active-selection slot highlight without dropping the selected stack
    if (isCyanSelected && pCyanShade >= 0.22 && (digDiff >= 26 || stdLuma >= 11)) {
      if (fBY >= 0.18) return 'sulfur';
      if (fWm >= 0.35) return 'satchel';
      if (diagRatio >= 2.05 && diagAvg >= 12.5) return pBri125 >= 0.025 ? 'explo_ammo' : 'rocket';
      if (fOre >= 0.25 && fMY >= 0.25) return 'sulfur_ore';
      return 'gunpowder';
    }

    // Empty gate: reject semi-transparent background scenery without sharp item icon edges
    const looksDarkMound =
      stdLuma >= 13.0 && fgFrac >= 0.38 && fDk >= 0.72 && (hiE >= 0.08 || digDiff >= 32 || (fDk >= 0.88 && edgeAvg >= 3.8));
    const hasStackDigits = digDiff >= 38 && edgeAvg >= 3.8;
    if (hiE < 0.15 && edgeAvg < 6.0 && !looksDarkMound && !hasStackDigits) {
      return 'empty';
    }

    if (fBY >= 0.20 && fMY >= 0.48) return 'sulfur';
    if (fWm >= 0.45 && fVDk50 < 0.18 && fBY < 0.05 && stdLuma >= 19) return 'satchel';
    if (fWG >= 0.22 && fWm < 0.20 && fBY < 0.05 && fDk < 0.62 && stdLuma >= 26) return 'explosives';

    if (diagRatio >= 2.0 && diagAvg >= 20.0 && stdLuma >= 20 && fVDk50 < 0.40 && pBri125 >= 0.025 && pBri145 >= 0.005) {
      return 'explo_ammo';
    }
    if (diagRatio >= 2.10 && diagAvg >= 12.5 && pBri125 <= 0.02 && fMY < 0.25) {
      return 'rocket';
    }

    const minC4Edge = step > 1 ? 11.8 : 17.5;
    const minC4VDk = step > 1 ? 0.54 : 0.48;
    if ((step > 1 ? fVDk50 : fVDk44) >= minC4VDk && edgeAvg >= minC4Edge && hiE >= 0.28 && stdLuma >= 23 && fWm < 0.14 && fMY < 0.12) {
      return 'c4';
    }

    if (fDk >= 0.50 && fMY < 0.22 && fBY < 0.05 && fWm < 0.12) {
      const charcoalEdge = step > 1 ? 15.0 : 18.0;
      return pWVD < 0.26 || edgeAvg < charcoalEdge ? 'gunpowder' : 'charcoal';
    }

    if ((fOre >= 0.20 || (fMY >= 0.24 && edgeAvg >= 6.0)) && stdLuma >= 17 && (edgeAvg >= 6.0 || hiE >= 0.16)) {
      return 'sulfur_ore';
    }
    return 'empty';
  }

  function parseStackDigitsText(rawStr) {
    const cleaned = String(rawStr || '').trim().replace(/^[x×*+]+/i, '').replace(/[,.\s]+/g, '');
    const m = cleaned.match(/\d{1,6}/);
    if (!m) return null;
    const val = parseInt(m[0], 10);
    return val > 0 && val <= 100000 ? val : null;
  }

  /**
   * Finds right-aligned cap-height digit components and suppresses leading
   * short lowercase `'x'` prefix + unrelated icon glare before OCR.
   */
  function extractRightDigitsFromGray(gray, upW, upH) {
    const compId = new Int32Array(upW * upH);
    const comps = [];
    const q = new Int32Array(upW * upH);
    for (let y = 0; y < upH; y++) {
      for (let x = 0; x < upW; x++) {
        const idx = y * upW + x;
        if (gray[idx] >= 140 || compId[idx]) continue;
        const id = comps.length + 1;
        let head = 0, tail = 0;
        q[tail++] = idx;
        compId[idx] = id;
        let minX = x, maxX = x, minY = y, maxY = y, area = 0;
        while (head < tail) {
          const cur = q[head++];
          const cx = cur % upW, cy = (cur / upW) | 0;
          area++;
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;
          for (let dy = -1; dy <= 1; dy++) {
            const ny = cy + dy;
            if (ny < 0 || ny >= upH) continue;
            for (let dx = -1; dx <= 1; dx++) {
              const nx = cx + dx;
              if (nx < 0 || nx >= upW) continue;
              const nIdx = ny * upW + nx;
              if (gray[nIdx] < 140 && !compId[nIdx]) {
                compId[nIdx] = id;
                q[tail++] = nIdx;
              }
            }
          }
        }
        comps.push({ id, minX, maxX, minY, maxY, w: maxX - minX + 1, h: maxY - minY + 1, area });
      }
    }

    const validComps = comps.filter((c) => c.area >= Math.max(6, upH * 0.30) && c.h >= upH * 0.25);
    if (!validComps.length) return { minX: 0, maxX: upW - 1, minY: 0, maxY: upH - 1 };

    const rightComps = validComps.filter((c) => c.maxX >= upW * 0.55);
    const refPool = rightComps.length ? rightComps : validComps;
    let maxH = 0;
    for (const c of refPool) if (c.h > maxH) maxH = c.h;

    const refTall = refPool.filter((c) => c.h >= maxH * 0.76);
    if (!refTall.length) return { minX: 0, maxX: upW - 1, minY: 0, maxY: upH - 1 };

    let capTop = upH, capBot = 0;
    for (const c of refTall) {
      if (c.minY < capTop) capTop = c.minY;
      if (c.maxY > capBot) capBot = c.maxY;
    }

    const allDigits = validComps.filter((c) =>
      c.h >= maxH * 0.72 &&
      c.minY <= capTop + maxH * 0.22 &&
      c.maxY >= capBot - maxH * 0.25 &&
      c.maxY <= capBot + maxH * 0.25
    );
    let leftDigitX = upW;
    for (const c of (allDigits.length ? allDigits : refTall)) {
      if (c.minX < leftDigitX) leftDigitX = c.minX;
    }

    const kept = new Uint8Array(comps.length + 1);
    let found = false;
    let bMinX = upW, bMaxX = 0, bMinY = upH, bMaxY = 0;
    for (const c of comps) {
      const overlapsY = c.maxY >= capTop - 2 && c.minY <= capBot + 2;
      const isComma = c.minX > leftDigitX && c.h >= upH * 0.08 && c.minY >= capTop + maxH * 0.45 && c.maxY <= capBot + Math.max(8, maxH * 0.35);
      if (c.minX >= leftDigitX - 2 && (c.h >= maxH * 0.65 || isComma) && overlapsY) {
        kept[c.id] = 1;
        found = true;
        if (c.minX < bMinX) bMinX = c.minX;
        if (c.maxX > bMaxX) bMaxX = c.maxX;
        if (c.minY < bMinY) bMinY = c.minY;
        if (c.maxY > bMaxY) bMaxY = c.maxY;
      }
    }
    if (!found) return { minX: 0, maxX: upW - 1, minY: 0, maxY: upH - 1 };

    for (let i = 0; i < upW * upH; i++) {
      if (compId[i] && !kept[compId[i]]) gray[i] = 255;
    }
    return {
      minX: Math.max(0, bMinX - 2),
      maxX: Math.min(upW - 1, bMaxX + 2),
      minY: Math.max(0, bMinY - 2),
      maxY: Math.min(upH - 1, bMaxY + 2)
    };
  }

  /**
   * Builds a high-contrast dark-on-white digit crop tuned for Rust stack labels.
   */
  function buildAdaptiveDigitTile(srcCanvas, sx, sy, rw, rh, scale, threshFrac = 0.52, options = {}) {
    const stripShortLeft = options.stripShortLeft !== false;
    const unsharp = options.unsharp ?? 0.35;
    const chromaPen = options.chromaPen ?? 0.50;
    const sctx = srcCanvas.getContext('2d', { willReadFrequently: true });
    const raw = sctx.getImageData(sx, sy, rw, rh).data;
    const nPx = rw * rh;
    const scores = new Float32Array(nPx);
    for (let i = 0; i < nPx; i++) {
      const p = i * 4;
      const r = raw[p], g = raw[p + 1], b = raw[p + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      const spread = Math.max(r, g, b) - Math.min(r, g, b);
      scores[i] = luma - spread * chromaPen;
    }

    const sharp = new Float32Array(nPx);
    for (let y = 0; y < rh; y++) {
      for (let x = 0; x < rw; x++) {
        const c = scores[y * rw + x];
        if (unsharp <= 0) {
          sharp[y * rw + x] = c;
          continue;
        }
        let sum = 0, cnt = 0;
        for (let dy = -1; dy <= 1; dy++) {
          const yy = Math.max(0, Math.min(rh - 1, y + dy));
          for (let dx = -1; dx <= 1; dx++) {
            const xx = Math.max(0, Math.min(rw - 1, x + dx));
            sum += scores[yy * rw + xx];
            cnt++;
          }
        }
        sharp[y * rw + x] = Math.max(0, Math.min(255, c + unsharp * (c - sum / cnt)));
      }
    }

    const sorted = Float32Array.from(sharp).sort();
    const bg = sorted[Math.floor(sorted.length * 0.45)] || 40;
    const hi = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.985))] || 220;
    const diff = hi - bg;
    const thresh = Math.max(82, Math.min(184, Math.round(bg + diff * threshFrac)));

    const rawC = document.createElement('canvas');
    rawC.width = rw;
    rawC.height = rh;
    const rctx = rawC.getContext('2d', { willReadFrequently: true });
    const rImg = rctx.createImageData(rw, rh);
    for (let i = 0; i < nPx; i++) {
      const v = Math.max(0, Math.min(255, Math.round(sharp[i])));
      const p = i * 4;
      rImg.data[p] = rImg.data[p + 1] = rImg.data[p + 2] = v;
      rImg.data[p + 3] = 255;
    }
    rctx.putImageData(rImg, 0, 0);

    const upW = Math.max(12, Math.round(rw * scale));
    const upH = Math.max(12, Math.round(rh * scale));
    const tmp = document.createElement('canvas');
    tmp.width = upW;
    tmp.height = upH;
    const tctx = tmp.getContext('2d', { willReadFrequently: true });
    tctx.fillStyle = '#000000';
    tctx.fillRect(0, 0, upW, upH);
    tctx.imageSmoothingEnabled = true;
    tctx.imageSmoothingQuality = 'high';
    tctx.drawImage(rawC, 0, 0, rw, rh, 0, 0, upW, upH);

    const td = tctx.getImageData(0, 0, upW, upH).data;
    const gray = new Uint8Array(upW * upH);
    for (let i = 0; i < upW * upH; i++) {
      const norm = Math.max(0, Math.min(1, (td[i * 4] - (thresh - 10)) / 20));
      gray[i] = Math.round((1 - norm) * 255);
    }

    const box = stripShortLeft
      ? extractRightDigitsFromGray(gray, upW, upH)
      : { minX: 0, maxX: upW - 1, minY: 0, maxY: upH - 1 };

    const cropW = Math.max(1, box.maxX - box.minX + 1);
    const cropH = Math.max(1, box.maxY - box.minY + 1);
    const padY = 18;
    const padX = Math.max(padY, Math.round(cropH * 1.1));
    const out = document.createElement('canvas');
    out.width = cropW + padX * 2;
    out.height = cropH + padY * 2;
    const octx = out.getContext('2d', { willReadFrequently: true });
    const oImg = octx.createImageData(out.width, out.height);
    const od = oImg.data;
    od.fill(255);
    for (let y = 0; y < cropH; y++) {
      for (let x = 0; x < cropW; x++) {
        const v = gray[(box.minY + y) * upW + (box.minX + x)];
        const p = ((y + padY) * out.width + (x + padX)) * 4;
        od[p] = od[p + 1] = od[p + 2] = v;
        od[p + 3] = 255;
      }
    }
    octx.putImageData(oImg, 0, 0);
    out._digDiff = diff;
    out._inkSpanFrac = cropW / Math.max(1, upW);
    return out;
  }

  let raidLastScanApplyMode = 'add';
  let raidBoxScanActive = false;

  function applyBoxSlotTagsToStash(applyMode = raidLastScanApplyMode) {
    if (!raidLastBoxSlotTags.length) return;
    if (!appState.raidStash) appState.raidStash = { ...DEFAULT_RAID_STASH };

    const sums = {};
    const slotCounts = {};
    raidLastBoxSlotTags.forEach((s) => {
      if (!s.key || s.key === 'empty') return;
      sums[s.key] = (sums[s.key] || 0) + (s.qty || 0);
      slotCounts[s.key] = (slotCounts[s.key] || 0) + 1;
    });

    const entries = Object.entries(sums).map(([key, qty]) => {
      const meta = STASH_ITEM_META[key];
      return {
        key,
        name: meta.name,
        qty,
        slots: slotCounts[key],
        sulfurEq: qty * (meta.sulfurEq || 0)
      };
    });

    if (applyMode === 'replace') {
      Object.keys(DEFAULT_RAID_STASH).forEach((k) => {
        appState.raidStash[k] = 0;
      });
    } else {
      // Remove previous items from THIS same box-scan batch before re-applying updated re-tags
      const prevBatch = raidScannedHistory.filter((ev) => ev.isBoxBatch);
      prevBatch.forEach((ev) => {
        appState.raidStash[ev.key] = Math.max(0, (appState.raidStash[ev.key] || 0) - ev.qty);
      });
    }

    raidScannedHistory = raidScannedHistory.filter((ev) => !ev.isBoxBatch);
    const { rows, cols } = getRaidBoxGridDims();

    entries.forEach((ent, i) => {
      const prevVal = Math.max(0, Number(appState.raidStash[ent.key]) || 0);
      appState.raidStash[ent.key] = applyMode === 'replace' ? ent.qty : prevVal + ent.qty;
      raidScannedHistory.unshift({
        id: 'rbox-' + Date.now() + '-' + i,
        key: ent.key,
        name: `${ent.name} (${ent.slots} slots)`,
        rawName: ent.name,
        slots: ent.slots,
        qty: ent.qty,
        sulfurEq: ent.sulfurEq,
        mode: applyMode === 'replace' ? 'set' : 'accumulate',
        prevVal,
        isBoxBatch: true,
        slotLabel: `Box Grid ${rows}×${cols}`
      });
    });

    drawRaidScannerPreview();
    renderRaidScannedFeed();
    renderRaidStashReadiness();
    syncStateToServer();
    return entries;
  }

  async function scanWholeRaidBoxGrid(srcEl, applyMode = 'add') {
    if (raidBoxScanActive) return;
    const statusEl = document.getElementById('raidScannerStatusMsg');
    const setStatus = (msg) => {
      if (statusEl) statusEl.textContent = msg;
    };

    raidBoxScanActive = true;
    const wasLiveBusy = raidLiveBusy;
    raidLiveBusy = true;

    try {
      const dims = getScannerSourceDimensions(srcEl);
      if (!dims.w || !dims.h) return;

      raidLastScanApplyMode = applyMode;
      const worker = await ensureRaidOcrWorker(setStatus);
      setStatus('📦 Analyzing all chest slots (Sulfur Ore, Sulfur, Gun Powder, Charcoal, Satchel, C4, Rockets, Explo)...');

      const fullCanvas = document.createElement('canvas');
      fullCanvas.width = dims.w;
      fullCanvas.height = dims.h;
      const fctx = fullCanvas.getContext('2d', { willReadFrequently: true });
      fctx.drawImage(srcEl, 0, 0, dims.w, dims.h);

      const boxRect =
        raidBoxGridRect && raidBoxGridRect.w >= 24 && raidBoxGridRect.h >= 24
          ? raidBoxGridRect
          : { x: 0, y: 0, w: dims.w, h: dims.h };

      const { rows, cols } = getRaidBoxGridDims();
      const cw = boxRect.w / cols;
      const ch = boxRect.h / rows;

      const slots = [];
      for (let r = 0; r < rows; r++) {
        for (let col = 0; col < cols; col++) {
          const bx0 = boxRect.x + col * cw;
          const by0 = boxRect.y + r * ch;
          const key = classifyRustBoxSlotPixels(fctx, bx0, by0, cw, ch, dims.w, dims.h);
          if (key !== 'empty') {
            slots.push({ row: r, col, key, qty: null });
          }
        }
      }

      if (!slots.length) {
        raidLastBoxSlotTags = [];
        drawRaidScannerPreview();
        setStatus('⚠️ No Sulfur / Ore / Boom slots detected inside box grid. Drag the green Calibrate Box Grid tightly over the chest slots.');
        return;
      }

      await worker.setParameters({ tessedit_char_whitelist: '0123456789,', tessedit_pageseg_mode: '7' });
      const subH = Math.max(7, Math.round(ch * 0.25));
      const scale = Math.max(1.8, Math.min(4.8, 34 / subH));

      const cropDigitTile = (r, col, xStartFrac, threshFrac = 0.52, options = {}) => {
        const sx = Math.max(0, Math.floor(boxRect.x + col * cw + cw * xStartFrac));
        const sy = Math.max(0, Math.floor(boxRect.y + r * ch + ch * 0.73));
        const rw = Math.max(4, Math.min(dims.w - sx, Math.round(cw * (0.99 - xStartFrac))));
        const rh = Math.max(4, Math.min(dims.h - sy, subH));
        return buildAdaptiveDigitTile(fullCanvas, sx, sy, rw, rh, scale, threshFrac, options);
      };

      const maxReasonableByKey = {
        c4: 100,
        satchel: 100,
        rocket: 64,
        hv_rocket: 64,
        incen_rocket: 64,
        beancan: 50,
        explo_ammo: 256,
        explosives: 500
      };
      const bulkStackKeys = new Set(['sulfur_ore', 'sulfur', 'gunpowder', 'charcoal']);

      for (let i = 0; i < slots.length; i++) {
        const s = slots[i];
        if (i === 0 || (i + 1) % 4 === 0 || i === slots.length - 1) {
          setStatus(`🔍 Reading stack numbers ${i + 1}/${slots.length}...`);
        }
        const tile = cropDigitTile(s.row, s.col, 0.36, 0.52);
        if ((tile._digDiff || 0) < 28) {
          s.qty = 1;
          continue;
        }

        const res = await worker.recognize(tile);
        let parsed = parseStackDigitsText(res?.data?.text);
        const cap = maxReasonableByKey[s.key];

        // Retry sharper and softer thresholds, then raw x-included right crop if missing or out-of-range
        if (parsed === null || parsed === 1 || (cap && parsed > cap)) {
          const retryPasses = [
            { xStart: 0.36, tf: 0.57, opts: {} },
            { xStart: 0.36, tf: 0.46, opts: {} },
          ];
          for (const pass of retryPasses) {
            const altTile = cropDigitTile(s.row, s.col, pass.xStart, pass.tf, pass.opts);
            const altRes = await worker.recognize(altTile);
            const altParsed = parseStackDigitsText(altRes?.data?.text);
            if (altParsed !== null && (!cap || altParsed <= cap)) {
              if (altParsed !== 1 || parsed === null || (cap && parsed > cap)) {
                parsed = altParsed;
              }
              if (parsed > 1) break;
            }
          }
          if (parsed === null || (cap && parsed > cap)) {
            await worker.setParameters({ tessedit_char_whitelist: '0123456789x,', tessedit_pageseg_mode: '7' });
            const rawTile = cropDigitTile(s.row, s.col, 0.46, 0.52, { stripShortLeft: false });
            const rawRes = await worker.recognize(rawTile);
            await worker.setParameters({ tessedit_char_whitelist: '0123456789,', tessedit_pageseg_mode: '7' });
            const rawParsed = parseStackDigitsText(rawRes?.data?.text);
            if (rawParsed !== null && (!cap || rawParsed <= cap)) {
              parsed = rawParsed;
            } else if (cap && parsed > cap) {
              parsed = null;
            }
          }
        }

        if (parsed !== null) {
          s.qty = parsed;
        } else if (bulkStackKeys.has(s.key) && (tile._digDiff || 0) >= 36 && (tile._inkSpanFrac || 0) >= 0.65) {
          s.qty = 1000;
        } else {
          s.qty = 1;
        }
      }

      await worker.setParameters({ tessedit_char_whitelist: '', tessedit_pageseg_mode: '3' });

      raidLastBoxSlotTags = slots.map((s) => ({ row: s.row, col: s.col, key: s.key, qty: s.qty }));
      // Clear any stale prior batch history before applying newly scanned box
      raidScannedHistory = raidScannedHistory.filter((ev) => !ev.isBoxBatch);
      const entries = applyBoxSlotTagsToStash(applyMode) || [];
      playAlertSound('urgent');

      const summaryStr = entries.map((e) => `${e.qty.toLocaleString()} ${e.name} (${e.slots} slots)`).join(' • ');
      setStatus(`✅ Scanned ${slots.length} slots: ${summaryStr}. Click any dropdown below or canvas slot to re-tag.`);
    } catch (err) {
      setStatus(`❌ Box scan failed: ${err?.message || err}`);
    } finally {
      raidBoxScanActive = false;
      raidLiveBusy = wasLiveBusy;
    }
  }
  function parseRaidLootFromOcrText(rawText) {
    const cleanText = String(rawText || '').replace(/\r/g, '');
    const lines = cleanText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const patterns = [
      { key: 'explo_ammo', rx: /EXPLOSIVE\s*5[.,]?\s*56|5[.,]?\s*56\s*RIFLE|EXPLO\s*5[.,]?\s*56|EXPLO\s*AMMO/i },
      { key: 'hv_rocket', rx: /HIGH\s*VELOC|HV\s*ROCKET/i },
      { key: 'incen_rocket', rx: /INCENDIARY\s*ROCKET|INCEN\s*ROCKET/i },
      { key: 'c4', rx: /TIMED\s*EXPLOSIVE|\bC4\b/i },
      { key: 'explosives', rx: /\bEXPLOSIVES?\b/i },
      { key: 'rocket', rx: /\bROCKETS?\b/i },
      { key: 'satchel', rx: /\bSATCHEL/i },
      { key: 'beancan', rx: /\bBEANCAN/i },
      { key: 'molotov', rx: /\bMOLOTOV/i },
      { key: 'sulfur_ore', rx: /(?:SULFUR|SULPHUR|5ULFUR)\s*(?:ORE|0RE)/i },
      { key: 'sulfur', rx: /\b(?:SULFUR|SULPHUR|5ULFUR)\b/i },
      { key: 'gunpowder', rx: /GUN\s*P[O0]WDER|\bGP\b/i },
      { key: 'charcoal', rx: /CHARC[O0]AL/i },
      { key: 'lgf', rx: /L[O0]W\s*GRADE|\bLGF\b/i }
    ];

    const extractQtyFromStr = (str) => {
      if (!str) return null;
      const sanitized = str
        .replace(/\b5[.,]\s*56\b/gi, ' ')
        .replace(/\b\d{1,3}\s*%/g, ' ')
        .replace(/\b\d{1,2}:\d{2}\b/g, ' ');
      const xMatch = sanitized.match(/(?:^|\s)[x×]\s*(\d[\d,.]*)/i);
      if (xMatch) {
        const val = parseInt(xMatch[1].replace(/[,.]/g, ''), 10);
        if (val > 0 && val <= 200000) return val;
      }
      const amtMatch = sanitized.match(/(?:AMOUNT|QTY|COUNT|STACK)\s*:?\s*(\d[\d,]*)/i);
      if (amtMatch) {
        const val = parseInt(amtMatch[1].replace(/,/g, ''), 10);
        if (val > 0 && val <= 200000) return val;
      }
      const nums = sanitized.match(/\b(\d{1,6})\b/g);
      if (nums && nums.length) {
        for (const nStr of nums) {
          const val = parseInt(nStr, 10);
          if (val > 0 && val <= 100000) return val;
        }
      }
      return null;
    };

    const detected = [];
    const seenKeys = new Set();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const p of patterns) {
        if (!p.rx.test(line)) continue;
        if (line.length > 65 && !/x\s*\d+/i.test(line)) continue;

        let qty = extractQtyFromStr(line);
        if (qty === null && i + 1 < lines.length) qty = extractQtyFromStr(lines[i + 1]);
        if (qty === null && i + 2 < lines.length) qty = extractQtyFromStr(lines[i + 2]);
        if (qty === null && i - 1 >= 0) qty = extractQtyFromStr(lines[i - 1]);
        if (qty === null) qty = ['c4', 'rocket', 'hv_rocket', 'incen_rocket', 'satchel', 'molotov'].includes(p.key) ? 1 : 0;

        if (qty > 0 && !seenKeys.has(p.key)) {
          seenKeys.add(p.key);
          const meta = STASH_ITEM_META[p.key];
          detected.push({
            key: p.key,
            name: meta.name,
            qty,
            sulfurEq: qty * (meta.sulfurEq || 0)
          });
        }
        break;
      }
    }

    return detected;
  }

  function renderRaidScannedFeed() {
    const feedEl = document.getElementById('raidScannedFeed');
    if (!feedEl) return;
    if (!raidScannedHistory.length) {
      feedEl.innerHTML = '';
      return;
    }

    const retagOptions = ['sulfur_ore', 'sulfur', 'gunpowder', 'charcoal', 'satchel', 'c4', 'explosives', 'rocket', 'explo_ammo'];

    feedEl.innerHTML = `
      <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-subtle); border-radius:6px; padding:8px 10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:6px;">
          <span style="font-family:var(--font-mono); font-size:11px; color:#4ade80; font-weight:700;">
            🧾 SCANNED STACKS LOG (${raidScannedHistory.length}) — CLICK TYPE TO RE-TAG IF NEEDED
          </span>
          <button id="raidClearFeedBtn" class="btn btn-sm" type="button">Clear Log</button>
        </div>
        <div style="display:flex; flex-direction:column; gap:4px; max-height:190px; overflow-y:auto;">
          ${raidScannedHistory
            .slice(0, 15)
            .map((ev) => {
              const selectHtml = ev.isBoxBatch
                ? `<select class="select raid-retag-group-select" data-old-key="${ev.key}" style="padding:2px 5px; font-size:11px;">
                     ${retagOptions
                       .map((k) => `<option value="${k}" ${k === ev.key ? 'selected' : ''}>${STASH_ITEM_META[k].name}</option>`)
                       .join('')}
                   </select>`
                : '';
              return `
                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap; padding:4px 8px; background:var(--bg-card); border-radius:4px; font-family:var(--font-mono); font-size:11.5px;">
                  <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                    <strong style="color:#fff;">${ev.mode === 'set' ? '=' : '+'}${ev.qty.toLocaleString()}</strong>
                    ${selectHtml || `<strong style="color:#fff;">${ev.name}</strong>`}
                    ${ev.isBoxBatch ? `<span class="text-xs text-muted">(${ev.slots} slots)</span>` : ''}
                    ${ev.sulfurEq > 0 ? `<span style="color:var(--sulfur-yellow);">(${ev.sulfurEq.toLocaleString()}S eq.)</span>` : ''}
                    ${ev.slotLabel ? `<span class="target-tier-tag" style="color:#4ade80;">📍 ${ev.slotLabel}</span>` : ''}
                  </div>
                  <button class="btn btn-sm raid-undo-scan-btn" data-scan-id="${ev.id}" type="button" title="Undo this scan">Undo</button>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>
    `;

    feedEl.querySelector('#raidClearFeedBtn')?.addEventListener('click', () => {
      raidScannedHistory = [];
      renderRaidScannedFeed();
    });

    feedEl.querySelectorAll('.raid-retag-group-select').forEach((sel) => {
      sel.addEventListener('change', () => {
        const oldKey = sel.getAttribute('data-old-key');
        const newKey = sel.value;
        if (!oldKey || !newKey || oldKey === newKey) return;
        raidLastBoxSlotTags.forEach((tag) => {
          if (tag.key === oldKey) tag.key = newKey;
        });
        applyBoxSlotTagsToStash(raidLastScanApplyMode);
      });
    });

    feedEl.querySelectorAll('.raid-undo-scan-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-scan-id');
        const idx = raidScannedHistory.findIndex((x) => x.id === id);
        if (idx < 0) return;
        const ev = raidScannedHistory[idx];
        if (!appState.raidStash) appState.raidStash = { ...DEFAULT_RAID_STASH };
        if (ev.mode === 'set') {
          appState.raidStash[ev.key] = Math.max(0, ev.prevVal || 0);
        } else {
          appState.raidStash[ev.key] = Math.max(0, (appState.raidStash[ev.key] || 0) - ev.qty);
        }
        raidScannedHistory.splice(idx, 1);
        renderRaidScannedFeed();
        renderRaidStashReadiness();
        syncStateToServer();
      });
    });
  }
  function applyDetectedStashEntries(entries, slotLabel = '', mode = 'accumulate') {
    if (!entries.length) return 0;
    if (!appState.raidStash) appState.raidStash = { ...DEFAULT_RAID_STASH };
    entries.forEach((ent, i) => {
      const prevVal = Math.max(0, Number(appState.raidStash[ent.key]) || 0);
      if (mode === 'set') {
        appState.raidStash[ent.key] = ent.qty;
      } else {
        appState.raidStash[ent.key] = prevVal + ent.qty;
      }
      raidScannedHistory.unshift({
        id: 'rs-' + Date.now() + '-' + i,
        key: ent.key,
        name: ent.name,
        qty: ent.qty,
        sulfurEq: ent.sulfurEq,
        mode,
        prevVal,
        slotLabel
      });
    });
    renderRaidScannedFeed();
    renderRaidStashReadiness();
    syncStateToServer();
    return entries.length;
  }

  function drawRaidScannerPreview() {
    const canvas = document.getElementById('raidScannerCanvas');
    const wrap = document.getElementById('raidScannerPreviewWrap');
    const clearBoxBtn = document.getElementById('raidClearBoxGridBtn');
    const dims = getScannerSourceDimensions(raidScannerImg);
    if (!canvas || !wrap || !raidScannerImg || !dims.w || !dims.h) return;

    wrap.style.display = 'block';
    canvas.width = dims.w;
    canvas.height = dims.h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(raidScannerImg, 0, 0, dims.w, dims.h);

    const effectiveBox =
      raidBoxGridRect && raidBoxGridRect.w > 12 && raidBoxGridRect.h > 12
        ? raidBoxGridRect
        : raidLastBoxSlotTags.length
        ? { x: 0, y: 0, w: dims.w, h: dims.h }
        : null;

    if (effectiveBox) {
      const { rows, cols } = getRaidBoxGridDims();
      const cw = effectiveBox.w / cols;
      const ch = effectiveBox.h / rows;
      ctx.save();
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.72)';
      ctx.lineWidth = Math.max(1.5, canvas.width / 700);
      ctx.strokeRect(effectiveBox.x, effectiveBox.y, effectiveBox.w, effectiveBox.h);
      for (let r = 1; r < rows; r++) {
        const y = effectiveBox.y + r * ch;
        ctx.beginPath();
        ctx.moveTo(effectiveBox.x, y);
        ctx.lineTo(effectiveBox.x + effectiveBox.w, y);
        ctx.stroke();
      }
      for (let c = 1; c < cols; c++) {
        const x = effectiveBox.x + c * cw;
        ctx.beginPath();
        ctx.moveTo(x, effectiveBox.y);
        ctx.lineTo(x, effectiveBox.y + effectiveBox.h);
        ctx.stroke();
      }
      if (raidLastBoxSlot) {
        const hx = effectiveBox.x + (raidLastBoxSlot.col - 1) * cw;
        const hy = effectiveBox.y + (raidLastBoxSlot.row - 1) * ch;
        ctx.fillStyle = 'rgba(74, 222, 128, 0.25)';
        ctx.fillRect(hx, hy, cw, ch);
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = Math.max(2.5, canvas.width / 320);
        ctx.strokeRect(hx, hy, cw, ch);
      }
      if (raidLastBoxSlotTags.length) {
        const fontSize = Math.max(9, Math.min(13, Math.round(cw * 0.2)));
        ctx.font = `700 ${fontSize}px monospace`;
        raidLastBoxSlotTags.forEach((tag) => {
          if (!tag.key || tag.key === 'empty') return;
          const meta = STASH_ITEM_META[tag.key] || { short: tag.key, color: '#fff' };
          const tx = effectiveBox.x + tag.col * cw + 2;
          const ty = effectiveBox.y + tag.row * ch + 2;
          const label = `${meta.short}:${tag.qty}`;
          const tw = ctx.measureText(label).width + 6;
          ctx.fillStyle = 'rgba(0,0,0,0.78)';
          ctx.fillRect(tx, ty, tw, fontSize + 4);
          ctx.fillStyle = meta.color;
          ctx.fillText(label, tx + 3, ty + fontSize);
        });
      }
      ctx.restore();
      if (clearBoxBtn && raidBoxGridRect) clearBoxBtn.style.display = 'inline-flex';
    } else if (clearBoxBtn) {
      clearBoxBtn.style.display = 'none';
    }

    if (raidScannerCropRect && raidScannerCropRect.w > 6 && raidScannerCropRect.h > 6) {
      ctx.save();
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = Math.max(2, canvas.width / 420);
      ctx.setLineDash([8, 5]);
      ctx.strokeRect(raidScannerCropRect.x, raidScannerCropRect.y, raidScannerCropRect.w, raidScannerCropRect.h);
      ctx.restore();
    }
  }

  async function scanRaidLootImage(srcEl, cropRect = null, opts = {}) {
    if (raidBoxScanActive) return;
    const statusEl = document.getElementById('raidScannerStatusMsg');
    const setStatus = (msg) => {
      if (statusEl) statusEl.textContent = msg;
    };
    const isLive = Boolean(opts.isLive);
    const autoAddLive = Boolean(opts.autoAddLive);
    const mode = document.getElementById('raidLiveScanModeSelect')?.value || 'accumulate';

    try {
      const dims = getScannerSourceDimensions(srcEl);
      if (!dims.w || !dims.h) return;

      // On static screenshots/drops with box-proportioned dimensions (or marked box grid without crop), run Whole-Box Grid Scanner automatically!
      const aspect = dims.w / dims.h;
      if (!isLive && !cropRect && (raidBoxGridRect || (aspect >= 0.50 && aspect <= 1.38))) {
        await scanWholeRaidBoxGrid(srcEl, mode === 'accumulate' ? 'add' : 'replace');
        return;
      }

      const worker = await ensureRaidOcrWorker(setStatus);
      await worker.setParameters({ tessedit_char_whitelist: '' });
      if (!isLive) setStatus('🔍 Scanning Rust image for Sulfur, Gun Powder & Boom...');

      const fullCanvas = document.createElement('canvas');
      fullCanvas.width = dims.w;
      fullCanvas.height = dims.h;
      fullCanvas.getContext('2d').drawImage(srcEl, 0, 0, dims.w, dims.h);

      const detectedSlot = raidBoxGridRect
        ? detectBoxGridSlot(fullCanvas, raidBoxGridRect, raidPrevBoxCanvas, { dims: getRaidBoxGridDims(), boxName: '' })
        : null;
      if (detectedSlot) raidLastBoxSlot = detectedSlot;

      let activeRect =
        cropRect && cropRect.w > 12 && cropRect.h > 12
          ? cropRect
          : dims.w >= 900 && dims.h >= 500
          ? {
              x: Math.round(dims.w * 0.25),
              y: Math.round(dims.h * 0.08),
              w: Math.round(dims.w * 0.45),
              h: Math.round(dims.h * 0.44)
            }
          : { x: 0, y: 0, w: dims.w, h: dims.h };

      if (isLive) {
        const sig = `${detectedSlot?.label || ''}|${computeCanvasRegionSig(fullCanvas, activeRect)}`;
        if (sig === raidLastLiveSig) return;
        raidLastLiveSig = sig;
      }
      raidPrevBoxCanvas = fullCanvas;

      let entries = [];
      const prep1 = buildOcrPrepCanvas(fullCanvas, activeRect, 'invGray');
      const res1 = await worker.recognize(prep1);
      entries = parseRaidLootFromOcrText(res1?.data?.text);

      if (!entries.length && !cropRect && !isLive && (activeRect.w !== dims.w || activeRect.h !== dims.h)) {
        const wholeRect = { x: 0, y: 0, w: dims.w, h: dims.h };
        const prepFull = buildOcrPrepCanvas(fullCanvas, wholeRect, 'invGray');
        const resFull = await worker.recognize(prepFull);
        entries = parseRaidLootFromOcrText(resFull?.data?.text);
      }

      if (entries.length > 0) {
        if (!isLive || autoAddLive) {
          applyDetectedStashEntries(entries, detectedSlot?.label || '', mode);
          if (isLive) playAlertSound('urgent');
          const summary = entries.map((e) => `${e.qty.toLocaleString()} ${e.name}`).join(', ');
          const locSuffix = detectedSlot?.label ? ` at 📍 ${detectedSlot.label}` : '';
          setStatus(`${isLive ? '🟢 LIVE' : '✅'} Scanned: ${summary}${locSuffix}`);
        }
      } else if (!isLive) {
        setStatus('⚠️ No item inspect header found. If this is a full chest screenshot, mark the green Box Grid and click "📦 Scan Whole Box Grid".');
      }
    } catch (err) {
      setStatus(`❌ Stash scan failed: ${err?.message || err}`);
    }
  }

  function stopRaidLiveScan() {
    if (raidLiveTimer) {
      clearInterval(raidLiveTimer);
      raidLiveTimer = null;
    }
    if (raidLiveStream) {
      raidLiveStream.getTracks().forEach((t) => t.stop());
      raidLiveStream = null;
    }
    raidLiveBusy = false;
    raidLiveAutoLoadedGrid = false;
    raidPrevBoxCanvas = null;
    raidLastBoxSlot = null;
    const video = document.getElementById('raidLiveScanVideo');
    if (video) video.srcObject = null;
    const startBtn = document.getElementById('raidLiveScanStartBtn');
    const stopBtn = document.getElementById('raidLiveScanStopBtn');
    const badge = document.getElementById('raidLiveScanBadge');
    const statusEl = document.getElementById('raidScannerStatusMsg');
    if (startBtn) startBtn.style.display = 'inline-flex';
    if (stopBtn) stopBtn.style.display = 'none';
    if (badge) badge.style.display = 'none';
    if (statusEl && statusEl.textContent.includes('LIVE')) {
      statusEl.textContent = '⏹ Live Stash scan stopped.';
    }
  }

  async function startRaidLiveScan() {
    if (typeof stopLiveRustScan === 'function') stopLiveRustScan();
    const panel = document.getElementById('raidScannerPanel');
    if (panel) panel.style.display = 'block';

    const statusEl = document.getElementById('raidScannerStatusMsg');
    const setStatus = (msg) => {
      if (statusEl) statusEl.textContent = msg;
    };

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      const origin = window.location.origin && window.location.origin !== 'null' ? window.location.origin : window.location.href;
      if (statusEl) {
        statusEl.innerHTML = `
          <div style="padding:10px 12px; border-radius:6px; background:rgba(239,68,68,0.14); border:1px solid rgba(239,68,68,0.55); color:#fecaca; font-family:var(--font-sans); font-size:12px; line-height:1.45;">
            ⚠️ <strong>Browser blocked Live Screen Capture on plain HTTP / local file!</strong> Chrome &amp; Edge require <code>https://</code> or <code>http://localhost</code>.<br/>
            • Enable <code>chrome://flags/#unsafely-treat-insecure-origin-as-secure</code> with <code>${origin}</code> or paste a chest screenshot with <kbd>Ctrl+V</kbd>!
          </div>
        `;
      }
      return;
    }

    stopRaidLiveScan();
    raidLastLiveSig = '';
    raidLastBoxSlotTags = [];

    try {
      setStatus('🪟 Pick your Rust game window (or monitor) in the browser prompt...');
      raidLiveStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'never', frameRate: { ideal: 10, max: 15 } },
        audio: false
      });
    } catch (err) {
      setStatus(`⚠️ Window share cancelled: ${err?.message || 'Permission declined'}`);
      return;
    }

    const video = document.getElementById('raidLiveScanVideo');
    if (!video) return;
    video.srcObject = raidLiveStream;
    try {
      await video.play();
    } catch (_) {}

    const track = raidLiveStream.getVideoTracks()[0];
    if (track) track.addEventListener('ended', stopRaidLiveScan, { once: true });

    document.getElementById('raidLiveScanStartBtn')?.style && (document.getElementById('raidLiveScanStartBtn').style.display = 'none');
    document.getElementById('raidLiveScanStopBtn')?.style && (document.getElementById('raidLiveScanStopBtn').style.display = 'inline-flex');
    document.getElementById('raidLiveScanBadge')?.style && (document.getElementById('raidLiveScanBadge').style.display = 'inline-flex');

    try {
      await ensureRaidOcrWorker(setStatus);
    } catch (err) {
      stopRaidLiveScan();
      setStatus(`❌ Failed to load OCR engine: ${err?.message || err}`);
      return;
    }

    raidScannerImg = video;
    raidScannerCropRect = null;
    raidBoxGridRect = null;
    raidLiveAutoLoadedGrid = false;
    const initDims = getScannerSourceDimensions(video);
    if (initDims.w > 0 && initDims.h > 0) {
      const loaded = applyPreloadedRaidBoxGrid(initDims, { isLive: true });
      if (loaded) raidLiveAutoLoadedGrid = true;
    }
    drawRaidScannerPreview();
    setStatus(
      raidBoxGridRect
        ? '🔴 LIVE: Box Grid pre-loaded over your chest! Open a box in Rust and click "📦 Scan Whole Box Grid" (or drag to adjust).'
        : '🔴 LIVE: Click items OR mark the green Box Grid over your chest and click "📦 Scan Whole Box Grid"!'
    );

    raidLiveTimer = setInterval(async () => {
      if (!raidLiveStream || raidLiveBusy || video.readyState < 2) return;
      raidLiveBusy = true;
      try {
        raidScannerImg = video;
        if (!raidLiveAutoLoadedGrid) {
          const liveDims = getScannerSourceDimensions(video);
          if (liveDims.w > 0 && liveDims.h > 0) {
            raidLiveAutoLoadedGrid = true;
            if (!raidBoxGridRect && !raidScannerCropRect) {
              const loaded = applyPreloadedRaidBoxGrid(liveDims, { isLive: true });
              if (loaded) {
                setStatus(`🔴 LIVE: Pre-loaded ${loaded.source === 'saved' ? 'saved' : 'Rust preset'} ${loaded.layout} grid — open your chest & click "📦 Scan Whole Box Grid"!`);
              }
            }
          }
        }
        drawRaidScannerPreview();
        const autoAddLive = Boolean(document.getElementById('raidLiveScanAutoAddCb')?.checked ?? true);
        await scanRaidLootImage(video, raidScannerCropRect, { isLive: true, autoAddLive });
      } finally {
        raidLiveBusy = false;
      }
    }, 750);
  }

  function loadRaidImageFile(file) {
    return new Promise((resolve) => {
      if (!file || !file.type.startsWith('image/')) {
        resolve();
        return;
      }
      stopRaidLiveScan();
      const panel = document.getElementById('raidScannerPanel');
      if (panel) panel.style.display = 'block';
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = async () => {
          raidScannerImg = img;
          raidScannerCropRect = null;
          raidLastBoxSlotTags = [];
          const dims = getScannerSourceDimensions(img);
          if (isWidescreenGameFrame(dims)) {
            applyPreloadedRaidBoxGrid(dims);
          } else {
            raidBoxGridRect = null;
          }
          drawRaidScannerPreview();
          await scanRaidLootImage(img, null, { isLive: false });
          resolve();
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function initRaidStashModule() {
    document.querySelectorAll('#raidStashInputs input[data-stash-key]').forEach((inp) => {
      inp.addEventListener('input', () => {
        if (!appState.raidStash) appState.raidStash = { ...DEFAULT_RAID_STASH };
        const key = inp.getAttribute('data-stash-key');
        appState.raidStash[key] = Math.max(0, Math.floor(Number(inp.value) || 0));
        renderRaidStashReadiness();
        syncStateToServer();
      });
    });

    document.getElementById('raidIncludeUncookedCb')?.addEventListener('change', renderRaidStashReadiness);
    document.getElementById('raidFurnaceCountSelect')?.addEventListener('change', renderRaidStashReadiness);

    document.getElementById('resetRaidStashBtn')?.addEventListener('click', () => {
      appState.raidStash = { ...DEFAULT_RAID_STASH };
      raidScannedHistory = [];
      raidLastBoxSlotTags = [];
      drawRaidScannerPreview();
      renderRaidScannedFeed();
      renderRaidStashReadiness();
      syncStateToServer();
    });

    const panel = document.getElementById('raidScannerPanel');
    document.getElementById('raidToggleScannerBtn')?.addEventListener('click', () => {
      if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
    document.getElementById('raidLiveScanToggleBtn')?.addEventListener('click', () => {
      if (panel) panel.style.display = 'block';
      startRaidLiveScan();
    });
    document.getElementById('raidLiveScanStartBtn')?.addEventListener('click', startRaidLiveScan);
    document.getElementById('raidLiveScanStopBtn')?.addEventListener('click', stopRaidLiveScan);
    document.getElementById('raidCloseScannerBtn')?.addEventListener('click', () => {
      stopRaidLiveScan();
      if (panel) panel.style.display = 'none';
    });

    const fileInput = document.getElementById('raidScanFileInput');
    document.getElementById('raidPickScanFilesBtn')?.addEventListener('click', () => fileInput?.click());
    const handleFiles = async (fileList) => {
      const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
      for (const f of files) await loadRaidImageFile(f);
    };
    fileInput?.addEventListener('change', async (e) => {
      await handleFiles(e.target.files);
      fileInput.value = '';
    });

    const dropZone = document.getElementById('raidScannerDropZone');
    if (dropZone) {
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });
      dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
      dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        await handleFiles(e.dataTransfer?.files);
      });
    }

    document.addEventListener('paste', async (e) => {
      if (!document.getElementById('tab-raid')?.classList.contains('active')) return;
      const items = Array.from(e.clipboardData?.items || []);
      const imgItem = items.find((it) => it.type.startsWith('image/'));
      if (!imgItem) return;
      e.preventDefault();
      const file = imgItem.getAsFile();
      if (file) await loadRaidImageFile(file);
    });

    const boxBtn = document.getElementById('raidDragModeBoxBtn');
    const inspectBtn = document.getElementById('raidDragModeInspectBtn');
    const setDragMode = (m) => {
      raidDragMode = m;
      boxBtn?.classList.toggle('btn-sulfur', m === 'box');
      inspectBtn?.classList.toggle('btn-sulfur', m === 'inspect');
    };
    boxBtn?.addEventListener('click', () => setDragMode('box'));
    inspectBtn?.addEventListener('click', () => setDragMode('inspect'));

    document.getElementById('raidScannerBoxLayoutSelect')?.addEventListener('change', () => {
      raidLastBoxSlot = null;
      raidLastBoxSlotTags = [];
      let loaded = null;
      if (raidScannerImg) {
        const dims = getScannerSourceDimensions(raidScannerImg);
        if (raidLiveStream || isWidescreenGameFrame(dims)) {
          loaded = applyPreloadedRaidBoxGrid(dims, { isLive: Boolean(raidLiveStream) });
        } else {
          raidBoxGridRect = null;
        }
      }
      drawRaidScannerPreview();
      if (loaded) {
        const statusEl = document.getElementById('raidScannerStatusMsg');
        if (statusEl) {
          const srcLabel = loaded.source === 'saved' ? 'saved custom' : 'standard Rust';
          statusEl.textContent = `🎯 Pre-loaded ${srcLabel} ${loaded.layout} Box Grid — click "📦 Scan Whole Box Grid" (or drag to fine-tune).`;
        }
      }
    });
    document.getElementById('raidPresetBoxGridBtn')?.addEventListener('click', () => {
      const layoutVal = document.getElementById('raidScannerBoxLayoutSelect')?.value || '8x6';
      clearSavedRaidBoxGridNorm(layoutVal);
      const statusEl = document.getElementById('raidScannerStatusMsg');
      if (raidScannerImg) {
        const dims = getScannerSourceDimensions(raidScannerImg);
        applyPreloadedRaidBoxGrid(dims, { forcePreset: true, isLive: Boolean(raidLiveStream) });
        raidLastBoxSlot = null;
        drawRaidScannerPreview();
        if (statusEl) {
          statusEl.textContent = `🎯 Pre-loaded standard Rust ${layoutVal} Box Grid — click "📦 Scan Whole Box Grid" (or drag to fine-tune).`;
        }
      } else if (statusEl) {
        statusEl.textContent = `🎯 Cleared any saved ${layoutVal} override — load a screenshot or start Live Scan to preview the Rust preset grid.`;
      }
    });
    document.getElementById('raidClearBoxGridBtn')?.addEventListener('click', () => {
      const layoutVal = document.getElementById('raidScannerBoxLayoutSelect')?.value || '8x6';
      clearSavedRaidBoxGridNorm(layoutVal);
      raidBoxGridRect = null;
      raidLastBoxSlot = null;
      raidLastBoxSlotTags = [];
      drawRaidScannerPreview();
      const statusEl = document.getElementById('raidScannerStatusMsg');
      if (statusEl) {
        statusEl.textContent = 'Grid cleared. Click "🎯 Rust Preset" to restore the default chest grid or drag a custom box.';
      }
    });
    document.getElementById('raidClearCropBtn')?.addEventListener('click', () => {
      raidScannerCropRect = null;
      raidLastLiveSig = '';
      drawRaidScannerPreview();
    });
    document.getElementById('raidScanBoxBtn')?.addEventListener('click', () => {
      if (raidScannerImg) {
        const mode = document.getElementById('raidLiveScanModeSelect')?.value || 'accumulate';
        scanWholeRaidBoxGrid(raidScannerImg, mode === 'accumulate' ? 'add' : 'replace');
      }
    });
    document.getElementById('raidRescanBtn')?.addEventListener('click', () => {
      if (raidScannerImg) {
        raidLastLiveSig = '';
        scanRaidLootImage(raidScannerImg, raidScannerCropRect || { x: 0, y: 0, w: raidScannerImg.videoWidth || raidScannerImg.naturalWidth, h: raidScannerImg.videoHeight || raidScannerImg.naturalHeight }, {
          isLive: Boolean(raidLiveStream),
          autoAddLive: Boolean(raidLiveStream && document.getElementById('raidLiveScanAutoAddCb')?.checked)
        });
      }
    });

    const canvas = document.getElementById('raidScannerCanvas');
    if (canvas) {
      let dragging = false;
      let startPt = null;
      const toCoords = (evt) => {
        const r = canvas.getBoundingClientRect();
        return {
          x: Math.max(0, Math.min(canvas.width, ((evt.clientX - r.left) / r.width) * canvas.width)),
          y: Math.max(0, Math.min(canvas.height, ((evt.clientY - r.top) / r.height) * canvas.height))
        };
      };
      canvas.addEventListener('pointerdown', (e) => {
        if (!raidScannerImg) return;
        dragging = true;
        startPt = toCoords(e);
        canvas.setPointerCapture?.(e.pointerId);
      });
      canvas.addEventListener('pointermove', (e) => {
        if (!dragging || !startPt) return;
        const cur = toCoords(e);
        const rect = {
          x: Math.min(startPt.x, cur.x),
          y: Math.min(startPt.y, cur.y),
          w: Math.abs(cur.x - startPt.x),
          h: Math.abs(cur.y - startPt.y)
        };
        if (raidDragMode === 'box') raidBoxGridRect = rect;
        else raidScannerCropRect = rect;
        drawRaidScannerPreview();
      });
      canvas.addEventListener('pointerup', (e) => {
        const endPt = toCoords(e);
        const moveDist = startPt ? Math.hypot(endPt.x - startPt.x, endPt.y - startPt.y) : 99;
        dragging = false;
        if (moveDist <= 5 && raidLastBoxSlotTags.length) {
          const dims = getScannerSourceDimensions(raidScannerImg);
          const effBox =
            raidBoxGridRect && raidBoxGridRect.w >= 24 && raidBoxGridRect.h >= 24
              ? raidBoxGridRect
              : { x: 0, y: 0, w: dims.w, h: dims.h };
          const { rows, cols } = getRaidBoxGridDims();
          const col = Math.floor(((endPt.x - effBox.x) / effBox.w) * cols);
          const row = Math.floor(((endPt.y - effBox.y) / effBox.h) * rows);
          const slotTag = raidLastBoxSlotTags.find((t) => t.row === row && t.col === col);
          if (slotTag) {
            const cycle = ['sulfur_ore', 'sulfur', 'gunpowder', 'charcoal', 'satchel', 'c4', 'explosives', 'rocket', 'explo_ammo', 'empty'];
            const nextIdx = (cycle.indexOf(slotTag.key) + 1) % cycle.length;
            slotTag.key = cycle[nextIdx];
            applyBoxSlotTagsToStash(raidLastScanApplyMode);
            return;
          }
        }
        if (raidDragMode === 'box' && raidBoxGridRect && (raidBoxGridRect.w < 20 || raidBoxGridRect.h < 20)) {
          raidBoxGridRect = null;
        } else if (raidDragMode === 'box' && raidBoxGridRect && moveDist > 5) {
          const dims = getScannerSourceDimensions(raidScannerImg);
          const layoutVal = document.getElementById('raidScannerBoxLayoutSelect')?.value || '8x6';
          if (raidLiveStream || isWidescreenGameFrame(dims)) {
            saveRaidBoxGridNorm(layoutVal, raidBoxGridRect, dims);
            const statusEl = document.getElementById('raidScannerStatusMsg');
            if (statusEl) {
              statusEl.textContent = `📌 Saved custom ${layoutVal} Box Grid — it will auto-load next time!`;
            }
          }
        }
        if (raidDragMode === 'inspect' && raidScannerCropRect && (raidScannerCropRect.w < 12 || raidScannerCropRect.h < 12)) {
          raidScannerCropRect = null;
        }
        drawRaidScannerPreview();
      });
    }

    renderRaidStashReadiness();
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

      const realMatches =
        bfMapData && Array.isArray(bfMapData.monuments)
          ? bfMapData.monuments.filter((rm) => {
              const rt = String(rm.type || '').toLowerCase();
              const mn = String(m.name || '').toLowerCase();
              return rt.includes(mn) || mn.includes(rt) || (m.id === 'powerplant' && rt.includes('powerplant')) || (m.id === 'dome' && rt.includes('sphere tank')) || (m.id === 'water_treatment' && rt.includes('water treatment'));
            })
          : [];
      const selSpot = getSelectedBuildSpot();
      const gridBadgeText =
        realMatches.length > 0
          ? realMatches
              .map((rm) => {
                const g = bfWorldToGrid(rm.x, rm.y, bfMapData.size);
                const d = selSpot ? ` (${Math.round(Math.hypot(rm.x - selSpot.wx, rm.y - selSpot.wy))}m)` : '';
                return `[${g}]${d}`;
              })
              .join(' • ')
          : `[${m.defaultPos.grid}]`;

      detailEl.innerHTML = `
        <div style="background:linear-gradient(155deg, rgba(205,65,43,0.14), var(--bg-card)); border:1px solid var(--rust-orange); border-radius:8px; padding:14px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; flex-wrap:wrap;">
            <div>
              <div style="font-family:var(--font-display); font-size:18px; font-weight:700; color:#fff;">
                🏛️ ${m.name} <span style="font-family:var(--font-mono); font-size:12px; color:var(--sulfur-yellow);">${gridBadgeText}</span>
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

  const GENE_WEIGHT_MAP = { G: 0.6, Y: 0.6, H: 0.6, W: 1.0, X: 1.0 };
  let selectedRecipeIdx = 0;
  let lastSolvedRecipes = [];
  let lastSolvedCrop = 'Hemp';
  let lastCloneNumMap = new Map();
  let lastCloneLocMap = new Map();
  let lastHighlightedGenes = new Set();

  function geneCounts(genes) {
    let g = 0;
    let y = 0;
    let h = 0;
    let w = 0;
    let x = 0;
    for (let i = 0; i < genes.length; i++) {
      const c = genes[i];
      if (c === 'G') g++;
      else if (c === 'Y') y++;
      else if (c === 'H') h++;
      else if (c === 'W') w++;
      else if (c === 'X') x++;
    }
    return { g, y, h, w, x, bad: w + x };
  }

  function isGodCloneForGoal(genes, targetGoal) {
    if (!genes || genes.length !== 6) return false;
    const c = geneCounts(genes);
    if (c.bad > 0) return false;
    if (targetGoal === 'YYYYGG') return c.y >= 4 && c.g >= 2;
    if (targetGoal === 'GGGGYY') return c.g >= 4 && c.y >= 2;
    if (targetGoal === 'GGGYHY') return c.g >= 3 && c.y >= 2 && c.h >= 1;
    if (targetGoal === 'CUSTOM') return c.bad === 0 && (c.g + c.y) >= 5;
    return c.g === 3 && c.y === 3;
  }

  function getGeneticsFilters() {
    const parseOptInt = (id) => {
      const raw = document.getElementById(id)?.value?.trim();
      if (raw === '' || raw === undefined) return null;
      const n = parseInt(raw, 10);
      return Number.isNaN(n) ? null : Math.max(0, Math.min(6, n));
    };
    const minD = Math.max(2, Math.min(8, parseInt(document.getElementById('geneticsMinDonors')?.value, 10) || 2));
    const maxD = Math.max(minD, Math.min(8, parseInt(document.getElementById('geneticsMaxDonors')?.value, 10) || 5));
    const maxGen = parseInt(document.getElementById('geneticsMaxGen')?.value, 10) === 1 ? 1 : 2;
    const slotTargets = [1, 2, 3, 4, 5, 6].map((idx) => {
      const v = (document.getElementById(`filterSlot${idx}`)?.value || '').toUpperCase().trim();
      return /^[GYHWX]$/.test(v) ? v : '';
    });
    return {
      targetGoal: document.getElementById('geneticsTargetGoal')?.value || 'GGGYYY',
      minDonors: minD,
      maxDonors: maxD,
      maxGen,
      allowDupes: Boolean(document.getElementById('geneticsAllowDupesCb')?.checked ?? true),
      exactG: parseOptInt('filterCountG'),
      exactY: parseOptInt('filterCountY'),
      exactH: parseOptInt('filterCountH'),
      slotTargets,
      minChance: parseFloat(document.getElementById('filterMinChance')?.value || '0') || 0
    };
  }

  function hasActiveResultFilter(f) {
    return (
      f.exactG !== null ||
      f.exactY !== null ||
      f.exactH !== null ||
      f.slotTargets.some(Boolean) ||
      f.minChance > 0
    );
  }

  function matchesResultFilters(genes, exactChance, f) {
    if (exactChance + 1e-6 < f.minChance) return false;
    const c = geneCounts(genes);
    if (f.exactG !== null && c.g !== f.exactG) return false;
    if (f.exactY !== null && c.y !== f.exactY) return false;
    if (f.exactH !== null && c.h !== f.exactH) return false;
    for (let i = 0; i < 6; i++) {
      if (f.slotTargets[i] && genes[i] !== f.slotTargets[i]) return false;
    }
    return true;
  }

  function scoreCloneAgainstTarget(genes, targetGoal, exactChance = 1, genSteps = 1, donorCount = 4, filters = null) {
    const c = geneCounts(genes);
    const goalPattern = targetGoal === 'CUSTOM' ? 'GGGYYY' : targetGoal;
    const tc = geneCounts(goalPattern);
    const isGod = isGodCloneForGoal(genes, targetGoal);

    let score = c.g * 16 + c.y * 16 + c.h * 9 - c.x * 22 - c.w * 24;
    if (targetGoal !== 'CUSTOM') {
      score -= Math.abs(c.g - tc.g) * 6 + Math.abs(c.y - tc.y) * 6 + Math.abs(c.h - tc.h) * 4;
    } else if (filters) {
      if (filters.exactG !== null) score -= Math.abs(c.g - filters.exactG) * 14;
      if (filters.exactY !== null) score -= Math.abs(c.y - filters.exactY) * 14;
      if (filters.exactH !== null) score -= Math.abs(c.h - filters.exactH) * 14;
      for (let i = 0; i < 6; i++) {
        if (filters.slotTargets[i] && genes[i] === filters.slotTargets[i]) score += 18;
      }
    }

    if (isGod) {
      score += exactChance === 1 ? 520 : 190 * exactChance;
    } else if (c.bad === 0 && exactChance === 1) {
      score += 85;
    }
    score += exactChance * 45;
    score -= (genSteps - 1) * 30;
    score -= donorCount * 0.25;
    return score;
  }

  function simulateCrossbreed(centerGenes, donorClones, targetGoal = 'GGGYYY') {
    const resultGenes = [];
    const slotBreakdown = [];
    let exactChance = 1;
    let canUseAnyCenter = true;
    const tc = geneCounts(targetGoal === 'CUSTOM' ? 'GGGYYY' : targetGoal);
    const preferOrder = tc.y > tc.g ? ['Y', 'G', 'H', 'X', 'W'] : ['G', 'Y', 'H', 'X', 'W'];

    for (let slot = 0; slot < 6; slot++) {
      const centerGene = centerGenes[slot];
      const centerWeight = GENE_WEIGHT_MAP[centerGene] || DATA.geneWeights[centerGene]?.weight || 0.6;
      const totals = {};

      donorClones.forEach((d) => {
        const g = d[slot];
        const w = GENE_WEIGHT_MAP[g] || DATA.geneWeights[g]?.weight || 0.6;
        totals[g] = Number(((totals[g] || 0) + w).toFixed(2));
      });

      let maxDonorWeight = 0;
      Object.values(totals).forEach((w) => {
        if (w > maxDonorWeight) maxDonorWeight = w;
      });

      if (maxDonorWeight <= 1.0) {
        canUseAnyCenter = false;
      }

      let finalGene = centerGene;
      let tiedGenes = [centerGene];
      let slotChance = 1;
      let winningWeight = centerWeight;

      if (maxDonorWeight > centerWeight) {
        tiedGenes = Object.entries(totals)
          .filter(([, w]) => w === maxDonorWeight)
          .map(([g]) => g);
        tiedGenes.sort((a, b) => preferOrder.indexOf(a) - preferOrder.indexOf(b));
        finalGene = tiedGenes[0];
        slotChance = 1 / tiedGenes.length;
        winningWeight = maxDonorWeight;
        exactChance *= slotChance;
      }

      resultGenes.push(finalGene);
      slotBreakdown.push({
        slot: slot + 1,
        centerGene,
        winningGene: finalGene,
        tiedGenes,
        slotChance,
        winningWeight,
        totals
      });
    }

    return {
      offspring: resultGenes.join(''),
      exactChance,
      canUseAnyCenter,
      slotBreakdown
    };
  }

  function generateDonorCombos(pool, allowDupes, minDonors = 2, maxDonors = 5) {
    const n = pool.length;
    const combos = [];
    const seenKeys = new Set();
    const addCombo = (arr) => {
      if (arr.length < minDonors || arr.length > maxDonors) return;
      const key = [...arr].sort().join('|');
      if (seenKeys.has(key)) return;
      seenKeys.add(key);
      combos.push(arr);
    };

    // 1. Subsets of distinct saved clones
    const capN = Math.min(n, 10);
    const maxMask = 1 << capN;
    for (let mask = 1; mask < maxMask; mask++) {
      const subset = [];
      for (let j = 0; j < capN; j++) {
        if (mask & (1 << j)) subset.push(pool[j]);
      }
      addCombo(subset);
    }

    // 2. Combinations with duplicate cloned donors
    if (allowDupes && n > 0) {
      const dupePool = pool.slice(0, Math.min(n, 7));
      const m = dupePool.length;
      const rec = (startIdx, cur, targetLen) => {
        if (cur.length === targetLen) {
          addCombo([...cur]);
          return;
        }
        for (let i = startIdx; i < m; i++) {
          cur.push(dupePool[i]);
          rec(i, cur, targetLen);
          cur.pop();
        }
      };
      const maxRepLen = Math.min(maxDonors, m <= 5 ? 5 : 4);
      for (let len = minDonors; len <= maxRepLen; len++) {
        rec(0, [], len);
      }
      if (maxDonors >= 5 && m >= 2 && m <= 6) {
        for (let i = 0; i < m; i++) {
          for (let j = i; j < m; j++) {
            const p0 = dupePool[0];
            const p1 = dupePool[Math.min(1, m - 1)];
            if (maxDonors >= 6) {
              addCombo([dupePool[i], dupePool[i], dupePool[j], dupePool[j], p0, p1].slice(0, maxDonors));
            }
            if (maxDonors >= 8) {
              addCombo([dupePool[i], dupePool[i], dupePool[j], dupePool[j], p0, p0, p1, p1]);
            }
          }
        }
      }
    }
    return combos;
  }

  function findBestSingleStepPlans(centers, donorPool, filters, genSteps = 1) {
    const donorCombos = generateDonorCombos(donorPool, filters.allowDupes, filters.minDonors, filters.maxDonors);
    const allPlans = [];
    const topByOffspring = new Map();

    for (const centerGenes of centers) {
      for (const donors of donorCombos) {
        const sim = simulateCrossbreed(centerGenes, donors, filters.targetGoal);
        const score = scoreCloneAgainstTarget(
          sim.offspring,
          filters.targetGoal,
          sim.exactChance,
          genSteps,
          donors.length,
          filters
        );
        const plan = {
          centerGenes,
          donors,
          offspring: sim.offspring,
          exactChance: sim.exactChance,
          canUseAnyCenter: sim.canUseAnyCenter,
          slotBreakdown: sim.slotBreakdown,
          score
        };
        allPlans.push(plan);
        const prev = topByOffspring.get(sim.offspring);
        if (!prev || score > prev.score) {
          topByOffspring.set(sim.offspring, plan);
        }
      }
    }

    allPlans.sort((a, b) => b.score - a.score);
    const intermediates = Array.from(topByOffspring.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
    return { topPlans: allPlans.slice(0, 40), intermediates };
  }

  function formatCloneRef(genes, cloneNumMap, cloneLocMap = lastCloneLocMap) {
    const num = cloneNumMap.get(genes);
    const loc = cloneLocMap?.get(genes);
    const base = num ? `#${num} ${genes}` : `${genes} (GEN.1)`;
    return loc ? `${base} [${loc}]` : base;
  }

  function renderPlanterStepHtml(plan, badgeText, headingText, cloneNumMap, borderColor = 'rgba(34,197,94,0.45)') {
    const gc = geneCounts(plan.offspring);
    const greenCount = gc.g + gc.y + gc.h;
    const chancePct = Math.round(plan.exactChance * 100);
    const chanceBadge =
      chancePct === 100
        ? `<span class="keycard-tag keycard-Green">🟢 100% GUARANTEED</span>`
        : `<span class="keycard-tag keycard-Fuse">🟡 ${chancePct}% CHANCE (RNG TIE IN ${plan.slotBreakdown.filter((s) => s.tiedGenes.length > 1).map((s) => '#' + s.slot).join(', ')})</span>`;

    const anyCenterBadge = plan.canUseAnyCenter
      ? `<span class="keycard-tag" style="background:rgba(56,189,248,0.16); color:#7dd3fc; border:1px solid rgba(56,189,248,0.45);">🌱 ANY SPARE SEED/CLONE IN CENTER</span>`
      : '';

    const cellsHtml = [];
    let dIdx = 0;
    for (let i = 0; i < 9; i++) {
      if (i === 4) {
        const centerNum = cloneNumMap.get(plan.centerGenes);
        const centerLoc = !plan.canUseAnyCenter ? lastCloneLocMap.get(plan.centerGenes) : '';
        const centerTitle = plan.canUseAnyCenter
          ? 'CENTER (ANY SPARE)'
          : centerNum
          ? `CENTER #${centerNum}`
          : 'CENTER (GEN.1 CLONE)';
        cellsHtml.push(`
          <div class="planter-cell center-target">
            <span style="font-size:10px; font-family:var(--font-mono); color:var(--sulfur-yellow); font-weight:700;">${centerTitle}</span>
            <div style="font-family:var(--font-mono); font-weight:800; color:#fff; letter-spacing:0.08em;">${plan.centerGenes}</div>
            ${centerLoc ? `<span style="font-size:9.5px; font-family:var(--font-mono); color:#7dd3fc;">📍 ${centerLoc}</span>` : ''}
            <span style="font-size:10px; color:#4ade80;">→ ${plan.offspring}</span>
          </div>
        `);
      } else if (dIdx < plan.donors.length) {
        const dg = plan.donors[dIdx++];
        const dNum = cloneNumMap.get(dg);
        const dLoc = lastCloneLocMap.get(dg);
        const dLabel = dNum ? `DONOR #${dNum}` : `GEN.1 INTERMEDIATE`;
        cellsHtml.push(`
          <div class="planter-cell">
            <span style="font-size:10px; font-family:var(--font-mono); color:var(--text-secondary);">${dLabel}</span>
            <div style="font-family:var(--font-mono); font-weight:700; color:#fff; letter-spacing:0.08em;">${dg}</div>
            ${dLoc ? `<span style="font-size:9.5px; font-family:var(--font-mono); color:#7dd3fc;">📍 ${dLoc}</span>` : ''}
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

    return `
      <div style="background:linear-gradient(155deg, rgba(34,197,94,0.10), var(--bg-card)); border:1px solid ${borderColor}; border-radius:8px; padding:16px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:14px;">
          <div>
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px;">
              <span style="font-family:var(--font-mono); font-size:11px; color:#4ade80; font-weight:700;">
                ${badgeText} (${greenCount}/6 GREEN)
              </span>
              ${chanceBadge}
              ${anyCenterBadge}
            </div>
            <div style="font-family:var(--font-display); font-size:18px; font-weight:700; color:#fff;">
              ${headingText}
            </div>
          </div>
          <div>${formatGenesCircles(plan.offspring)}</div>
        </div>

        <div class="grid-2" style="align-items:center;">
          <div>
            <div style="font-family:var(--font-display); font-size:12px; text-transform:uppercase; color:var(--sulfur-yellow); margin-bottom:8px; text-align:center;">
              📦 3x3 Large Planter Box Placement (${plan.donors.length} Donor${plan.donors.length > 1 ? 's' : ''})
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
                ${plan.slotBreakdown
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
                    <td>
                      <span class="gene-circle gene-${s.winningGene}" style="width:22px; height:22px; font-size:11px;">${s.winningGene}</span>
                      ${s.tiedGenes.length > 1 ? `<span style="font-size:10px; color:#facc15; margin-left:4px;">(${s.tiedGenes.join('/')} 50%)</span>` : ''}
                    </td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div style="margin-top:12px; padding:8px 10px; background:rgba(0,0,0,0.28); border-left:3px solid var(--sulfur-yellow); border-radius:4px; font-size:11.5px; color:var(--text-secondary);">
          💡 <strong>Planting Order Tip:</strong> Plant the surrounding donors first, wait until they grow close to the <strong>Crossbreeding</strong> stage, then plant the <strong>Center</strong> plant (${formatCloneRef(plan.centerGenes, cloneNumMap)}) last so donors cleanly overwrite it without infecting each other.
        </div>
      </div>
    `;
  }

  function renderSelectedRecipeDetails(existingBannerHtml = '', filterBannerHtml = '') {
    const container = document.getElementById('crossbreedResultContainer');
    if (!container) return;

    const recipes = lastSolvedRecipes;
    if (!recipes.length) return;

    if (selectedRecipeIdx >= recipes.length) selectedRecipeIdx = 0;
    const chosen = recipes[selectedRecipeIdx];

    lastHighlightedGenes = new Set();
    if (chosen.gens === 1) {
      if (!chosen.plan.canUseAnyCenter) lastHighlightedGenes.add(chosen.plan.centerGenes);
      chosen.plan.donors.forEach((d) => lastHighlightedGenes.add(d));
    } else {
      if (!chosen.gen1Plan.canUseAnyCenter) lastHighlightedGenes.add(chosen.gen1Plan.centerGenes);
      chosen.gen1Plan.donors.forEach((d) => lastHighlightedGenes.add(d));
      if (!chosen.gen2Plan.canUseAnyCenter) lastHighlightedGenes.add(chosen.gen2Plan.centerGenes);
      chosen.gen2Plan.donors.forEach((d) => lastHighlightedGenes.add(d));
    }
    renderSavedClonesAndTeas();

    const cardsHtml = `
      <div style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
        <span style="font-family:var(--font-mono); font-size:11px; color:var(--text-secondary);">
          DISCOVERED RECIPES (${recipes.length} SHOWN) — CLICK ANY CARD TO VIEW PLANTER &amp; HIGHLIGHT PARENTS:
        </span>
      </div>
      <div class="rb-recipe-cards">
        ${recipes
          .map((r, idx) => {
            const pct = Math.round(r.exactChance * 100);
            const genTag = r.gens === 1 ? 'GEN.1' : 'GEN.2';
            const donorsUsed = r.gens === 1 ? r.plan.donors.length : `${r.gen1Plan.donors.length}+${r.gen2Plan.donors.length}`;
            const anyCenterTag =
              (r.gens === 1 ? r.plan.canUseAnyCenter : r.gen2Plan.canUseAnyCenter)
                ? `<span style="color:#7dd3fc;">• Any Center</span>`
                : '';
            const parentNums = (r.gens === 1 ? [r.plan.centerGenes, ...r.plan.donors] : [r.gen1Plan.centerGenes, ...r.gen1Plan.donors, r.gen2Plan.centerGenes, ...r.gen2Plan.donors])
              .map((g) => lastCloneNumMap.get(g))
              .filter(Boolean);
            const uniqueNums = Array.from(new Set(parentNums)).map((n) => `#${n}`).join(' ');
            return `
              <button type="button" class="rb-recipe-card ${idx === selectedRecipeIdx ? 'active' : ''}" data-recipe-idx="${idx}">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                  <span style="font-family:var(--font-mono); font-size:10.5px; font-weight:700; color:${r.gens === 1 ? '#4ade80' : '#38bdf8'};">${genTag} • ${donorsUsed} DONORS ${anyCenterTag}</span>
                  <span style="font-family:var(--font-mono); font-size:11px; font-weight:700; color:${pct === 100 ? '#4ade80' : '#facc15'};">${pct}%</span>
                </div>
                <div style="margin-bottom:6px;">${formatGenesCircles(r.offspring)}</div>
                <div style="font-family:var(--font-mono); font-size:10.5px; color:var(--text-muted);">Uses: ${uniqueNums || 'Gen.1 clone'}</div>
              </button>
            `;
          })
          .join('')}
      </div>
    `;

    let detailHtml = '';
    if (chosen.gens === 1) {
      detailHtml = renderPlanterStepHtml(
        chosen.plan,
        `GEN.1 • OPTIMAL ${lastSolvedCrop.toUpperCase()} RESULT`,
        'Resulting Clone:',
        lastCloneNumMap
      );
    } else {
      detailHtml =
        `<div style="padding:10px 12px; margin-bottom:10px; border-radius:6px; background:rgba(56,189,248,0.12); border:1px solid rgba(56,189,248,0.45); font-size:12.5px; color:#e0f2fe;">
          🧬 <strong>2-Generation Crossbreed Path (GEN.1 → GEN.2):</strong> Breed <strong>Step 1 → ${chosen.gen1Plan.offspring}</strong>, clone it once grown, then use it in <strong>Step 2 → ${chosen.offspring}</strong> (${Math.round(chosen.exactChance * 100)}% combined odds).
        </div>` +
        renderPlanterStepHtml(
          chosen.gen1Plan,
          `STEP 1 (GEN.1) • INTERMEDIATE ${lastSolvedCrop.toUpperCase()}`,
          `Intermediate Clone (${chosen.gen1Plan.offspring}) → Clone & Move to Step 2:`,
          lastCloneNumMap,
          'rgba(56,189,248,0.45)'
        ) +
        renderPlanterStepHtml(
          chosen.gen2Plan,
          `STEP 2 (GEN.2) • FINAL ${lastSolvedCrop.toUpperCase()} CLONE`,
          'Final Resulting Clone:',
          lastCloneNumMap,
          'rgba(34,197,94,0.6)'
        );
    }

    container.innerHTML = existingBannerHtml + filterBannerHtml + cardsHtml + detailHtml;

    container.querySelectorAll('.rb-recipe-card').forEach((card) => {
      card.addEventListener('click', () => {
        selectedRecipeIdx = parseInt(card.getAttribute('data-recipe-idx'), 10) || 0;
        renderSelectedRecipeDetails(existingBannerHtml, filterBannerHtml);
      });
    });
  }

  function solveBestCrossbreed() {
    const container = document.getElementById('crossbreedResultContainer');
    if (!container) return;

    const filters = getGeneticsFilters();
    const crop = document.getElementById('cloneCropSelect')?.value || selectedCloneCropFilter;
    const cropClones = (appState.savedClones || []).filter(
      (c) => c.crop === crop && /^[GYHWX]{6}$/.test(String(c.genes || '').toUpperCase())
    );

    if (cropClones.length < 2) {
      lastSolvedRecipes = [];
      lastHighlightedGenes = new Set();
      renderSavedClonesAndTeas();
      container.innerHTML = `
        <div style="padding:16px; background:var(--bg-card); border-radius:6px; color:var(--text-secondary);">
          Add at least <strong>2 clones</strong> of <strong>${crop}</strong> above (or click <strong>"Load Example Batch"</strong>) to compute optimal 3x3 crossbreeds!
        </div>
      `;
      return;
    }

    const cloneNumMap = new Map();
    const cloneLocMap = new Map();
    const orderedUnique = [];
    cropClones.forEach((c) => {
      const g = String(c.genes).toUpperCase();
      if (!cloneNumMap.has(g)) {
        orderedUnique.push(g);
        cloneNumMap.set(g, orderedUnique.length);
      }
      if (c.location && !cloneLocMap.has(g)) {
        cloneLocMap.set(g, c.location);
      }
    });

    const uniquePool = [...orderedUnique]
      .sort((a, b) => scoreCloneAgainstTarget(b, filters.targetGoal, 1, 1, 4, filters) - scoreCloneAgainstTarget(a, filters.targetGoal, 1, 1, 4, filters))
      .slice(0, 12);

    const existingGod = uniquePool.find((g) => isGodCloneForGoal(g, filters.targetGoal));
    const existingBannerHtml = existingGod
      ? `<div style="background:rgba(34,197,94,0.14); border:1px solid rgba(34,197,94,0.55); border-radius:8px; padding:12px 14px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div>
            <div style="font-family:var(--font-mono); font-size:11px; color:#4ade80; font-weight:700;">🏆 YOU ALREADY HAVE THIS ${crop.toUpperCase()} GOD CLONE (#${cloneNumMap.get(existingGod)})!</div>
            <div style="font-size:12px; color:#e2e8f0; margin-top:2px;">Plant & clone <strong>${existingGod}</strong> — or compare alternative recipes below.</div>
          </div>
          ${formatGenesCircles(existingGod)}
        </div>`
      : '';

    const gen1 = findBestSingleStepPlans(uniquePool, uniquePool, filters, 1);
    const allCandidates = gen1.topPlans.map((plan) => ({
      gens: 1,
      plan,
      offspring: plan.offspring,
      exactChance: plan.exactChance,
      score: plan.score,
      sig: `1|${plan.offspring}|${plan.centerGenes}|${[...plan.donors].sort().join(',')}`
    }));

    if (filters.maxGen >= 2 && gen1.intermediates.length > 0) {
      for (const inter of gen1.intermediates) {
        const poolWithInter = Array.from(new Set([inter.offspring, ...uniquePool])).slice(0, 9);
        const g2 = findBestSingleStepPlans([inter.offspring, ...uniquePool.slice(0, 5)], poolWithInter, filters, 2);
        for (const g2Plan of g2.topPlans.slice(0, 8)) {
          const totalChance = inter.exactChance * g2Plan.exactChance;
          const g2Score = scoreCloneAgainstTarget(
            g2Plan.offspring,
            filters.targetGoal,
            totalChance,
            2,
            inter.donors.length + g2Plan.donors.length,
            filters
          );
          allCandidates.push({
            gens: 2,
            gen1Plan: inter,
            gen2Plan: g2Plan,
            offspring: g2Plan.offspring,
            exactChance: totalChance,
            score: g2Score,
            sig: `2|${g2Plan.offspring}|${inter.offspring}|${g2Plan.centerGenes}|${[...g2Plan.donors].sort().join(',')}`
          });
        }
      }
    }

    const seenSig = new Set();
    const deduped = [];
    allCandidates.sort((a, b) => b.score - a.score);
    for (const cand of allCandidates) {
      if (seenSig.has(cand.sig)) continue;
      seenSig.add(cand.sig);
      deduped.push(cand);
    }

    const filterActive = hasActiveResultFilter(filters);
    let filtered = filterActive ? deduped.filter((c) => matchesResultFilters(c.offspring, c.exactChance, filters)) : deduped;
    let filterBannerHtml = '';

    if (filterActive && filtered.length === 0) {
      filtered = deduped;
      filterBannerHtml = `<div style="padding:8px 12px; margin-bottom:10px; border-radius:6px; background:rgba(234,179,8,0.12); border:1px solid rgba(234,179,8,0.45); font-size:12px; color:#fde047;">
        ⚠️ No clone combination matched your exact filter (check G/Y/H counts, slot filters, Max Donors up to 8, or Max Gens = 2). Showing best closest paths instead:
      </div>`;
    }

    const chosen = [];
    const perOffspringCount = new Map();
    for (const c of filtered) {
      const cnt = perOffspringCount.get(c.offspring) || 0;
      if (cnt >= 2 && chosen.length >= 3) continue;
      perOffspringCount.set(c.offspring, cnt + 1);
      chosen.push(c);
      if (chosen.length >= 6) break;
    }

    if (!chosen.length) return;
    lastSolvedRecipes = chosen;
    lastSolvedCrop = crop;
    lastCloneNumMap = cloneNumMap;
    lastCloneLocMap = cloneLocMap;
    selectedRecipeIdx = 0;

    renderSelectedRecipeDetails(existingBannerHtml, filterBannerHtml);
  }

  function renderSavedClonesAndTeas() {
    const clonesList = document.getElementById('savedClonesList');
    const teasContainer = document.getElementById('teaRecipesContainer');
    const activeCrop = document.getElementById('cloneCropSelect')?.value || selectedCloneCropFilter;
    if (clonesList) {
      const allClones = appState.savedClones || [];
      if (allClones.length === 0) {
        clonesList.innerHTML = `<div style="padding:14px; color:var(--text-muted);">No clones saved yet.</div>`;
      } else {
        let cropDisplayNum = 0;
        const seenActiveGenes = new Map();
        const sortedWithIdx = allClones
          .map((c, idx) => ({ ...c, origIdx: idx }))
          .sort((a, b) => (a.crop === activeCrop ? -1 : 1) - (b.crop === activeCrop ? -1 : 1));
        clonesList.innerHTML = sortedWithIdx
          .map((c) => {
            const gUpper = String(c.genes || '').toUpperCase();
            let numLabel = '';
            let isUsed = false;
            if (c.crop === activeCrop) {
              if (!seenActiveGenes.has(gUpper)) {
                cropDisplayNum += 1;
                seenActiveGenes.set(gUpper, cropDisplayNum);
              }
              numLabel = `#${seenActiveGenes.get(gUpper)}`;
              isUsed = lastHighlightedGenes.has(gUpper);
            }
            return `
            <div class="${isUsed ? 'clone-row-used' : ''}" style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-card); border:1px solid ${c.crop === activeCrop ? 'rgba(34,197,94,0.4)' : 'var(--border-subtle)'}; opacity:${c.crop === activeCrop ? '1' : '0.62'}; border-radius:6px; padding:8px 12px; margin-bottom:8px;">
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                ${numLabel ? `<span style="font-family:var(--font-mono); font-weight:800; font-size:12px; color:var(--sulfur-yellow); min-width:24px;">${numLabel}</span>` : ''}
                <span class="target-tier-tag">${c.crop}</span>
                ${formatGenesCircles(c.genes)}
                <button type="button" class="btn btn-sm edit-clone-loc-btn" data-idx="${c.origIdx}" title="Click to set or edit container position (e.g. Line 5 · Col 6)" style="padding:2px 7px; font-size:10.5px; font-family:var(--font-mono); color:${c.location ? '#7dd3fc' : 'var(--text-muted)'}; border-color:${c.location ? 'rgba(56,189,248,0.45)' : 'var(--border-subtle)'};">${c.location ? `📍 ${c.location}` : '📍 +Pos'}</button>
                ${isUsed ? `<span style="font-family:var(--font-mono); font-size:10px; font-weight:700; color:var(--sulfur-yellow);">★ USED</span>` : ''}
              </div>
              <button class="btn btn-sm remove-clone-btn" data-idx="${c.origIdx}">✕</button>
            </div>
          `;
          })
          .join('');

        clonesList.querySelectorAll('.edit-clone-loc-btn').forEach((btn) => {
          btn.addEventListener('click', () => {
            const idx = parseInt(btn.getAttribute('data-idx'), 10);
            if (Number.isNaN(idx) || !appState.savedClones[idx]) return;
            const cur = appState.savedClones[idx].location || '';
            const next = prompt('Enter box position for this clone (e.g. Line 5 · Col 6 or Box 1 L3 C2):', cur);
            if (next === null) return;
            appState.savedClones[idx].location = next.trim();
            syncStateToServer();
            solveBestCrossbreed();
          });
        });

        clonesList.querySelectorAll('.remove-clone-btn').forEach((btn) => {
          btn.addEventListener('click', () => {
            const idx = parseInt(btn.getAttribute('data-idx'), 10);
            if (!Number.isNaN(idx)) {
              appState.savedClones.splice(idx, 1);
              syncStateToServer();
              solveBestCrossbreed();
            }
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
        const g = btn.getAttribute('data-g');
        const val = input.value.toUpperCase();
        const lastToken = (val.split(/[\s,;]+/).pop() || '').replace(/[^GYHWX]/g, '');
        if (lastToken.length >= 6 && val.trim().length > 0 && !/[\s,;]$/.test(val)) {
          input.value = val + '\n' + g;
        } else {
          input.value = val + g;
        }
      });
    });

    document.getElementById('clearGeneInputBtn')?.addEventListener('click', () => {
      if (input) {
        input.value = '';
        input.focus();
      }
    });

    const saveInputClones = () => {
      const rawText = (input?.value || '').toUpperCase().trim();
      const cleaned = rawText.replace(/^[ \t]*#?\d+[.):\s-]+/gm, '');
      const tokens = cleaned
        .split(/[\s,;]+/)
        .map((t) => t.trim())
        .filter(Boolean);
      const valid = tokens.filter((t) => /^[GYHWX]{6}$/.test(t));
      if (!valid.length || valid.length !== tokens.length) {
        alert('Enter valid 6-gene codes using G, Y, H, W, or X (e.g. YGYWGG, or paste multiple lines).');
        return;
      }
      const crop = document.getElementById('cloneCropSelect')?.value || 'Hemp';
      const slotLoc = lastDetectedBoxSlot?.label || '';
      valid.forEach((genes, i) => {
        const existing = appState.savedClones.find((c) => c.crop === crop && c.genes === genes);
        if (!existing) {
          appState.savedClones.unshift({
            id: 'c-' + Date.now() + '-' + i,
            crop,
            genes,
            location: valid.length === 1 ? slotLoc : ''
          });
        } else if (valid.length === 1 && slotLoc && !existing.location) {
          existing.location = slotLoc;
        }
      });
      if (input) input.value = '';
      syncStateToServer();
      solveBestCrossbreed();
    };

    document.getElementById('addCloneBtn')?.addEventListener('click', saveInputClones);
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        saveInputClones();
      }
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
      solveBestCrossbreed();
    });

    document.getElementById('clearCropClonesBtn')?.addEventListener('click', () => {
      const crop = document.getElementById('cloneCropSelect')?.value || 'Hemp';
      appState.savedClones = (appState.savedClones || []).filter((c) => c.crop !== crop);
      syncStateToServer();
      solveBestCrossbreed();
    });

    document.getElementById('cloneCropSelect')?.addEventListener('change', (e) => {
      selectedCloneCropFilter = e.target.value;
      solveBestCrossbreed();
    });

    document.getElementById('geneticsTargetGoal')?.addEventListener('change', solveBestCrossbreed);
    ['geneticsMinDonors', 'geneticsMaxDonors', 'geneticsMaxGen', 'geneticsAllowDupesCb', 'filterMinChance'].forEach((id) => {
      document.getElementById(id)?.addEventListener('change', solveBestCrossbreed);
    });

    ['filterCountG', 'filterCountY', 'filterCountH', 'filterSlot1', 'filterSlot2', 'filterSlot3', 'filterSlot4', 'filterSlot5', 'filterSlot6'].forEach((id) => {
      document.getElementById(id)?.addEventListener('input', (e) => {
        if (id.startsWith('filterSlot')) {
          e.target.value = e.target.value.toUpperCase().replace(/[^GYHWX]/g, '').slice(0, 1);
        }
        const goalSel = document.getElementById('geneticsTargetGoal');
        if (goalSel && goalSel.value !== 'CUSTOM') goalSel.value = 'CUSTOM';
        solveBestCrossbreed();
      });
    });

    document.getElementById('resetGeneFiltersBtn')?.addEventListener('click', () => {
      ['filterCountG', 'filterCountY', 'filterCountH', 'filterSlot1', 'filterSlot2', 'filterSlot3', 'filterSlot4', 'filterSlot5', 'filterSlot6'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      const chanceEl = document.getElementById('filterMinChance');
      if (chanceEl) chanceEl.value = '0';
      const goalSel = document.getElementById('geneticsTargetGoal');
      if (goalSel && goalSel.value === 'CUSTOM') goalSel.value = 'GGGYYY';
      solveBestCrossbreed();
    });

    document.getElementById('runGeneticsSolverBtn')?.addEventListener('click', solveBestCrossbreed);
    document.getElementById('calcFertilizerBtn')?.addEventListener('click', calculateFertilizerScrap);

    initScreenshotScanner();
    renderSavedClonesAndTeas();
    solveBestCrossbreed();
    calculateFertilizerScrap();
  }

  // =========================================================================
  // MODULE 4B: IN-BROWSER RUST SCREENSHOT GENE SCANNER (TESSERACT OCR)
  // =========================================================================
  let ocrWorkerPromise = null;
  let scannerActiveImage = null;
  let scannerCropRect = null; // { x, y, w, h } in original image pixels
  let scannedClonesQueue = [];

  function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
      if (window.Tesseract) {
        resolve();
        return;
      }
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Failed to load OCR library')), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Tesseract.js from CDN'));
      document.head.appendChild(script);
    });
  }

  async function ensureOcrWorker(setStatus) {
    if (!ocrWorkerPromise) {
      ocrWorkerPromise = (async () => {
        setStatus('⏳ Loading in-browser OCR engine (first run downloads ~2MB)...');
        await loadScriptOnce('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
        if (!window.Tesseract) throw new Error('Tesseract failed to initialize.');
        const worker = await window.Tesseract.createWorker('eng');
        await worker.setParameters({ tessedit_char_whitelist: 'GYHWX' });
        return worker;
      })().catch((err) => {
        ocrWorkerPromise = null;
        throw err;
      });
    }
    return ocrWorkerPromise;
  }

  function extractGenesFromOcrText(rawText, isTightStrip = false) {
    const found = [];
    const upper = String(rawText || '').toUpperCase();
    const lines = upper.split(/\r?\n/);

    for (const line of lines) {
      const compact = line.replace(/[^GYHWX]/g, '');
      if (isTightStrip && compact.length === 6) {
        found.push(compact);
        continue;
      }
      // Match 6 consecutive gene chars or 6 single spaced/hyphenated gene chars
      const directMatches = line.match(/[GYHWX]{6}/g) || [];
      directMatches.forEach((m) => found.push(m));

      const spacedMatches = line.match(/\b[GYHWX](?:[\s\-|/]+[GYHWX]){5}\b/g) || [];
      spacedMatches.forEach((m) => {
        const cleaned = m.replace(/[^GYHWX]/g, '');
        if (cleaned.length === 6) found.push(cleaned);
      });
    }
    return Array.from(new Set(found));
  }

  function isRustGeneBadgePixel(r, g, b) {
    const isGreen = g >= 72 && g > r + 12 && g - b >= 24;
    const isRed = r >= 92 && r > g + 22 && r - b >= 22;
    return isGreen || isRed;
  }

  function findRustBadgeStripRegions(srcCanvas) {
    const maxSampleW = 1280;
    const scale = srcCanvas.width > maxSampleW ? maxSampleW / srcCanvas.width : 1;
    const sw = Math.max(1, Math.round(srcCanvas.width * scale));
    const sh = Math.max(1, Math.round(srcCanvas.height * scale));

    const work = document.createElement('canvas');
    work.width = sw;
    work.height = sh;
    const wctx = work.getContext('2d');
    wctx.drawImage(srcCanvas, 0, 0, sw, sh);
    const data = wctx.getImageData(0, 0, sw, sh).data;

    // Detect horizontal runs containing clusters of green/red badges
    const rowRuns = [];
    for (let y = 0; y < sh; y += 2) {
      let runStart = -1;
      let gap = 0;
      let badgeHits = 0;
      for (let x = 0; x < sw; x++) {
        const idx = (y * sw + x) * 4;
        const hit = isRustGeneBadgePixel(data[idx], data[idx + 1], data[idx + 2]);
        if (hit) {
          if (runStart < 0) runStart = x;
          gap = 0;
          badgeHits++;
        } else if (runStart >= 0) {
          gap++;
          if (gap > Math.max(18, Math.round(sw * 0.025))) {
            const runEnd = x - gap;
            const runW = runEnd - runStart;
            if (runW >= 55 && badgeHits >= 20) {
              rowRuns.push({ y, x1: runStart, x2: runEnd });
            }
            runStart = -1;
            gap = 0;
            badgeHits = 0;
          }
        }
      }
      if (runStart >= 0) {
        const runEnd = sw - gap;
        const runW = runEnd - runStart;
        if (runW >= 55 && badgeHits >= 20) {
          rowRuns.push({ y, x1: runStart, x2: runEnd });
        }
      }
    }

    // Merge consecutive overlapping horizontal runs into candidate 6-circle boxes
    const boxes = [];
    for (const r of rowRuns) {
      const match = boxes.find(
        (b) => r.y - b.y2 <= 8 && Math.min(r.x2, b.x2) - Math.max(r.x1, b.x1) > Math.min(r.x2 - r.x1, b.x2 - b.x1) * 0.45
      );
      if (match) {
        match.x1 = Math.min(match.x1, r.x1);
        match.x2 = Math.max(match.x2, r.x2);
        match.y2 = r.y;
      } else {
        boxes.push({ x1: r.x1, x2: r.x2, y1: r.y, y2: r.y });
      }
    }

    const invScale = 1 / scale;
    return boxes
      .map((b) => {
        const bw = b.x2 - b.x1;
        const bh = Math.max(10, b.y2 - b.y1 + 2);
        const aspect = bw / bh;
        return { bw, bh, aspect, x: b.x1, y: b.y1 };
      })
      .filter((b) => b.bh >= 10 && b.bh <= sh * 0.18 && b.aspect >= 2.8 && b.aspect <= 12.5)
      .sort((a, b) => b.bw * b.bh - a.bw * a.bh)
      .slice(0, 12)
      .map((b) => {
        const padX = Math.round(b.bh * 0.45 * invScale);
        const padY = Math.round(b.bh * 0.45 * invScale);
        const rx = Math.max(0, Math.round(b.x * invScale) - padX);
        const ry = Math.max(0, Math.round(b.y * invScale) - padY);
        const rw = Math.min(srcCanvas.width - rx, Math.round(b.bw * invScale) + padX * 2);
        const rh = Math.min(srcCanvas.height - ry, Math.round(b.bh * invScale) + padY * 2);
        return { x: rx, y: ry, w: rw, h: rh };
      });
  }

  function buildOcrPrepCanvas(srcCanvas, rect, mode = 'badgeWhite') {
    const rw = Math.max(1, Math.round(rect.w));
    const rh = Math.max(1, Math.round(rect.h));
    const targetScale = Math.max(1, Math.min(3.5, Math.round(140 / Math.max(16, rh))));
    const out = document.createElement('canvas');
    out.width = Math.round(rw * targetScale);
    out.height = Math.round(rh * targetScale);
    const octx = out.getContext('2d');
    octx.imageSmoothingEnabled = true;
    octx.drawImage(srcCanvas, rect.x, rect.y, rw, rh, 0, 0, out.width, out.height);

    const imgData = octx.getImageData(0, 0, out.width, out.height);
    const d = imgData.data;
    const w = out.width;
    const h = out.height;

    if (mode === 'badgeWhite') {
      // Keep bright white letters that sit inside green/red badge neighborhoods; paint rest white
      const badgeMask = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) {
        const p = i * 4;
        if (isRustGeneBadgePixel(d[p], d[p + 1], d[p + 2])) badgeMask[i] = 1;
      }
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          const p = i * 4;
          const luma = 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2];
          let nearBadge = badgeMask[i] === 1;
          if (!nearBadge && luma >= 165) {
            const rad = Math.max(3, Math.round(h * 0.14));
            for (let dy = -rad; dy <= rad && !nearBadge; dy += 2) {
              const ny = y + dy;
              if (ny < 0 || ny >= h) continue;
              for (let dx = -rad; dx <= rad; dx += 2) {
                const nx = x + dx;
                if (nx >= 0 && nx < w && badgeMask[ny * w + nx]) {
                  nearBadge = true;
                  break;
                }
              }
            }
          }
          const ink = nearBadge && luma >= 168 ? 0 : 255;
          d[p] = ink;
          d[p + 1] = ink;
          d[p + 2] = ink;
          d[p + 3] = 255;
        }
      }
    } else {
      // High-contrast inverted luminance pass for white-on-dark tooltips or black-on-white lists
      for (let i = 0; i < d.length; i += 4) {
        const luma = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const ink = luma >= 170 ? 0 : 255;
        d[i] = ink;
        d[i + 1] = ink;
        d[i + 2] = ink;
        d[i + 3] = 255;
      }
    }
    octx.putImageData(imgData, 0, 0);
    return out;
  }

  function renderScannedClonesList() {
    const out = document.getElementById('scanResultsContainer');
    if (!out) return;
    if (!scannedClonesQueue.length) {
      out.innerHTML = '';
      return;
    }

    out.innerHTML = `
      <div style="background:rgba(0,0,0,0.28); border:1px solid var(--border-subtle); border-radius:6px; padding:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
          <span style="font-family:var(--font-mono); font-size:11.5px; color:#4ade80; font-weight:700;">
            ✅ DETECTED CLONES (${scannedClonesQueue.length}) — REVIEW / EDIT IF NEEDED:
          </span>
          <div style="display:flex; gap:6px;">
            <button id="addAllScannedBtn" class="btn btn-primary btn-sm" type="button">+ Add All to Clones</button>
            <button id="clearScannedQueueBtn" class="btn btn-sm" type="button">Clear List</button>
          </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          ${scannedClonesQueue
            .map(
              (genes, idx) => `
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; background:var(--bg-card); padding:6px 10px; border-radius:5px; border:1px solid var(--border-subtle);">
              <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <input type="text" maxlength="6" class="input scanned-edit-input" data-sidx="${idx}" value="${genes}" style="width:94px; font-family:var(--font-mono); font-weight:700; text-transform:uppercase; padding:4px 6px; letter-spacing:0.1em;" />
                <span class="scanned-circles-preview">${/^[GYHWX]{6}$/.test(genes) ? formatGenesCircles(genes) : '<span style="color:#f87171; font-size:11px;">Need 6 G/Y/H/W/X genes</span>'}</span>
              </div>
              <button class="btn btn-sm remove-scanned-btn" data-sidx="${idx}" type="button">✕</button>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;

    out.querySelectorAll('.scanned-edit-input').forEach((inp) => {
      inp.addEventListener('input', () => {
        const i = parseInt(inp.getAttribute('data-sidx'), 10);
        const val = inp.value.toUpperCase().replace(/[^GYHWX]/g, '').slice(0, 6);
        inp.value = val;
        scannedClonesQueue[i] = val;
        const preview = inp.parentElement?.querySelector('.scanned-circles-preview');
        if (preview) {
          preview.innerHTML = /^[GYHWX]{6}$/.test(val)
            ? formatGenesCircles(val)
            : '<span style="color:#f87171; font-size:11px;">Need 6 G/Y/H/W/X genes</span>';
        }
      });
    });

    out.querySelectorAll('.remove-scanned-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.getAttribute('data-sidx'), 10);
        scannedClonesQueue.splice(i, 1);
        renderScannedClonesList();
      });
    });

    document.getElementById('clearScannedQueueBtn')?.addEventListener('click', () => {
      scannedClonesQueue = [];
      renderScannedClonesList();
    });

    document.getElementById('addAllScannedBtn')?.addEventListener('click', () => {
      const valid = scannedClonesQueue.filter((g) => /^[GYHWX]{6}$/.test(g));
      if (!valid.length) {
        alert('No valid 6-gene sequences in the scanned list.');
        return;
      }
      const crop = document.getElementById('cloneCropSelect')?.value || 'Hemp';
      const slotLoc = lastDetectedBoxSlot?.label || '';
      valid.forEach((genes, i) => {
        const existing = appState.savedClones.find((c) => c.crop === crop && c.genes === genes);
        if (!existing) {
          appState.savedClones.unshift({
            id: 'c-' + Date.now() + '-' + i,
            crop,
            genes,
            location: valid.length === 1 ? slotLoc : ''
          });
        } else if (valid.length === 1 && slotLoc && !existing.location) {
          existing.location = slotLoc;
        }
      });
      scannedClonesQueue = [];
      renderScannedClonesList();
      syncStateToServer();
      solveBestCrossbreed();
    });
  }

  let liveMediaStream = null;
  let liveScanTimer = null;
  let liveScanBusy = false;
  let lastLiveFrameSig = '';
  let liveAddedTotal = 0;
  let scannerDragMode = 'box'; // 'box' | 'gene'
  let scannerBoxGridRect = null; // { x, y, w, h } in original image pixels
  let lastDetectedBoxSlot = null; // { row, col, label }
  let prevBoxFrameCanvas = null;

  function getBoxGridDims() {
    const val = document.getElementById('scannerBoxLayoutSelect')?.value || '8x6';
    const [rStr, cStr] = val.split('x');
    return {
      rows: Math.max(1, parseInt(rStr, 10) || 8),
      cols: Math.max(1, parseInt(cStr, 10) || 6)
    };
  }

  function getScannerSourceDimensions(src) {
    if (!src) return { w: 0, h: 0 };
    return {
      w: src.videoWidth || src.naturalWidth || src.width || 0,
      h: src.videoHeight || src.naturalHeight || src.height || 0
    };
  }

  function detectBoxGridSlot(curFullCanvas, boxRect, prevCanvas, opts = {}) {
    if (!curFullCanvas || !boxRect || boxRect.w < 24 || boxRect.h < 24) return null;
    const { rows, cols } = opts.dims || getBoxGridDims();
    const bx = Math.max(0, Math.round(boxRect.x));
    const by = Math.max(0, Math.round(boxRect.y));
    const bw = Math.max(cols * 4, Math.min(curFullCanvas.width - bx, Math.round(boxRect.w)));
    const bh = Math.max(rows * 4, Math.min(curFullCanvas.height - by, Math.round(boxRect.h)));
    const cw = bw / cols;
    const ch = bh / rows;

    const curData = curFullCanvas.getContext('2d').getImageData(bx, by, bw, bh).data;
    const canCompare =
      prevCanvas &&
      prevCanvas.width === curFullCanvas.width &&
      prevCanvas.height === curFullCanvas.height;
    const prevData = canCompare ? prevCanvas.getContext('2d').getImageData(bx, by, bw, bh).data : null;

    let best = null;
    let secondScore = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x1 = Math.floor(c * cw + cw * 0.06);
        const x2 = Math.min(bw, Math.ceil((c + 1) * cw - cw * 0.06));
        const y1 = Math.floor(r * ch + ch * 0.06);
        const y2 = Math.min(bh, Math.ceil((r + 1) * ch - ch * 0.06));
        let samples = 0;
        let blueHighlightHits = 0;
        let diffSum = 0;
        let blueGainSum = 0;

        for (let y = y1; y < y2; y += 2) {
          for (let x = x1; x < x2; x += 2) {
            const p = (y * bw + x) * 4;
            const rr = curData[p];
            const gg = curData[p + 1];
            const bb = curData[p + 2];
            samples++;
            // Rust selected slot uses a cyan/blue selection tint + bright border
            if (bb > rr + 14 && bb >= 85 && gg >= 60) {
              blueHighlightHits++;
            }
            if (prevData) {
              const pr = prevData[p];
              const pg = prevData[p + 1];
              const pb = prevData[p + 2];
              const d = Math.abs(rr - pr) + Math.abs(gg - pg) + Math.abs(bb - pb);
              diffSum += d;
              if (bb - pb > 12 && bb > rr + 10) {
                blueGainSum += bb - pb;
              }
            }
          }
        }

        if (!samples) continue;
        const blueRatio = blueHighlightHits / samples;
        const avgDiff = canCompare ? diffSum / samples : 0;
        const avgBlueGain = canCompare ? blueGainSum / samples : 0;
        const score = blueRatio * 120 + avgBlueGain * 1.6 + avgDiff * 0.35;

        if (!best || score > best.score) {
          if (best) secondScore = Math.max(secondScore, best.score);
          best = { row: r + 1, col: c + 1, score, blueRatio, avgDiff };
        } else if (score > secondScore) {
          secondScore = score;
        }
      }
    }

    if (!best) return null;
    if (best.score < 2.2) return null;
    if (best.score <= secondScore * 1.12 && best.blueRatio < 0.05) return null;

    const boxName =
      opts.boxName !== undefined
        ? String(opts.boxName || '').trim()
        : (document.getElementById('scannerBoxNameInput')?.value || '').trim();
    const posText = `Line ${best.row} · Col ${best.col}`;
    return {
      row: best.row,
      col: best.col,
      label: boxName ? `${boxName} • ${posText}` : posText
    };
  }

  function drawScannerCanvasPreview() {
    const canvas = document.getElementById('geneScannerCanvas');
    const wrap = document.getElementById('scannerPreviewWrap');
    const rescanCropBtn = document.getElementById('rescanCropBtn');
    const clearCropBtn = document.getElementById('clearCropBtn');
    const clearBoxGridBtn = document.getElementById('clearBoxGridBtn');
    const dims = getScannerSourceDimensions(scannerActiveImage);
    if (!canvas || !wrap || !scannerActiveImage || !dims.w || !dims.h) return;

    wrap.style.display = 'block';
    canvas.width = dims.w;
    canvas.height = dims.h;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(scannerActiveImage, 0, 0, dims.w, dims.h);

    if (scannerCropRect && scannerCropRect.w > 8 && scannerCropRect.h > 8) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        scannerActiveImage,
        scannerCropRect.x,
        scannerCropRect.y,
        scannerCropRect.w,
        scannerCropRect.h,
        scannerCropRect.x,
        scannerCropRect.y,
        scannerCropRect.w,
        scannerCropRect.h
      );
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = Math.max(2, Math.round(canvas.width / 350));
      ctx.setLineDash([8, 5]);
      ctx.strokeRect(scannerCropRect.x, scannerCropRect.y, scannerCropRect.w, scannerCropRect.h);
      ctx.restore();
      if (rescanCropBtn) rescanCropBtn.style.display = 'inline-flex';
      if (clearCropBtn) clearCropBtn.style.display = 'inline-flex';
    } else {
      if (rescanCropBtn) rescanCropBtn.style.display = 'none';
      if (clearCropBtn) clearCropBtn.style.display = 'none';
    }

    // Draw calibrated Rust storage container grid overlay (rows x cols)
    if (scannerBoxGridRect && scannerBoxGridRect.w > 18 && scannerBoxGridRect.h > 18) {
      const { rows, cols } = getBoxGridDims();
      const cw = scannerBoxGridRect.w / cols;
      const ch = scannerBoxGridRect.h / rows;
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.lineWidth = Math.max(1.5, canvas.width / 500);
      ctx.strokeRect(scannerBoxGridRect.x, scannerBoxGridRect.y, scannerBoxGridRect.w, scannerBoxGridRect.h);

      ctx.beginPath();
      for (let c = 1; c < cols; c++) {
        const x = scannerBoxGridRect.x + c * cw;
        ctx.moveTo(x, scannerBoxGridRect.y);
        ctx.lineTo(x, scannerBoxGridRect.y + scannerBoxGridRect.h);
      }
      for (let r = 1; r < rows; r++) {
        const y = scannerBoxGridRect.y + r * ch;
        ctx.moveTo(scannerBoxGridRect.x, y);
        ctx.lineTo(scannerBoxGridRect.x + scannerBoxGridRect.w, y);
      }
      ctx.stroke();

      const fontSize = Math.max(11, Math.round(Math.min(cw, ch) * 0.28));
      ctx.font = `700 ${fontSize}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#7dd3fc';
      for (let c = 0; c < cols; c++) {
        ctx.fillText(`C${c + 1}`, scannerBoxGridRect.x + (c + 0.5) * cw, Math.max(fontSize, scannerBoxGridRect.y - fontSize * 0.65));
      }
      for (let r = 0; r < rows; r++) {
        ctx.fillText(`L${r + 1}`, Math.max(fontSize, scannerBoxGridRect.x - fontSize * 0.9), scannerBoxGridRect.y + (r + 0.5) * ch);
      }

      if (lastDetectedBoxSlot && lastDetectedBoxSlot.row <= rows && lastDetectedBoxSlot.col <= cols) {
        const hx = scannerBoxGridRect.x + (lastDetectedBoxSlot.col - 1) * cw;
        const hy = scannerBoxGridRect.y + (lastDetectedBoxSlot.row - 1) * ch;
        ctx.fillStyle = 'rgba(34, 197, 94, 0.26)';
        ctx.fillRect(hx, hy, cw, ch);
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = Math.max(2.5, canvas.width / 320);
        ctx.strokeRect(hx, hy, cw, ch);
      }
      ctx.restore();
      if (clearBoxGridBtn) clearBoxGridBtn.style.display = 'inline-flex';
    } else if (clearBoxGridBtn) {
      clearBoxGridBtn.style.display = 'none';
    }
  }

  function computeCanvasRegionSig(canvas, rect) {
    const ctx = canvas.getContext('2d');
    const rx = Math.max(0, Math.round(rect.x));
    const ry = Math.max(0, Math.round(rect.y));
    const rw = Math.max(1, Math.min(canvas.width - rx, Math.round(rect.w)));
    const rh = Math.max(1, Math.min(canvas.height - ry, Math.round(rect.h)));
    const data = ctx.getImageData(rx, ry, rw, rh).data;
    const step = Math.max(1, Math.floor((rw * rh) / 260));
    let hash = 2166136261;
    for (let i = 0; i < rw * rh; i += step) {
      const p = i * 4;
      hash ^= ((data[p] >> 4) << 8) | ((data[p + 1] >> 4) << 4) | (data[p + 2] >> 4);
      hash = Math.imul(hash, 16777619);
    }
    return `${rw}x${rh}:${hash >>> 0}`;
  }

  async function scanLoadedImage(srcEl, cropRect = null, appendToExisting = false, opts = {}) {
    const statusEl = document.getElementById('scannerStatusMsg');
    const setStatus = (msg) => {
      if (statusEl) statusEl.textContent = msg;
    };
    const isLive = Boolean(opts.isLive);
    const autoAddLive = Boolean(opts.autoAddLive);

    try {
      const dims = getScannerSourceDimensions(srcEl);
      if (!dims.w || !dims.h) return;

      const worker = await ensureOcrWorker(setStatus);
      if (!isLive) setStatus('🔍 Scanning screenshot for Rust plant gene circles...');

      const fullCanvas = document.createElement('canvas');
      fullCanvas.width = dims.w;
      fullCanvas.height = dims.h;
      fullCanvas.getContext('2d').drawImage(srcEl, 0, 0, dims.w, dims.h);

      const detectedSlot = scannerBoxGridRect
        ? detectBoxGridSlot(fullCanvas, scannerBoxGridRect, prevBoxFrameCanvas)
        : null;
      if (detectedSlot) {
        lastDetectedBoxSlot = detectedSlot;
      }

      const activeRect = cropRect && cropRect.w > 12 && cropRect.h > 12
        ? cropRect
        : { x: 0, y: 0, w: fullCanvas.width, h: fullCanvas.height };

      const targetCanvas = document.createElement('canvas');
      targetCanvas.width = Math.round(activeRect.w);
      targetCanvas.height = Math.round(activeRect.h);
      targetCanvas
        .getContext('2d')
        .drawImage(fullCanvas, activeRect.x, activeRect.y, activeRect.w, activeRect.h, 0, 0, targetCanvas.width, targetCanvas.height);

      // 1. Locate green/red Rust gene circle rows
      const stripBoxes = findRustBadgeStripRegions(targetCanvas);
      if (isLive) {
        if (!stripBoxes.length && !cropRect) {
          prevBoxFrameCanvas = fullCanvas;
          return;
        }
        const sigTarget = stripBoxes.length ? stripBoxes[0] : { x: 0, y: 0, w: targetCanvas.width, h: targetCanvas.height };
        const sig = `${stripBoxes.length}|${detectedSlot?.label || ''}|${computeCanvasRegionSig(targetCanvas, sigTarget)}`;
        if (sig === lastLiveFrameSig) {
          return;
        }
        lastLiveFrameSig = sig;
      }
      prevBoxFrameCanvas = fullCanvas;

      const newlyFound = [];

      for (let i = 0; i < stripBoxes.length; i++) {
        if (!isLive) setStatus(`🔍 Scanning badge row ${i + 1}/${stripBoxes.length}...`);
        const prep = buildOcrPrepCanvas(targetCanvas, stripBoxes[i], 'badgeWhite');
        const res = await worker.recognize(prep);
        extractGenesFromOcrText(res?.data?.text, true).forEach((g) => newlyFound.push(g));
      }

      // 2. Fallback / broad scan on cropped region or static screenshot
      if (newlyFound.length === 0 && (cropRect || !isLive)) {
        if (!isLive) setStatus('🔍 Running full-area gene OCR pass...');
        const wholeRect = { x: 0, y: 0, w: targetCanvas.width, h: targetCanvas.height };
        const badgeFull = buildOcrPrepCanvas(targetCanvas, wholeRect, 'badgeWhite');
        const res1 = await worker.recognize(badgeFull);
        extractGenesFromOcrText(res1?.data?.text, false).forEach((g) => newlyFound.push(g));

        if (newlyFound.length === 0 && !isLive) {
          const grayFull = buildOcrPrepCanvas(targetCanvas, wholeRect, 'invGray');
          const res2 = await worker.recognize(grayFull);
          extractGenesFromOcrText(res2?.data?.text, false).forEach((g) => newlyFound.push(g));
        }
      }

      const uniqueNew = Array.from(new Set(newlyFound)).filter((g) => /^[GYHWX]{6}$/.test(g));

      if (isLive && autoAddLive) {
        if (uniqueNew.length > 0) {
          const crop = document.getElementById('cloneCropSelect')?.value || 'Hemp';
          const slotLoc = detectedSlot?.label || '';
          let addedNow = 0;
          let updatedLoc = 0;
          uniqueNew.forEach((genes, i) => {
            const existing = appState.savedClones.find((c) => c.crop === crop && c.genes === genes);
            if (!existing) {
              appState.savedClones.unshift({
                id: 'c-' + Date.now() + '-' + i,
                crop,
                genes,
                location: slotLoc
              });
              addedNow++;
              liveAddedTotal++;
            } else if (slotLoc && !existing.location) {
              existing.location = slotLoc;
              updatedLoc++;
            }
          });
          if (addedNow > 0 || updatedLoc > 0) {
            playAlertSound('urgent');
            syncStateToServer();
            solveBestCrossbreed();
            const locSuffix = slotLoc ? ` at 📍 ${slotLoc}` : '';
            setStatus(`🟢 LIVE: ${addedNow > 0 ? 'Added' : 'Tagged'} ${uniqueNew.join(', ')}${locSuffix} (${liveAddedTotal} new this session)!`);
          }
        }
        return;
      }

      const detected = new Set(appendToExisting ? scannedClonesQueue : []);
      uniqueNew.forEach((g) => detected.add(g));
      scannedClonesQueue = Array.from(detected);
      renderScannedClonesList();

      if (!isLive) {
        if (scannedClonesQueue.length > 0) {
          const locMsg = detectedSlot ? ` (📍 ${detectedSlot.label})` : '';
          setStatus(`✅ Found ${scannedClonesQueue.length} clone sequence(s)${locMsg}! Review below and click "+ Add All to Clones".`);
        } else {
          setStatus('⚠️ No 6-gene code detected cleanly. Switch tool to "🔍 Lock Gene Crop", drag a tight yellow box over the 6 gene circles, and click "Scan Gene Box".');
        }
      }
    } catch (err) {
      setStatus(`❌ Scan failed: ${err?.message || err}. Make sure internet access can load Tesseract OCR or drag a smaller crop.`);
    }
  }

  function stopLiveRustScan() {
    if (liveScanTimer) {
      clearInterval(liveScanTimer);
      liveScanTimer = null;
    }
    if (liveMediaStream) {
      liveMediaStream.getTracks().forEach((t) => t.stop());
      liveMediaStream = null;
    }
    liveScanBusy = false;
    prevBoxFrameCanvas = null;
    lastDetectedBoxSlot = null;
    const video = document.getElementById('liveScanVideo');
    if (video) video.srcObject = null;

    const startBtn = document.getElementById('liveScanStartBtn');
    const stopBtn = document.getElementById('liveScanStopBtn');
    const badge = document.getElementById('liveScanBadge');
    const statusEl = document.getElementById('scannerStatusMsg');
    if (startBtn) startBtn.style.display = 'inline-flex';
    if (stopBtn) stopBtn.style.display = 'none';
    if (badge) badge.style.display = 'none';
    if (statusEl && statusEl.textContent.includes('LIVE')) {
      statusEl.textContent = `⏹ Live Rust scan stopped (${liveAddedTotal} new clone${liveAddedTotal === 1 ? '' : 's'} imported this session).`;
    }
  }

  async function startLiveRustScan() {
    const panel = document.getElementById('geneScannerPanel');
    if (panel) {
      panel.style.display = 'block';
      panel.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
    }
    const statusEl = document.getElementById('scannerStatusMsg');
    const setStatus = (msg) => {
      if (statusEl) statusEl.textContent = msg;
    };

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      const origin = window.location.origin && window.location.origin !== 'null' ? window.location.origin : window.location.href;
      if (statusEl) {
        statusEl.innerHTML = `
          <div style="padding:10px 12px; border-radius:6px; background:rgba(239,68,68,0.14); border:1px solid rgba(239,68,68,0.55); color:#fecaca; font-family:var(--font-sans); font-size:12.5px; line-height:1.45;">
            ⚠️ <strong>Browser blocked Live Screen Capture on plain HTTP / local file!</strong> Chrome &amp; Edge only allow live window sharing on <code>https://</code> or <code>http://localhost</code>.<br/>
            • <strong>Quick 10s Chrome/Edge Fix for your server:</strong> open <code>chrome://flags/#unsafely-treat-insecure-origin-as-secure</code> (or <code>edge://flags/#unsafely-treat-insecure-origin-as-secure</code>), set it to <strong>Enabled</strong>, paste <code>${origin}</code>, and click <strong>Relaunch</strong>.<br/>
            • <strong>Or instant workaround right now:</strong> use <kbd>Win+Shift+S</kbd> in Rust and press <kbd>Ctrl+V</kbd> here — image pasting works even on plain HTTP!
          </div>
        `;
      }
      return;
    }

    stopLiveRustScan();
    liveAddedTotal = 0;
    lastLiveFrameSig = '';

    try {
      setStatus('🪟 Pick your Rust game window (or monitor) in the browser prompt...');
      liveMediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'never', frameRate: { ideal: 10, max: 15 } },
        audio: false
      });
    } catch (err) {
      setStatus(`⚠️ Window share cancelled: ${err?.message || 'Permission declined'}`);
      return;
    }

    const video = document.getElementById('liveScanVideo');
    if (!video) return;
    video.srcObject = liveMediaStream;
    try {
      await video.play();
    } catch (_) {}

    const videoTrack = liveMediaStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.addEventListener('ended', stopLiveRustScan, { once: true });
    }

    // Show controls & warm up OCR worker
    const startBtn = document.getElementById('liveScanStartBtn');
    const stopBtn = document.getElementById('liveScanStopBtn');
    const badge = document.getElementById('liveScanBadge');
    if (startBtn) startBtn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = 'inline-flex';
    if (badge) badge.style.display = 'inline-flex';

    try {
      await ensureOcrWorker(setStatus);
    } catch (err) {
      stopLiveRustScan();
      setStatus(`❌ Failed to load OCR engine: ${err?.message || err}`);
      return;
    }

    scannerActiveImage = video;
    scannerCropRect = null;
    drawScannerCanvasPreview();
    setStatus('🔴 LIVE: Tab into Rust and click through your clones in your inventory/box — new clones auto-import with a beep!');

    liveScanTimer = setInterval(async () => {
      if (!liveMediaStream || liveScanBusy || video.readyState < 2) return;
      liveScanBusy = true;
      try {
        scannerActiveImage = video;
        drawScannerCanvasPreview();
        const autoAddLive = Boolean(document.getElementById('liveScanAutoAddCb')?.checked ?? true);
        await scanLoadedImage(video, scannerCropRect, true, { isLive: true, autoAddLive });
      } finally {
        liveScanBusy = false;
      }
    }, 700);
  }

  function loadImageFileToScanner(file, appendQueue = false) {
    return new Promise((resolve) => {
      if (!file || !file.type.startsWith('image/')) {
        resolve();
        return;
      }
      stopLiveRustScan();
      const panel = document.getElementById('geneScannerPanel');
      if (panel) panel.style.display = 'block';

      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = async () => {
          scannerActiveImage = img;
          scannerCropRect = null;
          drawScannerCanvasPreview();
          await scanLoadedImage(img, null, appendQueue);
          resolve();
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function initScreenshotScanner() {
    const panel = document.getElementById('geneScannerPanel');
    const toggleBtn = document.getElementById('toggleScannerBtn');
    const liveToggleBtn = document.getElementById('liveScanToggleBtn');
    const liveStartBtn = document.getElementById('liveScanStartBtn');
    const liveStopBtn = document.getElementById('liveScanStopBtn');
    const closeBtn = document.getElementById('closeScannerBtn');
    const fileInput = document.getElementById('scanCloneFileInput');
    const pickBtn = document.getElementById('pickScanFilesBtn');
    const dropZone = document.getElementById('scannerDropZone');
    const canvas = document.getElementById('geneScannerCanvas');

    toggleBtn?.addEventListener('click', () => {
      if (!panel) return;
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
    liveToggleBtn?.addEventListener('click', () => {
      if (panel) panel.style.display = 'block';
      startLiveRustScan();
    });
    liveStartBtn?.addEventListener('click', startLiveRustScan);
    liveStopBtn?.addEventListener('click', stopLiveRustScan);
    closeBtn?.addEventListener('click', () => {
      stopLiveRustScan();
      if (panel) panel.style.display = 'none';
    });
    pickBtn?.addEventListener('click', () => fileInput?.click());

    const handleFiles = async (fileList) => {
      const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
      if (!files.length) return;
      for (let i = 0; i < files.length; i++) {
        await loadImageFileToScanner(files[i], i > 0);
      }
    };

    fileInput?.addEventListener('change', async (e) => {
      await handleFiles(e.target.files);
      fileInput.value = '';
    });

    if (dropZone) {
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });
      dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
      dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        await handleFiles(e.dataTransfer?.files);
      });
    }

    // Paste Rust Win+Shift+S screenshot directly anywhere while on Genetics tab
    document.addEventListener('paste', async (e) => {
      if (!document.getElementById('tab-genetics')?.classList.contains('active')) return;
      const items = Array.from(e.clipboardData?.items || []);
      const imgItem = items.find((it) => it.type.startsWith('image/'));
      if (!imgItem) return;
      e.preventDefault();
      const file = imgItem.getAsFile();
      if (file) await loadImageFileToScanner(file, scannedClonesQueue.length > 0);
    });

    // Interactive drag tool on scanner canvas: either 📦 Box Grid (Line/Col) or 🔍 Gene OCR Box
    const boxBtn = document.getElementById('dragModeBoxBtn');
    const geneBtn = document.getElementById('dragModeGeneBtn');
    const dragHint = document.getElementById('scannerDragHint');
    const setDragMode = (mode) => {
      scannerDragMode = mode;
      boxBtn?.classList.toggle('btn-primary', mode === 'box');
      geneBtn?.classList.toggle('btn-primary', mode === 'gene');
      if (dragHint) {
        dragHint.innerHTML =
          mode === 'box'
            ? 'ACTIVE DRAG TOOL: <strong style="color:#4ade80;">📦 Mark Box Grid</strong> — drag across your Rust storage box slots so every scanned clone tags its exact Line &amp; Column!'
            : 'ACTIVE DRAG TOOL: <strong style="color:#eab308;">🔍 Lock Gene Crop</strong> — drag tightly around the 6 gene circles to lock OCR to just that panel!';
      }
    };
    boxBtn?.addEventListener('click', () => setDragMode('box'));
    geneBtn?.addEventListener('click', () => setDragMode('gene'));
    document.getElementById('scannerBoxLayoutSelect')?.addEventListener('change', () => {
      lastDetectedBoxSlot = null;
      drawScannerCanvasPreview();
    });
    document.getElementById('clearBoxGridBtn')?.addEventListener('click', () => {
      scannerBoxGridRect = null;
      lastDetectedBoxSlot = null;
      drawScannerCanvasPreview();
    });

    if (canvas) {
      let dragging = false;
      let startPt = null;
      const toCanvasCoords = (evt) => {
        const r = canvas.getBoundingClientRect();
        return {
          x: Math.max(0, Math.min(canvas.width, ((evt.clientX - r.left) / r.width) * canvas.width)),
          y: Math.max(0, Math.min(canvas.height, ((evt.clientY - r.top) / r.height) * canvas.height))
        };
      };
      canvas.addEventListener('pointerdown', (e) => {
        if (!scannerActiveImage) return;
        dragging = true;
        startPt = toCanvasCoords(e);
        canvas.setPointerCapture?.(e.pointerId);
      });
      canvas.addEventListener('pointermove', (e) => {
        if (!dragging || !startPt) return;
        const cur = toCanvasCoords(e);
        const rect = {
          x: Math.min(startPt.x, cur.x),
          y: Math.min(startPt.y, cur.y),
          w: Math.abs(cur.x - startPt.x),
          h: Math.abs(cur.y - startPt.y)
        };
        if (scannerDragMode === 'box') {
          scannerBoxGridRect = rect;
        } else {
          scannerCropRect = rect;
        }
        drawScannerCanvasPreview();
      });
      canvas.addEventListener('pointerup', () => {
        dragging = false;
        if (scannerDragMode === 'box' && scannerBoxGridRect && (scannerBoxGridRect.w < 20 || scannerBoxGridRect.h < 20)) {
          scannerBoxGridRect = null;
        }
        if (scannerDragMode === 'gene' && scannerCropRect && (scannerCropRect.w < 12 || scannerCropRect.h < 12)) {
          scannerCropRect = null;
        }
        drawScannerCanvasPreview();
      });
    }

    document.getElementById('rescanCropBtn')?.addEventListener('click', () => {
      if (scannerActiveImage && scannerCropRect) {
        lastLiveFrameSig = '';
        scanLoadedImage(scannerActiveImage, scannerCropRect, true, {
          isLive: Boolean(liveMediaStream),
          autoAddLive: Boolean(liveMediaStream && document.getElementById('liveScanAutoAddCb')?.checked)
        });
      }
    });
    document.getElementById('rescanFullBtn')?.addEventListener('click', () => {
      if (scannerActiveImage) {
        scannerCropRect = null;
        lastLiveFrameSig = '';
        drawScannerCanvasPreview();
        scanLoadedImage(scannerActiveImage, null, false, {
          isLive: Boolean(liveMediaStream),
          autoAddLive: Boolean(liveMediaStream && document.getElementById('liveScanAutoAddCb')?.checked)
        });
      }
    });
    document.getElementById('clearCropBtn')?.addEventListener('click', () => {
      scannerCropRect = null;
      lastLiveFrameSig = '';
      drawScannerCanvasPreview();
    });
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
      // Support bare Server ID OR full BattleMetrics URL (e.g. https://www.battlemetrics.com/servers/rust/28653982)
      const bmUrlMatch = query.trim().match(/battlemetrics\.com\/servers\/(?:rust\/)?(\d+)/i);
      const directId = bmUrlMatch ? bmUrlMatch[1] : (/^\d+$/.test(query.trim()) ? query.trim() : null);
      if (directId) {
        const ok = await loadBattleMetricsServerById(directId);
        if (ok) resultsEl.innerHTML = '';
        return;
      }

      let data = null;
      let apiErr = '';
      try {
        const res = await fetch(`/api/battlemetrics/search?q=${encodeURIComponent(query)}`, {
          headers: getBmToken() ? { Authorization: `Bearer ${getBmToken()}` } : {}
        });
        const json = await res.json().catch(() => null);
        if (res.ok) data = json;
        else if (json?.error) apiErr = json.error;
      } catch (_) {}

      // Browser direct fallback if running without Node proxy
      if (!data && !apiErr) {
        const directRes = await fetch(
          `https://api.battlemetrics.com/servers?filter[game]=rust&filter[search]=${encodeURIComponent(query)}&page[size]=8`,
          { headers: getBmToken() ? { Authorization: `Bearer ${getBmToken()}` } : {} }
        );
        const directJson = await directRes.json().catch(() => null);
        if (directRes.ok) data = directJson;
        else apiErr = directJson?.errors?.[0]?.detail || `HTTP ${directRes.status}`;
      }

      if (apiErr) {
        resultsEl.innerHTML = `<div style="padding:10px; background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.4); border-radius:6px; color:#fca5a5; font-size:12.5px;">
          ⚠️ <strong>BattleMetrics API blocked:</strong> ${apiErr}<br/>
          <span style="color:#cbd5e1;">BattleMetrics now requires a BattleMetrics API Token (add it in <strong>⚙️ Squad Settings</strong>). For map analysis without BattleMetrics, paste a <strong>RustMaps URL</strong> or <code>size_seed</code> directly into <strong>📍 Base Finder</strong>.</span>
        </div>`;
        return;
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
    const resultsEl = document.getElementById('bmSearchResults');
    try {
      let payload = null;
      let apiErr = '';
      try {
        const res = await fetch(`/api/battlemetrics/server/${serverId}`, {
          headers: getBmToken() ? { Authorization: `Bearer ${getBmToken()}` } : {}
        });
        const json = await res.json().catch(() => null);
        if (res.ok) payload = json;
        else if (json?.error) apiErr = json.error;
      } catch (_) {}

      if (!payload && !apiErr) {
        const directRes = await fetch(`https://api.battlemetrics.com/servers/${serverId}`, {
          headers: getBmToken() ? { Authorization: `Bearer ${getBmToken()}` } : {}
        });
        const srvJson = await directRes.json().catch(() => null);
        if (directRes.ok && srvJson?.data) {
          payload = { server: srvJson, history: [] };
        } else {
          apiErr = srvJson?.errors?.[0]?.detail || `HTTP ${directRes.status}`;
        }
      }

      const srv = payload?.server?.data;
      if (!srv) {
        if (resultsEl) {
          resultsEl.innerHTML = `<div style="padding:10px; background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.4); border-radius:6px; color:#fca5a5; font-size:12.5px;">
            ⚠️ <strong>Could not load BattleMetrics Server #${serverId}:</strong> ${apiErr || 'No server data returned.'}<br/>
            <span style="color:#cbd5e1;">BattleMetrics API requires a BattleMetrics API Token (add it in <strong>⚙️ Squad Settings</strong>). To analyze the map right now, paste the <strong>RustMaps URL</strong> or <code>size_seed</code> directly into <strong>📍 Base Finder</strong>.</span>
          </div>`;
        }
        return false;
      }
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
      return true;
    } catch (err) {
      if (resultsEl) {
        resultsEl.innerHTML = `<div style="padding:10px; color:#fca5a5;">⚠️ BattleMetrics error: ${err.message}</div>`;
      }
      return false;
    }
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
            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
              <button id="bmAnalyzeInBaseFinderBtn" class="btn btn-sm btn-primary" style="font-size:11.5px;">📍 Analyze Map in Base Finder</button>
              <span class="keycard-tag ${popPct > 75 ? 'keycard-Red' : popPct > 40 ? 'keycard-Fuse' : 'keycard-Green'}">
                ${popPct}% CAPACITY (${s.players}/${s.maxPlayers})
              </span>
            </div>
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
      document.getElementById('bmAnalyzeInBaseFinderBtn')?.addEventListener('click', () => {
        const bfTabBtn = document.querySelector('.nav-tab[data-tab="tab-basefinder"]');
        const bfInput = document.getElementById('bfMapUrlInput');
        const bfBtn = document.getElementById('bfAnalyzeBtn');
        if (bfInput) {
          bfInput.value = s.id ? `https://www.battlemetrics.com/servers/rust/${s.id}` : `${s.size}_${s.seed}`;
        }
        bfTabBtn?.click();
        bfBtn?.click();
      });
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
  let bfStealthBest = null;
  let bfSelectedIdx = 0;
  let bfActiveHeatmap = 'none';
  let bfHeatmapImages = {};
  let bfHeatmapGrids = {};
  let bfFarmingSpots = [];
  let bfSelectedFarmIdx = -1;
  let bfZoom = 1;
  let bfPanX = 0;
  let bfPanY = 0;
  let bfRenderedPins = [];
  let bfNoBuildColliders = { spheres: [], boxes: [], fallback: [] };
  let bfCustomTargetMonument = null;

  function bfSwitchSubtab(target) {
    document.querySelectorAll('.bf-subtab-btn').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-bf-sub') === target);
    });
    const map = { spots: 'bfSubSpots', farming: 'bfSubFarming', route: 'bfSubRoute' };
    document.querySelectorAll('.bf-subpanel').forEach((p) => p.classList.remove('active'));
    document.getElementById(map[target])?.classList.add('active');
  }

  function bfComputeFitZoom() {
    if (!bfMapData || !bfMapData.size) return 1;
    const half = bfMapData.size / 2;
    let maxCoord = half * 1.04;
    (bfMapData.monuments || []).forEach((m) => {
      const t = String(m.type || '').toLowerCase();
      if (t.includes('oil') || t.includes('underwater lab') || t.includes('harbor') || t.includes('fishing')) {
        maxCoord = Math.max(maxCoord, Math.abs(m.x) + 220, Math.abs(m.y) + 220);
      }
    });
    return Math.max(0.55, Math.min(1, half / maxCoord));
  }

  function getSelectedBuildSpot() {
    return bfSelectedIdx === -1 ? bfStealthBest : (bfTopSpots[bfSelectedIdx] || null);
  }

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
    if (targetKey === 'underwater_lab') return t.includes('underwater lab');
    if (targetKey === 'large_oil_rig') return t.includes('large oil') || t.includes('oilrig_large');
    if (targetKey === 'small_oil_rig') return t.includes('small oil') || t.includes('oilrig_small') || (t.includes('oil rig') && !t.includes('large'));
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

  // Tier 2 progression monument weights (Blue -> Red card + Military Crates)
  function bfTier2ProgWeight(typeStr) {
    const t = String(typeStr || '').toLowerCase();
    if (t.includes('water treatment') || t.includes('powerplant') || t.includes('power plant')) return 1.0;
    if (t.includes('train yard') || t.includes('airfield')) return 0.94;
    if (t.includes('sphere tank') || t.includes('arctic research') || t.includes('abandoned military')) return 0.88;
    return 0;
  }

  function bfIsSewerBranch(typeStr) {
    const t = String(typeStr || '').toLowerCase();
    return !t.includes('cave') && (t.includes('sewer branch') || t.includes('sewer_branch'));
  }

  // Tier 0/1 support monuments (Green card, early scrap/recycler, or Metro tunnel access)
  function bfIsTier01Support(typeStr) {
    const t = String(typeStr || '').toLowerCase();
    return (
      bfIsSewerBranch(t) ||
      t.includes('satellite') ||
      t.includes('supermarket') ||
      t.includes('gas station') ||
      t.includes('warehouse') ||
      t.includes('junkyard') ||
      t.includes('harbor') ||
      t.includes('ferry') ||
      t.includes('lighthouse') ||
      t.includes('tunnel')
    );
  }

  function bfIsNoBuildSource(typeStr) {
    const t = String(typeStr || '').toLowerCase();
    if (bfIsStealthCover(t) || t.includes('iceberg') || t.includes('powerline') || t.includes('tunnel entrance')) return 0;
    if (t.includes('launch site')) return 300;
    if (t.includes('airfield')) return 260;
    if (t.includes('harbor')) return 255;
    if (t.includes('excavator')) return 250;
    if (
      t.includes('powerplant') ||
      t.includes('power plant') ||
      t.includes('water treatment') ||
      t.includes('train yard') ||
      t.includes('trainyard') ||
      t.includes('outpost') ||
      t.includes('bandit') ||
      t.includes('missile silo') ||
      t.includes('military tunnel') ||
      t.includes('military base') ||
      t.includes('arctic research') ||
      t.includes('ferry')
    ) {
      return 220;
    }
    if (t.includes('abandoned military') || t.includes('fishing village') || t.includes('radtown') || t.includes('ziggurat') || t.includes('jungle')) {
      return 195;
    }
    if (t.includes('sphere tank') || t.includes('satellite') || bfIsSewerBranch(t) || t.includes('junkyard') || t.includes('oil rig') || t.includes('oilrig') || t.includes('underwater lab')) {
      return 185;
    }
    if (t.includes('quarry')) return 150;
    if (t.includes('ranch') || t.includes('large barn') || t.includes('stables')) return 135;
    if (t.includes('substation') || t.includes('water well') || t.includes('warehouse') || t.includes('lighthouse') || t.includes('supermarket') || t.includes('gas station') || t.includes('swamp') || t.includes('ruin')) {
      return 115;
    }
    return 0;
  }

  function bfPointToSegDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq <= 1e-9) return Math.hypot(px - ax, py - ay);
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  }

  function bfPointInPoly(px, py, pts) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i].x;
      const yi = pts[i].y;
      const xj = pts[j].x;
      const yj = pts[j].y;
      const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-12) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function bfPointToBoxDist(px, py, box) {
    if (bfPointInPoly(px, py, box.corners)) return 0;
    let best = Infinity;
    const c = box.corners;
    for (let i = 0; i < c.length; i++) {
      const a = c[i];
      const b = c[(i + 1) % c.length];
      const d = bfPointToSegDist(px, py, a.x, a.y, b.x, b.y);
      if (d < best) best = d;
    }
    return best;
  }

  function bfPrepareNoBuildData(data) {
    const spheres = [];
    const boxes = [];
    const bb = data?.buildingBlockArea;
    if (bb && Array.isArray(bb.spheres)) {
      for (const s of bb.spheres) {
        const x = Number(s?.center?.x);
        const y = Number(s?.center?.y);
        const r = Number(s?.radius);
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(r) || r <= 0) continue;
        spheres.push({ x, y, r, isLarge: r >= 20 });
      }
    }
    if (bb && Array.isArray(bb.boxes)) {
      for (const b of bb.boxes) {
        if (!Array.isArray(b?.corners) || b.corners.length < 3) continue;
        const corners = b.corners.map((c) => ({ x: Number(c.x), y: Number(c.y) })).filter((c) => Number.isFinite(c.x) && Number.isFinite(c.y));
        if (corners.length < 3) continue;
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        for (const c of corners) {
          if (c.x < minX) minX = c.x;
          if (c.x > maxX) maxX = c.x;
          if (c.y < minY) minY = c.y;
          if (c.y > maxY) maxY = c.y;
        }
        const edge0 = Math.hypot(corners[1].x - corners[0].x, corners[1].y - corners[0].y);
        const edge1 = Math.hypot(corners[2].x - corners[1].x, corners[2].y - corners[1].y);
        const maxDim = Math.max(edge0, edge1);
        boxes.push({ corners, minX, maxX, minY, maxY, maxDim, isLarge: maxDim >= 20 });
      }
    }
    const fallback = (data?.monuments || [])
      .map((m) => ({ x: Number(m.x || 0), y: Number(m.y || 0), r: bfIsNoBuildSource(m.type), type: m.type }))
      .filter((m) => m.r > 0);
    bfNoBuildColliders = { spheres, boxes, fallback };
  }

  function bfCheckNoBuildZone(wx, wy, majorMargin = 32, minorMargin = 14) {
    const hasExact = bfNoBuildColliders.spheres.length > 0 || bfNoBuildColliders.boxes.length > 0;
    let inside = false;
    let blocked = false;
    let minMajorEdge = Infinity;
    let minAnyEdge = Infinity;

    if (hasExact) {
      for (const s of bfNoBuildColliders.spheres) {
        const edgeDist = Math.hypot(wx - s.x, wy - s.y) - s.r;
        if (edgeDist <= 0) inside = true;
        if (edgeDist < minAnyEdge) minAnyEdge = edgeDist;
        if (s.isLarge) {
          if (edgeDist < minMajorEdge) minMajorEdge = edgeDist;
          if (edgeDist < majorMargin) blocked = true;
        } else if (edgeDist < minorMargin) {
          blocked = true;
        }
      }
      for (const b of bfNoBuildColliders.boxes) {
        const margin = b.isLarge ? Math.max(majorMargin, 10) : Math.max(minorMargin, 10);
        if (wx < b.minX - margin && b.isLarge) {
          const fastX = b.minX - wx;
          if (fastX < minMajorEdge) minMajorEdge = Math.min(minMajorEdge, Math.hypot(fastX, Math.max(0, b.minY - wy, wy - b.maxY)));
          continue;
        }
        if (wx > b.maxX + margin && b.isLarge) {
          const fastX = wx - b.maxX;
          if (fastX < minMajorEdge) minMajorEdge = Math.min(minMajorEdge, Math.hypot(fastX, Math.max(0, b.minY - wy, wy - b.maxY)));
          continue;
        }
        if (wy < b.minY - margin || wy > b.maxY + margin || wx < b.minX - margin || wx > b.maxX + margin) {
          if (b.isLarge) {
            const dx = Math.max(0, b.minX - wx, wx - b.maxX);
            const dy = Math.max(0, b.minY - wy, wy - b.maxY);
            const aabbDist = Math.hypot(dx, dy);
            if (aabbDist < minMajorEdge) minMajorEdge = aabbDist;
          }
          continue;
        }
        const edgeDist = bfPointToBoxDist(wx, wy, b);
        if (edgeDist <= 0) inside = true;
        if (edgeDist < minAnyEdge) minAnyEdge = edgeDist;
        if (b.isLarge) {
          if (edgeDist < minMajorEdge) minMajorEdge = edgeDist;
          if (edgeDist < majorMargin) blocked = true;
        } else if (edgeDist < minorMargin) {
          blocked = true;
        }
      }
    } else {
      for (const fb of bfNoBuildColliders.fallback) {
        const edgeDist = Math.hypot(wx - fb.x, wy - fb.y) - fb.r;
        if (edgeDist <= 0) inside = true;
        if (edgeDist < minMajorEdge) minMajorEdge = edgeDist;
        if (edgeDist < minAnyEdge) minAnyEdge = edgeDist;
        if (edgeDist < majorMargin) blocked = true;
      }
    }

    const reported = Number.isFinite(minMajorEdge) ? minMajorEdge : minAnyEdge;
    return {
      blocked,
      inside,
      minClearance: Number.isFinite(reported) ? Math.round(reported) : 999
    };
  }

  function bfIsBasePlotBuildable(wx, wy, majorMargin = 32) {
    const center = bfCheckNoBuildZone(wx, wy, majorMargin, 14);
    if (center.blocked || center.inside) return { ok: false, minClearance: center.minClearance };
    // Ensure a ~44m x 44m base + external TC footprint stays completely outside every collider
    const pad = 22;
    for (const [ox, oy] of [[pad, 0], [-pad, 0], [0, pad], [0, -pad]]) {
      const corner = bfCheckNoBuildZone(wx + ox, wy + oy, 10, 8);
      if (corner.inside || corner.blocked) return { ok: false, minClearance: center.minClearance };
    }
    return { ok: true, minClearance: center.minClearance };
  }

  function bfBuildLandMask(img, mapSize) {
    const N = 240;
    const off = document.createElement('canvas');
    off.width = N;
    off.height = N;
    const ctx = off.getContext('2d');
    ctx.drawImage(img, 0, 0, N, N);
    const pixels = ctx.getImageData(0, 0, N, N).data;
    const isWater = new Uint8Array(N * N);
    const lum = new Float32Array(N * N);
    const roughness = new Float32Array(N * N);

    for (let i = 0; i < N * N; i++) {
      const r = pixels[i * 4];
      const g = pixels[i * 4 + 1];
      const b = pixels[i * 4 + 2];
      lum[i] = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      // RustMaps ocean & rivers/lakes where Blue clearly exceeds Red
      if (b > r + 14 && r < 105 && b > 65) {
        isWater[i] = 1;
      }
    }

    for (let gy = 1; gy < N - 1; gy++) {
      for (let gx = 1; gx < N - 1; gx++) {
        let minL = 1;
        let maxL = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const v = lum[(gy + dy) * N + (gx + dx)];
            if (v < minL) minL = v;
            if (v > maxL) maxL = v;
          }
        }
        roughness[gy * N + gx] = Math.min(1, (maxL - minL) * 2.2);
      }
    }

    const oceanPts = [];
    for (let gy = 0; gy < N; gy++) {
      for (let gx = 0; gx < N; gx++) {
        if (!isWater[gy * N + gx]) continue;
        // Edge of water (adjacent to land) speeds up coastline distance checks
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
    return { N, isWater, roughness, oceanPts };
  }

  function bfIsPointWater(mask, mapSize, wx, wy) {
    if (!mask) return false;
    const nx = wx / mapSize + 0.5;
    const ny = 0.5 - wy / mapSize;
    if (nx < 0 || nx >= 1 || ny < 0 || ny >= 1) return true;
    const mx = Math.min(mask.N - 1, Math.max(0, Math.floor(nx * mask.N)));
    const my = Math.min(mask.N - 1, Math.max(0, Math.floor(ny * mask.N)));
    return Boolean(mask.isWater[my * mask.N + mx]);
  }

  function bfCheckTerrainFootprint(mask, mapSize, wx, wy) {
    if (!mask) return { buildable: true, flatnessScore: 70 };
    const halfPlot = 22;
    const pts = [
      [wx, wy],
      [wx + halfPlot, wy],
      [wx - halfPlot, wy],
      [wx, wy + halfPlot],
      [wx, wy - halfPlot]
    ];
    let roughSum = 0;
    for (let pIdx = 0; pIdx < pts.length; pIdx++) {
      const [px, py] = pts[pIdx];
      const nx = px / mapSize + 0.5;
      const ny = 0.5 - py / mapSize;
      if (nx <= 0.01 || nx >= 0.99 || ny <= 0.01 || ny >= 0.99) return { buildable: false, flatnessScore: 0 };
      const mx = Math.min(mask.N - 1, Math.max(0, Math.floor(nx * mask.N)));
      const my = Math.min(mask.N - 1, Math.max(0, Math.floor(ny * mask.N)));
      if (mask.isWater[my * mask.N + mx]) return { buildable: false, flatnessScore: 0 };
      // Center must also not border water directly
      if (pIdx === 0) {
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nmx = Math.min(mask.N - 1, Math.max(0, mx + dx));
          const nmy = Math.min(mask.N - 1, Math.max(0, my + dy));
          if (mask.isWater[nmy * mask.N + nmx]) return { buildable: false, flatnessScore: 0 };
        }
      }
      roughSum += mask.roughness ? mask.roughness[my * mask.N + mx] : 0.25;
    }
    const avgRough = roughSum / pts.length;
    const flatnessScore = Math.max(0, Math.min(100, Math.round((1 - Math.min(1, avgRough) / 0.85) * 100)));
    return { buildable: true, flatnessScore };
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

    // 3. Nearby Water Wells (best POI for Jackhammer, Chainsaw, Medical Syringes & Teas)
    const nearbyWells = mons
      .filter((m) => String(m.type || '').toLowerCase().includes('water well'))
      .map((m) => ({
        kind: 'waterwell',
        icon: '🚰',
        title: `${m.type} (Tools & Syringes)`,
        detail: 'NPC Shopkeeper: Jackhammer (~200 Scrap), Chainsaw, Syringes, Teas & Water Pump',
        wx: m.x,
        wy: m.y,
        grid: bfWorldToGrid(m.x, m.y, mapSize),
        distBase: distFromBase(m.x, m.y)
      }))
      .filter((w) => w.distBase === null || w.distBase <= maxQuarryDist)
      .sort((a, b) => (a.distBase ?? 99999) - (b.distBase ?? 99999))
      .slice(0, 2);
    results.push(...nearbyWells);

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
    const wantUnderwaterLab = Boolean(document.getElementById('bfUnderwaterLabCb')?.checked);
    const wantFarmOre = Boolean(document.getElementById('bfFarmOreCb')?.checked);
    const oreGrid = bfHeatmapGrids.Nodes || null;
    const spawnGrid = bfHeatmapGrids.PlayerSpawns || null;

    const targetMons = bfCustomTargetMonument
      ? [bfCustomTargetMonument]
      : mons.filter((m) => bfMatchesTarget(m.type, targetKey));
    const trafficMons = bfCustomTargetMonument
      ? mons.filter((m) => bfIsHighTraffic(m.type) && Math.hypot(m.x - bfCustomTargetMonument.x, m.y - bfCustomTargetMonument.y) > 20)
      : mons.filter((m) => bfIsHighTraffic(m.type) && !bfMatchesTarget(m.type, targetKey));
    const allTrafficMons = mons.filter((m) => bfIsHighTraffic(m.type));
    const t2Mons = mons
      .map((m) => ({ ...m, progW: bfTier2ProgWeight(m.type) }))
      .filter((m) => m.progW > 0);
    const supportMons = mons.filter((m) => bfIsTier01Support(m.type));
    const boatHubs = mons.filter((m) => bfIsBoatHub(m.type));
    const underwaterLabs = mons.filter((m) => String(m.type || '').toLowerCase().includes('underwater lab'));
    const largeOils = mons.filter((m) => {
      const t = String(m.type || '').toLowerCase();
      return t.includes('large oil') || t.includes('oilrig_large');
    });
    const smallOils = mons.filter((m) => {
      const t = String(m.type || '').toLowerCase();
      return t.includes('small oil') || t.includes('oilrig_small') || (t.includes('oil rig') && !t.includes('large'));
    });
    const hempGrid = bfHeatmapGrids.Hemp || null;
    const mask = bfLandMask || (bfLoadedImage ? bfBuildLandMask(bfLoadedImage, mapSize) : null);
    if (!bfNoBuildColliders.spheres.length && !bfNoBuildColliders.boxes.length && !bfNoBuildColliders.fallback.length) {
      bfPrepareNoBuildData(bfMapData);
    }
    const STEP_G = 96;
    const candidates = [];
    let bestStealth = null;

    for (let gy = 2; gy < STEP_G - 2; gy++) {
      for (let gx = 2; gx < STEP_G - 2; gx++) {
        const nx = (gx + 0.5) / STEP_G;
        const ny = (gy + 0.5) / STEP_G;
        const wx = (nx - 0.5) * mapSize;
        const wy = (0.5 - ny) * mapSize;

        // 1. Dry land footprint & coast distance check (~44m x 44m buildable land plot)
        let coastDist = Math.max(0, half * 0.85 - Math.hypot(wx, wy));
        const terrainCheck = bfCheckTerrainFootprint(mask, mapSize, wx, wy);
        if (!terrainCheck.buildable) continue;
        if (mask) {
          if (mask.oceanPts.length > 0) {
            let minCoast = Infinity;
            for (const op of mask.oceanPts) {
              const d = Math.hypot(wx - op.wx, wy - op.wy);
              if (d < minCoast) minCoast = d;
            }
            coastDist = minCoast;
          }
          if (coastDist < 34) continue;
        } else {
          if (Math.hypot(wx, wy) > half * 0.86) continue;
        }

        // 2. Skip building-blocked monument/collider zones (+32m base clearance margin)
        const plotCheck = bfIsBasePlotBuildable(wx, wy, 32);
        if (!plotCheck.ok) continue;

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

        // 6. Offshore Monuments: Underwater Labs + Large/Small Oil Rig
        let nearestLab = null;
        let labDist = Infinity;
        for (const ul of underwaterLabs) {
          const d = Math.hypot(wx - ul.x, wy - ul.y);
          if (d < labDist) {
            labDist = d;
            nearestLab = ul;
          }
        }
        let largeOilDist = Infinity;
        for (const lo of largeOils) {
          const d = Math.hypot(wx - lo.x, wy - lo.y);
          if (d < largeOilDist) largeOilDist = d;
        }
        let smallOilDist = Infinity;
        for (const so of smallOils) {
          const d = Math.hypot(wx - so.x, wy - so.y);
          if (d < smallOilDist) smallOilDist = d;
        }
        const labBonus = wantUnderwaterLab && nearestLab && labDist <= 1400 ? (1 - labDist / 1400) * 12 : 0;

        // 7. Preference-independent "Under the Radar + Tier 2 Fast Progress" overall pick
        // Based on Rust progression guides: 1.5–3 grids (220m–450m) from a Tier 2 monument,
        // ideally paired with a Tier 0/1 Green-Card/Metro support stop, far from Tier 3 / Outpost zerg hubs.
        let bestProgScore = t2Mons.length > 0 ? 0 : 50;
        let bestProgMon = null;
        let bestProgDist = Infinity;
        for (const pm of t2Mons) {
          const d = Math.hypot(wx - pm.x, wy - pm.y);
          const distPts =
            d >= 220 && d <= 450
              ? 100
              : d < 220
                ? 52
                : Math.max(0, 100 - ((d - 450) / (mapSize * 0.26)) * 100);
          const weighted = distPts * pm.progW;
          if (weighted > bestProgScore) {
            bestProgScore = weighted;
            bestProgMon = pm;
            bestProgDist = d;
          }
        }
        let nearestSupport = null;
        let supportDist = Infinity;
        for (const sm of supportMons) {
          const d = Math.hypot(wx - sm.x, wy - sm.y);
          if (d < supportDist) {
            supportDist = d;
            nearestSupport = sm;
          }
        }
        const supportBonus = nearestSupport && supportDist <= 600 ? (1 - supportDist / 600) * 8 : 0;

        // Separate strict low-traffic check against ALL high-traffic zerg hubs
        let stealthPenalty = 0;
        let minAllTrafficDist = Infinity;
        let nearestAllTraffic = null;
        for (const hm of allTrafficMons) {
          const d = Math.hypot(wx - hm.x, wy - hm.y);
          if (d < minAllTrafficDist) {
            minAllTrafficDist = d;
            nearestAllTraffic = hm;
          }
          const tLower = hm.type.toLowerCase();
          const dangerR = tLower.includes('outpost') || tLower.includes('launch') || tLower.includes('silo') ? 1050 : 800;
          if (d < dangerR) stealthPenalty += ((dangerR - d) / dangerR) * 44;
        }
        if (centerDist < half * 0.38) stealthPenalty += 24 * (1 - centerDist / (half * 0.38));
        if (spawnGrid) stealthPenalty += bfSampleDensity(spawnGrid, nx, ny) * 20;
        const stealthSafety = Math.max(0, Math.min(100, 100 - stealthPenalty));
        const hempDensity = hempGrid ? bfSampleDensity(hempGrid, nx, ny) : 0.5;
        const resScore = (oreDensity * 0.65 + hempDensity * 0.35) * 100;
        const edgeStealthPts = coastDist <= 460 ? 100 : Math.max(25, 100 - ((coastDist - 460) / 800) * 75);
        const stealthLabBonus = nearestLab && labDist <= 1200 ? (1 - labDist / 1200) * 5 : 0;
        const stealthTotal = Math.min(
          100,
          Math.round(
            stealthSafety * 0.35 +
              bestProgScore * 0.33 +
              resScore * 0.19 +
              edgeStealthPts * 0.09 +
              terrainCheck.flatnessScore * 0.04 +
              supportBonus +
              stealthLabBonus
          )
        );
        if (!bestStealth || stealthTotal > bestStealth.score) {
          bestStealth = {
            wx,
            wy,
            nx,
            ny,
            grid: bfWorldToGrid(wx, wy, mapSize),
            score: stealthTotal,
            lowTrafficScore: Math.round(stealthSafety),
            oreScore,
            flatnessScore: terrainCheck.flatnessScore,
            noBuildClearance: plotCheck.minClearance,
            targetDist: Math.round(bestProgDist),
            targetName: bestProgMon?.type || 'No T2 on map',
            supportDist: Math.round(supportDist),
            supportName: nearestSupport && supportDist <= 650 ? nearestSupport.type : '',
            coastDist: Math.round(coastDist),
            boatDist: Math.round(boatDist),
            boatName: nearestBoat?.type || 'Coast',
            minTrafficDist: Math.round(minAllTrafficDist),
            nearestTrafficName: nearestAllTraffic?.type || 'None',
            labDist: Math.round(labDist),
            labName: nearestLab?.type || '',
            labRedCard: nearestLab ? nearestLab.hasRedKeycard : null,
            largeOilDist: Math.round(largeOilDist),
            smallOilDist: Math.round(smallOilDist)
          };
        }

        // Weighted final score
        const wTarget = nearestTarget ? 0.33 : 0;
        const wDeep = wantDeepSea ? 0.27 : 0.06;
        const wTraffic = wantLowTraffic ? 0.25 : 0.10;
        const wOre = wantFarmOre && oreGrid ? 0.11 : 0;
        const wFlat = 0.04;
        const wSum = wTarget + wDeep + wTraffic + wOre + wFlat || 1;
        const total = Math.min(
          100,
          Math.round(
            (targetScore * wTarget +
              deepSeaScore * wDeep +
              lowTrafficScore * wTraffic +
              oreScore * wOre +
              terrainCheck.flatnessScore * wFlat) /
              wSum +
              labBonus
          )
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
          flatnessScore: terrainCheck.flatnessScore,
          noBuildClearance: plotCheck.minClearance,
          targetDist: Math.round(targetDist),
          targetName: nearestTarget?.type || targetKey,
          coastDist: Math.round(coastDist),
          boatDist: Math.round(boatDist),
          boatName: nearestBoat?.type || 'Coast',
          minTrafficDist: Math.round(minTrafficDist),
          nearestTrafficName: nearestTraffic?.type || 'None',
          labDist: Math.round(labDist),
          labName: nearestLab?.type || '',
          labRedCard: nearestLab ? nearestLab.hasRedKeycard : null,
          largeOilDist: Math.round(largeOilDist),
          smallOilDist: Math.round(smallOilDist)
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
    bfStealthBest = bestStealth;
    return picked;
  }

  // Enriched monument metadata (tiers, recyclers, keycards, safe zones, vending) from Rust bundle data
  const BF_MONUMENT_STYLE_RULES = [
    // Tier 3 & Zerg Hubs
    { match: 'launch site', icon: '🚀', label: 'Launch Site', color: '#ef4444', r: 6, tier: 3, rec: 1, cards: 'Green + Red', safe: false, vend: 0 },
    { match: 'missile silo', icon: '☢️', label: 'Missile Silo', color: '#ef4444', r: 6, tier: 3, rec: 0, cards: 'Red', safe: false, vend: 0 },
    { match: 'military tunnel', icon: '🪖', label: 'Mil. Tunnels', color: '#ef4444', r: 6, tier: 3, rec: 1, cards: 'Green + Blue + Red', safe: false, vend: 0 },
    { match: 'excavator', icon: '🏗️', label: 'Excavator', color: '#ef4444', r: 6, tier: 3, rec: 1, cards: 'None (Diesel)', safe: false, vend: 0 },
    { match: 'large oil', icon: '🛢️', label: 'Large Oil', color: '#ef4444', r: 6, tier: 3, rec: 0, cards: 'Green + Blue + Red', safe: false, vend: 0 },
    { match: 'oilrig_large', icon: '🛢️', label: 'Large Oil', color: '#ef4444', r: 6, tier: 3, rec: 0, cards: 'Green + Blue + Red', safe: false, vend: 0 },
    { match: 'small oil', icon: '🛢️', label: 'Small Oil', color: '#f97316', r: 5.5, tier: 2, rec: 0, cards: 'Green + Blue + Red', safe: false, vend: 0 },
    { match: 'oil rig', icon: '🛢️', label: 'Small Oil', color: '#f97316', r: 5.5, tier: 2, rec: 0, cards: 'Green + Blue + Red', safe: false, vend: 0 },
    { match: 'oilrig', icon: '🛢️', label: 'Small Oil', color: '#f97316', r: 5.5, tier: 2, rec: 0, cards: 'Green + Blue + Red', safe: false, vend: 0 },
    { match: 'outpost', icon: '🛡️', label: 'Outpost', color: '#22c55e', r: 6, tier: 0, rec: 3, cards: 'None', safe: true, vend: 7 },
    { match: 'bandit', icon: '🏴‍☠️', label: 'Bandit Camp', color: '#22c55e', r: 6, tier: 0, rec: 2, cards: 'None', safe: true, vend: 4 },
    // Tier 2 Monuments
    { match: 'water treatment', icon: '💧', label: 'Water Treat.', color: '#fb923c', r: 5.5, tier: 2, rec: 1, cards: 'Green + Blue', safe: false, vend: 0 },
    { match: 'powerplant', icon: '⚡', label: 'Power Plant', color: '#fb923c', r: 5.5, tier: 2, rec: 3, cards: 'Green + Blue', safe: false, vend: 0 },
    { match: 'power plant', icon: '⚡', label: 'Power Plant', color: '#fb923c', r: 5.5, tier: 2, rec: 3, cards: 'Green + Blue', safe: false, vend: 0 },
    { match: 'train yard', icon: '🚂', label: 'Train Yard', color: '#fb923c', r: 5.5, tier: 2, rec: 1, cards: 'Green + Blue', safe: false, vend: 0 },
    { match: 'airfield', icon: '✈️', label: 'Airfield', color: '#fb923c', r: 5.5, tier: 2, rec: 2, cards: 'Green + Blue', safe: false, vend: 0 },
    { match: 'sphere tank', icon: '🔵', label: 'The Dome', color: '#fb923c', r: 5, tier: 2, rec: 1, cards: 'Green (→ Blue)', safe: false, vend: 0 },
    { match: 'arctic research', icon: '❄️', label: 'Arctic Base', color: '#fb923c', r: 5.5, tier: 2, rec: 1, cards: 'Blue (→ Red)', safe: false, vend: 0 },
    { match: 'abandoned military', icon: '🪖', label: 'Aband. Mil.', color: '#fb923c', r: 5, tier: 2, rec: 0, cards: 'None (MLRS)', safe: false, vend: 0 },
    // Boat Hubs & Ocean
    { match: 'fishing village', icon: '⚓', label: 'Fishing', color: '#2dd4bf', r: 5, tier: 0, rec: 0, cards: 'None (Boat Vendor)', safe: true, vend: 1 },
    { match: 'harbor', icon: '⚓', label: 'Harbor', color: '#2dd4bf', r: 5, tier: 1, rec: 1, cards: 'Green (→ Blue)', safe: false, vend: 0 },
    { match: 'ferry', icon: '⛴️', label: 'Ferry', color: '#2dd4bf', r: 5, tier: 1, rec: 1, cards: 'Spawns Free Green + (Green → Blue)', safe: false, vend: 0 },
    { match: 'underwater lab', icon: '🔬', label: 'Underwater Lab', color: '#38bdf8', r: 4.5, tier: 2, rec: 0, cards: 'Green + Blue (+ Red*)', safe: false, vend: 0 },
    // Tier 0/1 & Support Monuments
    { match: 'sewer branch', icon: '🟢', label: 'Sewer Branch', color: '#a3e635', r: 5, tier: 1, rec: 1, cards: 'Green (→ Blue)', safe: false, vend: 0 },
    { match: 'satellite', icon: '📡', label: 'Satellite', color: '#a3e635', r: 5, tier: 1, rec: 1, cards: 'Green (→ Blue)', safe: false, vend: 0 },
    { match: 'radtown', icon: '☢️', label: 'Radtown', color: '#a3e635', r: 5, tier: 1, rec: 1, cards: 'Green (→ Blue)', safe: false, vend: 0 },
    { match: 'junkyard', icon: '♻️', label: 'Junkyard', color: '#a3e635', r: 4.5, tier: 0, rec: 1, cards: 'Spawns Free Green', safe: false, vend: 0 },
    { match: 'lighthouse', icon: '🗼', label: 'Lighthouse', color: '#94a3b8', r: 4, tier: 0, rec: 1, cards: 'Spawns Free Green', safe: false, vend: 0 },
    { match: 'supermarket', icon: '🛒', label: 'Market', color: '#94a3b8', r: 4, tier: 0, rec: 1, cards: 'Spawns Free Green', safe: false, vend: 0 },
    { match: 'gas station', icon: '⛽', label: "Oxum's", color: '#94a3b8', r: 4, tier: 0, rec: 1, cards: 'Spawns Free Green', safe: false, vend: 0 },
    { match: 'warehouse', icon: '📦', label: 'Mining Outpost', color: '#94a3b8', r: 4, tier: 0, rec: 1, cards: 'None (No Green Card)', safe: false, vend: 0 },
    { match: 'quarry', icon: '🏭', label: null, color: '#fbbf24', r: 4.5, tier: 1, rec: 0, cards: 'Diesel', safe: false, vend: 0 },
    { match: 'water well', icon: '🚰', label: 'Water Well', color: '#22d3ee', r: 4.5, tier: 0, rec: 0, cards: 'None', safe: false, vend: 1 }
  ];

  function bfGetMonumentVisual(m, targetKey) {
    const raw = String(m?.type || m || '');
    const t = raw.toLowerCase();
    if (t.includes('cave')) return null;
    const matchedRule = BF_MONUMENT_STYLE_RULES.find((rule) => t.includes(rule.match)) || null;
    if (bfMatchesTarget(raw, targetKey)) {
      return { color: '#38bdf8', short: `⚡ ${raw}`, r: 6.5, isMajor: true, meta: matchedRule };
    }
    if (t.includes('underwater lab')) {
      const redTag = m?.hasRedKeycard === true ? ' 🔴' : m?.hasRedKeycard === false ? ' (No Red)' : '';
      return { color: '#38bdf8', short: `🔬 Lab${redTag}`, r: 5.5, isMajor: true, meta: matchedRule };
    }
    if (matchedRule) {
      const name = matchedRule.label || raw.replace(' A', '').replace(' B', '').replace(' C', '');
      const isMajor = bfIsHighTraffic(raw) || bfIsBoatHub(raw) || bfTier2ProgWeight(raw) > 0 || t.includes('oil') || t.includes('water well');
      return { color: matchedRule.color, short: `${matchedRule.icon} ${name}`, r: matchedRule.r, isMajor, meta: matchedRule };
    }
    return null;
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

    const mapSize = bfMapData.size || 4000;
    const scale = (W / mapSize) * bfZoom;
    const toPx = (wx, wy) => ({
      px: W / 2 + (wx - bfPanX) * scale,
      py: H / 2 - (wy - bfPanY) * scale
    });

    const imgTopLeft = toPx(-mapSize / 2, mapSize / 2);
    const imgSizePx = mapSize * scale;

    if (bfLoadedImage) {
      ctx.drawImage(bfLoadedImage, imgTopLeft.px, imgTopLeft.py, imgSizePx, imgSizePx);
    }

    if (bfActiveHeatmap !== 'none' && bfHeatmapImages[bfActiveHeatmap]) {
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.drawImage(bfHeatmapImages[bfActiveHeatmap], imgTopLeft.px, imgTopLeft.py, imgSizePx, imgSizePx);
      ctx.restore();
    }

    // 1. Rust-accurate grid overlay
    const count = Math.max(1, Math.ceil(mapSize / 150));
    const cellPx = imgSizePx / count;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1;
    ctx.font = '600 9.5px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let i = 0; i <= count; i++) {
      const gx = imgTopLeft.px + i * cellPx;
      const gy = imgTopLeft.py + i * cellPx;
      ctx.beginPath();
      ctx.moveTo(gx, imgTopLeft.py);
      ctx.lineTo(gx, imgTopLeft.py + imgSizePx);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(imgTopLeft.px, gy);
      ctx.lineTo(imgTopLeft.px + imgSizePx, gy);
      ctx.stroke();
      if (i < count) {
        ctx.fillText(bfColLabel(i), gx + 3, Math.max(11, imgTopLeft.py + 11));
        ctx.fillText(String(i), Math.max(3, imgTopLeft.px + 3), gy + 18);
      }
    }
    ctx.restore();

    const targetKey = document.getElementById('bfTargetMonumentSelect')?.value || 'powerplant';
    const mons = bfMapData.monuments || [];

    // 2. Exact Rust No-Build Zones overlay (from RustMaps building_block.json or monument fallback)
    const showNoBuild = Boolean(document.getElementById('bfShowNoBuildCb')?.checked ?? true);
    if (showNoBuild) {
      const hasExact = bfNoBuildColliders.spheres.length > 0 || bfNoBuildColliders.boxes.length > 0;
      ctx.save();
      ctx.fillStyle = 'rgba(249, 115, 22, 0.16)';
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.72)';
      ctx.lineWidth = 1.25;
      ctx.setLineDash([4, 3]);

      if (hasExact) {
        bfNoBuildColliders.spheres.forEach((s) => {
          if (!s.isLarge && bfZoom < 2.0) return;
          const { px, py } = toPx(s.x, s.y);
          ctx.beginPath();
          ctx.arc(px, py, Math.max(2, s.r * scale), 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
        bfNoBuildColliders.boxes.forEach((b) => {
          if (!b.isLarge && bfZoom < 2.0) return;
          ctx.beginPath();
          b.corners.forEach((c, idx) => {
            const p = toPx(c.x, c.y);
            if (idx === 0) ctx.moveTo(p.px, p.py);
            else ctx.lineTo(p.px, p.py);
          });
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        });
      } else {
        bfNoBuildColliders.fallback.forEach((fb) => {
          const { px, py } = toPx(fb.x, fb.y);
          ctx.beginPath();
          ctx.arc(px, py, fb.r * scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
      }
      ctx.restore();
    }

    // 3. Monument pins (all monuments when Show All Monuments is checked, or key hubs only)
    bfRenderedPins = [];
    const showAllMons = Boolean(document.getElementById('bfShowMonumentsCb')?.checked ?? true);
    mons.forEach((m) => {
      const vis = bfGetMonumentVisual(m, targetKey);
      if (!vis) return;
      if (!showAllMons && !vis.isMajor) return;

      const { px, py } = toPx(m.x, m.y);
      const grid = bfWorldToGrid(m.x, m.y, mapSize);
      const meta = vis.meta;
      const lines = [];
      if (meta) {
        lines.push(`Tier ${meta.tier}${meta.safe ? ' • 🛡️ Safe Zone' : ''}`);
        if (meta.cards && meta.cards !== 'None') lines.push(`🔑 Cards: ${meta.cards}`);
        const fac = [];
        if (meta.rec > 0) fac.push(`♻️ ${meta.rec}× Recycler`);
        if (meta.vend > 0) fac.push(`🛒 ${meta.vend}× Vending`);
        if (fac.length) lines.push(fac.join(' • '));
      }
      const mLower = String(m.type || '').toLowerCase();
      if (mLower.includes('water well')) {
        lines.push('🛠️ Best for: Jackhammer, Chainsaw, Syringes & Teas');
      }
      if (mLower.includes('underwater lab')) {
        lines.push(
          m.hasRedKeycard === true
            ? '🔴 Red Keycard Room Confirmed'
            : m.hasRedKeycard === false
              ? 'No Red Keycard Room'
              : '⚠️ Red Keycard depends on lab layout'
        );
      }
      const isFocusedTarget = Boolean(
        bfCustomTargetMonument && Math.hypot(m.x - bfCustomTargetMonument.x, m.y - bfCustomTargetMonument.y) < 5
      );
      if (isFocusedTarget) {
        lines.push('🎯 Focused Target (click Reset in Build Spots to clear)');
      } else {
        lines.push('🎯 Click pin → Find best build spots around this monument');
      }
      bfRenderedPins.push({
        px,
        py,
        r: isFocusedTarget ? Math.max(vis.r + 3, 9) : vis.r,
        wx: m.x,
        wy: m.y,
        title: `${vis.short || m.type} [${grid}]`,
        color: isFocusedTarget ? '#38bdf8' : vis.color,
        lines,
        selectAction: { type: 'monument', monument: { type: m.type, x: m.x, y: m.y, grid } }
      });

      ctx.save();
      if (isFocusedTarget) {
        ctx.beginPath();
        ctx.arc(px, py, 480 * scale, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 1.6;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(px, py, vis.r + 7, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.fill();
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = '#38bdf8';
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(px, py, vis.r, 0, Math.PI * 2);
      ctx.fillStyle = isFocusedTarget ? '#38bdf8' : vis.color;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#090b0e';
      ctx.stroke();
      if (vis.short) {
        ctx.font = vis.isMajor ? '700 10px "Inter", sans-serif' : '600 9px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0,0,0,0.9)';
        ctx.lineWidth = 3;
        ctx.strokeText(vis.short, px, py - (vis.r + 4));
        ctx.fillStyle = vis.isMajor ? '#ffffff' : '#e2e8f0';
        ctx.fillText(vis.short, px, py - (vis.r + 4));
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

      bfRenderedPins.push({
        px,
        py,
        r: isSel ? 18 : 13,
        wx: spot.wx,
        wy: spot.wy,
        title: `#${idx + 1} Recommended Spot [${spot.grid}]`,
        color: idx === 0 ? '#facc15' : '#4ade80',
        lines: [`Score: ${spot.score}/100 • Click pin to select`],
        selectAction: { type: 'spot', idx }
      });
    });

    // 4B. Best Overall "Under the Radar" Fast-Progress Spot (regardless of preferences)
    if (bfStealthBest) {
      const { px, py } = toPx(bfStealthBest.wx, bfStealthBest.wy);
      const isSel = bfSelectedIdx === -1;
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, isSel ? 20 : 14, 0, Math.PI * 2);
      ctx.fillStyle = isSel ? 'rgba(168, 85, 247, 0.42)' : 'rgba(168, 85, 247, 0.24)';
      ctx.fill();
      ctx.lineWidth = isSel ? 2.8 : 2;
      ctx.strokeStyle = '#c084fc';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(px, py, 9.5, 0, Math.PI * 2);
      ctx.fillStyle = '#7e22ce';
      ctx.fill();

      ctx.font = '11px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🥷', px, py + 0.5);

      ctx.textBaseline = 'alphabetic';
      ctx.font = '700 10.5px "JetBrains Mono", monospace';
      ctx.strokeStyle = 'rgba(0,0,0,0.92)';
      ctx.lineWidth = 3;
      const lbl = `🥷 [${bfStealthBest.grid}] ${bfStealthBest.score}/100`;
      ctx.strokeText(lbl, px, py - 18);
      ctx.fillStyle = '#e9d5ff';
      ctx.fillText(lbl, px, py - 18);
      ctx.restore();

      bfRenderedPins.push({
        px,
        py,
        r: isSel ? 20 : 14,
        wx: bfStealthBest.wx,
        wy: bfStealthBest.wy,
        title: `🥷 Best Under-Radar [${bfStealthBest.grid}]`,
        color: '#c084fc',
        lines: [`Score: ${bfStealthBest.score}/100 • Click pin to select`],
        selectAction: { type: 'spot', idx: -1 }
      });
    }

    // 4C. Selected Spot Progression Route & Nearby Farming Radius
    const selSpot = getSelectedBuildSpot();
    const showRoute = Boolean(document.getElementById('bfShowRouteCb')?.checked ?? true);
    if (selSpot) {
      const selPx = toPx(selSpot.wx, selSpot.wy);
      const maxFarmR = Math.max(750, Math.round(mapSize * 0.24)) * scale;
      ctx.save();
      ctx.beginPath();
      ctx.arc(selPx.px, selPx.py, maxFarmR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.28)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.restore();

      if (showRoute) {
        const steps = computeProgressionRoute(selSpot);
        let prev = selPx;
        steps.forEach((st, sIdx) => {
          if (st.wx === undefined || st.wy === undefined || (sIdx === 0 && st.dist === 0)) return;
          const next = toPx(st.wx, st.wy);
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(prev.px, prev.py);
          ctx.lineTo(next.px, next.py);
          ctx.strokeStyle = st.color;
          ctx.globalAlpha = 0.72;
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.stroke();

          // Step number pill midpoint
          const mx = (prev.px + next.px) / 2;
          const my = (prev.py + next.py) / 2;
          ctx.globalAlpha = 1;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(mx, my, 8, 0, Math.PI * 2);
          ctx.fillStyle = '#0f172a';
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = st.color;
          ctx.stroke();
          ctx.font = '800 9.5px "JetBrains Mono", monospace';
          ctx.fillStyle = st.color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(sIdx + 1), mx, my + 0.5);
          ctx.restore();
          prev = next;
        });
      }
    }

    // 5. Top Farming Hotspots (Ore Ridges, Hemp/Berry Fields, Mining Quarries & Water Wells)
    bfFarmingSpots.forEach((fm, fIdx) => {
      const { px, py } = toPx(fm.wx, fm.wy);
      const isSel = fIdx === bfSelectedFarmIdx;
      // Avoid overlapping the Water Well monument pin unless actively selected from the Farming list
      if (fm.kind === 'waterwell' && !isSel) return;
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

      bfRenderedPins.push({
        px,
        py,
        r: isSel ? 13 : 9,
        wx: fm.wx,
        wy: fm.wy,
        title: `${fm.icon} ${fm.title} [${fm.grid}]`,
        color: '#fde047',
        lines: [fm.detail],
        selectAction: { type: 'farm', idx: fIdx }
      });
    });
  }

  function bfFormatOffshoreInfo(s) {
    const parts = [];
    if (s.labName && s.labDist < 99999) {
      const redStatus =
        s.labRedCard === true
          ? '<span style="color:#f87171;">🔴 Red Card Room</span>'
          : s.labRedCard === false
            ? '<span style="color:#94a3b8;">No Red Card Room</span>'
            : '<span style="color:#fbbf24;">⚠️ Red Card depends on lab layout</span>';
      parts.push(`<span style="color:#38bdf8;">🔬 Lab: ${s.labDist}m</span> (${redStatus})`);
    }
    if (s.largeOilDist < 99999) parts.push(`<span style="color:#f87171;">🛢️ Large Oil: ${s.largeOilDist}m</span>`);
    if (s.smallOilDist < 99999) parts.push(`<span style="color:#fb923c;">🛢️ Small Oil: ${s.smallOilDist}m</span>`);
    return parts.length ? `<div style="font-size:11.5px; color:var(--text-secondary); margin-top:4px; display:flex; gap:10px; flex-wrap:wrap;">${parts.join(' • ')}</div>` : '';
  }

  function renderBaseFinderResults() {
    const stealthSlot = document.getElementById('bfStealthBestSlot');
    const listEl = document.getElementById('bfResultsList');
    if (stealthSlot) {
      if (bfStealthBest) {
        const s = bfStealthBest;
        const isSel = bfSelectedIdx === -1;
        const riskLabel = s.lowTrafficScore >= 82 ? 'VERY LOW' : s.lowTrafficScore >= 62 ? 'LOW' : 'MEDIUM';
        const riskColor = s.lowTrafficScore >= 82 ? '#4ade80' : s.lowTrafficScore >= 62 ? '#facc15' : '#f87171';
        stealthSlot.innerHTML = `
          <div class="monument-item bf-spot-card ${isSel ? 'active' : ''}" data-bf-idx="-1" style="border-color: rgba(168, 85, 247, 0.55); background: linear-gradient(135deg, rgba(126, 34, 206, 0.16), rgba(15, 23, 42, 0.72));">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
              <div style="font-family:var(--font-display); font-size:15px; font-weight:700; color:#e9d5ff;">
                🥷 BEST OVERALL (UNDER THE RADAR) — Grid <span style="color:var(--sulfur-yellow); font-family:var(--font-mono);">[${s.grid}]</span>
              </div>
              <span class="combo-badge" style="font-size:12px; background:rgba(168,85,247,0.28); border-color:#a855f7; color:#f3e8ff;">${s.score}/100</span>
            </div>
            <div style="font-size:11.5px; color:#cbd5e1; margin-top:4px;">
              Tier 2 progression (1.5–3 grids off) + low raid risk, calculated <strong>regardless of your filter preferences</strong>.
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap; margin:8px 0; font-family:var(--font-mono); font-size:11px;">
              <span style="color:#38bdf8;">⚡ Tier 2: ${s.targetName} (${s.targetDist < 99999 ? s.targetDist + 'm' : 'N/A'})</span>
              ${s.supportName ? `<span style="color:#86efac;">🟢 Support: ${s.supportName} (${s.supportDist}m)</span>` : ''}
              <span style="color:#2dd4bf;">🌊 Coast: ${s.coastDist}m</span>
              <span style="color:#fbbf24;">⛏️ Ore: ${s.oreScore >= 65 ? 'HIGH' : s.oreScore >= 35 ? 'MED' : 'LOW'} (${s.oreScore}%)</span>
              <span style="color:#86efac;">🧱 No-Build Clear: ${s.noBuildClearance >= 900 ? 'Open Land' : `+${s.noBuildClearance}m`}</span>
              <span style="color:${riskColor};">🛡️ Raid Risk: ${riskLabel}</span>
            </div>
            <div style="font-size:12px; color:var(--text-secondary);">
              Nearest hotspot: <strong style="color:#e2e8f0;">${s.nearestTrafficName}</strong> (${s.minTrafficDist < 99999 ? s.minTrafficDist + 'm away' : 'none'})
            </div>
            ${bfFormatOffshoreInfo(s)}
          </div>
        `;
      } else {
        stealthSlot.innerHTML = '';
      }
    }

    const focusBar = document.getElementById('bfFocusedMonumentBar');
    if (focusBar) {
      if (bfCustomTargetMonument) {
        focusBar.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:8px 10px; border-radius:6px; background:rgba(56, 189, 248, 0.14); border:1px solid rgba(56, 189, 248, 0.45); font-size:12px;">
            <span>🎯 Targeted Monument: <strong style="color:#fff;">${bfCustomTargetMonument.type} [${bfCustomTargetMonument.grid}]</strong></span>
            <button id="bfClearFocusMonBtn" class="btn btn-secondary" style="padding:3px 8px; font-size:11px;">✕ Reset</button>
          </div>
        `;
        focusBar.querySelector('#bfClearFocusMonBtn')?.addEventListener('click', () => {
          bfCustomTargetMonument = null;
          rerunBaseFinderScoring();
        });
      } else {
        focusBar.innerHTML = '';
      }
    }

    if (!listEl) return;
    if (!bfTopSpots || bfTopSpots.length === 0) {
      listEl.innerHTML = `<div style="padding:20px; text-align:center; color:var(--text-muted);">No valid build spots found for these filters.</div>`;
    } else {
      listEl.innerHTML = bfTopSpots
        .map((s, idx) => {
          const isSel = idx === bfSelectedIdx;
          const riskLabel = s.lowTrafficScore >= 82 ? 'VERY LOW' : s.lowTrafficScore >= 62 ? 'LOW' : 'MEDIUM';
          const riskColor = s.lowTrafficScore >= 82 ? '#4ade80' : s.lowTrafficScore >= 62 ? '#facc15' : '#f87171';
          const rankBadge = idx === 0
            ? (bfCustomTargetMonument ? `🥇 #1 NEAR ${bfCustomTargetMonument.type.toUpperCase()}` : '🥇 #1 BEST FOR YOUR FILTERS')
            : `#${idx + 1} OPTION`;
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
                <span style="color:#86efac;">🧱 No-Build Clear: ${s.noBuildClearance >= 900 ? 'Open Land' : `+${s.noBuildClearance}m`}</span>
                <span style="color:${riskColor};">🛡️ Raid Risk: ${riskLabel}</span>
              </div>
              <div style="font-size:12px; color:var(--text-secondary);">
                Nearest hotspot: <strong style="color:#e2e8f0;">${s.nearestTrafficName}</strong> (${s.minTrafficDist < 99999 ? s.minTrafficDist + 'm away' : 'none'})
              </div>
              ${bfFormatOffshoreInfo(s)}
            </div>
          `;
        })
        .join('');
    }

    document.querySelectorAll('#tab-basefinder .bf-spot-card').forEach((card) => {
      card.addEventListener('click', () => {
        const parsed = parseInt(card.getAttribute('data-bf-idx'), 10);
        bfSelectBuildSpot(Number.isNaN(parsed) ? 0 : parsed);
      });
      card.addEventListener('dblclick', () => {
        const spot = getSelectedBuildSpot();
        if (spot) bfFocusWorldPoint(spot.wx, spot.wy, 1.7);
      });
    });
  }

  function bfSelectBuildSpot(idx) {
    bfSelectedIdx = idx;
    bfSelectedFarmIdx = -1;
    bfFarmingSpots = computeFarmingSpots(bfLandMask, getSelectedBuildSpot());
    renderBaseFinderResults();
    renderBaseFinderFarming();
    renderBaseFinderRoute();
    renderBaseFinderMap();
    renderMonumentAtlas();
  }

  function renderBaseFinderFarming() {
    const farmEl = document.getElementById('bfFarmingList');
    const farmBadge = document.getElementById('bfFarmCountBadge');
    if (farmBadge) {
      farmBadge.textContent = bfFarmingSpots && bfFarmingSpots.length > 0 ? `(${bfFarmingSpots.length})` : '';
    }
    if (!farmEl) return;
    const selSpot = getSelectedBuildSpot();
    const selLabel = selSpot
      ? (bfSelectedIdx === -1 ? `🥷 Under-Radar [${selSpot.grid}]` : `#${bfSelectedIdx + 1} [${selSpot.grid}]`)
      : 'selected spot';

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
      card.addEventListener('dblclick', () => {
        const idx = parseInt(card.getAttribute('data-farm-idx'), 10);
        const fm = bfFarmingSpots[idx];
        if (fm) bfFocusWorldPoint(fm.wx, fm.wy, 1.7);
      });
    });
  }

  function computeProgressionRoute(spot) {
    if (!spot || !bfMapData) return [];
    const mons = bfMapData.monuments || [];
    const mapSize = bfMapData.size || 4000;
    const findNearest = (matcher) => {
      let best = null;
      let bestD = Infinity;
      for (const m of mons) {
        if (!matcher(String(m.type || '').toLowerCase())) continue;
        const d = Math.hypot(m.x - spot.wx, m.y - spot.wy);
        if (d < bestD) {
          bestD = d;
          best = m;
        }
      }
      return best ? { ...best, dist: Math.round(bestD), grid: bfWorldToGrid(best.x, best.y, mapSize) } : null;
    };

    const greenCardMon = findNearest((t) => t.includes('supermarket') || t.includes('gas station') || t.includes('lighthouse') || t.includes('junkyard') || t.includes('ferry'));
    const nearWarehouse = findNearest((t) => t.includes('warehouse'));
    const usedFerryStep1 = greenCardMon && String(greenCardMon.type || '').toLowerCase().includes('ferry') && (!nearWarehouse || greenCardMon.dist <= 850 || greenCardMon.dist <= nearWarehouse.dist + 200);
    const step2 =
      findNearest((t) => (bfIsSewerBranch(t) || t.includes('satellite') || t.includes('harbor') || (!usedFerryStep1 && t.includes('ferry')) || t.includes('radtown') || t.includes('sphere tank'))) ||
      findNearest((t) => t.includes('ferry'));
    const step3 =
      findNearest(
        (t) =>
          t.includes('water treatment') ||
          t.includes('powerplant') ||
          t.includes('power plant') ||
          t.includes('train yard') ||
          t.includes('trainyard') ||
          t.includes('airfield') ||
          t.includes('arctic research')
      ) || findNearest((t) => bfTier2ProgWeight(t) > 0);
    const step4 = findNearest((t) => t.includes('underwater lab') || t.includes('fishing village') || t.includes('oil'));

    const route = [];
    if (greenCardMon && (!nearWarehouse || greenCardMon.dist <= 850 || greenCardMon.dist <= nearWarehouse.dist + 200)) {
      const isFerryStep1 = String(greenCardMon.type || '').toLowerCase().includes('ferry');
      route.push({
        step: isFerryStep1 ? '1. Green Card (+ Blue Bonus)' : '1. Green Card & Scrap',
        color: '#a3e635',
        name: greenCardMon.type,
        grid: greenCardMon.grid,
        dist: greenCardMon.dist,
        wx: greenCardMon.x,
        wy: greenCardMon.y,
        note: isFerryStep1
          ? 'Spawns FREE Green Card on-site + Green Recycler — bring 1× Fuse to immediately unlock Ferry\'s Blue Card too!'
          : 'Guaranteed Green Card on-site + crates/recycler (or farm Road Scientists along any road).'
      });
    } else if (nearWarehouse) {
      route.push({
        step: '1. Road Scientists + Scrap',
        color: '#a3e635',
        name: `Road / Mining Outpost`,
        grid: nearWarehouse.grid,
        dist: nearWarehouse.dist,
        wx: nearWarehouse.x,
        wy: nearWarehouse.y,
        note: `Mining Outpost has NO Green Card spawn — farm Road Scientists on the road (~8% Green Card drop) & recycle here${greenCardMon ? ` (nearest desk: ${greenCardMon.type} [${greenCardMon.grid}], ${greenCardMon.dist}m)` : ''}.`
      });
    } else if (greenCardMon) {
      route.push({
        step: '1. Green Card (or Road Scientists)',
        color: '#a3e635',
        name: greenCardMon.type,
        grid: greenCardMon.grid,
        dist: greenCardMon.dist,
        wx: greenCardMon.x,
        wy: greenCardMon.y,
        note: `Nearest guaranteed Green Card desk is ${greenCardMon.dist}m away — farming Road Scientists near base is usually faster!`
      });
    } else {
      route.push({
        step: '1. Green Card Farm',
        color: '#a3e635',
        name: 'Roadside Scientists',
        grid: spot.grid,
        dist: 0,
        wx: spot.wx,
        wy: spot.wy,
        note: 'No Green Card desk monument on map — kill Road Scientists along roads (~8% Green Card drop) + hit barrels for early scrap.'
      });
    }

    if (step2) {
      route.push({
        step: '2. Blue Card Puzzle',
        color: '#38bdf8',
        name: step2.type,
        grid: step2.grid,
        dist: step2.dist,
        wx: step2.x,
        wy: step2.y,
        note: 'Bring 1× Green Card + 1× Fuse → loot Blue Card + Blueprint Page + crates.'
      });
    }
    if (step3) {
      const rule = BF_MONUMENT_STYLE_RULES.find((r) => String(step3.type || '').toLowerCase().includes(r.match));
      const recText = rule && rule.rec > 0 ? ` • ${rule.rec}× Recycler` : '';
      const t3 = String(step3.type || '').toLowerCase();
      const s3Note = t3.includes('abandoned military')
        ? `No puzzle needed — loot MLRS crates/Military Crates${recText}.`
        : t3.includes('arctic research')
          ? `Bring 1× Blue Card (0 Fuses!) → Red Card + 2× BP Pages${recText}.`
          : t3.includes('airfield') || t3.includes('train')
            ? `Bring Blue (+ Green) Card + Fuses → Red Card + BP Pages${recText}.`
            : `Bring 1× Blue Card + 1× Fuse → Red Card + Mil Crates${recText}.`;
      route.push({
        step: '3. Tier 2 & Red Card',
        color: '#fb923c',
        name: step3.type,
        grid: step3.grid,
        dist: step3.dist,
        wx: step3.x,
        wy: step3.y,
        note: s3Note
      });
    }
    if (step4) {
      const isLab = String(step4.type || '').toLowerCase().includes('underwater lab');
      const labNote =
        isLab && step4.hasRedKeycard === true
          ? 'Red Keycard room confirmed — bring Green/Blue/Red + 3 Fuses.'
          : isLab
            ? 'Low-key ocean loot (scout layout for Red Card room; bring sub/scuba).'
            : 'Safe boat/sub access or offshore Tier 3 Red Card run.';
      route.push({
        step: '4. Ocean / Endgame Loop',
        color: '#2dd4bf',
        name: step4.type,
        grid: step4.grid,
        dist: step4.dist,
        wx: step4.x,
        wy: step4.y,
        note: labNote
      });
    }
    return route;
  }

  function bfFocusWorldPoint(wx, wy, zoomTarget = 1.65) {
    if (!bfMapData || wx === undefined || wy === undefined) return;
    bfPanX = wx;
    bfPanY = wy;
    bfZoom = Math.max(bfZoom, zoomTarget);
    renderBaseFinderMap();
  }

  function renderBaseFinderRoute() {
    const routeEl = document.getElementById('bfRouteList');
    if (!routeEl) return;
    const spot = getSelectedBuildSpot();
    if (!spot) return;
    const steps = computeProgressionRoute(spot);
    if (!steps.length) {
      routeEl.innerHTML = `<div style="padding:12px; text-align:center; color:var(--text-muted); font-size:12px;">No progression monuments found on this map.</div>`;
      return;
    }
    routeEl.innerHTML = steps
      .map(
        (st, idx) => `
        <div class="monument-item bf-route-step-card" data-route-idx="${idx}" style="padding:9px 12px; border-left:3px solid ${st.color}; cursor:pointer;" title="Click to focus map on ${st.name}">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
            <div style="font-family:var(--font-display); font-weight:700; font-size:13px; color:${st.color};">${st.step}: <span style="color:#fff;">${st.name}</span></div>
            <span class="keycard-tag keycard-Fuse">[${st.grid}] • ${st.dist > 0 ? `${st.dist}m` : 'Roads'}</span>
          </div>
          <div style="font-size:11.5px; color:var(--text-secondary); margin-top:3px;">${st.note}</div>
        </div>
      `
      )
      .join('');

    routeEl.querySelectorAll('.bf-route-step-card').forEach((card) => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.getAttribute('data-route-idx'), 10);
        const st = steps[idx];
        if (st) bfFocusWorldPoint(st.wx, st.wy, 1.55);
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
    renderBaseFinderRoute();
    renderBaseFinderMap();
  }

  function initBaseFinderModule() {
    const analyzeBtn = document.getElementById('bfAnalyzeBtn');
    const urlInput = document.getElementById('bfMapUrlInput');
    const statusEl = document.getElementById('bfStatusBar');
    const metaEl = document.getElementById('bfMapMetaLabel');
    const recentBar = document.getElementById('bfRecentMapsBar');
    const RECENT_MAPS_KEY = 'rust_companion_recent_maps_v1';

    function bfGetRecentMaps() {
      try {
        const raw = localStorage.getItem(RECENT_MAPS_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
      } catch (_) {
        return [];
      }
    }

    function bfSaveRecentMap(entry) {
      const next = [entry, ...bfGetRecentMaps().filter((m) => m.id !== entry.id)].slice(0, 5);
      try {
        localStorage.setItem(RECENT_MAPS_KEY, JSON.stringify(next));
      } catch (_) {}
      bfRenderRecentMaps();
    }

    function bfRenderRecentMaps() {
      if (!recentBar) return;
      const list = bfGetRecentMaps();
      if (!list.length) {
        recentBar.innerHTML = '';
        return;
      }
      recentBar.innerHTML =
        `<span style="font-size:11px; color:var(--text-muted); font-weight:700;">RECENT MAPS:</span>` +
        list
          .map(
            (m) =>
              `<button class="filter-pill bf-recent-pill" data-map-url="${m.url}" style="padding:3px 9px; font-size:11px;">🗺️ ${m.id}</button>`
          )
          .join('');
      recentBar.querySelectorAll('.bf-recent-pill').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (urlInput) urlInput.value = btn.getAttribute('data-map-url') || '';
          runAnalyze();
        });
      });
    }

    async function runAnalyze() {
      const url = urlInput?.value.trim();
      if (!url) {
        alert('Paste a RustMaps.com URL (e.g. https://rustmaps.com/map/4250_1337420) or size_seed first!');
        return;
      }
      if (window.location.protocol === 'file:') {
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
        bfCustomTargetMonument = null;
        bfPrepareNoBuildData(data);
        bfZoom = bfComputeFitZoom();
        bfPanX = 0;
        bfPanY = 0;
        bfHeatmapImages = {};
        bfHeatmapGrids = {};
        bfSaveRecentMap({
          id: `${data.size}_${data.seed}`,
          url: data.rustmapsUrl || `${data.size}_${data.seed}`
        });
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

    document.getElementById('bfTargetMonumentSelect')?.addEventListener('change', () => {
      bfCustomTargetMonument = null;
      rerunBaseFinderScoring();
    });
    ['bfDeepSeaCb', 'bfLowTrafficCb', 'bfUnderwaterLabCb', 'bfFarmOreCb'].forEach((id) => {
      document.getElementById(id)?.addEventListener('change', rerunBaseFinderScoring);
    });
    document.getElementById('bfShowMonumentsCb')?.addEventListener('change', renderBaseFinderMap);
    document.getElementById('bfShowNoBuildCb')?.addEventListener('change', renderBaseFinderMap);
    document.getElementById('bfShowRouteCb')?.addEventListener('change', renderBaseFinderMap);

    // Zoom, Fit All, Island 100%, Full-Width Expand, and Drag-to-Pan controls
    const setZoomClamped = (nextZoom) => {
      bfZoom = Math.max(0.45, Math.min(3.5, nextZoom));
      renderBaseFinderMap();
    };
    document.getElementById('bfZoomInBtn')?.addEventListener('click', () => setZoomClamped(bfZoom * 1.24));
    document.getElementById('bfZoomOutBtn')?.addEventListener('click', () => setZoomClamped(bfZoom * 0.80));
    document.getElementById('bfZoomFitBtn')?.addEventListener('click', () => {
      bfPanX = 0;
      bfPanY = 0;
      setZoomClamped(bfComputeFitZoom());
    });
    document.getElementById('bfZoomResetBtn')?.addEventListener('click', () => {
      bfPanX = 0;
      bfPanY = 0;
      setZoomClamped(1);
    });
    const expandBtn = document.getElementById('bfExpandMapBtn');
    const layoutEl = document.getElementById('bfLayoutContainer');
    expandBtn?.addEventListener('click', () => {
      const expanded = layoutEl?.classList.toggle('bf-map-expanded');
      expandBtn.textContent = expanded ? '⤡ Split View' : '⤢ Full Width';
    });

    const bfCanvas = document.getElementById('bfMapCanvas');
    if (bfCanvas) {
      let dragging = false;
      let dragMoved = 0;
      let lastX = 0;
      let lastY = 0;
      bfCanvas.addEventListener('mousedown', (e) => {
        dragging = true;
        dragMoved = 0;
        lastX = e.clientX;
        lastY = e.clientY;
        bfCanvas.style.cursor = 'grabbing';
      });
      window.addEventListener('mouseup', () => {
        if (!dragging) return;
        dragging = false;
        bfCanvas.style.cursor = 'grab';
      });
      window.addEventListener('mousemove', (e) => {
        if (!dragging || !bfMapData) return;
        dragMoved += Math.hypot(e.clientX - lastX, e.clientY - lastY);
        const rect = bfCanvas.getBoundingClientRect();
        const mapSize = bfMapData.size || 4000;
        const scale = (bfCanvas.width / mapSize) * bfZoom;
        const dx = ((e.clientX - lastX) * bfCanvas.width) / Math.max(1, rect.width);
        const dy = ((e.clientY - lastY) * bfCanvas.height) / Math.max(1, rect.height);
        lastX = e.clientX;
        lastY = e.clientY;
        bfPanX -= dx / scale;
        bfPanY += dy / scale;
        renderBaseFinderMap();
      });
      bfCanvas.addEventListener('click', (e) => {
        if (dragMoved >= 6 || !bfMapData || !bfRenderedPins.length) return;
        const rect = bfCanvas.getBoundingClientRect();
        const cx = ((e.clientX - rect.left) * bfCanvas.width) / Math.max(1, rect.width);
        const cy = ((e.clientY - rect.top) * bfCanvas.height) / Math.max(1, rect.height);

        let nearestActionPin = null;
        let minDist = Infinity;
        for (const pin of bfRenderedPins) {
          if (!pin.selectAction) continue;
          const dist = Math.hypot(cx - pin.px, cy - pin.py);
          if (dist <= pin.r + 10 && dist < minDist) {
            minDist = dist;
            nearestActionPin = pin;
          }
        }
        if (!nearestActionPin) return;

        if (nearestActionPin.selectAction.type === 'spot') {
          bfSelectBuildSpot(nearestActionPin.selectAction.idx);
        } else if (nearestActionPin.selectAction.type === 'farm') {
          bfSelectedFarmIdx = nearestActionPin.selectAction.idx;
          renderBaseFinderFarming();
          renderBaseFinderMap();
        } else if (nearestActionPin.selectAction.type === 'monument') {
          const mon = nearestActionPin.selectAction.monument;
          bfCustomTargetMonument = mon;
          rerunBaseFinderScoring();
          bfSwitchSubtab('spots');
          if (statusEl) {
            statusEl.textContent = `🎯 Ranked top build spots around ${mon.type} [${mon.grid}] — Best: Grid ${bfTopSpots[0]?.grid || '-'} (${bfTopSpots[0]?.score || 0}/100)`;
          }
        }
      });
      const tooltipEl = document.getElementById('bfMapTooltip');
      const hudEl = document.getElementById('bfMapHudReadout');
      bfCanvas.addEventListener('mouseleave', () => {
        if (tooltipEl) tooltipEl.style.display = 'none';
        if (hudEl) hudEl.style.display = 'none';
      });
      bfCanvas.addEventListener('mousemove', (e) => {
        if (dragging || !bfMapData) return;
        const rect = bfCanvas.getBoundingClientRect();
        const mapSize = bfMapData.size || 4000;
        const scale = (bfCanvas.width / mapSize) * bfZoom;
        const cx = ((e.clientX - rect.left) * bfCanvas.width) / Math.max(1, rect.width);
        const cy = ((e.clientY - rect.top) * bfCanvas.height) / Math.max(1, rect.height);
        const wx = (cx - bfCanvas.width / 2) / scale + bfPanX;
        const wy = -(cy - bfCanvas.height / 2) / scale + bfPanY;
        const grid = bfWorldToGrid(wx, wy, mapSize);
        const selSpot = getSelectedBuildSpot();
        const selDist = selSpot ? Math.round(Math.hypot(wx - selSpot.wx, wy - selSpot.wy)) : null;

        if (hudEl) {
          hudEl.style.display = 'block';
          const isWaterPx = bfIsPointWater(bfLandMask, mapSize, wx, wy);
          const nb = bfCheckNoBuildZone(wx, wy, 32, 14);
          const buildStatus = isWaterPx
            ? '<span style="color:#38bdf8;">🌊 WATER</span>'
            : nb.inside
              ? '<span style="color:#f87171;">🚫 BUILDING BLOCKED</span>'
              : nb.blocked
                ? `<span style="color:#fb923c;">⚠️ Too Close (${Math.max(0, nb.minClearance)}m)</span>`
                : `<span style="color:#4ade80;">🧱 Buildable (${nb.minClearance >= 900 ? 'Open' : `+${nb.minClearance}m`})</span>`;
          hudEl.innerHTML = `Grid ${grid}${selDist !== null ? ` • ${selDist}m from ${bfSelectedIdx === -1 ? '🥷' : '#' + (bfSelectedIdx + 1)} [${selSpot.grid}]` : ''} • ${buildStatus}`;
        }

        if (tooltipEl) {
          let hit = null;
          let bestD = Infinity;
          for (const pin of bfRenderedPins) {
            const d = Math.hypot(cx - pin.px, cy - pin.py);
            if (d <= pin.r + 9 && d < bestD) {
              bestD = d;
              hit = pin;
            }
          }
          if (hit) {
            const distFromSel = selSpot ? Math.round(Math.hypot(hit.wx - selSpot.wx, hit.wy - selSpot.wy)) : null;
            const extraLines = [...hit.lines];
            if (distFromSel !== null) extraLines.push(`📍 ${distFromSel}m from [${selSpot.grid}]`);
            tooltipEl.innerHTML = `<div style="font-weight:700; color:${hit.color || '#fff'}; margin-bottom:3px;">${hit.title}</div>` +
              extraLines.map((l) => `<div style="color:#cbd5e1; line-height:1.35;">${l}</div>`).join('');
            tooltipEl.style.display = 'block';
            const leftPx = Math.min(rect.width - 230, Math.max(8, e.clientX - rect.left + 14));
            const topPx = Math.min(rect.height - 95, Math.max(8, e.clientY - rect.top + 14));
            tooltipEl.style.left = `${leftPx}px`;
            tooltipEl.style.top = `${topPx}px`;
          } else {
            tooltipEl.style.display = 'none';
          }
        }
      });

      bfCanvas.addEventListener(
        'wheel',
        (e) => {
          if (!bfMapData) return;
          e.preventDefault();
          const factor = e.deltaY < 0 ? 1.14 : 0.88;
          setZoomClamped(bfZoom * factor);
        },
        { passive: false }
      );
    }

    document.querySelectorAll('#bfHeatmapPills .filter-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#bfHeatmapPills .filter-pill').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        bfActiveHeatmap = btn.getAttribute('data-hm') || 'none';
        renderBaseFinderMap();
      });
    });

    document.querySelectorAll('.bf-subtab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        bfSwitchSubtab(btn.getAttribute('data-bf-sub'));
      });
    });

    bfRenderRecentMaps();
    const recentMaps = bfGetRecentMaps();
    if (urlInput && !urlInput.value.trim() && recentMaps.length > 0) {
      urlInput.value = recentMaps[0].url;
      if (window.location.protocol !== 'file:') {
        runAnalyze();
      }
    }

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
    renderRaidStashReadiness();
    renderMonumentAtlas();
    renderTimersTick();
    renderSavedClonesAndTeas();
    solveBestCrossbreed();
    renderRecyclerCalculator();
    renderDieselCalculator();
    renderDecayCalculator();
  }

  window.addEventListener('DOMContentLoaded', () => {
    const safeRun = (fn) => {
      try {
        fn();
      } catch (err) {
        console.error('[Init Error]', fn.name, err);
      }
    };
    safeRun(initNavigation);
    safeRun(initRaidModule);
    safeRun(initRaidStashModule);
    safeRun(initMonumentsModule);
    safeRun(initTimerModule);
    safeRun(initGeneticsModule);
    safeRun(initRecyclerDieselDecayModule);
    safeRun(initBaseFinderModule);
    safeRun(renderAll);
    safeRun(initSquadSSE);
  });
})();
