"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

export type Signal = { id: string; label: string; prevalence: number; momentum: number | null };

function signalTexture(signal: Signal, index: number) {
  const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 320;
  const context = canvas.getContext("2d")!;
  const hue = [170, 194, 272, 28, 150, 320][index % 6];
  const gradient = context.createRadialGradient(330, 80, 5, 250, 145, 360);
  gradient.addColorStop(0, `hsla(${hue},100%,78%,.98)`); gradient.addColorStop(.2, `hsla(${hue},92%,43%,.85)`); gradient.addColorStop(1, "#02070b");
  context.fillStyle = gradient; context.fillRect(0, 0, 512, 320);
  context.globalAlpha = .35; context.strokeStyle = `hsl(${hue},100%,74%)`; context.lineWidth = 2;
  for (let y = 12; y < 320; y += 12) { context.beginPath(); for (let x = 0; x < 512; x += 8) { const wave = Math.sin(x * .025 + y * .09 + index) * 7 + Math.sin(x * .009 - index) * 12; x ? context.lineTo(x, y + wave) : context.moveTo(x, y + wave); } context.stroke(); }
  context.globalAlpha = 1; context.fillStyle = "#eafffa"; context.font = "600 34px monospace"; context.fillText(`# ${signal.label.toUpperCase()}`, 28, 62);
  context.font = "bold 98px sans-serif"; context.fillText(`${Math.round(signal.prevalence * 100)}%`, 27, 178);
  context.fillStyle = "#bafff4"; context.font = "22px monospace"; context.fillText(signal.momentum === null ? "FIXTURE SIGNAL" : `MOMENTUM ${signal.momentum >= 0 ? "+" : ""}${Math.round(signal.momentum * 100)}`, 30, 270);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}

function CRT({ signal, index, onHover }: { signal: Signal; index: number; onHover: (signal: Signal | null) => void }) {
  const group = useRef<THREE.Group>(null); const [hovered, setHovered] = useState(false);
  const texture = useMemo(() => signalTexture(signal, index), [signal, index]);
  const x = ((index % 5) - 2) * 1.65 + (index > 4 ? .5 : 0); const y = 1.5 - Math.floor(index / 5) * 1.38; const z = -2.5 - Math.floor(index / 5) * .42;
  useFrame(({ clock }) => { if (!group.current) return; const lift = hovered ? .42 : 0; group.current.position.y = THREE.MathUtils.damp(group.current.position.y, y + lift + Math.sin(clock.elapsedTime * 1.4 + index) * (hovered ? .03 : .012), 8, .016); group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, hovered ? (x < 0 ? -.13 : .13) : -x * .035, 8, .016); });
  useEffect(() => () => texture.dispose(), [texture]);
  return <group ref={group} position={[x,y,z]} rotation={[0,-x*.035,0]} onPointerOver={(event: ThreeEvent<PointerEvent>) => { event.stopPropagation(); setHovered(true); onHover(signal); document.body.style.cursor = "crosshair"; }} onPointerOut={() => { setHovered(false); onHover(null); document.body.style.cursor = "default"; }}>
    <mesh castShadow receiveShadow><boxGeometry args={[1.38, .94, .52]}/><meshStandardMaterial color="#071116" roughness={.38} metalness={.65}/></mesh>
    <mesh position={[0,0,.275]}><boxGeometry args={[1.16,.7,.025]}/><meshBasicMaterial map={texture} toneMapped={false}/></mesh>
    <mesh position={[0,-.57,0]}><boxGeometry args={[.42,.18,.34]}/><meshStandardMaterial color="#071116" metalness={.8}/></mesh>
    <pointLight position={[0,0,.65]} color={index % 3 === 0 ? "#bd8aff" : "#8cfff5"} intensity={hovered ? 2.2 : .75} distance={2.8}/>
    <mesh position={[0,0,.292]} scale={[1.22,.78,1]}><planeGeometry/><meshBasicMaterial color={index % 3 === 0 ? "#865cff" : "#5fffea"} transparent opacity={hovered ? .12 : .035} blending={THREE.AdditiveBlending}/></mesh>
  </group>;
}

function Observer() { return <group position={[0,-1.42,.45]}><mesh position={[0,.9,0]} castShadow><sphereGeometry args={[.28,22,18]}/><meshStandardMaterial color="#030506" roughness={1}/></mesh><mesh position={[0,-.15,0]} castShadow><coneGeometry args={[.65,1.95,5]}/><meshStandardMaterial color="#030506" roughness={1}/></mesh></group>; }
function CameraRig({ scroll }: { scroll: number }) { const { camera } = useThree(); const pointer = useRef(new THREE.Vector2()); useEffect(() => { const move = (event: PointerEvent) => pointer.current.set(event.clientX / innerWidth - .5, event.clientY / innerHeight - .5); addEventListener("pointermove", move); return () => removeEventListener("pointermove", move); }, []); useFrame(() => { const flight = Math.min(scroll / 700, 1); camera.position.x = THREE.MathUtils.damp(camera.position.x, pointer.current.x * .45, 4, .016); camera.position.y = THREE.MathUtils.damp(camera.position.y, .3 - flight * .2 - pointer.current.y * .25, 4, .016); camera.position.z = THREE.MathUtils.damp(camera.position.z, 6.2 - flight * 6.6, 3, .016); camera.lookAt(pointer.current.x * .12, .1 - flight * .15, -2.9 - flight * 4); }); return null; }
function Dust() { const points = useMemo(() => { const positions = new Float32Array(560 * 3); for(let i=0;i<positions.length;i+=3){ const n=i/3; positions[i]=Math.sin(n*43.1)*5; positions[i+1]=Math.cos(n*12.3)*2.8; positions[i+2]=-Math.abs(Math.sin(n*7.3))*11+2; } return positions; },[]); return <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[points,3]}/></bufferGeometry><pointsMaterial color="#bafff4" size={.018} transparent opacity={.7} sizeAttenuation/></points>; }
function Scene({ signals, onHover }: { signals: Signal[]; onHover: (signal: Signal | null) => void }) { const [scroll,setScroll] = useState(0); useEffect(() => { const update=()=>setScroll(window.scrollY); addEventListener("scroll",update,{passive:true}); update(); return()=>removeEventListener("scroll",update); },[]); return <Canvas dpr={[1,1.5]} shadows camera={{ position:[0,.3,6.2], fov:42 }} gl={{ antialias:true, powerPreference:"high-performance" }} onPointerMissed={() => onHover(null)}><color attach="background" args={["#05090d"]}/><fog attach="fog" args={["#071218",2.7,14]}/><ambientLight intensity={.35}/><directionalLight position={[3,5,5]} intensity={1.5} color="#b7efff" castShadow/><pointLight position={[-4,1.5,1]} color="#60e6e8" intensity={9} distance={7}/><pointLight position={[4,1,-1]} color="#8d62ff" intensity={6} distance={8}/><mesh rotation={[-Math.PI/2,0,0]} position={[0,-1.5,-2]} receiveShadow><planeGeometry args={[30,30]}/><meshStandardMaterial color="#071014" roughness={.68} metalness={.35}/></mesh><Dust/><Observer/>{signals.slice(0,10).map((signal,index)=><CRT key={signal.id} signal={signal} index={index} onHover={onHover}/>) }<CameraRig scroll={scroll}/></Canvas>; }
export default function PulseInstallation({ signals, onHover }: { signals: Signal[]; onHover: (signal: Signal | null) => void }) { return <div className="pulse-installation"><Scene signals={signals} onHover={onHover}/></div>; }
