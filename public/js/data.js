/**
 * RUST TACTICAL COMPANION — GAME DATABASE (2026 META)
 * Complete dataset for Raiding, Sulfur Combos, Monuments, Keycard Puzzles,
 * Base Building Spots, Node Hotspots, Plant Genetics, and Berry Teas.
 */

window.RUST_DATA = {
  // =========================================================================
  // 1. RAID TOOLS & CRAFTING COSTS
  // =========================================================================
  raidTools: {
    c4: {
      id: 'c4',
      name: 'C4 (Timed Explosive)',
      shortName: 'C4',
      category: 'explosive',
      wb: 'T3',
      sulfur: 2200,
      charcoal: 3000,
      metal: 200,
      lgf: 60,
      cloth: 5,
      techTrash: 2,
      pipes: 0,
      rope: 0,
      color: '#ef4444'
    },
    rocket: {
      id: 'rocket',
      name: 'Rocket',
      shortName: 'Rocket',
      category: 'explosive',
      wb: 'T3',
      sulfur: 1400,
      charcoal: 1950,
      metal: 100,
      lgf: 30,
      cloth: 0,
      techTrash: 0,
      pipes: 2,
      rope: 0,
      color: '#f97316'
    },
    explo_ammo: {
      id: 'explo_ammo',
      name: 'Explosive 5.56 Ammo',
      shortName: 'Explo 5.56',
      category: 'explosive',
      wb: 'T3',
      sulfur: 25,
      charcoal: 30,
      metal: 5,
      lgf: 0,
      cloth: 0,
      techTrash: 0,
      pipes: 0,
      rope: 0,
      color: '#eab308'
    },
    satchel: {
      id: 'satchel',
      name: 'Satchel Charge',
      shortName: 'Satchel',
      category: 'explosive',
      wb: 'T1',
      sulfur: 480,
      charcoal: 720,
      metal: 80,
      lgf: 0,
      cloth: 40,
      techTrash: 0,
      pipes: 0,
      rope: 1,
      color: '#d97706'
    },
    beancan: {
      id: 'beancan',
      name: 'Beancan Grenade',
      shortName: 'Beancan',
      category: 'explosive',
      wb: 'T1',
      sulfur: 120,
      charcoal: 180,
      metal: 20,
      lgf: 0,
      cloth: 0,
      techTrash: 0,
      pipes: 0,
      rope: 0,
      color: '#a16207'
    },
    hv_rocket: {
      id: 'hv_rocket',
      name: 'HV Rocket',
      shortName: 'HV Rocket',
      category: 'explosive',
      wb: 'T2',
      sulfur: 200,
      charcoal: 300,
      metal: 0,
      lgf: 0,
      cloth: 0,
      techTrash: 0,
      pipes: 1,
      rope: 0,
      color: '#38bdf8'
    },
    incen_rocket: {
      id: 'incen_rocket',
      name: 'Incendiary Rocket',
      shortName: 'Incen Rocket',
      category: 'fire',
      wb: 'T2',
      sulfur: 610,
      charcoal: 900,
      metal: 0,
      lgf: 253,
      cloth: 0,
      techTrash: 0,
      pipes: 2,
      rope: 0,
      color: '#fb923c'
    },
    molotov: {
      id: 'molotov',
      name: 'Molotov Cocktail',
      shortName: 'Molotov',
      category: 'fire',
      wb: 'T2',
      sulfur: 0,
      charcoal: 0,
      metal: 0,
      lgf: 50,
      cloth: 10,
      techTrash: 0,
      pipes: 0,
      rope: 0,
      color: '#22c55e'
    },
    flamethrower: {
      id: 'flamethrower',
      name: 'Flame Thrower (Fuel)',
      shortName: 'LGF Fuel',
      category: 'fire',
      wb: 'T2',
      sulfur: 0,
      charcoal: 0,
      metal: 0,
      lgf: 1,
      cloth: 0,
      techTrash: 0,
      pipes: 0,
      rope: 0,
      color: '#10b981'
    },
    f1_grenade: {
      id: 'f1_grenade',
      name: 'F1 Grenade',
      shortName: 'F1 Grenade',
      category: 'explosive',
      wb: 'T2 / Bandit',
      sulfur: 60,
      charcoal: 90,
      metal: 25,
      lgf: 0,
      cloth: 0,
      techTrash: 0,
      pipes: 0,
      rope: 0,
      color: '#84cc16'
    },
    jackhammer: {
      id: 'jackhammer',
      name: 'Jackhammer (Refills)',
      shortName: 'Jackhammer',
      category: 'melee',
      wb: 'Outpost',
      sulfur: 0,
      charcoal: 0,
      metal: 0,
      lgf: 0,
      cloth: 0,
      techTrash: 0,
      pipes: 0,
      rope: 0,
      color: '#a855f7'
    },
    salvaged_sword: {
      id: 'salvaged_sword',
      name: 'Salvaged Sword',
      shortName: 'Salv. Sword',
      category: 'melee',
      wb: 'T1',
      sulfur: 0,
      charcoal: 0,
      metal: 15,
      lgf: 0,
      cloth: 0,
      techTrash: 0,
      pipes: 0,
      rope: 0,
      color: '#c084fc'
    },
    pickaxe: {
      id: 'pickaxe',
      name: 'Metal Pickaxe',
      shortName: 'Pickaxe',
      category: 'melee',
      wb: 'T1',
      sulfur: 0,
      charcoal: 0,
      metal: 125,
      lgf: 0,
      cloth: 0,
      techTrash: 0,
      pipes: 0,
      rope: 0,
      color: '#94a3b8'
    }
  },

  // =========================================================================
  // 2. RAIDABLE TARGETS & OPTIMAL SULFUR-SAVING COMBINATIONS
  // =========================================================================
  raidTargets: [
    // --- DOORS ---
    {
      id: 'wood_door',
      name: 'Wooden Door',
      category: 'Doors',
      hp: 200,
      tier: 'Wood',
      softSideNote: 'Eco alternative: Flame Thrower takes 94 LGF (~25s). Never melee with swords/tools if you have fire.',
      methods: [
        { toolId: 'molotov', qty: 2, sulfur: 0, lgf: 100, cloth: 20, timeSec: 20, notes: '0 Sulfur! Cleanest fire breach (Tier 2).' },
        { toolId: 'flamethrower', qty: 94, sulfur: 0, lgf: 94, timeSec: 25, notes: '94 Low Grade Fuel continuous burn (Tier 1).' },
        { toolId: 'explo_ammo', qty: 19, sulfur: 475, charcoal: 570, metal: 95, timeSec: 6, notes: 'Instant silent breach with suppressor.' },
        { toolId: 'satchel', qty: 2, sulfur: 960, charcoal: 1440, metal: 160, rope: 2, cloth: 80, timeSec: 18, notes: '2 Satchels guarantee break (T1).' },
        { toolId: 'rocket', qty: 1, sulfur: 1400, charcoal: 1950, metal: 100, lgf: 30, pipes: 2, timeSec: 5, notes: 'Overkill unless splashing adjacent wood.' }
      ],
      combos: [
        {
          label: '2x Molotov Cocktails (Fire)',
          badge: '0 SULFUR META',
          items: [{ toolId: 'molotov', qty: 2 }],
          sulfur: 0,
          charcoal: 0,
          lgf: 100,
          timeSec: 20,
          savedSulfur: 960,
          notes: 'Only 100 LGF + 20 Cloth. Saves 960 Sulfur vs 2 Satchels.'
        },
        {
          label: '19x Explosive 5.56 (Silent)',
          badge: 'INSTANT STEALTH',
          items: [{ toolId: 'explo_ammo', qty: 19 }],
          sulfur: 475,
          charcoal: 570,
          lgf: 0,
          timeSec: 6,
          savedSulfur: 485,
          notes: 'Breaks a wooden door in 6s silently with a silencer.'
        },
        {
          label: '1x Satchel + 1x Beancan',
          badge: 'T1 SAVER',
          items: [
            { toolId: 'satchel', qty: 1 },
            { toolId: 'beancan', qty: 1 }
          ],
          sulfur: 600,
          charcoal: 900,
          lgf: 0,
          timeSec: 18,
          savedSulfur: 360,
          notes: 'Saves 360 Sulfur vs 2 Satchels at Tier 1.'
        }
      ]
    },
    {
      id: 'sheet_metal_door',
      name: 'Sheet Metal Door',
      category: 'Doors',
      hp: 250,
      tier: 'Metal',
      softSideNote: 'Doors have no soft side — always use explosives.',
      methods: [
        { toolId: 'beancan', qty: 13, sulfur: 1560, charcoal: 2340, metal: 260, timeSec: 55, notes: 'Lowest T1 sulfur (noisy + fuse variance).' },
        { toolId: 'explo_ammo', qty: 63, sulfur: 1575, charcoal: 1890, metal: 315, timeSec: 22, notes: 'Meta solo/silent breach — saves 1,225S vs 2 Rockets.' },
        { toolId: 'satchel', qty: 4, sulfur: 1920, charcoal: 2880, metal: 320, rope: 4, cloth: 160, timeSec: 36, notes: 'Standard T1 breach.' },
        { toolId: 'c4', qty: 1, sulfur: 2200, charcoal: 3000, metal: 200, lgf: 60, techTrash: 2, timeSec: 10, notes: 'Fast 10s breach; wastes 625S vs Explo unless in a rush.' },
        { toolId: 'rocket', qty: 2, sulfur: 2800, charcoal: 3900, metal: 200, lgf: 60, pipes: 4, timeSec: 10, notes: 'Only worth 2 Rockets when splashing multiple frames/walls.' }
      ],
      combos: [
        {
          label: '1x Rocket + 8x Explosive 5.56',
          badge: 'META SPEED + SPLASH',
          items: [
            { toolId: 'rocket', qty: 1 },
            { toolId: 'explo_ammo', qty: 8 }
          ],
          sulfur: 1600,
          charcoal: 2190,
          lgf: 30,
          timeSec: 10,
          savedSulfur: 1200,
          notes: '1 Rocket (220 dmg) + 8 Explo (30 dmg). Saves 1,200 Sulfur vs 2 Rockets & splashes adjacent doors!'
        },
        {
          label: '63x Explosive 5.56 (Pure)',
          badge: 'SILENT SAVER',
          items: [{ toolId: 'explo_ammo', qty: 63 }],
          sulfur: 1575,
          charcoal: 1890,
          lgf: 0,
          timeSec: 22,
          savedSulfur: 1225,
          notes: 'Saves 1,225 Sulfur vs 2 Rockets and 625 Sulfur vs 1 C4.'
        },
        {
          label: '3x Satchels + 3x Beancans',
          badge: 'T1 SAVER',
          items: [
            { toolId: 'satchel', qty: 3 },
            { toolId: 'beancan', qty: 3 }
          ],
          sulfur: 1800,
          charcoal: 2700,
          lgf: 0,
          timeSec: 34,
          savedSulfur: 120,
          notes: 'Reliable T1 finish (saves 120 Sulfur over 4th Satchel; bring 1 extra Beancan if worried).'
        }
      ]
    },
    {
      id: 'garage_door',
      name: 'Garage Door',
      category: 'Doors',
      hp: 600,
      tier: 'Metal',
      softSideNote: 'Doors have no soft side. Double garage-door airlocks can be splashed together at the center seam.',
      methods: [
        { toolId: 'explo_ammo', qty: 150, sulfur: 3750, charcoal: 4500, metal: 750, timeSec: 55, notes: 'Cheapest pure single method (saves 450S vs 3 Rockets).' },
        { toolId: 'rocket', qty: 3, sulfur: 4200, charcoal: 5850, metal: 300, lgf: 90, pipes: 6, timeSec: 16, notes: 'Meta only if splashing 2+ adjacent doors/walls.' },
        { toolId: 'satchel', qty: 9, sulfur: 4320, charcoal: 6480, metal: 720, rope: 9, cloth: 360, timeSec: 65, notes: 'Noisy T1 option with dud variance.' },
        { toolId: 'c4', qty: 2, sulfur: 4400, charcoal: 6000, metal: 400, lgf: 120, techTrash: 4, timeSec: 12, notes: 'Massive overkill — 2nd C4 wastes 280 dmg.' }
      ],
      combos: [
        {
          label: '1x C4 + 40x Explosive 5.56',
          badge: 'BEST SULFUR SAVER',
          items: [
            { toolId: 'c4', qty: 1 },
            { toolId: 'explo_ammo', qty: 40 }
          ],
          sulfur: 3200,
          charcoal: 4200,
          lgf: 60,
          timeSec: 24,
          savedSulfur: 1200,
          notes: '1 C4 deals 440 dmg (160 HP left) + 40 Explo. Saves 1,200S vs 2 C4 & 1,000S vs 3 Rockets!'
        },
        {
          label: '1x Rocket + 1x C4',
          badge: 'INSTANT COMBO',
          items: [
            { toolId: 'rocket', qty: 1 },
            { toolId: 'c4', qty: 1 }
          ],
          sulfur: 3600,
          charcoal: 4950,
          lgf: 90,
          timeSec: 10,
          savedSulfur: 600,
          notes: '10-second instant breach (660 dmg) that saves 600S vs 3 Rockets & splashes the frame.'
        },
        {
          label: '2x Rockets + 40x Explosive 5.56',
          badge: 'SPLASH SAVER',
          items: [
            { toolId: 'rocket', qty: 2 },
            { toolId: 'explo_ammo', qty: 40 }
          ],
          sulfur: 3800,
          charcoal: 5100,
          lgf: 60,
          timeSec: 25,
          savedSulfur: 400,
          notes: '2 Rockets deal 440.8 dmg + 40 Explo finish. Saves 400S vs 3 Rockets while splashing neighboring doors.'
        }
      ]
    },
    {
      id: 'armored_door',
      name: 'Armored Door',
      category: 'Doors',
      hp: 1000,
      tier: 'Armored',
      softSideNote: 'Check the doorframe first: breaking a Sheet Metal/Stone frame is useless if Honeycomb surrounds it, but Armored Doors often sit in Metal/Wood frames!',
      methods: [
        { toolId: 'explo_ammo', qty: 250, sulfur: 6250, charcoal: 7500, metal: 1250, timeSec: 95, notes: 'Cheapest single-tool raid (4 dmg/shot).' },
        { toolId: 'c4', qty: 3, sulfur: 6600, charcoal: 9000, metal: 600, lgf: 180, techTrash: 6, timeSec: 15, notes: 'Fast 15s breach; 3rd C4 overkills 320 dmg.' },
        { toolId: 'rocket', qty: 5, sulfur: 7000, charcoal: 9750, metal: 500, lgf: 150, pipes: 10, timeSec: 28, notes: 'Only worthwhile for multi-target splash.' },
        { toolId: 'satchel', qty: 15, sulfur: 7200, charcoal: 10800, metal: 1200, rope: 15, cloth: 600, timeSec: 110, notes: 'Slow & loud at T1.' }
      ],
      combos: [
        {
          label: '2x C4 + 30x Explosive 5.56',
          badge: 'BEST SULFUR SAVER',
          items: [
            { toolId: 'c4', qty: 2 },
            { toolId: 'explo_ammo', qty: 30 }
          ],
          sulfur: 5150,
          charcoal: 6900,
          lgf: 120,
          timeSec: 24,
          savedSulfur: 1850,
          notes: '2 C4 leave 120 HP -> 30 Explo finish. Saves 1,450S vs 3 C4 & 1,850S vs 5 Rockets! (Carry 35 if firing far).'
        },
        {
          label: '2x C4 + 1x Rocket',
          badge: 'FAST COMBO',
          items: [
            { toolId: 'c4', qty: 2 },
            { toolId: 'rocket', qty: 1 }
          ],
          sulfur: 5800,
          charcoal: 7950,
          lgf: 150,
          timeSec: 12,
          savedSulfur: 1200,
          notes: 'Zero rifle shooting — 12s instant breach saving 1,200S vs 5 Rockets.'
        },
        {
          label: '4x Rockets + 30x Explosive 5.56',
          badge: 'SPLASH SAVER',
          items: [
            { toolId: 'rocket', qty: 4 },
            { toolId: 'explo_ammo', qty: 30 }
          ],
          sulfur: 6350,
          charcoal: 8700,
          lgf: 120,
          timeSec: 34,
          savedSulfur: 650,
          notes: '4 Rockets leave ~118 HP -> 30 Explo finish. Keeps full Rocket splash and saves 650S vs 5 Rockets.'
        }
      ]
    },
    {
      id: 'ladder_hatch',
      name: 'Ladder Hatch / Triangle Hatch',
      category: 'Doors',
      hp: 250,
      tier: 'Metal',
      methods: [
        { toolId: 'explo_ammo', qty: 63, sulfur: 1575, charcoal: 1890, metal: 315, timeSec: 22, notes: 'Silent & lowest T3 single sulfur.' },
        { toolId: 'satchel', qty: 4, sulfur: 1920, charcoal: 2880, metal: 320, rope: 4, cloth: 160, timeSec: 36, notes: 'Standard T1 option.' },
        { toolId: 'c4', qty: 1, sulfur: 2200, charcoal: 3000, metal: 200, lgf: 60, techTrash: 2, timeSec: 10, notes: 'Overkills 190 HP.' },
        { toolId: 'rocket', qty: 2, sulfur: 2800, charcoal: 3900, metal: 200, lgf: 60, pipes: 4, timeSec: 10, notes: 'Use 1 Rocket + 8 Explo instead!' }
      ],
      combos: [
        {
          label: '1x Rocket + 8x Explosive 5.56',
          badge: 'META SAVER',
          items: [
            { toolId: 'rocket', qty: 1 },
            { toolId: 'explo_ammo', qty: 8 }
          ],
          sulfur: 1600,
          charcoal: 2190,
          lgf: 30,
          timeSec: 10,
          savedSulfur: 1200,
          notes: 'Matches Sheet Metal Door math (220 + 30 dmg). Saves 1,200S vs 2 Rockets.'
        },
        {
          label: '3x Satchels + 3x Beancans',
          badge: 'T1 SAVER',
          items: [
            { toolId: 'satchel', qty: 3 },
            { toolId: 'beancan', qty: 3 }
          ],
          sulfur: 1800,
          charcoal: 2700,
          lgf: 0,
          timeSec: 34,
          savedSulfur: 120,
          notes: 'Saves 120 Sulfur over 4 Satchels.'
        }
      ]
    },

    // --- WALLS & FLOORS ---
    {
      id: 'wood_wall',
      name: 'Wooden Wall / Floor',
      category: 'Walls & Floors',
      hp: 250,
      tier: 'Wood',
      softSideNote: 'Eco alternative: Flame Thrower takes 206 LGF (~50s). Do NOT melee hard-side wood walls.',
      methods: [
        { toolId: 'molotov', qty: 4, sulfur: 0, lgf: 200, cloth: 40, timeSec: 36, notes: '0 Sulfur! Cleanest early wood-wall breach.' },
        { toolId: 'flamethrower', qty: 206, sulfur: 0, lgf: 206, timeSec: 50, notes: '206 LGF burn (T1).' },
        { toolId: 'explo_ammo', qty: 49, sulfur: 1225, charcoal: 1470, metal: 245, timeSec: 18, notes: 'Silent breach when you lack LGF.' },
        { toolId: 'satchel', qty: 3, sulfur: 1440, charcoal: 2160, metal: 240, rope: 3, cloth: 120, timeSec: 25, notes: 'T1 explosive alternative.' },
        { toolId: 'rocket', qty: 2, sulfur: 2800, charcoal: 3900, metal: 200, lgf: 60, pipes: 4, timeSec: 10, notes: '2 Rockets = 1,400+ wasted unless splash.' }
      ],
      combos: [
        {
          label: '4x Molotov Cocktails',
          badge: '0 SULFUR META',
          items: [{ toolId: 'molotov', qty: 4 }],
          sulfur: 0,
          charcoal: 0,
          lgf: 200,
          timeSec: 36,
          savedSulfur: 1440,
          notes: 'Saves 1,440 Sulfur vs Satchels — costs only 200 LGF + 40 Cloth.'
        },
        {
          label: '1x Rocket + 1x Molotov',
          badge: 'INSTANT + CHEAP',
          items: [
            { toolId: 'rocket', qty: 1 },
            { toolId: 'molotov', qty: 1 }
          ],
          sulfur: 1400,
          charcoal: 1950,
          lgf: 80,
          timeSec: 12,
          savedSulfur: 1400,
          notes: '1 Rocket deals ~247 dmg -> Molotov burns the last sliver cleanly (saves 1,400S vs 2nd Rocket).'
        }
      ]
    },
    {
      id: 'stone_wall',
      name: 'Stone Wall / Floor (Hard-Side)',
      category: 'Walls & Floors',
      hp: 500,
      tier: 'Stone',
      softSideNote: 'Soft-Side ONLY (if placed backwards): 1x Jackhammer (~105s + 3 workbench refills) = 0 Sulfur. Never hit hard-side stone with melee!',
      methods: [
        { toolId: 'c4', qty: 2, sulfur: 4400, charcoal: 6000, metal: 400, lgf: 120, techTrash: 4, timeSec: 12, notes: 'Fastest & cheapest single explosive (no splash).' },
        { toolId: 'explo_ammo', qty: 185, sulfur: 4625, charcoal: 5550, metal: 925, timeSec: 65, notes: 'Silenced option (~2.7 dmg/shot).' },
        { toolId: 'satchel', qty: 10, sulfur: 4800, charcoal: 7200, metal: 800, rope: 10, cloth: 400, timeSec: 75, notes: 'Standard T1 wall breach.' },
        { toolId: 'rocket', qty: 4, sulfur: 5600, charcoal: 7800, metal: 400, lgf: 120, pipes: 8, timeSec: 22, notes: '4 Rockets splash up to 4 walls/floors simultaneously.' }
      ],
      combos: [
        {
          label: '1x C4 + 84x Explosive 5.56',
          badge: 'BEST SULFUR SAVER',
          items: [
            { toolId: 'c4', qty: 1 },
            { toolId: 'explo_ammo', qty: 84 }
          ],
          sulfur: 4300,
          charcoal: 5520,
          lgf: 60,
          timeSec: 40,
          savedSulfur: 1300,
          notes: '1 C4 leaves 225 HP -> 84 Explo finish. Saves 100S vs 2 C4 & 1,300S vs 4 Rockets!'
        },
        {
          label: '1x C4 + 2x Rockets',
          badge: 'SPLASH SAVER',
          items: [
            { toolId: 'c4', qty: 1 },
            { toolId: 'rocket', qty: 2 }
          ],
          sulfur: 5000,
          charcoal: 6900,
          lgf: 120,
          timeSec: 15,
          savedSulfur: 600,
          notes: '2 Rockets weaken adjacent walls too while finishing one panel cleanly — saves 600S vs 4 Rockets.'
        },
        {
          label: '3x Rockets + 33x Explosive 5.56',
          badge: 'ROCKET + EXPLO',
          items: [
            { toolId: 'rocket', qty: 3 },
            { toolId: 'explo_ammo', qty: 33 }
          ],
          sulfur: 5025,
          charcoal: 6840,
          lgf: 90,
          timeSec: 28,
          savedSulfur: 575,
          notes: '3 Rockets leave ~87 HP -> 33 Explo finish. Saves 575S vs 4 Rockets while keeping 3-rocket splash!'
        }
      ]
    },
    {
      id: 'sheet_metal_wall',
      name: 'Sheet Metal Wall / Floor',
      category: 'Walls & Floors',
      hp: 1000,
      tier: 'Metal',
      softSideNote: 'Metal hard-side & soft-side resist melee tools almost identically (~200+ picks) — explosives only.',
      methods: [
        { toolId: 'c4', qty: 4, sulfur: 8800, charcoal: 12000, metal: 800, lgf: 240, techTrash: 8, timeSec: 16, notes: 'Cheapest pure explosive (saves 2,400S vs 8 Rockets).' },
        { toolId: 'explo_ammo', qty: 400, sulfur: 10000, charcoal: 12000, metal: 2000, timeSec: 145, notes: '2.5 dmg/round — loud barrel wear (~2 SARs).' },
        { toolId: 'satchel', qty: 23, sulfur: 11040, charcoal: 16560, metal: 1840, rope: 23, cloth: 920, timeSec: 170, notes: 'Heavy T1 raid.' },
        { toolId: 'rocket', qty: 8, sulfur: 11200, charcoal: 15600, metal: 800, lgf: 240, pipes: 16, timeSec: 42, notes: 'Use when pummeling 2-4 Honeycomb panels at once.' }
      ],
      combos: [
        {
          label: '3x C4 + 70x Explosive 5.56',
          badge: 'BEST SULFUR SAVER',
          items: [
            { toolId: 'c4', qty: 3 },
            { toolId: 'explo_ammo', qty: 70 }
          ],
          sulfur: 8350,
          charcoal: 11100,
          lgf: 180,
          timeSec: 38,
          savedSulfur: 2850,
          notes: '3 C4 deal 825 dmg (175 HP left) -> 70 Explo @ 2.5 dmg. Saves 450S vs 4 C4 & 2,850S vs 8 Rockets!'
        },
        {
          label: '3x C4 + 2x Rockets',
          badge: 'INSTANT HYBRID',
          items: [
            { toolId: 'c4', qty: 3 },
            { toolId: 'rocket', qty: 2 }
          ],
          sulfur: 9400,
          charcoal: 12900,
          lgf: 240,
          timeSec: 18,
          savedSulfur: 1800,
          notes: 'Zero bullet spam — 825 + 275 dmg in 18s while splashing adjacent metal seams (saves 1,800S vs 8 Rockets).'
        },
        {
          label: '7x Rockets + 15x Explosive 5.56',
          badge: 'SPLASH SAVER',
          items: [
            { toolId: 'rocket', qty: 7 },
            { toolId: 'explo_ammo', qty: 15 }
          ],
          sulfur: 10175,
          charcoal: 14100,
          lgf: 210,
          timeSec: 44,
          savedSulfur: 1025,
          notes: '7 Rockets leave ~37 HP -> 15 Explo finish. Full 4-panel rocket splash & saves 1,025S vs 8th Rocket!'
        }
      ]
    },
    {
      id: 'armored_wall',
      name: 'Armored (HQM) Wall / Floor',
      category: 'Walls & Floors',
      hp: 2000,
      tier: 'Armored',
      softSideNote: 'HQM has no practical melee option. Always check whether going around through Doors/Sheet frames saves sulfur.',
      methods: [
        { toolId: 'c4', qty: 8, sulfur: 17600, charcoal: 24000, metal: 1600, lgf: 480, techTrash: 16, timeSec: 25, notes: 'Cheapest pure explosive (saves 3,400S vs 15 Rockets).' },
        { toolId: 'explo_ammo', qty: 799, sulfur: 19975, charcoal: 23970, metal: 3995, timeSec: 280, notes: 'Burns ~4 rifles of durability; avoid pure explo.' },
        { toolId: 'rocket', qty: 15, sulfur: 21000, charcoal: 29250, metal: 1500, lgf: 450, pipes: 30, timeSec: 75, notes: 'Use when opening an HQM core intersection (4 panels).' },
        { toolId: 'satchel', qty: 46, sulfur: 22080, charcoal: 33120, metal: 3680, rope: 46, cloth: 1840, timeSec: 340, notes: 'Emergency T1 only.' }
      ],
      combos: [
        {
          label: '7x C4 + 30x Explosive 5.56',
          badge: 'BEST SULFUR SAVER',
          items: [
            { toolId: 'c4', qty: 7 },
            { toolId: 'explo_ammo', qty: 30 }
          ],
          sulfur: 16150,
          charcoal: 21900,
          lgf: 420,
          timeSec: 32,
          savedSulfur: 4850,
          notes: '7 C4 deal 1,925 dmg (75 HP left) -> 30 Explo finish. Saves 1,450S vs 8 C4 & 4,850S vs 15 Rockets!'
        },
        {
          label: '6x C4 + 3x Rockets',
          badge: 'HEAVY + SPLASH',
          items: [
            { toolId: 'c4', qty: 6 },
            { toolId: 'rocket', qty: 3 }
          ],
          sulfur: 17400,
          charcoal: 23850,
          lgf: 450,
          timeSec: 30,
          savedSulfur: 3600,
          notes: 'Cheaper than 8 pure C4 AND splashes neighboring bunkers with 3 Rockets (saves 3,600S vs 15 Rockets).'
        },
        {
          label: '14x Rockets + 30x Explosive 5.56',
          badge: 'SPLASH SAVER',
          items: [
            { toolId: 'rocket', qty: 14 },
            { toolId: 'explo_ammo', qty: 30 }
          ],
          sulfur: 20350,
          charcoal: 28200,
          lgf: 420,
          timeSec: 78,
          savedSulfur: 650,
          notes: '14 Rockets deal 1,926 dmg + 30 Explo finish. Saves 650S vs 15th Rocket on multi-bunker cores.'
        }
      ]
    },

    // --- WINDOWS & GRILLS ---
    {
      id: 'strengthened_window',
      name: 'Strengthened Glass Window',
      category: 'Windows & Grills',
      hp: 350,
      tier: 'Glass T2',
      methods: [
        { toolId: 'explo_ammo', qty: 140, sulfur: 3500, charcoal: 4200, metal: 700, timeSec: 50, notes: 'Cheapest pure single option (saves 700S vs 3 Rockets).' },
        { toolId: 'rocket', qty: 3, sulfur: 4200, charcoal: 5850, metal: 300, lgf: 90, pipes: 6, timeSec: 15, notes: 'Splashes surrounding frame.' },
        { toolId: 'satchel', qty: 9, sulfur: 4320, charcoal: 6480, metal: 720, rope: 9, cloth: 360, timeSec: 65, notes: 'T1 explosive option.' },
        { toolId: 'c4', qty: 2, sulfur: 4400, charcoal: 6000, metal: 400, lgf: 120, techTrash: 4, timeSec: 10, notes: '2nd C4 overkills by 200 HP!' }
      ],
      combos: [
        {
          label: '1x C4 + 30x Explosive 5.56',
          badge: 'BEST SULFUR SAVER',
          items: [
            { toolId: 'c4', qty: 1 },
            { toolId: 'explo_ammo', qty: 30 }
          ],
          sulfur: 2950,
          charcoal: 3900,
          lgf: 60,
          timeSec: 20,
          savedSulfur: 1450,
          notes: '1 C4 leaves 75 HP -> 30 Explo finish. Saves 1,450S vs 2 C4 & 1,250S vs 3 Rockets!'
        },
        {
          label: '2x Rockets + 30x Explosive 5.56',
          badge: 'SPLASH SAVER',
          items: [
            { toolId: 'rocket', qty: 2 },
            { toolId: 'explo_ammo', qty: 30 }
          ],
          sulfur: 3550,
          charcoal: 4800,
          lgf: 60,
          timeSec: 22,
          savedSulfur: 650,
          notes: '2 Rockets leave ~75 HP -> 30 Explo finish. Saves 650S vs 3rd Rocket.'
        }
      ]
    },
    {
      id: 'reinforced_window',
      name: 'Reinforced Glass Window (HQM)',
      category: 'Windows & Grills',
      hp: 500,
      tier: 'Glass T3',
      methods: [
        { toolId: 'c4', qty: 2, sulfur: 4400, charcoal: 6000, metal: 400, lgf: 120, techTrash: 4, timeSec: 10, notes: 'Cleanest breach (500 HP matches Stone Wall boom).' },
        { toolId: 'explo_ammo', qty: 200, sulfur: 5000, charcoal: 6000, metal: 1000, timeSec: 72, notes: 'Quiet option when lacking C4.' },
        { toolId: 'rocket', qty: 4, sulfur: 5600, charcoal: 7800, metal: 400, lgf: 120, pipes: 8, timeSec: 20, notes: '4 Rockets splash frame + adjacent lootboxes.' },
        { toolId: 'satchel', qty: 12, sulfur: 5760, charcoal: 8640, metal: 960, rope: 12, cloth: 480, timeSec: 88, notes: 'T1 explosive cost.' }
      ],
      combos: [
        {
          label: '1x C4 + 90x Explosive 5.56',
          badge: 'HALF-C4 OPTION',
          items: [
            { toolId: 'c4', qty: 1 },
            { toolId: 'explo_ammo', qty: 90 }
          ],
          sulfur: 4450,
          charcoal: 5700,
          lgf: 60,
          timeSec: 40,
          savedSulfur: 1150,
          notes: '1 C4 + 90 Explo finishes cleanly if short a 2nd C4 (saves 1,150S vs 4 Rockets).'
        },
        {
          label: '3x Rockets + 35x Explosive 5.56',
          badge: 'SPLASH SAVER',
          items: [
            { toolId: 'rocket', qty: 3 },
            { toolId: 'explo_ammo', qty: 35 }
          ],
          sulfur: 5075,
          charcoal: 6900,
          lgf: 90,
          timeSec: 28,
          savedSulfur: 525,
          notes: '3 Rockets leave ~87 HP -> 35 Explo finish. Saves 525S vs 4th Rocket.'
        }
      ]
    },
    {
      id: 'metal_shop_front',
      name: 'Metal Shop Front',
      category: 'Windows & Grills',
      hp: 750,
      tier: 'Metal',
      methods: [
        { toolId: 'c4', qty: 3, sulfur: 6600, charcoal: 9000, metal: 600, lgf: 180, techTrash: 6, timeSec: 14, notes: 'Fastest clean breach (saves 1,800S vs 6 Rockets).' },
        { toolId: 'explo_ammo', qty: 300, sulfur: 7500, charcoal: 9000, metal: 1500, timeSec: 110, notes: '2.5 dmg/round.' },
        { toolId: 'rocket', qty: 6, sulfur: 8400, charcoal: 11700, metal: 600, lgf: 180, pipes: 12, timeSec: 32, notes: 'Heavy rocket splash.' },
        { toolId: 'satchel', qty: 18, sulfur: 8640, charcoal: 12960, metal: 1440, rope: 18, cloth: 720, timeSec: 130, notes: 'High T1 cost.' }
      ],
      combos: [
        {
          label: '2x C4 + 80x Explosive 5.56',
          badge: 'BEST SULFUR SAVER',
          items: [
            { toolId: 'c4', qty: 2 },
            { toolId: 'explo_ammo', qty: 80 }
          ],
          sulfur: 6400,
          charcoal: 8400,
          lgf: 120,
          timeSec: 36,
          savedSulfur: 2000,
          notes: '2 C4 deal 550 dmg (200 HP left) -> 80 Explo finish. Saves 200S vs 3 C4 & 2,000S vs 6 Rockets!'
        },
        {
          label: '5x Rockets + 25x Explosive 5.56',
          badge: 'SPLASH SAVER',
          items: [
            { toolId: 'rocket', qty: 5 },
            { toolId: 'explo_ammo', qty: 25 }
          ],
          sulfur: 7625,
          charcoal: 10500,
          lgf: 150,
          timeSec: 38,
          savedSulfur: 775,
          notes: '5 Rockets leave ~62 HP -> 25 Explo finish. Saves 775S vs 6th Rocket!'
        }
      ]
    },

    // --- TRAPS & TURRETS ---
    {
      id: 'auto_turret',
      name: 'Auto Turret',
      category: 'Traps & Turrets',
      hp: 1000,
      tier: 'Electronic',
      methods: [
        { toolId: 'hv_rocket', qty: 3, sulfur: 600, charcoal: 900, metal: 0, pipes: 3, timeSec: 12, notes: 'Absolute meta: peak long-range & break safely.' },
        { toolId: 'incen_rocket', qty: 1, sulfur: 610, charcoal: 900, metal: 100, lgf: 253, pipes: 2, timeSec: 15, notes: 'Fire splash kills turret & nearby electrical.' },
        { toolId: 'satchel', qty: 2, sulfur: 960, charcoal: 1440, metal: 160, rope: 2, cloth: 80, timeSec: 18, notes: 'Only if turret is drained or behind blind angle.' },
        { toolId: 'explo_ammo', qty: 49, sulfur: 1225, charcoal: 1470, metal: 245, timeSec: 18, notes: 'Easy peek finish if close.' },
        { toolId: 'c4', qty: 1, sulfur: 2200, charcoal: 3000, metal: 200, lgf: 60, techTrash: 2, timeSec: 10, notes: 'Avoid wasting C4 on turrets.' }
      ],
      combos: [
        {
          label: '3x High-Velocity Rockets',
          badge: 'RAIDER META',
          items: [{ toolId: 'hv_rocket', qty: 3 }],
          sulfur: 600,
          charcoal: 900,
          lgf: 0,
          timeSec: 12,
          savedSulfur: 1600,
          notes: 'Tier 2 launcher clear from outside aggro range (only 600 Sulfur).'
        },
        {
          label: '1x Incendiary Rocket',
          badge: 'ONE-SHOT FIRE',
          items: [{ toolId: 'incen_rocket', qty: 1 }],
          sulfur: 610,
          charcoal: 900,
          lgf: 253,
          timeSec: 15,
          savedSulfur: 1590,
          notes: 'Single peek shot lets fire finish it while denying defenders.'
        }
      ]
    },
    {
      id: 'sam_site',
      name: 'SAM Site',
      category: 'Traps & Turrets',
      hp: 1000,
      tier: 'Electronic',
      methods: [
        { toolId: 'molotov', qty: 2, sulfur: 0, lgf: 100, cloth: 20, timeSec: 20, notes: '0 Sulfur! SAM Sites burn fast to fire.' },
        { toolId: 'incen_rocket', qty: 1, sulfur: 610, charcoal: 900, metal: 100, lgf: 253, pipes: 2, timeSec: 15, notes: 'Long-range 1-shot fire melt.' },
        { toolId: 'satchel', qty: 2, sulfur: 960, charcoal: 1440, metal: 160, rope: 2, cloth: 80, timeSec: 18, notes: 'Cheap T1 if standing underneath.' },
        { toolId: 'f1_grenade', qty: 20, sulfur: 1200, charcoal: 1800, metal: 500, timeSec: 40, notes: 'T2 option if carrying frag grenades.' },
        { toolId: 'c4', qty: 2, sulfur: 4400, charcoal: 6000, metal: 400, lgf: 120, techTrash: 4, timeSec: 10, notes: 'Massive waste — always use fire!' }
      ],
      combos: [
        {
          label: '2x Molotov Cocktails (Close)',
          badge: '0 SULFUR META',
          items: [{ toolId: 'molotov', qty: 2 }],
          sulfur: 0,
          charcoal: 0,
          lgf: 100,
          timeSec: 20,
          savedSulfur: 960,
          notes: 'Only 100 LGF once you ladder onto the roof below SAM firing arc.'
        },
        {
          label: '1x Incendiary Rocket (Ranged)',
          badge: 'ROOF SNIPE',
          items: [{ toolId: 'incen_rocket', qty: 1 }],
          sulfur: 610,
          charcoal: 900,
          lgf: 253,
          timeSec: 15,
          savedSulfur: 3790,
          notes: '1-shot SAM Sites cleanly from an adjacent tower.'
        }
      ]
    },
    {
      id: 'shotgun_trap',
      name: 'Shotgun Trap',
      category: 'Traps & Turrets',
      hp: 300,
      tier: 'Trap',
      methods: [
        { toolId: 'hv_rocket', qty: 1, sulfur: 200, charcoal: 300, metal: 0, pipes: 1, timeSec: 5, notes: 'Instant safe clear around tight angles.' },
        { toolId: 'f1_grenade', qty: 5, sulfur: 300, charcoal: 450, metal: 125, timeSec: 15, notes: 'Bank F1s around doorframe blindly.' },
        { toolId: 'satchel', qty: 1, sulfur: 480, charcoal: 720, metal: 80, rope: 1, cloth: 40, timeSec: 10, notes: '1 Satchel clears cleanly.' },
        { toolId: 'incen_rocket', qty: 1, sulfur: 610, charcoal: 900, metal: 100, lgf: 253, pipes: 2, timeSec: 12, notes: 'Burns trap + denies peak.' }
      ],
      combos: [
        {
          label: '1x HV Rocket',
          badge: 'CHEAPEST',
          items: [{ toolId: 'hv_rocket', qty: 1 }],
          sulfur: 200,
          charcoal: 300,
          lgf: 0,
          timeSec: 5,
          savedSulfur: 280,
          notes: 'Only 200 Sulfur to clear safely without walking into the blast cone.'
        },
        {
          label: '5x F1 Grenades',
          badge: 'CORNER BANK',
          items: [{ toolId: 'f1_grenade', qty: 5 }],
          sulfur: 300,
          charcoal: 450,
          lgf: 0,
          timeSec: 15,
          savedSulfur: 180,
          notes: 'Bounce round corners when launcher ammo is empty.'
        }
      ]
    },

    // --- DEPLOYABLES & EXTERNAL ---
    {
      id: 'tool_cupboard',
      name: 'Tool Cupboard (TC)',
      category: 'Deployables & External',
      hp: 100,
      tier: 'Wood',
      methods: [
        { toolId: 'molotov', qty: 1, sulfur: 0, lgf: 50, cloth: 10, timeSec: 12, notes: '0 Sulfur! Burns TC cleanly while denying room.' },
        { toolId: 'explo_ammo', qty: 10, sulfur: 250, charcoal: 300, metal: 50, timeSec: 4, notes: 'Instant silent seal break (250 Sulfur).' },
        { toolId: 'satchel', qty: 1, sulfur: 480, charcoal: 720, metal: 80, rope: 1, cloth: 40, timeSec: 10, notes: '1 T1 Satchel.' },
        { toolId: 'f1_grenade', qty: 10, sulfur: 600, charcoal: 900, metal: 250, timeSec: 22, notes: 'Use only if no Explo/Molotov left.' }
      ],
      combos: [
        {
          label: '10x Explosive 5.56 (Fast Seal)',
          badge: 'INSTANT META',
          items: [{ toolId: 'explo_ammo', qty: 10 }],
          sulfur: 250,
          charcoal: 300,
          lgf: 0,
          timeSec: 4,
          savedSulfur: 230,
          notes: 'Breaks TC in 4 seconds so you can drop your own TC immediately.'
        },
        {
          label: '1x Molotov Cocktail',
          badge: '0 SULFUR',
          items: [{ toolId: 'molotov', qty: 1 }],
          sulfur: 0,
          charcoal: 0,
          lgf: 50,
          timeSec: 12,
          savedSulfur: 480,
          notes: 'Wait 12s for flames to clear before placing your new TC (0 Sulfur).'
        }
      ]
    },
    {
      id: 'vending_machine',
      name: 'Vending Machine (Sealed Loot)',
      category: 'Deployables & External',
      hp: 1250,
      tier: 'Armored',
      softSideNote: 'Check if the foundation/ceiling underneath the Vending Machine is Stone or Metal — breaking the floor deletes the Vending Machine automatically for far less boom!',
      methods: [
        { toolId: 'c4', qty: 5, sulfur: 11000, charcoal: 15000, metal: 1000, lgf: 300, techTrash: 10, timeSec: 20, notes: 'Only if floor underneath cannot be broken.' },
        { toolId: 'explo_ammo', qty: 499, sulfur: 12475, charcoal: 14970, metal: 2495, timeSec: 180, notes: 'Very slow; bring spare silencers.' },
        { toolId: 'satchel', qty: 29, sulfur: 13920, charcoal: 20880, metal: 2320, rope: 29, cloth: 1160, timeSec: 210, notes: 'Emergency T1 only.' },
        { toolId: 'rocket', qty: 10, sulfur: 14000, charcoal: 19500, metal: 1000, lgf: 300, pipes: 20, timeSec: 52, notes: 'Often easier to break supporting floor instead!' }
      ],
      combos: [
        {
          label: '4x C4 + 60x Explosive 5.56',
          badge: 'BEST SULFUR SAVER',
          items: [
            { toolId: 'c4', qty: 4 },
            { toolId: 'explo_ammo', qty: 60 }
          ],
          sulfur: 10300,
          charcoal: 13800,
          lgf: 240,
          timeSec: 40,
          savedSulfur: 3700,
          notes: '4 C4 leave 150 HP -> 60 Explo finish. Saves 700S vs 5 C4 & 3,700S vs 10 Rockets!'
        },
        {
          label: '9x Rockets + 6x Explosive 5.56',
          badge: 'SPLASH SAVER',
          items: [
            { toolId: 'rocket', qty: 9 },
            { toolId: 'explo_ammo', qty: 6 }
          ],
          sulfur: 12750,
          charcoal: 17730,
          lgf: 270,
          timeSec: 52,
          savedSulfur: 1250,
          notes: 'Saves 1,250S over 10th Rocket when splashing floor + vending simultaneously.'
        }
      ]
    },
    {
      id: 'high_ext_stone',
      name: 'High External Stone Wall',
      category: 'Deployables & External',
      hp: 500,
      tier: 'Stone',
      softSideNote: 'Tip: Ladder + Meds over High External Walls (0 Sulfur) before wasting 4,300+ boom, unless opening a raid breach for defenders.',
      methods: [
        { toolId: 'c4', qty: 2, sulfur: 4400, charcoal: 6000, metal: 400, lgf: 120, techTrash: 4, timeSec: 12, notes: 'Fastest clean breach.' },
        { toolId: 'explo_ammo', qty: 185, sulfur: 4625, charcoal: 5550, metal: 925, timeSec: 65, notes: 'Silent option.' },
        { toolId: 'satchel', qty: 10, sulfur: 4800, charcoal: 7200, metal: 800, rope: 10, cloth: 400, timeSec: 75, notes: 'Standard T1 option.' },
        { toolId: 'rocket', qty: 4, sulfur: 5600, charcoal: 7800, metal: 400, lgf: 120, pipes: 8, timeSec: 22, notes: 'Use only if opening multiple gate sections.' }
      ],
      combos: [
        {
          label: '1x C4 + 84x Explosive 5.56',
          badge: 'BEST SULFUR SAVER',
          items: [
            { toolId: 'c4', qty: 1 },
            { toolId: 'explo_ammo', qty: 84 }
          ],
          sulfur: 4300,
          charcoal: 5520,
          lgf: 60,
          timeSec: 40,
          savedSulfur: 1300,
          notes: 'Saves 100S vs 2 C4 & 1,300S vs 4 Rockets.'
        },
        {
          label: '3x Rockets + 33x Explosive 5.56',
          badge: 'SPLASH SAVER',
          items: [
            { toolId: 'rocket', qty: 3 },
            { toolId: 'explo_ammo', qty: 33 }
          ],
          sulfur: 5025,
          charcoal: 6840,
          lgf: 90,
          timeSec: 28,
          savedSulfur: 575,
          notes: 'Saves 575S vs 4th Rocket while maintaining compound breach splash.'
        }
      ]
    }
  ],
  // =========================================================================
  // 3. MONUMENTS, KEYCARD PUZZLES, FUSES & TIMERS (VERIFIED FROM RUSTHELP.COM)
  // =========================================================================
  monuments: [
    {
      id: 'lighthouse',
      name: 'Lighthouse',
      rusthelpUrl: 'https://rusthelp.com/monument/lighthouse',
      tier: 0,
      biome: 'Oceanside',
      defaultPos: { x: 0.14, y: 0.28, grid: 'D8' },
      cardsNeeded: [],
      cardsFound: ['Green'],
      fusesNeeded: 0,
      radRequired: '0 RAD',
      respawnMin: 30,
      crates: { locked: 0, elite: 0, military: 2, normal: 8, diesel: 0 },
      utilities: ['1x Green Recycler', 'Deep Sea Lamp Repair (200 Metal)', 'Zipline x3'],
      steps: [
        'No fuse or card required (0 RAD, 0 Scientists).',
        'Climb the spiral stairs to the first office room to grab the guaranteed Green Keycard on the desk.',
        'Loot up to 10 crate spawns + 10 barrels and recycle at the Green Recycler.',
        '🌊 Deep Sea Mechanic: Repairing the top Lighthouse lamp once per wipe (20 Hammer swings + 200 Metal Frags) lights every Lighthouse and opens the Deep Sea!'
      ]
    },
    {
      id: 'supermarket',
      name: 'Abandoned Supermarket',
      rusthelpUrl: 'https://rusthelp.com/monument/abandoned-supermarket',
      tier: 0,
      biome: 'Roadside',
      defaultPos: { x: 0.26, y: 0.62, grid: 'G16' },
      cardsNeeded: [],
      cardsFound: ['Green'],
      fusesNeeded: 0,
      radRequired: '0 RAD',
      respawnMin: 30,
      crates: { locked: 0, elite: 0, military: 1, normal: 12, diesel: 0 },
      utilities: ['1x Green Recycler', 'Telephone', 'Motorbike & Bicycle Spawn', 'Powered Loot Fridge (1 Heavy Fuse)'],
      steps: [
        'No Electric Fuse or Keycard required (0 RAD, 0 Scientists).',
        'Enter the back manager office to pick up the guaranteed Green Keycard on the desk.',
        'Loot 13 crate spawns (including 5 Foodboxes, 2 Vehicle Parts, and 1 Military Crate).',
        '⚡ Power Grid Room: The back Loot Fridge opens when 1x Heavy Fuse (Stage 1) is active at Power Plant.'
      ]
    },
    {
      id: 'gas_station',
      name: "Oxum's Gas Station",
      rusthelpUrl: 'https://rusthelp.com/monument/oxums-gas-station',
      tier: 0,
      biome: 'Roadside',
      defaultPos: { x: 0.38, y: 0.72, grid: 'K19' },
      cardsNeeded: [],
      cardsFound: ['Green'],
      fusesNeeded: 0,
      radRequired: '0 RAD',
      respawnMin: 30,
      crates: { locked: 0, elite: 0, military: 1, normal: 15, diesel: 0 },
      utilities: ['1x Green Recycler', 'Motorbike Spawn', 'Car Lift Garage (Stage 1 Power Grid)'],
      steps: [
        'No Electric Fuse or Keycard required (0 RAD, 0 Scientists).',
        'Enter the back office behind the counter to grab the guaranteed Green Keycard.',
        'Drop into the underground mechanic pit for a Military Crate + 16 total crate spawns.',
        '⚡ Power Grid Room: Car Lift Garage opens at Power Grid Stage 1 (1x Heavy Fuse at Power Plant).'
      ]
    },
    {
      id: 'mining_outpost',
      name: 'Mining Outpost',
      rusthelpUrl: 'https://rusthelp.com/monument/mining-outpost',
      tier: 0,
      biome: 'Roadside',
      defaultPos: { x: 0.30, y: 0.42, grid: 'H11' },
      cardsNeeded: [],
      cardsFound: [],
      fusesNeeded: 0,
      radRequired: '0 RAD',
      respawnMin: 20,
      crates: { locked: 0, elite: 0, military: 1, normal: 7, diesel: 0 },
      utilities: ['1x Green Recycler', 'Repair Bench', 'Motorbike & Bicycle Spawn'],
      steps: [
        'No puzzle, 0 RAD, and 0 Scientists (note: no Green Keycard spawns here).',
        'Loot 8 crate spawns (including 2 Vehicle Parts crates) and recycle at the Green Recycler.'
      ]
    },
    {
      id: 'water_well',
      name: 'Water Well (A–E)',
      rusthelpUrl: 'https://rusthelp.com/monument/water-well-a',
      tier: 0,
      biome: 'Roadside POI',
      defaultPos: { x: 0.45, y: 0.58, grid: 'L15' },
      cardsNeeded: [],
      cardsFound: [],
      fusesNeeded: 0,
      radRequired: '0 RAD',
      respawnMin: 30,
      crates: { locked: 0, elite: 0, military: 0, normal: 2, diesel: 0 },
      utilities: ['Water Well Shopkeeper (Tools/Meds)', 'Fresh Water Pump', 'No Recycler / PvP Zone'],
      steps: [
        'Zero radiation, zero scientists — best early-wipe POI to buy Jackhammers (~200 Scrap), Chainsaws, and Medical Syringes.',
        'Check the NPC Water Well Shopkeeper (rotating vendor stock: Jackhammer, Chainsaw, Syringes, Hazmat Suit, Revolver/DB, Pure & Advanced Teas).',
        'Loot crates/food boxes and refill at the water pump, then watch your back (no Safe Zone turrets).'
      ]
    },
    {
      id: 'abandoned_cabins',
      name: 'Abandoned Cabins',
      rusthelpUrl: 'https://rusthelp.com/monument/abandoned-cabins',
      tier: 0,
      biome: 'Swamp / Forest',
      defaultPos: { x: 0.14, y: 0.80, grid: 'D20' },
      cardsNeeded: [],
      cardsFound: ['Green'],
      fusesNeeded: 0,
      radRequired: '0 RAD',
      respawnMin: 30,
      crates: { locked: 0, elite: 0, military: 1, normal: 3, diesel: 0 },
      utilities: ['15x Sulfur Pickup/Node Spawns', 'Poker Table', 'No Recycler'],
      steps: [
        'No fuse or card required (0 RAD, 0 Scientists, No Recycler).',
        'Climb into the upper cabin room to pick up the guaranteed Green Keycard.',
        'Farm the 15 Sulfur collectable/node spawns and 4 crate spawns around the swamp cabins.'
      ]
    },
    {
      id: 'junkyard',
      name: 'Junkyard',
      rusthelpUrl: 'https://rusthelp.com/monument/junkyard',
      tier: 1,
      biome: 'Arid / Temperate',
      defaultPos: { x: 0.72, y: 0.56, grid: 'S14' },
      cardsNeeded: [],
      cardsFound: ['Green'],
      fusesNeeded: 0,
      radRequired: '0 RAD',
      respawnMin: 30,
      crates: { locked: 0, elite: 0, military: 3, normal: 10, diesel: 2 },
      utilities: ['1x Green Recycler', 'Magnet Crane Shredder', 'Modular Car Lift', 'Stage 1 Power Grid Room (1 Heavy Fuse)'],
      steps: [
        'No keycard puzzle, 0 RAD, and 0 Scientists!',
        'Pick up the free Green Keycard + 2 fixed Diesel Fuel barrels (+10% chance per oil barrel).',
        'Use the Magnet Crane to shred junked pickup trucks for Scrap & Metal Fragments.',
        '⚡ Power Grid Room: Requires Stage 1 Power (1x Heavy Fuse at Power Plant) for 3 bonus crates.'
      ]
    },
    {
      id: 'jungle_ziggurat',
      name: 'Jungle Ziggurat',
      rusthelpUrl: 'https://rusthelp.com/monument/jungle-ziggurat',
      tier: 1,
      biome: 'Jungle',
      defaultPos: { x: 0.42, y: 0.82, grid: 'L21' },
      cardsNeeded: [],
      cardsFound: [],
      fusesNeeded: 0,
      radRequired: '0 RAD',
      respawnMin: 30,
      crates: { locked: 0, elite: 0, military: 2, normal: 6, diesel: 0 },
      utilities: ['1x Green Recycler'],
      steps: [
        'No keycard puzzle, 0 RAD, and 0 Scientists.',
        'Loot 8 crate spawns (including Jungle Basic Crates) and 6 barrel spawns, then recycle at the on-site Green Recycler.'
      ]
    },
    {
      id: 'abandoned_military_base',
      name: 'Abandoned Military Base',
      rusthelpUrl: 'https://rusthelp.com/monument/abandoned-military-base',
      tier: 2,
      biome: 'Desert / Arid',
      defaultPos: { x: 0.22, y: 0.58, grid: 'F15' },
      cardsNeeded: [],
      cardsFound: [],
      fusesNeeded: 0,
      radRequired: '0 RAD',
      respawnMin: 25,
      crates: { locked: 0, elite: 0, military: 3, normal: 4, diesel: 0 },
      utilities: ['Computer Station', 'MLRS Aiming Terminal (Variant)', 'CCTV: COMPOUND****', 'No Recycler'],
      steps: [
        'No keycard puzzle, 0 RAD, and No Recycler.',
        'Clear ~7 Abandoned Military Base Scientists to loot ~6 Military/Normal Crates and use the Computer Station.'
      ]
    },
    {
      id: 'harbor',
      name: 'Harbor (Large & Small)',
      rusthelpUrl: 'https://rusthelp.com/monument/harbor-large',
      tier: 1,
      biome: 'Oceanside',
      defaultPos: { x: 0.82, y: 0.65, grid: 'V17' },
      cardsNeeded: ['Green'],
      cardsFound: ['Blue'],
      fusesNeeded: 1,
      radRequired: '0 RAD',
      respawnMin: 30,
      crates: { locked: 0, elite: 0, military: 2, normal: 10, diesel: 0 },
      utilities: ['1x Green Recycler', 'Small Oil Refinery', 'Cargo Ship Docking', 'Stage 1 Power Grid Room (1 Heavy Fuse)'],
      steps: [
        'Bring 1x Green Keycard + 1x Electric Fuse (0 RAD, 0 Scientists unless Cargo Ship is docked).',
        'Insert 1x Electric Fuse and flip the switch, then swipe your Green Keycard at the puzzle room.',
        'Rewards: 1x Blue Keycard + 1x Blueprint Page (NEW) + 2x Normal Crates (resets every 30m).',
        '⚡ Power Grid Room: Requires Stage 1 Power (1x Heavy Fuse at Power Plant) for 4 extra crates.'
      ]
    },
    {
      id: 'ferry_terminal',
      name: 'Ferry Terminal',
      rusthelpUrl: 'https://rusthelp.com/monument/ferry-terminal',
      tier: 1,
      biome: 'Oceanside',
      defaultPos: { x: 0.16, y: 0.68, grid: 'E17' },
      cardsNeeded: ['Green'],
      cardsFound: ['Green', 'Blue'],
      fusesNeeded: 1,
      radRequired: '0 RAD',
      respawnMin: 30,
      crates: { locked: 0, elite: 0, military: 3, normal: 10, diesel: 0 },
      utilities: ['1x Green Recycler', 'Repair Bench', 'Research Table', 'Modular Car Lift', 'Tunnel Entrance', 'Stage 1 Power Grid Room'],
      steps: [
        'Bring 1x Green Keycard (1x Green Card also spawns on-site!) + 1x Electric Fuse (0 RAD, 0 Scientists).',
        'Insert 1x Electric Fuse and flip the switch, then swipe Green Keycard.',
        'Rewards: 1x Blue Keycard + 1x Blueprint Page (NEW) + 2x Normal Crates (resets every 30m).',
        '⚡ Power Grid Room: Opens with 1x Heavy Fuse (Stage 1) at Power Plant for 3 extra crates.'
      ]
    },
    {
      id: 'radtown',
      name: 'Radtown',
      rusthelpUrl: 'https://rusthelp.com/monument/radtown',
      tier: 1,
      biome: 'Roadside',
      defaultPos: { x: 0.39, y: 0.56, grid: 'K14' },
      cardsNeeded: ['Green'],
      cardsFound: ['Blue'],
      fusesNeeded: 1,
      radRequired: 'Median 0 / Peak 26 RAD',
      respawnMin: 30,
      crates: { locked: 0, elite: 0, military: 2, normal: 12, diesel: 2 },
      utilities: ['1x Green Recycler', '2x Diesel Fuel Spawns', 'Stage 2 Power Grid Room (4 Heavy Fuses)'],
      steps: [
        'Bring 1x Green Keycard + 1x Electric Fuse (0 Scientists, peak 26 RAD in hotspots).',
        'Insert 1x Electric Fuse and flip the switch, then swipe your Green Keycard.',
        'Rewards: 1x Blue Keycard + 1x Blueprint Page (NEW) + 2x Military Crates (resets every 30m), plus 2x Diesel Fuel pickups on site.',
        '⚡ Power Grid Room: Opens at Stage 2 Power (4x Heavy Fuses at Power Plant) for 3 bonus crates.'
      ]
    },
    {
      id: 'the_dome',
      name: 'The Dome',
      rusthelpUrl: 'https://rusthelp.com/monument/the-dome',
      tier: 2,
      biome: 'Medium Tier 2',
      defaultPos: { x: 0.46, y: 0.36, grid: 'M9' },
      cardsNeeded: ['Green'],
      cardsFound: ['Blue'],
      fusesNeeded: 1,
      radRequired: 'Median 0 / Peak 11 RAD',
      respawnMin: 30,
      crates: { locked: 0, elite: 0, military: 4, normal: 11, diesel: 2 },
      utilities: ['1x Green Recycler', '2x Small Oil Refineries', 'Motorbike Spawn', 'CCTV: DOME1, DOMETOP'],
      steps: [
        'UPDATED RUSTHELP PUZZLE: The Dome now features a Green Keycard + 1x Electric Fuse puzzle AND 1x Green Recycler (0 Scientists)!',
        'Insert 1x Electric Fuse, flip the switch, and swipe your Green Keycard to get 1x Blue Keycard + 1x Blueprint Page (NEW) + 2x Diesel Fuel + 2x Normal Crates (30m reset).',
        'Climb to the top of the sphere for 4x guaranteed Military Crates, and use the 2x Small Oil Refineries at the base.'
      ]
    },
    {
      id: 'sewer_branch',
      name: 'Sewer Branch',
      rusthelpUrl: 'https://rusthelp.com/monument/sewer-branch',
      tier: 2,
      biome: 'Medium Tier 2',
      defaultPos: { x: 0.44, y: 0.48, grid: 'L13' },
      cardsNeeded: ['Green'],
      cardsFound: ['Blue'],
      fusesNeeded: 1,
      radRequired: '11 RAD',
      respawnMin: 30,
      crates: { locked: 0, elite: 0, military: 3, normal: 9, diesel: 0 },
      utilities: ['2x Green Recyclers', '1x Small Oil Refinery', 'Stage 2 Power Grid Room (4 Heavy Fuses)'],
      steps: [
        'Bring 1x Green Keycard + 1x Electric Fuse (0 Scientists!).',
        'Insert 1x Fuse in the small shed at the base of the jump-up tower and flip the switch.',
        'Swipe Green Keycard underground to loot 1x Blue Keycard + 1x Blueprint Page (NEW) + 9x Crates + use the 2x Green Recyclers (30m reset).',
        '⚡ Power Grid Room: Requires Stage 2 Power (4x Heavy Fuses at Power Plant) for 3 bonus crates.'
      ]
    },
    {
      id: 'satellite_dish',
      name: 'Satellite Dish',
      rusthelpUrl: 'https://rusthelp.com/monument/satellite-dish',
      tier: 2,
      biome: 'Small Tier 2',
      defaultPos: { x: 0.56, y: 0.52, grid: 'O14' },
      cardsNeeded: ['Green'],
      cardsFound: ['Blue'],
      fusesNeeded: 1,
      radRequired: 'Peak 11 RAD',
      respawnMin: 30,
      crates: { locked: 0, elite: 0, military: 2, normal: 9, diesel: 0 },
      utilities: ['1x Green Recycler', 'Research Table', 'Telephone', 'Motorbike Spawn'],
      steps: [
        'Bring 1x Green Keycard + 1x Electric Fuse (0 Scientists, peak 11 RAD).',
        'Insert 1x Electric Fuse in the lower shipping container and flip the electric switch.',
        'Swipe Green Keycard on the locked container for 1x Blue Keycard + 1x Blueprint Page (NEW) + 2x Normal Crates (30m reset).'
      ]
    },
    {
      id: 'arctic_research',
      name: 'Arctic Research Base',
      rusthelpUrl: 'https://rusthelp.com/monument/arctic-research-base',
      tier: 2,
      biome: 'Snow (Medium)',
      defaultPos: { x: 0.72, y: 0.16, grid: 'S4' },
      cardsNeeded: ['Blue'],
      cardsFound: ['Red'],
      fusesNeeded: 0,
      radRequired: 'Median 3 / Peak 11 RAD',
      respawnMin: 30,
      crates: { locked: 0, elite: 0, military: 5, normal: 18, diesel: 0 },
      utilities: ['1x Green Recycler', 'Snowmobile Puzzle Spawn', '10x Arctic Scientists'],
      steps: [
        'RUSTHELP VERIFIED: Requires 1x Blue Keycard ONLY (0 Electric Fuses required!).',
        'Clear the 10x Arctic Scientists across the 23 crate spawns.',
        'Main Blue Card Puzzle: Swipe Blue Keycard to unlock 1x Red Keycard + 2x Blueprint Pages (NEW) + 4x Crates (30m reset).',
        'Second Blue Card Puzzle: Swipe Blue Keycard at the garage bay to unlock a free Snowmobile.'
      ]
    },
    {
      id: 'water_treatment',
      name: 'Water Treatment Plant',
      rusthelpUrl: 'https://rusthelp.com/monument/water-treatment-plant',
      tier: 2,
      biome: 'Large Tier 2',
      defaultPos: { x: 0.34, y: 0.36, grid: 'I10' },
      cardsNeeded: ['Blue'],
      cardsFound: ['Red'],
      fusesNeeded: 1,
      radRequired: '11–25 RAD',
      respawnMin: 30,
      crates: { locked: 0, elite: 0, military: 6, normal: 14, diesel: 3 },
      utilities: ['1x Green Recycler', '2x Small Oil Refineries', '1x Pumpjack', '4x Motorbike Spawns'],
      steps: [
        'Bring 1x Blue Keycard + 1x Electric Fuse (0 Scientists!).',
        'Main Puzzle: Turn the garage door wheel, insert 1x Fuse upstairs, activate the timer, and swipe Blue Card in the office building for 1x Red Keycard + 2x Blueprint Pages (NEW) + 3x Diesel Fuel + 6x Crates (30m reset).',
        'Second Room (No Items Needed): Open the second garage door room for 1x Blueprint Page (NEW) + 4x Crates.',
        '⚡ Power Grid Room: 4 additional crates behind powered loot door.'
      ]
    },
    {
      id: 'train_yard',
      name: 'Train Yard',
      rusthelpUrl: 'https://rusthelp.com/monument/train-yard',
      tier: 2,
      biome: 'Large Tier 2',
      defaultPos: { x: 0.62, y: 0.34, grid: 'Q9' },
      cardsNeeded: ['Green', 'Blue'],
      cardsFound: ['Red'],
      fusesNeeded: 1,
      radRequired: '11–26 RAD',
      respawnMin: 30,
      crates: { locked: 0, elite: 0, military: 7, normal: 15, diesel: 0 },
      utilities: ['1x Green Recycler', 'Coaling Tower Unloader', '4x Scientists', 'Stage 2 Power Grid Room (4 Heavy Fuses)'],
      steps: [
        'Blue Puzzle: Bring 1x Electric Fuse + 1x Blue Keycard + flip 3 switches -> Rewards 1x Red Keycard + 2x Blueprint Pages (NEW) + 9x Crates (30m reset).',
        'Green Puzzle: Bring 1x Fuse + 1x Green Keycard -> Rewards 1x Blueprint Page (NEW) + 1x Crate + 3x Barrels.',
        '⚡ Power Grid Room: Requires Stage 2 Power (4x Heavy Fuses at Power Plant) for 4 bonus crates.'
      ]
    },
    {
      id: 'airfield',
      name: 'Airfield',
      rusthelpUrl: 'https://rusthelp.com/monument/airfield',
      tier: 2,
      biome: 'Large Tier 2',
      defaultPos: { x: 0.52, y: 0.74, grid: 'N19' },
      cardsNeeded: ['Green', 'Blue'],
      cardsFound: ['Red'],
      fusesNeeded: 2,
      radRequired: '11 RAD',
      respawnMin: 30,
      crates: { locked: 0, elite: 0, military: 5, normal: 18, diesel: 3 },
      utilities: ['2x Green Recyclers', 'Tunnel Entrance', 'Chinook Drop Zone', '3x Motorbike Spawns'],
      steps: [
        'Bring 1x Green Keycard + 1x Blue Keycard + 2x Electric Fuses (11 RAD).',
        'Insert 1st Fuse in the office building & use the electric timer, then drop into the underground tunnels.',
        'Swipe Green Card -> Insert 2nd Fuse -> Swipe Blue Card (spawns 3x Airfield Scientists inside puzzle).',
        'Rewards: 1x Red Keycard + 2x Blueprint Pages (NEW) + 3x Diesel Fuel + 7x Normal/Military Crates (resets every 30m).'
      ]
    },
    {
      id: 'power_plant',
      name: 'Power Plant',
      rusthelpUrl: 'https://rusthelp.com/monument/power-plant',
      tier: 3,
      biome: 'Large Tier 3',
      defaultPos: { x: 0.25, y: 0.44, grid: 'G12' },
      cardsNeeded: ['Green', 'Blue'],
      cardsFound: ['Green', 'Red'],
      fusesNeeded: 1,
      radRequired: 'Peak 52 RAD',
      respawnMin: 30,
      crates: { locked: 0, elite: 1, military: 6, normal: 15, diesel: 3 },
      utilities: ['1x Green Recycler + 1x Red Recycler', 'Map-Wide Heavy Fuse Power Grid Hub'],
      steps: [
        'RUSTHELP VERIFIED: Bring 1x Green Keycard (1 also spawns on-site) + 1x Blue Keycard + 1x Electric Fuse (0 Scientists!).',
        'Work the 3 switches + timer to unlock the Blue Card room -> Rewards 1x Red Keycard + 3x Blueprint Pages (NEW) + 3x Diesel Fuel + 8x Crates + 5x Barrels (30m reset).',
        '⚡ Heavy Fuse Power Grid Hub: Inserting Heavy Fuses here powers locked loot rooms across the map (Stage 1 = 1 Heavy Fuse, Stage 2 = 4 Heavy Fuses, Stage 3 = 10 Heavy Fuses) plus Power Plant’s own Powered Loot Room (1x Elite Crate + 3x Military Crates)!'
      ]
    },
    {
      id: 'giant_excavator',
      name: 'Giant Excavator Pit',
      rusthelpUrl: 'https://rusthelp.com/monument/giant-excavator-pit',
      tier: 3,
      biome: 'Large Tier 1/2/3',
      defaultPos: { x: 0.68, y: 0.74, grid: 'R19' },
      cardsNeeded: [],
      cardsFound: [],
      fusesNeeded: 0,
      radRequired: '0 RAD',
      respawnMin: 20,
      crates: { locked: 0, elite: 0, military: 4, normal: 14, diesel: 0 },
      utilities: ['1x Green Recycler', 'Diesel Mining Arm (120s/Barrel)', 'Supply Drop Signal Computer', 'Tunnel Entrance'],
      steps: [
        'No Keycard or Fuse needed — clear 18x Excavator Scientists and loot 18 crate spawns.',
        'Each 1x Diesel Fuel runs the Excavator for 120 seconds (2m) and yields your choice of: 2,000 Sulfur Ore, 100 HQM Ore, 5,000 Metal Fragments, or 10,000 Stones!',
        'Use the on-site Green Recycler and Supply Drop Signal Computer.'
      ]
    },
    {
      id: 'missile_silo',
      name: 'Missile Silo',
      rusthelpUrl: 'https://rusthelp.com/monument/missile-silo',
      tier: 3,
      biome: 'Medium Tier 2/3',
      defaultPos: { x: 0.50, y: 0.22, grid: 'N6' },
      cardsNeeded: ['Red'],
      cardsFound: [],
      fusesNeeded: 0,
      radRequired: 'Median 26 / Peak 81 RAD',
      respawnMin: 30,
      crates: { locked: 0, elite: 4, military: 10, normal: 10, diesel: 3 },
      utilities: ['No Recycler', '2x Blueprint Books (NEW)', 'Computer Station & Telephone', 'CCTV: SILOEXIT1/2, SILOMISSILE, SILOSHIPPING, SILOTOWER'],
      steps: [
        'RUSTHELP VERIFIED: Requires 1x RED Keycard ONLY and a button press — NO Electric Fuse required, and NO Recycler on site!',
        'Clear 4x Outside Scientists (Note: Day-1 Monument Blocker Lockers/Terminals block access early in wipe).',
        'Swipe 1x Red Keycard and press the button: spawns 23x Inside Scientists, 4x Elite Crates, 20x Military & Normal Crates, 2x Blueprint Books (NEW), and 3x Diesel Fuel (resets every 30 minutes).',
        'Bring high rad protection (Radiation median is 26 RAD and peaks at 81 RAD!).',
        '⚡ Stage 3 Powered Loot Room: Flipping the switch when 10x Heavy Fuses are active at Power Plant opens a bonus room with 4 crates.'
      ]
    },
    {
      id: 'launch_site',
      name: 'Launch Site',
      rusthelpUrl: 'https://rusthelp.com/monument/launch-site',
      tier: 3,
      biome: 'Large Tier 3',
      defaultPos: { x: 0.76, y: 0.46, grid: 'T12' },
      cardsNeeded: ['Green', 'Red'],
      cardsFound: [],
      fusesNeeded: 2,
      radRequired: 'Median 11 / Peak 52 RAD',
      respawnMin: 30,
      crates: { locked: 0, elite: 3, military: 15, normal: 30, diesel: 0 },
      utilities: ['1x Green Recycler', '2x Blueprint Books (NEW)', 'Bradley APC (7 HV Rockets)', 'Stage 3 Powered Loot Room (8 Crates)'],
      steps: [
        'Main Puzzle: Bring 1x Green Keycard + 1x Red Keycard + 2x Electric Fuses + flip two switches.',
        'Spawns 8x Launch Site Scientists inside, 3x Elite Crates, 20x Normal/Military Crates, and 2x Blueprint Books (NEW) — resets every 30 minutes!',
        'Second Puzzle (No Items Needed): Use the timer and button for 4 bonus crates.',
        'Radiation sits at 11 RAD and peaks at 52 RAD inside the rocket factory (bring Hazmat + Water).'
      ]
    },
    {
      id: 'military_tunnels',
      name: 'Military Tunnel',
      rusthelpUrl: 'https://rusthelp.com/monument/military-tunnel',
      tier: 3,
      biome: 'Large Tier 3',
      defaultPos: { x: 0.32, y: 0.18, grid: 'I5' },
      cardsNeeded: ['Green', 'Blue', 'Red'],
      cardsFound: [],
      fusesNeeded: 1,
      radRequired: 'Median 11 / Peak 26 RAD',
      respawnMin: 30,
      crates: { locked: 0, elite: 6, military: 8, normal: 14, diesel: 3 },
      utilities: ['1x Green Recycler', '2x Blueprint Books (NEW)', '33x Scientist Spawns'],
      steps: [
        'Bring 1x Electric Fuse + 1x Green + 1x Blue + 1x Red Keycard, then work two timers and a switch.',
        'Puzzle spawns 11x Scientists (33 total in monument), 3x Elite Crates (6 total in monument), 5x Normal Crates, 2x Blueprint Books (NEW), and 3x Diesel Fuel (resets every 30m).',
        'Recycle your haul at the on-site Green Recycler.'
      ]
    },
    {
      id: 'underwater_labs',
      name: 'Underwater Lab',
      rusthelpUrl: 'https://rusthelp.com/monument/underwater-lab',
      tier: 3,
      biome: 'Offshore',
      defaultPos: { x: 0.28, y: 0.92, grid: 'H23' },
      cardsNeeded: ['Green', 'Blue', 'Red'],
      cardsFound: ['Green'],
      fusesNeeded: 2,
      radRequired: '0 RAD (Diving Gear / Sub)',
      respawnMin: 30,
      crates: { locked: 0, elite: 2, military: 6, normal: 12, diesel: 0 },
      utilities: ['No Recycler', 'Blueprint Books & Pages (NEW)', 'CCTV: LAB****'],
      steps: [
        'Randomized offshore monument with ~4 Scientists and No Recycler.',
        'Bring 1x Red Keycard + 1x Blue Keycard + 1x Green Keycard + 2x Electric Fuses.',
        'The two Red Card rooms hold Blueprint Books (NEW) and 2x Elite Crates (one also needs a Blue Card).',
        'Blue rooms pay Blueprint Pages (NEW), and the two rooms that take a Green Card give a Green Keycard back (30m reset).'
      ]
    },
    {
      id: 'small_oil_rig',
      name: 'Oil Rig (Small)',
      rusthelpUrl: 'https://rusthelp.com/monument/oil-rig',
      tier: 3,
      biome: 'Offshore',
      defaultPos: { x: 0.06, y: 0.45, grid: 'B12' },
      cardsNeeded: ['Green', 'Blue', 'Red'],
      cardsFound: ['Green'],
      fusesNeeded: 1,
      radRequired: '0 RAD',
      respawnMin: 65,
      crates: { locked: 1, elite: 1, military: 5, normal: 10, diesel: 0 },
      utilities: ['No Recycler', '15m Hackable Locked Crate', '15x Scientists + 6x Heavy Scientists', 'CCTV: OILRIG1DOCK/HELI/L1-L4'],
      steps: [
        'Clear 15x Oil Rig Scientists across levels L1–L4 (No Recycler on site).',
        'Green Card room gives 3x Normal Crates; Blue Card + 1x Fuse room gives 2x Military Crates.',
        'Red Card + 1x Fuse room on top helipad unlocks 1x Locked Crate (15m hack) + 1x Elite Crate + 1x Military Crate + 1x Green Keycard and calls in 6x Heavy Scientists (all puzzles reset every 65m).'
      ]
    },
    {
      id: 'large_oil_rig',
      name: 'Large Oil Rig',
      rusthelpUrl: 'https://rusthelp.com/monument/large-oil-rig',
      tier: 3,
      biome: 'Offshore',
      defaultPos: { x: 0.94, y: 0.25, grid: 'Z7' },
      cardsNeeded: ['Green', 'Blue', 'Red'],
      cardsFound: ['Green'],
      fusesNeeded: 1,
      radRequired: '0 RAD',
      respawnMin: 65,
      crates: { locked: 1, elite: 2, military: 8, normal: 10, diesel: 4 },
      utilities: ['No Recycler', 'Research Table', '15m Hackable Locked Crate', '27x Scientists + 12x Heavy Scientists', 'CCTV: OILRIG2DOCK/EXHAUST/HELI/L1-L6'],
      steps: [
        'Clear 27x Oil Rig Scientists and collect 4x Diesel Fuel barrels (Research Table on site, No Recycler).',
        'Green, Blue, and 1x Fuse puzzles unlock extra Military/Normal Crates and 1x Green Keycard.',
        'Swiping the Red Keycard spawns 12x Heavy Scientists (with M249s, SPAS-12s, Miniguns, or Flamethrowers) and unlocks 1x Locked Crate (15m hack) + 2x Elite Crates + 4x Normal Crates (65m reset).'
      ]
    },
    {
      id: 'outpost',
      name: 'Outpost (Safe Zone)',
      rusthelpUrl: 'https://rusthelp.com/monument/outpost',
      tier: 0,
      biome: 'Safe Zone',
      defaultPos: { x: 0.48, y: 0.42, grid: 'M10' },
      cardsNeeded: [],
      cardsFound: ['Blue'],
      fusesNeeded: 0,
      radRequired: '0 RAD (Safe Zone)',
      respawnMin: 15,
      crates: { locked: 0, elite: 0, military: 0, normal: 0, diesel: 0 },
      utilities: ['3x Yellow Recyclers (40% Safe)', '2x Tier 1 Workbenches', 'Research Table & Repair Bench', '7x NPC Vending Shops (Blue Card = 100 Scrap)', 'Missions: CZ-721 & Vagabond'],
      steps: [
        'Safe Zone with 3x Yellow Recyclers, 2x T1 Workbenches, Research Table, and Repair Bench.',
        'Buy a Blue Keycard for 100 Scrap, Jackhammer for 150 Scrap, or trade Stone/Wood/Scrap at the 7 Vending Shops.',
        'Talk to NPC CZ-721 for Outpost Validation (unlocks a permanent Outpost spawn point!) and the 200 Scrap Oil Rig mission.'
      ]
    },
    {
      id: 'bandit_camp',
      name: 'Bandit Camp (Safe Zone)',
      rusthelpUrl: 'https://rusthelp.com/monument/bandit-camp',
      tier: 0,
      biome: 'Safe Zone',
      defaultPos: { x: 0.38, y: 0.56, grid: 'J14' },
      cardsNeeded: [],
      cardsFound: [],
      fusesNeeded: 0,
      radRequired: '0 RAD (Safe Zone)',
      respawnMin: 15,
      crates: { locked: 0, elite: 0, military: 0, normal: 0, diesel: 0 },
      utilities: ['2x Yellow Recyclers (40% Safe)', 'Tier 1 Workbench & Clan Table', 'Research Table & Repair Bench', 'Airwolf Heli Vendor & Casino', 'CCTV: AIRWOLF, CASINO, TOWNWEAPONS'],
      steps: [
        'Safe Zone with 2x Yellow Recyclers, T1 Workbench, Research Table, Repair Bench, and Clan Table.',
        'Trade Fertilizer for Scrap, buy Minicopters/Scrap Helis at Airwolf, or gamble Scrap on the Big Wheel & Slot Machines.'
      ]
    }
  ],

  // =========================================================================
  // 4. MONUMENT & EVENT TIMER PRESETS (RUSTHELP VERIFIED RESET TIMES)
  // =========================================================================
  timerPresets: [
    { id: 'small_rig_hack', name: 'Small Oil Rig — Crate Hack', category: 'Hack (15m)', durationSec: 15 * 60, color: '#ef4444' },
    { id: 'large_rig_hack', name: 'Large Oil Rig — Crate Hack', category: 'Hack (15m)', durationSec: 15 * 60, color: '#ef4444' },
    { id: 'chinook_hack', name: 'Chinook CH47 — Crate Hack', category: 'Hack (15m)', durationSec: 15 * 60, color: '#f97316' },
    { id: 'small_rig_respawn', name: 'Small Oil Rig — Puzzle Reset (65m)', category: 'Respawn', durationSec: 65 * 60, color: '#3b82f6' },
    { id: 'large_rig_respawn', name: 'Large Oil Rig — Puzzle Reset (65m)', category: 'Respawn', durationSec: 65 * 60, color: '#3b82f6' },
    { id: 'silo_puzzle', name: 'Missile Silo — Red Card Reset (30m)', category: 'Puzzle (30m)', durationSec: 30 * 60, color: '#ef4444' },
    { id: 'launch_puzzle', name: 'Launch Site — Puzzle Reset (30m)', category: 'Puzzle (30m)', durationSec: 30 * 60, color: '#ef4444' },
    { id: 'miltuns_puzzle', name: 'Military Tunnel — Puzzle Reset (30m)', category: 'Puzzle (30m)', durationSec: 30 * 60, color: '#ef4444' },
    { id: 'bradley_respawn', name: 'Bradley APC — Respawn', category: 'Respawn', durationSec: 60 * 60, color: '#eab308' },
    { id: 'bradley_fire', name: 'Bradley Crates — Fire Cooldown', category: 'Cooldown', durationSec: 5 * 60, color: '#f97316' },
    { id: 'cargo_active', name: 'Cargo Ship — Active Duration', category: 'Event', durationSec: 50 * 60, color: '#22c55e' },
    { id: 'heli_respawn', name: 'Patrol Helicopter — Window', category: 'Respawn', durationSec: 120 * 60, color: '#a855f7' },
    { id: 'train_puzzle', name: 'Train Yard — Puzzle Reset (30m)', category: 'Puzzle (30m)', durationSec: 30 * 60, color: '#3b82f6' },
    { id: 'water_puzzle', name: 'Water Treatment — Puzzle Reset (30m)', category: 'Puzzle (30m)', durationSec: 30 * 60, color: '#3b82f6' },
    { id: 'dome_puzzle', name: 'The Dome — Green Card Reset (30m)', category: 'Puzzle (30m)', durationSec: 30 * 60, color: '#22c55e' },
    { id: 'radtown_puzzle', name: 'Radtown — Green Card Reset (30m)', category: 'Puzzle (30m)', durationSec: 30 * 60, color: '#22c55e' },
    { id: 'sewer_puzzle', name: 'Sewer Branch — Puzzle Reset (30m)', category: 'Puzzle (30m)', durationSec: 30 * 60, color: '#22c55e' }
  ],

  // =========================================================================
  // 5. SUGGESTED BEST BUILDING SPOTS & NODE HOTSPOTS
  // =========================================================================
  buildSpots: [
    {
      id: 'spot-snow-rig',
      name: 'Snow Coastal Cliff (Oil Rig + Sulfur Hub)',
      grid: 'V5',
      x: 0.84,
      y: 0.22,
      squadSize: ['trio', 'zerg'],
      playstyle: ['raid', 'rig'],
      tier: 'S-Tier Meta',
      scores: { sulfur: 98, scrap: 92, stealth: 65 },
      pros: [
        'Massive Sulfur & HQM node spawns along snow cliff ridgelines.',
        '2-minute boat ride to Large Oil Rig & Underwater Labs.',
        'Cold temperature deters naked grubs and early-wipe roamers.'
      ],
      cons: [
        'High target priority for rival clans on Day 2–3.',
        'Requires heaters / rugs for indoor comfort & berry farming.'
      ]
    },
    {
      id: 'spot-sewer-sat',
      name: 'Sewer Branch + Satellite Dish Triangle',
      grid: 'N13',
      x: 0.50,
      y: 0.50,
      squadSize: ['solo', 'trio'],
      playstyle: ['pvp', 'scrap'],
      tier: 'S-Tier Solo/Trio',
      scores: { sulfur: 75, scrap: 96, stealth: 70 },
      pros: [
        'Two rapid Green-to-Blue card puzzles with safe underground Recyclers.',
        '1,000+ Scrap per hour cycling Sewer Branch, Satellite, and Road signs.',
        'Central map access to T2/T3 monuments once Workbench T2 is up.'
      ],
      cons: [
        'Constant mid-tier primitive and SAR PvP traffic.',
        'Moderate Sulfur density compared to Deep Snow or Desert.'
      ]
    },
    {
      id: 'spot-desert-launch',
      name: 'Desert Canyon (Launch Site + Airfield Flank)',
      grid: 'R16',
      x: 0.68,
      y: 0.60,
      squadSize: ['trio', 'zerg'],
      playstyle: ['raid', 'pvp'],
      tier: 'S-Tier Raiding',
      scores: { sulfur: 96, scrap: 94, stealth: 55 },
      pros: [
        'Flat desert plateaus allow massive multi-TC compounds and wide-gap shooting floors.',
        'Unrivaled visibility of sulfur nodes across open sand dunes.',
        'Immediate access to Bradley APC (7 HV Rockets) and Red Card Elite runs.'
      ],
      cons: [
        'Zero tree cover — bring wood from temperate edge or Outpost.',
        'High counter-raid probability during peak hours.'
      ]
    },
    {
      id: 'spot-forest-cave',
      name: 'Forested Cliff / Cave Node (Low-Key Bunker)',
      grid: 'E11',
      x: 0.20,
      y: 0.42,
      squadSize: ['solo', 'trio'],
      playstyle: ['stealth', 'scrap'],
      tier: 'A-Tier Anti-Offline',
      scores: { sulfur: 80, scrap: 82, stealth: 98 },
      pros: [
        'Dense forest canopy hides roof solar panels and 2x2 stability bunkers from Minicopters.',
        'Abundant Wood, Cloth (Hemp), and Berry spawns for Tea production.',
        'Close to Lighthouse/Water Treatment for quiet early-morning recycles.'
      ],
      cons: [
        'Reduced visibility against doorcampers in bushes.'
      ]
    },
    {
      id: 'spot-arctic-silo',
      name: 'Northern Tundra Basin (Arctic + Silo Loop)',
      grid: 'P5',
      x: 0.60,
      y: 0.19,
      squadSize: ['solo', 'trio', 'zerg'],
      playstyle: ['raid', 'stealth'],
      tier: 'S-Tier Progression',
      scores: { sulfur: 95, scrap: 90, stealth: 84 },
      pros: [
        'Unlimited Sulfur & Metal nodes in the northern snow basin.',
        'Cycle Arctic Research Base and Missile Silo for easy Red Cards + Elite Crates.',
        'Fewer foot-traffic roamers than central Temperate roads.'
      ],
      cons: [
        'Must wear warm clothing or Snow Jacket during night runs.'
      ]
    }
  ],

  farmZones: [
    { id: 'fz-1', type: 'Sulfur', name: 'Northern Snow Ridge (Sulfur & HQM)', x: 0.65, y: 0.14, grid: 'Q4', yield: 'Very High Sulfur / Metal', notes: 'Bring Pure Ore Tea + Jackhammer. 20+ nodes per 5-minute loop.' },
    { id: 'fz-2', type: 'Sulfur', name: 'Arid Desert Dunes (Sulfur Field)', x: 0.62, y: 0.78, grid: 'P20', yield: 'High Sulfur / High Visibility', notes: 'Open desert dunes — easy to spot yellow sulfur nodes from 200m.' },
    { id: 'fz-3', type: 'Metal', name: 'Western Craggy Cliffs (Metal & Stone)', x: 0.22, y: 0.26, grid: 'F7', yield: 'High Metal / Stone', notes: 'Cliff faces spawn concentrated Metal and Stone nodes.' },
    { id: 'fz-4', type: 'Scrap', name: 'Ring Road & Powerline Corridor', x: 0.48, y: 0.56, grid: 'M15', yield: '600+ Scrap/hr + Comps', notes: 'Combine Pure Scrap Tea + Paddle/Salvaged Cleaver along powerlines.' },
    { id: 'fz-5', type: 'Berries', name: 'Temperate Forest Riverbank (Berries & Hemp)', x: 0.30, y: 0.50, grid: 'H13', yield: 'Wild Hemp + Blue/Yellow Berries', notes: 'Collect wild Berry seeds & Hemp seeds here to start your Genetics Lab.' }
  ],

  // =========================================================================
  // 6. PLANT GENETICS & BERRY TEA RECIPES
  // =========================================================================
  geneWeights: {
    G: { code: 'G', name: 'Growth Speed', type: 'good', weight: 0.6, color: '#22c55e', desc: '+25% faster growth rate (diminishing after 3G)' },
    Y: { code: 'Y', name: 'Increased Yield', type: 'good', weight: 0.6, color: '#22c55e', desc: '+25% more harvest yield (Cloth / Berries / Food)' },
    H: { code: 'H', name: 'Hardiness', type: 'good', weight: 0.6, color: '#22c55e', desc: 'Improves cold temperature resistance in Snow biomes' },
    W: { code: 'W', name: 'Increased Water', type: 'bad', weight: 1.0, color: '#ef4444', desc: 'BAD GENE (Weight 1.0): Increases water consumption' },
    X: { code: 'X', name: 'Empty Slot', type: 'bad', weight: 1.0, color: '#ef4444', desc: 'BAD GENE (Weight 1.0): Empty slot (requires 2x Green 1.2 to overwrite)' }
  },

  teaRecipes: [
    {
      name: 'Ore Tea (Sulfur / Metal / Stone)',
      recipe: '2x Yellow Berry + 2x Blue Berry',
      basic: '+20% Ore Yield',
      advanced: '+35% Ore Yield (4x Basic)',
      pure: '+50% Ore Yield (4x Advanced)',
      duration: '30 Mins',
      notes: '1 Pure Ore Tea = +150 Sulfur per node (450 Sulfur per node instead of 300!). Essential before every farm run.'
    },
    {
      name: 'Scrap Tea (Barrel / Road Farming)',
      recipe: '2x Yellow Berry + 2x White Berry',
      basic: '+100% Barrel Scrap (4/barrel)',
      advanced: '+225% Barrel Scrap (6.5/barrel)',
      pure: '+350% Barrel Scrap (9/barrel)',
      duration: '45 Mins',
      notes: 'Pure Scrap Tea gives 9 Scrap per barrel! Hit underground train tunnels or ring road for 1,500+ Scrap in 30 mins.'
    },
    {
      name: 'Max Health Tea (Roam / Raid PvP)',
      recipe: '3x Red Berry + 1x Yellow Berry',
      basic: '+5% Max HP (105 HP)',
      advanced: '+12.5% Max HP (113 HP)',
      pure: '+20% Max HP (120 HP)',
      duration: '20 Mins',
      notes: 'Pure Max Health Tea gives 120 HP — survives an extra AK headshot or Bolt Action body shot during raid defense!'
    },
    {
      name: 'Wood Tea (Chainsaw Deforestation)',
      recipe: '2x Red Berry + 2x Blue Berry',
      basic: '+50% Wood Yield',
      advanced: '+100% Wood Yield',
      pure: '+200% Wood Yield',
      duration: '30 Mins',
      notes: 'Pure Wood Tea + Chainsaw fills a full inventory of wood for charcoal furnaces in 3 minutes.'
    }
  ],

  // =========================================================================
  // 7. RECYCLER COMPONENT YIELDS (RADTOWN 60% vs SAFE ZONE 40%)
  // =========================================================================
  recyclerComponents: [
    { id: 'tech_trash', name: 'Tech Trash', rad: { scrap: 24, hqm: 2, metal: 0, cloth: 0 }, safe: { scrap: 16, hqm: 1, metal: 0, cloth: 0 } },
    { id: 'rifle_body', name: 'Rifle Body', rad: { scrap: 30, hqm: 3, metal: 0, cloth: 0 }, safe: { scrap: 20, hqm: 2, metal: 0, cloth: 0 } },
    { id: 'smg_body', name: 'SMG Body', rad: { scrap: 18, hqm: 3, metal: 0, cloth: 0 }, safe: { scrap: 12, hqm: 2, metal: 0, cloth: 0 } },
    { id: 'semi_body', name: 'Semi Auto Body', rad: { scrap: 18, hqm: 3, metal: 90, cloth: 0 }, safe: { scrap: 12, hqm: 2, metal: 60, cloth: 0 } },
    { id: 'computer', name: 'Targeting Computer', rad: { scrap: 36, hqm: 2, metal: 60, cloth: 0 }, safe: { scrap: 24, hqm: 1, metal: 40, cloth: 0 } },
    { id: 'cctv', name: 'CCTV Camera', rad: { scrap: 24, hqm: 2, metal: 0, cloth: 0 }, safe: { scrap: 16, hqm: 1, metal: 0, cloth: 0 } },
    { id: 'fuse', name: 'Electric Fuse', rad: { scrap: 24, hqm: 0, metal: 0, cloth: 0 }, safe: { scrap: 16, hqm: 0, metal: 0, cloth: 0 } },
    { id: 'gears', name: 'Gears', rad: { scrap: 12, hqm: 0, metal: 15, cloth: 0 }, safe: { scrap: 8, hqm: 0, metal: 10, cloth: 0 } },
    { id: 'spring', name: 'Metal Spring', rad: { scrap: 12, hqm: 2, metal: 0, cloth: 0 }, safe: { scrap: 8, hqm: 1, metal: 0, cloth: 0 } },
    { id: 'pipe', name: 'Metal Pipe', rad: { scrap: 6, hqm: 2, metal: 0, cloth: 0 }, safe: { scrap: 4, hqm: 1, metal: 0, cloth: 0 } },
    { id: 'sheet_metal', name: 'Sheet Metal', rad: { scrap: 10, hqm: 2, metal: 120, cloth: 0 }, safe: { scrap: 6, hqm: 1, metal: 80, cloth: 0 } },
    { id: 'road_signs', name: 'Road Signs', rad: { scrap: 6, hqm: 2, metal: 0, cloth: 0 }, safe: { scrap: 4, hqm: 1, metal: 0, cloth: 0 } },
    { id: 'sewing_kit', name: 'Sewing Kit', rad: { scrap: 0, hqm: 0, metal: 0, cloth: 45 }, safe: { scrap: 0, hqm: 0, metal: 0, cloth: 30 } },
    { id: 'rope', name: 'Rope', rad: { scrap: 0, hqm: 0, metal: 0, cloth: 18 }, safe: { scrap: 0, hqm: 0, metal: 0, cloth: 12 } },
    { id: 'tarp', name: 'Tarp', rad: { scrap: 0, hqm: 0, metal: 0, cloth: 60 }, safe: { scrap: 0, hqm: 0, metal: 0, cloth: 40 } },
    { id: 'propane', name: 'Empty Propane Tank', rad: { scrap: 1, hqm: 0, metal: 60, cloth: 0 }, safe: { scrap: 1, hqm: 0, metal: 40, cloth: 0 } },
    { id: 'blade', name: 'Metal Blade', rad: { scrap: 2, hqm: 0, metal: 18, cloth: 0 }, safe: { scrap: 1, hqm: 0, metal: 12, cloth: 0 } }
  ],

  // =========================================================================
  // 8. BUILDING DECAY RATES & GIANT EXCAVATOR DIESEL YIELDS
  // =========================================================================
  decayRates: [
    { id: 'stone', name: 'Stone Wall / Foundation', maxHp: 500, fullDecayHours: 5 },
    { id: 'metal', name: 'Sheet Metal Wall / Foundation', maxHp: 1000, fullDecayHours: 8 },
    { id: 'armored', name: 'Armored (HQM) Wall / Foundation', maxHp: 2000, fullDecayHours: 12 },
    { id: 'wood', name: 'Wood Wall / Foundation', maxHp: 250, fullDecayHours: 3 },
    { id: 'garage_door', name: 'Garage Door', maxHp: 600, fullDecayHours: 8 },
    { id: 'sheet_door', name: 'Sheet Metal Door', maxHp: 250, fullDecayHours: 8 }
  ]
};
