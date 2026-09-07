function sampleLuma(
  luma: Float32Array,
  width: number,
  height: number,
  x: number,
  y: number,
) {
  const sx = Math.min(width - 1, Math.max(0, x));
  const sy = Math.min(height - 1, Math.max(0, y));
  return luma[sy * width + sx];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Pack card art into an RGB foil mask: R = coverage, G/B = Sobel X/Y as 0.5 + 0.5 * n. */
export function packHoloChannels(
  rgba: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
): Uint8Array {
  const luma = new Float32Array(width * height);
  for (let i = 0; i < width * height; i += 1) {
    const offset = i * 4;
    luma[i] =
      (0.3 * rgba[offset] + 0.59 * rgba[offset + 1] + 0.11 * rgba[offset + 2]) / 255;
  }

  const rgb = new Uint8Array(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      const gx =
        sampleLuma(luma, width, height, x - 1, y - 1) * -1 +
        sampleLuma(luma, width, height, x + 1, y - 1) +
        sampleLuma(luma, width, height, x - 1, y) * -2 +
        sampleLuma(luma, width, height, x + 1, y) * 2 +
        sampleLuma(luma, width, height, x - 1, y + 1) * -1 +
        sampleLuma(luma, width, height, x + 1, y + 1);
      const gy =
        sampleLuma(luma, width, height, x - 1, y - 1) * -1 +
        sampleLuma(luma, width, height, x, y - 1) * -2 +
        sampleLuma(luma, width, height, x + 1, y - 1) * -1 +
        sampleLuma(luma, width, height, x - 1, y + 1) +
        sampleLuma(luma, width, height, x, y + 1) * 2 +
        sampleLuma(luma, width, height, x + 1, y + 1);
      const nx = clamp(gx / 4, -1, 1);
      const ny = clamp(gy / 4, -1, 1);
      const edge = Math.min(1, Math.hypot(nx, ny));
      const highlight = smoothstep(0.58, 0.9, luma[i]);
      const mask = clamp(edge * 1.25 + highlight * 0.45, 0, 1);
      const offset = i * 3;
      rgb[offset] = Math.round(mask * 255);
      rgb[offset + 1] = Math.round((0.5 + 0.5 * nx) * 255);
      rgb[offset + 2] = Math.round((0.5 + 0.5 * ny) * 255);
    }
  }
  return rgb;
}
