/**
 * Scenario Manager.
 * Loads scenario JSON, seeds State.units / State.tracks, schedules events,
 * monitors victory / defeat conditions.
 */
(function (global) {
  'use strict';

  const SCENARIO_PATH = 'assets/data/';

  const ScenarioManager = {
    _scenario: null,
    _pendingEvents: [],
    _firedEvents: new Set(),
    _hostileClassifiedCount: 0,
    _destroyedUnits: new Set()
  };

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  ScenarioManager.load = function load(scenarioId) {
    const url = `${SCENARIO_PATH}scenario-${scenarioId}.json`;
    return fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Scenario fetch failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        ScenarioManager._scenario = data;
        ScenarioManager._pendingEvents = deepClone(data.events || []);
        ScenarioManager._firedEvents = new Set();
        ScenarioManager._hostileClassifiedCount = 0;
        ScenarioManager._destroyedUnits = new Set();

        global.State.update({
          scenario: data,
          units: deepClone(data.units || []),
          tracks: deepClone(data.initial_tracks || []),
          time: 0,
          alerts: [],
          commsLog: [],
          scenario_status: 'RUNNING',
          selectedUnit: null,
          selectedTrack: null
        });

        if (global.Engine && typeof data.timeScale === 'number') {
          global.Engine.setTimeScale(data.timeScale);
        }

        global.EventBus.emit('scenario:loaded', { scenario: data });
        return data;
      });
  };

  ScenarioManager.processEvents = function processEvents(currentTime) {
    const evts = ScenarioManager._pendingEvents;
    for (let i = 0; i < evts.length; i++) {
      const ev = evts[i];
      const key = i + '@' + ev.at_second;
      if (ScenarioManager._firedEvents.has(key)) continue;
      if (currentTime >= ev.at_second) {
        ScenarioManager._firedEvents.add(key);
        fireEvent(ev);
      }
    }
  };

  function fireEvent(ev) {
    global.EventBus.emit('scenario:event', ev);
    global.EventBus.emit('scenario:event:' + ev.type, ev.data);

    // Built-in handling for canonical event types.
    if (ev.type === 'track_spawn' && ev.data) {
      const tracks = global.State.tracks.slice();
      tracks.push(deepClone(ev.data));
      global.State.update({ tracks });
      global.EventBus.emit('track:spawned', ev.data);
    } else if (ev.type === 'track_classify' && ev.data) {
      const tracks = global.State.tracks.map((t) => {
        if (t.id === ev.data.trackId) {
          return Object.assign({}, t, { classification: ev.data.classification });
        }
        return t;
      });
      global.State.update({ tracks });
      global.EventBus.emit('track:classified', {
        trackId: ev.data.trackId,
        classification: ev.data.classification,
        source: 'scenario'
      });
    } else if (ev.type === 'unit_destroyed' && ev.data) {
      ScenarioManager._destroyedUnits.add(ev.data.unitId);
      global.EventBus.emit('unit:destroyed', ev.data);
    }
  }

  ScenarioManager.checkVictoryConditions = function checkVictoryConditions() {
    const sc = ScenarioManager._scenario;
    if (!sc || !sc.victory_conditions) return false;
    const conds = sc.victory_conditions;
    if (conds.length === 0) return false;

    for (let i = 0; i < conds.length; i++) {
      const c = conds[i];
      if (!evaluateVictoryCondition(c)) return false;
    }
    return true;
  };

  function evaluateVictoryCondition(c) {
    if (c.type === 'time_survived') {
      return global.State.time >= c.seconds;
    }
    if (c.type === 'hostile_classified') {
      const count = global.State.tracks.filter((t) => t.classification === 'HOSTILE').length;
      return count >= (c.count || 1);
    }
    if (c.type === 'unit_reaches') {
      const u = global.State.units.find((x) => x.id === c.unitId);
      if (!u) return false;
      const dx = u.x - c.x, dy = u.y - c.y;
      return Math.sqrt(dx * dx + dy * dy) <= (c.tolerance || 10);
    }
    return false;
  }

  ScenarioManager.checkDefeatConditions = function checkDefeatConditions() {
    const sc = ScenarioManager._scenario;
    if (!sc || !sc.defeat_conditions) return false;
    const conds = sc.defeat_conditions;
    for (let i = 0; i < conds.length; i++) {
      const c = conds[i];
      if (evaluateDefeatCondition(c)) return c;
    }
    return false;
  };

  function evaluateDefeatCondition(c) {
    if (c.type === 'unit_destroyed') {
      return ScenarioManager._destroyedUnits.has(c.unitId);
    }
    if (c.type === 'time_limit') {
      return global.State.time >= c.seconds;
    }
    return false;
  }

  // --- Event wiring ---

  global.EventBus.on('engine:tick', function onTick(payload) {
    if (!ScenarioManager._scenario) return;
    if (global.State.scenario_status !== 'RUNNING') return;

    ScenarioManager.processEvents(payload.simTime);

    // Defeat first — defeat trumps victory if both true on same tick.
    const defeat = ScenarioManager.checkDefeatConditions();
    if (defeat) {
      global.State.update({ scenario_status: 'DEFEAT' });
      global.EventBus.emit('scenario:defeat', { reason: defeat });
      return;
    }
    if (ScenarioManager.checkVictoryConditions()) {
      global.State.update({ scenario_status: 'VICTORY' });
      global.EventBus.emit('scenario:victory', { scenario: ScenarioManager._scenario.id });
    }
  });

  global.EventBus.on('unit:destroyed', function (data) {
    if (data && data.unitId) {
      ScenarioManager._destroyedUnits.add(data.unitId);
    }
  });

  global.ScenarioManager = ScenarioManager;
})(window);
