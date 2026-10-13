import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertRemoteFileWithinBudget, duckDbVersion } from "../src/data/duckdb.js";
import { demoRecords } from "../src/fixtures/demo-records.js";
import { computeHumanPulse } from "../src/pulse/human-pulse.js";

describe("Human Pulse", () => {
  it("uses a functioning embedded DuckDB runtime", async () => {
    assert.match(await duckDbVersion(), /^v?\d+\.\d+/);
  });

  it("enforces source byte budgets", () => {
    assert.doesNotThrow(() => assertRemoteFileWithinBudget(20, 20));
    assert.throws(() => assertRemoteFileWithinBudget(null, 20), /unknown/);
    assert.throws(() => assertRemoteFileWithinBudget(21, 20), /exceeds/);
  });

  it("computes deterministic, labeled fixture metrics", () => {
    const pulse = computeHumanPulse(demoRecords, { mode: "fixture", processedAt: new Date("2026-10-12T00:00:00Z") });
    assert.equal(pulse.mode, "fixture");
    assert.equal(pulse.topics[0]?.id, "ai");
    assert.equal(pulse.topics[0]?.sampleCount, 3);
    assert.match(pulse.limitations[0]!, /Fixture data only/);
  });
});
