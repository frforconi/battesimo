// api/drive/_zip-tasks.js
// Singleton to manage background ZIP tasks

const tasks = new Map();

module.exports = {
  createTask(id, total) {
    tasks.set(id, {
      id,
      status: "processing",
      cancelled: false, // New flag
      current: 0,
      total: total,
      filePath: null,
      error: null,
      createdAt: Date.now(),
    });
  },

  cancelTask(id) {
    const task = tasks.get(id);
    if (task) {
      task.cancelled = true;
      task.status = "cancelled";
    }
  },

  isCancelled(id) {
    return tasks.get(id)?.cancelled === true;
  },

  updateProgress(id, current) {
    const task = tasks.get(id);
    if (task) {
      task.current = current;
    }
  },

  completeTask(id, filePath) {
    const task = tasks.get(id);
    if (task) {
      task.status = "completed";
      task.filePath = filePath;
    }
  },

  failTask(id, error) {
    const task = tasks.get(id);
    if (task) {
      task.status = "failed";
      task.error = error;
    }
  },

  getTask(id) {
    return tasks.get(id);
  },

  deleteTask(id) {
    tasks.delete(id);
  }
};
