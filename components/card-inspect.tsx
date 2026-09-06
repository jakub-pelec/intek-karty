"use client";

import "@/lib/three-compat";
import { Suspense, useCallback, useLayoutEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import type { Rarity } from "@/db/schema";
import { CARD_SIZE, CardMesh } from "@/components/card-mesh";
import { RARITY_LIGHT } from "@/lib/open-fx";
import { cn } from "@/lib/utils";

const FIT_PADDING = 1.12;
const FIT_FOV = 32;

export function CardInspect({
  name,
  imageUrl,
  rarity,
  holographic = false,
  signature = false,
  className,
}: {
  name: string;
  imageUrl: string | null;
  rarity?: Rarity;
  holographic?: boolean;
  signature?: boolean;
  className?: string;
}) {
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
  }, [name, imageUrl, holographic]);

  const markReady = useCallback(() => {
    requestAnimationFrame(() => setReady(true));
  }, []);

  return (
    <div
      ref={frame}
      className={cn("relative aspect-[63/88] h-full w-full min-h-0 touch-none overflow-hidden", className)}
      role="img"
      aria-label={[holographic && "holographic", signature && "signed", name]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
          ready ? "pointer-events-none opacity-0" : "opacity-100",
        )}
      >
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4b36a]/20 border-t-[#d4b36a]"
          aria-hidden
        />
      </div>
      {active ? (
        <Canvas
          camera={{ position: [0, 0, fitDistance()], fov: FIT_FOV }}
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.08;
          }}
          style={{
            position: "absolute",
            inset: 0,
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
