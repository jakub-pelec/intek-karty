"use strict";

const {
  generateForDocument,
  isHoloMapOnlyUpdate,
  dataTouchesImage,
} = require("../../services/holo-map");

async function maybeGenerate(event, created) {
  const data = event.params?.data ?? {};
  if (!created && isHoloMapOnlyUpdate(data)) return;
  if (!created && !dataTouchesImage(data)) return;
  const documentId = event.result?.documentId;
  if (!documentId) return;
  try {
    await generateForDocument(strapi, documentId, {
      force: created || dataTouchesImage(data),
    });
  } catch (error) {
    strapi.log.warn(`[holo-map] ${error.message}`);
  }
}

module.exports = {
  async afterCreate(event) {
    await maybeGenerate(event, true);
  },
  async afterUpdate(event) {
    await maybeGenerate(event, false);
  },
};
