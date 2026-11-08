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
      methods: [
        { toolId: 'molotov', qty: 2, sulfur: 0, lgf: 100, cloth: 20, timeSec: 22, notes: '0 Sulfur! Best method by far.' },
        { toolId: 'flamethrower', qty: 85, sulfur: 0, lgf: 85, timeSec: 20, notes: '85 Low Grade Fuel with Flame Thrower.' },
        { toolId: 'explo_ammo', qty: 19, sulfur: 475, charcoal: 570, metal: 95, timeSec: 6, notes: 'Fast & silent with suppressor.' },
        { toolId: 'satchel', qty: 2, sulfur: 960, charcoal: 1440, metal: 160, rope: 2, cloth: 80, timeSec: 18, notes: 'Early wipe T1 explosive.' },
        { toolId: 'salvaged_sword', qty: 6, sulfur: 0, metal: 90, timeSec: 165, notes: 'Eco melee raid (6 Salvaged Swords).' }
      ],
      combos: [
        {
          label: '2x Molotov Cocktail (Zero Sulfur)',
          badge: '0 SULFUR META',
          items: [{ toolId: 'molotov', qty: 2 }],
          sulfur: 0,
          charcoal: 0,
          lgf: 100,
          timeSec: 22,
          savedSulfur: 960,
          notes: 'Costs only 100 Low Grade Fuel + 20 Cloth. Never waste sulfur on wood!'
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
          notes: 'Saves 360 Sulfur compared to 2 Satchels if you do not have Molotovs.'
        },
        {
          label: '1x Rocket + 0 (Instant Splash)',
          badge: 'FASTEST',
          items: [{ toolId: 'explo_ammo', qty: 19 }],
          sulfur: 475,
          charcoal: 570,
          lgf: 0,
          timeSec: 6,
          savedSulfur: 485,
          notes: '19 Explosive 5.56 rounds break wood doors in 6 seconds.'
        }
      ]
    },
    {
      id: 'sheet_metal_door',
      name: 'Sheet Metal Door',
      category: 'Doors',
      hp: 250,
      tier: 'Metal',
      methods: [
        { toolId: 'explo_ammo', qty: 63, sulfur: 1575, charcoal: 1890, metal: 315, timeSec: 18, notes: 'Lowest single-method sulfur cost.' },
        { toolId: 'satchel', qty: 4, sulfur: 1920, charcoal: 2880, metal: 320, rope: 4, cloth: 160, timeSec: 36, notes: 'Standard T1 raid method.' },
        { toolId: 'c4', qty: 1, sulfur: 2200, charcoal: 3000, metal: 200, lgf: 60, techTrash: 2, timeSec: 10, notes: '1 C4 overkills by 200 HP (wastes 625 sulfur).' },
        { toolId: 'rocket', qty: 2, sulfur: 2800, charcoal: 3900, metal: 200, lgf: 60, pipes: 4, timeSec: 8, notes: '2 Rockets waste 1,200 sulfur unless splashing.' }
      ],
      combos: [
        {
          label: '3x Satchels + 1x Beancan',
          badge: 'CHEAPEST T1',
          items: [
            { toolId: 'satchel', qty: 3 },
            { toolId: 'beancan', qty: 1 }
          ],
          sulfur: 1560,
          charcoal: 2340,
          lgf: 0,
          timeSec: 34,
          savedSulfur: 360,
          notes: 'Saves 360 Sulfur per door vs 4 Satchels!'
        },
        {
          label: '1x Rocket + 8x Explosive 5.56',
          badge: 'META SPEED COMBO',
          items: [
            { toolId: 'rocket', qty: 1 },
            { toolId: 'explo_ammo', qty: 8 }
          ],
          sulfur: 1600,
          charcoal: 2190,
          lgf: 30,
          timeSec: 7,
          savedSulfur: 600,
          notes: 'Fastest meta breach! Saves 600 Sulfur vs 1 C4 and splashes adjacent frame.'
        },
        {
          label: '63x Explosive 5.56 Ammo',
          badge: 'SILENT RAID',
          items: [{ toolId: 'explo_ammo', qty: 63 }],
          sulfur: 1575,
          charcoal: 1890,
          lgf: 0,
          timeSec: 18,
          savedSulfur: 625,
          notes: 'Use with SAR + Silencer for quiet offline/low-counter raiding.'
        },
        {
          label: '1x Rocket + 2x Beancans',
          badge: 'NO EXPLO BP',
          items: [
            { toolId: 'rocket', qty: 1 },
            { toolId: 'beancan', qty: 2 }
          ],
          sulfur: 1640,
          charcoal: 2310,
          lgf: 30,
          timeSec: 14,
          savedSulfur: 560,
          notes: 'Great if you found a Rocket in Chinook/Rig before learning Explo Ammo.'
        }
      ]
    },
    {
      id: 'garage_door',
      name: 'Garage Door',
      category: 'Doors',
      hp: 600,
      tier: 'Metal',
      methods: [
        { toolId: 'explo_ammo', qty: 150, sulfur: 3750, charcoal: 4500, metal: 750, timeSec: 45, notes: 'Pure Explosive Ammo (breaks 1 silencer).' },
        { toolId: 'rocket', qty: 3, sulfur: 4200, charcoal: 5850, metal: 300, lgf: 90, pipes: 6, timeSec: 12, notes: '3 pure Rockets.' },
        { toolId: 'satchel', qty: 9, sulfur: 4320, charcoal: 6480, metal: 720, rope: 9, cloth: 360, timeSec: 80, notes: 'T1 Satchel raid.' },
        { toolId: 'c4', qty: 2, sulfur: 4400, charcoal: 6000, metal: 400, lgf: 120, techTrash: 4, timeSec: 10, notes: '2 C4 overkills by 200 HP.' }
      ],
      combos: [
        {
          label: '2x Rockets + 10x Explosive 5.56',
          badge: 'BEST SULFUR SAVER',
          items: [
            { toolId: 'rocket', qty: 2 },
            { toolId: 'explo_ammo', qty: 10 }
          ],
          sulfur: 3050,
          charcoal: 4200,
          lgf: 60,
          timeSec: 11,
          savedSulfur: 1350,
          notes: 'Saves 1,350 Sulfur per Garage Door vs 2 C4 (and 1,150 vs 3 Rockets)!'
        },
        {
          label: '1x C4 + 41x Explosive 5.56',
          badge: 'FAST + CHEAP',
          items: [
            { toolId: 'c4', qty: 1 },
            { toolId: 'explo_ammo', qty: 41 }
          ],
          sulfur: 3225,
          charcoal: 4230,
          lgf: 60,
          timeSec: 18,
          savedSulfur: 1175,
          notes: 'Saves 1,175 Sulfur vs 2 C4 while using zero Metal Pipes.'
        },
        {
          label: '1x C4 + 1x Rocket + 3x Explo 5.56',
          badge: 'ULTRA FAST BREACH',
          items: [
            { toolId: 'c4', qty: 1 },
            { toolId: 'rocket', qty: 1 },
            { toolId: 'explo_ammo', qty: 3 }
          ],
          sulfur: 3675,
          charcoal: 5040,
          lgf: 90,
          timeSec: 10,
          savedSulfur: 725,
          notes: 'Instant breach in 10 seconds while saving 725 Sulfur.'
        },
        {
          label: '8x Satchels + 2x Beancans',
          badge: 'T1 COMBO',
          items: [
            { toolId: 'satchel', qty: 8 },
            { toolId: 'beancan', qty: 2 }
          ],
          sulfur: 4080,
          charcoal: 6120,
          lgf: 0,
          timeSec: 75,
          savedSulfur: 240,
          notes: 'Saves 240 Sulfur vs 9 Satchels on Tier 1 workbench.'
        }
      ]
    },
    {
      id: 'armored_door',
      name: 'Armored Door (Single / Double)',
      category: 'Doors',
      hp: 1000,
      tier: 'Armored',
      methods: [
        { toolId: 'explo_ammo', qty: 200, sulfur: 5000, charcoal: 6000, metal: 1000, timeSec: 60, notes: '200 Explo 5.56 is the cheapest pure sulfur option.' },
        { toolId: 'c4', qty: 3, sulfur: 6600, charcoal: 9000, metal: 600, lgf: 180, techTrash: 6, timeSec: 10, notes: '3 C4 wastes 1,600 Sulfur!' },
        { toolId: 'rocket', qty: 5, sulfur: 7000, charcoal: 9750, metal: 500, lgf: 150, pipes: 10, timeSec: 18, notes: '5 Rockets wastes 2,000 Sulfur.' },
        { toolId: 'satchel', qty: 15, sulfur: 7200, charcoal: 10800, metal: 1200, rope: 15, cloth: 600, timeSec: 130, notes: '15 Satchels.' }
      ],
      combos: [
        {
          label: '200x Explosive 5.56 Ammo',
          badge: 'CHEAPEST SULFUR',
          items: [{ toolId: 'explo_ammo', qty: 200 }],
          sulfur: 5000,
          charcoal: 6000,
          lgf: 0,
          timeSec: 60,
          savedSulfur: 1600,
          notes: 'Saves 1,600 Sulfur vs 3 C4! Aim at the hatch/hinge for splash.'
        },
        {
          label: '2x C4 + 30x Explosive 5.56',
          badge: 'META SPEED COMBO',
          items: [
            { toolId: 'c4', qty: 2 },
            { toolId: 'explo_ammo', qty: 30 }
          ],
          sulfur: 5150,
          charcoal: 6900,
          lgf: 120,
          timeSec: 16,
          savedSulfur: 1450,
          notes: '16-second breach while saving 1,450 Sulfur vs 3 C4!'
        },
        {
          label: '3x Rockets + 38x Explosive 5.56',
          badge: 'SPLASH COMBO',
          items: [
            { toolId: 'rocket', qty: 3 },
            { toolId: 'explo_ammo', qty: 38 }
          ],
          sulfur: 5150,
          charcoal: 6990,
          lgf: 90,
          timeSec: 20,
          savedSulfur: 1850,
          notes: 'Saves 1,850 Sulfur vs 5 Rockets and splashes surrounding doorframe.'
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
        { toolId: 'explo_ammo', qty: 63, sulfur: 1575, charcoal: 1890, metal: 315, timeSec: 18, notes: 'Same HP/resistances as Sheet Metal Door.' },
        { toolId: 'satchel', qty: 4, sulfur: 1920, charcoal: 2880, metal: 320, rope: 4, cloth: 160, timeSec: 36, notes: '4 Satchels.' },
        { toolId: 'c4', qty: 1, sulfur: 2200, charcoal: 3000, metal: 200, lgf: 60, techTrash: 2, timeSec: 10, notes: '1 C4.' }
      ],
      combos: [
        {
          label: '1x Rocket + 8x Explosive 5.56',
          badge: 'META COMBO',
          items: [
            { toolId: 'rocket', qty: 1 },
            { toolId: 'explo_ammo', qty: 8 }
          ],
          sulfur: 1600,
          charcoal: 2190,
          lgf: 30,
          timeSec: 7,
          savedSulfur: 600,
          notes: 'Saves 600 Sulfur vs 1 C4.'
        },
        {
          label: '3x Satchels + 1x Beancan',
          badge: 'T1 SAVER',
          items: [
            { toolId: 'satchel', qty: 3 },
            { toolId: 'beancan', qty: 1 }
          ],
          sulfur: 1560,
          charcoal: 2340,
          lgf: 0,
          timeSec: 34,
          savedSulfur: 360,
          notes: 'Cheapest T1 hatch breach.'
        }
      ]
    },

    // --- WALLS & BUILDING BLOCKS ---
    {
      id: 'wood_wall',
      name: 'Wooden Wall / Floor / Roof',
      category: 'Walls & Floors',
      hp: 250,
      tier: 'Wood',
      methods: [
        { toolId: 'molotov', qty: 4, sulfur: 0, lgf: 200, cloth: 40, timeSec: 40, notes: '4 Molotovs = 0 Sulfur!' },
        { toolId: 'flamethrower', qty: 206, sulfur: 0, lgf: 206, timeSec: 45, notes: '206 Low Grade Fuel.' },
        { toolId: 'explo_ammo', qty: 49, sulfur: 1225, charcoal: 1470, metal: 245, timeSec: 15, notes: '49 Explosive 5.56.' },
        { toolId: 'satchel', qty: 3, sulfur: 1440, charcoal: 2160, metal: 240, rope: 3, cloth: 120, timeSec: 27, notes: '3 Satchels.' }
      ],
      combos: [
        {
          label: '4x Molotov Cocktails',
          badge: '0 SULFUR META',
          items: [{ toolId: 'molotov', qty: 4 }],
          sulfur: 0,
          charcoal: 0,
          lgf: 200,
          timeSec: 40,
          savedSulfur: 1440,
          notes: 'Zero Sulfur cost! Can splash multiple wood walls at corners.'
        },
        {
          label: '1x Incendiary Rocket',
          badge: 'FAST FIRE SPLASH',
          items: [{ toolId: 'incen_rocket', qty: 1 }],
          sulfur: 610,
          charcoal: 900,
          lgf: 253,
          timeSec: 15,
          savedSulfur: 830,
          notes: '1 Incendiary Rocket burns down wood walls/Honeycomb in 15s.'
        }
      ]
    },
    {
      id: 'stone_wall',
      name: 'Stone Wall / Floor / Foundation',
      category: 'Walls & Floors',
      hp: 500,
      tier: 'Stone',
      methods: [
        { toolId: 'c4', qty: 2, sulfur: 4400, charcoal: 6000, metal: 400, lgf: 120, techTrash: 4, timeSec: 10, notes: 'Lowest Sulfur for single Stone Wall (no splash).' },
        { toolId: 'explo_ammo', qty: 185, sulfur: 4625, charcoal: 5550, metal: 925, timeSec: 55, notes: '185 Explosive 5.56 rounds.' },
        { toolId: 'satchel', qty: 10, sulfur: 4800, charcoal: 7200, metal: 800, rope: 10, cloth: 400, timeSec: 90, notes: '10 Satchel Charges.' },
        { toolId: 'rocket', qty: 4, sulfur: 5600, charcoal: 7800, metal: 400, lgf: 120, pipes: 8, timeSec: 15, notes: 'Splashes up to 4 Stone Walls at intersection!' },
        { toolId: 'pickaxe', qty: 7, sulfur: 0, metal: 875, timeSec: 495, notes: 'SOFT-SIDE ONLY: 7 Metal Pickaxes or 1 Jackhammer with refills.' }
      ],
      combos: [
        {
          label: '2x C4 (Single Wall Optimal)',
          badge: 'SINGLE WALL BEST',
          items: [{ toolId: 'c4', qty: 2 }],
          sulfur: 4400,
          charcoal: 6000,
          lgf: 120,
          timeSec: 10,
          savedSulfur: 1200,
          notes: 'Exact 500 damage on 1 Stone Wall. Saves 1,200 Sulfur vs 4 Rockets.'
        },
        {
          label: '3x Rockets + 38x Explosive 5.56',
          badge: '4-WALL SPLASH SAVER',
          items: [
            { toolId: 'rocket', qty: 3 },
            { toolId: 'explo_ammo', qty: 38 }
          ],
          sulfur: 5150,
          charcoal: 6990,
          lgf: 90,
          timeSec: 20,
          savedSulfur: 450,
          notes: 'Breaks 4 Stone Walls at their corner intersection while saving 450 Sulfur + 2 Pipes!'
        },
        {
          label: '1x C4 + 1x Rocket + 32x Explo 5.56',
          badge: 'HYBRID BREACH',
          items: [
            { toolId: 'c4', qty: 1 },
            { toolId: 'rocket', qty: 1 },
            { toolId: 'explo_ammo', qty: 32 }
          ],
          sulfur: 4400,
          charcoal: 5910,
          lgf: 90,
          timeSec: 16,
          savedSulfur: 1200,
          notes: 'Same 4,400 Sulfur cost as 2 C4 when you only have 2 Tech Trash.'
        },
        {
          label: 'Soft-Side Jackhammer / 7x Pickaxes',
          badge: '0 SULFUR ECO',
          items: [{ toolId: 'jackhammer', qty: 1 }],
          sulfur: 0,
          charcoal: 0,
          lgf: 0,
          timeSec: 210,
          savedSulfur: 4400,
          notes: 'If soft-side Stone Wall or Ceiling is exposed: 1 Jackhammer (refilled at WB) = 0 Sulfur!'
        }
      ]
    },
    {
      id: 'sheet_metal_wall',
      name: 'Sheet Metal Wall / Floor / Roof',
      category: 'Walls & Floors',
      hp: 1000,
      tier: 'Metal',
      methods: [
        { toolId: 'c4', qty: 4, sulfur: 8800, charcoal: 12000, metal: 800, lgf: 240, techTrash: 8, timeSec: 12, notes: '4 C4 (Single wall).' },
        { toolId: 'explo_ammo', qty: 400, sulfur: 10000, charcoal: 12000, metal: 2000, timeSec: 120, notes: '400 Explosive 5.56 rounds.' },
        { toolId: 'rocket', qty: 8, sulfur: 11200, charcoal: 15600, metal: 800, lgf: 240, pipes: 16, timeSec: 28, notes: '8 Rockets (splashes 4 walls at once).' },
        { toolId: 'satchel', qty: 23, sulfur: 11040, charcoal: 16560, metal: 1840, rope: 23, cloth: 920, timeSec: 200, notes: '23 Satchels.' }
      ],
      combos: [
        {
          label: '3x C4 + 30x Explosive 5.56',
          badge: 'BEST SINGLE WALL',
          items: [
            { toolId: 'c4', qty: 3 },
            { toolId: 'explo_ammo', qty: 30 }
          ],
          sulfur: 7350,
          charcoal: 9900,
          lgf: 180,
          timeSec: 18,
          savedSulfur: 1450,
          notes: '3 C4 deals 825 dmg + 30 Explo deals 175 dmg = 1,000 HP! Saves 1,450 Sulfur vs 4 C4!'
        },
        {
          label: '7x Rockets + 13x Explosive 5.56',
          badge: '4-WALL SPLASH SAVER',
          items: [
            { toolId: 'rocket', qty: 7 },
            { toolId: 'explo_ammo', qty: 13 }
          ],
          sulfur: 10125,
          charcoal: 14040,
          lgf: 210,
          timeSec: 28,
          savedSulfur: 1075,
          notes: 'Splashes 4 Sheet Metal Walls at intersection and saves 1,075 Sulfur vs 8 Rockets!'
        },
        {
          label: '2x C4 + 3x Rockets + 15x Explo 5.56',
          badge: 'MIXED BOOM',
          items: [
            { toolId: 'c4', qty: 2 },
            { toolId: 'rocket', qty: 3 },
            { toolId: 'explo_ammo', qty: 15 }
          ],
          sulfur: 8975,
          charcoal: 12300,
          lgf: 210,
          timeSec: 20,
          savedSulfur: 2225,
          notes: 'Great when combining leftover C4 and Rockets from Rig/Cargo crates.'
        }
      ]
    },
    {
      id: 'armored_wall',
      name: 'Armored Wall / Floor (HQM)',
      category: 'Walls & Floors',
      hp: 2000,
      tier: 'Armored',
      methods: [
        { toolId: 'c4', qty: 8, sulfur: 17600, charcoal: 24000, metal: 1600, lgf: 480, techTrash: 16, timeSec: 15, notes: '8 C4 (single HQM wall).' },
        { toolId: 'explo_ammo', qty: 799, sulfur: 19975, charcoal: 23970, metal: 3995, timeSec: 240, notes: '799 Explosive 5.56 rounds.' },
        { toolId: 'rocket', qty: 15, sulfur: 21000, charcoal: 29250, metal: 1500, lgf: 450, pipes: 30, timeSec: 52, notes: '15 Rockets (splashes 4 HQM walls).' },
        { toolId: 'satchel', qty: 46, sulfur: 22080, charcoal: 33120, metal: 3680, rope: 46, cloth: 1840, timeSec: 390, notes: '46 Satchels.' }
      ],
      combos: [
        {
          label: '7x C4 + 31x Explosive 5.56',
          badge: 'BEST SINGLE HQM',
          items: [
            { toolId: 'c4', qty: 7 },
            { toolId: 'explo_ammo', qty: 31 }
          ],
          sulfur: 16175,
          charcoal: 21930,
          lgf: 420,
          timeSec: 22,
          savedSulfur: 1425,
          notes: '7 C4 deals 1,925 dmg + 31 Explo finishes the remaining 75 HP! Saves 1,425 Sulfur.'
        },
        {
          label: '14x Rockets + 26x Explosive 5.56',
          badge: 'HQM SPLASH SAVER',
          items: [
            { toolId: 'rocket', qty: 14 },
            { toolId: 'explo_ammo', qty: 26 }
          ],
          sulfur: 20250,
          charcoal: 28080,
          lgf: 420,
          timeSec: 54,
          savedSulfur: 750,
          notes: 'Splashes 4 Armored Walls while saving 750 Sulfur + 2 Pipes.'
        }
      ]
    },

    // --- WINDOWS, BARS & SHOP FRONTS ---
    {
      id: 'strengthened_window',
      name: 'Strengthened Glass Window',
      category: 'Windows & Grills',
      hp: 350,
      tier: 'Metal',
      methods: [
        { toolId: 'explo_ammo', qty: 140, sulfur: 3500, charcoal: 4200, metal: 700, timeSec: 42, notes: '140 Explosive 5.56.' },
        { toolId: 'c4', qty: 2, sulfur: 4400, charcoal: 6000, metal: 400, lgf: 120, techTrash: 4, timeSec: 10, notes: '2 C4.' },
        { toolId: 'rocket', qty: 3, sulfur: 4200, charcoal: 5850, metal: 300, lgf: 90, pipes: 6, timeSec: 12, notes: '3 Rockets.' },
        { toolId: 'satchel', qty: 9, sulfur: 4320, charcoal: 6480, metal: 720, rope: 9, cloth: 360, timeSec: 80, notes: '9 Satchels.' }
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
          timeSec: 16,
          savedSulfur: 1250,
          notes: 'Saves 1,250 Sulfur vs 3 Rockets and 1,450 vs 2 C4!'
        },
        {
          label: '2x Rockets + 30x Explosive 5.56',
          badge: 'SPLASH COMBO',
          items: [
            { toolId: 'rocket', qty: 2 },
            { toolId: 'explo_ammo', qty: 30 }
          ],
          sulfur: 3550,
          charcoal: 4800,
          lgf: 60,
          timeSec: 16,
          savedSulfur: 650,
          notes: 'Saves 650 Sulfur vs 3 Rockets.'
        }
      ]
    },
    {
      id: 'reinforced_window',
      name: 'Reinforced Glass Window (HQM)',
      category: 'Windows & Grills',
      hp: 500,
      tier: 'Armored',
      methods: [
        { toolId: 'explo_ammo', qty: 200, sulfur: 5000, charcoal: 6000, metal: 1000, timeSec: 60, notes: '200 Explosive 5.56.' },
        { toolId: 'c4', qty: 2, sulfur: 4400, charcoal: 6000, metal: 400, lgf: 120, techTrash: 4, timeSec: 10, notes: '2 C4.' },
        { toolId: 'rocket', qty: 4, sulfur: 5600, charcoal: 7800, metal: 400, lgf: 120, pipes: 8, timeSec: 15, notes: '4 Rockets.' }
      ],
      combos: [
        {
          label: '2x C4',
          badge: 'OPTIMAL',
          items: [{ toolId: 'c4', qty: 2 }],
          sulfur: 4400,
          charcoal: 6000,
          lgf: 120,
          timeSec: 10,
          savedSulfur: 1200,
          notes: '2 C4 is the cheapest and fastest way through Reinforced Glass.'
        },
        {
          label: '3x Rockets + 35x Explosive 5.56',
          badge: 'ROCKET COMBO',
          items: [
            { toolId: 'rocket', qty: 3 },
            { toolId: 'explo_ammo', qty: 35 }
          ],
          sulfur: 5075,
          charcoal: 6900,
          lgf: 90,
          timeSec: 18,
          savedSulfur: 525,
          notes: 'Saves 525 Sulfur vs 4 Rockets.'
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
        { toolId: 'c4', qty: 3, sulfur: 6600, charcoal: 9000, metal: 600, lgf: 180, techTrash: 6, timeSec: 10, notes: '3 C4.' },
        { toolId: 'rocket', qty: 6, sulfur: 8400, charcoal: 11700, metal: 600, lgf: 180, pipes: 12, timeSec: 22, notes: '6 Rockets.' },
        { toolId: 'explo_ammo', qty: 300, sulfur: 7500, charcoal: 9000, metal: 1500, timeSec: 90, notes: '300 Explosive 5.56.' }
      ],
      combos: [
        {
          label: '2x C4 + 80x Explosive 5.56',
          badge: 'SULFUR SAVER',
          items: [
            { toolId: 'c4', qty: 2 },
            { toolId: 'explo_ammo', qty: 80 }
          ],
          sulfur: 6400,
          charcoal: 8400,
          lgf: 120,
          timeSec: 28,
          savedSulfur: 2000,
          notes: 'Saves 2,000 Sulfur vs 6 Rockets!'
        }
      ]
    },

    // --- TRAPS & TURRETS ---
    {
      id: 'auto_turret',
      name: 'Auto Turret',
      category: 'Traps & Turrets',
      hp: 1000,
      tier: 'Deployable',
      methods: [
        { toolId: 'hv_rocket', qty: 3, sulfur: 600, charcoal: 900, pipes: 3, timeSec: 8, notes: '3 HV Rockets is the #1 ranged turret killer!' },
        { toolId: 'incen_rocket', qty: 1, sulfur: 610, charcoal: 900, lgf: 253, pipes: 2, timeSec: 12, notes: '1 Direct Incendiary Rocket burns it out.' },
        { toolId: 'f1_grenade', qty: 12, sulfur: 720, charcoal: 1080, metal: 300, timeSec: 20, notes: 'Or buy 12 F1 Grenades for 96 Scrap at Bandit Camp (0 Sulfur!).' },
        { toolId: 'explo_ammo', qty: 112, sulfur: 2800, charcoal: 3360, metal: 560, timeSec: 32, notes: '112 Explosive 5.56 rounds.' },
        { toolId: 'satchel', qty: 2, sulfur: 960, charcoal: 1440, metal: 160, rope: 2, cloth: 80, timeSec: 18, notes: '2 Satchels if you can get close.' }
      ],
      combos: [
        {
          label: '3x HV Rockets',
          badge: 'META TURRET KILLER',
          items: [{ toolId: 'hv_rocket', qty: 3 }],
          sulfur: 600,
          charcoal: 900,
          lgf: 0,
          timeSec: 8,
          savedSulfur: 2200,
          notes: 'Only 600 Sulfur + 3 Pipes from safe range!'
        },
        {
          label: '12x F1 Grenades (Bandit Camp = 96 Scrap)',
          badge: '0 SULFUR (SCRAP)',
          items: [{ toolId: 'f1_grenade', qty: 12 }],
          sulfur: 0,
          charcoal: 0,
          lgf: 0,
          timeSec: 20,
          savedSulfur: 2800,
          notes: 'Buy 12 F1 Grenades at Bandit Camp for 8 Scrap each (96 Scrap total = 0 Sulfur!).'
        }
      ]
    },
    {
      id: 'sam_site',
      name: 'SAM Site',
      category: 'Traps & Turrets',
      hp: 1000,
      tier: 'Deployable',
      methods: [
        { toolId: 'molotov', qty: 2, sulfur: 0, lgf: 100, cloth: 20, timeSec: 20, notes: '2 Molotovs destroy a SAM Site for 0 Sulfur!' },
        { toolId: 'hv_rocket', qty: 6, sulfur: 1200, charcoal: 1800, pipes: 6, timeSec: 18, notes: '6 HV Rockets from range.' },
        { toolId: 'explo_ammo', qty: 200, sulfur: 5000, charcoal: 6000, metal: 1000, timeSec: 60, notes: '200 Explosive 5.56 from ground.' }
      ],
      combos: [
        {
          label: '2x Molotov Cocktails',
          badge: '0 SULFUR META',
          items: [{ toolId: 'molotov', qty: 2 }],
          sulfur: 0,
          charcoal: 0,
          lgf: 100,
          timeSec: 20,
          savedSulfur: 1200,
          notes: '2 Molotovs burn out a SAM Site for 100 Low Grade Fuel!'
        },
        {
          label: '6x HV Rockets (Long Range)',
          badge: 'RANGED CLEAR',
          items: [{ toolId: 'hv_rocket', qty: 6 }],
          sulfur: 1200,
          charcoal: 1800,
          lgf: 0,
          timeSec: 18,
          savedSulfur: 3800,
          notes: 'Snipe roof SAM sites from ground before flying in.'
        }
      ]
    },
    {
      id: 'shotgun_trap',
      name: 'Shotgun Trap / Flame Turret',
      category: 'Traps & Turrets',
      hp: 300,
      tier: 'Deployable',
      methods: [
        { toolId: 'molotov', qty: 1, sulfur: 0, lgf: 50, cloth: 10, timeSec: 10, notes: '1 Molotov destroys Shotgun Traps!' },
        { toolId: 'f1_grenade', qty: 2, sulfur: 120, charcoal: 180, metal: 50, timeSec: 5, notes: '2 F1 Grenades bounced around corner.' },
        { toolId: 'explo_ammo', qty: 17, sulfur: 425, charcoal: 510, metal: 85, timeSec: 5, notes: '17 Explosive 5.56 (splash corner).' }
      ],
      combos: [
        {
          label: '1x Molotov or 2x F1 Grenades',
          badge: 'CORNER CLEAR',
          items: [{ toolId: 'molotov', qty: 1 }],
          sulfur: 0,
          charcoal: 0,
          lgf: 50,
          timeSec: 10,
          savedSulfur: 425,
          notes: 'Throw 1 Molotov or bounce 2 F1 Grenades off the jump-up wall.'
        }
      ]
    },

    // --- DEPLOYABLES & EXTERNAL WALLS ---
    {
      id: 'tool_cupboard',
      name: 'Tool Cupboard (TC)',
      category: 'Deployables & External',
      hp: 100,
      tier: 'Wood',
      methods: [
        { toolId: 'molotov', qty: 1, sulfur: 0, lgf: 50, cloth: 10, timeSec: 11, notes: '1 Molotov breaks TC + bags nearby for 0 Sulfur!' },
        { toolId: 'flamethrower', qty: 40, sulfur: 0, lgf: 40, timeSec: 10, notes: '40 Low Grade Fuel.' },
        { toolId: 'explo_ammo', qty: 10, sulfur: 250, charcoal: 300, metal: 50, timeSec: 3, notes: '10 Explosive 5.56 rounds (instant TC grief/seal).' },
        { toolId: 'satchel', qty: 1, sulfur: 480, charcoal: 720, metal: 80, rope: 1, cloth: 40, timeSec: 9, notes: '1 Satchel Charge.' }
      ],
      combos: [
        {
          label: '1x Molotov Cocktail',
          badge: '0 SULFUR',
          items: [{ toolId: 'molotov', qty: 1 }],
          sulfur: 0,
          charcoal: 0,
          lgf: 50,
          timeSec: 11,
          savedSulfur: 250,
          notes: 'Costs 0 Sulfur. Wait 10s for fire to extinguish before placing new TC.'
        },
        {
          label: '10x Explosive 5.56 (Instant Seal)',
          badge: '3s BREACH',
          items: [{ toolId: 'explo_ammo', qty: 10 }],
          sulfur: 250,
          charcoal: 300,
          lgf: 0,
          timeSec: 3,
          savedSulfur: 230,
          notes: 'Use when counter-raiders are outside and you must seal TC immediately.'
        }
      ]
    },
    {
      id: 'vending_machine',
      name: 'Vending Machine',
      category: 'Deployables & External',
      hp: 1250,
      tier: 'Metal',
      methods: [
        { toolId: 'c4', qty: 3, sulfur: 6600, charcoal: 9000, metal: 600, lgf: 180, techTrash: 6, timeSec: 10, notes: '3 C4.' },
        { toolId: 'explo_ammo', qty: 499, sulfur: 12475, charcoal: 14970, metal: 2495, timeSec: 150, notes: '499 Explosive 5.56.' },
        { toolId: 'rocket', qty: 10, sulfur: 14000, charcoal: 19500, metal: 1000, lgf: 300, pipes: 20, timeSec: 35, notes: '10 Rockets.' }
      ],
      combos: [
        {
          label: '2x C4 + 120x Explosive 5.56',
          badge: 'SULFUR SAVER',
          items: [
            { toolId: 'c4', qty: 2 },
            { toolId: 'explo_ammo', qty: 120 }
          ],
          sulfur: 7400,
          charcoal: 9600,
          lgf: 120,
          timeSec: 40,
          savedSulfur: 6600,
          notes: 'Or break the floor/foundation underneath the Vending Machine if Stone (4,400 Sulfur)!'
        }
      ]
    },
    {
      id: 'high_ext_stone',
      name: 'High External Stone Wall / Gate',
      category: 'Deployables & External',
      hp: 500,
      tier: 'Stone',
      methods: [
        { toolId: 'c4', qty: 2, sulfur: 4400, charcoal: 6000, metal: 400, lgf: 120, techTrash: 4, timeSec: 10, notes: '2 C4.' },
        { toolId: 'rocket', qty: 4, sulfur: 5600, charcoal: 7800, metal: 400, lgf: 120, pipes: 8, timeSec: 15, notes: '4 Rockets.' },
        { toolId: 'satchel', qty: 10, sulfur: 4800, charcoal: 7200, metal: 800, rope: 10, cloth: 400, timeSec: 90, notes: '10 Satchels.' }
      ],
      combos: [
        {
          label: '2x C4',
          badge: 'OPTIMAL',
          items: [{ toolId: 'c4', qty: 2 }],
          sulfur: 4400,
          charcoal: 6000,
          lgf: 120,
          timeSec: 10,
          savedSulfur: 1200,
          notes: 'Saves 1,200 Sulfur vs 4 Rockets.'
        }
      ]
    }
  ],

  // =========================================================================
  // 3. MONUMENTS, KEYCARD PUZZLES, FUSES & TIMERS
  // =========================================================================
  monuments: [
    {
      id: 'lighthouse',
      name: 'Lighthouse',
      tier: 0,
      biome: 'Coast',
      defaultPos: { x: 0.14, y: 0.28, grid: 'D8' },
      cardsNeeded: [],
      cardsFound: ['Green'],
      fusesNeeded: 0,
      radRequired: '0%',
      respawnMin: 20,
      crates: { locked: 0, elite: 0, military: 0, normal: 5, diesel: 0 },
      utilities: ['Recycler'],
      steps: [
        'No fuse or card required.',
        'Climb the spiral stairs to the first office room halfway up.',
        'Pick up the FREE Green Keycard on the wooden desk + use the Recycler.'
      ]
    },
    {
      id: 'supermarket',
      name: 'Abandoned Supermarket',
      tier: 0,
      biome: 'Temperate',
      defaultPos: { x: 0.26, y: 0.62, grid: 'G16' },
      cardsNeeded: [],
      cardsFound: ['Green'],
      fusesNeeded: 0,
      radRequired: '0%',
      respawnMin: 20,
      crates: { locked: 0, elite: 0, military: 1, normal: 4, diesel: 0 },
      utilities: ['Recycler'],
      steps: [
        'No fuse or card required.',
        'Check the back manager office desk for the Green Keycard.',
        'Check roof and shelves for Food, Normal, and 1 possible Military Crate.'
      ]
    },
    {
      id: 'gas_station',
      name: 'Oxum\'s Gas Station',
      tier: 0,
      biome: 'Temperate',
      defaultPos: { x: 0.38, y: 0.72, grid: 'K19' },
      cardsNeeded: [],
      cardsFound: ['Green'],
      fusesNeeded: 0,
      radRequired: '0%',
      respawnMin: 20,
      crates: { locked: 0, elite: 0, military: 1, normal: 4, diesel: 0 },
      utilities: ['Recycler'],
      steps: [
        'No fuse or card required.',
        'Enter the back office behind the counter to grab the Green Keycard.',
        'Drop down the garage car pit for a Military/Normal crate.'
      ]
    },
    {
      id: 'harbor',
      name: 'Harbor (Small & Large)',
      tier: 1,
      biome: 'Coast',
      defaultPos: { x: 0.82, y: 0.65, grid: 'V17' },
      cardsNeeded: ['Green'],
      cardsFound: ['Blue'],
      fusesNeeded: 1,
      radRequired: '0%',
      respawnMin: 30,
      crates: { locked: 0, elite: 0, military: 2, normal: 6, diesel: 0 },
      utilities: ['Recycler', 'Oil Refinery', 'Cargo Dock'],
      steps: [
        'Bring 1x Green Keycard + 1x Electric Fuse.',
        'Small Harbor: Insert Fuse & flip switch in the concrete pillar room, then swipe Green Card upstairs on the hangar walkway.',
        'Large Harbor: Insert Fuse in the small brick shed near the entrance, then swipe Green Card at the crane control container.',
        'Loot the Blue Keycard on the desk + crates (Cargo Ship also docks here!).'
      ]
    },
    {
      id: 'sewer_branch',
      name: 'Sewer Branch',
      tier: 1,
      biome: 'Temperate',
      defaultPos: { x: 0.44, y: 0.48, grid: 'L13' },
      cardsNeeded: ['Green'],
      cardsFound: ['Blue'],
      fusesNeeded: 1,
      radRequired: '11%',
      respawnMin: 30,
      crates: { locked: 0, elite: 0, military: 4, normal: 8, diesel: 0 },
      utilities: ['Recycler (x2)', 'Oil Refinery'],
      steps: [
        'Bring 1x Green Keycard + 1x Electric Fuse + 11% Rad Protection.',
        'Enter the small bunker shed at the base of the jump-up tower: insert 1x Fuse and flip the switch.',
        'Head down into the underground sewer tunnel and swipe your Green Keycard.',
        'Loot 9–12 crates, grab the Blue Keycard on the desk, and use the safe underground Recycler!'
      ]
    },
    {
      id: 'satellite_dish',
      name: 'Satellite Dish',
      tier: 1,
      biome: 'Temperate',
      defaultPos: { x: 0.56, y: 0.52, grid: 'O14' },
      cardsNeeded: ['Green'],
      cardsFound: ['Blue'],
      fusesNeeded: 1,
      radRequired: '11%',
      respawnMin: 30,
      crates: { locked: 0, elite: 0, military: 2, normal: 6, diesel: 0 },
      utilities: ['Recycler'],
      steps: [
        'Bring 1x Green Keycard + 1x Electric Fuse + 11% Rad Protection.',
        'Insert Fuse into the lower shipping container and flip the switch.',
        'Swipe Green Keycard on the adjacent locked shipping container for Blue Keycard + Crates.'
      ]
    },
    {
      id: 'water_treatment',
      name: 'Water Treatment Plant',
      tier: 2,
      biome: 'Temperate',
      defaultPos: { x: 0.34, y: 0.36, grid: 'I10' },
      cardsNeeded: ['Blue'],
      cardsFound: ['Red'],
      fusesNeeded: 1,
      radRequired: '11% (25% Valve)',
      respawnMin: 30,
      crates: { locked: 0, elite: 0, military: 6, normal: 10, diesel: 3 },
      utilities: ['Recycler', 'Oil Refinery', 'Repair Bench'],
      steps: [
        'Bring 1x Blue Keycard + 1x Electric Fuse + 11% Rad Protection.',
        'Turn the wheel valve on the central garage building to lift the roll-up door.',
        'Climb upstairs inside the garage, insert 1x Fuse, and flip the timer switch.',
        'Run across to the two-story office building, swipe your Blue Keycard on the 2nd floor, and grab the Red Keycard + 6 Military Crates + 3 Diesel Barrels!'
      ]
    },
    {
      id: 'train_yard',
      name: 'Train Yard',
      tier: 2,
      biome: 'Temperate / Snow',
      defaultPos: { x: 0.62, y: 0.34, grid: 'Q9' },
      cardsNeeded: ['Green', 'Blue'],
      cardsFound: ['Red'],
      fusesNeeded: 1,
      radRequired: '11% (25% Puzzle)',
      respawnMin: 30,
      crates: { locked: 0, elite: 0, military: 7, normal: 10, diesel: 3 },
      utilities: ['Recycler', 'Oil Refinery', 'Coaling Tower Unloader'],
      steps: [
        'Bring 1x Blue Keycard (Green Card optional for extra room) + 1x Fuse + 25% Rad Protection (Hazmat recommended).',
        'Switch #1: Flip the ON switch on the 2nd floor of the concrete transformer building.',
        'Switch #2: Flip the ON switch at the top of the tall metal water tower.',
        'Insert 1x Fuse inside the main brick switch-house, then run to the tall 4-story office tower.',
        'Swipe Blue Card on the top floor for the Red Keycard + up to 9 crates (and Green Card on 2nd floor).'
      ]
    },
    {
      id: 'power_plant',
      name: 'Power Plant',
      tier: 2,
      biome: 'Temperate',
      defaultPos: { x: 0.25, y: 0.44, grid: 'G12' },
      cardsNeeded: ['Green', 'Blue'],
      cardsFound: ['Red'],
      fusesNeeded: 2,
      radRequired: '25%',
      respawnMin: 30,
      crates: { locked: 0, elite: 0, military: 6, normal: 9, diesel: 3 },
      utilities: ['Recycler (x2)', 'Oil Refinery'],
      steps: [
        'Bring 1x Green Keycard + 1x Blue Keycard + 2x Electric Fuses + 25% Rad Protection.',
        'Flip the switch in the small shed near the broken cooling tower, OR swipe Green Card on the side of the main building.',
        'Insert 1st Fuse in the small shed + 2nd Fuse inside the main 3-story building and flip the timer switch.',
        'Swipe Blue Card on the 3rd floor for the Red Keycard + Military Crates.'
      ]
    },
    {
      id: 'airfield',
      name: 'Airfield',
      tier: 2,
      biome: 'Temperate / Desert',
      defaultPos: { x: 0.52, y: 0.74, grid: 'N19' },
      cardsNeeded: ['Green', 'Blue'],
      cardsFound: ['Red'],
      fusesNeeded: 2,
      radRequired: '11%',
      respawnMin: 30,
      crates: { locked: 0, elite: 0, military: 5, normal: 12, diesel: 3 },
      utilities: ['Recycler', 'Oil Refinery', 'Repair Bench'],
      steps: [
        'Bring 1x Green Keycard + 1x Blue Keycard + 2x Electric Fuses + 11% Rad Protection.',
        'Insert 1st Fuse in the middle office building and flip the switch.',
        'Drop down the underground sewer ladder between hangars -> Swipe Green Card -> Insert 2nd Fuse -> Swipe Blue Card.',
        'Loot the Red Keycard + underground Military Crates.'
      ]
    },
    {
      id: 'arctic_research',
      name: 'Arctic Research Base',
      tier: 2,
      biome: 'Snow',
      defaultPos: { x: 0.72, y: 0.16, grid: 'S4' },
      cardsNeeded: ['Blue'],
      cardsFound: ['Red'],
      fusesNeeded: 1,
      radRequired: '0% (Cold Protection!)',
      respawnMin: 30,
      crates: { locked: 0, elite: 0, military: 5, normal: 8, diesel: 2 },
      utilities: ['Recycler', 'Snowmobile Spawn'],
      steps: [
        'Bring 1x Blue Keycard + 1x Electric Fuse (Clear Arctic Scientists first).',
        'Insert 1x Fuse in the garage building and flip the switch.',
        'Swipe Blue Card at the central lab building to get the Red Keycard + free Snowmobile + Military Crates.'
      ]
    },
    {
      id: 'launch_site',
      name: 'Launch Site (Bradley APC)',
      tier: 3,
      biome: 'Desert / Arid',
      defaultPos: { x: 0.76, y: 0.46, grid: 'T12' },
      cardsNeeded: ['Green', 'Red'],
      cardsFound: [],
      fusesNeeded: 2,
      radRequired: '50% (Hazmat + Water/Pills)',
      respawnMin: 30,
      crates: { locked: 0, elite: 3, military: 6, normal: 12, diesel: 4 },
      utilities: ['Recycler', 'Oil Refinery', 'Bradley APC (7 HV Rockets)'],
      steps: [
        'Bring 1x Green Keycard + 1x Red Keycard + 2x Electric Fuses + Hazmat Suit + ~150ml Water (to wash rads).',
        'Building #1: Swipe Green Card -> Insert 1st Fuse -> Flip switch.',
        'Building #2 (North side): Insert 2nd Fuse -> Flip switch.',
        'Swipe Red Card at the main Rocket Factory door -> Climb or take elevator to roof for 3x Elite Crates!',
        'To exit: Press the red auxiliary power button inside the ground-floor control room. (Tip: Bradley APC takes 7x HV Rockets = 1,400 Sulfur!)'
      ]
    },
    {
      id: 'military_tunnels',
      name: 'Military Tunnels',
      tier: 3,
      biome: 'Snow / Forest',
      defaultPos: { x: 0.32, y: 0.18, grid: 'I5' },
      cardsNeeded: ['Green', 'Blue', 'Red'],
      cardsFound: ['Blue', 'Red'],
      fusesNeeded: 1,
      radRequired: '25%',
      respawnMin: 30,
      crates: { locked: 0, elite: 3, military: 8, normal: 10, diesel: 0 },
      utilities: ['Recycler'],
      steps: [
        'Bring 1x Green + 1x Blue + 1x Red Keycard + 1x Fuse + 25% Rad Protection + Meds/Weapon for Tunnel Scientists.',
        'Insert 1x Fuse in the mine-cart side room -> Swipe Green Card (gives Blue Card + flips main power switch).',
        'Head to the center train car -> Swipe Blue Card -> Swipe Red Card inside to loot 3x Elite Crates + Military Crates!'
      ]
    },
    {
      id: 'missile_silo',
      name: 'Nuclear Missile Silo',
      tier: 3,
      biome: 'Snow / Temperate',
      defaultPos: { x: 0.50, y: 0.22, grid: 'N6' },
      cardsNeeded: ['Blue'],
      cardsFound: ['Red'],
      fusesNeeded: 1,
      radRequired: '25%',
      respawnMin: 30,
      crates: { locked: 0, elite: 2, military: 7, normal: 10, diesel: 3 },
      utilities: ['Recycler'],
      steps: [
        'Bring 1x Blue Keycard + 1x Fuse + 25% Rad Protection + Gun/Ammo for Silo Scientists.',
        'Insert Fuse on the surface building and swipe Blue Card on the giant missile hatch.',
        'Fight down the 5 underground floors to the warhead room for Elite Crates + Red Card, then exit via elevator.'
      ]
    },
    {
      id: 'small_oil_rig',
      name: 'Small Oil Rig',
      tier: 3,
      biome: 'Ocean (West)',
      defaultPos: { x: 0.06, y: 0.45, grid: 'B12' },
      cardsNeeded: ['Blue', 'Red'],
      cardsFound: ['Green', 'Blue'],
      fusesNeeded: 1,
      radRequired: '0%',
      respawnMin: 35,
      crates: { locked: 1, elite: 1, military: 4, normal: 6, diesel: 5 },
      utilities: ['Locked Chinook Crate', 'Heavy Scientists'],
      steps: [
        'Bring 1x Blue Keycard + 1x Red Keycard + 1x Electric Fuse (Green Card spawns on desk).',
        'Clear ~16 Blue Scientists across levels 1–4.',
        'Insert 1x Fuse on the top level for the Blue Card room (Elite/Military crates).',
        'Swipe Red Card on the top helipad room to start the 15-minute Locked Crate & call in 6x Heavy Scientists!'
      ]
    },
    {
      id: 'large_oil_rig',
      name: 'Large Oil Rig',
      tier: 3,
      biome: 'Ocean (East)',
      defaultPos: { x: 0.94, y: 0.25, grid: 'Z7' },
      cardsNeeded: ['Green', 'Blue', 'Red'],
      cardsFound: ['Green'],
      fusesNeeded: 1,
      radRequired: '0%',
      respawnMin: 35,
      crates: { locked: 1, elite: 3, military: 6, normal: 10, diesel: 8 },
      utilities: ['Locked Chinook Crate', 'Heavy Scientists'],
      steps: [
        'Bring 1x Green + 1x Blue + 1x Red Keycard + 1x Electric Fuse.',
        'Clear ~23 Blue Scientists.',
        'Insert 1x Fuse on Level 4 -> Swipe Blue Card on Level 4 or Level 6 for 3x Elite Crates.',
        'Swipe Red Card on the top level to unlock the 15-minute Locked Crate & fight 10x Heavy Scientists.'
      ]
    }
  ],

  // =========================================================================
  // 4. MONUMENT & EVENT TIMER PRESETS
  // =========================================================================
  timerPresets: [
    { id: 'small_rig_hack', name: 'Small Oil Rig — Crate Hack', category: 'Hack (15m)', durationSec: 15 * 60, color: '#ef4444' },
    { id: 'large_rig_hack', name: 'Large Oil Rig — Crate Hack', category: 'Hack (15m)', durationSec: 15 * 60, color: '#ef4444' },
    { id: 'chinook_hack', name: 'Chinook CH47 — Crate Hack', category: 'Hack (15m)', durationSec: 15 * 60, color: '#f97316' },
    { id: 'small_rig_respawn', name: 'Small Oil Rig — Respawn', category: 'Respawn', durationSec: 35 * 60, color: '#3b82f6' },
    { id: 'large_rig_respawn', name: 'Large Oil Rig — Respawn', category: 'Respawn', durationSec: 35 * 60, color: '#3b82f6' },
    { id: 'bradley_respawn', name: 'Bradley APC — Respawn', category: 'Respawn', durationSec: 60 * 60, color: '#eab308' },
    { id: 'bradley_fire', name: 'Bradley Crates — Fire Cooldown', category: 'Cooldown', durationSec: 5 * 60, color: '#f97316' },
    { id: 'cargo_active', name: 'Cargo Ship — Active Duration', category: 'Event', durationSec: 50 * 60, color: '#22c55e' },
    { id: 'heli_respawn', name: 'Patrol Helicopter — Window', category: 'Respawn', durationSec: 120 * 60, color: '#a855f7' },
    { id: 'launch_puzzle', name: 'Launch Site — Puzzle Reset', category: 'Puzzle (30m)', durationSec: 30 * 60, color: '#ef4444' },
    { id: 'miltuns_puzzle', name: 'Military Tunnels — Puzzle Reset', category: 'Puzzle (30m)', durationSec: 30 * 60, color: '#ef4444' },
    { id: 'train_puzzle', name: 'Train Yard — Puzzle Reset', category: 'Puzzle (30m)', durationSec: 30 * 60, color: '#3b82f6' },
    { id: 'water_puzzle', name: 'Water Treatment — Puzzle Reset', category: 'Puzzle (30m)', durationSec: 30 * 60, color: '#3b82f6' },
    { id: 'sewer_puzzle', name: 'Sewer Branch — Puzzle Reset', category: 'Puzzle (30m)', durationSec: 30 * 60, color: '#22c55e' }
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
    X: { code: 'X', name: 'Empty Slot', type: 'bad', weight: 0.9, color: '#ef4444', desc: 'BAD GENE (Weight 0.9): Provides zero benefit' }
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
