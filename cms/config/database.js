const path = require("node:path");

module.exports = ({ env }) => {
  const filename = env("DATABASE_FILENAME", "data/data.db");
  return {
    connection: {
      client: "sqlite",
      connection: {
        filename: path.isAbsolute(filename)
          ? filename
          : path.join(process.cwd(), filename),
      },
      useNullAsDefault: true,
    },
  };
};
