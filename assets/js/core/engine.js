/**
 * Simulation Engine — requestAnimationFrame game loop.
 * Emits 'engine:tick' every frame with real-time delta and simulated time.
 */
(function (global) {
  'use strict';

  const Engine = {
    timeScale: 1,
    _rafId: null,
    _running: false,
    _paused: false,
    _lastTs: 0,
    _simTime: 0
  };

  function loop(ts) {
    if (!Engine._running) return;

    if (Engine._lastTs === 0) Engine._lastTs = ts;
    const deltaMs = ts - Engine._lastTs;
    Engine._lastTs = ts;

    if (!Engine._paused) {
      const deltaSec = deltaMs / 1000;
      Engine._simTime += deltaSec * Engine.timeScale;

      if (global.State) {
        global.State.time = Engine._simTime;
      }

      if (global.EventBus) {
        global.EventBus.emit('engine:tick', {
          time: ts,
          delta: deltaSec,
          simTime: Engine._simTime
        });
      }

      // Scenario status check — VICTORY / DEFEAT halts the loop.
      const status = global.State ? global.State.scenario_status : 'RUNNING';
      if (status === 'VICTORY' || status === 'DEFEAT') {
        Engine.stop();
        if (global.EventBus) {
          global.EventBus.emit('engine:ended', { status, simTime: Engine._simTime });
        }
        return;
      }
    }

    Engine._rafId = global.requestAnimationFrame(loop);
  }

  Engine.start = function start() {
    if (Engine._running) return;
    Engine._running = true;
    Engine._paused = false;
    Engine._lastTs = 0;
    Engine._rafId = global.requestAnimationFrame(loop);
    if (global.EventBus) global.EventBus.emit('engine:started', {});
  };

  Engine.pause = function pause() {
    if (!Engine._running || Engine._paused) return;
    Engine._paused = true;
    if (global.State) global.State.scenario_status = 'PAUSED';
    if (global.EventBus) global.EventBus.emit('engine:paused', {});
  };

  Engine.resume = function resume() {
    if (!Engine._running || !Engine._paused) return;
    Engine._paused = false;
    Engine._lastTs = 0; // avoid huge delta after pause
    if (global.State) global.State.scenario_status = 'RUNNING';
    if (global.EventBus) global.EventBus.emit('engine:resumed', {});
  };

  Engine.stop = function stop() {
    Engine._running = false;
    Engine._paused = false;
    if (Engine._rafId !== null) {
      global.cancelAnimationFrame(Engine._rafId);
      Engine._rafId = null;
    }
    if (global.EventBus) global.EventBus.emit('engine:stopped', {});
  };

  Engine.setTimeScale = function setTimeScale(n) {
    const v = Number(n);
    if (!isFinite(v) || v <= 0) return;
    Engine.timeScale = v;
    if (global.EventBus) global.EventBus.emit('engine:timescale', { timeScale: v });
  };

  Engine.getSimTime = function getSimTime() {
    return Engine._simTime;
  };

  Engine.resetSimTime = function resetSimTime() {
    Engine._simTime = 0;
    Engine._lastTs = 0;
  };

  global.Engine = Engine;
})(window);
