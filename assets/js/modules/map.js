/**
 * Tactical Map.
 * Top-down chart rendering: grid, units, tracks, vectors, waypoints.
 * Map coordinates are the same as State.x / State.y (canvas pixels).
 */
(function (global) {
  'use strict';

  const GRID_CELLS = 20;
  const VECTOR_MINUTES = 5;

  const COLOR_VARS = {
    bg: '--map-bg',
    grid: '--map-grid',
    gridMajor: '--map-grid-major',
    text: '--map-text',
    waypoint: '--map-waypoint',
    friendly: '--track-friendly',
    unknown: '--track-unknown',
    hostile: '--track-hostile',
    neutral: '--track-neutral',
    breadcrumb: '--map-breadcrumb'
  };

  const FALLBACK = {
    bg: '#0a0e14',
    grid: 'rgba(0,255,65,0.10)',
    gridMajor: 'rgba(0,255,65,0.25)',
    text: '#00ff41',
    waypoint: '#ffaa00',
    friendly: '#00aaff',
    unknown: '#ffaa00',
    hostile: '#ff4444',
    neutral: '#aaaaaa',
    breadcrumb: 'rgba(255,170,0,0.4)'
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

  const TacticalMap = {
    _canvas: null,
    _ctx: null,
    _layers: { surface: true, subsurface: false, air: false },
    _trackHistory: Object.create(null) // trackId -> [{x,y}]
  };

  TacticalMap.init = function init(canvasEl) {
    if (!canvasEl) return;
    TacticalMap._canvas = canvasEl;
    TacticalMap._ctx = canvasEl.getContext('2d');
    bindInteractions();
    global.EventBus.emit('map:initialized', {});
  };

  TacticalMap.toggleLayer = function toggleLayer(layer) {
    if (!(layer in TacticalMap._layers)) return;
    TacticalMap._layers[layer] = !TacticalMap._layers[layer];
    global.State.update({ activeLayer: layer });
    global.EventBus.emit('map:layer_toggled', { layer, on: TacticalMap._layers[layer] });
  };

  TacticalMap.setLayer = function setLayer(layer, on) {
    if (!(layer in TacticalMap._layers)) return;
    TacticalMap._layers[layer] = !!on;
  };

  function bindInteractions() {
    const cv = TacticalMap._canvas;
    cv.addEventListener('click', function onClick(ev) {
      const rect = cv.getBoundingClientRect();
      const x = (ev.clientX - rect.left) * (cv.width / rect.width);
      const y = (ev.clientY - rect.top) * (cv.height / rect.height);

      // 1. unit hit-test.
      const units = global.State.units;
      for (let i = 0; i < units.length; i++) {
        const u = units[i];
        if (!layerVisible(u.type)) continue;
        if (Math.hypot(u.x - x, u.y - y) < 12) {
          global.UnitsManager.selectUnit(u.id);
          return;
        }
      }

      // 2. with a selected unit, set waypoint.
      const sel = global.State.selectedUnit;
      if (sel) {
        global.UnitsManager.moveUnit(sel, x, y);
      }
    });
  }

  function layerVisible(type) {
    const l = TacticalMap._layers;
    if (type === 'surface')    return l.surface;
    if (type === 'subsurface') return l.subsurface;
    if (type === 'air')        return l.air;
    return true;
  }

  TacticalMap.render = function render() {
    const ctx = TacticalMap._ctx;
    const cv = TacticalMap._canvas;
    if (!ctx || !cv) return;
    const w = cv.width, h = cv.height;

    ctx.fillStyle = color('bg');
    ctx.fillRect(0, 0, w, h);

    drawGrid(ctx, w, h);
    drawTrackBreadcrumbs(ctx);
    drawTracks(ctx);
    drawUnits(ctx);
    drawWaypoints(ctx);
    drawCompass(ctx, w, h);
    drawScale(ctx, w, h);
  };

  function drawGrid(ctx, w, h) {
    const stepX = w / GRID_CELLS;
    const stepY = h / GRID_CELLS;
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_CELLS; i++) {
      const major = (i % 5 === 0);
      ctx.strokeStyle = major ? color('gridMajor') : color('grid');
      ctx.beginPath();
      ctx.moveTo(i * stepX, 0);
      ctx.lineTo(i * stepX, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * stepY);
      ctx.lineTo(w, i * stepY);
      ctx.stroke();
    }
  }

  function classColor(cls) {
    const c = (cls || 'UNKNOWN').toUpperCase();
    if (c === 'FRIENDLY') return color('friendly');
    if (c === 'HOSTILE')  return color('hostile');
    if (c === 'NEUTRAL')  return color('neutral');
    return color('unknown');
  }

  function drawUnits(ctx) {
    const units = global.State.units;
    const selected = global.State.selectedUnit;
    ctx.lineWidth = 2;
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < units.length; i++) {
      const u = units[i];
      if (!layerVisible(u.type)) continue;

      ctx.strokeStyle = color('friendly');
      ctx.fillStyle = color('bg');
      ctx.beginPath();
      ctx.arc(u.x, u.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (selected === u.id) {
        ctx.strokeStyle = color('text');
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(u.x, u.y, 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 2;
      }

      drawVelocityVector(ctx, u, color('friendly'));

      ctx.fillStyle = color('text');
      ctx.fillText(u.designation || u.id, u.x + 12, u.y);
    }
  }

  function drawTracks(ctx) {
    const tracks = global.State.tracks;
    const selected = global.State.selectedTrack;
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < tracks.length; i++) {
      const t = tracks[i];
      if (!layerVisible(t.type)) continue;
      const c = classColor(t.classification);
      ctx.fillStyle = c;
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;

      // Diamond marker.
      ctx.beginPath();
      ctx.moveTo(t.x, t.y - 7);
      ctx.lineTo(t.x + 7, t.y);
      ctx.lineTo(t.x, t.y + 7);
      ctx.lineTo(t.x - 7, t.y);
      ctx.closePath();
      ctx.stroke();

      if (selected === t.id) {
        ctx.beginPath();
        ctx.arc(t.x, t.y, 12, 0, Math.PI * 2);
        ctx.stroke();
      }

      drawVelocityVector(ctx, t, c);

      ctx.fillText(t.id, t.x + 10, t.y);

      // Update breadcrumb history.
      const hist = TacticalMap._trackHistory[t.id] || (TacticalMap._trackHistory[t.id] = []);
      const last = hist[hist.length - 1];
      if (!last || Math.hypot(last.x - t.x, last.y - t.y) > 3) {
        hist.push({ x: t.x, y: t.y });
        if (hist.length > 20) hist.shift();
      }
    }
  }

  function drawTrackBreadcrumbs(ctx) {
    ctx.strokeStyle = color('breadcrumb');
    ctx.lineWidth = 1;
    const tracks = global.State.tracks;
    for (let i = 0; i < tracks.length; i++) {
      const t = tracks[i];
      if (!layerVisible(t.type)) continue;
      const hist = TacticalMap._trackHistory[t.id];
      if (!hist || hist.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(hist[0].x, hist[0].y);
      for (let k = 1; k < hist.length; k++) ctx.lineTo(hist[k].x, hist[k].y);
      ctx.stroke();
    }
  }

  function drawVelocityVector(ctx, entity, strokeColor) {
    const speed = entity.speed || 0;
    if (speed <= 0) return;
    const pxPerSec = global.Coords.nmToPixels(speed, global.Coords.DEFAULT_NM_PIXEL_SCALE) / 3600;
    const len = pxPerSec * VECTOR_MINUTES * 60;
    const end = global.Coords.movePoint(entity.x, entity.y, entity.course || 0, len);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(entity.x, entity.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  function drawWaypoints(ctx) {
    const units = global.State.units;
    ctx.strokeStyle = color('waypoint');
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    for (let i = 0; i < units.length; i++) {
      const u = units[i];
      const wp = global.UnitsManager.getWaypoint(u.id);
      if (!wp) continue;
      ctx.beginPath();
      ctx.moveTo(u.x, u.y);
      ctx.lineTo(wp.x, wp.y);
      ctx.stroke();
      // X marker.
      ctx.beginPath();
      ctx.moveTo(wp.x - 6, wp.y - 6);
      ctx.lineTo(wp.x + 6, wp.y + 6);
      ctx.moveTo(wp.x + 6, wp.y - 6);
      ctx.lineTo(wp.x - 6, wp.y + 6);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  function drawCompass(ctx, w, h) {
    const cx = w - 40, cy = 40, r = 24;
    ctx.strokeStyle = color('text');
    ctx.fillStyle = color('text');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', cx, cy - r + 7);
    ctx.fillText('S', cx, cy + r - 7);
    ctx.fillText('E', cx + r - 7, cy);
    ctx.fillText('W', cx - r + 7, cy);
    // North arrow.
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - r + 12);
    ctx.stroke();
  }

  function drawScale(ctx, w, h) {
    const scaleNm = 10;
    const px = global.Coords.nmToPixels(scaleNm, global.Coords.DEFAULT_NM_PIXEL_SCALE);
    const x0 = 16, y0 = h - 24;
    ctx.strokeStyle = color('text');
    ctx.fillStyle = color('text');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + px, y0);
    ctx.moveTo(x0, y0 - 4);
    ctx.lineTo(x0, y0 + 4);
    ctx.moveTo(x0 + px, y0 - 4);
    ctx.lineTo(x0 + px, y0 + 4);
    ctx.stroke();
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(scaleNm + ' NM', x0, y0 - 6);
  }

  // --- Event wiring ---

  global.EventBus.on('engine:tick', function () {
    TacticalMap.render();
  });

  global.EventBus.on('scenario:loaded', function () {
    TacticalMap._trackHistory = Object.create(null);
  });

  global.TacticalMap = TacticalMap;
})(window);
