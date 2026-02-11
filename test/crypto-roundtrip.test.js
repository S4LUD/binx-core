const assert = require("node:assert/strict");
const { encryptPayload, decryptPayload } = require("../dist/index.js");

function run() {
  const payload = {
    userId: 42,
    active: true,
    big: 9007199254740991,
    count: 7n,
    note: "hello",
  };

  const encrypted = encryptPayload(payload, {
    key: "secret",
    kid: 1,
    format: "binary",
  });

  assert.equal(encrypted instanceof ArrayBuffer, true);

  const out = decryptPayload(encrypted, {
    keyMap: { 1: "secret" },
  });

  assert.equal(out.userId, payload.userId);
  assert.equal(out.active, payload.active);
  assert.equal(out.big, payload.big);
  assert.equal(out.count, payload.count);
  assert.equal(out.note, payload.note);
}

function runWrongKey() {
  const encrypted = encryptPayload(
    { ok: true },
    {
      key: "correct",
      kid: 9,
      format: "base64",
    }
  );

  assert.throws(
    () =>
      decryptPayload(encrypted, {
        keyMap: { 9: "wrong" },
      }),
    /Decryption failed/
  );
}

function runAadRoundTrip() {
  const encrypted = encryptPayload(
    { scope: "payments", value: 123 },
    {
      key: "correct",
      kid: 2,
      format: "base64",
      aad: "tenant:acme",
    }
  );

  const out = decryptPayload(encrypted, {
    keyMap: { 2: "correct" },
    aad: "tenant:acme",
  });
  assert.equal(out.scope, "payments");
  assert.equal(out.value, 123);
}

function runAadMismatchFails() {
  const encrypted = encryptPayload(
    { scope: "payments", value: 123 },
    {
      key: "correct",
      kid: 2,
      format: "base64",
      aad: "tenant:acme",
    }
  );

  assert.throws(
    () =>
      decryptPayload(encrypted, {
        keyMap: { 2: "correct" },
        aad: "tenant:other",
      }),
    /Decryption failed/
  );
}

module.exports = {
  run: () => {
    run();
    runWrongKey();
    runAadRoundTrip();
    runAadMismatchFails();
  },
};
