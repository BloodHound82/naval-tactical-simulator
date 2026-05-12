/**
 * Coordinate / navigation utilities.
 * All bearings are compass-degrees (0 = North, clockwise, 0..360).
 * Pixel space: +x = East, +y = South.
 */
(function (global) {
  'use strict';

  const DEG_TO_RAD = Math.PI / 180;
  const RAD_TO_DEG = 180 / Math.PI;

  // 1 NM rendered as N pixels at scale=1.
  // The map module is the authority on scale; this is a sane default.
  const DEFAULT_NM_PIXEL_SCALE = 4;

  function bearingToRadians(bearing) {
    // Compass bearing -> math radians where North is +y up.
    // We rotate so that 0deg = up (negative y in screen space).
    return ((bearing % 360 + 360) % 360) * DEG_TO_RAD;
  }

  function radiansToBearing(rad) {
    let deg = rad * RAD_TO_DEG;
    deg = ((deg % 360) + 360) % 360;
    return deg;
  }

  function distanceBetween(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Compass bearing FROM (x1,y1) TO (x2,y2). 0 = North (negative y).
   */
  function bearingBetween(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    // atan2 with North-up: angle from +y-up axis, clockwise.
    let rad = Math.atan2(dx, -dy);
    let deg = rad * RAD_TO_DEG;
    deg = ((deg % 360) + 360) % 360;
    return deg;
  }

  /**
   * Move a point along compass bearing by `distance` (same unit as input).
   */
  function movePoint(x, y, bearing, distance) {
    const rad = bearingToRadians(bearing);
    return {
      x: x + Math.sin(rad) * distance,
      y: y - Math.cos(rad) * distance
    };
  }

  function nmToPixels(nm, scale) {
    const s = (typeof scale === 'number' && scale > 0) ? scale : DEFAULT_NM_PIXEL_SCALE;
    return nm * s;
  }

  function pixelsToNm(px, scale) {
    const s = (typeof scale === 'number' && scale > 0) ? scale : DEFAULT_NM_PIXEL_SCALE;
    return px / s;
  }

  global.Coords = {
    bearingToRadians,
    radiansToBearing,
    distanceBetween,
    bearingBetween,
    movePoint,
    nmToPixels,
    pixelsToNm,
    DEFAULT_NM_PIXEL_SCALE
  };
})(window);
