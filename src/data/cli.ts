import { inspectDataset } from "./preflight.js";
import { createSamplingPlan } from "./sampling.js";

const preflight = await inspectDataset();
try {
  process.stdout.write(`${JSON.stringify({ preflight, plan: createSamplingPlan(preflight) }, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`Sampling not started: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 2;
}
