"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Signal } from "./pulse-installation";

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const phase = (value: number, from: number, to: number) => clamp((value - from) / (to - from));
export function FilmOverlay({ signals, selected }: { signals: Signal[]; selected: Signal | null }) {
  const [p, setP] = useState(0); const [loaded, setLoaded] = useState(false); const smooth = useRef(0);
  useEffect(() => { const done = window.setTimeout(() => setLoaded(true), 900); const tick = () => { const raw = clamp(window.scrollY / Math.max(innerHeight * 8.4 - innerHeight, 1)); smooth.current += (raw-smooth.current)*.2; setP(smooth.current); requestAnimationFrame(tick); }; const id=requestAnimationFrame(tick); return()=>{clearTimeout(done);cancelAnimationFrame(id);}; },[]);
  const hero = 1-phase(p,.012,.075), corridor=phase(p,.05,.22), cases=phase(p,.14,.35), panels=phase(p,.39,.86), finale=phase(p,.84,.98);
  return <>
    {!loaded && <div className="film-loader"><strong>092</strong><span>CALIBRATING THE SIGNAL ROOM</span><div>{Array.from({length:64},(_,i)=><i key={i} className={i<44?"on":""}/>)}</div></div>}
    <div className="film-copy" style={{opacity:hero,visibility:hero>.01?"visible":"hidden"}}><h1>THE WORLD IS<br/>PAYING ATTENTION.<br/><em>ARE AGENTS?</em></h1><div className="film-intro">Human attention is becoming machine-readable.<br/>PULSE makes the gap observable.<p><a href="#market">Explore intelligence</a><Link href="/agents">For agents ↗</Link></p></div></div>
    <div className="film-chip" style={{opacity:selected ? 1 : 0}}>{selected ? <>#{selected.label} · {Math.round(selected.prevalence*100)}% <b>EXPLORE SIGNAL ↗</b></> : ""}</div>
    <div className="flight-lines" style={{opacity:corridor}}><p>HUMANS CREATE<br/>THE SIGNAL.</p><small>AGENTS TURN ATTENTION INTO DEMAND.</small></div>
    <section className="film-case" style={{opacity:cases,visibility:cases>.05?"visible":"hidden"}}><h2>INTELLIGENCE<br/>MARKET</h2><button>Previous</button><button>Next</button><div><strong>{signals[0]?.label ?? "Signal"}</strong><span>PUBLIC FIXTURE · PRICE NOT YET ACTIVE</span></div></section>
    <div className="film-panels" aria-hidden={panels<.02}><section style={{transform:`translateY(${(1-phase(p,.39,.61))*100}%)`}}><p>[ 01 / 02 ]</p><h2>AGENT<br/>PULSE</h2><div className="ring-cards"><i/><i/><i/><i/><i/></div><span>NO VERIFIED ATTRIBUTABLE PURCHASES INDEXED</span></section><section style={{transform:`translateY(${(1-phase(p,.61,.86))*100}%)`}}><p>[ 02 / 02 ]</p><h2>THE ATTENTION<br/>GAP</h2><div className="panel-columns"><b>HUMAN SIGNAL<br/><em>FIXTURE DATA</em></b><b>AGENT DEMAND<br/><em>UNAVAILABLE</em></b><b>SETTLEMENT<br/><em>MONAD TESTNET</em></b></div></section></div>
    <div className="film-ending" style={{opacity:finale,visibility:finale>.01?"visible":"hidden"}}><h2>ATTENTION IS<br/>BECOMING AN<br/><em>ECONOMY.</em></h2><p>PULSE makes it observable.</p><Link href="/agents">View the agent interface ↗</Link></div>
  </>;
}
