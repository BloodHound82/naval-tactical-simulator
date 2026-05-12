/**
 * Communications Manager.
 * Maintains a FIFO log of formatted naval messages (DTG/FROM/TO/PRECEDENCE/TEXT).
 */
(function (global) {
  'use strict';

  const MAX_MESSAGES = 50;

  const CommsManager = {};

  function format(msg) {
    return [
      `DTG     : ${msg.dtg}`,
      `FROM    : ${msg.from}`,
      `TO      : ${msg.to}`,
      `PREC    : ${msg.precedence}`,
      ``,
      msg.text
    ].join('\n');
  }

  CommsManager.addMessage = function addMessage(from, to, precedence, text, dtg) {
    const stamp = dtg || (global.DTG ? global.DTG.getDTG() : new Date().toISOString());
    const msg = {
      id: 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1e6),
      dtg: stamp,
      from: from || 'UNKNOWN',
      to: to || 'ALL',
      precedence: precedence || 'ROUTINE',
      text: text || '',
      simTime: global.State ? global.State.time : 0
    };
    msg.formatted = format(msg);

    const log = global.State.commsLog.slice();
    log.push(msg);
    while (log.length > MAX_MESSAGES) log.shift();

    global.State.update({ commsLog: log });
    global.EventBus.emit('comms:new_message', msg);
    return msg;
  };

  CommsManager.clear = function clear() {
    global.State.update({ commsLog: [] });
    global.EventBus.emit('comms:cleared', {});
  };

  CommsManager.format = format;

  // --- Event wiring ---

  global.EventBus.on('scenario:event:comms_message', function (data) {
    if (!data) return;
    CommsManager.addMessage(data.from, data.to, data.precedence, data.text, data.dtg);
  });

  global.EventBus.on('track:classified', function (data) {
    if (!data || data.source === 'auto') return;
    const cls = (data.classification || '').toUpperCase();
    if (cls === 'HOSTILE') {
      CommsManager.addMessage(
        'CIC',
        'ALL STATIONS',
        'FLASH',
        `FLASH — CONTACT ${data.trackId} CLASSIFIED HOSTILE. ALL STATIONS ACKNOWLEDGE.`
      );
    } else if (cls === 'FRIENDLY') {
      CommsManager.addMessage(
        'CIC',
        'ALL STATIONS',
        'ROUTINE',
        `CONTACT ${data.trackId} CLASSIFIED FRIENDLY. IFF VALIDATED.`
      );
    } else if (cls === 'NEUTRAL') {
      CommsManager.addMessage(
        'CIC',
        'ALL STATIONS',
        'ROUTINE',
        `CONTACT ${data.trackId} CLASSIFIED NEUTRAL. NO HOSTILE INTENT ASSESSED.`
      );
    }
  });

  global.CommsManager = CommsManager;
})(window);
