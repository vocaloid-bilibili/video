// packages/controller/src/utils/download.ts

import axios from "axios";
import crypto from "crypto";
import fs from "fs-extra";
import path from "path";

import {
  DIR_DOWNLOADS,
  DIR_FULL_VIDEO,
  DIR_IMAGES,
  ENCODE_OPTS,
  HWACCEL,
  PORT,
  VIDEO_CODEC,
} from "../config.js";
import { log } from "../state.js";
import { execPromise, getDuration } from "./ffmpeg.js";
import {
  buildImageHeaders,
  buildYtDlpCommand,
  getBilibiliVideoUrl,
  isValidBvid,
} from "./bilibili.js";
import {
  acquireDownloadLock,
  releaseDownloadLock,
  sleep,
} from "./downloadLocks.js";

interface DownloadedVideoFile {
  path: string;
  duration: number;
}

const MAX_RETRIES = 3;
const IMAGE_DOWNLOAD_TIMEOUT = 15_000;

function safeRemove(filePath: string): void {
  if (!fs.existsSync(filePath)) return;

  try {
    fs.unlinkSync(filePath);
  } catch {
    // ignore
  }
}

async function getValidMediaDuration(
  filePath: string,
  minDuration: number,
): Promise<number | null> {
  if (!fs.existsSync(filePath)) return null;

  try {
    const duration = await getDuration(filePath);

    if (duration >= minDuration) {
      return duration;
    }

    safeRemove(filePath);
    return null;
  } catch {
    safeRemove(filePath);
    return null;
  }
}

function getImageExtension(url: string): string {
  const extMatch = url.match(/\.(jpg|jpeg|png|webp|gif)(\?|@|$)/i);
  return `.${extMatch?.[1]?.toLowerCase() ?? "jpg"}`;
}

export async function downloadImage(url: string): Promise<string> {
  if (!url) {
    log("图片下载跳过：URL为空");
    return "";
  }

  const targetUrl = url.trim().replace(/^\/\//, "https://");

  try {
    new URL(targetUrl);
  } catch {
    log(`图片下载跳过：URL格式非法 [${targetUrl}]`);
    return url;
  }

  fs.ensureDirSync(DIR_IMAGES);

  const hash = crypto.createHash("md5").update(targetUrl).digest("hex");
  const ext = getImageExtension(targetUrl);
  const filename = `${hash}${ext}`;
  const localPath = path.join(DIR_IMAGES, filename);
  const publicUrl = `http://localhost:${PORT}/downloads/images/${filename}`;

  if (fs.existsSync(localPath) && fs.statSync(localPath).size > 100) {
    return publicUrl;
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios({
        url: targetUrl,
        method: "GET",
        responseType: "stream",
        timeout: 10_000,
        headers: buildImageHeaders(),
        validateStatus: (status) => status >= 200 && status < 300,
        maxRedirects: 5,
      });

      const contentLength = Number(response.headers["content-length"] || 0);

      if (contentLength > 0 && contentLength < 100) {
        throw new Error(`响应内容过小: ${contentLength}字节，疑似拦截`);
      }

      await Promise.race([
        new Promise<void>((resolve, reject) => {
          const writeStream = fs.createWriteStream(localPath);

          response.data.on("error", (error: Error) => {
            writeStream.destroy();
            reject(new Error(`响应流错误: ${error.message}`));
          });

          writeStream.on("error", (error) => {
            response.data.destroy();
            reject(new Error(`写入流错误: ${error.message}`));
          });

          writeStream.on("finish", () => resolve());
          response.data.pipe(writeStream);
        }),
        new Promise((_resolve, reject) => {
          setTimeout(
            () => reject(new Error("下载超时")),
            IMAGE_DOWNLOAD_TIMEOUT,
          );
        }),
      ]);

      if (fs.existsSync(localPath) && fs.statSync(localPath).size > 100) {
        return publicUrl;
      }

      safeRemove(localPath);
      throw new Error("下载文件无效，大小不足100字节");
    } catch (error) {
      const err = error as any;
      const message = error instanceof Error ? error.message : String(error);
      const status = err.response?.status;

      log(
        `图片下载失败(第${attempt}/${MAX_RETRIES}次) [${targetUrl}]: 状态码=${
          status || "无"
        }, 原因=${message}`,
      );

      safeRemove(localPath);

      if (attempt < MAX_RETRIES) {
        await sleep(1000 * attempt);
      }
    }
  }

  log(`图片下载彻底失败，回退原链接: ${url}`);
  return url;
}

export async function downloadFullVideoFile(
  bvid: string,
): Promise<DownloadedVideoFile | null> {
  if (!isValidBvid(bvid)) {
    log(`完整视频下载跳过：BVID无效 ${bvid}`);
    return null;
  }

  fs.ensureDirSync(DIR_FULL_VIDEO);

  const outputPath = path.join(DIR_FULL_VIDEO, `${bvid}.mp4`);
  const existingDuration = await getValidMediaDuration(outputPath, 10);

  if (existingDuration !== null) {
    return {
      path: outputPath,
      duration: existingDuration,
    };
  }

  const lockKey = `full-video:${bvid}`;
  const gotLock = await acquireDownloadLock(lockKey);

  if (!gotLock) {
    const durationAfterWait = await getValidMediaDuration(outputPath, 10);

    if (durationAfterWait !== null) {
      return {
        path: outputPath,
        duration: durationAfterWait,
      };
    }

    return null;
  }

  try {
    const url = getBilibiliVideoUrl(bvid);
    const formatArgs =
      `--format "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best" ` +
      `--merge-output-format mp4`;

    const command = buildYtDlpCommand(url, outputPath, formatArgs);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        log(`下载完整视频: ${bvid} (尝试 ${attempt}/${MAX_RETRIES})`);
        await execPromise(command);

        const duration = await getValidMediaDuration(outputPath, 10);

        if (duration !== null) {
          log(`完整视频下载完成: ${bvid} (${duration.toFixed(1)}s)`);

          return {
            path: outputPath,
            duration,
          };
        }

        log(`完整视频下载未产出有效文件: ${bvid}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log(`完整视频下载失败 ${bvid} (${attempt}/${MAX_RETRIES}): ${message}`);
      }

      if (attempt < MAX_RETRIES) {
        await sleep(5000 * attempt);
      }
    }

    log(`完整视频下载彻底失败: ${bvid}`);
    return null;
  } finally {
    releaseDownloadLock(lockKey);
  }
}

async function clipFromFullVideo(
  fullVideoPath: string,
  startTime: number,
  duration: number,
  outputPath: string,
): Promise<boolean> {
  const command =
    `ffmpeg ${HWACCEL} ` +
    `-ss ${startTime} ` +
    `-i "${fullVideoPath}" ` +
    `-t ${duration} ` +
    `-c:v ${VIDEO_CODEC} ${ENCODE_OPTS} ` +
    `-r 60 -g 60 -bf 0 -pix_fmt yuv420p -movflags +faststart ` +
    `-c:a aac -ar 48000 -b:a 192k ` +
    `-y "${outputPath}"`;

  try {
    await execPromise(command);
    return true;
  } catch {
    const cpuCommand =
      `ffmpeg ` +
      `-ss ${startTime} ` +
      `-i "${fullVideoPath}" ` +
      `-t ${duration} ` +
      `-c:v libx264 -preset fast -crf 23 ` +
      `-r 60 -g 60 -bf 0 -pix_fmt yuv420p -movflags +faststart ` +
      `-c:a aac -ar 48000 -b:a 192k ` +
      `-y "${outputPath}"`;

    await execPromise(cpuCommand);
    return true;
  }
}

export async function downloadClip(
  bvid: string,
  startTime: number,
  duration: number,
  retries = MAX_RETRIES,
): Promise<string | null> {
  if (!isValidBvid(bvid)) {
    log(`裁剪跳过：BVID无效 ${bvid}`);
    return null;
  }

  fs.ensureDirSync(DIR_DOWNLOADS);

  const fileName = `${bvid}_${startTime.toFixed(2)}_${duration}.mp4`;
  const outputPath = path.join(DIR_DOWNLOADS, fileName);

  const existingDuration = await getValidMediaDuration(
    outputPath,
    duration - 1,
  );

  if (existingDuration !== null) {
    return outputPath;
  }

  const lockKey = `clip:${fileName}`;
  const gotLock = await acquireDownloadLock(lockKey);

  if (!gotLock) {
    const durationAfterWait = await getValidMediaDuration(
      outputPath,
      duration - 1,
    );

    return durationAfterWait !== null ? outputPath : null;
  }

  try {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        if (attempt > 1) {
          await sleep(2000 * attempt);
        }

        const fullVideo = await downloadFullVideoFile(bvid);

        if (!fullVideo) {
          throw new Error("完整视频下载失败");
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

        const actualDuration = await getValidMediaDuration(
          outputPath,
          Math.max(1, clipDuration - 2),
        );

        if (actualDuration !== null) {
          return outputPath;
        }

        log(`裁剪产物无效: ${bvid}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log(`裁剪失败 ${bvid} (${attempt}/${retries}): ${message}`);
        safeRemove(outputPath);
      }
    }

    log(`裁剪彻底失败: ${bvid}`);
    return null;
  } finally {
    releaseDownloadLock(lockKey);
  }
}

export async function downloadAudio(
  bvid: string,
  name: string,
): Promise<string | null> {
  if (!isValidBvid(bvid)) {
    log(`音频下载跳过：BVID无效 ${bvid}`);
    return null;
  }

  fs.ensureDirSync(DIR_DOWNLOADS);

  const outputPath = path.join(DIR_DOWNLOADS, name);

  if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
    return outputPath;
  }

  const lockKey = `audio:${name}`;
  const gotLock = await acquireDownloadLock(lockKey);

  if (!gotLock) {
    return fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000
      ? outputPath
      : null;
  }

  try {
    const url = getBilibiliVideoUrl(bvid);
    const outputBase = outputPath.replace(/\.mp3$/i, "");
    const command = buildYtDlpCommand(url, outputBase, "-x --audio-format mp3");

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        log(`下载音频: ${bvid} (尝试 ${attempt}/${MAX_RETRIES})`);

        await execPromise(command);

        if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
          return outputPath;
        }

        log(`音频下载后未找到有效文件: ${bvid}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log(`音频下载失败 ${bvid} (${attempt}/${MAX_RETRIES}): ${message}`);
      }

      if (attempt < MAX_RETRIES) {
        await sleep(3000 * attempt);
      }
    }

    log(`音频下载彻底失败: ${bvid}`);
    return null;
  } finally {
    releaseDownloadLock(lockKey);
  }
}
