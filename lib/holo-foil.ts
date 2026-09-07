import type { Rarity } from "@/db/schema";

export const HOLO_LIFT: Record<Rarity, number> = {
  common: 0.42,
  rare: 0.64,
  epic: 0.62,
  legendary: 0.6,
  joker: 0.66,
};

export const HOLO_GAIN: Record<Rarity, number> = {
  common: 1.35,
  rare: 1.55,
  epic: 1.65,
  legendary: 1.52,
  joker: 1.75,
};

export const HOLO_SATURATION: Record<Rarity, number> = {
  common: 0.82,
  rare: 0.88,
  epic: 0.92,
  legendary: 0.9,
  joker: 0.95,
};

export const HOLO_STRENGTH: Record<Rarity, number> = {
  common: 1.38,
  rare: 1.5,
  epic: 1.58,
  legendary: 1.52,
  joker: 1.68,
};

/** Shared IQ pal() foil. Three.js prepends precision; raw WebGL must add it. */
export const HOLO_FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  varying float vFresnel;
  varying vec2 vSlide;
  uniform sampler2D uArt;
  uniform vec2 uTexel;
  uniform vec2 uTilt;
  uniform float uTime;
  uniform float uFlipX;
  uniform vec3 uRarity;
  uniform float uLift;
  uniform float uGain;
  uniform float uSaturation;
  uniform float uStrength;

  vec3 pal(float t) {
    return 0.5 + 0.5 * cos(6.2831853 * (t + vec3(0.0, 0.33, 0.67)));
  }

  float artLuma(vec2 uv) {
    return dot(texture2D(uArt, clamp(uv, 0.0, 1.0)).rgb, vec3(0.3, 0.59, 0.11));
  }

  void main() {
    vec2 uv = mix(vUv, vec2(1.0 - vUv.x, vUv.y), step(0.5, uFlipX));
    vec2 t = uTexel * 3.5;
    float lum = artLuma(uv);
    float gx =
      artLuma(uv + vec2(-t.x, -t.y)) * -1.0 +
      artLuma(uv + vec2( t.x, -t.y)) +
      artLuma(uv + vec2(-t.x,  0.0)) * -2.0 +
      artLuma(uv + vec2( t.x,  0.0)) * 2.0 +
      artLuma(uv + vec2(-t.x,  t.y)) * -1.0 +
      artLuma(uv + vec2( t.x,  t.y));
    float gy =
      artLuma(uv + vec2(-t.x, -t.y)) * -1.0 +
      artLuma(uv + vec2( 0.0, -t.y)) * -2.0 +
      artLuma(uv + vec2( t.x, -t.y)) * -1.0 +
      artLuma(uv + vec2(-t.x,  t.y)) +
      artLuma(uv + vec2( 0.0,  t.y)) * 2.0 +
      artLuma(uv + vec2( t.x,  t.y));
    vec2 bump = vec2(gx, gy) * 0.28;
    float edge = smoothstep(0.08, 0.48, length(bump));

    float blur =
      (artLuma(uv + vec2(-t.x, -t.y)) +
       artLuma(uv + vec2( t.x, -t.y)) +
       artLuma(uv + vec2(-t.x,  t.y)) +
       artLuma(uv + vec2( t.x,  t.y)) +
       artLuma(uv + vec2(-t.x,  0.0)) +
       artLuma(uv + vec2( t.x,  0.0)) +
       artLuma(uv + vec2( 0.0, -t.y)) +
       artLuma(uv + vec2( 0.0,  t.y))) * 0.125;
    float detail = smoothstep(0.06, 0.38, abs(lum - blur) * 5.0);
    float lights = smoothstep(0.22, 0.62, lum);
    float coverage = clamp(lights * 0.78 + edge * 0.48 + detail * 0.32, 0.0, 1.0);
    coverage = pow(coverage, 1.12);

    float hue = uTime * 0.1 + uTilt.x * 0.43 + uTilt.y * 0.33 + uv.x * uTilt.x * 0.2 + uv.y * uTilt.y * 0.13 + lum * 0.22 + vFresnel * 0.3;
    vec3 irid = pal(hue);
    float iridLuma = dot(irid, vec3(0.299, 0.587, 0.114));
    irid = mix(vec3(iridLuma), irid, uSaturation);
    irid = mix(irid, irid * mix(uRarity, vec3(1.0), uLift), 0.22);

    float glare = pow(1.0 - abs(fract(uv.x + uTilt.x * 0.33 + uv.y * 0.35 + uTilt.y * 0.21) * 2.0 - 1.0), 2.2);
    float fres = pow(clamp(vFresnel + uTilt.x * 0.08 + uTilt.y * 0.07 + dot(bump, uTilt) * 0.06, 0.0, 1.0), 0.7);
    float wash = coverage * (0.18 + fres * 0.55 + glare * 0.78) * uGain * uStrength;
    gl_FragColor = vec4(irid, wash);
  }
`;

export function glsl(source: string) {
  return source.replace(/\r/g, "").trim();
}

export const HOLO_VERTEX_2D = /* glsl */ `
  precision mediump float;
  attribute vec2 aPos;
  attribute vec2 aUv;
  uniform vec2 uTilt;
  varying vec2 vUv;
  varying float vFresnel;
  varying vec2 vSlide;
  void main() {
    vUv = aUv;
    vSlide = uTilt * 0.4;
    vFresnel = 0.16 + min(0.42, length(uTilt) * 0.9);
    gl_Position = vec4(aPos, 0.0, 1.0);
  }
`;
