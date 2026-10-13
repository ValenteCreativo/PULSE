"use client";

import Link from "next/link";
import { useState } from "react";

const origin = typeof window === "undefined" ? "https://pulse.local" : window.location.origin;
const guide = `PULSE provides public, read-only attention intelligence. Start with GET /api/v1/status, then GET /api/v1/topics or /api/v1/human-pulse. The current public data mode is fixture, not live social data. Paid intelligence is not configured. Monad Testnet is chain 10143; contract 0x0a14814aa3d4fd9c2e17090af23a655204993bff. Discover endpoints at /api/v1/manifest.json and /llms.txt.`;
const endpoints = ["/api/v1/health","/api/v1/status","/api/v1/topics","/api/v1/human-pulse","/api/v1/agent-pulse","/api/v1/attention-gap","/api/v1/intelligence/catalog"];
export default function Agents() {
  const [result, setResult] = useState("Select a read-only endpoint to inspect its live response.");
  const [copied, setCopied] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(guide); setCopied(true); setTimeout(() => setCopied(false), 1800); };
  const inspect = async (path: string) => { setResult("Fetching…"); try { const response = await fetch(path); setResult(JSON.stringify(await response.json(), null, 2)); } catch { setResult("Unable to reach the local API."); } };
  return <main className="agents-page"><nav className="agent-nav"><Link href="/">← PULSE</Link><span>AGENT INTERFACE / v1</span><a href="/api/v1/manifest.json">manifest.json ↗</a></nav><header className="agent-head"><p className="kicker">ATTENTION INTELLIGENCE API · FOR AI AGENTS</p><h1>Give your agent<br/><em>evidence, not theater.</em></h1><p>PULSE supplies human attention intelligence to autonomous content agents, so they can discover what people care about and decide what to create. This public, read-only surface exposes deterministic Human Pulse, Agent Pulse, and Attention Gap data. It works without WebGL or JavaScript.</p><button onClick={copy} className="agent-copy">{copied ? "Copied agent instructions" : "Copy agent instructions"}</button></header>
    <section className="agent-grid"><article><p className="kicker">01 / START HERE</p><h2>Public read access</h2><p>No wallet, API key, or purchase is required to read the public fixture intelligence. It is expressly not a live social-data feed.</p><pre>{`curl ${origin}/api/v1/topics`}</pre></article><article><p className="kicker">02 / SETTLEMENT</p><h2>Monad Testnet</h2><p>Network: Monad Testnet · Chain ID: <b>10143</b></p><code>0x0a14814aa3d4fd9c2e17090af23a655204993bff</code><p>Paid purchase and entitlement verification are currently not configured on this public surface. Never assume a price or broadcast a transaction from these docs.</p></article><article><p className="kicker">03 / PROVENANCE</p><h2>Evidence boundaries</h2><p>Agent Pulse remains insufficient-data until registered-agent wallets have verified indexed purchases. Attention Gap remains unavailable until that evidence exists.</p><Link href="/" className="agent-text-link">See the observatory’s data states →</Link></article></section>
    <section className="api-section"><div><p className="kicker">SUPPORTED OPERATIONS</p><h2>Inspect the real interface.</h2><p>Every operation below maps to an implemented endpoint. Responses are JSON and cache-control is no-store.</p><div className="endpoint-list">{endpoints.map((endpoint) => <button key={endpoint} onClick={() => inspect(endpoint)}><b>GET</b> {endpoint}</button>)}</div></div><div className="playground"><div className="terminal-title">READ-ONLY PLAYGROUND <span>●</span></div><pre>{result}</pre></div></section>
    <section className="schema"><p className="kicker">TOOL CONTRACT</p><h2>Minimal integration example</h2><pre>{`const topics = await fetch("${origin}/api/v1/topics")
  .then((response) => response.json());

// Treat mode === "fixture" as non-live demonstration data.
for (const topic of topics.topics) {
  console.log(topic.id, topic.prevalence, topic.momentum);
}`}</pre><p>Machine discovery: <a href="/llms.txt">/llms.txt</a> · <a href="/api/v1/manifest.json">/api/v1/manifest.json</a></p></section>
  </main>;
}
