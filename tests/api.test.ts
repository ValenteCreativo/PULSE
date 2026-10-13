import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPulseApi, healthSchema } from "../src/api/server.js";
import { demoRecords } from "../src/fixtures/demo-records.js";
import { computeHumanPulse, humanPulseSchema } from "../src/pulse/human-pulse.js";

const api = createPulseApi(computeHumanPulse(demoRecords, { mode: "fixture", processedAt: new Date("2026-10-12T00:00:00Z") }));

describe("Intelligence API", () => {
  it("returns typed health and Human Pulse documents", async () => {
    const health = await api(new Request("http://pulse.local/api/v1/health"));
    assert.equal(health.status, 200);
    healthSchema.parse(await health.json());
    const pulse = await api(new Request("http://pulse.local/api/v1/human-pulse"));
    assert.equal(pulse.status, 200);
    assert.equal(humanPulseSchema.parse(await pulse.json()).mode, "fixture");
  });

  it("does not advertise paid intelligence before payments exist", async () => {
    const catalog = await api(new Request("http://pulse.local/api/v1/intelligence/catalog"));
    const body = await catalog.json() as { products: Array<{ availability: string; price: null }> };
    assert.ok(body.products.length > 0);
    assert.ok(body.products.every((product) => product.availability === "payment-not-yet-enabled" && product.price === null));
  });

  it("returns explicit errors for unsupported routes and methods", async () => {
    assert.equal((await api(new Request("http://pulse.local/api/v1/missing"))).status, 404);
    assert.equal((await api(new Request("http://pulse.local/api/v1/health", { method: "POST" }))).status, 405);
  });
});
