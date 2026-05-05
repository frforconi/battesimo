// api/drive/_zip-tasks.js
// Singleton to manage background ZIP tasks

const tasks = new Map();

module.exports = {
  createTask(id, total) {
    tasks.set(id, {
      id,
      status: "processing",
      current: 0,
      total: total,
      filePath: null,
      error: null,
      createdAt: Date.now(),
    });
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
