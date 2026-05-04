const { getDriveClient } = require("../_drive");
const { requireAuth } = require("../_auth");
const archiver = require("archiver");
const defaultFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Expose-Headers", "X-Total-Files");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!requireAuth(req, res)) return;

  const { folderId } = req.query;
  const targetFolderId = folderId || defaultFolderId;

  try {
    const drive = getDriveClient();

    // 1. List all images in the folder
    let allFiles = [];
    let pageToken = null;

    do {
      const response = await drive.files.list({
        q: `'${targetFolderId}' in parents and mimeType contains 'image/' and trashed = false`,
        pageSize: 100,
        pageToken: pageToken || undefined,
        fields: "nextPageToken, files(id, name)",
      });
      allFiles = allFiles.concat(response.data.files || []);
      pageToken = response.data.nextPageToken;
    } while (pageToken);

    if (allFiles.length === 0) {
      return res.status(404).json({ error: "No images found in folder" });
    }

    // 2. Setup archiver — stream immediately to the client
    const archive = archiver("zip", { zlib: { level: 1 } }); // level 1 = fast compression (images are already compressed)

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="gallery-photos.zip"`);
    res.setHeader("X-Total-Files", String(allFiles.length));

    archive.pipe(res);

    // 3. Add files one by one — archiver streams each to the response as it goes
    for (const file of allFiles) {
      try {
        const fileResponse = await drive.files.get(
          { fileId: file.id, alt: "media" },
          { responseType: "stream" }
        );
        archive.append(fileResponse.data, { name: file.name });
      } catch (err) {
        console.error(`Error adding file ${file.name}:`, err.message);
      }
    }

    await archive.finalize();
  } catch (err) {
    console.error("Download all error:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to create zip archive" });
    }
  }
};
