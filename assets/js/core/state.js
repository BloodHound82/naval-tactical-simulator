/**
 * Central application State.
 * Mutations should go through State.update() so that subscribers
 * receive the 'state:changed' event.
 */
(function (global) {
  'use strict';

  const INITIAL = {
    scenario: null,
    units: [],
    tracks: [],
    time: 0,
    alerts: [],
    commsLog: [],
    scenario_status: 'RUNNING',
    selectedUnit: null,
    selectedTrack: null,
    radarRange: 40,
    activeLayer: 'surface'
  };

  function clone(obj) {
    // Shallow clone is sufficient for the patch + emit semantics.
    return Object.assign({}, obj);
  }

  const State = clone(INITIAL);

  State.update = function update(patch) {
    if (!patch || typeof patch !== 'object') return;
    for (const k in patch) {
      if (Object.prototype.hasOwnProperty.call(patch, k)) {
        State[k] = patch[k];
      }
    }
    if (global.EventBus) {
      global.EventBus.emit('state:changed', { patch, state: State });
    }
  };

  State.reset = function reset() {
    for (const k in INITIAL) {
      // Re-clone arrays/objects so we don't leak references.
      const v = INITIAL[k];
      if (Array.isArray(v))      State[k] = [];
      else if (v && typeof v === 'object') State[k] = clone(v);
      else                       State[k] = v;
    }
    if (global.EventBus) {
      global.EventBus.emit('state:reset', { state: State });
      global.EventBus.emit('state:changed', { patch: {}, state: State });
    }
  };

  global.State = State;
})(window);
