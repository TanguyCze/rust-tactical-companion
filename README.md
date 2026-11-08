# RUST TACTICAL COMPANION — Web App for Pterodactyl Docker

An all-in-one, squad-synced **Rust Tactical Companion** web application designed for self-hosting on a **Pterodactyl Node.js Egg** (or any Docker container).

## Features Included

1. **💥 Raid & Sulfur Optimizer (Raidboi + Combo Engine)**
   - Complete database of Doors, Walls, Windows, Turrets, SAM Sites, Traps, and Deployables.
   - **Sulfur-Saving Mixed Combinations**: Exact mathematical combinations (e.g., `1 Rocket + 8 Explosive 5.56` for Sheet Metal Doors, `2 Rockets + 10 Explosive 5.56` for Garage Doors, `3 C4 + 30 Explosive 5.56` for Sheet Metal Walls, `2 Molotovs = 0 Sulfur` for Wood Doors & SAM Sites, `3 HV Rockets` for Auto Turrets).
   - **Damaged Target / Remaining HP Solver**: Enter any custom remaining HP on a partially splashed wall or door to get the cheapest finish combo.
   - **Multi-Target Squad Raid Planner & Ore Tea Node Calculator**: Queue your full raid path and see exact Sulfur, Charcoal, Gunpowder, Metal Frags, Low Grade Fuel, Pipes, Tech Trash, and exact Sulfur Nodes required (`No Tea`, `Basic +20%`, `Advanced +35%`, `Pure Ore Tea +50%`).

2. **🗺️ Interactive Tactical Map, Monument Keycard/Fuse Atlas & Best Build Spots**
   - Zoomable, pannable tactical map with 26x26 Grid (`A0`–`Z25`), Biomes (Snow, Temperate, Desert, Coast), custom Server Map Image URL support, and toggleable layers:
     - **Monuments & Keycards**: Color-coded by Tier (`Green`, `Blue`, `Red`).
     - **Keycard Progression Flow**: Visual path from Green Card spawns → Blue Card puzzles → Red Card puzzles → Elite Tier 3 monuments.
     - **Farming Node Hotspots**: Sulfur, Metal/HQM, Scrap, and Berry zones.
     - **Best Building Spots Recommender**: Filter by Squad Size (`Solo/Duo`, `Trio/Quad`, `Clan/Zerg`) and Wipe Goal (`Max Sulfur & Raiding`, `Oil Rig / Cargo`, `Fast Scrap`, `Stealth / Anti-Offline`).
     - **Shared Squad Map Pins**: Drop live-synced `🎯 Raid Target`, `🏠 Squad Base`, `⛏️ Farm Spot`, and `⚠️ Roofcamper / Danger` pins.

3. **⏱️ Live Squad-Synced Monument & Event Timers**
   - 1-click timers for **Small/Large Oil Rig 15m Locked Crate**, **Oil Rig 35m Respawn**, **Cargo Ship 50m Event**, **Bradley APC 60m Respawn & 5m Fire Cooldown**, **Patrol Helicopter Window**, **Chinook CH47 15m Crate**, and **30m Monument Puzzle Resets**.
   - Visible across all tabs via the top HUD ticker + synthesized Web Audio API sound alerts at 60s remaining and upon completion.

4. **🌱 Farming, 6-Gene Crossbreeding Solver & Berry Tea Lab**
   - Accurate Rust genetics dominance weights (`G / Y / H = 0.6`, `X = 0.9`, `W = 1.0`).
   - Automatically finds the optimal 2–8 donor clones from your squad's saved clone library and renders a visual **3x3 Large Planter Box diagram** + slot-by-slot dominance table.
   - Full **Berry Tea Mixing Table Reference** (Basic, Advanced, Pure) + **Horse Dung / Compost → Fertilizer → Bandit Camp Scrap Calculator**.

5. **📡 BattleMetrics Raid Intelligence & 24h Population Analyzer**
   - Search any Rust server by name or BattleMetrics Server ID via the built-in backend proxy.
   - Analyzes the 24-hour player population curve to highlight the **🟢 Best Offline Raid Window**, **🟡 Low-Counter Shoulder Window**, and **🔴 Peak Zerg Counter Hours**, plus a dynamic **Raid Method Advisor** and **Enemy Clan Watchlist**.

---

## Deploying on Pterodactyl (Node.js Egg)

1. In your Pterodactyl Panel, create a new server using the **Node.js generic egg** (Node 18, 20, or 22).
2. Upload the contents of this folder (`package.json`, `index.js`, and the `public/` folder) to `/home/container` via SFTP (e.g., WinSCP) or Pterodactyl's File Manager.
3. Set the **Main File / Startup JS File** to:
   ```text
   index.js
   ```
4. Start the server!
   - `index.js` has **zero external npm package dependencies**, so it starts in under 1 second and automatically binds to Pterodactyl's `SERVER_PORT` environment variable.
   - All shared squad data (timers, map pins, raid plans, clones, watchlist) is saved automatically in `/home/container/data/squad-state.json`.
5. *(Optional Environment Variables)*:
   - `SQUAD_PIN`: Set a password/PIN required to modify shared squad timers/pins.
   - `BATTLEMETRICS_TOKEN`: Optional BattleMetrics API token for higher rate limits.
