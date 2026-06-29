// packages/controller/src/config.ts

import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const MONOREPO_ROOT = path.resolve(__dirname, "../../..");
export const ENV_PATH = path.join(MONOREPO_ROOT, ".env");

dotenv.config({ path: ENV_PATH });

const env = process.env;

function getEnvString(name: string, fallback: string): string {
  const value = env[name];
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

function getEnvNumber(name: string, fallback: number): number {
  const value = Number(env[name]);
  return Number.isFinite(value) ? value : fallback;
}

export const PORT = getEnvNumber("PORT", 3002);
export const API_KEY = getEnvString("API_KEY", "1145140721");
export const PYTHON_API = getEnvString(
  "PYTHON_API",
  "http://127.0.0.1:8000/analyze",
);

export const CHROME_EXECUTABLE = getEnvString(
  "CHROME_EXECUTABLE",
  "C:\\chrome-headless-shell\\chrome-headless-shell.exe",
);

export const STORAGE_ROOT = path.resolve(MONOREPO_ROOT, "storage");

export const DIR_ROOT = MONOREPO_ROOT;
export const DIR_DATA = path.resolve(STORAGE_ROOT, "data");
export const DIR_DOWNLOADS = path.resolve(STORAGE_ROOT, "downloads");
export const DIR_IMAGES = path.resolve(DIR_DOWNLOADS, "images");
export const DIR_VIDEO_ROOT = path.resolve(STORAGE_ROOT, "video");
export const DIR_AUDIO_CACHE = path.resolve(DIR_DOWNLOADS, "audio_cache");
export const DIR_AVATAR = path.resolve(DIR_DOWNLOADS, "avatar");
export const DIR_STAFF = path.resolve(DIR_DOWNLOADS, "staff");
export const DIR_FULL_VIDEO = path.resolve(DIR_DOWNLOADS, "full_videos");
export const DIR_CLIP_DB = path.resolve(DIR_DATA, "clips_db.json");
export const COOKIES_PATH = path.resolve(MONOREPO_ROOT, "cookies.txt");

export type GpuVendor = "NVIDIA" | "INTEL" | "CPU";

function getGpuVendor(): GpuVendor {
  const value = getEnvString("USE_GPU", "CPU").toUpperCase();

  if (value === "NVIDIA") return "NVIDIA";
  if (value === "INTEL") return "INTEL";

  return "CPU";
}

export const USE_GPU = getGpuVendor();

function getEncodeConfig(gpu: GpuVendor): {
  videoCodec: string;
  encodeOpts: string;
  hwaccel: string;
} {
  if (gpu === "NVIDIA") {
    return {
      videoCodec: "h264_nvenc",
      encodeOpts: "-preset p1 -rc vbr -cq 23 -b:v 6M -maxrate 10M",
      hwaccel: "-hwaccel cuda",
    };
  }

  if (gpu === "INTEL") {
    return {
      videoCodec: "h264_qsv",
      encodeOpts: "-preset fast -b:v 6M -maxrate 10M",
      hwaccel: "",
    };
  }

  return {
    videoCodec: "libx264",
    encodeOpts: "-preset medium -crf 23",
    hwaccel: "",
  };
}

const encodeConfig = getEncodeConfig(USE_GPU);

export const VIDEO_CODEC = encodeConfig.videoCodec;
export const ENCODE_OPTS = encodeConfig.encodeOpts;
export const HWACCEL = encodeConfig.hwaccel;

export interface StaffMember {
  name: string;
  uid: string;
}

export const STAFF_LIST: StaffMember[] = [
  { name: "星幻丶碎梦", uid: "151045420" },
  { name: "哈里布莱", uid: "382104768" },
  { name: "来杯Kou茶", uid: "433286612" },
  { name: "ETeyondLitle", uid: "3546619070909322" },
  { name: "Sayonzei", uid: "9216592" },
  { name: "周某不是轴某", uid: "488423021" },
  { name: "琳峰", uid: "3537120658459221" },
  { name: "黑猫", uid: "640588036" },
  { name: "是非成败转头空", uid: "1737183223" },
  { name: "蓝溪水", uid: "675685757" },
  { name: "白板だよ", uid: "621087695" },
];

export function ensureStorageDirs(): void {
  [
    DIR_DATA,
    DIR_DOWNLOADS,
    DIR_IMAGES,
    DIR_VIDEO_ROOT,
    DIR_AUDIO_CACHE,
    DIR_AVATAR,
    DIR_STAFF,
    DIR_FULL_VIDEO,
  ].forEach((dir) => fs.ensureDirSync(dir));
}
