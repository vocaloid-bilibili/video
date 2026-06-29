// packages/controller/src/state.ts

export const TASK_STATUS = {
  IDLE: "idle",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

export interface TaskProgress {
  total: number;
  current: number;
  details: unknown[];
}

export interface TaskState {
  status: TaskStatus;
  targetDate: string | null;
  startTime: number;
  step: string;
  progress: TaskProgress;
  logs: string[];
  error: string | null;
}

function createIdleTask(): TaskState {
  return {
    status: TASK_STATUS.IDLE,
    targetDate: null,
    startTime: 0,
    step: "",
    progress: {
      total: 0,
      current: 0,
      details: [],
    },
    logs: [],
    error: null,
  };
}

let currentTask: TaskState = createIdleTask();

export function log(message: string): void {
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

  if (currentTask.logs.length > 1000) {
    currentTask.logs.shift();
  }
}

export function updateProgress(
  step: string,
  current: number,
  total = 0,
  detail: unknown = null,
): void {
  currentTask.step = step;

  if (total > 0) {
    currentTask.progress.total = total;
  }

  currentTask.progress.current = current;

  if (detail !== null) {
    currentTask.progress.details.push(detail);
  }
}

export function resetTask(targetDate: string): void {
  currentTask = {
    status: TASK_STATUS.PROCESSING,
    targetDate,
    startTime: Date.now(),
    step: "初始化",
    progress: {
      total: 0,
      current: 0,
      details: [],
    },
    logs: [],
    error: null,
  };
}

export function setTaskStatus(
  status: TaskStatus,
  error: string | null = null,
): void {
  currentTask.status = status;
  currentTask.error = error;
}

export function getTask(): TaskState {
  return currentTask;
}
