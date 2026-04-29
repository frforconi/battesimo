const { getDriveClient } = require("../_drive");
const { requireAuth } = require("../_auth");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!requireAuth(req, res)) return;

  const { fileId } = req.query;
  if (!fileId) return res.status(400).json({ error: "fileId required" });

  try {
    const drive = getDriveClient();

    const response = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" }
    );

    res.setHeader("Content-Type", response.headers["content-type"] || "image/jpeg");
    res.setHeader("Cache-Control", "private, max-age=3600");
    response.data.pipe(res);
  } catch (err) {
    console.error("Thumbnail proxy error:", err.message);
    res.status(500).json({ error: "Failed to fetch image" });
  }
};
