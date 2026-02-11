const assert = require("node:assert/strict");
const { encryptPayload, decryptPayload } = require("../dist/index.js");

function rng(seed = 123456789) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function randInt(next, min, max) {
  return Math.floor(next() * (max - min + 1)) + min;
}

function randomAscii(next, len) {
  let out = "";
  for (let i = 0; i < len; i++) out += String.fromCharCode(randInt(next, 97, 122));
  return out;
}

function randomValue(next, depth = 0) {
  const maxKind = depth > 0 ? (depth > 2 ? 5 : 8) : depth > 2 ? 6 : 9;
  const kind = randInt(next, 0, maxKind);
  switch (kind) {
    case 0:
      return null;
    case 1:
      return next() > 0.5;
    case 2:
      return randInt(next, -100000, 100000);
    case 3:
      return next() * 1000 - 500;
    case 4:
      if (depth > 0) return randInt(next, -100000, 100000);
      return BigInt(randInt(next, -100000, 100000));
    case 5:
      return randomAscii(next, randInt(next, 0, 12));
    case 6:
      if (depth > 0) return randomAscii(next, randInt(next, 0, 12));
      return new Date(Date.UTC(2024, 0, randInt(next, 1, 28)));
    case 7: {
      if (depth > 0) return randomAscii(next, randInt(next, 0, 12));
      const arr = new Uint8Array(randInt(next, 0, 16));
      for (let i = 0; i < arr.length; i++) arr[i] = randInt(next, 0, 255);
      return arr;
    }
    case 8: {
      const len = randInt(next, 0, 4);
      const arr = [];
      for (let i = 0; i < len; i++) arr.push(randomValue(next, depth + 1));
      return arr;
    }
    default: {
      const count = randInt(next, 0, 4);
      const out = {};
      for (let i = 0; i < count; i++) {
        out[`k${i}_${randomAscii(next, 2)}`] = randomValue(next, depth + 1);
      }
      return out;
    }
  }
}

function eq(a, b) {
  if (a instanceof Uint8Array && b instanceof Uint8Array) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }
  if (a instanceof Date && b instanceof Date) return a.toISOString() === b.toISOString();
  if (typeof a === "bigint" && typeof b === "bigint") return a === b;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!eq(a[i], b[i])) return false;
    return true;
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    for (const k of ka) if (!eq(a[k], b[k])) return false;
    return true;
  }
  return Object.is(a, b);
}

function runPropertyRoundTrips() {
  const next = rng(42);
  for (let i = 0; i < 120; i++) {
    const payload = randomValue(next, 0);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) continue;
    const kid = randInt(next, 0, 5);
    const compress = next() > 0.5;
    const format = next() > 0.5 ? "base64" : "binary";
    const aad = next() > 0.5 ? `tenant-${randInt(next, 1, 3)}` : undefined;
    const key = `key-${kid}`;

    const encrypted = encryptPayload(payload, { key, kid, compress, format, aad });
    const out = decryptPayload(encrypted, {
      keyMap: { [kid]: key },
      compress,
      aad,
    });
    assert.equal(eq(payload, out), true);
  }
}

module.exports = {
  run: () => {
    runPropertyRoundTrips();
  },
};
