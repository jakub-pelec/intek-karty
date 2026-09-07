const CARD_LIST = ["number", "name", "rarity", "collection"];

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
  async bootstrap({ strapi }) {
    await ensureCardListColumns(strapi);
    await ensureDropRateLabels(strapi);
  },
};
