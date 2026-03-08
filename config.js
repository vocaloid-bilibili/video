// config.js (ES模块最终版本)
import path from 'path';
import { fileURLToPath } from 'url';

// ES模块中手动定义__dirname/__filename（关键）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 原有变量定义（逻辑不变）
export const PORT = 3002;
export const API_KEY = "1145140721";
export const PYTHON_API = "http://127.0.0.1:8000/analyze";
export const CHROME_EXECUTABLE = `"C:\\chrome-headless-shell\\chrome-headless-shell.exe"`;

export const DIR_ROOT = path.resolve(__dirname);
export const DIR_DATA = path.resolve(DIR_ROOT, "data");
export const DIR_DOWNLOADS = path.resolve(DIR_ROOT, "downloads");
export const DIR_IMAGES = path.resolve(DIR_DOWNLOADS, "images");
export const DIR_VIDEO_ROOT = path.resolve(DIR_ROOT, "video");
export const DIR_AUDIO_CACHE = path.resolve(DIR_DOWNLOADS, "audio_cache");
export const DIR_AVATAR = path.resolve(DIR_DOWNLOADS, "avatar");
export const DIR_STAFF = path.resolve(DIR_DOWNLOADS, "STAFF");
export const DIR_FULL_VIDEO = path.resolve(DIR_DOWNLOADS, "full_videos");
export const DIR_CLIP_DB = path.resolve(DIR_DATA, "clips_db.json");

// ========== 关键修复：添加 USE_GPU 命名导出 ==========
// 根据你的实际硬件环境修改值：
// - NVIDIA显卡："NVIDIA"
// - Intel核显："INTEL"
// - 不使用GPU：""
export const USE_GPU = "";

export const STAFF_LIST = [
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