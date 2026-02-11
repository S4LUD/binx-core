const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { serializePayload, encryptPayload, decryptPayload } = require("../dist/index.js");

const VECTOR_PAYLOAD = { userId: 42, active: true, note: "hello", count: 7n };
const EXPECTED_SERIALIZED_HEX =
  "01041654beea42a97f8e44117c8af534c87e4f02f8862249ec10a022ec4c05d7bddb0675736572496403000000040000002a06616374697665020000000101046e6f7465050000000568656c6c6f05636f756e7408000000080000000000000007";
const EXPECTED_ENCRYPTED_BASE64 =
  "gQEBAQEBAQEBAQEBAQG/NehNL6vcJmMb4fqaI5g2wR8sFGSYRESINrzUN33BajG5p68SvEbjufdf9OptM6q+c5HMNk9PVh1ZafUUaZvpDiO8Gno1w0/9+qCdEV3sWw6+hKOgmvwpHmL3CPLRwUDjoNGktcWR6wY7UVLnQmt50w==";

function runSerializationVector() {
  const serialized = Buffer.from(serializePayload(VECTOR_PAYLOAD)).toString("hex");
  assert.equal(serialized, EXPECTED_SERIALIZED_HEX);
}

function runEncryptionVector() {
  const originalRandomBytes = crypto.randomBytes;
  crypto.randomBytes = (n) => Buffer.alloc(n, 1);
  try {
    const encrypted = encryptPayload(VECTOR_PAYLOAD, {
      key: "secret",
      kid: 1,
      format: "base64",
      aad: "tenant:acme",
    });
    assert.equal(encrypted, EXPECTED_ENCRYPTED_BASE64);
    const out = decryptPayload(encrypted, {
      keyMap: { 1: "secret" },
      aad: "tenant:acme",
    });
    assert.equal(out.userId, 42);
    assert.equal(out.note, "hello");
    assert.equal(out.count, 7n);
  } finally {
    crypto.randomBytes = originalRandomBytes;
  }
}

module.exports = {
  run: () => {
    runSerializationVector();
    runEncryptionVector();
  },
};
