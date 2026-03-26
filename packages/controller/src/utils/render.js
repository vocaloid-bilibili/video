import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

import { addAudioFade } from './ffmpeg.js';
import { CHROME_EXECUTABLE, MONOREPO_ROOT, PORT } from 'shared-config';
import { log } from '../state.js';
import { getCopyrightLabel } from './helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FPS = 60;
const CONCURRENCY = 4;

// ⭐ 核心执行器（完全替代 execPromise）
function runRemotion(args) {
  const safeArgs = args
    .filter((v) => v !== undefined && v !== null)
    .map((v) => String(v));

  const cwd = path.join(MONOREPO_ROOT, 'packages/remotion-engine');

  const remotionBin = path.resolve(
    cwd,
    'node_modules/.bin/remotion.cmd'
  );

  console.log('🚀 BIN:', remotionBin);
  console.log('🚀 ARGS:', safeArgs);

  return new Promise((resolve, reject) => {
    const child = spawn(
      'cmd.exe',
      [
        '/d',
        '/s',
        '/c',
        remotionBin,        // ❗ 不要加引号
        'render',
        ...safeArgs         // ❗ 不要 join 成字符串
      ],
      {
        cwd,
        stdio: 'inherit',
      }
    );

    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Remotion exited with code ${code}`));
    });

    child.on('error', reject);
  });
}

// ⭐ still 专用（不用 npm script）
function runStill(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'node_modules/.bin/remotion.cmd',
      ['still', ...args],
      {
        cwd: path.join(MONOREPO_ROOT, 'packages/remotion-engine'),
        stdio: 'inherit',
      }
    );

    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Still exited with code ${code}`));
    });

    child.on('error', reject);
  });
}


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

    const args = [
      comp,
      finalPath,
      `--props=${temp}`,
      '--gl=vulkan',
      `--concurrency=${CONCURRENCY}`,
    ];

    if (durationSec) {
      const frames = Math.round(durationSec * FPS);
      args.push(`--frames=0-${frames - 1}`);
    }

    await runRemotion(args);

    // 淡入淡出
    if (fadeDuration > 0 && fs.existsSync(finalPath)) {
      const tempFaded = finalPath.replace('.mp4', '_faded.mp4');
      log(`添加淡入淡出: ${name}`);
      await addAudioFade(finalPath, tempFaded, fadeDuration);
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
    const compName = type === "new" ? "NewSongCard" : "MainRankCard";
    const frames = Math.round(durationSec * FPS);

    log(`渲染 ${type} #${data.rank} (${durationSec}s)`);

    await runRemotion([
      compName,
      finalPath,
      `--props=${temp}`,
      '--gl=vulkan',
      `--concurrency=${CONCURRENCY}`,
      `--frames=0-${frames - 1}`,
    ]);

    if (config.audioFade !== false && fs.existsSync(finalPath)) {
      const tempFaded = finalPath.replace('.mp4', '_faded.mp4');
      log(`添加淡入淡出: ${type} #${data.rank}`);
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
    log(`渲染封面: ${outputName}`);

    await runStill([
      compositionId,
      outPath,
      `--props=${temp}`,
      `--frame=${frameNumber}`,
    ]);

    return outPath;
  } catch (e) {
    log(`封面渲染失败: ${e.message}`);
    return null;
  } finally {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
}