"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useSceneTimer } from "@/lib/three-compat";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { CanvasFallback } from "@/components/canvas-fallback";
import { PACK_SIZE } from "@/lib/pack-size";

export const FALLBACK_FRONT = "/boosters/fallback-front.svg";
export const FALLBACK_BACK = "/boosters/fallback-back.svg";
export { PACK_SIZE };

export function BoosterPack3D({
  name,
  frontImageUrl,
  backImageUrl,
}: {
  name: string;
  frontImageUrl?: string | null;
  backImageUrl?: string | null;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useLayoutEffect(() => {
    const node = frame.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin: "80px", threshold: 0.01 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={frame}
      className="relative h-[28rem] w-full"
      role="img"
      aria-label={`${name} pack`}
    >
      {active ? null : <CanvasFallback />}
      {active ? (
      <Canvas
        camera={{ position: [0, 0.12, 3.35], fov: 32 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[2.4, 3.2, 4]} intensity={1.35} />
        <directionalLight position={[-3, 1, -2]} intensity={0.35} />
        <Suspense fallback={null}>
          <IdlePack
            frontUrl={frontImageUrl || FALLBACK_FRONT}
            backUrl={backImageUrl || FALLBACK_BACK}
          />
        </Suspense>
      </Canvas>
      ) : null}
    </div>
  );
}

export function PackMesh({
  frontUrl,
  backUrl,
  opacity = 1,
  opacityRef,
}: {
  frontUrl: string;
  backUrl: string;
  opacity?: number;
  opacityRef?: { current: number };
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const [front, back] = useTexture([frontUrl, backUrl]);

  front.colorSpace = THREE.SRGBColorSpace;
  back.colorSpace = THREE.SRGBColorSpace;
  back.wrapS = THREE.RepeatWrapping;
  back.center.set(0.5, 0.5);
  back.repeat.x = -1;

  const materials = useMemo(() => {
    const edge = new THREE.MeshStandardMaterial({
      color: "#2a2436",
      roughness: 0.72,
      metalness: 0.18,
    });
    const frontMat = new THREE.MeshStandardMaterial({
      map: front,
      roughness: 0.42,
      metalness: 0.08,
      transparent: true,
      alphaTest: 0.12,
    });
    const backMat = new THREE.MeshStandardMaterial({
      map: back,
      roughness: 0.42,
      metalness: 0.08,
      transparent: true,
      alphaTest: 0.12,
    });
    return [edge, edge, edge, edge, frontMat, backMat];
  }, [front, back]);

  useEffect(() => {
    applyPackOpacity(materials, opacityRef?.current ?? opacity);
  }, [materials, opacity, opacityRef]);

  useFrame(() => {
    const next = opacityRef?.current ?? opacity;
    applyPackOpacity(materials, next);
    if (mesh.current) mesh.current.visible = next > 0.02;
  });

  return (
    <mesh ref={mesh} material={materials} visible={opacity > 0.02} renderOrder={4}>
      <boxGeometry args={[...PACK_SIZE]} />
    </mesh>
  );
}

function applyPackOpacity(materials: THREE.MeshStandardMaterial[], opacity: number) {
  const fading = opacity < 0.98;
  for (const material of materials) {
    material.transparent = fading;
    material.opacity = fading ? opacity : 1;
    material.depthWrite = true;
    material.alphaTest = fading ? 0 : 0.12;
  }
}

function IdlePack({ frontUrl, backUrl }: { frontUrl: string; backUrl: string }) {
  const group = useRef<THREE.Group>(null);
  const timer = useSceneTimer();

  useFrame(() => {
    if (!group.current) return;
    timer.update();
    const t = timer.getElapsed();
    group.current.rotation.y = Math.sin(t * 0.4) * 0.32;
    group.current.rotation.x = 0.1 + Math.sin(t * 0.35) * 0.04;
    group.current.position.y = Math.sin(t * 0.8) * 0.06;
  });

  return (
    <group ref={group}>
      <PackMesh frontUrl={frontUrl} backUrl={backUrl} />
    </group>
  );
}
