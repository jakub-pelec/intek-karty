"use strict";

const path = require("path");

async function run() {
  const { createStrapi } = require("@strapi/strapi");
  const app = await createStrapi({
    appDir: path.join(__dirname, ".."),
  }).load();
  const { backfillPublishedCards } = require("../src/api/card/services/holo-map");
  const filled = await backfillPublishedCards(app);
  console.log(`Generated ${filled} holo channel map(s)`);
  await app.destroy();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
