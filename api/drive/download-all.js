const { getDriveClient } = require("../_drive");
const { requireAuth } = require("../_auth");
const archiver = require("archiver");
const defaultFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
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

    // 2. Setup archiver
    const archive = archiver("zip", {
      zlib: { level: 1 }, // Level 1 is much faster than 5 and sufficient for already compressed images
    });

    // 3. Set headers for zip download
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="gallery-photos.zip"`
    );

    // Pipe archive data to the response
    archive.pipe(res);

    // 4. Add files to the archive
    console.log(`📦 Starting ZIP generation for ${allFiles.length} files...`);
    
    for (const file of allFiles) {
      try {
        const fileResponse = await drive.files.get(
          { fileId: file.id, alt: "media" },
          { responseType: "stream" }
        );
        archive.append(fileResponse.data, { name: file.name });
      } catch (err) {
        console.error(`❌ Error adding file ${file.name} to zip:`, err.message);
        // We continue with other files
      }
    }

    // 5. Finalize the archive
    await archive.finalize();
    console.log(`✅ ZIP generation complete.`);
  } catch (err) {
    console.error("Download all error:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to create zip archive" });
    }
  }
};
