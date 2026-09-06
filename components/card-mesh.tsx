"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useSceneTimer } from "@/lib/three-compat";
import type { Rarity } from "@/db/schema";
import { PACK_SIZE } from "@/lib/pack-size";
import { RARITIES } from "@/lib/constants";
import { cardArtUrl, RARITY_LIGHT } from "@/lib/open-fx";

export const CARD_SIZE = [PACK_SIZE[0], PACK_SIZE[1], 0.03] as const;

const paintedCache = new Map<string, THREE.CanvasTexture>();
const backCache = new Map<string, THREE.Texture>();
let foilTexture: THREE.Texture | null = null;
let foilPromise: Promise<THREE.Texture> | null = null;
let holoTemplate: THREE.ShaderMaterial | null = null;

type CardMeshProps = {
  name: string;
  imageUrl: string | null;
  backImageUrl?: string | null;
  rarity?: Rarity;
  holographic?: boolean;
  interactive?: boolean;
  envMap?: THREE.Texture | null;
  scale?: number;
  showFx?: boolean;
  onReady?: () => void;
};

export function preloadHoloAssets() {
  if (typeof window === "undefined") return;
  loadFoilTexture();
  for (const rarity of RARITIES) {
    const image = new Image();
    image.src = `/cards/${rarity}.svg`;
  }
}

export function warmupCardShaders(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
) {
  const foil = foilTexture ?? new THREE.Texture();
  const standard = new THREE.MeshStandardMaterial({ color: "#777777" });
  const holo = getHoloTemplate(foil).clone();
  const geometry = new THREE.PlaneGeometry(0.01, 0.01);
  const a = new THREE.Mesh(geometry, standard);
  const b = new THREE.Mesh(geometry, holo);
  a.frustumCulled = false;
  b.frustumCulled = false;
  scene.add(a, b);
  gl.compile(scene, camera);
  scene.remove(a, b);
  geometry.dispose();
  standard.dispose();
  holo.dispose();
}

function loadFoilTexture() {
  if (foilTexture) return Promise.resolve(foilTexture);
  if (foilPromise) return foilPromise;
  foilPromise = new Promise((resolve) => {
    new THREE.TextureLoader().load("/fx/holo-foil.png", (texture) => {
      texture.wrapS = THREE.MirroredRepeatWrapping;
      texture.wrapT = THREE.MirroredRepeatWrapping;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = 16;
      texture.needsUpdate = true;
      foilTexture = texture;
      resolve(texture);
    });
  });
  return foilPromise;
}

export function CardMesh({
  name,
  imageUrl,
  backImageUrl,
  rarity = "common",
  holographic = false,
  interactive = true,
  envMap = null,
  scale = 1,
  onReady,
}: CardMeshProps) {
  const group = useRef<THREE.Group>(null);
  const timer = useSceneTimer();
  const { gl } = useThree();
  const texture = usePaintedCard(name, imageUrl, rarity);
  const backTexture = useCardBack(backImageUrl);
  const drag = useRef({
    active: false,
    x: 0,
    y: 0,
    px: 0,
    py: 0,
  });

  const front = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        roughness: holographic ? 0.28 : 0.52,
        metalness: holographic ? 0.22 : 0.08,
        envMapIntensity: holographic ? 0.45 : 0.35,
      }),
    [holographic],
  );
  const back = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0c0b12",
        roughness: 0.6,
        metalness: 0.2,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      front.dispose();
      back.dispose();
    };
  }, [back, front]);

  useEffect(() => {
    front.map = texture;
    back.map = backTexture;
    back.color.set(backTexture ? "#ffffff" : "#0c0b12");
    if (envMap) {
      front.envMap = envMap;
      back.envMap = envMap;
    }
    front.needsUpdate = true;
    back.needsUpdate = true;
    if (texture) onReady?.();
  }, [back, backTexture, envMap, front, onReady, texture]);

  useEffect(() => {
    if (!interactive) return;
    const canvas = gl.domElement;

    function onMove(event: PointerEvent) {
      if (!drag.current.active) return;
      const dx = event.clientX - drag.current.px;
      const dy = event.clientY - drag.current.py;
      drag.current.px = event.clientX;
      drag.current.py = event.clientY;
      drag.current.y += dx * 0.012;
      drag.current.x += dy * 0.012;
    }

    function onUp() {
      if (!drag.current.active) return;
      drag.current.active = false;
      canvas.style.cursor = "grab";
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [gl, interactive]);

  useFrame(() => {
    const node = group.current;
    if (!node) return;
    timer.update();
    const t = timer.getElapsed();
    const idleX = !drag.current.active && interactive ? Math.sin(t * 0.45) * 0.06 : 0;
    const idleY = !drag.current.active && interactive ? Math.sin(t * 0.32) * 0.1 : 0;
    node.rotation.x = THREE.MathUtils.clamp(drag.current.x + idleX, -Math.PI, Math.PI);
    node.rotation.y = drag.current.y + idleY;
  });

  return (
    <group
      ref={group}
      scale={scale}
      onPointerDown={(event) => {
        if (!interactive) return;
        event.stopPropagation();
        gl.domElement.style.cursor = "grabbing";
        drag.current.active = true;
        drag.current.px = event.clientX;
        drag.current.py = event.clientY;
      }}
    >
      <mesh visible={Boolean(texture)}>
        <planeGeometry args={[CARD_SIZE[0], CARD_SIZE[1]]} />
        <primitive object={front} attach="material" />
      </mesh>
      <mesh rotation={[0, Math.PI, 0]} position={[0, 0, -0.002]}>
        <planeGeometry args={[CARD_SIZE[0], CARD_SIZE[1]]} />
        <primitive object={back} attach="material" />
      </mesh>
      {holographic ? <HoloFoil rarity={rarity} /> : null}
    </group>
  );
}

const HOLO_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying float vFresnel;
  varying vec2 vSlide;
  void main() {
    vUv = uv;
    vec3 worldNormal = normalize(mat3(modelMatrix) * normal);
    vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    vec3 viewDir = normalize(cameraPosition - worldPos);
    vFresnel = pow(1.0 - clamp(dot(worldNormal, viewDir), 0.0, 1.0), 1.45);
    vSlide = viewDir.xy * 0.4;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const HOLO_FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  varying float vFresnel;
  varying vec2 vSlide;
  uniform float uTime;
  uniform sampler2D uFoil;
  uniform vec3 uRarity;
  uniform float uLift;
  uniform float uGain;

  void main() {
    vec2 drift = vec2(
      sin(uTime * 0.35) * 0.04,
      cos(uTime * 0.28) * 0.03
    );
    vec2 uv = vUv + vSlide * 0.35 + drift;
    vec3 foil = texture2D(uFoil, uv).rgb;
    float luma = dot(foil, vec3(0.299, 0.587, 0.114));
    foil = mix(vec3(luma), foil, 1.25);
    vec3 tinted = foil * mix(uRarity, vec3(1.0), uLift);
    vec2 fromCenter = (vUv - 0.5) * vec2(1.0, 1.15);
    float edge = smoothstep(0.02, 1.15, length(fromCenter) * 1.55);
    float wash = (0.1 + edge * 0.4 + vFresnel * 0.08) * uGain;
    gl_FragColor = vec4(tinted, wash);
  }
`;

const HOLO_LIFT: Record<Rarity, number> = {
  common: 0.42,
  rare: 0.64,
  epic: 0.62,
  legendary: 0.6,
  joker: 0.66,
};

const HOLO_GAIN: Record<Rarity, number> = {
  common: 0.6,
  rare: 0.92,
  epic: 1,
  legendary: 0.8,
  joker: 1,
};

function getHoloTemplate(foil: THREE.Texture) {
  if (holoTemplate) {
    holoTemplate.uniforms.uFoil.value = foil;
    return holoTemplate;
  }
  holoTemplate = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uFoil: { value: foil },
      uRarity: { value: new THREE.Color("#ffffff") },
      uLift: { value: 0.28 },
      uGain: { value: 1 },
    },
    vertexShader: HOLO_VERTEX,
    fragmentShader: HOLO_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  return holoTemplate;
}

function HoloFoil({ rarity }: { rarity: Rarity }) {
  const timer = useSceneTimer();
  const [foil, setFoil] = useState<THREE.Texture | null>(foilTexture);
  const rarityHex = RARITY_LIGHT[rarity];
  const lift = HOLO_LIFT[rarity];
  const gain = HOLO_GAIN[rarity];
  const material = useMemo(() => {
    const source = foil ?? new THREE.Texture();
    return getHoloTemplate(source).clone();
  }, [foil]);

  useEffect(() => {
    let live = true;
    if (foilTexture) {
      setFoil(foilTexture);
      return () => {
        live = false;
      };
    }
    loadFoilTexture().then((texture) => {
      if (live) setFoil(texture);
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    timer.update();
    (material.uniforms.uTime as THREE.IUniform<number>).value = timer.getElapsed();
    (material.uniforms.uRarity as THREE.IUniform<THREE.Color>).value.set(rarityHex);
    (material.uniforms.uLift as THREE.IUniform<number>).value = lift;
    (material.uniforms.uGain as THREE.IUniform<number>).value = gain;
    if (foil) material.uniforms.uFoil.value = foil;
  });

  if (!foil) return null;

  return (
    <mesh position={[0, 0, 0.0016]} raycast={() => null}>
      <planeGeometry args={[CARD_SIZE[0], CARD_SIZE[1]]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function useCardBack(backImageUrl?: string | null) {
  const [texture, setTexture] = useState<THREE.Texture | null>(() =>
    backImageUrl ? (backCache.get(backImageUrl) ?? null) : null,
  );

  useEffect(() => {
    if (!backImageUrl) {
      setTexture(null);
      return;
    }
    const cached = backCache.get(backImageUrl);
    if (cached) {
      setTexture(cached);
      return;
    }
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      backImageUrl,
      (loaded) => {
        loaded.colorSpace = THREE.SRGBColorSpace;
        loaded.anisotropy = 4;
        loaded.wrapS = THREE.RepeatWrapping;
        loaded.center.set(0.5, 0.5);
        loaded.repeat.x = -1;
        loaded.needsUpdate = true;
        backCache.set(backImageUrl, loaded);
        if (!cancelled) setTexture(loaded);
      },
      undefined,
      () => {
        if (!cancelled) setTexture(null);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [backImageUrl]);

  return texture;
}

function usePaintedCard(name: string, imageUrl: string | null, rarity: Rarity) {
  const source = cardArtUrl(imageUrl, rarity);
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(
    () => paintedCache.get(source) ?? null,
  );

  useEffect(() => {
    const cached = paintedCache.get(source);
    if (cached) {
      setTexture(cached);
      return;
    }
    let disposed = false;
    const image = new Image();
    image.crossOrigin = "anonymous";

    const finish = (draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) => {
      const canvas = document.createElement("canvas");
      canvas.width = 768;
      canvas.height = 1075;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#0c0b12";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      draw(ctx, canvas.width, canvas.height);
      const painted = new THREE.CanvasTexture(canvas);
      painted.colorSpace = THREE.SRGBColorSpace;
      painted.anisotropy = 4;
      painted.needsUpdate = true;
      paintedCache.set(source, painted);
      if (!disposed) setTexture(painted);
    };

    image.onload = () => {
      finish((ctx, w, h) => {
        const scale = Math.max(w / image.width, h / image.height);
        const dw = image.width * scale;
        const dh = image.height * scale;
        ctx.drawImage(image, (w - dw) / 2, (h - dh) / 2, dw, dh);
      });
    };
    image.onerror = () => {
      finish((ctx, w, h) => {
        ctx.fillStyle = "#d7d3c8";
        ctx.font = "48px serif";
        ctx.textAlign = "center";
        ctx.fillText(name, w / 2, h / 2);
      });
    };
    image.src = source;

    return () => {
      disposed = true;
    };
  }, [name, source]);

  return texture;
}
