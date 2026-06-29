// packages/controller/src/utils/helpers.ts

import fs from "fs-extra";
import path from "path";

import { detectBoardType } from "shared-config";
import { DIR_VIDEO_ROOT } from "../config.js";

export interface VideoPaths {
  base: string;
  segments: string;
  final: string;
}

export function getPaths(date: string): VideoPaths {
  const base = path.join(DIR_VIDEO_ROOT, date);
  const segments = path.join(base, "segments");

  fs.ensureDirSync(segments);

  return {
    base,
    segments,
    final: path.join(base, `${date}.mp4`),
  };
}

export function chunkArray<T>(items: T[], size: number): T[][] {
  if (!Number.isFinite(size) || size <= 0) {
    throw new Error(`chunkArray size 无效: ${size}`);
  }

  const result: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }

  return result;
}

export function getCopyrightLabel(copyright: unknown): string {
  const value = Number(copyright);

  if ([1, 3, 100].includes(value)) return "本家";
  if ([2, 101].includes(value)) return "搬运";

  return "搬运";
}

export function getBoardTypeName(boardType: string): string {
  if (boardType === "daily") return "日刊";
  if (boardType === "weekly") return "周刊";
  if (boardType === "monthly") return "月刊";
  if (boardType === "coverWeekly") return "翻唱周刊";
  if (boardType === "special") return "特刊";

  return boardType;
}

export function isIssueDataFile(filename: string): boolean {
  if (!filename.endsWith(".json")) return false;
  if (filename.endsWith("_config.json")) return false;
  if (filename === "clips_db.json") return false;

  const date = filename.replace(/\.json$/, "");
  const boardType = detectBoardType(date);

  return boardType !== "special" || date.startsWith("special");
}

export function formatDateDisplay(date: string, boardType: string): string {
  if (boardType === "monthly") {
    const [year, month] = date.split("-");

    if (!year || !month) return date;

    return `${year}年${Number(month)}月`;
  }

  return date;
}

export function safeParse(value: unknown): number {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
}
