#!/usr/bin/env ts-node
import fs from "fs";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { encryptPayload, decryptPayload } from "./index";

async function run() {
  const argv = await yargs(hideBin(process.argv))
    .command("encode <file>", "Serialize and encrypt a JSON file", (y) =>
      y.positional("file", { type: "string", describe: "Input JSON file" })
    )
    .command("decode <file>", "Decrypt and parse a Binx file", (y) =>
      y.positional("file", { type: "string", describe: "Input Binx file" })
    )
    .option("key", {
      type: "string",
      demandOption: true,
      describe: "Encryption key",
    })
    .option("compress", {
      type: "boolean",
      default: false,
      describe: "Use compression",
    })
    .demandCommand(1)
    .help()
    .parse();

  const command = argv._[0];
  const filePath = path.resolve(argv.file as string);
  const key = argv.key as string;
  const compress = argv.compress as boolean;

  if (command === "encode") {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const encrypted = encryptPayload(data, { key, compress, format: "base64" });
    console.log(encrypted);
  } else if (command === "decode") {
    const input = fs.readFileSync(filePath, "utf-8");
    const decrypted = decryptPayload(input, { key, compress });
    console.log(JSON.stringify(decrypted, null, 2));
  } else {
    console.error("Unknown command");
  }
}

run();
