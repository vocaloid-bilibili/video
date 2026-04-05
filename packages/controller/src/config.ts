import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ 必须指向 .env 文件
export const MONOREPO_ROOT = path.resolve(process.cwd(), "../../");
const ENV_PATH = path.join(MONOREPO_ROOT, ".env");

// ✅ 先加载
dotenv.config({
  path: ENV_PATH
});

const env = process.env;

export const PORT = env.PORT || 3002;
export const API_KEY = env.API_KEY || "1145140721";
export const PYTHON_API = env.PYTHON_API || "http://127.0.0.1:8000/analyze";
export const CHROME_EXECUTABLE = env.CHROME_EXECUTABLE || `C:\\chrome-headless-shell\\chrome-headless-shell.exe`;

export const STORAGE_ROOT = path.resolve(MONOREPO_ROOT, "storage")

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

export const USE_GPU = process.env.USE_GPU;

console.log("USE_GPU：", USE_GPU)

let VIDEO_CODEC: string
let ENCODE_OPTS: string
let HWACCEL: string

if (USE_GPU === "NVIDIA") {
  VIDEO_CODEC = "h264_nvenc";
  ENCODE_OPTS = "-preset p1 -rc vbr -cq 23 -b:v 6M -maxrate 10M";
  HWACCEL = "-hwaccel cuda";
} else if (USE_GPU === "INTEL") {
  VIDEO_CODEC = "h264_qsv";
  ENCODE_OPTS = "-preset fast -b:v 6M -maxrate 10M";
  HWACCEL = "";
} else {
  VIDEO_CODEC = "libx264";
  ENCODE_OPTS = "-preset medium -crf 23";
  HWACCEL = "";
}

export {
  VIDEO_CODEC,
  ENCODE_OPTS,
  HWACCEL
}

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
