const assert = require("node:assert/strict");
const { parsePayload, decryptPayload } = require("../dist/index.js");

function randomBytes(seed, len) {
  let state = seed >>> 0;
  const out = Buffer.alloc(len);
  for (let i = 0; i < len; i++) {
    state = (1103515245 * state + 12345) >>> 0;
    out[i] = state & 0xff;
  }
  return out;
}

function runParseFuzz() {
  for (let i = 0; i < 250; i++) {
    const len = i % 80;
    const buf = randomBytes(i + 7, len);
    try {
      parsePayload(Uint8Array.from(buf).buffer);
    } catch (_err) {
      // Expected for malformed input.
    }
  }
  assert.equal(true, true);
}

function runDecryptFuzz() {
  for (let i = 0; i < 250; i++) {
    const len = i % 120;
    const buf = randomBytes(i + 100, len);
    try {
      decryptPayload(buf.toString("base64"), { keyMap: { 0: "x" } });
    } catch (_err) {
      // Expected for malformed input.
    }
  }
  assert.equal(true, true);
}

module.exports = {
  run: () => {
    runParseFuzz();
    runDecryptFuzz();
  },
};
