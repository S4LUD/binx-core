const assert = require("node:assert/strict");
const { encryptPayload, decryptPayload, serializePayload } = require("../dist/index.js");

function deepObject(depth) {
  let out = { v: 1 };
  for (let i = 0; i < depth; i++) {
    out = { next: out };
  }
  return out;
}

function runInvalidKid() {
  assert.throws(
    () => encryptPayload({ ok: true }, { key: "k", kid: -1, format: "base64" }),
    /Invalid KID/
  );
  assert.throws(
    () =>
      decryptPayload("gAAB", {
        keyMap: { 300: "k" },
      }),
    /Invalid KID/
  );
}

function runDepthLimit() {
  assert.throws(() => serializePayload(deepObject(40)), /Max nesting depth exceeded/);
}

function runStringLimit() {
  const large = "a".repeat(1024 * 1024 + 1);
  assert.throws(() => serializePayload({ large }), /String too large/);
}

function runAadLimit() {
  const aad = "x".repeat(8 * 1024 + 1);
  assert.throws(
    () => encryptPayload({ ok: true }, { key: "k", kid: 1, format: "base64", aad }),
    /AAD exceeds/
  );
}

module.exports = {
  run: () => {
    runInvalidKid();
    runDepthLimit();
    runStringLimit();
    runAadLimit();
  },
};
