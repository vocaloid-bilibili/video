// packages/controller/src/synthesis/audioMix.ts

import fs from "fs-extra";
import path from "path";

import { log } from "../state.js";
import { downloadAudio } from "../utils/download.js";
import { concatVideos, replaceAudio } from "../utils/ffmpeg.js";
import type { SegmentResultItem } from "./context.js";

export async function processAudioMix(
  segmentsDir: string,
  segmentResults: SegmentResultItem[],
  audioMixType: "op" | "ed",
  audioBvid: string | undefined,
): Promise<void> {
  const mixIndices = segmentResults
    .map((segment, index) =>
      segment.orderItem.audioMix === audioMixType ? index : -1,
    )
    .filter((index) => index >= 0);

  if (!audioBvid || mixIndices.length === 0) {
    log(
      `${audioMixType.toUpperCase()} 混音跳过: bvid=${audioBvid || "空"}, 段落数量=${mixIndices.length}`,
    );
    return;
  }

  log(
    `开始${audioMixType.toUpperCase()}混音: bvid=${audioBvid}, 段落数量=${mixIndices.length}`,
  );

  const mixedPath = path.join(segmentsDir, `${audioMixType}_mixed.mp4`);

  if (fs.existsSync(mixedPath)) {
    log(`${audioMixType.toUpperCase()}混音文件已存在，直接使用`);

    mixIndices.forEach((originalIndex, index) => {
      segmentResults[originalIndex]!.path = index === 0 ? mixedPath : "";
    });

    return;
  }

  const audioPath = await downloadAudio(audioBvid, `${audioBvid}.mp3`);

  if (!audioPath || typeof audioPath !== "string") {
    log(`警告: ${audioMixType.toUpperCase()}音频下载失败`);
    return;
  }

  log(`${audioMixType.toUpperCase()}音频下载完成: ${audioPath}`);

  const segmentPaths = mixIndices
    .map((index) => segmentResults[index]?.path)
    .filter((filePath): filePath is string => !!filePath);

  if (segmentPaths.length === 0) {
    log(`警告: 没有找到有效的${audioMixType.toUpperCase()}段落路径`);
    return;
  }

  const merged = await concatVideos(
    segmentPaths,
    `${audioMixType}_raw.mp4`,
    segmentsDir,
  );

  if (!merged) {
    log(`警告: ${audioMixType.toUpperCase()}段落合并失败`);
    return;
  }

  const mixed = await replaceAudio(
    merged,
    audioPath,
    `${audioMixType}_mixed.mp4`,
    segmentsDir,
  );

  if (!mixed) return;

  log(`${audioMixType.toUpperCase()}混音完成: ${mixed}`);

  mixIndices.forEach((originalIndex, index) => {
    segmentResults[originalIndex]!.path = index === 0 ? mixed : "";
  });
}
