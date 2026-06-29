// packages/controller/src/synthesis/task.ts

import fs from "fs-extra";
import path from "path";

import { DIR_DATA } from "../config.js";
import { log, setTaskStatus, TASK_STATUS, updateProgress } from "../state.js";
import { chunkArray, getPaths } from "../utils/helpers.js";
import { getIssueConfig } from "shared-config";
import type { SegmentOrderItem, SegmentType } from "shared-config";
import { finalMerge, getDuration } from "../utils/ffmpeg.js";
import { downloadAudio } from "../utils/download.js";
import type {
  EditorConfig,
  RankingData,
  RenderSongInfo,
} from "../types/index.js";
import type { SegmentContext, SegmentResultItem } from "./context.js";
import { DURATION } from "./constants.js";
import { collectSongsFromSegments, prepareAllAssets } from "./assets.js";
import { prepareCoverImage, resolveIntroCover } from "./cover.js";
import { processAudioMix } from "./audioMix.js";
import { segmentRenderers } from "./segmentRenderers.js";

async function readJsonOrDefault<T>(filePath: string, fallback: T): Promise<T> {
  if (!(await fs.pathExists(filePath))) {
    return fallback;
  }

  return (await fs.readJson(filePath)) as T;
}

async function calculateSubDuration(
  editorConfig: EditorConfig,
  config: any,
  milChunks: any[][],
  achChunks: any[][],
  subChunks: RenderSongInfo[][],
): Promise<number> {
  let subDuration = 3;

  if (!editorConfig.ed?.bvid) {
    return subDuration;
  }

  const edAudioPath = await downloadAudio(
    editorConfig.ed.bvid,
    `${editorConfig.ed.bvid}.mp3`,
  );

  if (!edAudioPath) {
    return subDuration;
  }

  const edTotalDuration = await getDuration(edAudioPath);
  const orderedTypes = config.segmentOrder.map(
    (item: SegmentOrderItem) => item.type,
  );

  const fixedEdSegments: SegmentType[] = [
    "singerRank",
    "historyRank",
    "statsCard",
    "staffCard",
  ];

  let edSegmentsDuration = 0;

  for (const segType of fixedEdSegments) {
    if (orderedTypes.includes(segType)) {
      edSegmentsDuration += DURATION.short;
    }
  }

  if (orderedTypes.includes("millionRank") && milChunks.length > 0) {
    edSegmentsDuration += milChunks.length * DURATION.short;
  }

  if (orderedTypes.includes("achievementRank") && achChunks.length > 0) {
    edSegmentsDuration += achChunks.length * DURATION.short;
  }

  if (orderedTypes.includes("subRankTitle")) {
    edSegmentsDuration += DURATION.sectionTitle;
  }

  const subTotalDuration = edTotalDuration - edSegmentsDuration;

  if (subTotalDuration > 0 && subChunks.length > 0) {
    subDuration = Math.max(2, subTotalDuration / subChunks.length);
  }

  log(
    `ED时长 ${edTotalDuration.toFixed(1)}s, ED段落 ${edSegmentsDuration}s, ` +
      `副榜总时长 ${subTotalDuration.toFixed(1)}s, 副榜每页 ${subDuration.toFixed(2)}s (共${subChunks.length}页)`,
  );

  return subDuration;
}

async function renderConfiguredSegments(
  ctx: SegmentContext,
  progressCounter: number,
  totalSteps: number,
): Promise<{
  segmentResults: SegmentResultItem[];
  progressCounter: number;
}> {
  log("========== 按配置顺序渲染段落 ==========");

  const segmentResults: SegmentResultItem[] = [];

  for (const orderItem of ctx.config.segmentOrder) {
    const segmentType = orderItem.type;
    const renderer = segmentRenderers[segmentType];

    if (!renderer) {
      log(`警告: 找不到 ${segmentType} 的渲染器`);
      continue;
    }

    ctx.orderItem = orderItem;

    try {
      log(`渲染 ${segmentType}...`);

      const result = await renderer(ctx);

      if (result) {
        segmentResults.push({ path: result, orderItem });

        log(
          `${segmentType} 完成: ${path.basename(result)}${
            orderItem.audioMix ? ` [${orderItem.audioMix}]` : ""
          }`,
        );
      } else {
        log(`${segmentType} 无数据，跳过`);
      }

      progressCounter++;
      updateProgress(segmentType, progressCounter, totalSteps);
    } catch (error) {
      log(`渲染 ${segmentType} 失败: ${error}`);
    }
  }

  log(`========== 段落渲染完成，共 ${segmentResults.length} 个段落 ==========`);

  return {
    segmentResults,
    progressCounter,
  };
}

function removeOldOutputs(segments: string, final: string) {
  log("清理旧的合并产物...");

  const tempFiles = [
    "op_raw.mp4",
    "ed_raw.mp4",
    "op_mixed.mp4",
    "ed_mixed.mp4",
    "concat_temp.mp4",
  ];

  for (const file of tempFiles) {
    const filePath = path.join(segments, file);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      log(`删除: ${file}`);
    }
  }

  if (fs.existsSync(final)) {
    fs.unlinkSync(final);
    log(`删除: ${path.basename(final)}`);
  }
}

/**
 * 执行视频生成任务。
 *
 * task.ts 只负责总调度：
 * 1. 读数据
 * 2. 解析配置
 * 3. 准备封面和素材
 * 4. 交给 segmentRenderers 按配置渲染
 * 5. 混音
 * 6. 最终合并
 */
async function runSynthesisTask(name: string) {
  const { base, segments, final } = getPaths(name);
  const dataFile = path.join(DIR_DATA, `${name}.json`);
  const configFile = path.join(DIR_DATA, `${name}_config.json`);

  log("读取数据");

  const data = await readJsonOrDefault<RankingData>(
    dataFile,
    {} as RankingData,
  );

  const editorConfig = await readJsonOrDefault<EditorConfig>(
    configFile,
    {} as EditorConfig,
  );

  const config = getIssueConfig(name, editorConfig);

  log(`期刊类型: ${config.boardLabel} (${config._type})`);
  log(
    `段落顺序: ${config.segmentOrder
      .map((segment) => segment.type)
      .join(" → ")}`,
  );

  const totalSteps = 70;
  let progressCounter = 0;

  updateProgress("准备", 0, totalSteps);

  const introCover = await resolveIntroCover(name, data, editorConfig, config);

  await prepareCoverImage(name, data, config, base, introCover);

  progressCounter++;
  updateProgress("封面", progressCounter, totalSteps);

  const { allSongs, subList } = collectSongsFromSegments(data, config);

  if (allSongs.length > 0) {
    await prepareAllAssets(allSongs, (current, total) => {
      updateProgress(`素材 ${current}/${total}`, progressCounter, totalSteps);
    });
  }

  progressCounter += 5;
  updateProgress("素材完成", progressCounter, totalSteps);

  const milChunks = chunkArray(
    (data.million_record || []).sort(
      (a: any, b: any) => b.million_crossed - a.million_crossed,
    ),
    5,
  );

  const achChunks = chunkArray(data.achievement_record || [], 5);
  const configAny = config as unknown as Record<string, any>;
  const subChunks = chunkArray(subList, Number(configAny.subRankPerPage || 4));

  const subDurationPerChunk = await calculateSubDuration(
    editorConfig,
    config,
    milChunks,
    achChunks,
    subChunks,
  );

  const fadeDuration = config.audioFade ? config.fadeDuration || 2 : 0;

  const ctx: SegmentContext = {
    name,
    data,
    editorConfig,
    config,
    segments,
    base,
    allSongs,
    subList,
    subChunks,
    subDurationPerChunk,
    fadeDuration,
    introCover,
    milChunks,
    achChunks,
    orderItem: { type: "intro" },
  };

  const renderResult = await renderConfiguredSegments(
    ctx,
    progressCounter,
    totalSteps,
  );

  progressCounter = renderResult.progressCounter;
  const segmentResults = renderResult.segmentResults;

  removeOldOutputs(segments, final);

  updateProgress("音频混音", totalSteps - 2, totalSteps);

  await processAudioMix(segments, segmentResults, "op", data.op?.bvid);
  await processAudioMix(segments, segmentResults, "ed", editorConfig.ed?.bvid);

  const uniqueSegments = segmentResults
    .map((segment) => segment.path)
    .filter((segmentPath) => segmentPath && segmentPath.length > 0);

  updateProgress("最终合并", totalSteps - 1, totalSteps);
  log(`输出: ${final}`);

  if (uniqueSegments.length > 0) {
    await finalMerge(final, ...uniqueSegments);
    log(`最终视频已生成: ${uniqueSegments.length} 个段落合并`);
  }

  setTaskStatus(TASK_STATUS.COMPLETED);
  updateProgress("完成", totalSteps, totalSteps);
  log("完成");
}

export { runSynthesisTask };
