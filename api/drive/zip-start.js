// api/drive/zip-start.js
const { getDriveClient } = require("../_drive");
const { requireAuth } = require("../_auth");
const zipTasks = require("./_zip-tasks");
const archiver = require("archiver");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const defaultFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;

  const { folderId } = req.query;
  const targetFolderId = folderId || defaultFolderId;
  const taskId = crypto.randomBytes(8).toString("hex");

  try {
    const drive = getDriveClient();

    // 1. Get file list first to know the total
    let allFiles = [];
    let pageToken = null;
    do {
      const response = await drive.files.list({
        q: `'${targetFolderId}' in parents and mimeType contains 'image/' and trashed = false`,
        pageSize: 1000,
        pageToken: pageToken || undefined,
        fields: "nextPageToken, files(id, name)",
      });
      allFiles = allFiles.concat(response.data.files || []);
      pageToken = response.data.nextPageToken;
    } while (pageToken);

    if (allFiles.length === 0) {
      return res.status(404).json({ error: "No images found" });
    }

    // 2. Initialize task
    zipTasks.createTask(taskId, allFiles.length);
    
    // Send taskId to frontend immediately
    res.json({ taskId, total: allFiles.length });

    // 3. Start background processing
    (async () => {
      const zipPath = path.join("/tmp", `gallery-${taskId}.zip`);
      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 1 } });

      output.on("close", () => {
        zipTasks.completeTask(taskId, zipPath);
      });

      archive.on("error", (err) => {
        console.error("Archive error:", err);
        zipTasks.failTask(taskId, err.message);
      });

      archive.pipe(output);

      for (let i = 0; i < allFiles.length; i++) {
        // Abort if task was cancelled
        if (zipTasks.isCancelled(taskId)) {
          console.log(`⏹ Task ${taskId} cancelled. Aborting...`);
          archive.abort(); // Archiver specific abort
          output.end();
          fs.unlink(zipPath, () => {}); // Delete partial file
          return;
        }

        const file = allFiles[i];
        try {
          const fileResponse = await drive.files.get(
            { fileId: file.id, alt: "media" },
            { responseType: "stream" }
          );
          archive.append(fileResponse.data, { name: file.name });
          
          // Update progress every file (or every few files if too many)
          zipTasks.updateProgress(taskId, i + 1);
        } catch (err) {
          console.error(`Error adding ${file.name}:`, err.message);
        }
      }

      await archive.finalize();
    })().catch(err => {
      console.error("Background ZIP error:", err);
      zipTasks.failTask(taskId, err.message);
    });

  } catch (err) {
    console.error("Zip start error:", err.message);
    res.status(500).json({ error: "Failed to start zip task" });
  }
};
