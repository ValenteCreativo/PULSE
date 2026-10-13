"use client";

import { useEffect, useState } from "react";
import { humanPulseSchema, systemStatusSchema, type HumanPulse } from "../../../src/api/public-contracts";

type Status = ReturnType<typeof systemStatusSchema.parse>;

export default function Home() {
  const [status, setStatus] = useState<Status | null>(null);
  const [pulse, setPulse] = useState<HumanPulse | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    Promise.all([fetch("/api/v1/status"), fetch("/api/v1/human-pulse")])
      .then(async ([statusResponse, pulseResponse]) => {
        if (!statusResponse.ok || !pulseResponse.ok) throw new Error("PULSE API is unavailable");
        setStatus(systemStatusSchema.parse(await statusResponse.json()));
        setPulse(humanPulseSchema.parse(await pulseResponse.json()));
      }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load PULSE"));
  }, []);

  return <main>
    <header><p className="eyebrow">MONAD TESTNET · PULSE</p><h1>Attention intelligence for agents.</h1><p className="lede">A transparent demo of deterministic Human Pulse and attributable Agent Pulse. No live social-data claims.</p></header>
    {error ? <p className="error">{error}</p> : null}
    <section className="status" aria-label="System status">
      <article><span>Network</span><strong>{status?.chain.network ?? "Loading…"}</strong><small>Chain {status?.chain.id ?? "—"}</small></article>
      <article><span>Human Pulse</span><strong>{status?.humanPulse.dataStatus ?? "Loading…"}</strong><small>Clearly labelled fixture mode</small></article>
      <article><span>Indexer</span><strong>{status?.indexer.status ?? "Loading…"}</strong><small>{status?.indexer.graphqlUrl ?? "Envio Cloud handoff pending"}</small></article>
    </section>
    <section className="panel"><div><p className="eyebrow">HUMAN PULSE</p><h2>{pulse?.generatedNarrative ?? "Loading deterministic signals…"}</h2><p>{pulse?.limitations[0]}</p></div><p className="confidence">Confidence<br/><strong>{pulse ? `${Math.round(pulse.confidence * 100)}%` : "—"}</strong></p></section>
    <section><p className="eyebrow">TOPICS</p><div className="topics">{pulse?.topics.map((topic) => <article key={topic.id}><h3>#{topic.label}</h3><strong>{Math.round(topic.prevalence * 100)}%</strong><small>sample prevalence · {topic.sampleCount} records</small></article>) ?? <p>Loading…</p>}</div></section>
    <footer>Payments remain disabled until an operator configures a product and explicitly authorizes a testnet purchase.</footer>
  </main>;
}
