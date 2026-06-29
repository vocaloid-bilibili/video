// packages/controller/src/utils/clips.ts

import fs from "fs-extra";
import path from "path";

import { DIR_CLIP_DB } from "../config.js";

export const CLIP_DEFAULT_DURATION = 20;
export const CLIP_MIN_DURATION = 15;
export const CLIP_MAX_DURATION = 35;

export interface ClipSetting {
  bvid: string;
  startTime: number;
  endTime: number;
  duration: number;
  updatedAt: string;
}

export type ClipSettingsDb = Record<string, ClipSetting>;

let clipsCache: ClipSettingsDb | null = null;

function roundTime(value: number): number {
  return Math.round(value * 100) / 100;
}

function clampDuration(duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) {
    return CLIP_DEFAULT_DURATION;
  }

  if (duration < CLIP_MIN_DURATION) return CLIP_MIN_DURATION;
  if (duration > CLIP_MAX_DURATION) return CLIP_MAX_DURATION;

  return duration;
}

function normalizeClipSetting(bvid: string, raw: unknown): ClipSetting | null {
  if (!raw || typeof raw !== "object") return null;

  const item = raw as Record<string, unknown>;
  const startTime = Number(item.startTime);

  if (!Number.isFinite(startTime) || startTime < 0) {
    return null;
  }

  const rawDuration = Number(item.duration);
  const rawEndTime = Number(item.endTime);

  const duration = clampDuration(
    Number.isFinite(rawDuration)
      ? rawDuration
      : Number.isFinite(rawEndTime)
        ? rawEndTime - startTime
        : CLIP_DEFAULT_DURATION,
  );

  const normalizedStart = roundTime(startTime);
  const normalizedDuration = roundTime(duration);
  const normalizedEnd = roundTime(normalizedStart + normalizedDuration);

  return {
    bvid,
    startTime: normalizedStart,
    endTime: normalizedEnd,
    duration: roundTime(normalizedEnd - normalizedStart),
    updatedAt:
      typeof item.updatedAt === "string"
        ? item.updatedAt
        : new Date().toISOString(),
  };
}

function loadClipsDb(): ClipSettingsDb {
  if (clipsCache) return clipsCache;

  if (!fs.existsSync(DIR_CLIP_DB)) {
    clipsCache = {};
    return clipsCache;
  }

  const raw = fs.readJsonSync(DIR_CLIP_DB) as Record<string, unknown>;
  const db: ClipSettingsDb = {};

  for (const [bvid, value] of Object.entries(raw)) {
    const setting = normalizeClipSetting(bvid, value);

    if (setting) {
      db[bvid] = setting;
    }
  }

  clipsCache = db;
  return clipsCache;
}

function sortDb(db: ClipSettingsDb): ClipSettingsDb {
  return Object.fromEntries(
    Object.entries(db).sort(([a], [b]) => a.localeCompare(b)),
  );
}

function saveClipsDb(): void {
  if (!clipsCache) return;

  fs.ensureDirSync(path.dirname(DIR_CLIP_DB));

  const tempPath = `${DIR_CLIP_DB}.tmp-${process.pid}-${Date.now()}`;

  try {
    fs.writeJsonSync(tempPath, sortDb(clipsCache), { spaces: 2 });
    fs.moveSync(tempPath, DIR_CLIP_DB, { overwrite: true });
  } catch (error) {
    if (fs.existsSync(tempPath)) {
      fs.removeSync(tempPath);
    }

    throw error;
  }
}

function createClipSetting(
  bvid: string,
  startTime: number,
  endTime: number | null,
): ClipSetting {
  const normalizedStart = roundTime(Math.max(0, startTime));
  const requestedEnd =
    typeof endTime === "number" && Number.isFinite(endTime)
      ? endTime
      : normalizedStart + CLIP_DEFAULT_DURATION;

  const duration = clampDuration(requestedEnd - normalizedStart);
  const normalizedDuration = roundTime(duration);
  const normalizedEnd = roundTime(normalizedStart + normalizedDuration);

  return {
    bvid,
    startTime: normalizedStart,
    endTime: normalizedEnd,
    duration: roundTime(normalizedEnd - normalizedStart),
    updatedAt: new Date().toISOString(),
  };
}

export function getClipSetting(bvid: string): ClipSetting | null {
  const db = loadClipsDb();
  return db[bvid] || null;
}

export function getAllClipSettings(): ClipSettingsDb {
  return { ...loadClipsDb() };
}

export function setClipSetting(
  bvid: string,
  startTime: number,
  endTime: number | null = null,
): ClipSetting {
  const db = loadClipsDb();
  const setting = createClipSetting(bvid, startTime, endTime);

  db[bvid] = setting;
  clipsCache = db;

  saveClipsDb();

  return setting;
}

export function deleteClipSetting(bvid: string): boolean {
  const db = loadClipsDb();

  if (!db[bvid]) {
    return false;
  }

  delete db[bvid];
  clipsCache = db;

  saveClipsDb();

  return true;
}

export function clearClipSettingsCache(): void {
  clipsCache = null;
}
