// utils/fullVideo.js (ES模块最终版本)
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// 修复1：ES模块导入依赖，补全.js后缀
import { execPromise, getDuration } from './ffmpeg.js';
import { DIR_FULL_VIDEO, PORT } from '../config.js';
import { log } from '../state.js';

// 修复2：手动定义__dirname（ES模块特有）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 确保完整视频目录存在（保留原有逻辑）
fs.ensureDirSync(DIR_FULL_VIDEO);

// 下载锁（保留原有逻辑）
const downloadLocks = new Map();

// ========== 核心函数：命名导出（适配api.js导入） ==========
export async function downloadFullVideo(bvid) {
  const outputPath = path.join(DIR_FULL_VIDEO, `${bvid}.mp4`);
  const publicUrl = `http://localhost:${PORT}/downloads/full_videos/${bvid}.mp4`;

  // 已存在
  if (fs.existsSync(outputPath)) {
    try {
      const dur = await getDuration(outputPath);
      if (dur > 10) {
        return { path: outputPath, url: publicUrl, duration: dur };
      }
    } catch (e) {
      fs.unlinkSync(outputPath);
    }
  }

  // 下载锁
  if (downloadLocks.has(bvid)) {
    log(`等待完整视频下载: ${bvid}`);
    await downloadLocks.get(bvid);
    if (fs.existsSync(outputPath)) {
      const dur = await getDuration(outputPath);
      return { path: outputPath, url: publicUrl, duration: dur };
    }
  }

  let resolve;
  const lockPromise = new Promise((r) => (resolve = r));
  downloadLocks.set(bvid, lockPromise);

  try {
    log(`下载完整视频: ${bvid}`);
    const url = `https://www.bilibili.com/video/${bvid}`;

    const cmd = `yt-dlp "${url}" -o "${outputPath}" --playlist-items 1 --format "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best" --merge-output-format mp4 --force-overwrites --no-warnings`;

    await execPromise(cmd);

    if (fs.existsSync(outputPath)) {
      const dur = await getDuration(outputPath);
      log(`完整视频下载完成: ${bvid} (${dur.toFixed(1)}s)`);
      return { path: outputPath, url: publicUrl, duration: dur };
    }
    return null;
  } catch (e) {
    log(`完整视频下载失败 ${bvid}: ${e.message}`);
    return null;
  } finally {
    downloadLocks.delete(bvid);
    resolve();
  }
}

export function getFullVideoInfo(bvid) {
  const outputPath = path.join(DIR_FULL_VIDEO, `${bvid}.mp4`);
  const publicUrl = `http://localhost:${PORT}/downloads/full_videos/${bvid}.mp4`;

  if (fs.existsSync(outputPath)) {
    return { path: outputPath, url: publicUrl, exists: true };
  }
  return { exists: false };
}