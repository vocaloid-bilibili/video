// utils/ffmpeg.js (ES模块最终版本)
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs-extra';

// 修复1：ES模块导入依赖，补全.js后缀
import { log } from '../state.js';
import { HWACCEL, ENCODE_OPTS, VIDEO_CODEC } from 'shared-config';


// ========== 核心函数：命名导出（适配fullVideo.js导入） ==========
export function execPromise(cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 1024 * 1024 * 100 }, (err, stdout, stderr) => {
      if (err) {
        console.error('❌ ERROR:', err);
        console.error('📛 STDERR:', stderr);
        console.error('📄 STDOUT:', stdout);
        reject(err);
      }
      else resolve(stdout);
    });
  });
}

export async function getDuration(filePath: string) {
  const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
  const result = await execPromise(cmd);
  return parseFloat(result.trim());
}

export async function addAudioFade(inputPath: string, outputPath: string, fadeDuration = 2) {
  const duration = await getDuration(inputPath);
  if (duration <= fadeDuration * 2) {
    await fs.copy(inputPath, outputPath);
    return outputPath;
  }

  const fadeOutStart = Math.max(0, duration - fadeDuration);
  const cmd = `ffmpeg ${HWACCEL} -i "${inputPath}" -af "afade=t=in:st=0:d=${fadeDuration},afade=t=out:st=${fadeOutStart}:d=${fadeDuration}" -c:v copy "${outputPath}" -y`;

  try {
    await execPromise(cmd);
    return outputPath;
  } catch (e: unknown) {
    log(`音频淡入淡出失败: ${(e as Error).message}`);
    await fs.copy(inputPath, outputPath);
    return outputPath;
  }
}

// 合并多个片段
export async function concatVideos(list: string[], outputName: string, dir: string) {
  const filtered = list.filter((p: string) => p && fs.existsSync(p));
  if (filtered.length === 0) return null;
  if (filtered.length === 1) return filtered[0];

  const out = path.join(dir, outputName);

  log(`合并 ${filtered.length} 个片段 -> ${outputName}`);

  const inputs = filtered.map((p: string) => `${HWACCEL} -i "${p}"`).join(" ");
  const filterParts = filtered.map((_: string, i: number) => `[${i}:v][${i}:a]`).join("");
  const filter = `${filterParts}concat=n=${filtered.length}:v=1:a=1[outv][outa]`;

  const cmd = `ffmpeg ${inputs} -filter_complex "${filter}" -map "[outv]" -map "[outa]" -c:v ${VIDEO_CODEC} ${ENCODE_OPTS} -r 60 -c:a aac -ar 48000 -b:a 192k "${out}" -y`;

  await execPromise(cmd);
  return out;
}

// P1 混音 OP
export async function processP1(videoPath: string, audioPath: string, outputName: string, dir: string) {
  const out = path.join(dir, outputName);

  const cmd = `ffmpeg ${HWACCEL} -i "${videoPath}" -i "${audioPath}" -filter_complex "[1:a]afade=t=in:st=0:d=2,afade=t=out:st=43:d=2,volume=0.7[opa];[0:a][opa]amix=inputs=2:duration=first[outa]" -map 0:v -map "[outa]" -c:v ${VIDEO_CODEC} ${ENCODE_OPTS} -r 60 -c:a aac -ar 48000 -b:a 192k "${out}" -y`;
  log("P1 混音处理");
  await execPromise(cmd);
  return out;
}

// P3 混音 ED
export async function processP3(p3Pre: string, p3Sub: string, edAudio: string, outputName: string, dir: string) {
  const out = path.join(dir, outputName);

  const preConcat = path.join(dir, "p3_concat_temp.mp4");

  let concatCmd = `ffmpeg ${HWACCEL} -i "${p3Pre}" ${HWACCEL} -i "${p3Sub}" -filter_complex "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[outv][outa]" -map "[outv]" -map "[outa]" -c:v ${VIDEO_CODEC} ${ENCODE_OPTS} -r 60 -c:a aac -ar 48000 -b:a 192k "${preConcat}" -y`;
  await execPromise(concatCmd);

  const videoDuration = await getDuration(preConcat);
  const fadeOutStart = Math.max(0, videoDuration - 5);

  const cmd = `ffmpeg ${HWACCEL} -i "${preConcat}" -i "${edAudio}" -filter_complex "[1:a]afade=t=in:st=0:d=2,afade=t=out:st=${fadeOutStart}:d=5[eda];[0:a][eda]amix=inputs=2:duration=first[outa]" -map 0:v -map "[outa]" -c:v ${VIDEO_CODEC} ${ENCODE_OPTS} -r 60 -c:a aac -ar 48000 -b:a 192k "${out}" -y`;
  log("P3 ED混音处理");
  await execPromise(cmd);

  if (fs.existsSync(preConcat)) fs.unlinkSync(preConcat);
  return out;
}

// 最终合并
export async function finalMerge(output: string, ...inputs: string[]) {
  log(`最终合并 ${inputs.length} 个文件`);

  if (inputs.length === 0) {
    throw new Error("没有输入文件");
  }

  if (inputs.length === 1) {
    // 只有一个文件直接复制
    await execPromise(`ffmpeg -i "${inputs[0]}" -c copy "${output}" -y`);
    return;
  }

  const inputArgs = inputs.map((p) => `-i "${p}"`).join(" ");
  const filterParts: string[] = [];
  const mappingParts: string[] = [];
  
  for (let i = 0; i < inputs.length; i++) {
    filterParts.push(`[${i}:v][${i}:a]`);
    mappingParts.push(`-map "[outv${i}]" -map "[outa${i}]"`);
  }

  const filterComplex = `${filterParts.join("")}concat=n=${inputs.length}:v=1:a=1[outv][outa]`;
  const cmd = `ffmpeg ${HWACCEL} ${inputArgs} -filter_complex "${filterComplex}" ${mappingParts.join(" ")} -c:v ${VIDEO_CODEC} ${ENCODE_OPTS} -r 60 -c:a aac -ar 48000 -b:a 192k "${output}" -y`;

  await execPromise(cmd);
}