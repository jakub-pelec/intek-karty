const {
  backfillPublishedCards,
  dataTouchesImage,
  generateForDocument,
  isHoloMapOnlyUpdate,
} = require("./api/card/services/holo-map");

const CARD_LIST = ["number", "name", "rarity", "collection"];
const CARD_UID = "api::card.card";
const HOLO_ACTIONS = new Set(["create", "update", "publish"]);

async function ensureCardListColumns(strapi) {
  const service = strapi.plugin("content-manager").service("content-types");
  const card = service.findContentType("api::card.card");
  if (!card) return;
  const current = await service.findConfiguration(card);
  const list = current.layouts?.list ?? [];
  if (CARD_LIST.every((field, index) => list[index] === field) && list.length === CARD_LIST.length) {
    return;
  }
  await service.updateConfiguration(card, {
    ...current,
    layouts: {
      ...current.layouts,
      list: CARD_LIST,
    },
  });
}

async function ensureDropRateLabels(strapi) {
  const service = strapi.plugin("content-manager").service("components");
  const component = service.findComponent("booster.drop-rate");
  if (!component) return;
  const current = await service.findConfiguration(component);
  if (current.settings?.mainField === "rarity") return;
  await service.updateConfiguration(component, {
    ...current,
    settings: {
      ...current.settings,
      mainField: "rarity",
    },
  });
}

module.exports = {
  register({ strapi }) {
    strapi.documents.use(async (context, next) => {
      if (context.uid !== CARD_UID || !HOLO_ACTIONS.has(context.action)) {
        return next();
      }
      const data = context.params?.data;
      if (data && isHoloMapOnlyUpdate(data)) return next();
      const result = await next();
      const documentId = result?.documentId ?? context.params?.documentId;
      if (!documentId) return result;
      const imageChanged = context.action === "create" || dataTouchesImage(data);
      if (!imageChanged && context.action !== "publish") return result;
      try {
        await generateForDocument(strapi, documentId, { force: imageChanged });
      } catch (error) {
        strapi.log.warn(`[holo-map] ${error.message}`);
      }
      return result;
    });
  },
  async bootstrap({ strapi }) {
    await ensureCardListColumns(strapi);
    await ensureDropRateLabels(strapi);
    try {
      await backfillPublishedCards(strapi);
    } catch (error) {
      strapi.log.warn(`[holo-map] backfill skipped: ${error.message}`);
    }
  },
};
