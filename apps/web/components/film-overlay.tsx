"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Signal } from "./pulse-installation";

type Status = { indexer: { status: string }; payments: { status: string } } | null;
const clamp = (value: number) => Math.min(1, Math.max(0, value));
const phase = (value: number, from: number, to: number) => clamp((value - from) / (to - from));
const pct = (value: number) => `${Math.round(value * 100)}%`;
const TERMINAL_SNIPPET = `# PULSE — buy attention intelligence as an AI agent (Monad testnet · chain 10143)
# Hackathon prototype · sample/fixture data · dry-run, no funds spent.

# 1. Discover what intelligence is for sale
curl https://pulse.local/api/v1/intelligence/catalog
# -> { "products": [ { "id": "human-pulse:<topic>", "availability": "payment-not-yet-enabled", "price": null } ] }

# 2. (Illustrative) request an entitlement after paying in MON on Monad testnet
#    Contract: 0x0a14814aa3d4fd9c2e17090af23a655204993bff
curl -X POST https://pulse.local/api/v1/intelligence/entitlements \\
  -H "content-type: application/json" \\
  -d '{ "productId": "human-pulse:<topic>", "chainId": 10143, "txHash": "0x..." }'
# -> HTTP 503 { "code": "PAYMENT_NOT_CONFIGURED" }  (purchase path is dry-run on this demo — never broadcasts a tx)

# Same flow in JS — safe to copy, nothing is signed or sent:
const catalog = await fetch("https://pulse.local/api/v1/intelligence/catalog").then((r) => r.json());
const purchase = await fetch("https://pulse.local/api/v1/intelligence/entitlements", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ productId: catalog.products[0].id, chainId: 10143, txHash: "0x..." }),
}).then((r) => r.json()); // { code: "PAYMENT_NOT_CONFIGURED" } until paid intelligence is enabled`;
export function FilmOverlay({ signals, selected, status, progress }: { signals: Signal[]; selected: Signal | null; status: Status; progress: number }) {
  const [ready,setReady] = useState(false); const [caseIndex,setCaseIndex] = useState(0); const [pointer,setPointer] = useState({x:0,y:0}); const [copied,setCopied] = useState(false);
  useEffect(() => { const unlock = window.setTimeout(()=>setReady(true),1250); return()=>clearTimeout(unlock); },[]);
  useEffect(()=>{const move=(event:PointerEvent)=>setPointer({x:event.clientX,y:event.clientY});addEventListener("pointermove",move);return()=>removeEventListener("pointermove",move);},[]);
  const copySnippet = async () => { try { await navigator.clipboard.writeText(TERMINAL_SNIPPET); setCopied(true); window.setTimeout(()=>setCopied(false),1800); } catch { /* clipboard unavailable */ } };
  const hero=1-phase(progress,.012,.075), flight=phase(progress,.075,.29), market=phase(progress,.16,.39), team=phase(progress,.40,.58), gap=phase(progress,.58,.75), finale=phase(progress,.76,.98); const topic=signals[caseIndex%Math.max(signals.length,1)];
  return <>
    {!ready && <div className="film-loader" aria-live="polite"><strong>092</strong><span>CALIBRATING HUMAN SIGNALS</span><div>{Array.from({length:64},(_,i)=><i key={i} className={i<59?"on":""}/>)}</div></div>}
    <div className="film-hero-copy" style={{opacity:hero,visibility:hero>.01?"visible":"hidden"}}><p>THE INTELLIGENCE MARKETPLACE</p><h1>PULSE — INTELLIGENCE<br/>FOR THE NEXT MILLION<br/>AI <em>CREATORS.</em></h1><div><span>Everyone is building AI agents that create content. But who&apos;s telling those agents what to create?</span><a href="/agents">For Agents ↗</a></div></div>
    <div className="hero-powered" style={{opacity:hero,visibility:hero>.01?"visible":"hidden"}}><span>POWERED BY</span><b>Monad × Envio</b></div>
    <div className="film-hover-chip" style={{opacity:selected ? 1 : 0,transform:`translate3d(${pointer.x+18}px,${pointer.y-18}px,0)`}}>{selected && <><span>#{selected.label}</span><b>{pct(selected.prevalence)}</b><i>{selected.momentum===null?"FIXTURE":"EXPLORE SIGNAL ↗"}</i></>}</div>
    <div className="film-flight" style={{opacity:flight*(1-phase(progress,.35,.43))}}><h2>EVERYONE IS BUILDING<br/>AGENTS THAT <em>CREATE.</em></h2><p>But who&apos;s telling those agents what to create? PULSE turns the internet&apos;s attention data into intelligence AI creators can buy and act on.</p></div>
    <section className="film-market" style={{opacity:market*(1-team),visibility:market>.02&&team<.98?"visible":"hidden"}} aria-label="Human Pulse"><h2>HUMAN<br/>PULSE</h2><p className="market-usecase">Intelligence built from the signals people leave across TikTok, YouTube, Reddit, and the rest of the internet. An autonomous YouTube agent knows which formats are taking off, what sounds are spreading, how long successful videos run, and which patterns drive engagement.</p><p className="market-steps">1 DISCOVER — which formats are taking off.   2 DECIDE — what sounds are spreading, how long videos run.   3 CREATE — which patterns drive engagement, fed to your agent.</p><div className="market-controls"><button onClick={()=>setCaseIndex((value)=>(value+signals.length-1)%Math.max(signals.length,1))}>Previous</button><button onClick={()=>setCaseIndex((value)=>(value+1)%Math.max(signals.length,1))}>Next</button></div><div className="market-dock"><strong>{topic ? `#${topic.label}` : "Loading signal"}</strong><span>{topic ? `Human attention ${pct(topic.prevalence)} · ${topic.momentum===null?"fixture momentum unavailable":`momentum ${pct(topic.momentum)}`}` : ""}</span><small>LABELED FIXTURE DATA · NOT LIVE SOCIAL TRENDS · PUBLIC READ ACCESS</small></div></section>
    <div className="film-panel-stack" aria-hidden={team<.01&&gap<.01}><section className="film-panel agent-panel" style={{transform:`translateY(${(1-team)*110}%)`}}><p>[ 01 / 02 ]</p><h2 id="agent-pulse">AGENT<br/>PULSE</h2><p className="panel-tagline">Agents buy that intelligence on Monad. Every purchase creates a transaction. Every transaction reveals what AI creators are interested in. That&apos;s Agent Pulse.</p><div className="film-ring">{[0,1,2,3,4].map((card)=><i key={card} style={{transform:`rotateY(${(card-2)*22}deg) translateZ(${Math.abs(card-2)*-22}px)`}}/>)}</div><div className="panel-dock"><b>REGISTERED AGENTS: 0</b><span>VERIFIED PURCHASES: 0 · {status?.indexer.status ?? "AWAITING CLOUD"}</span><small>Agent Pulse stays intentionally empty until real attributable, indexed Monad purchases exist. Monad settles the purchases; Envio indexes them.</small></div></section><section className="film-panel gap-panel" style={{transform:`translateY(${(1-gap)*110}%)`}}><p>[ 02 / 02 ]</p><h2>THE ATTENTION<br/>GAP</h2><p className="panel-tagline">Where human interest and agent demand diverge.</p><div className="gap-field"><b>HUMAN<br/><em>FIXTURE SIGNAL</em></b><i>×</i><b>AGENT<br/><em>NO EVIDENCE YET</em></b></div><div className="panel-dock"><b>ATTENTION GAP: UNAVAILABLE</b><span>When agent demand becomes measurable, the gap surfaces content opportunities humans want but agents overlook. It stays unavailable until enough verified agent purchases exist.</span></div></section></div>
    <section className="film-final" style={{opacity:finale,visibility:finale>.01?"visible":"hidden"}}><h2>THE MARKETPLACE<br/>BETWEEN ATTENTION<br/>&amp; <em>CREATION.</em></h2><p>We can observe what AI agents are spending money to understand. We&apos;re building the marketplace between human attention and autonomous creation.</p><p className="final-honesty">Our hackathon prototype demonstrates this model with sample attention data, agent-facing APIs, and a Monad testnet marketplace.</p><div><Link href="/agents">View the agent interface ↗</Link><a href="/api/v1/manifest.json">Public manifest ↗</a><a href="https://testnet.monadvision.com/address/0x0a14814aa3d4fd9c2e17090af23a655204993bff" target="_blank" rel="noreferrer">Inspect Monad contract ↗</a></div></section>
    <section className="film-terminal" style={{opacity:market*(1-team),visibility:market>.02&&team<.98?"visible":"hidden"}} aria-label="Intelligence terminal"><div className="terminal-shell"><div className="terminal-bar"><span>POST /intelligence · BUY ON MONAD<b>●</b></span><button type="button" onClick={copySnippet}>{copied?"Copied ✓":"Copy snippet"}</button></div><pre>{TERMINAL_SNIPPET}</pre><small>Hackathon prototype · Monad testnet · chain 10143 · sample/fixture data · dry-run, no funds spent.</small></div></section>
  </>;
}
