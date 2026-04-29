const { getDriveClient } = require("../_drive");
const { requireAuth } = require("../_auth");
const defaultFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!requireAuth(req, res)) return;

  const { pageToken, folderId, limit = "30" } = req.query;

  try {
    const drive = getDriveClient();

    let q = "mimeType contains 'image/' and trashed = false";
    if (folderId) q += ` and '${folderId}' in parents`;
    else q += ` and '${defaultFolderId}' in parents`;

    const response = await drive.files.list({
      q,
      pageSize: Math.min(Number(limit), 100),
      pageToken: pageToken || undefined,
      fields:
        "nextPageToken, files(id, name, mimeType, createdTime, imageMediaMetadata, thumbnailLink)",
      orderBy: "createdTime desc",
    });

    const files = (response.data.files || []).map((f) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      createdTime: f.createdTime,
      // Use Google's thumbnail link for performance, fallback to proxy
      // We increase the size from s220 (default) to s400 for better grid quality
      thumbnailUrl: f.thumbnailLink 
        ? f.thumbnailLink.replace(/=s220$/, "=s400") 
        : `/api/drive/thumbnail?fileId=${f.id}`,
      // For the lightbox, we use a larger thumbnail (s1600) instead of the full media
      // to ensure fast loading while maintaining high visual quality.
      imageUrl: f.thumbnailLink 
        ? f.thumbnailLink.replace(/=s220$/, "=s1600") 
        : `/api/drive/thumbnail?fileId=${f.id}`,
      width: f.imageMediaMetadata?.width,
      height: f.imageMediaMetadata?.height,
    }));

    res.json({
      images: files,
      nextPageToken: response.data.nextPageToken || null,
    });
  } catch (err) {
    console.error("Drive API error:", err);
    res.status(500).json({ error: "Failed to fetch images from Google Drive" });
  }
};
