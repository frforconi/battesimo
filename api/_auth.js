// api/_auth.js — shared auth helper used by all endpoints
const jwt = require("jsonwebtoken");

/**
 * Verifica il JWT dal cookie di sessione.
 * Restituisce il payload decodificato oppure null (e scrive la risposta 401).
 */
function requireAuth(req, res) {
  // Parse cookies manually (no external dep needed)
  const cookieHeader = req.headers.cookie || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k, v.join("=")];
    })
  );

  const token = cookies["session"];
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
    return null;
  }
}

module.exports = { requireAuth };
