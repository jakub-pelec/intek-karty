"use strict";

const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { packHoloChannels } = require("./holo-map-pack");

const MAX_EDGE = 1024;
const generating = new Set();
const recent = new Map();
const COOLDOWN_MS = 3000;

function asMedia(value) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function dataTouchesImage(data) {
  return Boolean(data && Object.prototype.hasOwnProperty.call(data, "image"));
}

function isHoloMapOnlyUpdate(data) {
  if (!data || typeof data !== "object") return false;
  const keys = Object.keys(data).filter(
    (key) => !["updatedAt", "updatedBy", "publishedAt"].includes(key),
  );
  return keys.length > 0 && keys.every((key) => key === "holoMap");
}

function publicDir(strapi) {
  return strapi.dirs?.static?.public || path.join(strapi.dirs.app.root, "public");
}

function mediaUrl(file) {
  const url = file?.url;
  if (typeof url !== "string" || !url.trim()) return null;
  return url.trim();
}

async function readSourceBuffer(strapi, file) {
  const url = mediaUrl(file);
  if (!url) {
    throw new Error("Card image has no url");
  }
  if (/^https?:\/\//i.test(url)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch card image: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  const localPath = path.join(publicDir(strapi), url.replace(/^\//, ""));
  try {
    return await fs.readFile(localPath);
  } catch {
    const origin = strapi.config.get("server.absoluteUrl") || "";
    const absolute = url.startsWith("/") ? `${origin}${url}` : `${origin}/${url}`;
    if (!/^https?:\/\//i.test(absolute)) throw new Error("Card image is not readable");
    const res = await fetch(absolute);
    if (!res.ok) throw new Error(`Failed to fetch card image: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
}

async function buildHoloMapPng(strapi, file) {
  const sharp = require("sharp");
  const source = await readSourceBuffer(strapi, file);
  const { data, info } = await sharp(source)
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const packed = packHoloChannels(data, info.width, info.height);
  return sharp(packed, {
    raw: { width: info.width, height: info.height, channels: 3 },
  })
    .png()
    .toBuffer();
}

async function uploadHoloMap(strapi, png, filename) {
  const tmp = path.join(os.tmpdir(), filename);
  await fs.writeFile(tmp, png);
  try {
    const stats = await fs.stat(tmp);
    const uploaded = await strapi.plugin("upload").service("upload").upload({
      data: {
        fileInfo: {
          name: filename,
          caption: "Generated holographic channel map",
          alternativeText: "Holo channel map",
        },
      },
      files: {
        filepath: tmp,
        originalFilename: filename,
        mimetype: "image/png",
        size: stats.size,
      },
    });
    const file = Array.isArray(uploaded) ? uploaded[0] : uploaded;
    if (!file?.id) throw new Error("Upload did not return a file id");
    return file;
  } finally {
    await fs.unlink(tmp).catch(() => undefined);
  }
}

async function loadCard(strapi, documentId) {
  const published = await strapi.documents("api::card.card").findOne({
    documentId,
    status: "published",
    populate: ["image", "holoMap"],
  });
  if (published) return { card: published, published: true };
  const draft = await strapi.documents("api::card.card").findOne({
    documentId,
    populate: ["image", "holoMap"],
  });
  return { card: draft, published: false };
}

async function generateForDocument(strapi, documentId, { force = false } = {}) {
  if (!documentId) return null;
  const last = recent.get(documentId) ?? 0;
  if (Date.now() - last < COOLDOWN_MS) return null;
  if (generating.has(documentId)) return null;
  generating.add(documentId);
  recent.set(documentId, Date.now());
  try {
    const { card, published } = await loadCard(strapi, documentId);
    const image = asMedia(card?.image);
    if (!card || !image) return null;
    if (asMedia(card.holoMap) && !force) return asMedia(card.holoMap);

    const png = await buildHoloMapPng(strapi, image);
    const file = await uploadHoloMap(strapi, png, `holo-map-${documentId}.png`);

    await strapi.documents("api::card.card").update({
      documentId,
      data: { holoMap: file.id },
    });
    if (published) {
      await strapi.documents("api::card.card").update({
        documentId,
        data: { holoMap: file.id },
        status: "published",
      });
    }
    return file;
  } finally {
    generating.delete(documentId);
  }
}

async function backfillPublishedCards(strapi) {
  const pageSize = 50;
  let start = 0;
  let filled = 0;
  for (;;) {
    const rows = await strapi.documents("api::card.card").findMany({
      status: "published",
      populate: ["image", "holoMap"],
      limit: pageSize,
      start,
    });
    if (!rows.length) break;
    for (const card of rows) {
      if (asMedia(card.holoMap) || !asMedia(card.image)) continue;
      try {
        await generateForDocument(strapi, card.documentId, { force: false });
        filled += 1;
      } catch (error) {
        strapi.log.warn(
          `[holo-map] backfill failed for ${card.documentId}: ${error.message}`,
        );
      }
    }
    if (rows.length < pageSize) break;
    start += pageSize;
  }
  if (filled) strapi.log.info(`[holo-map] generated ${filled} missing channel map(s)`);
  return filled;
}

function service({ strapi }) {
  return {
    generateForDocument(documentId, options) {
      return generateForDocument(strapi, documentId, options);
    },
    backfillPublished() {
      return backfillPublishedCards(strapi);
    },
  };
}

service.generateForDocument = generateForDocument;
service.backfillPublishedCards = backfillPublishedCards;
service.isHoloMapOnlyUpdate = isHoloMapOnlyUpdate;
service.dataTouchesImage = dataTouchesImage;

module.exports = service;
