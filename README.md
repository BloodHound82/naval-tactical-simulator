# Naval Tactical Simulator

**SIM REV 1.0 // UNCLASSIFIED // EXERCISE ONLY**

A browser-based naval tactical simulator inspired by military documentaries and fiction. Built as a portfolio piece to demonstrate real-time data interface engineering and authentic naval domain knowledge.

> All data, coordinates, unit names, and scenarios are **entirely fictional**. No classified or operational data was used. This is a portfolio/hobby project for educational and creative purposes only.

---

## Live Demo

[GitHub Pages →](https://andreadeovidiis.github.io/naval-tactical-simulator/)

---

## Features

- **PPI Radar Display** — Plan Position Indicator with sweep animation, track classification, range rings, and simulated clutter
- **Tactical Map** — Interactive canvas map with layer toggles (surface / sub-surface / air), waypoint assignment, and velocity vectors
- **Threat Assessment Board** — Real-time track classification workflow (UNKNOWN → NEUTRAL / SUSPECT / HOSTILE) with CBDR detection
- **COMMS Log** — Naval message feed with realistic DTG format, auto-generated on scenario events
- **Two Playable Scenarios**:
  - *SCENARIO ALPHA* — Routine patrol with unknown contact classification
  - *SCENARIO BRAVO* — Convoy escort with sub-surface threat

---

## Stack

| Layer | Technology |
|---|---|
| Rendering | HTML5 Canvas 2D API |
| UI/Layout | HTML5 + CSS custom + Tailwind CDN (layout only) |
| Logic | Vanilla JavaScript — event-driven architecture, zero frameworks |
| Data | Static JSON scenario files |
| Deploy | GitHub Pages — no build step, no backend |

---

## Architecture

```
naval-tactical-simulator/
├── index.html              # Scenario selection screen
├── simulator.html          # Main simulator interface
├── assets/
│   ├── css/
│   │   ├── main.css        # Design system, CSS variables
│   │   ├── radar.css       # PPI radar display styles
│   │   ├── map.css         # Tactical map styles
│   │   └── hud.css         # HUD lateral panels
│   ├── js/
│   │   ├── core/
│   │   │   ├── engine.js   # Game loop, tick system
│   │   │   ├── state.js    # Central state management
│   │   │   └── events.js   # Event bus
│   │   ├── modules/
│   │   │   ├── radar.js    # PPI sweep, track management
│   │   │   ├── map.js      # Canvas map, unit movement
│   │   │   ├── units.js    # Unit logic, status
│   │   │   ├── scenarios.js # Scenario loader & logic
│   │   │   ├── comms.js    # COMMS log generator
│   │   │   └── threat.js   # Threat assessment
│   │   └── utils/
│   │       ├── coords.js   # Coordinate utilities
│   │       └── dtg.js      # Date-Time Group formatter
│   └── data/
│       ├── scenario-alpha.json
│       └── scenario-bravo.json
```

The JS architecture is **event-driven**: all modules communicate exclusively via a central `EventBus`. No module calls another directly.

---

## Running Locally

No build step required. Clone and open directly in browser:

```bash
git clone https://github.com/andreadeovidiis/naval-tactical-simulator.git
cd naval-tactical-simulator
# Open index.html in any modern browser
# Or serve with: npx serve .
```

---

## Terminology Reference

| Term | Meaning |
|---|---|
| **PPI** | Plan Position Indicator — circular radar display |
| **Track** | Identified and tracked radar contact |
| **CBDR** | Constant Bearing Decreasing Range — collision course |
| **CPA** | Closest Point of Approach |
| **EMCON** | Emission Control — radio/radar silence |
| **Sierra** | Sub-surface contact designator |
| **Whiskey** | Surface contact designator |
| **Alfa** | Air contact designator |
| **DTG** | Date-Time Group — NATO message timestamp format |

---

## Author

**Andrea De Ovidiis**
Former Radar Operator & Weapons Director, Italian Navy

- [LinkedIn](https://linkedin.com/in/andreadeovidiis)
- [Portfolio](https://github.com/andreadeovidiis)

---

## Disclaimer

This project is a fictional simulation for portfolio and educational purposes only. It does not contain, represent, or disclose any classified, operational, or sensitive military information. Inspired by publicly available fiction and documentaries. Compliant with Italian public sector employment regulations (D.Lgs. 165/2001 art. 53) as a non-conflicting cultural/hobby activity.

---

*"La differenza tra fiction e realtà è che la fiction deve essere plausibile." — Tom Clancy*
