process.stdout.write(JSON.stringify({
  mode: "dry-run",
  status: "not-ready",
  reason: "Autonomous agent and payment milestones have not been implemented; no model or chain call was made.",
}, null, 2) + "\n");
