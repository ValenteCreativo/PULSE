import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { compilePulseMarket } from "../src/contract/compile.js";

const artifact = await compilePulseMarket();
const output = resolve(process.cwd(), "artifacts/PulseIntelligenceMarket.json");
await mkdir(resolve(process.cwd(), "artifacts"), { recursive: true });
await writeFile(output, JSON.stringify({ contractName: "PulseIntelligenceMarket", ...artifact }, null, 2));
process.stdout.write(JSON.stringify({ artifact: output, bytecodeBytes: (artifact.bytecode.length - 2) / 2, network: "Monad testnet (chain 10143)", deployed: false }, null, 2) + "\n");
