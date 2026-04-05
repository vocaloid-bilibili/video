// utils/ffmpeg.js (ES模块最终版本)
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs-extra';

// 修复1：ES模块导入依赖，补全.js后缀
import { log } from '../state.js';
import { HWACCEL, ENCODE_OPTS, VIDEO_CODEC } from '../config.js';


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

// 替换视频中的音频轨道
export async function replaceAudio(videoPath: string, audioPath: string, outputName: string, dir: string) {
  const out = path.join(dir, outputName);
  
  // 获取视频时长用于音频淡出
  let videoDuration = 10;
  try {
    videoDuration = await getDuration(videoPath);
  } catch {
    log(`警告: 无法获取 ${videoPath} 时长`);
    return videoPath;
  }
  
  // 获取音频时长
  let audioDuration = 0;
  let audioPathToUse = audioPath;
  let tempAudioPath = "";
  
  try {
    audioDuration = await getDuration(audioPath);
    log(`音频时长: ${audioDuration.toFixed(2)}s, 视频时长: ${videoDuration.toFixed(2)}s`);
    
    // 如果音频比视频长很多，先截断音频
    if (audioDuration > videoDuration + 1) {
      log(`注意: 音频(${audioDuration.toFixed(2)}s)比视频(${videoDuration.toFixed(2)}s)长超过1秒，将截断音频`);
      
      // 创建临时截断的音频文件
      tempAudioPath = path.join(dir, `temp_truncated_${Date.now()}.mp3`);
      const truncateCmd = `ffmpeg -i "${audioPath}" -t ${videoDuration} -c:a copy "${tempAudioPath}" -y`;
      
      try {
        await execPromise(truncateCmd);
        if (fs.existsSync(tempAudioPath)) {
          audioPathToUse = tempAudioPath;
          log(`音频已截断为 ${videoDuration}s: ${path.basename(tempAudioPath)}`);
        }
      } catch (error) {
        log(`音频截断失败: ${error}, 将使用完整音频`);
      }
    } else if (audioDuration > videoDuration) {
      log(`注意: 音频(${audioDuration.toFixed(2)}s)比视频(${videoDuration.toFixed(2)}s)稍长，使用-shortest选项`);
    }
  } catch {
    log(`警告: 无法获取 ${audioPath} 时长`);
    // 如果无法获取音频时长，继续处理
  }
  
  // 检查原视频是否有效
  if (!fs.existsSync(videoPath) || videoDuration <= 0) {
    log(`警告: ${videoPath} 无效，跳过音频替换`);
    // 清理临时文件
    if (tempAudioPath && fs.existsSync(tempAudioPath)) {
      fs.unlinkSync(tempAudioPath);
    }
    return videoPath;
  }
  
  // 根据视频时长调整淡出参数
  const fadeDuration = Math.min(2, videoDuration / 4);
  const fadeOutStart = Math.max(0, videoDuration - fadeDuration);
  
  // 直接用新音频替换原音频（不混合原音频）
  // 使用 -shortest 确保输出时长与较短的输入一致
  const cmd = `ffmpeg ${HWACCEL} -i "${videoPath}" -i "${audioPathToUse}" -filter_complex "[1:a]afade=t=in:st=0:d=${fadeDuration},afade=t=out:st=${fadeOutStart}:d=${fadeDuration},volume=0.8[opa]" -map 0:v -map "[opa]" -c:v ${VIDEO_CODEC} ${ENCODE_OPTS} -r 60 -c:a aac -ar 48000 -b:a 192k -shortest "${out}" -y`;
  
  log(`音频替换: ${outputName} (视频: ${videoDuration.toFixed(2)}s)`);
  
  try {
    await execPromise(cmd);
  } catch (error) {
    log(`音频替换失败: ${error}`);
    // 清理临时文件
    if (tempAudioPath && fs.existsSync(tempAudioPath)) {
      fs.unlinkSync(tempAudioPath);
    }
    return videoPath;
  }
  
  // 清理临时音频文件
  if (tempAudioPath && fs.existsSync(tempAudioPath)) {
    fs.unlinkSync(tempAudioPath);
    log(`清理临时音频文件: ${path.basename(tempAudioPath)}`);
  }
  
  // 验证输出文件是否有效
  if (fs.existsSync(out)) {
    // 检查输出文件时长
    try {
      const outDuration = await getDuration(out);
      log(`输出文件时长: ${outDuration.toFixed(2)}s`);
      
      if (Math.abs(outDuration - videoDuration) > 1) {
        log(`警告: 输出文件时长(${outDuration.toFixed(2)}s)与视频时长(${videoDuration.toFixed(2)}s)差异较大`);
      }
    } catch {
      log(`无法获取输出文件时长`);
    }
    
    return out;
  } else {
    log(`警告: ${outputName} 生成失败，使用原文件`);
    return videoPath;
  }
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
  
  for (let i = 0; i < inputs.length; i++) {
    filterParts.push(`[${i}:v][${i}:a]`);
  }

  const filterComplex = `${filterParts.join("")}concat=n=${inputs.length}:v=1:a=1[outv][outa]`;
  const cmd = `ffmpeg ${HWACCEL} ${inputArgs} -filter_complex "${filterComplex}" -map "[outv]" -map "[outa]" -c:v ${VIDEO_CODEC} ${ENCODE_OPTS} -r 60 -c:a aac -ar 48000 -b:a 192k "${output}" -y`;

  await execPromise(cmd);
}