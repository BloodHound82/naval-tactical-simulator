/**
 * Threat Manager.
 * Track classification, CPA / CBDR analysis, threat alert emission.
 */
(function (global) {
  'use strict';

  const TICK_DIVISOR = 10;        // run assessment every Nth tick
  const CBDR_BEARING_TOLERANCE = 3; // degrees
  const CBDR_RANGE_DECREASE_MIN = 0.5; // NM over the assessment window
  const ALERT_RANGE_NM = 20;      // only flag CBDR if within this range

  const ThreatManager = {
    _tickCounter: 0,
    _lastBearings: Object.create(null), // key "trackId:unitId" -> { bearing, range }
    _activeAlerts: new Set()
  };

  ThreatManager.classifyTrack = function classifyTrack(trackId, classification) {
    const tracks = global.State.tracks.map((t) => {
      if (t.id === trackId) return Object.assign({}, t, { classification });
      return t;
    });
    global.State.update({ tracks });
    global.EventBus.emit('track:classified', {
      trackId,
      classification,
      source: 'manual'
    });
  };

  ThreatManager.selectTrack = function selectTrack(trackId) {
    global.State.update({ selectedTrack: trackId });
    global.EventBus.emit('track:selected', { trackId });
  };

  /**
   * Closest Point of Approach (linear constant-velocity model).
   * Returns { time, range } where time is seconds until CPA (may be negative
   * if CPA is in the past), range is NM at CPA.
   */
  ThreatManager.getCPA = function getCPA(track, unit) {
    // Relative position (track relative to unit).
    const rx = track.x - unit.x;
    const ry = track.y - unit.y;

    // Velocities in pixels per second. Speed assumed in knots, scale via Coords.
    const tV = velocityVector(track);
    const uV = velocityVector(unit);

    const rvx = tV.vx - uV.vx;
    const rvy = tV.vy - uV.vy;

    const relSpeedSq = rvx * rvx + rvy * rvy;
    if (relSpeedSq < 1e-9) {
      // No relative motion — CPA is current range.
      return {
        time: 0,
        range: global.Coords.pixelsToNm(
          Math.sqrt(rx * rx + ry * ry),
          global.Coords.DEFAULT_NM_PIXEL_SCALE
        )
      };
    }

    const t = -(rx * rvx + ry * rvy) / relSpeedSq;
    const cx = rx + rvx * t;
    const cy = ry + rvy * t;
    const rangePx = Math.sqrt(cx * cx + cy * cy);

    return {
      time: t,
      range: global.Coords.pixelsToNm(rangePx, global.Coords.DEFAULT_NM_PIXEL_SCALE)
    };
  };

  function velocityVector(entity) {
    const speedKnots = entity.speed || 0;
    const pxPerSec = global.Coords.nmToPixels(speedKnots, global.Coords.DEFAULT_NM_PIXEL_SCALE) / 3600;
    const rad = global.Coords.bearingToRadians(entity.course || 0);
    return {
      vx: Math.sin(rad) * pxPerSec,
      vy: -Math.cos(rad) * pxPerSec
    };
  }

  /**
   * CBDR: bearing nearly constant, range decreasing.
   */
  ThreatManager.checkCBDR = function checkCBDR(track, unit) {
    const bearing = global.Coords.bearingBetween(unit.x, unit.y, track.x, track.y);
    const rangeNm = global.Coords.pixelsToNm(
      global.Coords.distanceBetween(unit.x, unit.y, track.x, track.y),
      global.Coords.DEFAULT_NM_PIXEL_SCALE
    );
    const key = track.id + ':' + unit.id;
    const prev = ThreatManager._lastBearings[key];
    ThreatManager._lastBearings[key] = { bearing, range: rangeNm };

    if (!prev) return false;

    let dB = Math.abs(bearing - prev.bearing);
    if (dB > 180) dB = 360 - dB;
    const dR = prev.range - rangeNm; // positive if closing

    return (
      dB <= CBDR_BEARING_TOLERANCE &&
      dR >= CBDR_RANGE_DECREASE_MIN &&
      rangeNm <= ALERT_RANGE_NM
    );
  };

  ThreatManager.assessThreats = function assessThreats() {
    const tracks = global.State.tracks;
    const units = global.State.units;
    const newAlerts = [];
    const seenAlerts = new Set();

    for (let i = 0; i < tracks.length; i++) {
      const tr = tracks[i];
      if (tr.classification !== 'HOSTILE') continue;
      for (let j = 0; j < units.length; j++) {
        const un = units[j];
        const cbdr = ThreatManager.checkCBDR(tr, un);
        const cpa = ThreatManager.getCPA(tr, un);
        const alertKey = `${tr.id}->${un.id}`;

        if (cbdr) {
          seenAlerts.add(alertKey);
          const alert = {
            id: alertKey,
            trackId: tr.id,
            unitId: un.id,
            cpa,
            severity: cpa.range < 5 ? 'CRITICAL' : 'WARNING'
          };
          newAlerts.push(alert);

          if (!ThreatManager._activeAlerts.has(alertKey)) {
            ThreatManager._activeAlerts.add(alertKey);
            global.EventBus.emit('threat:alert', alert);
          }
        }
      }
    }

    // Clear stale alerts.
    ThreatManager._activeAlerts.forEach((k) => {
      if (!seenAlerts.has(k)) {
        ThreatManager._activeAlerts.delete(k);
        global.EventBus.emit('threat:alert_cleared', { id: k });
      }
    });

    global.State.update({ alerts: newAlerts });
  };

  // --- Event wiring ---

  global.EventBus.on('engine:tick', function () {
    if (global.State.scenario_status !== 'RUNNING') return;
    ThreatManager._tickCounter = (ThreatManager._tickCounter + 1) % TICK_DIVISOR;
    if (ThreatManager._tickCounter === 0) {
      ThreatManager.assessThreats();
    }
  });

  global.ThreatManager = ThreatManager;
})(window);
