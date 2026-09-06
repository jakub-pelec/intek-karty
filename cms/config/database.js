const path = require("node:path");

module.exports = ({ env }) => ({
  connection: {
    client: "sqlite",
    connection: {
      filename: path.join(
        process.cwd(),
        env("DATABASE_FILENAME", "data/data.db"),
      ),
    },
    useNullAsDefault: true,
  },
});
