"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useSceneTimer } from "@/lib/three-compat";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import type { Rarity } from "@/db/schema";
import { CardMesh, preloadHoloAssets, warmupCardShaders } from "@/components/card-mesh";
import {
  FALLBACK_BACK,
  FALLBACK_FRONT,
  PackMesh,
} from "@/components/booster-pack-3d";
import {
  HOLO_LIGHT,
  SEAL_LIGHT,
  chargeTension,
  openWashColor,
  type OpenPhase,
} from "@/lib/open-fx";

const OPEN_FOV = 32;
const PACK_SCALE = { fullscreen: 0.62, inline: 1 } as const;
const CAMERA_Z = { fullscreen: 5.2, inline: 3.2 } as const;

export type OpenCard = {
  name: string;
  imageUrl: string | null;
  backImageUrl?: string | null;
  rarity: Rarity;
  holographic: boolean;
  signature?: boolean;
};

export function BoosterOpenScene({
  name,
  frontImageUrl,
  backImageUrl,
  phase,
  card,
  fullscreen = false,
}: {
  name: string;
  frontImageUrl?: string | null;
  backImageUrl?: string | null;
  phase: OpenPhase;
  card?: OpenCard | null;
  fullscreen?: boolean;
}) {
  const glow = openWashColor(phase, card?.rarity);
  const showCard = Boolean(card) && (phase === "burst" || phase === "reveal");

  useEffect(() => {
    preloadHoloAssets();
  }, []);

  useEffect(() => {
    if (!card?.imageUrl) return;
    const image = new Image();
    image.src = card.imageUrl;
  }, [card?.imageUrl]);

  return (
    <div
      className={
        fullscreen
          ? "absolute inset-0 overflow-hidden"
          : "relative h-[32rem] w-full overflow-hidden"
      }
      role="img"
      aria-label={showCard && card ? `${card.name} revealed` : `${name} pack`}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          opacity: phase === "burst" ? 0.7 : phase === "charge" ? 0.4 : showCard ? 0.28 : 0.12,
          background: `radial-gradient(ellipse at 50% 46%, ${glow}55 0%, transparent 60%)`,
        }}
      />
      <div className="relative h-full">
        <Canvas
          camera={{
            position: [0, 0.1, fullscreen ? CAMERA_Z.fullscreen : CAMERA_Z.inline],
            fov: OPEN_FOV,
          }}
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.12;
          }}
          style={{ background: "transparent" }}
        >
          <ambientLight intensity={0.62} />
          <directionalLight position={[2.4, 3.2, 4]} intensity={1.35} color="#fff6e8" />
          <directionalLight position={[-3, 0.8, -1.8]} intensity={0.35} color="#8f9cff" />
          <ShaderWarmup />
          <CameraRig phase={phase} fullscreen={fullscreen} />
          <SceneLights phase={phase} color={glow} holographic={card?.holographic} />
          <Suspense fallback={null}>
            <OpeningRig
              frontUrl={frontImageUrl || FALLBACK_FRONT}
              backUrl={backImageUrl || FALLBACK_BACK}
              phase={phase}
              color={glow}
              holographic={Boolean(card?.holographic)}
              fullscreen={fullscreen}
            />
          </Suspense>
          {card ? (
            <Suspense fallback={null}>
              <RevealedCard
                key={`${card.name}-${card.rarity}-${card.holographic}`}
                card={card}
                phase={phase}
                scale={fullscreen ? PACK_SCALE.fullscreen : PACK_SCALE.inline}
              />
            </Suspense>
          ) : null}
          <ContactShadows
            position={[0, -1.35, 0]}
            opacity={0.4}
            scale={6}
            blur={2.8}
            far={2.8}
            color="#000000"
          />
        </Canvas>
      </div>
    </div>
  );
}

function ShaderWarmup() {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    preloadHoloAssets();
    const id = window.requestAnimationFrame(() => {
      warmupCardShaders(gl, scene, camera);
    });
    return () => window.cancelAnimationFrame(id);
  }, [camera, gl, scene]);

  return null;
}

function RevealedCard({
  card,
  phase,
  scale,
}: {
  card: OpenCard;
  phase: OpenPhase;
  scale: number;
}) {
  const group = useRef<THREE.Group>(null);
  const timer = useSceneTimer();
  const age = useRef(0);
  const prev = useRef(phase);

  useFrame((_, dt) => {
    if (prev.current !== phase) {
      age.current = 0;
      prev.current = phase;
    }
    age.current += dt;
    const node = group.current;
    if (!node) return;
    if (phase === "burst") {
      const k = Math.min(1, age.current / 0.7);
      const ease = 1 - (1 - k) ** 3;
      node.position.y = THREE.MathUtils.lerp(-0.06, 0.06, ease);
      node.scale.setScalar(scale * (0.9 + 0.1 * ease));
    } else {
      timer.update();
      node.position.y = THREE.MathUtils.damp(
        node.position.y,
        0.06 + Math.sin(timer.getElapsed() * 0.9) * 0.03,
        2.4,
        dt,
      );
      node.scale.setScalar(scale);
    }
  });

  const showing = phase === "burst" || phase === "reveal";

  return (
    <group ref={group} scale={scale} visible={showing}>
      <CardMesh
        name={card.name}
        imageUrl={card.imageUrl}
        backImageUrl={card.backImageUrl}
        rarity={card.rarity}
        holographic={card.holographic}
        interactive={phase === "reveal"}
      />
    </group>
  );
}

function CameraRig({ phase, fullscreen }: { phase: OpenPhase; fullscreen: boolean }) {
  const { camera } = useThree();
  const age = useRef(0);
  const prev = useRef(phase);
  const restZ = fullscreen ? CAMERA_Z.fullscreen : CAMERA_Z.inline;
  const closeZ = restZ - 0.35;

  useFrame((_, dt) => {
    if (prev.current !== phase) {
      age.current = 0;
      prev.current = phase;
    }
    age.current += dt;

    let targetZ: number = restZ;
    let shake = 0;
    if (phase === "charge") {
      targetZ = closeZ;
      shake = chargeTension(age.current).shake * 0.016;
    }
    if (phase === "burst") {
      targetZ = closeZ;
      shake = Math.max(0, 1 - age.current * 2.4) * 0.08;
    }
    if (phase === "reveal") targetZ = restZ;

    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 3.2, dt);
    camera.position.x = (Math.random() - 0.5) * shake;
    camera.position.y = 0.08 + (Math.random() - 0.5) * shake;
    camera.lookAt(0, 0.05, 0);
  });

  return null;
}

function OpeningRig({
  frontUrl,
  backUrl,
  phase,
  color,
  holographic,
  fullscreen,
}: {
  frontUrl: string;
  backUrl: string;
  phase: OpenPhase;
  color: string;
  holographic: boolean;
  fullscreen: boolean;
}) {
  const pack = useRef<THREE.Group>(null);
  const timer = useSceneTimer();
  const age = useRef(0);
  const prev = useRef(phase);
  const skipIntro = useRef(phase === "reveal");
  const packFade = useRef(phase === "reveal" ? 0 : 1);
  const chargeScale = useRef(1);
  const size = fullscreen ? PACK_SCALE.fullscreen : PACK_SCALE.inline;

  useFrame((_, dt) => {
    if (prev.current !== phase) {
      age.current = 0;
      prev.current = phase;
    }
    age.current += dt;

    const group = pack.current;
    if (!group) return;
    timer.update();
    const t = timer.getElapsed();

    if (phase === "idle") {
      packFade.current = 1;
      chargeScale.current = 1;
      group.rotation.y = Math.sin(t * 0.45) * 0.42;
      group.rotation.x = 0.1 + Math.sin(t * 0.35) * 0.04;
      group.rotation.z = 0;
      group.position.x = 0;
      group.position.y = Math.sin(t * 0.9) * 0.07;
      group.scale.setScalar(size);
    } else if (phase === "charge") {
      const { shrink, shake } = chargeTension(age.current);
      packFade.current = 1;
      chargeScale.current = shrink;
      group.rotation.y = THREE.MathUtils.damp(group.rotation.y, 0, 5.2, dt);
      group.rotation.x = THREE.MathUtils.damp(group.rotation.x, 0.02, 5.2, dt);
      const freq = 46 + shake * 26;
      group.rotation.z = Math.sin(age.current * freq) * 0.04 * shake;
      group.position.x = Math.sin(age.current * freq * 1.18) * 0.03 * shake;
      group.position.y =
        THREE.MathUtils.damp(group.position.y, 0.1, 3.4, dt) +
        Math.cos(age.current * freq * 1.32) * 0.022 * shake;
      group.scale.setScalar(size * shrink);
    } else if (phase === "burst") {
      const k = Math.min(1, age.current / 0.2);
      packFade.current = Math.max(0, 1 - age.current / 0.12);
      const implode = Math.max(0.02, 1 - k * 0.7);
      group.rotation.y += dt * (2.2 + k * 2);
      group.rotation.z = THREE.MathUtils.damp(group.rotation.z, 0, 8, dt);
      group.position.x = THREE.MathUtils.damp(group.position.x, 0, 8, dt);
      group.position.y = THREE.MathUtils.damp(group.position.y, 0.16, 6, dt);
      group.scale.setScalar(size * Math.min(1, chargeScale.current) * implode);
    } else {
      packFade.current = 0;
      group.scale.setScalar(0.01);
    }
  });

  return (
    <group>
      <DustMotes active={phase !== "idle"} dense={fullscreen} />
      <LightBeams phase={phase} color={color} />
      <group ref={pack} renderOrder={4}>
        <PackMesh
          frontUrl={frontUrl}
          backUrl={backUrl}
          opacity={skipIntro.current ? 0 : 1}
          opacityRef={packFade}
        />
      </group>
      <ShockRing active={phase === "burst"} color={color} delay={0} />
      <ShockRing active={phase === "burst"} color="#fff6e8" delay={0.12} />
      <BurstField
        color={SEAL_LIGHT}
        armed={phase === "burst"}
        count={fullscreen ? 105 : 56}
        speed={1.35}
      />
      <BurstField
        color={SEAL_LIGHT}
        armed={phase === "burst"}
        count={fullscreen ? 67 : 34}
        speed={1.05}
      />
      <BurstField
        color={SEAL_LIGHT}
        armed={phase === "burst"}
        count={fullscreen ? 49 : 22}
        speed={1.2}
        upward
      />
      <BurstField
        color={SEAL_LIGHT}
        armed={phase === "burst"}
        count={fullscreen ? 38 : 17}
        speed={0.9}
      />
      {holographic ? (
        <BurstField color={HOLO_LIGHT} armed={phase === "burst"} count={34} speed={1.15} />
      ) : null}
    </group>
  );
}

function SceneLights({
  phase,
  color,
  holographic,
}: {
  phase: OpenPhase;
  color: string;
  holographic?: boolean;
}) {
  const inner = useRef<THREE.PointLight>(null);
  const flash = useRef<THREE.PointLight>(null);
  const rim = useRef<THREE.PointLight>(null);
  const age = useRef(0);
  const prev = useRef(phase);

  useFrame((_, dt) => {
    if (prev.current !== phase) {
      age.current = 0;
      prev.current = phase;
    }
    age.current += dt;

    if (inner.current) {
      if (phase === "charge") {
        inner.current.intensity = 1.2 + chargeTension(age.current).progress * 3.4;
      }
      else if (phase === "burst") inner.current.intensity = 9 * Math.max(0, 1 - age.current * 1.5);
      else if (phase === "reveal") inner.current.intensity = 0.55;
      else inner.current.intensity = 0.14;
    }

    if (flash.current) {
      flash.current.intensity =
        phase === "burst" ? 14 * Math.max(0, 1 - age.current * 2.2) : 0;
    }

    if (rim.current) {
      const live = phase === "reveal" || phase === "burst";
      rim.current.intensity = live
        ? THREE.MathUtils.lerp(rim.current.intensity, holographic ? 3.4 : 2.2, 0.08)
        : THREE.MathUtils.lerp(rim.current.intensity, 0, 0.1);
    }
  });

  return (
    <>
      <pointLight
        ref={inner}
        position={[0, 0.08, 0.25]}
        color={phase === "burst" || phase === "reveal" ? color : SEAL_LIGHT}
        distance={6}
        decay={2}
        intensity={0.14}
      />
      <pointLight ref={flash} position={[0, 0.12, 0.6]} color={color} distance={9} decay={1.5} intensity={0} />
      <pointLight
        ref={rim}
        position={[0.85, 0.5, 1.2]}
        color={holographic ? HOLO_LIGHT : color}
        distance={7}
        decay={2}
        intensity={0}
      />
    </>
  );
}

const BEAM_GAP = 0.78;

const BEAM_SHAFTS = [
  { yaw: 0.18, length: 2.5, width: 0.58 },
  { yaw: 0.96, length: 2.25, width: 0.46 },
  { yaw: 1.74, length: 2.15, width: 0.5 },
  { yaw: 2.48, length: 2.45, width: 0.44 },
  { yaw: 3.22, length: 2.7, width: 0.62 },
  { yaw: 3.98, length: 2.2, width: 0.42 },
  { yaw: 4.76, length: 2.05, width: 0.44 },
  { yaw: 5.52, length: 2.35, width: 0.5 },
];

const BEAM_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const BEAM_FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uOpacity;

  void main() {
    float x = abs(vUv.x - 0.5) * 2.0;
    float y = vUv.y;
    float core = exp(-pow(x / 0.045, 2.0));
    float mid = exp(-pow(x / 0.16, 2.0));
    float blur = exp(-pow(x / 0.42, 2.0));
    float edge = core * 0.08 + mid * 0.1 + blur * 0.16;
    float along = smoothstep(0.0, 0.16, y) * (1.0 - smoothstep(0.55, 1.0, y));
    float alpha = edge * along * uOpacity;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

function createBeamMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(SEAL_LIGHT) },
      uOpacity: { value: 0 },
    },
    vertexShader: BEAM_VERTEX,
    fragmentShader: BEAM_FRAGMENT,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
}

function LightBeams({
  phase,
  color,
}: {
  phase: OpenPhase;
  color: string;
}) {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const timer = useSceneTimer();
  const age = useRef(0);
  const spin = useRef(0);
  const prev = useRef(phase);
  const materials = useMemo(
    () => BEAM_SHAFTS.map(() => createBeamMaterial()),
    [],
  );
  const targetColor = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    return () => {
      for (const material of materials) material.dispose();
    };
  }, [materials]);

  useFrame((_, dt) => {
    const node = group.current;
    if (!node) return;
    if (prev.current !== phase) {
      age.current = 0;
      prev.current = phase;
    }
    age.current += dt;
    timer.update();
    const t = timer.getElapsed();
    const live = phase === "charge" || phase === "burst" || phase === "reveal";
    const chargeK = chargeTension(age.current).progress;
    const target =
      phase === "burst" ? 0.22 : phase === "reveal" ? 0.16 : phase === "charge" ? 0.05 + chargeK * 0.08 : 0;
    targetColor.set(phase === "burst" || phase === "reveal" ? color : SEAL_LIGHT);
    spin.current += dt * 0.07;
    node.rotation.z = spin.current;

    materials.forEach((mat) => {
      const opacity = mat.uniforms.uOpacity as THREE.IUniform<number>;
      const tint = mat.uniforms.uColor as THREE.IUniform<THREE.Color>;
      opacity.value = THREE.MathUtils.damp(opacity.value, target, 4.2, dt);
      tint.value.lerp(targetColor, 1 - Math.pow(0.001, dt));
    });

    if (core.current) {
      const mat = core.current.material as THREE.MeshBasicMaterial;
      mat.opacity = THREE.MathUtils.damp(
        mat.opacity,
        0,
        5,
        dt,
      );
      mat.color.lerp(targetColor, 0.12);
      const pulse = 1 + Math.sin(t * 7) * (phase === "burst" ? 0.12 : 0.04);
      core.current.scale.setScalar((phase === "burst" ? 0.2 : 0.12) * pulse);
    }
  });

  return (
    <group ref={group} position={[0, 0.02, -0.12]} renderOrder={1}>
      {BEAM_SHAFTS.map((shaft, i) => (
        <group key={i} rotation={[0, 0, shaft.yaw]}>
          <mesh position={[0, BEAM_GAP + shaft.length / 2, 0]} material={materials[i]}>
            <planeGeometry args={[shaft.width, shaft.length]} />
          </mesh>
        </group>
      ))}
      <mesh ref={core}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial
          color={SEAL_LIGHT}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function ShockRing({
  active,
  color,
  delay,
}: {
  active: boolean;
  color: string;
  delay: number;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const age = useRef(0);
  const was = useRef(false);

  useFrame((_, dt) => {
    if (active && !was.current) age.current = -delay;
    was.current = active;
    age.current += dt;
    const node = mesh.current;
    if (!node) return;
    const t = Math.max(0, age.current);
    const k = Math.min(1, t / 0.62);
    const s = 0.18 + k * 2.4;
    node.scale.set(s, s, s);
    const mat = node.material as THREE.MeshBasicMaterial;
    mat.opacity = t > 0 && (active || t < 0.62) ? (1 - k) * 0.55 : 0;
  });

  return (
    <mesh ref={mesh} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
      <ringGeometry args={[0.4, 0.5, 80]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        depthWrite={false}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function BurstField({
  color,
  armed,
  count,
  speed,
  upward = false,
}: {
  color: string;
  armed: boolean;
  count: number;
  speed: number;
  upward?: boolean;
}) {
  const points = useRef<THREE.Points>(null);
  const age = useRef(99);
  const was = useRef(false);
  const map = useMemo(() => createCirclePointTexture(), []);
  const data = useMemo(() => createBurst(count, speed, upward), [count, speed, upward]);
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
    return geo;
  }, [data]);

  useEffect(() => () => map.dispose(), [map]);

  useFrame((_, dt) => {
    if (armed && !was.current) {
      age.current = 0;
      data.positions.fill(0);
      data.velocities.set(data.initial);
    }
    was.current = armed;
    if (!armed && age.current > 1.4) return;
    if (!armed && age.current === 99) return;

    age.current += dt;
    const pos = data.positions;
    const vel = data.velocities;
    const drag = Math.pow(0.9, dt * 60);
    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3;
      vel[i3] *= drag;
      vel[i3 + 1] = vel[i3 + 1] * drag - (upward ? 0.18 : 0.35) * dt;
      vel[i3 + 2] *= drag;
      pos[i3] += vel[i3] * dt;
      pos[i3 + 1] += vel[i3 + 1] * dt;
      pos[i3 + 2] += vel[i3 + 2] * dt;
    }
    const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
    attr.needsUpdate = true;
    const mat = points.current?.material as THREE.PointsMaterial | undefined;
    if (mat) {
      const fade = 1 - Math.min(1, Math.max(0, age.current - 0.12) / 0.7);
      mat.opacity = Math.min(0.5, age.current * 6) * fade;
    }
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        color={color}
        map={map}
        size={0.028}
        transparent
        opacity={0}
        depthWrite={false}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

function DustMotes({ active, dense }: { active: boolean; dense: boolean }) {
  const points = useRef<THREE.Points>(null);
  const timer = useSceneTimer();
  const map = useMemo(() => createCirclePointTexture(), []);
  const seeds = useMemo(() => {
    const count = dense ? 50 : 22;
    const items = Array.from({ length: count }, (_, i) => ({
      radius: 1.35 + (i % 9) * 0.28,
      speed: 0.14 + (i % 5) * 0.045,
      phase: i * 0.55,
      height: ((i % 11) - 5) * 0.26,
    }));
    const positions = new Float32Array(count * 3);
    return { count, items, positions };
  }, [dense]);
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(seeds.positions, 3));
    return geo;
  }, [seeds]);

  useEffect(() => () => map.dispose(), [map]);

  useFrame(() => {
    timer.update();
    const t = timer.getElapsed();
    for (let i = 0; i < seeds.count; i += 1) {
      const mote = seeds.items[i];
      const a = t * mote.speed + mote.phase;
      seeds.positions[i * 3] = Math.cos(a) * mote.radius;
      seeds.positions[i * 3 + 1] = mote.height + Math.sin(a * 1.4) * 0.08;
      seeds.positions[i * 3 + 2] = Math.sin(a) * mote.radius * 0.5;
    }
    const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
    attr.needsUpdate = true;
    const mat = points.current?.material as THREE.PointsMaterial | undefined;
    if (mat) mat.opacity = active ? 0.5 : 0.08;
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        color={SEAL_LIGHT}
        map={map}
        size={0.028}
        transparent
        opacity={0.35}
        depthWrite={false}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

function createBurst(count: number, speed: number, upward: boolean) {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const initial = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const theta = Math.random() * Math.PI * 2;
    const phi = upward ? Math.random() * 0.7 : Math.acos(2 * Math.random() - 1);
    const mag = speed * (0.4 + Math.random() * 0.7);
    initial[i * 3] = Math.sin(phi) * Math.cos(theta) * mag;
    initial[i * 3 + 1] = (upward ? 1.15 : 0.4) * Math.abs(Math.cos(phi) * mag) + 0.2;
    initial[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * mag;
  }
  velocities.set(initial);
  return { positions, velocities, initial };
}

function createCirclePointTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Texture();
  const glow = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  glow.addColorStop(0, "rgba(255,255,255,1)");
  glow.addColorStop(0.4, "rgba(255,255,255,0.7)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
