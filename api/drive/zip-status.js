// api/drive/zip-status.js
const { requireAuth } = require("../_auth");
const zipTasks = require("./_zip-tasks");

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;

  const { taskId } = req.query;
  if (!taskId) return res.status(400).json({ error: "Missing taskId" });

  const task = zipTasks.getTask(taskId);
  if (!task) return res.status(404).json({ error: "Task not found" });

  res.json({
    status: task.status,
    current: task.current,
    total: task.total,
    error: task.error
  });
};
