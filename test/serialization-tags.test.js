const assert = require("node:assert/strict");
const { serializePayload, parsePayload } = require("../dist/index.js");

function runPrimitiveTags() {
  const payload = {
    n: null,
    b: true,
    i32: 123,
    i32neg: -123,
    f: 3.5,
    s: "hello",
    bi: 7n,
    dt: new Date("2024-01-01T00:00:00.000Z"),
    bl: new Uint8Array([1, 2, 3]),
  };
  const out = parsePayload(serializePayload(payload));
  assert.equal(out.n, null);
  assert.equal(out.b, true);
  assert.equal(out.i32, 123);
  assert.equal(out.i32neg, -123);
  assert.equal(out.f, 3.5);
  assert.equal(out.s, "hello");
  assert.equal(out.bi, 7n);
  assert.equal(out.dt.toISOString(), "2024-01-01T00:00:00.000Z");
  assert.deepEqual(Array.from(out.bl), [1, 2, 3]);
}

function runIntegerRangeBehavior() {
  const payload = {
    small: 2147483647,
    smallNeg: -2147483648,
    large: 2147483648,
    largeNeg: -2147483649,
  };
  const out = parsePayload(serializePayload(payload));
  assert.equal(out.small, 2147483647);
  assert.equal(out.smallNeg, -2147483648);
  assert.equal(out.large, 2147483648);
  assert.equal(out.largeNeg, -2147483649);
}

function runJsonTagBehavior() {
  const payload = {
    arr: [1, "x", { a: true }],
    obj: { nested: { ok: 1 } },
  };
  const out = parsePayload(serializePayload(payload));
  assert.deepEqual(out.arr, [1, "x", { a: true }]);
  assert.deepEqual(out.obj, { nested: { ok: 1 } });
}

module.exports = {
  run: () => {
    runPrimitiveTags();
    runIntegerRangeBehavior();
    runJsonTagBehavior();
  },
};
