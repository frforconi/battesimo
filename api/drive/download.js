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

    // 1. Get file metadata to get the original filename
    const metadata = await drive.files.get({
      fileId,
      fields: "name, mimeType",
    });

    const fileName = metadata.data.name;
    const mimeType = metadata.data.mimeType;

    // 2. Fetch the actual file content (full quality)
    const response = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" }
    );

    // 3. Set headers for download
    res.setHeader("Content-Type", mimeType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`
    );

    // 4. Pipe the stream to the response
    response.data.pipe(res);
  } catch (err) {
    console.error("Download error:", err.message);
    res.status(500).json({ error: "Failed to download image" });
  }
};
