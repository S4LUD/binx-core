const fs = require("node:fs");

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const deps = Object.keys(pkg.dependencies || {});
const allowedRuntimeDeps = new Set(["yargs"]);

const unexpected = deps.filter((d) => !allowedRuntimeDeps.has(d));
if (unexpected.length > 0) {
  console.error(`Unexpected runtime dependencies: ${unexpected.join(", ")}`);
  process.exit(1);
}

console.log(`Runtime dependencies are minimal: ${deps.join(", ") || "(none)"}`);
