// utils/clips.js (ES模块最终版本)
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import path from 'path';

// 修复1：ES模块导入config，补全.js后缀
import { DIR_CLIP_DB } from '../config.js';

// 修复2：手动定义__dirname（ES模块特有，备用）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 裁切设置缓存（保留原有逻辑）
let clipsCache = null;

// 加载裁切配置数据库
function loadClipsDB() {
  if (clipsCache) return clipsCache;
  if (fs.existsSync(DIR_CLIP_DB)) {
    clipsCache = fs.readJsonSync(DIR_CLIP_DB);
  } else {
    clipsCache = {};
  }
  return clipsCache;
}

// 保存裁切配置数据库
function saveClipsDB() {
  if (clipsCache) {
    fs.writeJsonSync(DIR_CLIP_DB, clipsCache, { spaces: 2 });
  }
}

// ========== 核心函数：命名导出（适配api.js导入） ==========
export function getClipSetting(bvid) {
  const db = loadClipsDB();
  return db[bvid] || null;
}

export function setClipSetting(bvid, startTime, endTime = null) {
  const db = loadClipsDB();

  let duration;
  if (endTime !== null) {
    duration = endTime - startTime;
    // 限制 15-35 秒
    if (duration < 15) {
      endTime = startTime + 15;
      duration = 15;
    } else if (duration > 35) {
      endTime = startTime + 35;
      duration = 35;
    }
  } else {
    duration = 20;
    endTime = startTime + 20;
  }

  db[bvid] = {
    startTime: Math.round(startTime * 100) / 100,
    endTime: Math.round(endTime * 100) / 100,
    duration: Math.round(duration * 100) / 100,
    updatedAt: new Date().toISOString(),
  };

  clipsCache = db;
  saveClipsDB();
  return db[bvid];
}

// 关键：命名导出deleteClipSetting（解决导入错误）
export function deleteClipSetting(bvid) {
  const db = loadClipsDB();
  if (db[bvid]) {
    delete db[bvid];
    clipsCache = db;
    saveClipsDB();
    return true;
  }
  return false;
}

export function getAllClipSettings() {
  return loadClipsDB();
}