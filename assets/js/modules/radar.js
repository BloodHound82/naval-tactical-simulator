/**
 * Radar Display.
 * Renders a sweeping PPI radar onto a Canvas element.
 * Listens to engine:tick to drive sweep and re-render.
 */
(function (global) {
  'use strict';

  const SWEEP_RPM = 6; // 360 deg / 10 sec sim time
  const SWEEP_DEG_PER_SEC = (SWEEP_RPM / 60) * 360;
  const TRAIL_LENGTH = 5;
  const FADE_SWEEPS = 3;
  const CLUTTER_POINTS = 80;
  const RANGE_RINGS_NM = [5, 10, 20, 40];

  const COLOR_VARS = {
    bg: '--radar-bg',
    sweep: '--radar-sweep',
    sweepTrail: '--radar-sweep-trail',
    ring: '--radar-ring',
    text: '--radar-text',
    friendly: '--track-friendly',
    unknown: '--track-unknown',
    hostile: '--track-hostile',
    neutral: '--track-neutral',
    clutter: '--radar-clutter'
  };

  const FALLBACK = {
    bg: '#0a0e14',
    sweep: '#00ff41',
    sweepTrail: 'rgba(0,255,65,0.15)',
    ring: 'rgba(0,255,65,0.3)',
    text: '#00ff41',
    friendly: '#00aaff',
    unknown: '#ffaa00',
    hostile: '#ff4444',
    neutral: '#aaaaaa',
    clutter: 'rgba(0,255,65,0.08)'
  };

  function cssVar(name, fallback) {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    } catch (_) {
      return fallback;
    }
  }

  function color(key) {
    return cssVar(COLOR_VARS[key], FALLBACK[key]);
  }

  const RadarDisplay = {
    _canvas: null,
    _ctx: null,
    _sweepAngle: 0,           // degrees
    _lastSimTime: 0,
    _trails: Object.create(null), // trackId -> [{x,y,age}]
    _lastSeen: Object.create(null), // trackId -> sweep count when last seen
    _sweepCount: 0,
    _clutter: [],
    _range: 40
  };

  RadarDisplay.init = function init(canvasEl) {
    if (!canvasEl) return;
    RadarDisplay._canvas = canvasEl;
    RadarDisplay._ctx = canvasEl.getContext('2d');
    RadarDisplay._range = global.State.radarRange || 40;
    seedClutter();
    bindInteractions();
    global.EventBus.emit('radar:initialized', {});
  };

  RadarDisplay.setRange = function setRange(nm) {
    if ([10, 20, 40].indexOf(nm) === -1) return;
    RadarDisplay._range = nm;
    global.State.update({ radarRange: nm });
    global.EventBus.emit('radar:range_changed', { range: nm });
  };

  function seedClutter() {
    RadarDisplay._clutter = [];
    for (let i = 0; i < CLUTTER_POINTS; i++) {
      RadarDisplay._clutter.push({
        bearing: Math.random() * 360,
        rangeNm: Math.random() * 40,
        intensity: Math.random()
      });
    }
  }

  function bindInteractions() {
    const cv = RadarDisplay._canvas;
    cv.addEventListener('click', function onClick(ev) {
      const rect = cv.getBoundingClientRect();
      const cx = cv.width / 2;
      const cy = cv.height / 2;
      const radius = Math.min(cx, cy) - 10;
      const pxPerNm = radius / RadarDisplay._range;

      const px = (ev.clientX - rect.left) * (cv.width / rect.width);
      const py = (ev.clientY - rect.top) * (cv.height / rect.height);

      // Hit-test against currently displayed tracks.
      const tracks = global.State.tracks;
      const ownship = primaryOwnship();
      if (!ownship) return;

      let best = null;
      let bestDist = Infinity;
      for (let i = 0; i < tracks.length; i++) {
        const t = tracks[i];
        const dxNm = global.Coords.pixelsToNm(t.x - ownship.x, global.Coords.DEFAULT_NM_PIXEL_SCALE);
        const dyNm = global.Coords.pixelsToNm(t.y - ownship.y, global.Coords.DEFAULT_NM_PIXEL_SCALE);
        const tx = cx + dxNm * pxPerNm;
        const ty = cy + dyNm * pxPerNm;
        const d = Math.hypot(tx - px, ty - py);
        if (d < 12 && d < bestDist) {
          bestDist = d;
          best = t;
        }
      }
      if (best) {
        global.ThreatManager.selectTrack(best.id);
      }
    });
  }

  function primaryOwnship() {
    const units = global.State.units;
    if (!units || units.length === 0) return null;
    const sel = global.State.selectedUnit;
    if (sel) {
      const s = units.find((u) => u.id === sel);
      if (s) return s;
    }
    return units[0];
  }

  RadarDisplay.render = function render(timestamp) {
    const ctx = RadarDisplay._ctx;
    const cv = RadarDisplay._canvas;
    if (!ctx || !cv) return;

    const w = cv.width, h = cv.height;
    const cx = w / 2, cy = h / 2;
    const radius = Math.min(cx, cy) - 10;
    const pxPerNm = radius / RadarDisplay._range;

    // Background.
    ctx.fillStyle = color('bg');
    ctx.fillRect(0, 0, w, h);

    // Clipping circle.
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    drawClutter(ctx, cx, cy, pxPerNm);
    drawRangeRings(ctx, cx, cy, radius);
    drawCardinals(ctx, cx, cy, radius);
    drawSweepTrail(ctx, cx, cy, radius);
    drawTracks(ctx, cx, cy, pxPerNm);
    drawOwnship(ctx, cx, cy);
    drawSweep(ctx, cx, cy, radius);

    ctx.restore();

    // Outer ring.
    ctx.strokeStyle = color('ring');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    drawHud(ctx, w, h);
  };

  function drawClutter(ctx, cx, cy, pxPerNm) {
    ctx.fillStyle = color('clutter');
    const items = RadarDisplay._clutter;
    for (let i = 0; i < items.length; i++) {
      const c = items[i];
      if (c.rangeNm > RadarDisplay._range) continue;
      const rad = global.Coords.bearingToRadians(c.bearing);
      const x = cx + Math.sin(rad) * c.rangeNm * pxPerNm;
      const y = cy - Math.cos(rad) * c.rangeNm * pxPerNm;
      ctx.globalAlpha = 0.15 + c.intensity * 0.35;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
    ctx.globalAlpha = 1;
  }

  function drawRangeRings(ctx, cx, cy, radius) {
    ctx.strokeStyle = color('ring');
    ctx.lineWidth = 1;
    ctx.fillStyle = color('text');
    ctx.font = '10px monospace';
    for (let i = 0; i < RANGE_RINGS_NM.length; i++) {
      const nm = RANGE_RINGS_NM[i];
      if (nm > RadarDisplay._range) continue;
      const r = (nm / RadarDisplay._range) * radius;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillText(nm + ' NM', cx + 4, cy - r - 2);
    }
    // Cross-hair.
    ctx.beginPath();
    ctx.moveTo(cx - radius, cy);
    ctx.lineTo(cx + radius, cy);
    ctx.moveTo(cx, cy - radius);
    ctx.lineTo(cx, cy + radius);
    ctx.stroke();
  }

  function drawCardinals(ctx, cx, cy, radius) {
    ctx.fillStyle = color('text');
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', cx, cy - radius + 10);
    ctx.fillText('S', cx, cy + radius - 10);
    ctx.fillText('E', cx + radius - 10, cy);
    ctx.fillText('W', cx - radius + 10, cy);
  }

  function drawSweepTrail(ctx, cx, cy, radius) {
    const start = global.Coords.bearingToRadians(RadarDisplay._sweepAngle - 60);
    const end = global.Coords.bearingToRadians(RadarDisplay._sweepAngle);
    // Convert compass radians (0=N up) to canvas radians (0=right) by -90deg.
    const a0 = start - Math.PI / 2;
    const a1 = end - Math.PI / 2;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, color('sweepTrail'));
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, a0, a1);
    ctx.closePath();
    ctx.fill();
  }

  function drawSweep(ctx, cx, cy, radius) {
    const rad = global.Coords.bearingToRadians(RadarDisplay._sweepAngle);
    const x = cx + Math.sin(rad) * radius;
    const y = cy - Math.cos(rad) * radius;
    ctx.strokeStyle = color('sweep');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function classColor(cls) {
    const c = (cls || 'UNKNOWN').toUpperCase();
    if (c === 'FRIENDLY') return color('friendly');
    if (c === 'HOSTILE')  return color('hostile');
    if (c === 'NEUTRAL')  return color('neutral');
    return color('unknown');
  }

  /**
   * NTDS domain symbology for radar blips.
   * Surface  → full circle
   * Air      → upper semicircle (chord at centre line)
   * Sub      → lower semicircle (chord at centre line)
   */
  function drawBlip(ctx, x, y, r, type) {
    const t = (type || 'surface').toLowerCase();
    ctx.beginPath();
    if (t === 'air') {
      // Upper half: clockwise arc from left (-π) to right (0) passes through top
      ctx.arc(x, y, r, -Math.PI, 0);
      ctx.closePath();
    } else if (t === 'subsurface') {
      // Lower half: clockwise arc from right (0) to left (π) passes through bottom
      ctx.arc(x, y, r, 0, Math.PI);
      ctx.closePath();
    } else {
      ctx.arc(x, y, r, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.stroke();
  }

  function drawTracks(ctx, cx, cy, pxPerNm) {
    const ownship = primaryOwnship();
    if (!ownship) return;
    const tracks = global.State.tracks;
    const selected = global.State.selectedTrack;

    for (let i = 0; i < tracks.length; i++) {
      const t = tracks[i];
      const dxNm = global.Coords.pixelsToNm(t.x - ownship.x, global.Coords.DEFAULT_NM_PIXEL_SCALE);
      const dyNm = global.Coords.pixelsToNm(t.y - ownship.y, global.Coords.DEFAULT_NM_PIXEL_SCALE);
      const rangeNm = Math.hypot(dxNm, dyNm);
      if (rangeNm > RadarDisplay._range) continue;

      const x = cx + dxNm * pxPerNm;
      const y = cy + dyNm * pxPerNm;

      // Maintain trail breadcrumbs.
      let trail = RadarDisplay._trails[t.id];
      if (!trail) { trail = []; RadarDisplay._trails[t.id] = trail; }
      const lastSeen = RadarDisplay._lastSeen[t.id] || 0;
      const sweepsSince = RadarDisplay._sweepCount - lastSeen;
      const fade = Math.max(0, 1 - sweepsSince / FADE_SWEEPS);

      if (trail.length === 0 || trail[trail.length - 1].x !== x || trail[trail.length - 1].y !== y) {
        trail.push({ x, y });
        if (trail.length > TRAIL_LENGTH) trail.shift();
      }

      // Trail dots.
      ctx.fillStyle = classColor(t.classification);
      for (let k = 0; k < trail.length - 1; k++) {
        ctx.globalAlpha = ((k + 1) / trail.length) * 0.5 * fade;
        ctx.beginPath();
        ctx.arc(trail[k].x, trail[k].y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = fade;

      // Main blip — NTDS domain symbology.
      const blipR = selected === t.id ? 7 : 5;
      ctx.fillStyle = classColor(t.classification);
      ctx.strokeStyle = classColor(t.classification);
      ctx.lineWidth = 1.5;
      drawBlip(ctx, x, y, blipR, t.type);

      if (selected === t.id) {
        ctx.strokeStyle = color('text');
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, blipR + 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Label.
      ctx.globalAlpha = fade;
      ctx.fillStyle = color('text');
      ctx.font = '9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(t.id, x + 8, y - 6);
      ctx.globalAlpha = 1;

      RadarDisplay._lastSeen[t.id] = RadarDisplay._sweepCount;
    }
    ctx.globalAlpha = 1;
  }

  function drawOwnship(ctx, cx, cy) {
    ctx.fillStyle = color('friendly');
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = color('friendly');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawHud(ctx, w, h) {
    ctx.fillStyle = color('text');
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`RNG ${RadarDisplay._range} NM`, 8, 8);
    ctx.fillText(`SWP ${RadarDisplay._sweepAngle.toFixed(0).padStart(3, '0')}`, 8, 22);
    if (global.DTG) {
      ctx.textAlign = 'right';
      ctx.fillText(global.DTG.getDTG(), w - 8, 8);
    }
  }

  // --- Event wiring ---

  global.EventBus.on('engine:tick', function onTick(payload) {
    const simDelta = payload.simTime - RadarDisplay._lastSimTime;
    RadarDisplay._lastSimTime = payload.simTime;
    const prev = RadarDisplay._sweepAngle;
    RadarDisplay._sweepAngle = (RadarDisplay._sweepAngle + simDelta * SWEEP_DEG_PER_SEC) % 360;
    if (RadarDisplay._sweepAngle < prev) RadarDisplay._sweepCount++;
    RadarDisplay.render(payload.time);
  });

  global.EventBus.on('scenario:loaded', function () {
    RadarDisplay._trails = Object.create(null);
    RadarDisplay._lastSeen = Object.create(null);
    RadarDisplay._sweepCount = 0;
    seedClutter();
  });

  global.RadarDisplay = RadarDisplay;
})(window);
