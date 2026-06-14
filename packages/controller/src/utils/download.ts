import axios from "axios";
import fs from "fs-extra";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

import { execPromise, getDuration } from "./ffmpeg.js";
import {
  DIR_DOWNLOADS,
  DIR_IMAGES,
  DIR_FULL_VIDEO,
  PORT,
  HWACCEL,
  VIDEO_CODEC,
  ENCODE_OPTS,
  COOKIES_PATH,
} from "../config.js";
import { log } from "../state.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========== 统一请求配置 ==========
// 固定UA + Referer，统一应对B站412/防盗链
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
const BILIBILI_REFERER = "https://www.bilibili.com/";

// ========== Cookie 统一管理 ==========
// yt-dlp 直接吃 cookies.txt 文件；axios（图片）需要 Cookie 头字符串。
// 这里把 Netscape 格式的 cookies.txt 解析成 "k=v; k2=v2"，带缓存避免重复读盘。
let cachedCookieHeader: string | null = null;
let cachedCookieMtime = 0;

function getCookieHeader(): string {
  if (!fs.existsSync(COOKIES_PATH)) return "";

  try {
    const stat = fs.statSync(COOKIES_PATH);
    // 文件没变就用缓存
    if (cachedCookieHeader !== null && stat.mtimeMs === cachedCookieMtime) {
      return cachedCookieHeader;
    }

    const content = fs.readFileSync(COOKIES_PATH, "utf-8");
    const pairs: string[] = [];

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      // 跳过空行和注释（#HttpOnly_ 前缀的行要保留，单独处理）
      if (!trimmed) continue;
      const real = trimmed.startsWith("#HttpOnly_")
        ? trimmed.slice("#HttpOnly_".length)
        : trimmed;
      if (real.startsWith("#")) continue;

      // Netscape 格式：domain flag path secure expiry name value
      const cols = real.split("\t");
      if (cols.length >= 7) {
        const name = cols[5];
        const value = cols[6];
        if (name) pairs.push(`${name}=${value}`);
      }
    }

    cachedCookieHeader = pairs.join("; ");
    cachedCookieMtime = stat.mtimeMs;
    return cachedCookieHeader;
  } catch (e) {
    log(`读取 cookies 失败: ${(e as Error).message}`);
    return "";
  }
}

// 统一的 axios 请求头（图片等直链下载用），存在 cookie 自动带上
function buildHttpHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Referer: BILIBILI_REFERER,
    "User-Agent": USER_AGENT,
  };
  const cookie = getCookieHeader();
  if (cookie) headers.Cookie = cookie;
  return headers;
}

// ========== 锁管理 ==========
const downloadLocks = new Map();
const LOCK_TIMEOUT = 60 * 1000;

function isValidBvid(bvid: string) {
  if (!bvid || typeof bvid !== "string") return false;
  return /^BV[a-zA-Z0-9]{10}$/.test(bvid);
}

async function acquireLock(lockKey: string, timeout = LOCK_TIMEOUT) {
  if (downloadLocks.has(lockKey)) {
    const lock = downloadLocks.get(lockKey);
    if (Date.now() - lock.startTime > timeout) {
      if (lock.resolve) lock.resolve();
      downloadLocks.delete(lockKey);
    } else {
      try {
        await Promise.race([
          lock.promise,
          new Promise((_, rej) =>
            setTimeout(() => rej(new Error("timeout")), timeout),
          ),
        ]);
      } catch (e) {
        downloadLocks.delete(lockKey);
      }
      return false;
    }
  }

  let resolve;
  const promise = new Promise((r) => (resolve = r));
  downloadLocks.set(lockKey, { promise, resolve, startTime: Date.now() });
  return true;
}

function releaseLock(lockKey: string) {
  const lock = downloadLocks.get(lockKey);
  if (lock && lock.resolve) lock.resolve();
  downloadLocks.delete(lockKey);
}

/**
 * 通用 yt-dlp 命令构建器：统一 Cookie、UA、Referer、超时
 * @param url 视频链接
 * @param outputPath 输出路径（音频转码场景请传不带扩展名的模板）
 * @param extraArgs 额外 yt-dlp 参数
 */
function buildYtDlpCmd(
  url: string,
  outputPath: string,
  extraArgs = "",
): string {
  let baseCmd =
    `yt-dlp "${url}" -o "${outputPath}" --playlist-items 1 --force-overwrites --no-warnings ` +
    `--user-agent "${USER_AGENT}" --referer "${BILIBILI_REFERER}" --socket-timeout 15 ${extraArgs}`;

  if (fs.existsSync(COOKIES_PATH)) {
    baseCmd += ` --cookies "${COOKIES_PATH}"`;
  }
  return baseCmd;
}

// ========== 图片专用请求头（无Cookie） ==========
function buildImageHeaders(): Record<string, string> {
  return {
    Referer: BILIBILI_REFERER,
    "User-Agent": USER_AGENT,
    Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
  };
}

// ========== 图片 / 封面下载 ==========
export async function downloadImage(url: string): Promise<string> {
  if (!url) {
    log("图片下载跳过：URL为空");
    return "";
  }

  // 防御性清洗：去除首尾空白，兼容数据里的不可见字符
  const targetUrl = url.trim().replace(/^\/\//, "https://");

  // URL合法性预校验
  try {
    new URL(targetUrl);
  } catch (e) {
    log(`图片下载跳过：URL格式非法 [${targetUrl}]`);
    return url;
  }

  const hash = crypto.createHash("md5").update(targetUrl).digest("hex");
  const extMatch = targetUrl.match(/\.(jpg|jpeg|png|webp|gif)(\?|@|$)/i);
  const ext = `.${extMatch?.[1]?.toLowerCase() ?? "jpg"}`;
  const filename = `${hash}${ext}`;
  const localPath = path.join(DIR_IMAGES, filename);
  const publicUrl = `http://localhost:${PORT}/downloads/images/${filename}`;

  fs.ensureDirSync(DIR_IMAGES);

  if (fs.existsSync(localPath) && fs.statSync(localPath).size > 100) {
    return publicUrl;
  }

  const maxRetries = 3;
  const DOWNLOAD_TIMEOUT = 15000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await axios({
        url: targetUrl,
        method: "GET",
        responseType: "stream",
        timeout: 10000,
        // 核心：使用图片专用头，不带Cookie
        headers: buildImageHeaders(),
        validateStatus: (status) => status >= 200 && status < 300,
        maxRedirects: 5,
      });

      const contentLength = Number(res.headers["content-length"] || 0);
      if (contentLength > 0 && contentLength < 100) {
        throw new Error(`响应内容过小: ${contentLength}字节，疑似拦截`);
      }

      await Promise.race([
        new Promise<void>((resolve, reject) => {
          const writeStream = fs.createWriteStream(localPath);
          res.data.on("error", (err: Error) => {
            writeStream.destroy();
            reject(new Error(`响应流错误: ${err.message}`));
          });
          writeStream.on("error", (err) => {
            res.data.destroy();
            reject(new Error(`写入流错误: ${err.message}`));
          });
          writeStream.on("finish", () => resolve());
          res.data.pipe(writeStream);
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("下载超时")), DOWNLOAD_TIMEOUT)
        ),
      ]);

      if (fs.existsSync(localPath) && fs.statSync(localPath).size > 100) {
        return publicUrl;
      }

      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      throw new Error("下载文件无效，大小不足100字节");

    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      const status = (e as any).response?.status;
      log(`图片下载失败(第${attempt}/${maxRetries}次) [${targetUrl}]: 状态码=${status || "无"}, 原因=${errMsg}`);

      if (fs.existsSync(localPath)) {
        try { fs.unlinkSync(localPath); } catch {}
      }

      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }

  log(`图片下载彻底失败，回退原链接: ${url}`);
  return url;
}

// ========== 完整视频下载（内部） ==========
async function downloadFullVideoInternal(bvid: string) {
  if (!isValidBvid(bvid)) return null;

  fs.ensureDirSync(DIR_FULL_VIDEO);
  const outputPath = path.join(DIR_FULL_VIDEO, `${bvid}.mp4`);

  if (fs.existsSync(outputPath)) {
    try {
      const dur = await getDuration(outputPath);
      if (dur > 10) {
        return { path: outputPath, duration: dur };
      }
    } catch (e) {
      fs.unlinkSync(outputPath);
    }
  }

  const lockKey = `full_${bvid}`;
  const gotLock = await acquireLock(lockKey);

  if (!gotLock) {
    if (fs.existsSync(outputPath)) {
      try {
        const dur = await getDuration(outputPath);
        return { path: outputPath, duration: dur };
      } catch (e) {}
    }
    return null;
  }

  try {
    const url = `https://www.bilibili.com/video/${bvid}`;
    const formatArgs = `--format "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best" --merge-output-format mp4`;
    const cmd = buildYtDlpCmd(url, outputPath, formatArgs);
    const useCookies = fs.existsSync(COOKIES_PATH);

    // 内层重试：3 次指数退避
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        log(
          `下载视频: ${bvid} (尝试 ${attempt}/${maxRetries})` +
            (useCookies ? " [cookies]" : ""),
        );
        await execPromise(cmd);

        if (fs.existsSync(outputPath)) {
          const dur = await getDuration(outputPath);
          if (dur > 10) {
            return { path: outputPath, duration: dur };
          }
          fs.unlinkSync(outputPath);
        }
      } catch (e: any) {
        log(`视频下载失败 ${bvid} (${attempt}/${maxRetries}): ${e.message}`);
      }

      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 5000 * attempt));
      }
    }

    log(`视频下载彻底失败: ${bvid}`);
    return null;
  } finally {
    releaseLock(lockKey);
  }
}

// ========== 裁剪片段 ==========
async function clipFromFullVideo(
  fullVideoPath: string,
  startTime: number,
  duration: number,
  outputPath: string,
) {
  const cmd = `ffmpeg ${HWACCEL} -ss ${startTime} -i "${fullVideoPath}" -t ${duration} -c:v ${VIDEO_CODEC} ${ENCODE_OPTS} -r 60 -g 60 -bf 0 -pix_fmt yuv420p -movflags +faststart -c:a aac -ar 48000 -b:a 192k -y "${outputPath}"`;

  try {
    await execPromise(cmd);
    return true;
  } catch (e) {
    // GPU 失败回退 CPU
    const cpuCmd = `ffmpeg -ss ${startTime} -i "${fullVideoPath}" -t ${duration} -c:v libx264 -preset fast -crf 23 -r 60 -g 60 -bf 0 -pix_fmt yuv420p -movflags +faststart -c:a aac -ar 48000 -b:a 192k -y "${outputPath}"`;
    await execPromise(cpuCmd);
    return true;
  }
}

export async function downloadClip(
  bvid: string,
  startTime: number,
  duration: number,
  retries = 3,
) {
  if (!isValidBvid(bvid)) return null;

  const fileName = `${bvid}_${startTime.toFixed(2)}_${duration}.mp4`;
  const outputPath = path.join(DIR_DOWNLOADS, fileName);

  if (fs.existsSync(outputPath)) {
    try {
      const actualDuration = await getDuration(outputPath);
      if (actualDuration >= duration - 1) {
        return outputPath;
      }
      fs.unlinkSync(outputPath);
    } catch (e) {
      fs.unlinkSync(outputPath);
    }
  }

  const lockKey = `clip_${fileName}`;
  const gotLock = await acquireLock(lockKey);

  if (!gotLock) {
    if (fs.existsSync(outputPath)) return outputPath;
    return null; // 没拿到锁且无文件，直接退出，避免误删他人锁
  }

  try {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        if (attempt > 1) {
          await new Promise((r) => setTimeout(r, 2000 * attempt));
        }

        const fullVideo = await downloadFullVideoInternal(bvid);
        if (!fullVideo) {
          throw new Error("视频下载失败");
        }

        let clipDuration = duration;
        if (startTime + duration > fullVideo.duration + 1) {
          clipDuration = Math.max(5, fullVideo.duration - startTime);
        }

        await clipFromFullVideo(
          fullVideo.path,
          startTime,
          clipDuration,
          outputPath,
        );

        if (fs.existsSync(outputPath)) {
          const actualDuration = await getDuration(outputPath);
          if (actualDuration >= clipDuration - 2) {
            return outputPath;
          }
          fs.unlinkSync(outputPath);
        }
      } catch (e) {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      }
    }

    log(`裁剪失败: ${bvid}`);
    return null;
  } finally {
    releaseLock(lockKey);
  }
}

// ========== 音频下载 ==========
export async function downloadAudio(bvid: string, name: string) {
  if (!isValidBvid(bvid)) return null;

  // name 期望以 .mp3 结尾
  const output = path.join(DIR_DOWNLOADS, name);
  if (fs.existsSync(output) && fs.statSync(output).size > 1000) return output;

  const lockKey = `audio_${name}`;
  const gotLock = await acquireLock(lockKey);

  if (!gotLock) {
    if (fs.existsSync(output) && fs.statSync(output).size > 1000) return output;
    return null;
  }

  try {
    const url = `https://www.bilibili.com/video/${bvid}`;
    // 关键：-o 传不带扩展名的模板，让 yt-dlp 转码后自己补 .mp3，避免文件名错位
    const base = output.replace(/\.mp3$/i, "");
    const audioArgs = `-x --audio-format mp3`;
    const cmd = buildYtDlpCmd(url, base, audioArgs);
    const useCookies = fs.existsSync(COOKIES_PATH);

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        log(
          `下载音频: ${bvid} (尝试 ${attempt}/${maxRetries})` +
            (useCookies ? " [cookies]" : ""),
        );
        await execPromise(cmd);

        // 下载后确认文件确实存在且有效
        if (fs.existsSync(output) && fs.statSync(output).size > 1000) {
          return output;
        }
        log(`音频下载后未找到有效文件: ${bvid}`);
      } catch (e: any) {
        log(`音频下载失败 ${bvid} (${attempt}/${maxRetries}): ${e.message}`);
      }

      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 3000 * attempt));
      }
    }

    log(`音频下载彻底失败: ${bvid}`);
    return null;
  } finally {
    releaseLock(lockKey);
  }
}
