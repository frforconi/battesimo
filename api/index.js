// api/index.js
// Production server for Render
// Serves both the API and the static frontend files.

const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

// Load environment variables in development
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: ".env.local" });
}

app.use(express.json());

// CORS configuration - Allow the frontend (same origin in production, localhost in dev)
const allowedOrigins = [
  "http://localhost:4200",
  process.env.FRONTEND_URL // Optional: Add your Render URL here later
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.includes(".render.com")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

// --- API Routes ---
app.all("/api/auth/login", require("./auth/login"));
app.all("/api/auth/callback", require("./auth/callback"));
app.all("/api/auth/me", require("./auth/me"));
app.all("/api/auth/logout", require("./auth/logout"));
app.all("/api/drive/images", require("./drive/images"));
app.all("/api/drive/thumbnail", require("./drive/thumbnail"));

// --- Static Frontend Files ---
const frontendPath = path.join(__dirname, "../frontend/dist/browser");
app.use(express.static(frontendPath));

// --- SPA Fallback ---
// Redirect all other requests to index.html so Angular can handle routing
app.get("/*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Production server running on port ${PORT}`);
  console.log(`📂 Serving frontend from: ${frontendPath}`);
});
