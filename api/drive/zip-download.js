// api/drive/zip-download.js
const { requireAuth } = require("../_auth");
const zipTasks = require("./_zip-tasks");
const fs = require("fs");
const path = require("path");

module.exports = async (req, res) => {
  // Authentication check - note: if using window.location.href, cookies must be sent
  if (!requireAuth(req, res)) return;

  const { taskId } = req.query;
  if (!taskId) return res.status(400).json({ error: "Missing taskId" });

  const task = zipTasks.getTask(taskId);
  if (!task) return res.status(404).json({ error: "Task not found" });

  if (task.status !== "completed" || !task.filePath) {
    return res.status(400).json({ error: "Task not completed yet" });
  }

  if (!fs.existsSync(task.filePath)) {
    return res.status(404).json({ error: "File no longer exists" });
  }

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="gallery-photos.zip"`);

  const stream = fs.createReadStream(task.filePath);
  
  stream.pipe(res);

  stream.on("end", () => {
    // Delete file after download to save space
    fs.unlink(task.filePath, (err) => {
      if (err) console.error("Error deleting temp zip:", err);
    });
    zipTasks.deleteTask(taskId);
  });

  stream.on("error", (err) => {
    console.error("Stream error during download:", err);
  });
};
