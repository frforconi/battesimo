const { getDriveClient } = require("../_drive");
const { requireAuth } = require("../_auth");
const defaultFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!requireAuth(req, res)) return;

  const { folderId } = req.query;
  const targetFolderId = folderId || defaultFolderId;

  try {
    const drive = getDriveClient();

    // Paginate through ALL files to return the complete list
    let allFiles = [];
    let pageToken = null;

    do {
      const response = await drive.files.list({
        q: `'${targetFolderId}' in parents and mimeType contains 'image/' and trashed = false`,
        pageSize: 100,
        pageToken: pageToken || undefined,
        fields: "nextPageToken, files(id, name, mimeType)",
        orderBy: "createdTime desc",
      });
      allFiles = allFiles.concat(response.data.files || []);
      pageToken = response.data.nextPageToken;
    } while (pageToken);

    res.json({
      files: allFiles.map((f) => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
      })),
      total: allFiles.length,
    });
  } catch (err) {
    console.error("List all error:", err.message);
    res.status(500).json({ error: "Failed to list images" });
  }
};
