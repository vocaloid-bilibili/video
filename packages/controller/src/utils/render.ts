// packages/controller/src/utils/render.ts

import fs from "fs-extra";
import path from "path";
import { spawn } from "child_process";

import { addAudioFade } from "./ffmpeg.js";
import { MONOREPO_ROOT } from "../config.js";
import { log } from "../state.js";

const FPS = 60;
const REMOTION_CONCURRENCY = 4;

type RemotionCommand = "render" | "still";

function getRemotionCwd(): string {
  return path.join(MONOREPO_ROOT, "packages/remotion-engine");
}

function getRemotionBin(): string {
  return path.resolve(getRemotionCwd(), "node_modules/.bin/remotion.cmd");
}

function toCliArgs(args: Array<string | number | boolean | null | undefined>) {
  return args
    .filter((value) => value !== undefined && value !== null)
    .map((value) => String(value));
}

function runRemotionCli(
  command: RemotionCommand,
  args: Array<string | number | boolean | null | undefined>,
): Promise<void> {
  const remotionBin = getRemotionBin();
  const cwd = getRemotionCwd();
  const cliArgs = toCliArgs(args);

  return new Promise((resolve, reject) => {
    const child = spawn(
      "cmd.exe",
      ["/d", "/s", "/c", remotionBin, command, ...cliArgs],
      {
        cwd,
        stdio: "inherit",
      },
    );

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Remotion ${command} exited with code ${code}`));
    });

    child.on("error", reject);
  });
}

function getTempPropsPath(dir: string, prefix: string): string {
  return path.join(
    dir,
    `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}.json`,
  );
}

function writeTempProps(dir: string, prefix: string, props: unknown): string {
  fs.ensureDirSync(dir);

  const tempPath = getTempPropsPath(dir, prefix);
  fs.writeJsonSync(tempPath, props);

  return tempPath;
}

function removeTempProps(tempPath: string): void {
  if (!fs.existsSync(tempPath)) return;

  try {
    fs.unlinkSync(tempPath);
  } catch {
    // ignore
  }
}

function getFrameRange(durationSec: number): string {
  const frames = Math.max(1, Math.round(durationSec * FPS));
  return `0-${frames - 1}`;
}

export async function renderVideo(
  compositionId: string,
  props: unknown,
  outputName: string,
  outputDir: string,
  durationSec: number | null = null,
  fadeDuration = 2,
): Promise<string> {
  const outputPath = path.join(outputDir, outputName);

  if (fs.existsSync(outputPath)) {
    return outputPath;
  }

  const tempPropsPath = writeTempProps(
    outputDir,
    `temp_props_${compositionId}`,
    props,
  );

  try {
    log(
      `渲染 ${compositionId} -> ${outputName}${
        durationSec ? ` (${durationSec}s)` : ""
      }`,
    );

    const args: Array<string | number | null> = [
      compositionId,
      outputPath,
      `--props=${tempPropsPath}`,
      "--gl=vulkan",
      `--concurrency=${REMOTION_CONCURRENCY}`,
    ];

    if (durationSec) {
      args.push(`--frames=${getFrameRange(durationSec)}`);
    }

    await runRemotionCli("render", args);

    if (fadeDuration > 0 && fs.existsSync(outputPath)) {
      const fadedPath = outputPath.replace(/\.mp4$/i, "_faded.mp4");

      log(`添加淡入淡出: ${outputName}`);

      await addAudioFade(outputPath, fadedPath, fadeDuration);

      fs.removeSync(outputPath);
      fs.renameSync(fadedPath, outputPath);
    }

    return outputPath;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    log(`渲染失败 ${compositionId}: ${message}`);

    return "";
  } finally {
    removeTempProps(tempPropsPath);
  }
}

export async function renderImage(
  compositionId: string,
  props: unknown,
  outputName: string,
  outputDir: string,
  frameNumber = 0,
): Promise<string | null> {
  const outputPath = path.join(outputDir, outputName);

  if (fs.existsSync(outputPath)) {
    return outputPath;
  }

  const tempPropsPath = writeTempProps(
    outputDir,
    `temp_props_still_${compositionId}`,
    props,
  );

  try {
    log(`渲染封面: ${outputName}`);

    await runRemotionCli("still", [
      compositionId,
      outputPath,
      `--props=${tempPropsPath}`,
      `--frame=${frameNumber}`,
    ]);

    return outputPath;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    log(`封面渲染失败: ${message}`);

    return null;
  } finally {
    removeTempProps(tempPropsPath);
  }
}
