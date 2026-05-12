# PRD — Naval Tactical Simulator
**Product Requirements Document**
**Versione:** 1.0
**Autore:** Andrea De Ovidiis
**Data:** Maggio 2026
**Status:** Draft

---

## 1. Vision & Rationale

Un simulatore tattico navale browser-based, interamente fittizio e ispirato a documentari, film e serie TV militari (think: *The Hunt for Red October*, *Below Deck Military*, documentari NATO). Il progetto sfrutta il background tecnico reale dell'autore come radar operator e weapons director per produrre una verosimiglianza tecnica che nessun developer "di stanza" potrebbe replicare.

**Questo non è un clone di giochi esistenti.** È un portfolio piece ad alto impatto che dimostra:
- Padronanza di interfacce dati complesse e real-time
- Conoscenza autentica della terminologia e logica operativa navale
- Capacità di tradurre domain knowledge militare in UX civile comprensibile
- Front-end engineering di livello professionale

---

## 2. Target Audience (Portfolio Context)

| Audience | Interesse Primario |
|---|---|
| Recruiter tech / CTO | Full-stack complexity, UI/UX quality |
| Cliente freelance | Creatività applicata, problem solving |
| Community dev (GitHub, LinkedIn) | Originalità, storytelling tecnico |
| Altri sviluppatori | Codice pulito, architettura scalabile |

---

## 3. Scope — MVP

### 3.1 Feature Core

#### 🗺️ Mappa Tattica Interattiva
- Canvas o SVG-based con griglia di navigazione tipo plotter navale
- Settori operativi identificati (patrol zone, restricted area, threat corridor)
- Coordinate in formato NATO (MGRS-like fittizio o gradi decimali)
- Layer toggling: superficie / sub-surface / aerea
- Scala visiva e bussola

#### 📡 Radar Display (PPI Simulation)
- Plan Position Indicator (PPI) circolare, stile CRT verde su nero
- Sweep animation con eco radar per i contatti
- Contatti classificati: FRIENDLY / UNKNOWN / HOSTILE
- Parametri visualizzati: bearing, range, track (velocity vector)
- Noise e clutter simulati per realismo visivo

#### 🚢 Gestione Unità
- Flotta fissa di 3–5 unità (surface combatant, submarine, helo)
- Ogni unità ha: stato operativo, fuel, sensori attivi/passivi, armi (display only)
- Movement orders tramite click su mappa
- Status panel laterale per ciascuna unità

#### 📋 Scenari di Pattugliamento
- Almeno 2 scenari selezionabili all'avvio:
  - **SCENARIO ALPHA**: Pattugliamento di routine in area ristretta con contatto sconosciuto
  - **SCENARIO BRAVO**: Scorta convoglio con minaccia sub-surface simulata
- Ogni scenario ha obiettivi definiti, timer e condizioni di vittoria/fallimento

#### 🎯 Threat Assessment Panel
- Lista contatti aggiornata dinamicamente
- Classification workflow: UNKNOWN → NEUTRAL / SUSPECT / HOSTILE
- Alerting visivo e sonoro su cambio classificazione
- Track history per ciascun contatto (breadcrumb sul radar)

#### 📻 COMMS Log (flavour + funzionale)
- Feed testuale simulante messaggi radio intercettati / ordini ricevuti
- Formato NAVAL MESSAGE realistico (DTG, FROM/TO, precedence)
- Aggiornato automaticamente durante la simulazione

### 3.2 Feature Extra (Post-MVP)
- Modalità Tutorial con overlay esplicativi
- Export briefing scenario (PDF/screenshot)
- Leaderboard scenari (localStorage)
- Dark/Green CRT mode toggle
- Sound design: sonar ping, radio crackle, GQ alarm

---

## 4. Technical Stack

| Layer | Tecnologia |
|---|---|
| Rendering mappa | HTML5 Canvas + custom JS |
| Radar display | Canvas 2D API con requestAnimationFrame |
| UI/Layout | HTML5 + CSS custom (no framework UI) |
| Styling | Tailwind CDN per layout macro, CSS custom per componenti tattici |
| State management | Vanilla JS con event-driven architecture (no framework pesante) |
| Dati scenario | JSON statici (fittizi, nessun dato reale) |
| Build/Deploy | Nessun build step — static site deployabile su GitHub Pages |

> **Nota architetturale:** Nessun backend. Zero. Tutto client-side. Massima portabilità, zero dipendenze runtime. Questo è un portfolio piece, non un SaaS.

---

## 5. Design Direction

### Palette
- Background: `#0a0e14` (nero tattico)
- Radar CRT: `#00ff41` (phosphor green)
- Friendly units: `#00aaff` (NATO blue)
- Hostile/Unknown: `#ff4444` / `#ffaa00`
- UI chrome: `#1a2332` + `#2a3f5f`
- Testo: `#c8d8e8` (grigio chiaro militare)

### Typography
- Display/Header: `Share Tech Mono` o `Orbitron` — look schermo di bordo
- Body/Data: `JetBrains Mono` — leggibilità dati
- Evitare assolutamente: Inter, Roboto, qualsiasi cosa che sembri un SaaS B2B

### Tono visivo
Military HUD, non videogame arcade. Ispirazione: schermi COGIC, plotters degli anni '90, interfacce NATO declassificate su Wikipedia. Qualcosa che un operatore riconoscerebbe come "plausibile" anche se ovviamente fittizio.

---

## 6. Terminologia Tecnica Usata nel Progetto

Per mantenere la verosimiglianza senza rivelare nulla di operativo reale:

| Termine Usato | Significato (per documentazione) |
|---|---|
| **PPI** | Plan Position Indicator — il display circolare del radar |
| **Track** | Contatto identificato e tracciato nel tempo |
| **CBDR** | Constant Bearing Decreasing Range — rotta di collisione |
| **CPA** | Closest Point of Approach |
| **EMCON** | Emission Control — silenzio radio/radar |
| **NTDS** | Naval Tactical Data System — sistema di condivisione dati (fittizio) |
| **HOB** | Height of Burst (solo flavour text) |
| **OSCAR** | Man Overboard signal (NATO phonetic) |
| **Sierra** | Designatore contatto sub-surface |
| **Whiskey** | Designatore surface contact |

Tutti i dati, coordinate, nomi di unità e scenari sono **interamente fittizi**. Nessun dato operativo reale è stato utilizzato o sarà utilizzato.

---

## 7. Metriche di Successo (Portfolio)

- ⭐ Stars su GitHub: obiettivo 50+ nel primo mese
- 💼 Menzioni su LinkedIn post di lancio: 500+ impressioni
- 🔗 Link nel portfolio principale come "progetto di punta"
- 📊 Utilizzo come case study in pitch a clienti freelance
- 🎓 Candidatura a borse/premi open source (categoria: creative coding)

---

## 8. Vincoli e Disclaimer

- **Nessun dato classificato o operativo reale** è presente nel progetto
- Il simulatore è **puramente fittizio** e a scopo dimostrativo/educativo
- Ispirazione dichiarata: film, documentari e fiction navale pubblica
- Non simula sistemi d'arma reali, né tattiche operative riservate
- Il progetto è conforme alle normative sul lavoro dipendente pubblico italiano (D.Lgs. 165/2001 art. 53) in quanto attività extralavorativa a carattere culturale/hobbistico non in conflitto di interessi

---

## 9. Timeline Indicativa

| Fase | Durata stimata | Output |
|---|---|---|
| Setup progetto + struttura HTML | 1 settimana | Repo, layout base, design system |
| Mappa interattiva + unità | 2 settimane | Canvas map funzionale |
| Radar PPI | 1 settimana | Radar sweep + contatti |
| Scenari + logica di gioco | 2 settimane | 2 scenari giocabili |
| COMMS log + polish | 1 settimana | UX finale, bug fix |
| **Deploy + LinkedIn launch** | 1 giorno | GitHub Pages live |

**Totale MVP stimato: 7 settimane** (ritmo part-time, sera/weekend)

---

*"La differenza tra fiction e realtà è che la fiction deve essere plausibile."*
*— Tom Clancy*
