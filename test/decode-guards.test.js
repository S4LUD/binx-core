const assert = require("node:assert/strict");
const { decryptPayload } = require("../dist/index.js");
const { parsePayload } = require("../dist/serialization/decode.js");

function runDecryptTooShort() {
  const short = Buffer.alloc(10).toString("base64");
  assert.throws(() => decryptPayload(short, { keyMap: { 0: "x" } }), /too short/);
}

function runParseTooShort() {
  assert.throws(() => parsePayload(new ArrayBuffer(3)), /too short/);
}

module.exports = {
  run: () => {
    runDecryptTooShort();
    runParseTooShort();
  },
};
