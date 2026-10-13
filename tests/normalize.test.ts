import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeVideo } from "../src/data/normalize.js";

describe("normalizeVideo", () => {
  it("normalizes known fields and strips creator identity", () => {
    const output = normalizeVideo({ id: "video-7", desc: "Build #AI with #Monad", author: "private-person", play_count: "12", digg_count: 4, created_at: "2025-01-02T03:04:05Z" }, { repository: "owner/repo", revision: "abc" });
    assert.equal(output.text, "Build #AI with #Monad");
    assert.deepEqual(output.hashtags, ["ai", "monad"]);
    assert.equal(output.engagement.views, 12);
    assert.equal(output.engagement.likes, 4);
    assert.equal(output.provenance.datasetRevision, "abc");
    assert.doesNotMatch(JSON.stringify(output), /private-person/);
    assert.equal(output.sourceRecordId.length, 64);
  });

  it("tolerates missing and invalid observation values", () => {
    const output = normalizeVideo({ caption: "", views: -1, timestamp: "not a date" }, { repository: "owner/repo" });
    assert.equal(output.publishedAt, null);
    assert.equal(output.engagement.views, null);
  });
});
