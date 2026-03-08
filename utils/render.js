// utils/render.js (ES模块最终版本)
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// 修复1：ES模块导入依赖，补全.js后缀
import { execPromise, addAudioFade } from './ffmpeg.js';
import { CHROME_EXECUTABLE, PORT } from '../config.js';
import { log } from '../state.js';
import { getCopyrightLabel } from './helpers.js';

// 修复2：手动定义__dirname（ES模块特有）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 保留原有业务常量
const FPS = 60;
const CONCURRENCY = 4;

// ========== 核心渲染函数：命名导出（适配task.js导入） ==========
export async function renderComposition(
  comp,
  props,
  name,
  dir,
  durationSec = null,
  fadeDuration = 2,
) {
  const finalPath = path.join(dir, name);
  if (fs.existsSync(finalPath)) return finalPath;

  const temp = path.join(dir, `temp_props_${comp}_${Date.now()}.json`);
  fs.writeJsonSync(temp, props);

  try {
    log(`渲染 ${comp} -> ${name}${durationSec ? ` (${durationSec}s)` : ""}`);

    let cmd = `npx remotion render ${comp} "${finalPath}" --props="${temp}" --browser-executable="${CHROME_EXECUTABLE}" --gl=vulkan --concurrency=${CONCURRENCY} --quiet`;

    if (durationSec) {
      const frames = Math.round(durationSec * FPS);
      cmd += ` --frames=0-${frames - 1}`;
    }

    await execPromise(cmd);

    if (fadeDuration > 0 && fs.existsSync(finalPath)) {
      const tempFaded = finalPath.replace(".mp4", "_faded.mp4");
      log(`添加淡入淡出: ${name}`);
      await addAudioFade(finalPath, tempFaded, fadeDuration);
      // 替换原文件
      fs.removeSync(finalPath);
      fs.renameSync(tempFaded, finalPath);
    }

    return finalPath;
  } catch (e) {
    log(`渲染失败 ${comp}: ${e.message}`);
    return null;
  } finally {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
}

// 渲染组件（不带淡入淡出）- 命名导出
export async function renderCompositionRaw(
  comp,
  props,
  name,
  dir,
  durationSec = null,
) {
  return renderComposition(comp, props, name, dir, durationSec, 0);
}

// 渲染榜单片段 - 命名导出
export async function renderRankSegment(
  data,
  videoPath,
  thumb,
  type,
  dir,
  durationSec = 20,
  config = {},
) {
  const baseName = `rank_${type}_${data.rank.toString().padStart(3, "0")}.mp4`;
  const finalPath = path.join(dir, baseName);

  if (fs.existsSync(finalPath)) return finalPath;

  const videoUrl = `http://localhost:${PORT}/downloads/${path.basename(videoPath)}`;

  const extraFields = {
    point_before: data.point_before || 0,
    point_rate: data.rate,
    copyrightLabel: getCopyrightLabel(data.copyright),
    vocalists: data.vocal,
    producers: data.author,
    synthesizers: data.synthesizer,
    songType: data.type,
    thumb,
    videoSource: videoUrl,
    view_rate: data.viewR,
    favorite_rate: data.favoriteR,
    danmaku_rate: data.danmakuR,
    coin_rate: data.coinR,
    like_rate: data.likeR,
    reply_rate: data.replyR,
    share_rate: data.shareR,
    showCount: config.showCount !== false,
    trendCount: config.trendCount || 7,
    seperate_ranks:
      data[config.trendKey || "daily_trends"] || data.daily_trends,
  }; // 修复原代码遗漏的分号

  const props = {
    ...data, ...extraFields
  }; // 修复原代码遗漏的分号

  const temp = path.join(dir, `temp_props_rank_${type}_${data.rank}.json`);
  fs.writeJsonSync(temp, props);

  try {
    const typeName = type === "new" ? "新曲榜" : "主榜";
    log(`渲染 ${typeName} #${data.rank} (${durationSec}s)`);
    const compName = type === "new" ? "NewSongCard" : "RankCard";
    const frames = Math.round(durationSec * FPS);

    await execPromise(
      `npx remotion render ${compName} "${finalPath}" --props="${temp}" --browser-executable="${CHROME_EXECUTABLE}" --gl=vulkan --concurrency=${CONCURRENCY} --frames=0-${frames - 1} --quiet`,
    );

    // 添加淡入淡出
    if (config.audioFade !== false && fs.existsSync(finalPath)) {
      const tempFaded = finalPath.replace(".mp4", "_faded.mp4");
      log(`添加淡入淡出: ${typeName} #${data.rank}`);
      await addAudioFade(finalPath, tempFaded, config.fadeDuration || 2);
      fs.removeSync(finalPath);
      fs.renameSync(tempFaded, finalPath);
    }

    return finalPath;
  } catch (e) {
    log(`渲染失败 ${type} #${data.rank}: ${e.message}`);
    return null;
  } finally {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
}

// 渲染静态帧/封面 - 命名导出
export async function renderStill(
  compositionId,
  props,
  outputName,
  outDir,
  frameNumber = 0,
) {
  const outPath = path.join(outDir, outputName);
  if (fs.existsSync(outPath)) return outPath;

  const temp = path.join(outDir, `temp_props_still_${Date.now()}.json`);
  fs.writeJsonSync(temp, props);

  try {
    const cmd = `npx remotion still ${compositionId} "${outPath}" --props="${temp}" --browser-executable="${CHROME_EXECUTABLE}" --frame=${frameNumber}`;
    log(`渲染封面: ${outputName} (frame ${frameNumber})`);
    await execPromise(cmd);
    return outPath;
  } catch (e) {
    log(`封面渲染失败: ${e.message}`);
    return null;
  } finally {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
}