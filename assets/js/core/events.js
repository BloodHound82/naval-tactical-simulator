/**
 * Global Event Bus.
 * Pub/sub backbone — every module talks to others through here only.
 */
(function (global) {
  'use strict';

  const listeners = Object.create(null);

  function on(event, cb) {
    if (typeof event !== 'string' || typeof cb !== 'function') return;
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(cb);
  }

  function off(event, cb) {
    const arr = listeners[event];
    if (!arr) return;
    const i = arr.indexOf(cb);
    if (i !== -1) arr.splice(i, 1);
  }

  function emit(event, data) {
    const arr = listeners[event];
    if (!arr || arr.length === 0) return;
    // Iterate over a copy so handlers can off() themselves safely.
    const snapshot = arr.slice();
    for (let i = 0; i < snapshot.length; i++) {
      try {
        snapshot[i](data);
      } catch (err) {
        // Bubble errors to a dedicated channel so we don't kill the loop.
        if (event !== 'eventbus:error') {
          emit('eventbus:error', { event, error: err });
        }
      }
    }
  }

  function clear() {
    for (const k in listeners) delete listeners[k];
  }

  global.EventBus = { on, off, emit, clear };
})(window);
