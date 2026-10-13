"use client";

import { Canvas, useFrame, useLoader, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

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
  const layouts: Array<[number,number,number,number]> = [[-3.25,1.6,-3.7,.12],[-1.65,1.65,-4.15,-.08],[0,1.72,-4.6,.04],[1.65,1.55,-4.15,.08],[3.2,1.6,-3.65,-.12],[-2.45,.15,-3.15,-.16],[-.8,.25,-3.55,.08],[.85,.18,-3.8,-.06],[2.35,.12,-3.18,.16],[-.15,-1.05,-2.9,0]];
  const layout: [number,number,number,number] = layouts[index] ?? [0,0,-3,0];
  const [x,y,z,turn] = layout;
  useFrame(({ clock }) => { if (!group.current) return; const lift = hovered ? .42 : 0; group.current.position.y = THREE.MathUtils.damp(group.current.position.y, y + lift + Math.sin(clock.elapsedTime * 1.4 + index) * (hovered ? .03 : .012), 8, .016); group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, hovered ? (x < 0 ? -.13 : .13) : -x * .035, 8, .016); });
  useEffect(() => () => texture.dispose(), [texture]);
  return <group ref={group} position={[x,y,z]} rotation={[0,turn,0]} onPointerOver={(event: ThreeEvent<PointerEvent>) => { event.stopPropagation(); setHovered(true); onHover(signal); document.body.style.cursor = "crosshair"; }} onPointerOut={() => { setHovered(false); onHover(null); document.body.style.cursor = "default"; }}>
    <mesh castShadow receiveShadow><boxGeometry args={[1.5, 1.08, .62]}/><meshStandardMaterial color="#071116" roughness={.3} metalness={.75}/></mesh>
    <mesh position={[0,0,.325]}><boxGeometry args={[1.28,.82,.04]}/><meshBasicMaterial map={texture} toneMapped={false}/></mesh>
    <mesh position={[0,-.66,0]}><boxGeometry args={[.48,.18,.42]}/><meshStandardMaterial color="#071116" metalness={.8}/></mesh><mesh position={[0,-.84,.02]}><boxGeometry args={[.88,.08,.58]}/><meshStandardMaterial color="#0b181d" metalness={.85}/></mesh>
    <mesh position={[-.34,.62,.08]} rotation={[0,.2,0]}><cylinderGeometry args={[.018,.018,.37,8]}/><meshStandardMaterial color="#5d777b"/></mesh><mesh position={[.34,.62,.08]} rotation={[0,-.2,0]}><cylinderGeometry args={[.018,.018,.37,8]}/><meshStandardMaterial color="#5d777b"/></mesh>
    <pointLight position={[0,0,.65]} color={index % 3 === 0 ? "#bd8aff" : "#8cfff5"} intensity={hovered ? 2.2 : .75} distance={2.8}/>
    <mesh position={[0,0,.292]} scale={[1.22,.78,1]}><planeGeometry/><meshBasicMaterial color={index % 3 === 0 ? "#865cff" : "#5fffea"} transparent opacity={hovered ? .12 : .035} blending={THREE.AdditiveBlending}/></mesh>
  </group>;
}

function Observer() { return <group position={[0,-1.42,.45]}><mesh position={[0,.9,0]} castShadow><sphereGeometry args={[.28,22,18]}/><meshStandardMaterial color="#030506" roughness={1}/></mesh><mesh position={[0,-.15,0]} castShadow><coneGeometry args={[.65,1.95,5]}/><meshStandardMaterial color="#030506" roughness={1}/></mesh></group>; }
function RoomShell() { const gltf = useLoader(GLTFLoader, "/pulse/crt-room.glb", (loader) => { const draco = new DRACOLoader(); draco.setDecoderPath("/pulse/"); loader.setDRACOLoader(draco); }); const room = useMemo(() => { const copy = gltf.scene.clone(true); copy.traverse((child) => { if (child.name === "Plane" && child instanceof THREE.Mesh) { child.material = new THREE.MeshStandardMaterial({ color:"#071014",roughness:.55,metalness:.15 }); child.scale.set(3,3,3); } }); return copy; }, [gltf]); return <primitive object={room}/>; }
function CameraRig({ scroll }: { scroll: number }) { const { camera } = useThree(); const pointer = useRef(new THREE.Vector2()); useEffect(() => { const move = (event: PointerEvent) => pointer.current.set(event.clientX / innerWidth - .5, event.clientY / innerHeight - .5); addEventListener("pointermove", move); return () => removeEventListener("pointermove", move); }, []); useFrame(() => { const progress = Math.min(scroll / Math.max(innerHeight * 2.5,1), 1); const flight = progress < .42 ? progress / .42 * .7 : .7 + (progress-.42)/.58*.3; const finale = Math.max(0,(progress-.75)/.25); camera.position.x = THREE.MathUtils.damp(camera.position.x, pointer.current.x * (.52 - finale*.35) - finale*.75, 4, .016); camera.position.y = THREE.MathUtils.damp(camera.position.y, .34 - flight * .12 - pointer.current.y * .25, 4, .016); camera.position.z = THREE.MathUtils.damp(camera.position.z, 6.5 - flight * 10.5, 3, .016); camera.rotation.z = THREE.MathUtils.damp(camera.rotation.z, finale*.12, 3, .016); camera.lookAt(pointer.current.x * .15, .1 - flight * .2, -3.7 - flight * 8); }); return null; }
function PostFx() { const { gl, scene, camera, size } = useThree(); const composer = useRef<EffectComposer | null>(null); useEffect(() => { const fx = new EffectComposer(gl); fx.addPass(new RenderPass(scene,camera)); const bloom = new UnrealBloomPass(new THREE.Vector2(size.width,size.height), .38, .82, .68); fx.addPass(bloom); const crt = new ShaderPass({ uniforms:{tDiffuse:{value:null},uTime:{value:0},uResolution:{value:new THREE.Vector2(size.width,size.height)}}, vertexShader:"varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}", fragmentShader:"uniform sampler2D tDiffuse;uniform float uTime;uniform vec2 uResolution;varying vec2 vUv;void main(){vec2 p=vUv-.5;float e=length(p);vec2 s=vec2(.0012*e,0.);vec3 c=vec3(texture2D(tDiffuse,vUv+s).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-s).b);float lines=.94+.06*sin(vUv.y*min(330.,uResolution.y/2.)*6.283);float roll=smoothstep(0.,.18,fract(vUv.y*.7-uTime*.055))*(1.-smoothstep(.18,.5,fract(vUv.y*.7-uTime*.055)));c*=lines;c+=roll*.012;c*=1.-.58*smoothstep(.3,1.35,dot(p*2.,p*2.));gl_FragColor=vec4(c,1.);}" }); fx.addPass(crt); fx.addPass(new OutputPass()); composer.current=fx; return()=>fx.dispose(); },[gl,scene,camera]); useEffect(()=>composer.current?.setSize(size.width,size.height),[size]); useFrame((state)=>{ const pass=composer.current?.passes[2] as ShaderPass|undefined; if(pass) (pass.uniforms.uTime.value as number)=state.clock.elapsedTime; composer.current?.render(); },1); return null; }
function Dust() { const points = useMemo(() => { const positions = new Float32Array(560 * 3); for(let i=0;i<positions.length;i+=3){ const n=i/3; positions[i]=Math.sin(n*43.1)*5; positions[i+1]=Math.cos(n*12.3)*2.8; positions[i+2]=-Math.abs(Math.sin(n*7.3))*11+2; } return positions; },[]); return <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[points,3]}/></bufferGeometry><pointsMaterial color="#bafff4" size={.018} transparent opacity={.7} sizeAttenuation/></points>; }
function Scene({ signals, onHover }: { signals: Signal[]; onHover: (signal: Signal | null) => void }) { const [scroll,setScroll] = useState(0); useEffect(() => { const update=()=>setScroll(window.scrollY); addEventListener("scroll",update,{passive:true}); update(); return()=>removeEventListener("scroll",update); },[]); return <Canvas dpr={[1,1.5]} shadows camera={{ position:[0,1.42,5.6], fov:40 }} gl={{ antialias:true, powerPreference:"high-performance" }} onPointerMissed={() => onHover(null)}><color attach="background" args={["#05090d"]}/><fogExp2 attach="fog" args={["#17242c",.075]}/><ambientLight intensity={.18}/><directionalLight position={[3.5,6,5]} intensity={1.09} color="#9fc4d6" castShadow/><pointLight position={[-2.8,1.6,3.2]} color="#5fd8ff" intensity={4.5} distance={9}/><pointLight position={[2.8,1.7,3]} color="#7fe0ff" intensity={4} distance={9}/><pointLight position={[-2.9,.6,3.6]} color="#ff7a3c" intensity={3.2} distance={7}/><RoomShell/><Dust/>{signals.slice(0,10).map((signal,index)=><CRT key={signal.id} signal={signal} index={index} onHover={onHover}/>) }<CameraRig scroll={scroll}/><PostFx/></Canvas>; }
export default function PulseInstallation({ signals, onHover }: { signals: Signal[]; onHover: (signal: Signal | null) => void }) { return <div className="pulse-installation"><Scene signals={signals} onHover={onHover}/></div>; }
