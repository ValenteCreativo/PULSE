"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { humanPulseSchema, systemStatusSchema, type HumanPulse } from "../../../src/api/public-contracts";
import { FilmOverlay } from "../components/film-overlay";

type Status = ReturnType<typeof systemStatusSchema.parse>;
type Topic = HumanPulse["topics"][number];
const clamp = (value: number) => Math.min(1, Math.max(0, value));
const PulseInstallation = dynamic(() => import("../components/pulse-installation"), { ssr: false, loading: () => <div className="installation-fallback"/> });

export default function Home() {
  const [status, setStatus] = useState<Status | null>(null); const [pulse, setPulse] = useState<HumanPulse | null>(null); const [selected, setSelected] = useState<Topic | null>(null);
  const [progress, setProgress] = useState(0); const smooth = useRef(0); const last = useRef(0);
  useEffect(() => { Promise.all([fetch("/api/v1/status"), fetch("/api/v1/human-pulse")]).then(async ([a,b]) => { if (!a.ok || !b.ok) return; setStatus(systemStatusSchema.parse(await a.json())); setPulse(humanPulseSchema.parse(await b.json())); }).catch(() => undefined); }, []);
  useEffect(() => {
    let raf = 0; last.current = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last.current) / 16.6667, 3); last.current = now;
      const target = clamp(window.scrollY / Math.max(innerHeight * 7.4, 1));
      if (Math.abs(target - smooth.current) > 0.2) smooth.current = target;
      else smooth.current += (target - smooth.current) * (1 - Math.pow(1 - 0.2, dt));
      setProgress(smooth.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const signals = useMemo(() => pulse?.topics.slice(0, 10) ?? [], [pulse]);
  return <main className="pulse-film"><nav className="topnav"><Link href="/" className="brand">PULSE<span>/</span></Link><span className="nav-network">THE INTELLIGENCE MARKETPLACE</span><Link className="agent-link" href="/agents">FOR AGENTS <b>↗</b></Link></nav><div className="hud" aria-hidden="true"><i className="corner tl"/><i className="corner tr"/><i className="corner bl"/><i className="corner br"/><span>REC · {pulse?.mode ?? "FIXTURE"}</span><span>MONAD TESTNET · 10143</span></div><section className="pulse-film-track" aria-label="PULSE cinematic attention intelligence observatory"><div className="pulse-film-stage"><PulseInstallation signals={signals} progress={progress} onHover={(signal) => setSelected(signal ? signals.find((topic) => topic.id === signal.id) ?? null : null)}/><FilmOverlay signals={signals} selected={selected} status={status} progress={progress}/></div></section><noscript><section className="film-noscript"><h1>PULSE — The intelligence marketplace for the next million AI creators</h1><p>Use the public, read-only PULSE API without JavaScript at <a href="/agents">/agents</a>.</p></section></noscript></main>;
}
