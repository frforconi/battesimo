// api/drive/zip-cancel.js
const { requireAuth } = require("../_auth");
const zipTasks = require("./_zip-tasks");

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;

  const { taskId } = req.query;
  if (!taskId) return res.status(400).json({ error: "Missing taskId" });

  const task = zipTasks.getTask(taskId);
  if (!task) return res.status(404).json({ error: "Task not found" });

  zipTasks.cancelTask(taskId);
  console.log(`🗑 Task ${taskId} marked as cancelled by user.`);
  
  res.json({ message: "Task cancellation initiated" });
};
