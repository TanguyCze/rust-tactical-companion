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
      powerGrid: { stage: 1, fuses: 1, label: 'Stage 1 Power Grid (1× Heavy Fuse)' },
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
      powerGrid: { stage: 1, fuses: 1, label: 'Stage 1 Power Grid (1× Heavy Fuse)' },
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
      powerGrid: { stage: 1, fuses: 1, label: 'Stage 1 Power Grid (1× Heavy Fuse)' },
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
      npcCheese: {
        diagram: 'ridge_snipe',
        videoQuery: 'rust abandoned military base solo scientist cheese',
        aiThreat: '~7× Desert Military Scientists (LR-300 / M92, Roaming)',
        recommendedKit: 'Compound Bow / SAR + Bandages + Leather/Roadsign',
        tips: [
          'Perimeter Fence Peeks: Stand behind the outer desert rock ridges or chain-link sandbags outside the compound — snipe roaming perimeter Scientists before crossing the gate so only 2–3 remain inside.',
          'Jersey Barrier Head-Glitch: Crouch tight behind concrete barriers between the ammo tents; Scientists lock onto the top concrete lip while your chest stays covered.',
          'Tent Door Right-Hand Peek: Crack tent flaps from the right side — Scientist AI struggles to track fast strafe peeks around tent poles.'
        ]
      },
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
      powerGrid: { stage: 1, fuses: 1, label: 'Stage 1 Power Grid (1× Heavy Fuse)' },
      utilities: ['1x Green Recycler', 'Small Oil Refinery', 'Cargo Ship Docking', 'Stage 1 Power Grid Room (1 Heavy Fuse)'],
      npcCheese: {
        diagram: 'cargo_bridge',
        videoQuery: 'rust cargo ship harbor dock scientist cheese',
        aiThreat: '0 Normally (Cargo Ship Scientists ~16x ONLY when Cargo docks for 10m)',
        recommendedKit: 'Crossbow / DB / SAR — hold shipping container roofs',
        tips: [
          'Docked Cargo Crane Trap: While Cargo Ship is docked at Harbor, climb the tall dock shipping containers overlooking the deck instead of boarding first — pick off upper-deck Scientists with zero aggro range.',
          'Gangplank Funnel: Aggro a forward deck Scientist then back onto the Harbor concrete pier; they hesitate at the ship gangplank lip.'
        ]
      },
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
      powerGrid: { stage: 1, fuses: 1, label: 'Stage 1 Power Grid (1× Heavy Fuse)' },
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
      powerGrid: { stage: 2, fuses: 4, label: 'Stage 2 Power Grid (4× Heavy Fuses)' },
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
      powerGrid: { stage: 2, fuses: 4, label: 'Stage 2 Power Grid (4× Heavy Fuses)' },
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
      npcCheese: {
        diagram: 'ridge_snipe',
        videoQuery: 'rust arctic research base solo cheese scientists',
        aiThreat: '10× Cold-Weather Arctic Scientists (Roam courtyard & garages)',
        recommendedKit: 'Compound Bow or Silenced SAR + Jacket/Hazmat + Heat Packs',
        tips: [
          'Perimeter Rock Ridge Snipe: Climb the snow boulders just outside the chain-link fence before entering — 4 to 5 courtyard Scientists patrol right along the open snow lane in full view of the rocks.',
          'Blue Card Garage Hold: Bait Scientists toward the concrete Snowmobile Garage entrance; hold the steel frame on a right-hand peek so AI paths around the parked hull single-file.',
          'Trailer Alley LOS Reset: duck between the raised research hab trailers whenever medding — Arctic Scientists rarely flank tight alleys.'
        ]
      },
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
      powerGrid: { stage: 2, fuses: 4, label: 'Stage 2 Power Grid (4× Heavy Fuses)' },
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
      powerGrid: { stage: 2, fuses: 4, label: 'Stage 2 Power Grid (4× Heavy Fuses)' },
      utilities: ['1x Green Recycler', 'Coaling Tower Unloader', '4x Scientists', 'Stage 2 Power Grid Room (4 Heavy Fuses)'],
      npcCheese: {
        diagram: 'doorway_peek',
        videoQuery: 'rust train yard scientist puzzle solo guide',
        aiThreat: '4× Yard Tunnel Scientists (spawn near Coaling Tower / Fuse area)',
        recommendedKit: 'Crossbow + Nailgun or Revolver / SAR',
        tips: [
          'Freight Car & Concrete Pipe Peeks: Keep a boxcar wheel or concrete pipe between you and the Coaling Tower stairs — Train Yard Scientists lock onto chest height, letting you crown-tap from above/beside wheels.',
          'Switch House Doorway: Duck inside the small concrete switch shack if 2+ aggro simultaneously so they lose line-of-sight and stop spraying.'
        ]
      },
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
      npcCheese: {
        diagram: 'doorway_peek',
        videoQuery: 'rust airfield blue room scientists trap',
        aiThreat: '3× Underground Blue-Room Scientists (spawn on Blue Door swipe)',
        recommendedKit: 'DB / Pump Shotgun or SMG / SAR + Torch/NVG',
        tips: [
          'Tunnel Staircase Hatch Bait: Do NOT rush into the Blue loot room right after swiping — stay back at the dark tunnel concrete pillar/stairway outside the door. All 3 Scientists funnel through the narrow doorway one at a time.',
          'Surface Clear First: Above ground has 0 Scientists (unless Chinook/Tunnels aggro), so loot hangars & tower quietly before heading underground.'
        ]
      },
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
      powerGrid: { isHub: true, stage: 3, fuses: 10, maxFuses: 18, label: 'Power Grid Hub (1 / 4 / 10 / 18 Heavy Fuses)' },
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
      npcCheese: {
        diagram: 'ridge_snipe',
        videoQuery: 'rust giant excavator solo cheese compound bow',
        aiThreat: '18× Excavator Pit Scientists (Heavy pit roamers + upper walkway guards)',
        recommendedKit: 'Compound Bow / Bolt / SAR (8x/Holo helpful) + Meds',
        tips: [
          'Dirt Rim Range Cheese: Excavator Scientists will NOT chase you up onto the outer earthen crater rim — pick off 8–10 roaming AI cleanly from the high dirt slopes before walking down into the machinery pit.',
          'Catwalk / Hopper Steel Frame: Inside the pit, climb onto the middle catwalk railing corners; AI under the gantry struggles to angle shots up through the perforated floor.',
          'Diesel Defense Angle: Once Diesel starts, hold the Recycler shed roof/metal stairs — you watch the engine room and every rim slide at once.'
        ]
      },
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
      powerGrid: { stage: 3, fuses: 10, label: 'Stage 3 Power Grid (10× Heavy Fuses)' },
      utilities: ['No Recycler', '2x Blueprint Books (NEW)', 'Computer Station & Telephone', 'CCTV: SILOEXIT1/2, SILOMISSILE, SILOSHIPPING, SILOTOWER'],
      npcCheese: {
        diagram: 'stair_grate',
        videoQuery: 'rust missile silo stairwell cheese solo',
        aiThreat: '4× Outside Scientists + 23× Underground Silo Scientists (tight CQB + grenades)',
        recommendedKit: 'MP5/SAR/Thommy + Shotgun/Flashlight + Hazmat + 6+ Syringes',
        tips: [
          'Stairwell Grate Head-Glitch (Biggest Cheese): Inside the deep missile shaft stairwells, stand ONE half-flight ABOVE the Scientists and shoot down through the metal stair grates — they hit the underside metal while you see full helmets.',
          'Open-Door Step-Back Trigger: Next Silo waves spawn/aggro as you open each bulkhead door. Open every door, sprint 1 corner back immediately, and pre-aim the doorway as they push in single-file.',
          'Night/Silencer Surface Clear: Drop the 4 surface guards from behind the outer shipping containers with a Compound Bow before swiping Red Card so nobody hears you enter.'
        ]
      },
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
      powerGrid: { stage: 3, fuses: 10, label: 'Stage 3 Power Grid (10× Heavy Fuses)' },
      utilities: ['1x Green Recycler', '2x Blueprint Books (NEW)', 'Bradley APC (7 HV Rockets)', 'Stage 3 Powered Loot Room (8 Crates)'],
      npcCheese: {
        diagram: 'doorway_peek',
        videoQuery: 'rust bradley apc hv rocket cheese cobalt launch site',
        aiThreat: 'Bradley APC (7 HV Rockets) + 8× Rocket Factory Scientists',
        recommendedKit: 'Rocket Launcher + 7× HV Rockets + SAR/MP5 + Hazmat + Jug of Water',
        tips: [
          'Bradley Cobalt Garage / Ticket Booth Cheese: Bait Bradley near the brick Cobalt building or Recycle shed doorway. Fire 2 HV Rockets into its treads/rear, duck completely behind the concrete wall during its MG + rocket salvo (stay away from windows — splash kills through glass!), then peek cleanly every 4s. Takes 7 HV Rockets (1,400 Sulfur total).',
          'Factory Roof Staircase Hold: Inside the Red Card Rocket Factory, scientists spawn on middle catwalks; hold the upper elevator/stair landings on a right-hand head peek so only 1 helmet peeks up at a time.',
          'Water Extinguishing / Fire Watch: Wait out the ~4m crate fire on Bradley from the Rocket Factory stairs or Recycle roof rather than hugging burning crates exposed.'
        ]
      },
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
      npcCheese: {
        diagram: 'doorway_peek',
        videoQuery: 'rust military tunnels solo cheese fuse room train',
        aiThreat: '33× Tunnel Scientists (Heavy F1 Grenade spam + fast lane pushes)',
        recommendedKit: 'SAR/MP5/Thommy (Flashlight/NVG) + 6–8 Syringes + 30+ Bandages',
        tips: [
          'Overturned Train Car Right-Peek: Scientists CANNOT push cleanly over the derailed tanker/boxcars inside the main tunnel. Stick to the concrete edge or right side of a boxcar and head-tap across the tracks.',
          'Concrete Fuse Room Bunker: Pull aggro then retreat inside the small concrete fuse/card rooms; hold the narrow steel doorway behind the concrete desk. When a Scientist yells "Frag/Grenade!", step deep behind the internal corner for 3s.',
          'Silent Bow Opening: Drop the entrance sandbox/outer-tunnel guards with a Compound Bow before firing unsuppressed inside so nearby bases don’t hear you start.'
        ]
      },
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
      npcCheese: {
        diagram: 'moonpool_door',
        videoQuery: 'rust underwater labs solo scientist cheese',
        aiThreat: '~4–8× Underwater Lab Dwellers (Modular hallway ambushers)',
        recommendedKit: 'Pump/DB Shotgun or MP5 + Compound Bow + Diving Tank/Flippers',
        tips: [
          'Bulkhead Door Crack Funnel: Lab Scientists are locked inside corridor modules until you open bulkhead doors. Crack a door open, fire 1–2 shots/arrows, and immediately sidestep behind the frame — they walk straight into close-range shotgun pre-aim.',
          'Moonpool Ladder Reset: Whenever outnumbered or bleeding, drop cleanly down through any moonpool hatch into the ocean (NPCs will never shoot into underwater vertical shafts) to med safely and re-peek.'
        ]
      },
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
      respawnMin: 30,
      crates: { locked: 1, elite: 1, military: 5, normal: 10, diesel: 0 },
      utilities: ['No Recycler', '15m Hackable Locked Crate', '15x Scientists + 6x Heavy Scientists', 'CCTV: OILRIG1DOCK/HELI/L1-L4'],
      npcCheese: {
        diagram: 'crane_funnel',
        videoQuery: 'rust small oil rig crane cheese heavy scientists bow',
        aiThreat: '15× Oil Rig Scientists (L1–L4) + 6× Heavy Scientists (after Locked Crate trigger)',
        recommendedKit: 'Budget Solo: Compound Bow + Nailgun/Revolver + 2× F1 Grenades ( bandies/cloth ) OR SAR + 40 5.56',
        tips: [
          'Crane Ladder / Vent Roof Heavy Cheese: Start the Locked Crate on L4 helipad and IMMEDIATELY climb onto the orange Crane ladder or the Red-Room vent roof. The 6 Heavy Scientists funnel slowly along the helipad stairs & doorway without flanking behind you.',
          'Dock Grate & Boat Pillar Clear: Before climbing up, float in a RHIB/kayak by the bottom dock pillars or crouch behind L1 stair containers — lower scientists expose their heads through catwalk grates while struggling to hit crouched boat players.',
          'Silent Compound Bow Clear: Clear L1–L4 with a Compound Bow (no gunshot audio across shore) until you actually pull Heavies; toss 1–2 F1 Grenades (8 Scrap each) at clumped Heavies on the stairs.'
        ]
      },
      steps: [
        'Clear 15x Oil Rig Scientists across levels L1–L4 (No Recycler on site).',
        'Green Card room gives 3x Normal Crates; Blue Card + 1x Fuse room gives 2x Military Crates.',
        'Red Card + 1x Fuse room on top helipad unlocks 1x Locked Crate (15m hack) + 1x Elite Crate + 1x Military Crate + 1x Green Keycard and calls in 6x Heavy Scientists (~25–30m reset after all scientists/heavies die, crate clears & NO players remain nearby).'
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
      respawnMin: 30,
      crates: { locked: 1, elite: 2, military: 8, normal: 10, diesel: 4 },
      utilities: ['No Recycler', 'Research Table', '15m Hackable Locked Crate', '27x Scientists + 12x Heavy Scientists', 'CCTV: OILRIG2DOCK/EXHAUST/HELI/L1-L6'],
      npcCheese: {
        diagram: 'crane_funnel',
        videoQuery: 'rust large oil rig crane cheese heavy scientists solo',
        aiThreat: '27× Oil Rig Scientists (L1–L6) + 12× Heavy Scientists (M249/Minigun/SPAS)',
        recommendedKit: 'Compound Bow + SAR/AK + 3× F1 Grenades + Hazmat + 6+ Syringes + Cloth',
        tips: [
          'Red Crane Cab / Catwalk Bend Funnel (Classic Solo Cheese): Hack the Locked Crate on Top Deck and sprint straight up the tall Red Crane stairs into the crane cab or behind the crane counterweights. The 12 Heavy Scientists clump single-file on the lower ramp landing where you can head-tap or drop F1 Grenades.',
          'Vent Duct / Stairwell Head-Peeks (Green → Blue → Red): Clear L3–L5 slowly from bottom stairwells looking UP through railing gaps — Scientists below chest-lock while only their helmets poke above the grating.',
          'Boat Dock Underside Safe Spot: If counter-pushed or low on meds, dive off L1 into the water under the dock pylons — Scientists never shoot vertically through solid lower steel decking.'
        ]
      },
      steps: [
        'Clear 27x Oil Rig Scientists and collect 4x Diesel Fuel barrels (Research Table on site, No Recycler).',
        'Green, Blue, and 1x Fuse puzzles unlock extra Military/Normal Crates and 1x Green Keycard.',
        'Swiping the Red Keycard spawns 12x Heavy Scientists (with M249s, SPAS-12s, Miniguns, or Flamethrowers) and unlocks 1x Locked Crate (15m hack) + 2x Elite Crates + 4x Normal Crates (~30m reset once all heavies die, crate clears & nobody remains on/near the rig).'
      ]
    },
    {
      id: 'outpost',
      name: 'Outpost (Safe Zone)',
      rusthelpUrl: 'https://rusthelp.com/monument/outpost',
      tier: 0,
      biome: 'Safe Zone',
      safeZone: true,
      defaultPos: { x: 0.48, y: 0.42, grid: 'M10' },
      cardsNeeded: [],
      cardsFound: ['Blue'],
      fusesNeeded: 0,
      radRequired: '0 RAD (Safe Zone)',
      respawnMin: 30,
      crates: { locked: 0, elite: 0, military: 0, normal: 0, diesel: 0 },
      utilities: ['3x Yellow Recyclers (40% Safe)', '2x Tier 1 Workbenches', 'Research Table & Repair Bench', '7x NPC Vending Shops (Blue Card = 100 Scrap)', 'Missions: CZ-721 & Vagabond'],
      npcCheese: {
        diagram: 'safe_zone',
        videoQuery: 'rust outpost cz721 oil rig mission tips',
        aiThreat: 'Safe Zone Peacekeeper Sentries (Instant laser kill + 30m hostility cooldown)',
        recommendedKit: 'Holster everything >5s away from fence — zero barrels/pigs hit in sight',
        tips: [
          'Avoid Accidental 30m Aggro: Firing a bow, throwing flares/rocks, or breaking barrels even outside the wall while visible to Outpost triggers a 30-minute Safe Zone timer.',
          'Zero-Scientist Oil Rig Prep: Pick up CZ-721 Oil Rig mission + buy Blue Keycard (100 Scrap), Jackhammer (150 Scrap), and F1 Grenades (8 Scrap each to cheese Rig Heavies!).'
        ]
      },
      steps: [
        'Safe Zone with 3x Yellow Recyclers, 2x T1 Workbenches, Research Table, and Repair Bench.',
        'Buy a Blue Keycard for 100 Scrap, Jackhammer for 150 Scrap, or trade Stone/Wood/Scrap at the 7 Vending Shops.',
        'Talk to NPC CZ-721 for Outpost Validation (unlocks a permanent Outpost spawn point!) and the 200 Scrap Oil Rig mission (Hostile Safe Zone aggro = 30m).'
      ]
    },
    {
      id: 'bandit_camp',
      name: 'Bandit Camp (Safe Zone)',
      rusthelpUrl: 'https://rusthelp.com/monument/bandit-camp',
      tier: 0,
      biome: 'Safe Zone',
      safeZone: true,
      defaultPos: { x: 0.38, y: 0.56, grid: 'J14' },
      cardsNeeded: [],
      cardsFound: [],
      fusesNeeded: 0,
      radRequired: '0 RAD (Safe Zone)',
      respawnMin: 30,
      crates: { locked: 0, elite: 0, military: 0, normal: 0, diesel: 0 },
      utilities: ['2x Yellow Recyclers (40% Safe)', 'Tier 1 Workbench & Clan Table', 'Research Table & Repair Bench', 'Airwolf Heli Vendor & Casino', 'CCTV: AIRWOLF, CASINO, TOWNWEAPONS'],
      npcCheese: {
        diagram: 'safe_zone',
        videoQuery: 'rust bandit camp f1 grenade fertilizer scrap',
        aiThreat: 'Bandit Guards (AI with LRs — hostile 30m if weapon drawn)',
        recommendedKit: 'Keep hotbar clean; bring Scrap / Horse Fertilizer',
        tips: [
          'F1 Grenade Stack Shop for Rig Cheese: Bandit Camp Weapon Shop sells F1 Grenades super cheap (8 Scrap each) — stack 3–4 before every Oil Rig run to wipe grouped Heavy Scientists.'
        ]
      },
      steps: [
        'Safe Zone with 2x Yellow Recyclers, T1 Workbench, Research Table, Repair Bench, and Clan Table.',
        'Trade Fertilizer for Scrap, buy Minicopters/Scrap Helis at Airwolf, or gamble Scrap on the Big Wheel & Slot Machines (Hostile Safe Zone aggro = 30m).'
      ]
    }
  ],

  bossNpcCheese: [
    {
      name: '🚁 Patrol Helicopter (Attack Heli)',
      diagram: 'heli_tower',
      videoQuery: 'rust patrol helicopter solo take down cheese tower',
      threat: '10,000 HP (Main Rotor 900 HP / Tail Rotor 500 HP — 2× damage weakspots)',
      kit: 'Dedicated Stone/Metal Shooting Floor (TC-Authed!) + Window Embrasures + SAR / M249 / HMLMG',
      tips: [
        'TC-Auth Rocket Prevention (Vanilla Rule): Heli fires barrage rockets at bases if zero defenders in radius hold Building Privilege on the TC. Keep TC-auth on your Heli Tower (never clear TC to bait), OR shoot from concrete monuments (Launch Cobalt Garage / Power Plant brick roofs) so zero base walls take splash!',
        'Rotor Focus Shortcut: Shoot exclusively at the Main Top Rotor or Rear Tail Rotor with M249/HMLMG/AK/SAR — destroying BOTH rotors drops Heli immediately even before body HP hits 0.',
        'Break Aggro Reset: Duck completely under a solid concrete roof for ~6–8s between bursts whenever Heli strafes directly overhead so its MG laser loses lock.'
      ]
    },
    {
      name: '🚢 Cargo Ship (Offshore Sea Boss)',
      diagram: 'cargo_bridge',
      videoQuery: 'rust cargo ship solo cheese boarding',
      threat: '~16× Deck & Cabin Scientists + up to 3–4× Locked Crates (10m horn intervals)',
      kit: 'Crossbow/Compound + SAR/SMG + Boat/Sub/Mini + 2× F1 Grenades',
      tips: [
        'Stern / Container Ledge Board: Climb the rear ladder on the stern opposite where deck Scientists patrol, or crouch tight behind the yellow bow shipping containers — clear forward deck first before pushing the captain bridge.',
        'Captain Bridge Stairwell Funnel: Hold the outer steel stairs or lower door frame below the bridge; Scientists inside the captain quarters walk onto the top landing one at a time.',
        'Submarine Egress: Bring a Solo Sub alongside Cargo so if a 5-man counters you, dive off the side straight into the Sub underwater safely.'
      ]
    }
  ],

  // =========================================================================
  // 4. MONUMENT & EVENT TIMER PRESETS (VERIFIED VANILLA TIMINGS)
  // =========================================================================
  timerPresets: [
    { id: 'small_rig_hack', name: 'Small Oil Rig — Crate Hack', category: 'Hack (15m)', group: 'hacks', essential: true, durationSec: 15 * 60, color: '#ef4444', hint: 'Default 900s (15m) locked crate hack' },
    { id: 'large_rig_hack', name: 'Large Oil Rig — Crate Hack', category: 'Hack (15m)', group: 'hacks', essential: true, durationSec: 15 * 60, color: '#ef4444', hint: 'Default 900s (15m) + 12x Heavy Scientists' },
    { id: 'chinook_hack', name: 'Chinook CH47 — Crate Hack', category: 'Hack (15m)', group: 'hacks', durationSec: 15 * 60, color: '#f97316', hint: 'Default 900s (15m) locked crate unlock' },
    { id: 'cargo_next_crate', name: 'Cargo Ship — Next Crate Spawn', category: 'Cargo (10m)', group: 'hacks', essential: true, durationSec: 10 * 60, color: '#22c55e', hint: 'Horn sounds ~10m for each additional locked crate' },
    { id: 'cargo_harbor_dock', name: 'Cargo Ship — Harbor Dock Stay', category: 'Harbor (10m)', group: 'events', essential: true, durationSec: 10 * 60, color: '#14b8a6', hint: 'Stays docked ~10m; horn blows 60s before leaving' },
    { id: 'cargo_active', name: 'Cargo Ship — Map Duration', category: 'Event (50m)', group: 'events', durationSec: 50 * 60, color: '#22c55e', hint: 'Default cargoship.event_duration_minutes = 50 (spawns ~2–4h)' },
    { id: 'bradley_fire', name: 'Bradley APC — Crates Fire Cooldown', category: 'Fire (4m)', group: 'events', essential: true, durationSec: 4 * 60, color: '#f97316', hint: 'Crates cool at ~4m (body ~5m); instant if in water' },
    { id: 'heli_fire', name: 'Patrol Heli — Crash Crate Fire', category: 'Fire (5m)', group: 'events', essential: true, durationSec: 5 * 60, color: '#f97316', hint: 'Crates burn ~3–5m unless extinguished in water' },
    { id: 'bradley_respawn', name: 'Bradley APC — Respawn', category: 'Respawn (60m)', group: 'events', durationSec: 60 * 60, color: '#eab308', hint: 'Vanilla bradley.respawndelayminutes = 60' },
    { id: 'heli_active', name: 'Patrol Helicopter — Patrol Stay', category: 'Event (30m)', group: 'events', durationSec: 30 * 60, color: '#a855f7', hint: 'Vanilla heli.lifetimeminutes = 30 if unengaged' },
    { id: 'heli_respawn', name: 'Patrol Helicopter — 2–4h Window', category: 'Window (2–4h)', group: 'events', durationSec: 120 * 60, color: '#a855f7', hint: 'Vanilla spawns randomly every ~2–4 hours (2h min alert)' },
    { id: 'small_rig_respawn', name: 'Small Oil Rig — Clear Reset (~30m)', category: 'Reset (~30m)', group: 'events', durationSec: 30 * 60, color: '#3b82f6', hint: 'Freezes while players or stuck heavies remain on rig' },
    { id: 'large_rig_respawn', name: 'Large Oil Rig — Clear Reset (~30m)', category: 'Reset (~30m)', group: 'events', durationSec: 30 * 60, color: '#3b82f6', hint: 'Starts when crate clears, heavies die & area is empty' },
    { id: 'silo_puzzle', name: 'Missile Silo — Red Card Reset', category: 'Puzzle (15–30m)', group: 'puzzles', durationSec: 30 * 60, color: '#ef4444', hint: 'Up to 30m low-pop (~15m high-pop) once clear' },
    { id: 'launch_puzzle', name: 'Launch Site — Red Card Reset', category: 'Puzzle (15–30m)', group: 'puzzles', durationSec: 30 * 60, color: '#ef4444', hint: 'Up to 30m low-pop (~15m high-pop)' },
    { id: 'miltuns_puzzle', name: 'Military Tunnel — Puzzle Reset', category: 'Puzzle (15–30m)', group: 'puzzles', durationSec: 30 * 60, color: '#ef4444', hint: 'Up to 30m low-pop (~15m high-pop)' },
    { id: 'power_plant_puzzle', name: 'Power Plant — Blue Card Reset', category: 'Puzzle (15–30m)', group: 'puzzles', durationSec: 30 * 60, color: '#3b82f6', hint: 'Up to 30m low-pop (~15m high-pop)' },
    { id: 'airfield_puzzle', name: 'Airfield — Blue Card Reset', category: 'Puzzle (15–30m)', group: 'puzzles', durationSec: 30 * 60, color: '#3b82f6', hint: 'Up to 30m low-pop (~15m high-pop)' },
    { id: 'train_puzzle', name: 'Train Yard — Blue Card Reset', category: 'Puzzle (15–30m)', group: 'puzzles', durationSec: 30 * 60, color: '#3b82f6', hint: 'Up to 30m low-pop (~15m high-pop)' },
    { id: 'water_puzzle', name: 'Water Treatment — Blue Card Reset', category: 'Puzzle (15–30m)', group: 'puzzles', durationSec: 30 * 60, color: '#3b82f6', hint: 'Up to 30m low-pop (~15m high-pop)' },
    { id: 'arctic_puzzle', name: 'Arctic Research — Blue Card Reset', category: 'Puzzle (15–30m)', group: 'puzzles', durationSec: 30 * 60, color: '#3b82f6', hint: 'Up to 30m low-pop (~15m high-pop)' },
    { id: 'underwater_puzzle', name: 'Underwater Lab — Puzzle Reset', category: 'Puzzle (15–30m)', group: 'puzzles', durationSec: 30 * 60, color: '#3b82f6', hint: 'Up to 30m low-pop (~15m high-pop)' },
    { id: 'harbor_puzzle', name: 'Harbor / Ferry — Green Card Reset', category: 'Puzzle (15–30m)', group: 'puzzles', durationSec: 30 * 60, color: '#22c55e', hint: 'Up to 30m low-pop (~15m high-pop)' },
    { id: 'dome_puzzle', name: 'The Dome — Green Card Reset', category: 'Puzzle (15–30m)', group: 'puzzles', durationSec: 30 * 60, color: '#22c55e', hint: 'Up to 30m low-pop (~15m high-pop)' },
    { id: 'radtown_puzzle', name: 'Radtown — Green Card Reset', category: 'Puzzle (15–30m)', group: 'puzzles', durationSec: 30 * 60, color: '#22c55e', hint: 'Up to 30m low-pop (~15m high-pop)' },
    { id: 'sewer_puzzle', name: 'Sewer Branch — Green Card Reset', category: 'Puzzle (15–30m)', group: 'puzzles', durationSec: 30 * 60, color: '#22c55e', hint: 'Up to 30m low-pop (~15m high-pop)' },
    { id: 'sat_puzzle', name: 'Satellite Dish — Green Card Reset', category: 'Puzzle (15–30m)', group: 'puzzles', durationSec: 30 * 60, color: '#22c55e', hint: 'Up to 30m low-pop (~15m high-pop)' },
    { id: 'day_cycle', name: 'Daylight Phase (Day → Sunset)', category: 'World (~45m)', group: 'world', essential: true, durationSec: 45 * 60, color: '#eab308', hint: 'Vanilla 60m cycle: ~45m Day / ~15m Night' },
    { id: 'night_cycle', name: 'Nighttime Phase (Night → Dawn)', category: 'World (~15m)', group: 'world', durationSec: 15 * 60, color: '#6366f1', hint: 'Vanilla 60m cycle: ~15m Night' },
    { id: 'safezone_hostile', name: 'Safe Zone Hostile Timer', category: 'Aggro (30m)', group: 'world', essential: true, durationSec: 30 * 60, color: '#ef4444', hint: 'Outpost/Bandit aggro (resets to 30m if spotted)' },
    { id: 'electric_fuse', name: 'Electric Fuse Burnout', category: 'Fuse (3m20s)', group: 'world', durationSec: 200, color: '#60a5fa', hint: '200s per 100% durability Electric Fuse in fuse box' },
    { id: 'heavy_fuse_burn', name: 'Power Plant — Heavy Fuse Burnout', category: 'Heavy Fuse (2h40m)', group: 'world', essential: true, durationSec: 9600, color: '#f59e0b', hint: '9,600s (2h 40m / 160m) per Heavy Fuse in Power Plant grid box' },
    { id: 'power_grid_stage1', name: 'Power Plant — Stage 1 Grid (1× Heavy Fuse)', category: 'Grid Stage 1 (2h40m)', group: 'puzzles', durationSec: 9600, color: '#22c55e', hint: 'Boosts Green Recyclers 50%→60% + opens Stage 1 monument rooms' },
    { id: 'power_grid_stage2', name: 'Power Plant — Stage 2 Grid (4× Heavy Fuses)', category: 'Grid Stage 2 (2h40m)', group: 'puzzles', durationSec: 9600, color: '#3b82f6', hint: 'Opens Sewer, Water Treatment, Train Yard & Radtown powered rooms' },
    { id: 'power_grid_stage3', name: 'Power Plant — Max Grid & 75% Red Recycler', category: 'Max Grid (2h40m)', group: 'puzzles', durationSec: 9600, color: '#ef4444', hint: '10–18× Heavy Fuses: unlocks 75% Red Recycler + Stage 3 Elite rooms' },
    { id: 'excavator_5diesel', name: 'Giant Excavator — 5x Diesel Airdrop', category: 'Excavator (10m)', group: 'world', durationSec: 10 * 60, color: '#eab308', hint: '2m/diesel -> 5 barrels (10m) reaches 100% signal' }
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
    { id: 'heavy_fuse', name: 'Heavy Fuse', rad: { scrap: 20, hqm: 0, metal: 0, cloth: 0 }, safe: { scrap: 16, hqm: 0, metal: 0, cloth: 0 } },
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
    { id: 'twig', name: 'Twig Frame / Wall', maxHp: 10, fullDecayHours: 1 },
    { id: 'wood', name: 'Wood Wall / Foundation', maxHp: 250, fullDecayHours: 3 },
    { id: 'stone', name: 'Stone Wall / Foundation', maxHp: 500, fullDecayHours: 5 },
    { id: 'metal', name: 'Sheet Metal Wall / Foundation', maxHp: 1000, fullDecayHours: 8 },
    { id: 'armored', name: 'Armored (HQM) Wall / Foundation', maxHp: 2000, fullDecayHours: 12 },
    { id: 'garage_door', name: 'Garage Door', maxHp: 600, fullDecayHours: 8 },
    { id: 'sheet_door', name: 'Sheet Metal Door', maxHp: 250, fullDecayHours: 8 },
    { id: 'armored_door', name: 'Armored Door', maxHp: 1000, fullDecayHours: 12 }
  ],

  // =========================================================================
  // 9. IN-GAME PLAYER VENDING MACHINES & NPC MONUMENT SHOP TRADES
  // =========================================================================
  shopTrades: [
    // Player Vending Machines (Live-Wipe Benchmark & Meta Deals)
    { id: 'player_pure_ore_tea', shopType: 'player', monument: 'Player Shop', monumentId: 'player_vending', vendor: 'Tea & Berry Farmer', category: 'teas', meta: true, bestToBuy: true, tierRank: 'S', drone: true, buyItem: 'Pure Ore Tea', buyQty: 1, payItem: 'Sulfur', payQty: 350, fairMin: 200, fairMax: 450, ripOffAt: 650, altPriceHint: 'or 60–90 Scrap', whyBest: '#1 Best Player Shop Buy: +50% Ore yield (+150 Sulfur/node) pays for itself in 3 Sulfur nodes and nets +3,000–6,000 extra Sulfur per 30m run!', notes: 'Always drone Pure Ore Tea before a Jackhammer snow run.' },
    { id: 'player_adv_ore_tea', shopType: 'player', monument: 'Player Shop', monumentId: 'player_vending', vendor: 'Tea & Berry Farmer', category: 'teas', meta: true, bestToBuy: true, tierRank: 'S', drone: true, buyItem: 'Advanced Ore Tea', buyQty: 1, payItem: 'Sulfur', payQty: 150, fairMin: 100, fairMax: 220, ripOffAt: 350, altPriceHint: 'or 35–50 Scrap', whyBest: '+35% Ore yield (+105 Sulfur/node) — pays off in just 2 sulfur nodes.', notes: 'Huge ROI backup when Pure Ore Tea is sold out.' },
    { id: 'player_pure_scrap_tea', shopType: 'player', monument: 'Player Shop', monumentId: 'player_vending', vendor: 'Tea & Berry Farmer', category: 'teas', meta: true, bestToBuy: true, tierRank: 'S', drone: true, buyItem: 'Pure Scrap Tea', buyQty: 1, payItem: 'Sulfur', payQty: 300, fairMin: 200, fairMax: 400, ripOffAt: 600, altPriceHint: 'or 60–80 Scrap', whyBest: '+350% Barrel Scrap (9 Scrap/barrel) — yields 1,200–2,000 Scrap in a 30m road or Metro Tunnel run.', notes: 'Fastest way to finish T2/T3 tech trees safely.' },
    { id: 'player_pure_wood_tea', shopType: 'player', monument: 'Player Shop', monumentId: 'player_vending', vendor: 'Tea & Berry Farmer', category: 'teas', meta: true, bestToBuy: true, tierRank: 'S', drone: true, buyItem: 'Pure Wood Tea', buyQty: 1, payItem: 'Sulfur', payQty: 200, fairMin: 120, fairMax: 300, ripOffAt: 450, altPriceHint: 'or 40–60 Scrap', whyBest: '+200% Wood yield — 5 minutes with a Chainsaw fills an entire box of Wood for Charcoal & upkeep.', notes: 'Must-buy before smelting mass Sulfur/GP.' },
    { id: 'player_pure_max_hp_tea', shopType: 'player', monument: 'Player Shop', monumentId: 'player_vending', vendor: 'Tea & Berry Farmer', category: 'teas', meta: false, bestToBuy: false, tierRank: 'A', drone: true, buyItem: 'Pure Max Health Tea', buyQty: 1, payItem: 'Sulfur', payQty: 250, fairMin: 150, fairMax: 350, ripOffAt: 500, altPriceHint: 'or 50 Scrap', notes: '120 Max HP for 20m — huge edge during online raid defense or Oil Rig.' },
    { id: 'player_god_clone_hemp', shopType: 'player', monument: 'Player Shop', monumentId: 'player_vending', vendor: 'Genetics / Clone Shop', category: 'teas', meta: true, bestToBuy: true, tierRank: 'S', drone: true, buyItem: 'Hemp God Clone (YYYYGG)', buyQty: 1, payItem: 'Sulfur', payQty: 300, fairMin: 150, fairMax: 400, ripOffAt: 600, altPriceHint: 'or 50–80 Scrap', whyBest: 'Skips 3+ hours of crossbreeding for permanent infinite Cloth & Bandit Scrap!', notes: 'Plant 1, clone into 4, never run low on meds/clothes again.' },
    { id: 'player_god_clone_berry', shopType: 'player', monument: 'Player Shop', monumentId: 'player_vending', vendor: 'Genetics / Clone Shop', category: 'teas', meta: true, bestToBuy: true, tierRank: 'S', drone: true, buyItem: 'Blue / Yellow Berry God Clone', buyQty: 1, payItem: 'Sulfur', payQty: 350, fairMin: 200, fairMax: 450, ripOffAt: 650, altPriceHint: 'or 60–90 Scrap', whyBest: 'Instant Pure Ore Tea genetics without crossbreeding!', notes: 'Use Clone Solver tab to multiply first batch.' },

    { id: 'player_wb2', shopType: 'player', monument: 'Player Shop', monumentId: 'player_vending', vendor: 'Progression / BP Seller', category: 'progression', meta: true, bestToBuy: true, tierRank: 'S', drone: true, buyItem: 'Workbench Level 2', buyQty: 1, payItem: 'Sulfur', payQty: 400, fairMin: 250, fairMax: 500, ripOffAt: 750, altPriceHint: 'or 200–300 Scrap', whyBest: 'Saves 500 Scrap + 20 HQM on wipe day for ~1.3 Sulfur nodes!', notes: 'One of the strongest wipe-day progression shortcuts in Rust.' },
    { id: 'player_wb3', shopType: 'player', monument: 'Player Shop', monumentId: 'player_vending', vendor: 'Progression / BP Seller', category: 'progression', meta: true, bestToBuy: true, tierRank: 'S', drone: true, buyItem: 'Workbench Level 3', buyQty: 1, payItem: 'Sulfur', payQty: 1200, fairMin: 800, fairMax: 1500, ripOffAt: 2200, altPriceHint: 'or 500–700 Scrap', whyBest: 'Saves 1,250 Scrap + 100 HQM — instant endgame crafting bench!', notes: 'Often cheaper than grinding T3 Scrap after Day 1.' },
    { id: 'player_elec_furnace', shopType: 'player', monument: 'Player Shop', monumentId: 'player_vending', vendor: 'Progression / BP Seller', category: 'progression', meta: true, bestToBuy: true, tierRank: 'S', drone: true, buyItem: 'Electric Furnace', buyQty: 1, payItem: 'Sulfur', payQty: 150, fairMin: 80, fairMax: 220, ripOffAt: 350, altPriceHint: 'or 35–50 Scrap', whyBest: 'Fast no-wood smelting + zero smoke signature inside a 1×1 or 2×2.', notes: 'Buy 1 to research (75 Scrap) or multiple to skip tech tree.' },
    { id: 'player_large_furnace', shopType: 'player', monument: 'Player Shop', monumentId: 'player_vending', vendor: 'Progression / BP Seller', category: 'progression', meta: false, bestToBuy: false, tierRank: 'A', drone: true, buyItem: 'Large Furnace', buyQty: 1, payItem: 'Sulfur', payQty: 200, fairMin: 120, fairMax: 300, ripOffAt: 450, altPriceHint: 'or 50 Scrap', notes: 'Saves 500 Wood + 200 Stone + 75 LGF crafting cost (still makes lots of Charcoal!).' },

    { id: 'player_garage_door', shopType: 'player', monument: 'Player Shop', monumentId: 'player_vending', vendor: 'Base & Defense Seller', category: 'defense', meta: true, bestToBuy: true, tierRank: 'S', drone: true, buyItem: 'Garage Door', buyQty: 1, payItem: 'Sulfur', payQty: 300, fairMin: 150, fairMax: 400, ripOffAt: 600, altPriceHint: 'or 75–120 Scrap', whyBest: 'Skips 600+ Scrap of T2 tech-tree tax — buy 1 to research (125 Scrap) or secure core immediately!', notes: 'Must-buy on Day 1 before logging off.' },
    { id: 'player_auto_turret', shopType: 'player', monument: 'Player Shop', monumentId: 'player_vending', vendor: 'Base & Defense Seller', category: 'defense', meta: true, bestToBuy: true, tierRank: 'S', drone: true, buyItem: 'Auto Turret', buyQty: 1, payItem: 'Sulfur', payQty: 750, fairMin: 500, fairMax: 900, ripOffAt: 1300, altPriceHint: 'or 250–325 Scrap', whyBest: 'Way cheaper than 400 Scrap at Outpost — 2.5 Sulfur nodes for instant raid defense.', notes: 'Check turret + Python/Bolt bundle shops too.' },
    { id: 'player_armored_double_door', shopType: 'player', monument: 'Player Shop', monumentId: 'player_vending', vendor: 'Base & Defense Seller', category: 'defense', meta: false, bestToBuy: false, tierRank: 'A', drone: true, buyItem: 'Armored Double Door', buyQty: 1, payItem: 'Sulfur', payQty: 800, fairMin: 500, fairMax: 1000, ripOffAt: 1400, altPriceHint: 'or 250 Scrap / 25 HQM', notes: 'Saves 25 HQM + 5 Gears + T3 BP for bunker/TC airlock.' },
    { id: 'player_window_glass', shopType: 'player', monument: 'Player Shop', monumentId: 'player_vending', vendor: 'Base & Defense Seller', category: 'defense', meta: false, bestToBuy: false, tierRank: 'A', drone: true, buyItem: 'Strengthened Glass Window', buyQty: 1, payItem: 'Sulfur', payQty: 150, fairMin: 80, fairMax: 200, ripOffAt: 350, altPriceHint: 'or 30–50 Scrap', notes: 'Quick loot-room/peeks upgrade without spending HQM.' },

    { id: 'player_sar', shopType: 'player', monument: 'Player Shop', monumentId: 'player_vending', vendor: 'Gun / Roam Crafter', category: 'weapons', meta: true, bestToBuy: true, tierRank: 'S', drone: true, buyItem: 'Semi-Automatic Rifle (SAR)', buyQty: 1, payItem: 'Sulfur', payQty: 300, fairMin: 200, fairMax: 400, ripOffAt: 600, altPriceHint: 'or 75–125 Scrap', whyBest: '1 Sulfur node for the best all-round T2 rifle to research (125 Scrap) or roam immediately.', notes: 'Highest value gun purchase for solos/duos early wipe.' },
    { id: 'player_thompson', shopType: 'player', monument: 'Player Shop', monumentId: 'player_vending', vendor: 'Gun / Roam Crafter', category: 'weapons', meta: true, bestToBuy: true, tierRank: 'S', drone: true, buyItem: 'Thompson', buyQty: 1, payItem: 'Sulfur', payQty: 350, fairMin: 200, fairMax: 450, ripOffAt: 650, altPriceHint: 'or 90–140 Scrap', whyBest: 'Top T2 SMG for Oil Rig / Mil Tunnels — saves SMG Body + 350+ tech tree Scrap.', notes: 'Pair with Holo Sight or iron sights to snowball rigs.' },
    { id: 'player_ak', shopType: 'player', monument: 'Player Shop', monumentId: 'player_vending', vendor: 'Gun / Roam Crafter', category: 'weapons', meta: true, bestToBuy: true, tierRank: 'S', drone: true, buyItem: 'Assault Rifle (AK)', buyQty: 1, payItem: 'Sulfur', payQty: 1200, fairMin: 800, fairMax: 1500, ripOffAt: 2000, altPriceHint: 'or 350–500 Scrap', whyBest: '4 Sulfur nodes for an endgame AK (saves 50 HQM + Rifle Body + T3 Workbench)!', notes: 'Research (500 Scrap) or take straight to Bradley/Oil counters.' },
    { id: 'player_custom_smg', shopType: 'player', monument: 'Player Shop', monumentId: 'player_vending', vendor: 'Gun / Roam Crafter', category: 'weapons', meta: false, bestToBuy: false, tierRank: 'A', drone: true, buyItem: 'Custom SMG', buyQty: 1, payItem: 'Sulfur', payQty: 250, fairMin: 150, fairMax: 350, ripOffAt: 500, altPriceHint: 'or 60–90 Scrap', notes: 'Budget CQB T2 SMG for Silo/Tunnels.' },
    { id: 'player_python', shopType: 'player', monument: 'Player Shop', monumentId: 'player_vending', vendor: 'Gun / Roam Crafter', category: 'weapons', meta: false, bestToBuy: false, tierRank: 'A', drone: true, buyItem: 'Python Revolver', buyQty: 1, payItem: 'Sulfur', payQty: 250, fairMin: 150, fairMax: 350, ripOffAt: 500, altPriceHint: 'or 60–90 Scrap', notes: 'Great inside Auto Turrets or as a T2 secondary.' },
    { id: 'player_mp5', shopType: 'player', monument: 'Player Shop', monumentId: 'player_vending', vendor: 'Gun / Roam Crafter', category: 'weapons', meta: false, bestToBuy: false, tierRank: 'A', drone: true, buyItem: 'MP5A4', buyQty: 1, payItem: 'Sulfur', payQty: 600, fairMin: 400, fairMax: 750, ripOffAt: 1000, altPriceHint: 'or 175–250 Scrap', notes: 'Affordable T3 SMG saving 35 HQM + SMG Body.' },
    { id: 'player_bolty', shopType: 'player', monument: 'Player Shop', monumentId: 'player_vending', vendor: 'Gun / Roam Crafter', category: 'weapons', meta: false, bestToBuy: false, tierRank: 'A', drone: true, buyItem: 'Bolt Action Rifle', buyQty: 1, payItem: 'Sulfur', payQty: 900, fairMin: 600, fairMax: 1100, ripOffAt: 1500, altPriceHint: 'or 250–350 Scrap', notes: 'Roof defense sniper or Bolt Auto Turret setup.' },

    { id: 'player_diesel', shopType: 'player', monument: 'Player Shop', monumentId: 'player_vending', vendor: 'Industrial / Fuel Seller', category: 'resources', meta: true, bestToBuy: true, tierRank: 'S', drone: true, buyItem: 'Diesel Fuel Barrel', buyQty: 1, payItem: 'Sulfur', payQty: 300, fairMin: 150, fairMax: 400, ripOffAt: 600, altPriceHint: 'or 60–100 Scrap', whyBest: '1 Diesel yields 2,000 Sulfur Ore (or 100 HQM) at Giant Excavator = +1,700 Sulfur net profit per barrel!', notes: 'Buy every cheap Diesel barrel on the map if Excavator is controllable.' },
    { id: 'player_crude_oil', shopType: 'player', monument: 'Player Shop', monumentId: 'player_vending', vendor: 'Industrial / Fuel Seller', category: 'resources', meta: true, bestToBuy: true, tierRank: 'S', drone: true, buyItem: 'Crude Oil', buyQty: 100, payItem: 'Sulfur', payQty: 300, fairMin: 200, fairMax: 400, ripOffAt: 600, altPriceHint: 'or 50–80 Scrap', whyBest: 'Refines into 300 Low Grade Fuel — enough LGF for 10 Rockets or 5 C4 without hunting barrels!', notes: '3:1 Crude-to-LGF ratio in any Small/Monument Refinery.' },
    { id: 'player_charcoal', shopType: 'player', monument: 'Player Shop', monumentId: 'player_vending', vendor: 'Industrial / Fuel Seller', category: 'resources', meta: true, bestToBuy: true, tierRank: 'S', drone: true, buyItem: 'Charcoal', buyQty: 1500, payItem: 'Sulfur', payQty: 250, fairMin: 150, fairMax: 350, ripOffAt: 500, altPriceHint: 'or 40–70 Scrap', whyBest: 'Electric Furnaces make 0 Charcoal — 250 Sulfur buys enough Charcoal to turn 1,000 Sulfur into 500 GP immediately!', notes: 'Saves full wood chopping runs before raids.' },

    { id: 'player_explo_ammo', shopType: 'player', monument: 'Player Shop', monumentId: 'player_vending', vendor: 'Raid & Boom Dealer', category: 'raid', meta: true, bestToBuy: true, tierRank: 'S', drone: true, buyItem: 'Explosive 5.56 Ammo', buyQty: 64, payItem: 'Sulfur', payQty: 1800, fairMin: 1600, fairMax: 2000, ripOffAt: 2400, altPriceHint: 'Craft cost: 1,600 Sulfur', whyBest: 'Raid Sheet Metal Doors (63 rounds) on Tier 2 without needing a 1,250-Scrap T3 Workbench!', notes: 'Small 10–15% convenience tax over raw craft sulfur.' },
    { id: 'player_satchel', shopType: 'player', monument: 'Player Shop', monumentId: 'player_vending', vendor: 'Raid & Boom Dealer', category: 'raid', meta: false, bestToBuy: false, tierRank: 'A', drone: true, buyItem: 'Satchel Charge', buyQty: 1, payItem: 'Sulfur', payQty: 600, fairMin: 480, fairMax: 650, ripOffAt: 800, altPriceHint: 'Craft cost: 480 Sulfur', notes: 'Buy when rushing an immediate 4-satchel Sheet Door raid without BP.' },
    { id: 'player_rocket', shopType: 'player', monument: 'Player Shop', monumentId: 'player_vending', vendor: 'Raid & Boom Dealer', category: 'raid', meta: false, bestToBuy: false, tierRank: 'A', drone: true, buyItem: 'Rocket', buyQty: 1, payItem: 'Sulfur', payQty: 1600, fairMin: 1400, fairMax: 1700, ripOffAt: 2000, altPriceHint: 'Craft: 1,400 Sulfur + 100 LGF', notes: 'Saves Tech Trash/Pipes + T3 crafting time; avoid if >=2,000 Sulfur.' },
    { id: 'player_c4', shopType: 'player', monument: 'Player Shop', monumentId: 'player_vending', vendor: 'Raid & Boom Dealer', category: 'raid', meta: false, bestToBuy: false, tierRank: 'A', drone: true, buyItem: 'Timed Explosive Charge (C4)', buyQty: 1, payItem: 'Sulfur', payQty: 2500, fairMin: 2200, fairMax: 2650, ripOffAt: 3100, altPriceHint: 'Craft: 2,200 Sulfur + 2 Tech Trash', notes: 'Worth it around 2,400–2,600 Sulfur if low on Tech Trash.' },

    // Outpost (NPC)
    { id: 'outpost_stone_wood', shopType: 'npc', monument: 'Outpost', monumentId: 'outpost', vendor: 'Resource Exchange', category: 'resources', meta: true, bestToBuy: true, tierRank: 'S', drone: true, buyItem: 'Wood', buyQty: 500, payItem: 'Stone', payQty: 150, whyBest: 'Best Stone→Wood rate in Rust: 1 Stone node (1,000) = 3,333 Wood instantly!', notes: 'Best instant Wood source in Snow/Desert — 1,500 Stone = 5,000 Wood.' },
    { id: 'outpost_scrap_stone', shopType: 'npc', monument: 'Outpost', monumentId: 'outpost', vendor: 'Resource Exchange', category: 'resources', meta: false, bestToBuy: false, tierRank: 'B', drone: true, buyItem: 'Stone', buyQty: 1000, payItem: 'Scrap', payQty: 40, notes: 'Quick starter Stone without node farming.' },
    { id: 'outpost_scrap_wood', shopType: 'npc', monument: 'Outpost', monumentId: 'outpost', vendor: 'Resource Exchange', category: 'resources', meta: false, bestToBuy: false, tierRank: 'B', drone: true, buyItem: 'Wood', buyQty: 1000, payItem: 'Scrap', payQty: 20, notes: 'Direct Scrap to Wood trade.' },
    { id: 'outpost_scrap_metal', shopType: 'npc', monument: 'Outpost', monumentId: 'outpost', vendor: 'Resource Exchange', category: 'resources', meta: false, bestToBuy: false, tierRank: 'B', drone: true, buyItem: 'Metal Fragments', buyQty: 250, payItem: 'Scrap', payQty: 25, notes: 'Fast Metal Frags for early Sheet Metal doors.' },
    { id: 'outpost_scrap_lgf', shopType: 'npc', monument: 'Outpost', monumentId: 'outpost', vendor: 'Resource Exchange', category: 'resources', meta: false, bestToBuy: false, tierRank: 'B', drone: true, buyItem: 'Low Grade Fuel', buyQty: 25, payItem: 'Scrap', payQty: 5, notes: 'Quick Fuel for Furnaces, Boat, or Minicopter.' },
    { id: 'outpost_scrap_hqm', shopType: 'npc', monument: 'Outpost', monumentId: 'outpost', vendor: 'Resource Exchange', category: 'resources', meta: false, bestToBuy: false, tierRank: 'B', drone: true, buyItem: 'High Quality Metal', buyQty: 5, payItem: 'Scrap', payQty: 25, notes: 'Quick HQM for T2 Workbench or Armored Doors.' },
    { id: 'outpost_smoke_grenade', shopType: 'npc', monument: 'Outpost', monumentId: 'outpost', vendor: 'Combat / Supply', category: 'recycle', meta: true, bestToBuy: true, tierRank: 'S', drone: true, buyItem: 'Smoke Grenade', buyQty: 1, payItem: 'Scrap', payQty: 5, whyBest: '#1 NPC Scrap→Gunpowder conversion (5.4 GP per Scrap at 60% Monument Recycler)!', notes: 'Top Scrap → Gunpowder loop (~3.6 GP per Scrap at Outpost)!', recycleSafe: '18 Gunpowder + 10 Metal Frags', recycleRad: '27 Gunpowder + 15 Metal Frags', recycleTotals: { safe: { gp: 18, metal: 10 }, rad: { gp: 27, metal: 15 } } },
    { id: 'outpost_tactical_gloves', shopType: 'npc', monument: 'Outpost', monumentId: 'outpost', vendor: 'Outfitters', category: 'recycle', meta: true, bestToBuy: true, tierRank: 'S', drone: true, buyItem: 'Tactical Gloves', buyQty: 1, payItem: 'Scrap', payQty: 40, whyBest: 'Instant 200 Cloth (Safe) or 315 Cloth (Radtown) per 40 Scrap — infinite Syringes/Bags!', notes: 'Fastest Scrap → Cloth conversion via Sewing Kits + Rope.', recycleSafe: '200 Cloth (5× Sewing Kit + 1× Rope)', recycleRad: '315 Cloth (at 60% Radtown)', recycleTotals: { safe: { cloth: 200 }, rad: { cloth: 315 } } },
    { id: 'outpost_solar_panel', shopType: 'npc', monument: 'Outpost', monumentId: 'outpost', vendor: 'Building / Elec', category: 'recycle', meta: true, bestToBuy: false, tierRank: 'A', drone: true, buyItem: 'Large Solar Panel', buyQty: 1, payItem: 'Scrap', payQty: 75, notes: 'Power starter turrets OR recycle into Tech Trash + HQM.', recycleSafe: '2 HQM + 1 Tech Trash', recycleRad: '3 HQM + 1 Tech Trash', recycleTotals: { safe: { hqm: 2, techTrash: 1 }, rad: { hqm: 3, techTrash: 1 } } },
    { id: 'outpost_jackhammer', shopType: 'npc', monument: 'Outpost', monumentId: 'outpost', vendor: 'Tools & Stuff', category: 'tools', meta: true, bestToBuy: true, tierRank: 'S', drone: true, buyItem: 'Jackhammer', buyQty: 1, payItem: 'Scrap', payQty: 150, whyBest: 'Uncraftable farming king — mines Sulfur/Metal 5× faster with free Workbench refills!', notes: 'Uncraftable — best Sulfur/Metal farming tool (free workbench refill).' },
    { id: 'outpost_chainsaw', shopType: 'npc', monument: 'Outpost', monumentId: 'outpost', vendor: 'Tools & Stuff', category: 'tools', meta: false, bestToBuy: false, tierRank: 'A', drone: true, buyItem: 'Chainsaw', buyQty: 1, payItem: 'Scrap', payQty: 125, notes: 'Pair with Pure Wood Tea for instant TC wood & charcoal.' },
    { id: 'outpost_icepick', shopType: 'npc', monument: 'Outpost', monumentId: 'outpost', vendor: 'Tools & Stuff', category: 'tools', meta: false, bestToBuy: false, tierRank: 'B', drone: true, buyItem: 'Salvaged Icepick', buyQty: 1, payItem: 'Scrap', payQty: 30, notes: 'Budget ore mining tool (or soft-side tool).' },
    { id: 'outpost_axe', shopType: 'npc', monument: 'Outpost', monumentId: 'outpost', vendor: 'Tools & Stuff', category: 'tools', meta: false, bestToBuy: false, tierRank: 'B', drone: true, buyItem: 'Salvaged Axe', buyQty: 1, payItem: 'Scrap', payQty: 30, notes: 'Fast early Wood harvesting.' },
    { id: 'outpost_turret', shopType: 'npc', monument: 'Outpost', monumentId: 'outpost', vendor: 'Building / Elec', category: 'defense', meta: true, bestToBuy: false, tierRank: 'A', drone: true, buyItem: 'Auto Turret', buyQty: 1, payItem: 'Scrap', payQty: 400, notes: 'Instant Auto Turret without crafting Tech Trash/CCTV (check Player Shops for cheaper Sulfur deals first).' },
    { id: 'outpost_samsite', shopType: 'npc', monument: 'Outpost', monumentId: 'outpost', vendor: 'Building / Elec', category: 'defense', meta: false, bestToBuy: false, tierRank: 'B', drone: true, buyItem: 'SAM Site', buyQty: 1, payItem: 'Scrap', payQty: 500, notes: 'Base anti-air defense (plus ammo sold nearby).' },
    { id: 'outpost_battery_large', shopType: 'npc', monument: 'Outpost', monumentId: 'outpost', vendor: 'Building / Elec', category: 'defense', meta: false, bestToBuy: false, tierRank: 'A', drone: true, buyItem: 'Large Rechargeable Battery', buyQty: 1, payItem: 'Scrap', payQty: 75, notes: '100 rWm output for multi-turret & industrial systems.' },
    { id: 'outpost_battery_med', shopType: 'npc', monument: 'Outpost', monumentId: 'outpost', vendor: 'Building / Elec', category: 'defense', meta: false, bestToBuy: false, tierRank: 'B', drone: true, buyItem: 'Medium Rechargeable Battery', buyQty: 1, payItem: 'Scrap', payQty: 40, notes: '50 rWm output for lights, furnaces, and 4 turrets.' },
    { id: 'outpost_seismic_sensor', shopType: 'npc', monument: 'Outpost', monumentId: 'outpost', vendor: 'Building / Elec', category: 'defense', meta: false, bestToBuy: false, tierRank: 'B', drone: true, buyItem: 'Seismic Sensor', buyQty: 1, payItem: 'Scrap', payQty: 50, notes: 'Triggers raid alarms when explosions hit near base.' },
    { id: 'outpost_revolver', shopType: 'npc', monument: 'Outpost', monumentId: 'outpost', vendor: 'Weapons', category: 'weapons', meta: false, bestToBuy: false, tierRank: 'B', drone: true, buyItem: 'Revolver', buyQty: 1, payItem: 'Scrap', payQty: 200, notes: 'Instant early-wipe pistol + Blueprint research.' },
    { id: 'outpost_db', shopType: 'npc', monument: 'Outpost', monumentId: 'outpost', vendor: 'Weapons', category: 'weapons', meta: false, bestToBuy: false, tierRank: 'B', drone: true, buyItem: 'Double Barrel Shotgun', buyQty: 1, payItem: 'Scrap', payQty: 250, notes: 'Close-quarters oil rig / bunker defense.' },

    // Bandit Camp (NPC)
    { id: 'bandit_fertilizer', shopType: 'npc', monument: 'Bandit Camp', monumentId: 'bandit_camp', vendor: 'Produce Exchange', category: 'recycle', meta: true, bestToBuy: true, tierRank: 'S', drone: false, buyItem: 'Scrap', buyQty: 3, payItem: 'Fertilizer', payQty: 2, whyBest: 'Turn Horse Dung/Compost into effortless Safe-Zone Scrap (100 Fertilizer = 150 Scrap)!', notes: '100 Fertilizer = 150 Scrap! Best passive horse-dung income.' },
    { id: 'bandit_f1_grenade', shopType: 'npc', monument: 'Bandit Camp', monumentId: 'bandit_camp', vendor: 'Black Market', category: 'recycle', meta: true, bestToBuy: true, tierRank: 'S', drone: true, buyItem: 'F1 Grenade', buyQty: 1, payItem: 'Scrap', payQty: 8, whyBest: 'High-stock Scrap→Gunpowder conversion AND lethal for clearing Heavy Scientists on Oil Rig!', notes: 'Cheap Scrap → Gunpowder loop OR eco-raid/Oil Rig heavies.', recycleSafe: '15 Gunpowder + 10 Metal Frags', recycleRad: '23 Gunpowder + 15 Metal Frags', recycleTotals: { safe: { gp: 15, metal: 10 }, rad: { gp: 23, metal: 15 } } },
    { id: 'bandit_lr300', shopType: 'npc', monument: 'Bandit Camp', monumentId: 'bandit_camp', vendor: 'Black Market', category: 'weapons', meta: true, bestToBuy: false, tierRank: 'A', drone: true, buyItem: 'LR-300 Assault Rifle', buyQty: 1, payItem: 'Scrap', payQty: 500, notes: 'Zero-BP military-grade 5.56 AR ready for Oil Rig / Silo.' },
    { id: 'bandit_m39', shopType: 'npc', monument: 'Bandit Camp', monumentId: 'bandit_camp', vendor: 'Black Market', category: 'weapons', meta: false, bestToBuy: false, tierRank: 'B', drone: true, buyItem: 'M39 Rifle', buyQty: 1, payItem: 'Scrap', payQty: 400, notes: 'Semi-auto military marksman rifle.' },
    { id: 'bandit_spas12', shopType: 'npc', monument: 'Bandit Camp', monumentId: 'bandit_camp', vendor: 'Black Market', category: 'weapons', meta: false, bestToBuy: false, tierRank: 'B', drone: true, buyItem: 'Spas-12 Shotgun', buyQty: 1, payItem: 'Scrap', payQty: 250, notes: 'Rapid semi-auto 12-gauge shotgun.' },
    { id: 'bandit_m92', shopType: 'npc', monument: 'Bandit Camp', monumentId: 'bandit_camp', vendor: 'Black Market', category: 'weapons', meta: false, bestToBuy: false, tierRank: 'B', drone: true, buyItem: 'M92 Pistol', buyQty: 1, payItem: 'Scrap', payQty: 250, notes: '15-round high-rate military pistol.' },
    { id: 'bandit_16x', shopType: 'npc', monument: 'Bandit Camp', monumentId: 'bandit_camp', vendor: 'Black Market', category: 'weapons', meta: false, bestToBuy: false, tierRank: 'B', drone: true, buyItem: '16x Zoom Scope', buyQty: 1, payItem: 'Scrap', payQty: 300, notes: 'Long-range L96 / Bolty optic.' },
    { id: 'bandit_heavy_helmet', shopType: 'npc', monument: 'Bandit Camp', monumentId: 'bandit_camp', vendor: 'Black Market', category: 'defense', meta: false, bestToBuy: false, tierRank: 'B', drone: true, buyItem: 'Heavy Plate Helmet', buyQty: 1, payItem: 'Scrap', payQty: 150, notes: 'Top base-defense helmet.' },
    { id: 'bandit_minicopter', shopType: 'npc', monument: 'Bandit Camp', monumentId: 'bandit_camp', vendor: 'Airwolf Heli Vendor', category: 'vehicles', meta: true, bestToBuy: true, tierRank: 'S', drone: false, buyItem: 'Minicopter', buyQty: 1, payItem: 'Scrap', payQty: 750, whyBest: 'Unlocks instant Dome/Launch puzzle skips, Cargo counters, and fast Safe-Zone drone loot runs!', notes: 'Spawns on Airwolf pad with 100 Low Grade Fuel.' },
    { id: 'bandit_scrap_heli', shopType: 'npc', monument: 'Bandit Camp', monumentId: 'bandit_camp', vendor: 'Airwolf Heli Vendor', category: 'vehicles', meta: false, bestToBuy: false, tierRank: 'A', drone: false, buyItem: 'Scrap Transport Helicopter', buyQty: 1, payItem: 'Scrap', payQty: 1250, notes: 'Full squad transport / raid counter heli.' },
    { id: 'bandit_attack_heli', shopType: 'npc', monument: 'Bandit Camp', monumentId: 'bandit_camp', vendor: 'Airwolf Heli Vendor', category: 'vehicles', meta: false, bestToBuy: false, tierRank: 'B', drone: false, buyItem: 'Attack Helicopter', buyQty: 1, payItem: 'Scrap', payQty: 2250, notes: '2-seat rocket & turret gunship.' },
    { id: 'bandit_balloon', shopType: 'npc', monument: 'Bandit Camp', monumentId: 'bandit_camp', vendor: 'Airwolf Heli Vendor', category: 'vehicles', meta: false, bestToBuy: false, tierRank: 'B', drone: false, buyItem: 'Hot Air Balloon', buyQty: 1, payItem: 'Scrap', payQty: 150, notes: 'Cheap Dome / Launch roof drop transport.' },

    // Fishing Village (NPC)
    { id: 'fish_rowboat', shopType: 'npc', monument: 'Fishing Village', monumentId: 'fishing_village', vendor: 'Boat Vendor', category: 'vehicles', meta: false, bestToBuy: false, tierRank: 'A', drone: false, buyItem: 'Rowboat', buyQty: 1, payItem: 'Scrap', payQty: 125, notes: 'Fast early Oil Rig & Cargo boat.' },
    { id: 'fish_rhib', shopType: 'npc', monument: 'Fishing Village', monumentId: 'fishing_village', vendor: 'Boat Vendor', category: 'vehicles', meta: false, bestToBuy: false, tierRank: 'A', drone: false, buyItem: 'RHIB (Military Boat)', buyQty: 1, payItem: 'Scrap', payQty: 300, notes: 'High-speed boat for Deep Sea / Cargo counters.' },
    { id: 'fish_sub_solo', shopType: 'npc', monument: 'Fishing Village', monumentId: 'fishing_village', vendor: 'Boat Vendor', category: 'vehicles', meta: true, bestToBuy: true, tierRank: 'S', drone: false, buyItem: 'Solo Submarine', buyQty: 1, payItem: 'Scrap', payQty: 200, whyBest: 'Pays for itself in 1 safe Underwater Labs run (500+ Scrap & comps with minimal PvP risk)!', notes: 'Stealth Underwater Labs farming + torpedoes vs boats.' },
    { id: 'fish_sub_duo', shopType: 'npc', monument: 'Fishing Village', monumentId: 'fishing_village', vendor: 'Boat Vendor', category: 'vehicles', meta: false, bestToBuy: false, tierRank: 'A', drone: false, buyItem: 'Duo Submarine', buyQty: 1, payItem: 'Scrap', payQty: 300, notes: '2-player submarine for Labs & torpedo counters.' },
    { id: 'fish_kayak', shopType: 'npc', monument: 'Fishing Village', monumentId: 'fishing_village', vendor: 'Boat Vendor', category: 'vehicles', meta: false, bestToBuy: false, tierRank: 'B', drone: false, buyItem: 'Kayak', buyQty: 1, payItem: 'Scrap', payQty: 50, notes: 'Low-noise coastal travel (Dynamic vendor price ~25–100).' },
    { id: 'fish_rod', shopType: 'npc', monument: 'Fishing Village', monumentId: 'fishing_village', vendor: 'Fishing Supplies', category: 'tools', meta: false, bestToBuy: false, tierRank: 'B', drone: true, buyItem: 'Handmade Fishing Rod', buyQty: 1, payItem: 'Scrap', payQty: 80, notes: 'Cheaper to craft (200 Wood + 2 Rope) if near coast.' },
    { id: 'fish_diving_tank', shopType: 'npc', monument: 'Fishing Village', monumentId: 'fishing_village', vendor: 'Diving Gear', category: 'tools', meta: false, bestToBuy: false, tierRank: 'A', drone: true, buyItem: 'Diving Tank', buyQty: 1, payItem: 'Scrap', payQty: 25, notes: '10m underwater air for Underwater Labs & sunken wrecks.' },
    { id: 'fish_shark_sell', shopType: 'npc', monument: 'Fishing Village', monumentId: 'fishing_village', vendor: 'Fish Exchange', category: 'recycle', meta: true, bestToBuy: true, tierRank: 'S', drone: false, buyItem: 'Scrap', buyQty: 45, payItem: 'Small Shark', payQty: 1, whyBest: 'Safest 400–600 Scrap/hr solo wipe starter directly inside Fishing Village safe zone!', notes: 'Gut smaller fish for Trout/Salmon bait → catch Sharks for Scrap + Blue Card quest.' },

    // Ranch / Large Barn (NPC)
    { id: 'ranch_horse', shopType: 'npc', monument: 'Ranch / Barn', monumentId: 'ranch', vendor: 'Stables Vendor', category: 'vehicles', meta: true, bestToBuy: true, tierRank: 'S', drone: false, buyItem: 'Saddled Horse', buyQty: 1, payItem: 'Scrap', payQty: 100, whyBest: 'Best budget early transport + generates Horse Dung for safe Bandit Scrap loops!', notes: '75 Scrap unsaddled — fast roam travel + Horse Dung for Fertilizer.' },
    { id: 'ranch_saddlebag', shopType: 'npc', monument: 'Ranch / Barn', monumentId: 'ranch', vendor: 'Stables Vendor', category: 'tools', meta: false, bestToBuy: false, tierRank: 'B', drone: true, buyItem: 'Saddle Bag', buyQty: 1, payItem: 'Scrap', payQty: 25, notes: 'Adds mobile storage slots to your horse.' },
    { id: 'ranch_horseshoes', shopType: 'npc', monument: 'Ranch / Barn', monumentId: 'ranch', vendor: 'Stables Vendor', category: 'tools', meta: false, bestToBuy: false, tierRank: 'B', drone: true, buyItem: 'High Quality Horseshoes', buyQty: 1, payItem: 'Scrap', payQty: 50, notes: 'Boosts horse sprint speed across the map.' },
    { id: 'ranch_rose_sell', shopType: 'npc', monument: 'Ranch / Barn', monumentId: 'ranch', vendor: 'Flower Exchange', category: 'recycle', meta: false, bestToBuy: false, tierRank: 'B', drone: false, buyItem: 'Scrap', buyQty: 12, payItem: 'Rose', payQty: 1, notes: 'Trade cultivated Roses/Sunflowers/Orchids for passive Scrap.' },

    // Water Well (NPC)
    { id: 'well_jackhammer', shopType: 'npc', monument: 'Water Well', monumentId: 'water_well', vendor: 'Water Well Shopkeeper', category: 'tools', meta: true, bestToBuy: false, tierRank: 'A', drone: false, buyItem: 'Jackhammer (Rotating)', buyQty: 1, payItem: 'Scrap', payQty: 200, notes: 'Stock rotates ~30m (no Safe Zone turrets — watch your back!).' },
    { id: 'well_syringe', shopType: 'npc', monument: 'Water Well', monumentId: 'water_well', vendor: 'Water Well Shopkeeper', category: 'tools', meta: false, bestToBuy: false, tierRank: 'A', drone: false, buyItem: 'Medical Syringe', buyQty: 1, payItem: 'Scrap', payQty: 15, notes: 'Researchable early wipe without T2 Workbench.' },
    { id: 'well_ore_tea', shopType: 'npc', monument: 'Water Well', monumentId: 'water_well', vendor: 'Water Well Shopkeeper', category: 'teas', meta: true, bestToBuy: true, tierRank: 'S', drone: false, buyItem: 'Pure / Advanced Ore Tea', buyQty: 1, payItem: 'Scrap', payQty: 65, whyBest: 'Huge Scrap-to-Sulfur multiplier if spotted in rotating Water Well stock!', notes: '+35% to +50% Sulfur/Metal/Stone per node — rotating vendor stock.' }
  ],

  // =========================================================================
  // 8. ELECTRICITY & BATTERY LOAD PLANNER DATA
  // =========================================================================
  electricityDevices: [
    { id: 'auto_turret', name: 'Auto Turret', rwm: 10, defaultQty: 3, category: 'Defense', icon: '🔫' },
    { id: 'sam_site', name: 'SAM Site', rwm: 25, defaultQty: 0, category: 'Defense', icon: '🚀' },
    { id: 'conveyor', name: 'Industrial Conveyor', rwm: 1, defaultQty: 4, category: 'Industrial', icon: '📦' },
    { id: 'crafter', name: 'Industrial Crafter', rwm: 1, defaultQty: 1, category: 'Industrial', icon: '⚙️' },
    { id: 'elec_furnace', name: 'Electric Furnace', rwm: 3, defaultQty: 6, category: 'Industrial', icon: '🔥' },
    { id: 'ceiling_light', name: 'Ceiling Light', rwm: 2, defaultQty: 4, category: 'Utility', icon: '💡' },
    { id: 'industrial_light', name: 'Industrial Wall Light', rwm: 1, defaultQty: 2, category: 'Utility', icon: '🚨' },
    { id: 'door_controller', name: 'Door Controller', rwm: 1, defaultQty: 2, category: 'Utility', icon: '🚪' },
    { id: 'seismic_sensor', name: 'Seismic Sensor', rwm: 1, defaultQty: 1, category: 'Rust+', icon: '📡' },
    { id: 'hbhf_sensor', name: 'HBHF Sensor', rwm: 1, defaultQty: 1, category: 'Rust+', icon: '👁️' },
    { id: 'smart_switch', name: 'Smart Switch', rwm: 1, defaultQty: 2, category: 'Rust+', icon: '⚡' },
    { id: 'smart_alarm', name: 'Smart Alarm', rwm: 1, defaultQty: 1, category: 'Rust+', icon: '🔔' },
    { id: 'storage_monitor', name: 'Storage Monitor (TC)', rwm: 1, defaultQty: 1, category: 'Rust+', icon: '🏛️' },
    { id: 'rf_broadcaster', name: 'RF Broadcaster / Receiver', rwm: 1, defaultQty: 0, category: 'Rust+', icon: '📻' },
    { id: 'searchlight', name: 'Search Light', rwm: 10, defaultQty: 0, category: 'Defense', icon: '🔦' },
    { id: 'tesla_coil', name: 'Tesla Coil (Trap)', rwm: 35, defaultQty: 0, category: 'Defense', icon: '⚡' }
  ],

  batterySpecs: {
    large: { id: 'large', name: 'Large Rechargeable Battery', maxOutRwm: 100, capacityRwMin: 24000, chargeEfficiency: 0.8 },
    medium: { id: 'medium', name: 'Medium Rechargeable Battery', maxOutRwm: 50, capacityRwMin: 9000, chargeEfficiency: 0.8 },
    small: { id: 'small', name: 'Small Rechargeable Battery', maxOutRwm: 10, capacityRwMin: 150, chargeEfficiency: 0.8 }
  },

  // =========================================================================
  // 9. INDUSTRIAL CONVEYOR FILTER PRESETS & ITEM CATALOG (Rust Shift+Paste)
  // =========================================================================
  conveyorCategoryIds: {
    Weapon: 0,
    Weapons: 0,
    Construction: 1,
    Items: 2,
    Resources: 3,
    Attire: 4,
    Tool: 5,
    Tools: 5,
    Medical: 6,
    Food: 7,
    Ammunition: 8,
    Traps: 9,
    Misc: 10,
    All: 11,
    Common: 12,
    Component: 13,
    Components: 13,
    Electrical: 16,
    Fun: 17
  },

  conveyorItemsCatalog: [
    { name: 'Sulfur Ore', shortname: 'sulfur.ore', cat: 'Ores & Mats', defaultMax: 0, defaultMin: 0, defaultBuf: 0 },
    { name: 'Sulfur', shortname: 'sulfur', cat: 'Ores & Mats', defaultMax: 0, defaultMin: 0, defaultBuf: 0 },
    { name: 'Metal Ore', shortname: 'metal.ore', cat: 'Ores & Mats', defaultMax: 0, defaultMin: 0, defaultBuf: 0 },
    { name: 'Metal Fragments', shortname: 'metal.fragments', cat: 'Ores & Mats', defaultMax: 5000, defaultMin: 0, defaultBuf: 0 },
    { name: 'High Quality Metal Ore', shortname: 'hq.metal.ore', cat: 'Ores & Mats', defaultMax: 0, defaultMin: 0, defaultBuf: 0 },
    { name: 'High Quality Metal', shortname: 'metal.refined', cat: 'Ores & Mats', defaultMax: 500, defaultMin: 0, defaultBuf: 0 },
    { name: 'Stones', shortname: 'stones', cat: 'Ores & Mats', defaultMax: 10000, defaultMin: 0, defaultBuf: 0 },
    { name: 'Wood', shortname: 'wood', cat: 'Ores & Mats', defaultMax: 5000, defaultMin: 0, defaultBuf: 0 },
    { name: 'Charcoal', shortname: 'charcoal', cat: 'Ores & Mats', defaultMax: 3000, defaultMin: 0, defaultBuf: 0 },
    { name: 'Crude Oil', shortname: 'crude.oil', cat: 'Ores & Mats', defaultMax: 0, defaultMin: 0, defaultBuf: 0 },
    { name: 'Low Grade Fuel', shortname: 'lowgradefuel', cat: 'Ores & Mats', defaultMax: 500, defaultMin: 0, defaultBuf: 0 },
    { name: 'Scrap', shortname: 'scrap', cat: 'Components', defaultMax: 0, defaultMin: 0, defaultBuf: 0 },
    { name: 'Cloth', shortname: 'cloth', cat: 'Ores & Mats', defaultMax: 1000, defaultMin: 0, defaultBuf: 0 },
    { name: 'Leather', shortname: 'leather', cat: 'Ores & Mats', defaultMax: 500, defaultMin: 0, defaultBuf: 0 },
    { name: 'Gun Powder', shortname: 'gunpowder', cat: 'Boom', defaultMax: 0, defaultMin: 0, defaultBuf: 0 },
    { name: 'Explosives', shortname: 'explosives', cat: 'Boom', defaultMax: 0, defaultMin: 0, defaultBuf: 0 },
    { name: 'Rocket', shortname: 'ammo.rocket.basic', cat: 'Boom', defaultMax: 0, defaultMin: 0, defaultBuf: 0 },
    { name: 'HV Rocket', shortname: 'ammo.rocket.hv', cat: 'Boom', defaultMax: 0, defaultMin: 0, defaultBuf: 0 },
    { name: 'Incendiary Rocket', shortname: 'ammo.rocket.fire', cat: 'Boom', defaultMax: 0, defaultMin: 0, defaultBuf: 0 },
    { name: 'Timed Explosive Charge', shortname: 'explosive.timed', cat: 'Boom', defaultMax: 0, defaultMin: 0, defaultBuf: 0 },
    { name: 'Satchel Charge', shortname: 'explosive.satchel', cat: 'Boom', defaultMax: 0, defaultMin: 0, defaultBuf: 0 },
    { name: '5.56 Rifle Ammo', shortname: 'ammo.rifle', cat: 'Ammo & Meds', defaultMax: 384, defaultMin: 0, defaultBuf: 0 },
    { name: 'Incendiary 5.56 Rifle Ammo', shortname: 'ammo.rifle.incendiary', cat: 'Ammo & Meds', defaultMax: 128, defaultMin: 0, defaultBuf: 0 },
    { name: 'Explosive 5.56 Rifle Ammo', shortname: 'ammo.rifle.explosive', cat: 'Boom', defaultMax: 0, defaultMin: 0, defaultBuf: 0 },
    { name: 'Pistol Bullet', shortname: 'ammo.pistol', cat: 'Ammo & Meds', defaultMax: 256, defaultMin: 0, defaultBuf: 0 },
    { name: '12 Gauge Buckshot', shortname: 'ammo.shotgun', cat: 'Ammo & Meds', defaultMax: 64, defaultMin: 0, defaultBuf: 0 },
    { name: 'Medical Syringe', shortname: 'syringe.medical', cat: 'Ammo & Meds', defaultMax: 4, defaultMin: 0, defaultBuf: 0 },
    { name: 'Bandage', shortname: 'bandage', cat: 'Ammo & Meds', defaultMax: 3, defaultMin: 0, defaultBuf: 0 },
    { name: 'Assault Rifle', shortname: 'rifle.ak', cat: 'Weapons', defaultMax: 1, defaultMin: 0, defaultBuf: 0 },
    { name: 'LR-300 Assault Rifle', shortname: 'rifle.lr300', cat: 'Weapons', defaultMax: 1, defaultMin: 0, defaultBuf: 0 },
    { name: 'MP5A4', shortname: 'smg.mp5', cat: 'Weapons', defaultMax: 1, defaultMin: 0, defaultBuf: 0 },
    { name: 'Thompson', shortname: 'smg.thompson', cat: 'Weapons', defaultMax: 1, defaultMin: 0, defaultBuf: 0 },
    { name: 'Custom SMG', shortname: 'smg.2', cat: 'Weapons', defaultMax: 1, defaultMin: 0, defaultBuf: 0 },
    { name: 'Semi-Automatic Rifle', shortname: 'rifle.semiauto', cat: 'Weapons', defaultMax: 1, defaultMin: 0, defaultBuf: 0 },
    { name: 'Bolt Action Rifle', shortname: 'rifle.bolt', cat: 'Weapons', defaultMax: 1, defaultMin: 0, defaultBuf: 0 },
    { name: 'L96 Rifle', shortname: 'rifle.l96', cat: 'Weapons', defaultMax: 1, defaultMin: 0, defaultBuf: 0 },
    { name: 'Python Revolver', shortname: 'pistol.python', cat: 'Weapons', defaultMax: 1, defaultMin: 0, defaultBuf: 0 },
    { name: 'Metal Facemask', shortname: 'metal.facemask', cat: 'Armor', defaultMax: 1, defaultMin: 0, defaultBuf: 0 },
    { name: 'Metal Chest Plate', shortname: 'metal.plate.torso', cat: 'Armor', defaultMax: 1, defaultMin: 0, defaultBuf: 0 },
    { name: 'Road Sign Jacket', shortname: 'roadsign.jacket', cat: 'Armor', defaultMax: 1, defaultMin: 0, defaultBuf: 0 },
    { name: 'Road Sign Kilt', shortname: 'roadsign.kilt', cat: 'Armor', defaultMax: 1, defaultMin: 0, defaultBuf: 0 },
    { name: 'Hazmat Suit', shortname: 'hazmatsuit', cat: 'Armor', defaultMax: 1, defaultMin: 0, defaultBuf: 0 },
    { name: 'Jackhammer', shortname: 'jackhammer', cat: 'Tools & Elec', defaultMax: 1, defaultMin: 0, defaultBuf: 0 },
    { name: 'Auto Turret', shortname: 'autoturret', cat: 'Tools & Elec', defaultMax: 0, defaultMin: 0, defaultBuf: 0 },
    { name: 'Garage Door', shortname: 'wall.frame.garagedoor', cat: 'Tools & Elec', defaultMax: 0, defaultMin: 0, defaultBuf: 0 },
    { name: 'Tech Trash', shortname: 'techparts', cat: 'Components', defaultMax: 0, defaultMin: 0, defaultBuf: 0 },
    { name: 'Metal Pipe', shortname: 'metalpipe', cat: 'Components', defaultMax: 0, defaultMin: 0, defaultBuf: 0 },
    { name: 'Metal Spring', shortname: 'metalspring', cat: 'Components', defaultMax: 0, defaultMin: 0, defaultBuf: 0 },
    { name: 'Gears', shortname: 'gears', cat: 'Components', defaultMax: 0, defaultMin: 0, defaultBuf: 0 },
    { name: 'Sewing Kit', shortname: 'sewingkit', cat: 'Components', defaultMax: 0, defaultMin: 0, defaultBuf: 0 },
    { name: 'Rifle Body', shortname: 'riflebody', cat: 'Components', defaultMax: 0, defaultMin: 0, defaultBuf: 0 },
    { name: 'SMG Body', shortname: 'smgbody', cat: 'Components', defaultMax: 0, defaultMin: 0, defaultBuf: 0 },
    { name: 'Blue Berry', shortname: 'blue.berry', cat: 'Teas', defaultMax: 40, defaultMin: 0, defaultBuf: 0 },
    { name: 'Yellow Berry', shortname: 'yellow.berry', cat: 'Teas', defaultMax: 40, defaultMin: 0, defaultBuf: 0 },
    { name: 'Red Berry', shortname: 'red.berry', cat: 'Teas', defaultMax: 40, defaultMin: 0, defaultBuf: 0 },
    { name: 'White Berry', shortname: 'white.berry', cat: 'Teas', defaultMax: 40, defaultMin: 0, defaultBuf: 0 },
    { name: 'Pure Ore Tea', shortname: 'oretea.pure', cat: 'Teas', defaultMax: 0, defaultMin: 0, defaultBuf: 0 },
    { name: 'Pure Scrap Tea', shortname: 'scraptea.pure', cat: 'Teas', defaultMax: 0, defaultMin: 0, defaultBuf: 0 },
    { name: 'Pure Wood Tea', shortname: 'woodtea.pure', cat: 'Teas', defaultMax: 0, defaultMin: 0, defaultBuf: 0 },
    { name: 'Pure Max Health Tea', shortname: 'maxhealthtea.pure', cat: 'Teas', defaultMax: 0, defaultMin: 0, defaultBuf: 0 }
  ],

  conveyorPresets: [
    {
      id: 'depot_sorter',
      name: '📥 Drop-Box Depot Auto-Sorter',
      category: 'Sorting',
      powerRwm: 6,
      conveyorsCount: 6,
      mode: 'Require Any (OR)',
      summary: 'Dump all roam loot in Drop Boxes → Industrial Combiner → Splitter → 5 category Conveyors + 1 Overflow.',
      proTips: [
        'Always add a 6th Conveyor with NO filter on low priority (or splitter fallback) so unsorted junk never clogs the Drop Box.',
        'Use Category Filters ("Weapons", "Construction", "Items", "Resources", "Component", "Ammunition") when you want 1 slot to cover 50+ items without hitting the 12-filter cap!'
      ],
      conveyors: [
        {
          label: 'Conveyor 1 → Ores & Mats Box',
          filters: [
            { item: 'Sulfur Ore', min: 0, max: 0, buf: 0 },
            { item: 'Metal Ore', min: 0, max: 0, buf: 0 },
            { item: 'High Quality Metal Ore', min: 0, max: 0, buf: 0 },
            { item: 'Stones', min: 0, max: 0, buf: 0 },
            { item: 'Wood', min: 0, max: 0, buf: 0 },
            { item: 'Low Grade Fuel', min: 0, max: 0, buf: 0 }
          ]
        },
        {
          label: 'Conveyor 2 → Boom & Sulfur Box',
          filters: [
            { item: 'Sulfur', min: 0, max: 0, buf: 0 },
            { item: 'Gun Powder', min: 0, max: 0, buf: 0 },
            { item: 'Charcoal', min: 0, max: 0, buf: 0 },
            { item: 'Explosives', min: 0, max: 0, buf: 0 },
            { item: 'Rocket', min: 0, max: 0, buf: 0 },
            { item: 'Timed Explosive Charge', min: 0, max: 0, buf: 0 }
          ]
        },
        {
          label: 'Conveyor 3 → Comps & Scrap Box',
          filters: [
            { item: 'Category: Component', min: 0, max: 0, buf: 0 },
            { item: 'Scrap', min: 0, max: 0, buf: 0 }
          ]
        },
        {
          label: 'Conveyor 4 → Guns & Ammo Box',
          filters: [
            { item: 'Category: Weapon', min: 0, max: 0, buf: 0 },
            { item: 'Category: Ammunition', min: 0, max: 0, buf: 0 }
          ]
        },
        {
          label: 'Conveyor 5 → Armor & Meds Box',
          filters: [
            { item: 'Category: Attire', min: 0, max: 0, buf: 0 },
            { item: 'Category: Medical', min: 0, max: 0, buf: 0 }
          ]
        },
        {
          label: 'Conveyor 6 → Overflow Misc Box',
          filters: [{ item: '(Blank / No Filter — catches remaining items)', min: 0, max: 0, buf: 0 }]
        }
      ]
    },
    {
      id: 'auto_smelter',
      name: '🔥 Electric Furnace Auto-Smelt Loop',
      category: 'Smelting',
      powerRwm: 20,
      conveyorsCount: 2,
      mode: 'Require Any (OR)',
      summary: 'Ore Box → Conveyor IN → Splitters → 6 Electric Furnaces (3 rWm ea) → Combiners → Conveyor OUT → Ingot/Sulfur Box.',
      proTips: [
        'Leave Min/Max at 0 on Conveyor IN so every open furnace ore slot stays saturated evenly.',
        'Set Buffer = 100 on Conveyor OUT if you want fewer industrial ticks when grabbing cooked Sulf/Metal, or keep Buffer = 0 for instant transfer to Boom/Upkeep pipes.'
      ],
      conveyors: [
        {
          label: 'Conveyor IN (Ore Box → Furnaces)',
          filters: [
            { item: 'Sulfur Ore', min: 0, max: 0, buf: 0 },
            { item: 'Metal Ore', min: 0, max: 0, buf: 0 },
            { item: 'High Quality Metal Ore', min: 0, max: 0, buf: 0 },
            { item: 'Crude Oil', min: 0, max: 0, buf: 0 }
          ]
        },
        {
          label: 'Conveyor OUT (Furnaces → Ingot Box)',
          filters: [
            { item: 'Sulfur', min: 0, max: 0, buf: 0 },
            { item: 'Metal Fragments', min: 0, max: 0, buf: 0 },
            { item: 'High Quality Metal', min: 0, max: 0, buf: 0 },
            { item: 'Low Grade Fuel', min: 0, max: 0, buf: 0 }
          ]
        }
      ]
    },
    {
      id: 'tc_upkeep',
      name: '🏛️ TC Auto-Upkeep Feeder (No Overfill)',
      category: 'Base Defense',
      powerRwm: 1,
      conveyorsCount: 1,
      mode: 'Require Any (OR)',
      summary: 'Mats Box → Conveyor (with exact Max caps) → Storage Adaptor on Tool Cupboard.',
      proTips: [
        'Setting MAX caps prevents Stone from filling all 24 TC slots and locking out HQM or Metal Frags!',
        'Only pipe 1 TC per Conveyor if you want strict per-TC Max caps; Splitter to multiple external TCs shares logic across connected inventories.'
      ],
      conveyors: [
        {
          label: 'Conveyor → Main TC (48h Buffer Caps)',
          filters: [
            { item: 'Stones', min: 0, max: 10000, buf: 0 },
            { item: 'Metal Fragments', min: 0, max: 6000, buf: 0 },
            { item: 'High Quality Metal', min: 0, max: 400, buf: 0 },
            { item: 'Wood', min: 0, max: 4000, buf: 0 }
          ]
        }
      ]
    },
    {
      id: 'refinery_lgf',
      name: '🛢️ Small Oil Refinery Auto-Fuel Loop',
      category: 'Smelting',
      powerRwm: 2,
      conveyorsCount: 2,
      mode: 'Require Any (OR)',
      summary: 'Crude Oil + Wood Box → Conveyor IN → Storage Adaptor on Small Oil Refinery → Conveyor OUT → Low Grade Fuel Box.',
      proTips: [
        'Small Oil Refinery accepts 1 Storage Adaptor cleanly in vanilla Rust!',
        'Set Wood Max = 1000 so Charcoal byproduct from refining does not clog your Refinery output slots.'
      ],
      conveyors: [
        {
          label: 'Conveyor IN (Materials → Oil Refinery)',
          filters: [
            { item: 'Crude Oil', min: 0, max: 0, buf: 0 },
            { item: 'Wood', min: 0, max: 1000, buf: 0 }
          ]
        },
        {
          label: 'Conveyor OUT (Oil Refinery → LGF / Charcoal Box)',
          filters: [
            { item: 'Low Grade Fuel', min: 0, max: 0, buf: 0 },
            { item: 'Charcoal', min: 0, max: 0, buf: 0 }
          ]
        }
      ]
    },
    {
      id: 'locker_kits',
      name: '🪖 Auto-Locker Full Kit Restocker',
      category: 'Kits & Combat',
      powerRwm: 1,
      conveyorsCount: 1,
      mode: 'Require Any (OR)',
      summary: 'Wait-zero Locker refills! Attach 1 Storage Adaptor per Locker row (3 ports total on a Locker) from your Gun/Armor/Meds Boxes.',
      proTips: [
        'Each Storage Adaptor on a Locker controls ONLY that single shelf partition (3 partitions = 3 adaptors)!',
        'Set Max = 1 per gun/armor piece & 128 Ammo / 4 Syringes / 3 Bandages per shelf so every respawn row stays cleanly stocked.'
      ],
      conveyors: [
        {
          label: 'Conveyor → Locker Shelf Partition (1 Full AK Kit)',
          filters: [
            { item: 'Assault Rifle', min: 0, max: 1, buf: 0 },
            { item: 'Metal Facemask', min: 0, max: 1, buf: 0 },
            { item: 'Metal Chest Plate', min: 0, max: 1, buf: 0 },
            { item: 'Road Sign Kilt', min: 0, max: 1, buf: 0 },
            { item: '5.56 Rifle Ammo', min: 0, max: 128, buf: 0 },
            { item: 'Medical Syringe', min: 0, max: 4, buf: 0 },
            { item: 'Bandage', min: 0, max: 3, buf: 0 }
          ]
        }
      ]
    },
    {
      id: 'auto_crafter_gp',
      name: '💥 Auto-Crafter: Charcoal + Sulfur → Gun Powder',
      category: 'Crafting',
      powerRwm: 3,
      conveyorsCount: 2,
      mode: 'Require All (AND)',
      summary: 'Sulfur + Charcoal Boxes → Conveyor IN (Require All + Max caps!) → Industrial Crafter (WB2/WB3) → Conveyor OUT → Boom Box.',
      proTips: [
        'NEVER leave Max = 0 on Industrial Crafter input! Without Max caps, Charcoal fills every input slot and locks out Sulfur!',
        'Toggle "Require All (AND)" ON in the Conveyor so it only pushes when both Charcoal & Sulfur are available.'
      ],
      conveyors: [
        {
          label: 'Conveyor IN → Industrial Crafter (Gun Powder)',
          filters: [
            { item: 'Charcoal', min: 0, max: 2000, buf: 0 },
            { item: 'Sulfur', min: 0, max: 1500, buf: 0 }
          ]
        },
        {
          label: 'Conveyor OUT (Crafter → Boom Box)',
          filters: [
            { item: 'Gun Powder', min: 0, max: 0, buf: 0 }
          ]
        }
      ]
    },
    {
      id: 'berry_tea',
      name: '🧊 Tea & Berry Fridge Auto-Sorter',
      category: 'Farming & Teas',
      powerRwm: 1,
      conveyorsCount: 1,
      mode: 'Require Any (OR)',
      summary: 'Depot / Harvest Box → Conveyor → Storage Adaptor on Fridge (keeps Pure Ore/Scrap Teas & Berries out of main boxes).',
      proTips: [
        'Vanilla Mixing Tables CANNOT attach a Storage Adaptor — pipe directly into a Fridge or Dedicated Box instead!',
        'Works great alongside Pure Ore Tea (+50% Sulfur) cloning!'
      ],
      conveyors: [
        {
          label: 'Conveyor → Fridge (Pure Teas & Berries)',
          filters: [
            { item: 'Pure Ore Tea', min: 0, max: 0, buf: 0 },
            { item: 'Pure Scrap Tea', min: 0, max: 0, buf: 0 },
            { item: 'Pure Wood Tea', min: 0, max: 0, buf: 0 },
            { item: 'Pure Max Health Tea', min: 0, max: 0, buf: 0 },
            { item: 'Blue Berry', min: 0, max: 40, buf: 0 },
            { item: 'Yellow Berry', min: 0, max: 40, buf: 0 },
            { item: 'White Berry', min: 0, max: 40, buf: 0 },
            { item: 'Red Berry', min: 0, max: 40, buf: 0 }
          ]
        }
      ]
    }
  ]
};
