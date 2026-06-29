// packages/controller/src/utils/ffmpeg.ts

import { exec } from "child_process";
import fs from "fs-extra";
import path from "path";

import { ENCODE_OPTS, HWACCEL, VIDEO_CODEC } from "../config.js";
import { log } from "../state.js";

const VIDEO_ARGS = `-c:v ${VIDEO_CODEC} ${ENCODE_OPTS} -r 60`;
const AUDIO_ARGS = "-c:a aac -ar 48000 -b:a 192k";

function quote(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`;
}

function removeIfExists(filePath: string | null | undefined): void {
  if (!filePath) return;
  if (!fs.existsSync(filePath)) return;

  try {
    fs.unlinkSync(filePath);
  } catch {
    // ignore
  }
}

function getConcatFilter(inputCount: number): string {
  const inputs = Array.from({ length: inputCount }, (_, index) => {
    return `[${index}:v][${index}:a]`;
  }).join("");

  return `${inputs}concat=n=${inputCount}:v=1:a=1[outv][outa]`;
}

function getInputArgs(inputs: string[]): string {
  return inputs.map((input) => `-i ${quote(input)}`).join(" ");
}

async function copyMedia(
  inputPath: string,
  outputPath: string,
): Promise<string> {
  if (inputPath === outputPath) {
    return outputPath;
  }

  await fs.ensureDir(path.dirname(outputPath));

  const command = `ffmpeg -i ${quote(inputPath)} -c copy ${quote(outputPath)} -y`;
  await execPromise(command);

  return outputPath;
}

async function concatMedia(
  inputs: string[],
  outputPath: string,
): Promise<string> {
  const validInputs = inputs.filter((input) => input && fs.existsSync(input));

  if (validInputs.length === 0) {
    throw new Error("没有可合并的视频文件");
  }

  if (validInputs.length === 1) {
    return await copyMedia(validInputs[0]!, outputPath);
  }

  await fs.ensureDir(path.dirname(outputPath));

  const command =
    `ffmpeg ${HWACCEL} ${getInputArgs(validInputs)} ` +
    `-filter_complex "${getConcatFilter(validInputs.length)}" ` +
    `-map "[outv]" -map "[outa]" ` +
    `${VIDEO_ARGS} ${AUDIO_ARGS} ` +
    `${quote(outputPath)} -y`;

  await execPromise(command);

  return outputPath;
}

async function getDurationOrNull(filePath: string): Promise<number | null> {
  try {
    return await getDuration(filePath);
  } catch {
    return null;
  }
}

async function truncateAudio(
  audioPath: string,
  duration: number,
  dir: string,
): Promise<string | null> {
  const tempPath = path.join(dir, `temp_audio_${Date.now()}.mp3`);

  const command =
    `ffmpeg -i ${quote(audioPath)} ` +
    `-t ${duration} ` +
    `-c:a copy ` +
    `${quote(tempPath)} -y`;

  try {
    await execPromise(command);

    if (fs.existsSync(tempPath) && fs.statSync(tempPath).size > 1000) {
      return tempPath;
    }

    removeIfExists(tempPath);
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log(`音频截断失败: ${message}`);
    removeIfExists(tempPath);
    return null;
  }
}

async function resolveAudioPath(
  videoPath: string,
  audioPath: string,
  dir: string,
): Promise<{
  videoDuration: number;
  audioPathToUse: string;
  tempAudioPath: string | null;
}> {
  const videoDuration = await getDuration(videoPath);
  const audioDuration = await getDurationOrNull(audioPath);

  if (!audioDuration) {
    log(`警告: 无法获取音频时长，直接使用原音频: ${audioPath}`);
    return {
      videoDuration,
      audioPathToUse: audioPath,
      tempAudioPath: null,
    };
  }

  log(
    `音频时长: ${audioDuration.toFixed(2)}s, 视频时长: ${videoDuration.toFixed(2)}s`,
  );

  if (audioDuration <= videoDuration + 1) {
    return {
      videoDuration,
      audioPathToUse: audioPath,
      tempAudioPath: null,
    };
  }

  log(
    `音频比视频长，将截断: ${audioDuration.toFixed(2)}s -> ${videoDuration.toFixed(2)}s`,
  );

  const tempAudioPath = await truncateAudio(audioPath, videoDuration, dir);

  return {
    videoDuration,
    audioPathToUse: tempAudioPath || audioPath,
    tempAudioPath,
  };
}

export function execPromise(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 1024 * 1024 * 100 }, (error, stdout, stderr) => {
      if (error) {
        console.error("❌ FFmpeg command failed:");
        console.error(command);
        console.error("📛 STDERR:", stderr);
        console.error("📄 STDOUT:", stdout);
        reject(error);
        return;
      }

      resolve(stdout);
    });
  });
}

export async function getDuration(filePath: string): Promise<number> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`文件不存在: ${filePath}`);
  }

  const command =
    `ffprobe -v error ` +
    `-show_entries format=duration ` +
    `-of default=noprint_wrappers=1:nokey=1 ` +
    `${quote(filePath)}`;

  const output = await execPromise(command);
  const duration = Number.parseFloat(output.trim());

  if (!Number.isFinite(duration)) {
    throw new Error(`无法读取媒体时长: ${filePath}`);
  }

  return duration;
}

export async function addAudioFade(
  inputPath: string,
  outputPath: string,
  fadeDuration = 2,
): Promise<string> {
  if (fadeDuration <= 0) {
    return await copyMedia(inputPath, outputPath);
  }

  const duration = await getDuration(inputPath);

  if (duration <= fadeDuration * 2) {
    await fs.copy(inputPath, outputPath);
    return outputPath;
  }

  const fadeOutStart = Math.max(0, duration - fadeDuration);

  const command =
    `ffmpeg ${HWACCEL} -i ${quote(inputPath)} ` +
    `-af "afade=t=in:st=0:d=${fadeDuration},afade=t=out:st=${fadeOutStart}:d=${fadeDuration}" ` +
    `-c:v copy ${quote(outputPath)} -y`;

  try {
    await execPromise(command);
    return outputPath;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    log(`音频淡入淡出失败，复制原文件: ${message}`);
    await fs.copy(inputPath, outputPath);

    return outputPath;
  }
}

export async function concatVideos(
  list: string[],
  outputName: string,
  dir: string,
): Promise<string | null> {
  const validInputs = list.filter((input) => input && fs.existsSync(input));

  if (validInputs.length === 0) {
    return null;
  }

  if (validInputs.length === 1) {
    return validInputs[0]!;
  }

  const outputPath = path.join(dir, outputName);

  log(`合并 ${validInputs.length} 个片段 -> ${outputName}`);

  return await concatMedia(validInputs, outputPath);
}

export async function replaceAudio(
  videoPath: string,
  audioPath: string,
  outputName: string,
  dir: string,
): Promise<string> {
  if (!fs.existsSync(videoPath)) {
    log(`警告: 视频不存在，跳过音频替换: ${videoPath}`);
    return videoPath;
  }

  if (!fs.existsSync(audioPath)) {
    log(`警告: 音频不存在，跳过音频替换: ${audioPath}`);
    return videoPath;
  }

  const outputPath = path.join(dir, outputName);
  const { videoDuration, audioPathToUse, tempAudioPath } =
    await resolveAudioPath(videoPath, audioPath, dir);

  const fadeDuration = Math.min(2, videoDuration / 4);
  const fadeOutStart = Math.max(0, videoDuration - fadeDuration);

  const command =
    `ffmpeg ${HWACCEL} ` +
    `-i ${quote(videoPath)} ` +
    `-i ${quote(audioPathToUse)} ` +
    `-filter_complex "[1:a]afade=t=in:st=0:d=${fadeDuration},afade=t=out:st=${fadeOutStart}:d=${fadeDuration},volume=0.8[a]" ` +
    `-map 0:v -map "[a]" ` +
    `${VIDEO_ARGS} ${AUDIO_ARGS} ` +
    `-t ${videoDuration} ` +
    `${quote(outputPath)} -y`;

  log(`音频替换: ${outputName}`);

  try {
    await execPromise(command);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    log(`音频替换失败，使用原视频: ${message}`);
    removeIfExists(tempAudioPath);

    return videoPath;
  }

  removeIfExists(tempAudioPath);

  if (!fs.existsSync(outputPath)) {
    log(`音频替换没有产物，使用原视频: ${outputName}`);
    return videoPath;
  }

  const outputDuration = await getDurationOrNull(outputPath);

  if (!outputDuration) {
    log(`音频替换产物无法读取时长，使用原视频: ${outputName}`);
    return videoPath;
  }

  log(`音频替换完成: ${outputName} (${outputDuration.toFixed(2)}s)`);

  return outputPath;
}

export async function finalMerge(
  output: string,
  ...inputs: string[]
): Promise<string> {
  const validInputs = inputs.filter((input) => input && fs.existsSync(input));

  log(`最终合并 ${validInputs.length} 个文件`);

  if (validInputs.length === 0) {
    throw new Error("没有输入文件");
  }

  return await concatMedia(validInputs, output);
}
