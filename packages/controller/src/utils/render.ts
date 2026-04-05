/**
 * 这个文件负责根据传入的参数渲染图片和视频分段，不涉及任何数据处理和逻辑。
 */
import fs from 'fs-extra';
import path from 'path';
import { spawn } from 'child_process';

import { addAudioFade } from './ffmpeg.js';
import { MONOREPO_ROOT } from '../config.js';
import { log } from '../state.js';

const FPS = 60;
const CONCURRENCY = 4;

// ⭐ 核心执行器（完全替代 execPromise）
function runRemotion(args: any[]) {
  const safeArgs = args
    .filter((v: any) => v !== undefined && v !== null)
    .map((v: any) => String(v));

  const cwd = path.join(MONOREPO_ROOT, 'packages/remotion-engine');

  const remotionBin = path.resolve(
    cwd,
    'node_modules/.bin/remotion.cmd'
  );

  return new Promise<void>((resolve, reject) => {
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
function runStill(args: any[]) {
  return new Promise<void>((resolve, reject) => {
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


// ========== 渲染视频 ==========
export async function renderVideo(
  comp: string,
  props: any,
  name: string,
  dir: string,
  durationSec: number | null = null,
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

    // 淡入淡出（fadeDuration = 0 时跳过）
    if (fadeDuration > 0 && fs.existsSync(finalPath)) {
      const tempFaded = finalPath.replace('.mp4', '_faded.mp4');
      log(`添加淡入淡出: ${name}`);
      await addAudioFade(finalPath, tempFaded, fadeDuration);
      fs.removeSync(finalPath);
      fs.renameSync(tempFaded, finalPath);
    }

    return finalPath;
  } catch (e: any) {
    log(`渲染失败 ${comp}: ${e.message}`);
    return "";
  } finally {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
}

// ========== 渲染静态图片 ==========
export async function renderImage(
  compositionId: string,
  props: any,
  outputName: string,
  outDir: string,
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
  } catch (e: any) {
    log(`封面渲染失败: ${e.message}`);
    return null;
  } finally {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
}