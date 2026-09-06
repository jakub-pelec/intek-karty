"use client";

import "@/lib/three-compat";
import { Suspense, useCallback, useLayoutEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import type { Rarity } from "@/db/schema";
import { CARD_SIZE, CardMesh } from "@/components/card-mesh";
import { CanvasFallback } from "@/components/canvas-fallback";
import { RarityGlow } from "@/components/rarity-glow";
import { RARITY_LIGHT } from "@/lib/open-fx";
import { cn } from "@/lib/utils";

const FIT_PADDING = 1.12;
const FIT_FOV = 32;

export type CardInspectProps = {
  name: string;
  imageUrl: string | null;
  backImageUrl?: string | null;
  rarity?: Rarity;
  holographic?: boolean;
  signature?: boolean;
  glow?: boolean;
  className?: string;
};

export function CardInspectCanvas({
  name,
  imageUrl,
  backImageUrl,
  rarity,
  holographic = false,
  glow = true,
}: Omit<CardInspectProps, "className" | "signature">) {
  const frame = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    setReady(false);
    const node = frame.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin: "80px", threshold: 0.01 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [name, imageUrl, backImageUrl, holographic]);

  const markReady = useCallback(() => {
    requestAnimationFrame(() => setReady(true));
  }, []);

  return (
    <div ref={frame} className="absolute inset-0 min-h-0 touch-none">
      {glow ? <RarityGlow rarity={rarity} /> : null}
      <div
        className={cn(
          "transition-opacity duration-300",
          ready ? "pointer-events-none opacity-0" : "opacity-100",
        )}
      >
        <CanvasFallback />
      </div>
      {active ? (
        <Canvas
          camera={{ position: [0, 0, fitDistance()], fov: FIT_FOV }}
          dpr={[1, holographic ? 2 : 1.5]}
          gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.08;
          }}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            background: "transparent",
            cursor: "grab",
            opacity: ready ? 1 : 0,
            transition: "opacity 420ms ease",
          }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[2.2, 2.8, 3.4]} intensity={1.15} color="#fff6e8" />
          <directionalLight
            position={[-2.4, 0.6, 1.8]}
            intensity={0.55}
            color={RARITY_LIGHT[rarity ?? "common"]}
          />
          <spotLight
            position={[0.4, 1.8, 2.6]}
            intensity={holographic ? 1.35 : 0.55}
            color={RARITY_LIGHT[rarity ?? "common"]}
            angle={0.55}
            penumbra={0.7}
          />
          <FitCardCamera />
          <Suspense fallback={null}>
            <Environment preset="city" />
            <CardMesh
              name={name}
              imageUrl={imageUrl}
              backImageUrl={backImageUrl}
              rarity={rarity}
              holographic={holographic}
              scale={1}
              onReady={markReady}
            />
          </Suspense>
        </Canvas>
      ) : null}
    </div>
  );
}

function fitDistance(aspect = 63 / 88) {
  const height = CARD_SIZE[1] * FIT_PADDING;
  const width = CARD_SIZE[0] * FIT_PADDING;
  const fov = (FIT_FOV * Math.PI) / 180;
  const distH = height / (2 * Math.tan(fov / 2));
  const distW = width / (2 * Math.tan(fov / 2) * aspect);
  return Math.max(distH, distW);
}

function FitCardCamera() {
  const { camera, size } = useThree();

  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const aspect = size.width / Math.max(size.height, 1);
    camera.fov = FIT_FOV;
    camera.position.set(0, 0, fitDistance(aspect));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, size]);

  return null;
}
