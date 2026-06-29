// packages/controller/src/services/clips.service.ts

import {
  deleteClipSetting,
  getAllClipSettings,
  getClipSetting,
  setClipSetting,
} from "../utils/clips.js";
import { isValidBvid } from "../utils/bilibili.js";
import { log } from "../state.js";
import { httpError } from "../utils/http.js";

interface SaveClipInput {
  startTime?: unknown;
  endTime?: unknown;
}

function requireBvid(bvid: string): string {
  if (!isValidBvid(bvid)) {
    throw httpError(400, "bvid 无效");
  }

  return bvid;
}

function parseRequiredTime(value: unknown, fieldName: string): number {
  const numberValue = typeof value === "string" ? Number(value) : value;

  if (typeof numberValue !== "number" || !Number.isFinite(numberValue)) {
    throw httpError(400, `${fieldName} 无效`);
  }

  return numberValue;
}

function parseOptionalTime(value: unknown, fieldName: string): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const numberValue = typeof value === "string" ? Number(value) : value;

  if (typeof numberValue !== "number" || !Number.isFinite(numberValue)) {
    throw httpError(400, `${fieldName} 无效`);
  }

  return numberValue;
}

export function getAllSongClips() {
  return getAllClipSettings();
}

export function getSongClip(bvid: string) {
  const validBvid = requireBvid(bvid);
  const clip = getClipSetting(validBvid);

  if (!clip) {
    return { exists: false };
  }

  return clip;
}

export function saveSongClip(bvid: string, input: SaveClipInput) {
  const validBvid = requireBvid(bvid);
  const startTime = parseRequiredTime(input.startTime, "startTime");
  const endTime = parseOptionalTime(input.endTime, "endTime");

  if (startTime < 0) {
    throw httpError(400, "startTime 无效");
  }

  if (endTime !== null && endTime <= startTime) {
    throw httpError(400, "endTime 必须大于 startTime");
  }

  const result = setClipSetting(validBvid, startTime, endTime);

  log(
    `保存裁切设置: ${validBvid} (${result.startTime}s - ${result.endTime}s, ${result.duration}s)`,
  );

  return result;
}

export function deleteSongClip(bvid: string) {
  const validBvid = requireBvid(bvid);
  const deleted = deleteClipSetting(validBvid);

  if (deleted) {
    log(`删除裁切设置: ${validBvid}`);
  }

  return deleted;
}
