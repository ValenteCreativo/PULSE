"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { humanPulseSchema, systemStatusSchema, type HumanPulse } from "../../../src/api/public-contracts";
import { FilmOverlay } from "../components/film-overlay";

type Status = ReturnType<typeof systemStatusSchema.parse>;
type Topic = HumanPulse["topics"][number];
const PulseInstallation = dynamic(() => import("../components/pulse-installation"), { ssr: false, loading: () => <div className="installation-fallback"/> });

export default function Home() {
  const [status, setStatus] = useState<Status | null>(null); const [pulse, setPulse] = useState<HumanPulse | null>(null); const [selected, setSelected] = useState<Topic | null>(null);
  useEffect(() => { Promise.all([fetch("/api/v1/status"), fetch("/api/v1/human-pulse")]).then(async ([a,b]) => { if (!a.ok || !b.ok) return; setStatus(systemStatusSchema.parse(await a.json())); setPulse(humanPulseSchema.parse(await b.json())); }).catch(() => undefined); }, []);
  const signals = useMemo(() => pulse?.topics.slice(0, 10) ?? [], [pulse]);
  return <main className="pulse-film"><nav className="topnav"><Link href="/" className="brand">PULSE<span>/</span></Link><span className="nav-network">ATTENTION INTELLIGENCE NETWORK</span><Link className="agent-link" href="/agents">FOR AGENTS <b>↗</b></Link></nav><div className="hud" aria-hidden="true"><i className="corner tl"/><i className="corner tr"/><i className="corner bl"/><i className="corner br"/><span>REC · {pulse?.mode ?? "FIXTURE"}</span><span>MONAD TESTNET · 10143</span></div><section className="pulse-film-track" aria-label="PULSE cinematic attention intelligence observatory"><div className="pulse-film-stage"><PulseInstallation signals={signals} onHover={(signal) => setSelected(signal ? signals.find((topic) => topic.id === signal.id) ?? null : null)}/><FilmOverlay signals={signals} selected={selected} status={status}/></div></section><noscript><section className="film-noscript"><h1>PULSE — Attention Intelligence Network</h1><p>Use the public, read-only PULSE API without JavaScript at <a href="/agents">/agents</a>.</p></section></noscript></main>;
}
