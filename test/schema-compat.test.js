const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { serializePayload } = require("../dist/serialization/encode.js");
const { parsePayload } = require("../dist/serialization/decode.js");

function runLegacyAccepted() {
  const payload = { n: 1, s: "x", b: true, meta: { a: 1 } };
  const buf = serializePayload(payload);
  const u8 = new Uint8Array(buf);

  const legacyStr = Object.keys(payload)
    .map((k) => `${k}:${typeof payload[k]}`)
    .join(",");
  const legacyHash = crypto.createHash("sha256").update(legacyStr).digest();
  u8.set(legacyHash, 2);

  const out = parsePayload(u8.buffer);
  assert.equal(out.n, 1);
  assert.equal(out.s, "x");
}

function runStrictRejectsLegacy() {
  const payload = { n: 1, s: "x", b: true };
  const buf = serializePayload(payload);
  const u8 = new Uint8Array(buf);

  const legacyStr = Object.keys(payload)
    .map((k) => `${k}:${typeof payload[k]}`)
    .join(",");
  const legacyHash = crypto.createHash("sha256").update(legacyStr).digest();
  u8.set(legacyHash, 2);

  assert.throws(
    () => parsePayload(u8.buffer, { allowLegacySchemaHash: false }),
    /Schema hash mismatch/
  );
}

module.exports = {
  run: () => {
    runLegacyAccepted();
    runStrictRejectsLegacy();
  },
};
