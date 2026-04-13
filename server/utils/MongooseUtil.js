//CLI: npm install mongoose --save
const mongoose = require("mongoose");
const MyConstants = require("./MyConstants");
// Prefer explicit URI when provided. Otherwise, build a safe default.
let uri = MyConstants.DB_URI;
if (!uri) {
  const hasUser = Boolean(MyConstants.DB_USER);
  const isAtlasLike = String(MyConstants.DB_SERVER || '').includes('mongodb.net');
  if (hasUser && isAtlasLike) {
    uri =
      "mongodb+srv://" +
      encodeURIComponent(MyConstants.DB_USER) +
      ":" +
      encodeURIComponent(MyConstants.DB_PASS || '') +
      "@" +
      MyConstants.DB_SERVER +
      "/" +
      MyConstants.DB_DATABASE;
  } else {
    // Local default (no auth)
    uri = "mongodb://127.0.0.1:27017/" + MyConstants.DB_DATABASE;
  }
}

mongoose
  .connect(uri)
  .then(() => {
    console.log("Connected to " + uri);
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });
