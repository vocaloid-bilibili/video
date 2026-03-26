// state.js (ES模块最终版本)
// 核心常量：命名导出（适配api.js的解构导入）
export const TASK_STATUS = {
  IDLE: "idle",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
};

// 任务状态存储（保留原有逻辑）
let currentTask = {
  status: TASK_STATUS.IDLE,
  targetDate: null,
  step: "",
  progress: { total: 0, current: 0, details: [] },
  logs: [],
  error: null,
};

// 日志函数：命名导出
export function log(message) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("zh-CN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const line = `[${timeStr}] ${message}`;
  console.log(line);
  currentTask.logs.push(line);
  if (currentTask.logs.length > 1000) currentTask.logs.shift();
}

// 进度更新函数：命名导出
export function updateProgress(step, current, total = 0, detail = null) {
  currentTask.step = step;
  if (total > 0) currentTask.progress.total = total;
  if (current !== null) currentTask.progress.current = current;
  if (detail) currentTask.progress.details.push(detail);
}

// 重置任务函数：命名导出
export function resetTask(date) {
  currentTask = {
    status: TASK_STATUS.PROCESSING,
    targetDate: date,
    startTime: Date.now(),
    step: "初始化",
    progress: { total: 0, current: 0, details: [] },
    logs: [],
    error: null,
  };
}

// 设置任务状态函数：命名导出
export function setTaskStatus(status, error = null) {
  currentTask.status = status;
  if (error) currentTask.error = error;
}

// 获取任务状态函数：命名导出
export function getTask() {
  return currentTask;
}