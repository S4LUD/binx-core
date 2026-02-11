const tests = [
  "./crypto-roundtrip.test.js",
  "./schema-compat.test.js",
  "./decode-guards.test.js",
  "./serialization-tags.test.js",
  "./security-guards.test.js",
  "./property-roundtrip.test.js",
  "./fuzz-smoke.test.js",
  "./deterministic-vectors.test.js",
  "./observability-errors.test.js",
];

let passed = 0;
for (const file of tests) {
  try {
    const mod = require(file);
    if (!mod || typeof mod.run !== "function") {
      throw new Error(`Missing run() in ${file}`);
    }
    mod.run();
    console.log(`PASS ${file}`);
    passed++;
  } catch (err) {
    console.error(`FAIL ${file}`);
    console.error(err instanceof Error ? err.stack : err);
    process.exit(1);
  }
}

console.log(`All tests passed (${passed}/${tests.length}).`);
