# Naval Tactical Simulator

**SIM REV 1.0 // NON CLASSIFICATO // SOLO USO DIMOSTRATIVO**

Simulatore tattico navale browser-based, interamente fittizio, ispirato a documentari, film e serie TV militari. Progetto portfolio che dimostra la gestione di interfacce dati complesse in real-time e una verosimiglianza tecnica costruita su un background operativo reale.

> Tutti i dati, le coordinate, i nomi delle unità e gli scenari sono **interamente fittizi**. Nessun dato classificato o operativo reale è stato utilizzato. Il progetto è a scopo dimostrativo e culturale.

---

## Demo Live

[Apri su GitHub Pages →](https://bloodhound82.github.io/naval-tactical-simulator/)

---

## Avvio rapido in locale

Non è richiesto nessun build step. Clona e apri direttamente nel browser:

```bash
git clone https://github.com/BloodHound82/naval-tactical-simulator.git
cd naval-tactical-simulator
# Apri index.html in qualsiasi browser moderno (Chrome, Firefox, Edge)
# Oppure servi con: npx serve .
```

---

## Funzionalità

- **Display Radar PPI** — Plan Position Indicator circolare stile CRT fosfor verde, con sweep animato, eco dei contatti, range rings e clutter simulato
- **Mappa Tattica Interattiva** — Canvas con griglia di navigazione, toggle layer (superficie / sub-surface / aria), assegnazione waypoint e vettori velocità
- **Threat Assessment Board** — Classificazione contatti in tempo reale (UNKNOWN → NEUTRAL / SUSPECT / HOSTILE), rilevamento CBDR e calcolo CPA
- **COMMS Log** — Feed messaggi radio simulati in formato Naval Message con DTG, generati automaticamente dagli eventi di scenario
- **Due scenari giocabili**:
  - *SCENARIO ALPHA* — Pattugliamento di routine con contatto sconosciuto da classificare
  - *SCENARIO BRAVO* — Scorta convoglio con minaccia sub-surface

---

## Guida ai comandi

### Schermata di selezione scenario

All'avvio (`index.html`) vengono presentati i due scenari disponibili. Clicca **LOAD SCENARIO** sulla card corrispondente per entrare nel simulatore.

---

### Interfaccia principale

L'interfaccia è divisa in tre colonne: pannello sinistro (unità), area centrale (mappa + radar), pannello destro (threat board + comms).

#### Header — Barra di controllo superiore

| Controllo | Funzione |
|---|---|
| **PAUSE** | Mette in pausa la simulazione (engine loop e avanzamento tempo si fermano) |
| **RESUME** | Riprende la simulazione dalla pausa |
| **1x / 2x / 5x** | Modifica la velocità di avanzamento del tempo simulato (1 secondo reale = N secondi simulati) |
| **ABORT** | Interrompe lo scenario e torna alla schermata di selezione |
| **SIM TIME** | Timer del tempo simulato trascorso (formato HH:MM:SS) |
| **Stato scenario** | Badge che indica lo stato corrente: `RUNNING`, `PAUSED`, `VICTORY`, `DEFEAT` |

---

#### Pannello sinistro — Unità Amiche

Mostra le schede di tutte le unità friendly dello scenario.

| Elemento | Descrizione |
|---|---|
| **Designatore** | Codice NATO dell'unità (es. `Whiskey-01`, `Alfa-01`) |
| **Nome unità** | Denominazione della nave/elicottero (es. `FNS ADRIATICO`) |
| **Badge stato** | `NOMINAL` (operativa) · `DEGRADED` (limitata) · `OFFLINE` (fuori servizio) |
| **Barra carburante** | Livello fuel in percentuale (verde >50%, giallo 20–50%, rosso <20%) |
| **Rotta / Velocità** | Course in gradi veri (0–360°) e velocità in nodi |
| **Sensori** | Indicatori sensori attivi: `RDR` (radar), `SON-P` (sonar passivo), `SON-A` (sonar attivo) |

**Interazione:**
- **Click su una card** → seleziona l'unità; la selezione si riflette sulla mappa tattica con evidenziazione

---

#### Area centrale — Mappa Tattica

Canvas in alto nella colonna centrale. Rappresenta la situazione tattica in vista dall'alto (top-down).

**Controlli layer (barra sopra la mappa):**

| Bottone | Layer attivato/disattivato |
|---|---|
| **SURF** | Unità e contatti di superficie (default: attivo) |
| **SUB** | Contatti sub-surface / sommergibili |
| **AIR** | Unità aeree / elicotteri |
| **Recenter** | Ricentra la vista sulla mappa |

**Elementi visualizzati:**
- **Cerchi colorati** — unità friendly (blu `#00aaff`) e contatti radar per classificazione
- **Vettori velocità** — linea tratteggiata che proietta la posizione futura a 5 minuti
- **Waypoint** — croce animata pulsante nel punto di destinazione assegnato
- **Breadcrumb** — traccia storica della rotta dei contatti (ultimi N punti)
- **Bussola** — angolo in alto a destra, orientata Nord
- **Barra scala** — in basso a sinistra, indica la distanza in NM fittizi
- **Coordinate cursore** — in alto a sinistra, aggiornate in tempo reale al movimento del mouse

**Interazione mouse:**
- **Click su un'unità friendly** → seleziona l'unità (evidenziata con bordo `border-active`)
- **Click su mappa (con unità selezionata)** → assegna un waypoint: l'unità inizia a muoversi verso quel punto con interpolazione lineare

---

#### Area centrale — Display Radar PPI

Canvas in basso nella colonna centrale. Riproduce un Plan Position Indicator circolare stile CRT.

**Selettore di portata (sotto il display):**

| Bottone | Portata visualizzata |
|---|---|
| **10 NM** | Range ravvicinato — alta risoluzione area locale |
| **20 NM** | Range medio |
| **40 NM** | Range massimo — quadro tattico generale |

**Elementi del display:**
- **Sweep verde** — raggio rotante a 6 RPM (un giro completo ogni 10 secondi simulati)
- **Range rings** — cerchi concentrici a 5, 10, 20, 40 NM
- **Blip contatti** — punti luminosi con trail (ultime 5 posizioni), colorati per classificazione
- **Clutter** — rumore di fondo procedurale per realismo visivo
- **Fade** — i contatti senza eco scompaiono progressivamente dopo 3 sweep

**Colori classificazione contatti:**

| Colore | Classificazione |
|---|---|
| Blu `#00aaff` | FRIENDLY — unità amica |
| Giallo `#ffaa00` | UNKNOWN — non ancora classificato |
| Grigio `#aaaaaa` | NEUTRAL — traffico civile/non minaccioso |
| Rosso `#ff4444` | HOSTILE — minaccia confermata |

**Barra informazioni (sotto il display):**
Mostra i dati del track selezionato: **Track ID** · **Bearing** (gradi veri) · **Range** (NM) · **Classificazione**

**Interazione mouse:**
- **Click su un blip** → seleziona il track; i dati appaiono nella barra info e il contatto viene evidenziato nel Threat Board

---

#### Pannello destro — Threat Board

Tabella aggiornata in tempo reale con tutti i contatti radar tracciati.

| Colonna | Contenuto |
|---|---|
| **Track ID** | Identificatore progressivo del contatto (es. `Track-1042`) |
| **Class** | Classificazione attuale del contatto |
| **BRG** | Bearing in gradi veri rispetto all'origine del radar |
| **RNG** | Range in NM |
| **CPA** | Closest Point of Approach — distanza minima prevista rispetto all'unità più vicina |

- Le righe con contatti **HOSTILE** vengono evidenziate con sfondo rosso semi-trasparente e animazione blink
- **Click su una riga** → seleziona il contatto sul radar e sulla mappa

---

#### Pannello destro — COMMS Log

Feed testuale dei messaggi radio simulati. Si aggiorna automaticamente durante la simulazione in risposta agli eventi di scenario e ai cambi di classificazione dei contatti.

Formato dei messaggi (Naval Message fittizio):
```
DTG: 12/1430 Z MAY 26
FROM: COMSTANAVFORMED
TO: CTG 1.2
PRECEDENCE: ROUTINE

INTEL UPDATE: SIERRA CONTACT BEARING 045 RANGE 28NM.
CLASSIFICATION: UNKNOWN. CONTINUE TRACK. REPORT CPA.
```

I messaggi con precedenza **FLASH** hanno un bordino rosso a sinistra; quelli **IMMEDIATE** un bordino arancione.

---

#### Footer — Barra di stato

| Campo | Descrizione |
|---|---|
| **TRACKS** | Numero totale di contatti radar attivi |
| **ALERTS** | Numero di alert attivi (es. CBDR rilevato) |
| **EMCON** | Stato emission control corrente (es. `DELTA`) |
| **TIME SCALE** | Moltiplicatore velocità simulazione attivo |
| **SYS** | Stato sistema (`ONLINE` / `OFFLINE`) |

---

### Schermata di fine scenario

Al termine dello scenario (vittoria o sconfitta) appare una finestra modale con:

- **Titolo** — `MISSION COMPLETE` (verde) o `MISSION FAILED` (rosso)
- **Statistiche** — tempo trascorso, contatti classificati, contatti ostili, esito
- **RETURN TO MENU** — torna alla selezione scenario
- **DEBRIEF** — non disponibile nell'MVP

---

## Terminologia

| Termine | Significato |
|---|---|
| **PPI** | Plan Position Indicator — il display circolare del radar |
| **Track** | Contatto identificato e tracciato nel tempo |
| **CBDR** | Constant Bearing Decreasing Range — rotta di collisione |
| **CPA** | Closest Point of Approach — punto di massima avvicinamento |
| **EMCON** | Emission Control — silenzio radio/radar |
| **DTG** | Date-Time Group — timestamp formato NATO (es. `12/1430 Z MAY 26`) |
| **Whiskey** | Designatore contatto di superficie |
| **Sierra** | Designatore contatto sub-surface |
| **Alfa** | Designatore contatto aereo |
| **Bearing** | Direzione in gradi veri (0–360°), mai destra/sinistra |
| **NM** | Nautical Miles — miglia nautiche (fittizi in questo simulatore) |

---

## Stack tecnico

| Layer | Tecnologia |
|---|---|
| Rendering | HTML5 Canvas 2D API |
| UI/Layout | HTML5 + CSS custom + Tailwind CDN (solo layout) |
| Logica | Vanilla JavaScript — architettura event-driven, zero framework |
| Dati | File JSON statici (fittizi) |
| Deploy | GitHub Pages — nessun build step, nessun backend |

L'architettura JS è **event-driven**: tutti i moduli comunicano esclusivamente tramite un `EventBus` centralizzato. Nessun modulo chiama direttamente un altro.

---

## Struttura del repository

```
naval-tactical-simulator/
├── index.html              # Schermata selezione scenario
├── simulator.html          # Interfaccia principale simulatore
├── assets/
│   ├── css/
│   │   ├── main.css        # Design system e CSS variables
│   │   ├── radar.css       # Stili display PPI radar
│   │   ├── map.css         # Stili mappa tattica
│   │   └── hud.css         # Stili pannelli HUD laterali
│   ├── js/
│   │   ├── core/
│   │   │   ├── engine.js   # Game loop, tick system
│   │   │   ├── state.js    # State management centrale
│   │   │   └── events.js   # Event bus
│   │   ├── modules/
│   │   │   ├── radar.js    # PPI sweep, gestione track
│   │   │   ├── map.js      # Canvas map, movimento unità
│   │   │   ├── units.js    # Logica unità, stato
│   │   │   ├── scenarios.js # Loader scenari e logica
│   │   │   ├── comms.js    # Generatore COMMS log
│   │   │   └── threat.js   # Threat assessment (CPA, CBDR)
│   │   └── utils/
│   │       ├── coords.js   # Utility coordinate
│   │       └── dtg.js      # Formattatore Date-Time Group
│   └── data/
│       ├── scenario-alpha.json
│       └── scenario-bravo.json
├── PRD.md
└── CLAUDE.md
```

---

## Autore

**Andrea De Ovidiis**
Ex Radar Operator e Weapons Director, Marina Militare Italiana

- [LinkedIn](https://linkedin.com/in/andreadeovidiis)
- [GitHub](https://github.com/BloodHound82)

---

## Disclaimer

Questo progetto è una simulazione fittizia a scopo dimostrativo e culturale. Non contiene, rappresenta né divulga alcuna informazione classificata, operativa o sensibile. Ispirato a fiction e documentari di dominio pubblico. Conforme al D.Lgs. 165/2001 art. 53 in quanto attività extralavorativa a carattere culturale/hobbistico senza conflitto di interessi.

---

*"La differenza tra fiction e realtà è che la fiction deve essere plausibile." — Tom Clancy*
