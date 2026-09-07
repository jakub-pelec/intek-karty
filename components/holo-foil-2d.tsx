"use client";

import { useEffect, useRef } from "react";
import type { Rarity } from "@/db/schema";
import {
  glsl,
  HOLO_FRAGMENT,
  HOLO_GAIN,
  HOLO_LIFT,
  HOLO_SATURATION,
  HOLO_STRENGTH,
  HOLO_VERTEX_2D,
} from "@/lib/holo-foil";
import { RARITY_LIGHT } from "@/lib/open-fx";

const MAX_EDGE = 384;

type Layer = {
  canvas: HTMLCanvasElement;
  source: CanvasImageSource | null;
  srcWidth: number;
  srcHeight: number;
  rarity: Rarity;
  visible: boolean;
  texture: SizedTexture | null;
  coverW: number;
  coverH: number;
};

type SizedTexture = WebGLTexture & { imageWidth: number; imageHeight: number };

type GL = {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  buffer: WebGLBuffer;
  aPos: number;
  aUv: number;
  uniforms: Record<string, WebGLUniformLocation | null>;
};

const layers = new Set<Layer>();
let gpu: GL | null = null;
let raf = 0;
let started = 0;

function hexRgb(hex: string): [number, number, number] {
  const n = hex.replace("#", "");
  return [
    Number.parseInt(n.slice(0, 2), 16) / 255,
    Number.parseInt(n.slice(2, 4), 16) / 255,
    Number.parseInt(n.slice(4, 6), 16) / 255,
  ];
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, glsl(source));
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn("[holo-foil-2d]", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function ensureGL(): GL | null {
  if (gpu) return gpu;
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:fixed;left:-9999px;top:0;width:4px;height:4px;";
  document.body.appendChild(canvas);
  const gl = canvas.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
    antialias: false,
  });
  if (!gl) return null;
  const vert = compile(gl, gl.VERTEX_SHADER, HOLO_VERTEX_2D);
  const frag = compile(
    gl,
    gl.FRAGMENT_SHADER,
    `precision mediump float;\n${HOLO_FRAGMENT}`,
  );
  if (!vert || !frag) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn("[holo-foil-2d]", gl.getProgramInfoLog(program));
    return null;
  }
  const buffer = gl.createBuffer();
  if (!buffer) return null;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, 1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gpu = {
    canvas,
    gl,
    program,
    buffer,
    aPos: gl.getAttribLocation(program, "aPos"),
    aUv: gl.getAttribLocation(program, "aUv"),
    uniforms: {
      uArt: gl.getUniformLocation(program, "uArt"),
      uTexel: gl.getUniformLocation(program, "uTexel"),
      uTilt: gl.getUniformLocation(program, "uTilt"),
      uTime: gl.getUniformLocation(program, "uTime"),
      uFlipX: gl.getUniformLocation(program, "uFlipX"),
      uRarity: gl.getUniformLocation(program, "uRarity"),
      uLift: gl.getUniformLocation(program, "uLift"),
      uGain: gl.getUniformLocation(program, "uGain"),
      uSaturation: gl.getUniformLocation(program, "uSaturation"),
      uStrength: gl.getUniformLocation(program, "uStrength"),
    },
  };
  return gpu;
}

function coverCanvas(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  destW: number,
  destH: number,
) {
  const canvas = document.createElement("canvas");
  canvas.width = destW;
  canvas.height = destH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const scale = Math.max(destW / srcW, destH / srcH);
  const dw = srcW * scale;
  const dh = srcH * scale;
  ctx.drawImage(source, (destW - dw) / 2, (destH - dh) / 2, dw, dh);
  return canvas;
}

function uploadCover(layer: Layer, width: number, height: number): SizedTexture | null {
  const ready = gpu;
  if (!ready || !layer.source || !layer.srcWidth || !layer.srcHeight) return null;
  const cropped = coverCanvas(layer.source, layer.srcWidth, layer.srcHeight, width, height);
  if (!cropped) return null;
  const { gl } = ready;
  if (layer.texture) gl.deleteTexture(layer.texture);
  const texture = gl.createTexture() as SizedTexture | null;
  if (!texture) return null;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  try {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cropped);
  } catch {
    gl.deleteTexture(texture);
    return null;
  }
  texture.imageWidth = width;
  texture.imageHeight = height;
  layer.coverW = width;
  layer.coverH = height;
  return texture;
}

function sizeFor(canvas: HTMLCanvasElement) {
  const w = canvas.clientWidth || 1;
  const h = canvas.clientHeight || 1;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const width = Math.max(1, Math.round(Math.min(MAX_EDGE, w * dpr)));
  const height = Math.max(1, Math.round(width * (h / w)));
  return { width, height };
}

function drawLayer(layer: Layer, time: number) {
  const ready = gpu;
  if (!ready || !layer.visible || !layer.source) return;
  const size = sizeFor(layer.canvas);
  if (
    !layer.texture ||
    layer.coverW !== size.width ||
    layer.coverH !== size.height
  ) {
    layer.texture = uploadCover(layer, size.width, size.height);
  }
  if (!layer.texture) return;
  const { gl, program, buffer, aPos, aUv, uniforms, canvas } = ready;
  if (layer.canvas.width !== size.width || layer.canvas.height !== size.height) {
    layer.canvas.width = size.width;
    layer.canvas.height = size.height;
  }
  if (canvas.width !== size.width || canvas.height !== size.height) {
    canvas.width = size.width;
    canvas.height = size.height;
  }
  gl.viewport(0, 0, size.width, size.height);
  gl.disable(gl.BLEND);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(aUv);
  gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 16, 8);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, layer.texture);
  gl.uniform1i(uniforms.uArt, 0);
  gl.uniform2f(uniforms.uTexel, 1 / layer.texture.imageWidth, 1 / layer.texture.imageHeight);
  gl.uniform2f(uniforms.uTilt, 0, 0);
  gl.uniform1f(uniforms.uTime, time);
  gl.uniform1f(uniforms.uFlipX, 0);
  const [r, g, b] = hexRgb(RARITY_LIGHT[layer.rarity]);
  gl.uniform3f(uniforms.uRarity, r, g, b);
  gl.uniform1f(uniforms.uLift, HOLO_LIFT[layer.rarity]);
  gl.uniform1f(uniforms.uGain, HOLO_GAIN[layer.rarity]);
  gl.uniform1f(uniforms.uSaturation, HOLO_SATURATION[layer.rarity]);
  gl.uniform1f(uniforms.uStrength, HOLO_STRENGTH[layer.rarity] * 0.18);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  const ctx = layer.canvas.getContext("2d");
  if (!ctx) return;
  ctx.globalCompositeOperation = "copy";
  ctx.drawImage(canvas, 0, 0);
}

function tick(now: number) {
  raf = window.requestAnimationFrame(tick);
  if (document.hidden || layers.size === 0) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const time = reduce ? 0 : (now - started) / 1000;
  for (const layer of layers) drawLayer(layer, time);
}

function startLoop() {
  if (raf) return;
  started = performance.now();
  raf = window.requestAnimationFrame(tick);
}

function stopLoop() {
  if (!raf || layers.size > 0) return;
  window.cancelAnimationFrame(raf);
  raf = 0;
}

export function HoloFoil2D({
  imageUrl,
  rarity,
}: {
  imageUrl: string;
  rarity: Rarity;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ensureGL()) return;

    const layer: Layer = {
      canvas,
      source: null,
      srcWidth: 0,
      srcHeight: 0,
      rarity,
      visible: true,
      texture: null,
      coverW: 0,
      coverH: 0,
    };
    layers.add(layer);
    startLoop();

    const host = canvas.parentElement;
    const img = host?.querySelector("img");
    const fallback = new Image();
    fallback.crossOrigin = "anonymous";

    function bindArt(target: HTMLImageElement) {
      if (!target.naturalWidth) return;
      layer.source = target;
      layer.srcWidth = target.naturalWidth;
      layer.srcHeight = target.naturalHeight;
      layer.coverW = 0;
      layer.coverH = 0;
    }

    function onImgReady() {
      if (img && img.naturalWidth) {
        bindArt(img);
        return;
      }
      if (fallback.naturalWidth) bindArt(fallback);
    }

    if (img?.complete && img.naturalWidth) onImgReady();
    else img?.addEventListener("load", onImgReady);

    fallback.onload = onImgReady;
    fallback.src = img?.currentSrc || imageUrl;

    const io = new IntersectionObserver(
      ([entry]) => {
        layer.visible = Boolean(entry?.isIntersecting);
      },
      { rootMargin: "80px" },
    );
    io.observe(canvas);

    return () => {
      io.disconnect();
      img?.removeEventListener("load", onImgReady);
      fallback.onload = null;
      if (layer.texture) gpu?.gl.deleteTexture(layer.texture);
      layers.delete(layer);
      stopLoop();
    };
  }, [imageUrl, rarity]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[2] h-full w-full"
      style={{ mixBlendMode: "plus-lighter" }}
    />
  );
}
