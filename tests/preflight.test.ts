import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { inspectDataset } from "../src/data/preflight.js";
import { createSamplingPlan } from "../src/data/sampling.js";

describe("dataset preflight", () => {
  it("reports an inaccessible source without attempting data sampling", async () => {
    const report = await inspectDataset("owner/repo", { maxBytes: 1000, maxRows: 10, timeoutMs: 1000 }, async () => new Response("denied", { status: 401 }));
    assert.equal(report.status, "inaccessible");
    assert.equal(report.httpStatus, 401);
    assert.deepEqual(report.files, []);
    assert.throws(() => createSamplingPlan(report), /Dataset unavailable/);
  });

  it("builds a deterministic plan under both byte and row budgets", async () => {
    const report = await inspectDataset("owner/repo", { maxBytes: 100, maxRows: 12, timeoutMs: 1000 }, async () => new Response(JSON.stringify({
      sha: "abc", siblings: [
        { rfilename: "b.parquet", size: 40 }, { rfilename: "a.parquet", lfs: { size: 50 } }, { rfilename: "notes.md", size: 2 },
      ],
    }), { status: 200 }));
    assert.deepEqual(createSamplingPlan(report), { files: ["a.parquet", "b.parquet"], maxRows: 12, maxBytes: 90 });
  });
});
