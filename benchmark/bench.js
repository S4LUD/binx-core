const { performance } = require("node:perf_hooks");
const { encryptPayload, decryptPayload, serializePayload, parsePayload } = require("../dist/index.js");

const payload = {
  userId: 42,
  active: true,
  note: "benchmark",
  flags: [1, 2, 3, 4],
  meta: { region: "us", tier: "pro" },
};

function timeIt(label, fn, iterations = 5000) {
  const t0 = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const t1 = performance.now();
  const totalMs = t1 - t0;
  const avgUs = (totalMs * 1000) / iterations;
  console.log(`${label}: total=${totalMs.toFixed(2)}ms avg=${avgUs.toFixed(2)}us`);
}

const ser = serializePayload(payload);
const enc = encryptPayload(payload, { key: "bench-key", kid: 1, format: "binary" });

timeIt("serializePayload", () => serializePayload(payload));
timeIt("parsePayload", () => parsePayload(ser));
timeIt("encryptPayload", () => encryptPayload(payload, { key: "bench-key", kid: 1, format: "binary" }));
timeIt("decryptPayload", () => decryptPayload(enc, { keyMap: { 1: "bench-key" } }));
