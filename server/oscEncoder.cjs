/**
 * Clean zero-dependency Open Sound Control (OSC 1.0) packet encoder
 * Compatible with Max/MSP, Pure Data, TouchDesigner OSC In CHOP, SuperCollider.
 */

function pad4(len) {
  const rem = len % 4;
  return rem === 0 ? len : len + (4 - rem);
}

function writePaddedString(str) {
  const strLen = Buffer.byteLength(str, 'utf8') + 1; // null-terminated
  const paddedLen = pad4(strLen);
  const buf = Buffer.alloc(paddedLen);
  buf.write(str, 0, 'utf8');
  return buf;
}

/**
 * Encodes an OSC message into a Buffer.
 * @param {string} address - e.g. "/bio/eeg/alpha"
 * @param {Array<{type: 'f'|'i'|'s', value: any}>} args
 * @returns {Buffer}
 */
function encodeOscMessage(address, args = []) {
  const addrBuf = writePaddedString(address);

  // Build type tag string, e.g. ",f" or ",fi"
  const tagStr = ',' + args.map(a => a.type).join('');
  const tagBuf = writePaddedString(tagStr);

  const argBuffers = [];
  for (const arg of args) {
    if (arg.type === 'f') {
      const b = Buffer.alloc(4);
      b.writeFloatBE(Number(arg.value) || 0, 0);
      argBuffers.push(b);
    } else if (arg.type === 'i') {
      const b = Buffer.alloc(4);
      b.writeInt32BE(Number(arg.value) || 0, 0);
      argBuffers.push(b);
    } else if (arg.type === 's') {
      argBuffers.push(writePaddedString(String(arg.value || '')));
    }
  }

  return Buffer.concat([addrBuf, tagBuf, ...argBuffers]);
}

/**
 * Encodes an OSC bundle containing multiple messages with an immediate or timestamp timetag.
 * @param {Buffer[]} messageBuffers
 * @param {number} [timetag]
 */
function encodeOscBundle(messageBuffers, timetag = 1) {
  const headBuf = writePaddedString('#bundle');
  const timeBuf = Buffer.alloc(8);
  // Immediate timetag (0x0000000000000001)
  timeBuf.writeUInt32BE(0, 0);
  timeBuf.writeUInt32BE(timetag, 4);

  const parts = [headBuf, timeBuf];
  for (const msgBuf of messageBuffers) {
    const sizeBuf = Buffer.alloc(4);
    sizeBuf.writeInt32BE(msgBuf.length, 0);
    parts.push(sizeBuf, msgBuf);
  }

  return Buffer.concat(parts);
}

module.exports = {
  encodeOscMessage,
  encodeOscBundle,
};

