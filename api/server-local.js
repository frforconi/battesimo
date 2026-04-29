// api/server-local.js
// Wraps all Vercel serverless functions in a local Express server for development.
// Usage: node api/server-local.js

require("dotenv").config({ path: ".env.local" });

const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors({ origin: "http://localhost:4200", credentials: true }));
app.use(express.json());

// Mount API routes
app.all("/api/auth/login", require("./auth/login"));
app.all("/api/auth/callback", require("./auth/callback"));
app.all("/api/auth/me", require("./auth/me"));
app.all("/api/auth/logout", require("./auth/logout"));
app.all("/api/drive/images", require("./drive/images"));
app.all("/api/drive/thumbnail", require("./drive/thumbnail"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API server running at http://localhost:${PORT}`);
});
