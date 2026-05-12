/**
 * DTG (Date-Time Group) formatter — NATO standard.
 * Format: DD/HHMM Z MMM YY  (e.g., "12/1430 Z MAY 26")
 */
(function (global) {
  'use strict';

  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  function pad2(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  /**
   * Format a Date object into NATO DTG string (Zulu time).
   * @param {Date} date
   * @returns {string}
   */
  function formatDTG(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new TypeError('formatDTG: argument must be a valid Date');
    }
    const dd   = pad2(date.getUTCDate());
    const hh   = pad2(date.getUTCHours());
    const mm   = pad2(date.getUTCMinutes());
    const mon  = MONTHS[date.getUTCMonth()];
    const yy   = pad2(date.getUTCFullYear() % 100);
    return `${dd}/${hh}${mm} Z ${mon} ${yy}`;
  }

  /**
   * Convenience: current DTG.
   * @returns {string}
   */
  function getDTG() {
    return formatDTG(new Date());
  }

  global.DTG = { formatDTG, getDTG };
  global.formatDTG = formatDTG;
  global.getDTG = getDTG;
})(window);
