# CLAUDE.md — Naval Tactical Simulator
**Istruzioni operative per agenti Claude Code**
**Progetto:** Naval Tactical Simulator (NTS)
**Maintainer:** Andrea De Ovidiis

---

## Contesto del Progetto

Stai lavorando su **Naval Tactical Simulator**, un simulatore tattico navale browser-based, interamente fittizio, ispirato a film e documentari militari. Il progetto è un portfolio piece ad alto impatto visivo e tecnico.

L'autore ha un background reale come radar operator e weapons director nella Marina Militare Italiana. Questo significa che la **verosimiglianza tecnica è un requisito non negoziabile**, non un nice-to-have. Ogni decisione di design e naming deve rispettare la plausibilità operativa — anche se tutto è fiction.

**IMPORTANTE:** Nessun dato operativo, tattico o classificato reale viene usato o deve essere usato. Tutto è fittizio. Se hai dubbi su un termine o scenario, scegli sempre la versione più generica/pubblica.

---

## Struttura del Repository

```
naval-tactical-simulator/
├── index.html              # Entry point — schermata selezione scenario
├── simulator.html          # Interfaccia principale simulatore
├── assets/
│   ├── css/
│   │   ├── main.css        # Design system base, CSS variables
│   │   ├── radar.css       # Stili specifici PPI radar display
│   │   ├── map.css         # Stili mappa tattica
│   │   └── hud.css         # Stili pannelli HUD laterali
│   ├── js/
│   │   ├── core/
│   │   │   ├── engine.js       # Game loop, tick system
│   │   │   ├── state.js        # State management centrale
│   │   │   └── events.js       # Event bus
│   │   ├── modules/
│   │   │   ├── radar.js        # PPI sweep, track management
│   │   │   ├── map.js          # Canvas map, unit movement
│   │   │   ├── units.js        # Unit logic, status
│   │   │   ├── scenarios.js    # Scenario loader e logic
│   │   │   ├── comms.js        # COMMS log generator
│   │   │   └── threat.js       # Threat assessment logic
│   │   └── utils/
│   │       ├── coords.js       # Coordinate utilities
│   │       └── dtg.js          # Date-Time Group formatter
│   └── data/
│       ├── scenario-alpha.json
│       └── scenario-bravo.json
├── PRD.md
├── CLAUDE.md               # Questo file
└── README.md
```

---

## Stack Tecnologico

- **HTML5 + CSS3 + Vanilla JavaScript** — zero framework, zero build step
- **Tailwind CDN** — solo per layout macro (grid, flex, spacing utility)
- **HTML5 Canvas** — per radar PPI e mappa tattica
- **requestAnimationFrame** — per il game loop
- **JSON statici** — per i dati degli scenari
- **Nessun backend** — tutto client-side, deployabile su GitHub Pages

### Dipendenze esterne permesse (CDN)
```html
<!-- Tailwind -->
<script src="https://cdn.tailwindcss.com"></script>
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700&display=swap" rel="stylesheet">
```

Non aggiungere altre dipendenze senza approvazione esplicita.

---

## Principi di Sviluppo

### 1. Verosimiglianza Tecnica Prima di Tutto
- Usa terminologia navale corretta (PPI, Track, CBDR, CPA, EMCON, etc.)
- I contatti radar si chiamano **Track** + numero progressivo (es. `Track-1042`)
- I messaggi COMMS usano formato DTG realistico: `DD/HHMM Z MMM YY`
- Le unità surface si designano **Whiskey**, sub-surface **Sierra**, aeree **Alfa**
- Le coordinate usano gradi decimali o un sistema fittizio coerente
- I bearing sono sempre in gradi veri (0–360), mai "destra/sinistra"

### 2. Design System — Mai Deviare
```css
:root {
  --bg-primary:     #0a0e14;
  --bg-secondary:   #0f1520;
  --bg-panel:       #1a2332;
  --bg-panel-hover: #2a3f5f;

  --radar-green:    #00ff41;
  --radar-dim:      #003d0f;
  --radar-sweep:    rgba(0, 255, 65, 0.15);

  --friendly:       #00aaff;
  --unknown:        #ffaa00;
  --hostile:        #ff4444;
  --neutral:        #aaaaaa;

  --text-primary:   #c8d8e8;
  --text-secondary: #7a9ab8;
  --text-data:      #00ff41;
  --text-alert:     #ff4444;

  --border:         #2a3f5f;
  --border-active:  #00aaff;

  --font-display:   'Orbitron', monospace;
  --font-data:      'Share Tech Mono', monospace;
}
```

**Non usare mai colori hardcoded.** Sempre CSS variables.

### 3. Architettura JavaScript

Il progetto usa un **event-driven pattern** con un bus centralizzato:

```javascript
// events.js — event bus globale
const EventBus = {
  listeners: {},
  on(event, callback) { ... },
  emit(event, data) { ... },
  off(event, callback) { ... }
};

// Esempio di uso tra moduli
EventBus.emit('track:classified', { trackId: 'Track-1042', classification: 'HOSTILE' });
EventBus.on('track:classified', ({ trackId, classification }) => { ... });
```

I moduli **non si chiamano direttamente**. Comunicano solo tramite EventBus.

### 4. State Management

Lo stato globale è in `state.js` come oggetto immutabile con funzione di update:

```javascript
const State = {
  scenario: null,           // scenario corrente
  units: [],                // unità friendly
  tracks: [],               // contatti radar
  time: 0,                  // secondi simulati dall'inizio
  alerts: [],               // alert attivi
  commsLog: [],             // messaggi COMMS
  scenario_status: 'RUNNING' // RUNNING | VICTORY | DEFEAT | PAUSED
};
```

---

## Moduli — Specifiche di Comportamento

### `radar.js` — PPI Display
- Il sweep ruota a **6 RPM** (un giro ogni 10 secondi simulati)
- Ogni track ha: `bearing`, `range`, `speed`, `course`, `classification`
- I track scompaiono dopo **3 sweep** senza eco (fade progressivo)
- Il clutter è generato proceduralmente (Perlin noise semplificato)
- Range rings: 5, 10, 20, 40 NM (nautical miles, fittizi)

### `map.js` — Mappa Tattica
- Griglia 20x20 con cella = 10 NM fittizi
- Layer separati: superficie, sub-surface, aerea (toggle)
- Unità si muovono con interpolazione lineare tra waypoints
- Click su unità → apre unit panel laterale
- Click su mappa (con unità selezionata) → assegna waypoint

### `scenarios.js` — Caricamento Scenari
```javascript
// Struttura JSON scenario
{
  "id": "alpha",
  "name": "SCENARIO ALPHA — Contatto Sconosciuto",
  "briefing": "...",
  "duration_minutes": 30,
  "units": [...],
  "initial_tracks": [...],
  "events": [
    { "at_second": 120, "type": "track_spawn", "data": {...} },
    { "at_second": 300, "type": "comms_message", "data": {...} }
  ],
  "victory_conditions": [...],
  "defeat_conditions": [...]
}
```

### `comms.js` — COMMS Log
Formato messaggi:
```
// Formato standard Naval Message (fittizio)
DTG: 142345Z MAY 26
FROM: COMSTANAVFORMED
TO: CTG 1.2
PRECEDENCE: ROUTINE

INTEL UPDATE: SIERRA CONTACT BEARING 045 RANGE 28NM
CLASSIFICATION: UNKNOWN. CONTINUE TRACK. REPORT CPA.
```

I messaggi si generano in risposta agli eventi di scenario e agli stati delle unità.

---

## Cosa NON Fare

- ❌ Non usare framework UI (React, Vue, ecc.) — vanilla JS only
- ❌ Non hardcodare colori — solo CSS variables
- ❌ Non inventare terminologia navale non standard — chiedi prima
- ❌ Non usare dati geografici reali — tutto fittizio
- ❌ Non simulare sistemi d'arma reali con dettagli operativi
- ❌ Non aggiungere feature non nel PRD senza approvazione
- ❌ Non rompere la struttura dei file senza motivo documentato
- ❌ Non usare `alert()`, `confirm()` o `prompt()` nativi — UI custom sempre
- ❌ Non fare commit con `console.log` di debug lasciati nel codice

---

## Agenti Disponibili

Il progetto usa tre agenti specializzati definiti a livello globale in Claude Code:

| Agente | Responsabilità |
|---|---|
| `senior-dev` | Architettura JS, logica engine, state management, moduli core |
| `ui-designer` | CSS, canvas styling, animazioni, design system, layout |
| `beta-tester` | Test funzionali, edge cases, UX review, bug report |

Ogni agente lavora sulla propria area senza sovrascrivere il lavoro degli altri. In caso di conflitto, `senior-dev` ha l'ultima parola sull'architettura.

---

## Convenzioni di Codice

### JavaScript
```javascript
// Nomi funzioni: camelCase, verbo + sostantivo
function updateTrackPosition(trackId, bearing, range) { ... }
function renderRadarSweep(ctx, angle) { ... }

// Costanti: UPPER_SNAKE_CASE
const MAX_TRACK_AGE_SWEEPS = 3;
const RADAR_RPM = 6;

// Commenti: inglese tecnico (è un portfolio internazionale)
// Track classification workflow: UNKNOWN → NEUTRAL | SUSPECT | HOSTILE
```

### CSS
```css
/* BEM-like per componenti custom */
.radar__display { }
.radar__sweep { }
.radar__track--hostile { }
.unit-panel { }
.unit-panel__status--degraded { }
```

### Commit messages
```
feat(radar): add track fade-out after 3 sweeps
fix(map): correct bearing calculation at 359°
style(hud): align threat panel with design system
docs: update CLAUDE.md with comms message format
```

---

## Avvio Rapido per Nuovi Agenti

1. Leggi integralmente `PRD.md` prima di scrivere una riga
2. Controlla la struttura directory in `CLAUDE.md` (questo file)
3. Non toccare file fuori dalla tua area di competenza
4. Se un requisito non è nel PRD, chiedi prima di implementarlo
5. Testa sempre su viewport 1440px (desktop primary) e 768px (tablet secondary)
6. Il progetto non ha mobile support nell'MVP — non ottimizzare per mobile

---

*"Simplicity is the ultimate sophistication — anche in guerra."*
*— liberamente adattato da Leonardo da Vinci, probabilmente.*
