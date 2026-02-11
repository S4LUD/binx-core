const assert = require("node:assert/strict");
const { encryptPayload, decryptPayload, BinxError } = require("../dist/index.js");

function runErrorCodes() {
  assert.throws(
    () => decryptPayload("AAAA", { keyMap: { 0: "x" } }),
    (err) =>
      err instanceof BinxError &&
      err.code === "BINX_PAYLOAD_TRUNCATED" &&
      /too short/.test(err.message)
  );

  assert.throws(
    () => encryptPayload({ ok: true }, { key: "k", kid: 999, format: "base64" }),
    (err) =>
      err instanceof BinxError && err.code === "BINX_INVALID_KID" && /Invalid KID/.test(err.message)
  );
}

function runLoggerHooks() {
  const events = [];
  const logger = (event) => events.push(event);

  const encrypted = encryptPayload(
    { v: 1 },
    {
      key: "k",
      kid: 3,
      format: "base64",
      logger,
    }
  );
  decryptPayload(encrypted, {
    keyMap: { 3: "k" },
    logger,
  });

  assert.equal(
    events.some((e) => e.op === "encrypt:start"),
    true
  );
  assert.equal(
    events.some((e) => e.op === "encrypt:success"),
    true
  );
  assert.equal(
    events.some((e) => e.op === "decrypt:start"),
    true
  );
  assert.equal(
    events.some((e) => e.op === "decrypt:success"),
    true
  );
}

module.exports = {
  run: () => {
    runErrorCodes();
    runLoggerHooks();
  },
};
