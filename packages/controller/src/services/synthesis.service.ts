// packages/controller/src/services/synthesis.service.ts

import fs from "fs-extra";
import path from "path";

import {
  getTask,
  log,
  resetTask,
  setTaskStatus,
  TASK_STATUS,
} from "../state.js";
import { getBoardTypeName, getPaths } from "../utils/helpers.js";
import { detectBoardType } from "shared-config";
import { runSynthesisTask } from "../synthesis/task.js";
import { httpError } from "../utils/http.js";

interface StartSynthesisInput {
  date?: unknown;
}

interface DeleteSegmentInput {
  date?: unknown;
  type?: unknown;
  rank?: unknown;
  segmentName?: unknown;
}

function assertNotProcessing(): void {
  const task = getTask();

  if (task.status === TASK_STATUS.PROCESSING) {
    throw httpError(400, "任务进行中");
  }
}

function getRequiredDate(value: unknown, message: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw httpError(400, message);
  }

  return value.trim();
}

function runTaskDetached(date: string, actionName: string): void {
  runSynthesisTask(date).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);

    setTaskStatus(TASK_STATUS.FAILED, message);
    log(`${actionName}失败: ${message}`);
  });
}

export function startSynthesis(input: StartSynthesisInput) {
  const date = getRequiredDate(input.date, "缺少排行名称");

  assertNotProcessing();

  resetTask(date);

  const boardType = detectBoardType(date);
  const typeName = getBoardTypeName(boardType);

  log(`开始${typeName}合成: ${date}`);

  runTaskDetached(date, "任务");

  return {
    status: "started",
    boardType,
  };
}

export function mergeSynthesis(input: StartSynthesisInput) {
  const date = getRequiredDate(input.date, "缺少日期");

  assertNotProcessing();

  resetTask(date);
  log(`开始合并: ${date}`);

  runTaskDetached(date, "合并");

  return {
    status: "started",
  };
}

function getSegmentFileName(input: DeleteSegmentInput): string {
  if (typeof input.segmentName === "string" && input.segmentName.length > 0) {
    const safeName = path.basename(input.segmentName);

    if (safeName !== input.segmentName || !safeName.endsWith(".mp4")) {
      throw httpError(400, "segmentName 无效");
    }

    return safeName;
  }

  if (typeof input.type === "string" && typeof input.rank === "number") {
    return `rank_${input.type}_${input.rank.toString().padStart(3, "0")}.mp4`;
  }

  throw httpError(400, "缺少分片参数");
}

export async function deleteSynthesisSegment(input: DeleteSegmentInput) {
  const date = getRequiredDate(input.date, "缺少日期");

  assertNotProcessing();

  const { segments } = getPaths(date);
  const targetFile = getSegmentFileName(input);
  const filePath = path.join(segments, targetFile);
  const rawName = targetFile.replace(".mp4", "_raw.mp4");
  const rawPath = path.join(segments, rawName);

  if (await fs.pathExists(filePath)) {
    await fs.remove(filePath);
    log(`删除分片: ${targetFile}`);
  }

  if (await fs.pathExists(rawPath)) {
    await fs.remove(rawPath);
    log(`删除中间文件: ${rawName}`);
  }

  return {
    status: "success",
    message: `已删除 ${targetFile}，下次合成时会重新生成`,
  };
}
