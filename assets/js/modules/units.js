/**
 * Units Manager.
 * Owns friendly unit motion, waypoint assignment and selection state.
 * Speed is interpreted in knots (NM/hour) — converted to map-pixel units
 * via Coords.nmToPixels with the default NM/pixel scale.
 */
(function (global) {
  'use strict';

  const KNOTS_TO_PX_PER_SEC = function (knots) {
    // 1 knot = 1 NM / 3600 s. Convert NM to pixels at the default scale.
    return global.Coords.nmToPixels(knots, global.Coords.DEFAULT_NM_PIXEL_SCALE) / 3600;
  };

  const WAYPOINT_REACH_PX = 2;

  const UnitsManager = {
    _waypoints: Object.create(null) // unitId -> {x,y}
  };

  UnitsManager.init = function init(units) {
    if (!Array.isArray(units)) units = [];
    UnitsManager._waypoints = Object.create(null);
    global.State.update({ units: units.slice() });
    global.EventBus.emit('units:initialized', { count: units.length });
  };

  UnitsManager.getUnit = function getUnit(unitId) {
    return global.State.units.find((u) => u.id === unitId) || null;
  };

  UnitsManager.moveUnit = function moveUnit(unitId, targetX, targetY) {
    const u = UnitsManager.getUnit(unitId);
    if (!u) return;
    UnitsManager._waypoints[unitId] = { x: targetX, y: targetY };
    // Update course toward waypoint immediately.
    const newCourse = global.Coords.bearingBetween(u.x, u.y, targetX, targetY);
    const units = global.State.units.map((unit) => {
      if (unit.id === unitId) return Object.assign({}, unit, { course: newCourse });
      return unit;
    });
    global.State.update({ units });
    global.EventBus.emit('unit:waypoint', { unitId, x: targetX, y: targetY });
  };

  UnitsManager.clearWaypoint = function clearWaypoint(unitId) {
    delete UnitsManager._waypoints[unitId];
    global.EventBus.emit('unit:waypoint_cleared', { unitId });
  };

  UnitsManager.getWaypoint = function getWaypoint(unitId) {
    return UnitsManager._waypoints[unitId] || null;
  };

  UnitsManager.selectUnit = function selectUnit(unitId) {
    global.State.update({ selectedUnit: unitId });
    global.EventBus.emit('unit:selected', { unitId });
  };

  UnitsManager.updatePositions = function updatePositions(delta) {
    if (!delta || delta <= 0) return;
    let mutated = false;
    const units = global.State.units.map((u) => {
      const speedPxPerSec = KNOTS_TO_PX_PER_SEC(u.speed || 0);
      if (speedPxPerSec <= 0) return u;

      const wp = UnitsManager._waypoints[u.id];
      let course = u.course;
      let x = u.x, y = u.y;

      if (wp) {
        const dist = global.Coords.distanceBetween(x, y, wp.x, wp.y);
        if (dist <= WAYPOINT_REACH_PX) {
          delete UnitsManager._waypoints[u.id];
          global.EventBus.emit('unit:waypoint_reached', { unitId: u.id });
        } else {
          course = global.Coords.bearingBetween(x, y, wp.x, wp.y);
        }
      }

      const step = speedPxPerSec * delta;
      const moved = global.Coords.movePoint(x, y, course, step);
      mutated = true;
      return Object.assign({}, u, { x: moved.x, y: moved.y, course });
    });

    if (mutated) {
      global.State.update({ units });
      global.EventBus.emit('units:updated', { units });
    }
  };

  // --- Event wiring ---

  global.EventBus.on('engine:tick', function onTick(payload) {
    if (global.State.scenario_status !== 'RUNNING') return;
    UnitsManager.updatePositions(payload.delta * global.Engine.timeScale);
  });

  global.EventBus.on('scenario:loaded', function onScenario(data) {
    if (data && data.scenario && Array.isArray(data.scenario.units)) {
      UnitsManager.init(data.scenario.units);
    }
  });

  global.UnitsManager = UnitsManager;
})(window);
