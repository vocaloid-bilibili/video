// utils/fullVideo.js (ES模块最终版本)
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

import { execPromise, getDuration } from "./ffmpeg.js";
import { DIR_FULL_VIDEO, PORT, COOKIES_PATH } from "../config.js";
import { log } from "../state.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

fs.ensureDirSync(DIR_FULL_VIDEO);

// 下载锁
const downloadLocks = new Map<string, Promise<void>>();

// 重试配置
const MAX_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 构建 yt-dlp 命令，存在 cookies 时自动带上 --cookies
function buildYtDlpCmd(url: string, outputPath: string): string {
  let cmd = `yt-dlp "${url}" -o "${outputPath}" --playlist-items 1 --format "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best" --merge-output-format mp4 --force-overwrites --no-warnings`;

  if (fs.existsSync(COOKIES_PATH)) {
    cmd += ` --cookies "${COOKIES_PATH}"`;
  }

  return cmd;
}

// ========== 核心函数：命名导出（适配api.js导入） ==========
export async function downloadFullVideo(bvid: string) {
  const outputPath = path.join(DIR_FULL_VIDEO, `${bvid}.mp4`);
  const publicUrl = `http://localhost:${PORT}/downloads/full_videos/${bvid}.mp4`;

  // 已存在且有效
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

  // 下载锁：已有任务在跑就等它
  if (downloadLocks.has(bvid)) {
    log(`等待完整视频下载: ${bvid}`);
    await downloadLocks.get(bvid);
    if (fs.existsSync(outputPath)) {
      const dur = await getDuration(outputPath);
      return { path: outputPath, url: publicUrl, duration: dur };
    }
  }

  let lockResolve: (() => void) | undefined;
  const lockPromise = new Promise<void>((resolve) => {
    lockResolve = resolve;
  });
  downloadLocks.set(bvid, lockPromise);

  try {
    const url = `https://www.bilibili.com/video/${bvid}`;
    const cmd = buildYtDlpCmd(url, outputPath);
    const useCookies = fs.existsSync(COOKIES_PATH);

    // 重试循环：指数退避
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        log(
          `下载完整视频: ${bvid} (尝试 ${attempt + 1}/${MAX_RETRIES})` +
            (useCookies ? " [cookies]" : ""),
        );

        await execPromise(cmd);

        if (fs.existsSync(outputPath)) {
          const dur = await getDuration(outputPath);
          log(`完整视频下载完成: ${bvid} (${dur.toFixed(1)}s)`);
          return { path: outputPath, url: publicUrl, duration: dur };
        }

        // 命令成功但没产出文件，视为失败继续重试
        log(
          `完整视频下载未产出文件: ${bvid} (尝试 ${attempt + 1}/${MAX_RETRIES})`,
        );
      } catch (e: any) {
        log(
          `完整视频下载失败 ${bvid} (尝试 ${attempt + 1}/${MAX_RETRIES}): ${e.message}`,
        );
      }

      // 不是最后一次就退避后重试：5s, 10s, 15s...
      if (attempt < MAX_RETRIES - 1) {
        const delay = 5000 * (attempt + 1);
        log(`${delay / 1000}s 后重试: ${bvid}`);
        await sleep(delay);
      }
    }

    log(`完整视频下载彻底失败: ${bvid} (已重试 ${MAX_RETRIES} 次)`);
    return null;
  } finally {
    downloadLocks.delete(bvid);
    lockResolve?.();
  }
}

export function getFullVideoInfo(bvid: string) {
  const outputPath = path.join(DIR_FULL_VIDEO, `${bvid}.mp4`);
  const publicUrl = `http://localhost:${PORT}/downloads/full_videos/${bvid}.mp4`;

  if (fs.existsSync(outputPath)) {
    return { path: outputPath, url: publicUrl, exists: true };
  }
  return { exists: false };
}
