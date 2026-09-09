import type { Rarity } from "@/db/schema";

export const HOLO_LIFT: Record<Rarity, number> = {
  common: 0.28,
  rare: 0.42,
  epic: 0.38,
  legendary: 0.36,
  joker: 0.4,
};

export const HOLO_GAIN: Record<Rarity, number> = {
  common: 1.42,
  rare: 1.64,
  epic: 1.74,
  legendary: 1.62,
  joker: 1.86,
};

export const HOLO_SATURATION: Record<Rarity, number> = {
  common: 1.02,
  rare: 1.1,
  epic: 1.16,
  legendary: 1.12,
  joker: 1.22,
};

export const HOLO_STRENGTH: Record<Rarity, number> = {
  common: 1.5,
  rare: 1.64,
  epic: 1.72,
  legendary: 1.66,
  joker: 1.84,
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
    return 0.08 + 0.98 * cos(6.2831853 * (t + vec3(0.0, 0.33, 0.67)));
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

    float hue = uTime * 0.14 + uv.x * 0.4 + uv.y * 0.26 + uTilt.x * 0.32 + uTilt.y * 0.24 + lum * 0.18 + vFresnel * 0.12;
    vec3 irid = pal(hue);
    float iridLuma = dot(irid, vec3(0.299, 0.587, 0.114));
    irid = mix(vec3(iridLuma), irid, uSaturation);
    irid = mix(irid, irid * mix(uRarity, vec3(1.0), uLift), 0.02);
    float yellow = smoothstep(0.06, 0.24, min(irid.r, irid.g) - irid.b);
    yellow *= 1.0 - smoothstep(0.26, 0.55, abs(irid.r - irid.g));
    float green = smoothstep(0.08, 0.28, irid.g - max(irid.r, irid.b));
    irid = mix(irid, vec3(iridLuma), max(yellow, green) * 0.62);
    iridLuma = dot(irid, vec3(0.299, 0.587, 0.114));
    irid *= mix(1.0, 0.58, smoothstep(0.58, 0.95, iridLuma));

    float sweep = uv.x * 0.72 + uv.y * 0.38 + uTime * 0.11 + uTilt.x * 0.28 + uTilt.y * 0.18;
    float glare = pow(1.0 - abs(fract(sweep) * 2.0 - 1.0), 1.7);
    float fres = pow(clamp(vFresnel + uTilt.x * 0.05 + uTilt.y * 0.04 + dot(bump, uTilt) * 0.04, 0.0, 1.0), 0.85);
    float wash = coverage * (0.38 + glare * 0.46 + fres * 0.18) * uGain * uStrength;
    wash *= mix(1.0, 0.7, smoothstep(0.55, 1.0, vFresnel));
    wash *= mix(1.0, 0.64, lights);
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
