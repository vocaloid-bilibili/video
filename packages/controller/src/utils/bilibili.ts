// packages/controller/src/utils/bilibili.ts

import fs from "fs-extra";

import { COOKIES_PATH } from "../config.js";

export const BILIBILI_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

export const BILIBILI_REFERER = "https://www.bilibili.com/";

let cachedCookieHeader: string | null = null;
let cachedCookieMtime = 0;

export function isValidBvid(bvid: string): boolean {
  return typeof bvid === "string" && /^BV[a-zA-Z0-9]{10}$/.test(bvid);
}

export function getBilibiliVideoUrl(bvid: string): string {
  return `https://www.bilibili.com/video/${bvid}`;
}

export function getCookieHeader(): string {
  if (!fs.existsSync(COOKIES_PATH)) return "";

  try {
    const stat = fs.statSync(COOKIES_PATH);

    if (cachedCookieHeader !== null && stat.mtimeMs === cachedCookieMtime) {
      return cachedCookieHeader;
    }

    const content = fs.readFileSync(COOKIES_PATH, "utf-8");
    const pairs: string[] = [];

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const real = trimmed.startsWith("#HttpOnly_")
        ? trimmed.slice("#HttpOnly_".length)
        : trimmed;

      if (real.startsWith("#")) continue;

      const cols = real.split("\t");

      if (cols.length >= 7) {
        const name = cols[5];
        const value = cols[6];

        if (name) {
          pairs.push(`${name}=${value}`);
        }
      }
    }

    cachedCookieHeader = pairs.join("; ");
    cachedCookieMtime = stat.mtimeMs;

    return cachedCookieHeader;
  } catch {
    return "";
  }
}

export function buildImageHeaders(): Record<string, string> {
  return {
    Referer: BILIBILI_REFERER,
    "User-Agent": BILIBILI_USER_AGENT,
    Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
  };
}

export function buildBilibiliHeaders(
  withCookie = false,
): Record<string, string> {
  const headers: Record<string, string> = {
    Referer: BILIBILI_REFERER,
    "User-Agent": BILIBILI_USER_AGENT,
  };

  if (withCookie) {
    const cookie = getCookieHeader();

    if (cookie) {
      headers.Cookie = cookie;
    }
  }

  return headers;
}

export function buildYtDlpCommand(
  url: string,
  outputPath: string,
  extraArgs = "",
): string {
  let command =
    `yt-dlp "${url}" -o "${outputPath}" ` +
    `--playlist-items 1 ` +
    `--force-overwrites ` +
    `--no-warnings ` +
    `--user-agent "${BILIBILI_USER_AGENT}" ` +
    `--referer "${BILIBILI_REFERER}" ` +
    `--socket-timeout 15 ` +
    `${extraArgs}`;

  if (fs.existsSync(COOKIES_PATH)) {
    command += ` --cookies "${COOKIES_PATH}"`;
  }

  return command;
}
