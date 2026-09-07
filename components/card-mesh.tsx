"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useSceneTimer } from "@/lib/three-compat";
import type { Rarity } from "@/db/schema";
import { PACK_SIZE } from "@/lib/pack-size";
import { RARITIES, RARITY_LABELS } from "@/lib/constants";
import { cardArtUrl, RARITY_LIGHT } from "@/lib/open-fx";
import {
  HOLO_FRAGMENT,
  HOLO_GAIN,
  HOLO_LIFT,
  HOLO_SATURATION,
  HOLO_STRENGTH,
} from "@/lib/holo-foil";
import { toRoman } from "@/lib/ritual";

export const CARD_SIZE = [PACK_SIZE[0], PACK_SIZE[1], 0.03] as const;

const paintedCache = new Map<string, THREE.CanvasTexture>();
const backCache = new Map<string, THREE.Texture>();
const channelCache = new Map<string, THREE.Texture>();
const channelPending = new Map<string, Promise<THREE.Texture>>();
const FALLBACK_FOIL = "/fx/holo-foil.png";
let foilTexture: THREE.Texture | null = null;
let foilPromise: Promise<THREE.Texture> | null = null;

type CardMeshProps = {
  name: string;
  imageUrl: string | null;
  backImageUrl?: string | null;
  holoMapUrl?: string | null;
  rarity?: Rarity;
  holographic?: boolean;
  signature?: boolean;
  interactive?: boolean;
  envMap?: THREE.Texture | null;
  scale?: number;
  showFx?: boolean;
  float?: boolean;
  number?: number;
  legend?: { number: string };
  onReady?: () => void;
};

export function preloadHoloAssets(holoMapUrl?: string | null) {
  if (typeof window === "undefined") return;
  loadFoilTexture();
  if (holoMapUrl) loadChannelTexture(holoMapUrl);
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
  const holo = createHoloMaterial(foil);
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

function configureChannelTexture(texture: THREE.Texture, src: string) {
  const foil = src === FALLBACK_FOIL;
  texture.wrapS = foil ? THREE.MirroredRepeatWrapping : THREE.ClampToEdgeWrapping;
  texture.wrapT = foil ? THREE.MirroredRepeatWrapping : THREE.ClampToEdgeWrapping;
  texture.colorSpace = foil ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
}

function loadFoilTexture() {
  if (foilTexture) return Promise.resolve(foilTexture);
  if (foilPromise) return foilPromise;
  foilPromise = loadChannelTexture(FALLBACK_FOIL).then((texture) => {
    foilTexture = texture;
    return texture;
  });
  return foilPromise;
}

function channelSource(url?: string | null) {
  return url?.trim() || FALLBACK_FOIL;
}

function loadChannelTexture(url?: string | null) {
  const src = channelSource(url);
  const cached = channelCache.get(src);
  if (cached) return Promise.resolve(cached);
  const pending = channelPending.get(src);
  if (pending) return pending;
  const request = new Promise<THREE.Texture>((resolve) => {
    new THREE.TextureLoader().load(
      src,
      (texture) => {
        configureChannelTexture(texture, src);
        channelCache.set(src, texture);
        resolve(texture);
      },
      undefined,
      () => {
        if (src === FALLBACK_FOIL) {
          const blank = new THREE.Texture();
          channelCache.set(src, blank);
          resolve(blank);
          return;
        }
        loadFoilTexture().then(resolve);
      },
    );
  });
  channelPending.set(src, request);
  return request;
}

export function CardMesh({
  name,
  imageUrl,
  backImageUrl,
  rarity = "common",
  holographic = false,
  signature = false,
  interactive = true,
  envMap = null,
  scale = 1,
  float = false,
  number,
  legend,
  onReady,
}: CardMeshProps) {
  const roman =
    legend?.number ?? (number && number > 0 ? toRoman(number) : "");
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
  const tilt = useRef(new THREE.Vector2());

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
        roughness: holographic ? 0.28 : 0.6,
        metalness: holographic ? 0.22 : 0.2,
        envMapIntensity: holographic ? 0.45 : 0.35,
      }),
    [holographic],
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
    node.position.y = float
      ? Math.sin(t * 0.62) * 0.022 + Math.sin(t * 0.37) * 0.008
      : 0;
    tilt.current.set(node.rotation.y, node.rotation.x);
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
      {holographic && texture ? (
        <HoloFoil rarity={rarity} art={texture} tilt={tilt} />
      ) : null}
      {holographic && backTexture ? (
        <group rotation={[0, Math.PI, 0]} position={[0, 0, -0.002]}>
          <HoloFoil rarity={rarity} art={backTexture} tilt={tilt} flipX />
        </group>
      ) : null}
      {texture ? (
        <CardFaceLegend number={roman} rarity={rarity} />
      ) : null}
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

function createHoloMaterial(art: THREE.Texture) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uArt: { value: art },
      uTexel: { value: artTexel(art) },
      uTilt: { value: new THREE.Vector2() },
      uTime: { value: 0 },
      uFlipX: { value: 0 },
      uRarity: { value: new THREE.Color("#ffffff") },
      uLift: { value: 0.28 },
      uGain: { value: 1 },
      uSaturation: { value: 0.6 },
      uStrength: { value: 1 },
    },
    vertexShader: HOLO_VERTEX,
    fragmentShader: HOLO_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
}

function artTexel(art: THREE.Texture) {
  const image = art.image as { width?: number; height?: number } | undefined;
  const width = image?.width || 768;
  const height = image?.height || 1075;
  return new THREE.Vector2(1 / width, 1 / height);
}

function HoloFoil({
  rarity,
  art,
  tilt,
  flipX = false,
}: {
  rarity: Rarity;
  art: THREE.Texture;
  tilt: RefObject<THREE.Vector2>;
  flipX?: boolean;
}) {
  const rarityHex = RARITY_LIGHT[rarity];
  const lift = HOLO_LIFT[rarity];
  const gain = HOLO_GAIN[rarity];
  const saturation = HOLO_SATURATION[rarity];
  const strength = HOLO_STRENGTH[rarity];
  const timer = useSceneTimer();
  const material = useMemo(() => createHoloMaterial(art), [art]);

  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    const uniforms = material.uniforms;
    if (!uniforms.uArt || !uniforms.uTexel || !uniforms.uTilt || !uniforms.uTime || !uniforms.uFlipX)
      return;
    timer.update();
    (uniforms.uTime as THREE.IUniform<number>).value = timer.getElapsed();
    (uniforms.uFlipX as THREE.IUniform<number>).value = flipX ? 1 : 0;
    (uniforms.uRarity as THREE.IUniform<THREE.Color>).value.set(rarityHex);
    (uniforms.uLift as THREE.IUniform<number>).value = lift;
    (uniforms.uGain as THREE.IUniform<number>).value = gain;
    (uniforms.uSaturation as THREE.IUniform<number>).value = saturation;
    (uniforms.uStrength as THREE.IUniform<number>).value = strength;
    uniforms.uArt.value = art;
    (uniforms.uTexel as THREE.IUniform<THREE.Vector2>).value.copy(artTexel(art));
    if (tilt.current) {
      (uniforms.uTilt as THREE.IUniform<THREE.Vector2>).value.copy(tilt.current);
    }
  });

  return (
    <mesh position={[0, 0, 0.0016]} raycast={() => null}>
      <planeGeometry args={[CARD_SIZE[0], CARD_SIZE[1]]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

const legendCache = new Map<string, THREE.CanvasTexture>();

function ritualFont(variable: string, fallback: string) {
  if (typeof document === "undefined") return fallback;
  return (
    getComputedStyle(document.documentElement).getPropertyValue(variable).trim() ||
    fallback
  );
}

const GOLD = "#d4b36a";
const GOLD_SOFT = "rgba(212, 179, 106, 0.38)";
const GOLD_GLOW = "rgba(212, 179, 106, 0.75)";
const ABYSS_FILL = "rgba(5, 4, 10, 0.82)";
const TOP_PLAQUE_EXTRA = 20;

function rarityGlow(hex: string, alpha = 0.72) {
  const n = hex.replace("#", "");
  const r = Number.parseInt(n.slice(0, 2), 16);
  const g = Number.parseInt(n.slice(2, 4), 16);
  const b = Number.parseInt(n.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function spacedWidth(ctx: CanvasRenderingContext2D, text: string, tracking: number) {
  const chars = [...text];
  const extra = tracking * ctx.measureText("M").width;
  return (
    chars.reduce((sum, char) => sum + ctx.measureText(char).width, 0) +
    extra * Math.max(chars.length - 1, 0)
  );
}

function drawSpaced(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number,
  align: CanvasTextAlign,
) {
  const width = spacedWidth(ctx, text, tracking);
  let cursor = align === "right" ? x - width : align === "center" ? x - width / 2 : x;
  ctx.textAlign = "left";
  const extra = tracking * ctx.measureText("M").width;
  for (const char of [...text]) {
    ctx.fillText(char, cursor, y);
    cursor += ctx.measureText(char).width + extra;
  }
}

function strokeRelicRim(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  line: number,
  fill: boolean,
) {
  ctx.save();
  if (fill) {
    ctx.fillStyle = ABYSS_FILL;
    ctx.fillRect(x, y, width, height);
    const shade = Math.max(8, Math.min(width, height) * 0.38);
    const top = ctx.createLinearGradient(0, y, 0, y + shade);
    top.addColorStop(0, "rgba(0, 0, 0, 0.45)");
    top.addColorStop(1, "rgba(0, 0, 0, 0)");
    const bottom = ctx.createLinearGradient(0, y + height, 0, y + height - shade);
    bottom.addColorStop(0, "rgba(0, 0, 0, 0.5)");
    bottom.addColorStop(1, "rgba(0, 0, 0, 0)");
    const left = ctx.createLinearGradient(x, 0, x + shade, 0);
    left.addColorStop(0, "rgba(0, 0, 0, 0.38)");
    left.addColorStop(1, "rgba(0, 0, 0, 0)");
    const right = ctx.createLinearGradient(x + width, 0, x + width - shade, 0);
    right.addColorStop(0, "rgba(0, 0, 0, 0.38)");
    right.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = top;
    ctx.fillRect(x, y, width, shade);
    ctx.fillStyle = bottom;
    ctx.fillRect(x, y + height - shade, width, shade);
    ctx.fillStyle = left;
    ctx.fillRect(x, y, shade, height);
    ctx.fillStyle = right;
    ctx.fillRect(x + width - shade, y, shade, height);
  }
  ctx.strokeStyle = GOLD;
  ctx.globalAlpha = 0.92;
  ctx.lineWidth = line;
  ctx.strokeRect(x + line / 2, y + line / 2, width - line, height - line);
  const inset = line * 3.2;
  ctx.strokeStyle = GOLD_SOFT;
  ctx.globalAlpha = 1;
  ctx.lineWidth = Math.max(1, line * 0.7);
  ctx.strokeRect(x + inset, y + inset, width - inset * 2, height - inset * 2);
  ctx.restore();
}

function shadeCardEdges(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const band = Math.round(w * 0.15);
  const edges: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    gradient: CanvasGradient;
  }> = [
    {
      x: 0,
      y: 0,
      width: w,
      height: band,
      gradient: (() => {
        const g = ctx.createLinearGradient(0, 0, 0, band);
        g.addColorStop(0, "rgba(5, 4, 10, 0.82)");
        g.addColorStop(0.45, "rgba(5, 4, 10, 0.38)");
        g.addColorStop(1, "rgba(5, 4, 10, 0)");
        return g;
      })(),
    },
    {
      x: 0,
      y: h - band,
      width: w,
      height: band,
      gradient: (() => {
        const g = ctx.createLinearGradient(0, h, 0, h - band);
        g.addColorStop(0, "rgba(5, 4, 10, 0.88)");
        g.addColorStop(0.45, "rgba(5, 4, 10, 0.42)");
        g.addColorStop(1, "rgba(5, 4, 10, 0)");
        return g;
      })(),
    },
    {
      x: 0,
      y: 0,
      width: band,
      height: h,
      gradient: (() => {
        const g = ctx.createLinearGradient(0, 0, band, 0);
        g.addColorStop(0, "rgba(5, 4, 10, 0.78)");
        g.addColorStop(0.5, "rgba(5, 4, 10, 0.32)");
        g.addColorStop(1, "rgba(5, 4, 10, 0)");
        return g;
      })(),
    },
    {
      x: w - band,
      y: 0,
      width: band,
      height: h,
      gradient: (() => {
        const g = ctx.createLinearGradient(w, 0, w - band, 0);
        g.addColorStop(0, "rgba(5, 4, 10, 0.78)");
        g.addColorStop(0.5, "rgba(5, 4, 10, 0.32)");
        g.addColorStop(1, "rgba(5, 4, 10, 0)");
        return g;
      })(),
    },
  ];
  for (const edge of edges) {
    ctx.fillStyle = edge.gradient;
    ctx.fillRect(edge.x, edge.y, edge.width, edge.height);
  }

  const rim = Math.max(2, w * 0.006);
  strokeRelicRim(ctx, rim * 1.6, rim * 1.6, w - rim * 3.2, h - rim * 3.2, rim, false);
}

function glowText(
  ctx: CanvasRenderingContext2D,
  color: string,
  glow: string,
  paint: () => void,
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 22;
  paint();
  ctx.shadowBlur = 10;
  paint();
  ctx.restore();
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
  ctx.fillStyle = color;
  paint();
}

function paintPlaque(
  ctx: CanvasRenderingContext2D,
  text: string,
  opts: {
    x: number;
    y: number;
    align: CanvasTextAlign;
    tracking: number;
    color: string;
    glow: string;
    padX: number;
    padY: number;
    line: number;
  },
) {
  const width = spacedWidth(ctx, text, opts.tracking);
  const metrics = ctx.measureText("Hg");
  const textH =
    (metrics.actualBoundingBoxAscent || 16) + (metrics.actualBoundingBoxDescent || 6);
  const boxW = width + opts.padX * 2;
  const boxH = textH + opts.padY * 2;
  const boxX =
    opts.align === "right"
      ? opts.x - boxW
      : opts.align === "center"
        ? opts.x - boxW / 2
        : opts.x;
  const boxY = opts.y;
  strokeRelicRim(ctx, boxX, boxY, boxW, boxH, opts.line, true);
  ctx.textBaseline = "middle";
  glowText(ctx, opts.color, opts.glow, () => {
    drawSpaced(
      ctx,
      text,
      boxX + boxW / 2,
      boxY + boxH / 2,
      opts.tracking,
      "center",
    );
  });
  return boxH;
}

function paintCardLegend(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  legend: { number: string; rarity: Rarity },
) {
  const cinzel = ritualFont("--font-cinzel", "Cinzel, serif");
  const pad = w * 0.075;
  const line = Math.max(2, w * 0.0055);

  shadeCardEdges(ctx, w, h);

  const topFont = Math.round(w * 0.03);
  const topPadY = w * 0.026 + TOP_PLAQUE_EXTRA / 2;
  const topPadX = w * 0.042;
  if (legend.number) {
    ctx.font = `500 ${topFont}px ${cinzel}`;
    paintPlaque(ctx, legend.number.toUpperCase(), {
      x: pad,
      y: pad,
      align: "left",
      tracking: 0.22,
      color: GOLD,
      glow: GOLD_GLOW,
      padX: topPadX,
      padY: topPadY,
      line,
    });
  }

  const rarityColor = RARITY_LIGHT[legend.rarity];
  ctx.font = `500 ${topFont}px ${cinzel}`;
  paintPlaque(ctx, RARITY_LABELS[legend.rarity].toUpperCase(), {
    x: w - pad,
    y: pad,
    align: "right",
    tracking: 0.2,
    color: rarityColor,
    glow: rarityGlow(rarityColor),
    padX: topPadX,
    padY: topPadY,
    line,
  });
}

function useCardLegendTexture(legend: {
  number: string;
  rarity: Rarity;
}) {
  const key = `rim5|${legend.number}|${legend.rarity}`;
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(
    () => legendCache.get(key) ?? null,
  );

  useEffect(() => {
    const cached = legendCache.get(key);
    if (cached) {
      setTexture(cached);
      return;
    }
    let cancelled = false;

    const paint = async () => {
      const cinzel = ritualFont("--font-cinzel", "Cinzel");
      await Promise.all([
        document.fonts.load(`500 48px ${cinzel}`),
        document.fonts.ready,
      ]);
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      canvas.width = 1536;
      canvas.height = 2150;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      paintCardLegend(ctx, canvas.width, canvas.height, legend);
      const next = new THREE.CanvasTexture(canvas);
      next.colorSpace = THREE.SRGBColorSpace;
      next.anisotropy = 8;
      next.premultiplyAlpha = true;
      next.needsUpdate = true;
      legendCache.set(key, next);
      if (!cancelled) setTexture(next);
    };

    void paint();

    return () => {
      cancelled = true;
    };
  }, [key, legend.number, legend.rarity]);

  return texture;
}

function CardFaceLegend({
  number,
  rarity,
}: {
  number: string;
  rarity: Rarity;
}) {
  const texture = useCardLegendTexture({ number, rarity });
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        premultipliedAlpha: true,
      }),
    [],
  );

  useEffect(() => {
    material.map = texture;
    material.needsUpdate = true;
  }, [material, texture]);

  useEffect(() => () => material.dispose(), [material]);

  if (!texture) return null;

  return (
    <mesh position={[0, 0, 0.0024]} raycast={() => null}>
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
