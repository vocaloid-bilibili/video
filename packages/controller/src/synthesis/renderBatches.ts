// packages/controller/src/synthesis/renderBatches.ts

import fs from "fs-extra";
import path from "path";

import { PORT } from "../config.js";
import { log } from "../state.js";
import { getCopyrightLabel } from "../utils/helpers.js";
import { downloadImage } from "../utils/download.js";
import { renderVideo } from "../utils/render.js";
import type { RenderSongInfo } from "../types/index.js";
import {
  RENDER_POOL_SIZE,
  SEGMENT_PREFIX,
  SUB_RANK_POOL_SIZE,
} from "./constants.js";

function getRankBatchTypeName(cardComponent: string): string {
  switch (cardComponent) {
    case "NewSongCard":
      return "新曲榜";
    case "CoverMainRankCard":
      return "翻唱主榜";
    case "SpecialCard":
      return "特刊";
    case "PickupCard":
      return "Pickup";
    default:
      return "主榜";
  }
}

export async function renderRankBatch(
  songs: RenderSongInfo[],
  cardComponent: string,
  segments: string,
  config: Record<string, unknown>,
) {
  const results = new Array<string | null>(songs.length);
  const typeName = getRankBatchTypeName(cardComponent);
  const chunkSize = Math.ceil(songs.length / RENDER_POOL_SIZE);

  async function worker(workerId: number, startIdx: number, endIdx: number) {
    for (let index = startIdx; index < endIdx; index++) {
      const song = songs[index];
      if (!song) continue;

      const rankPadded = String(song.rank ?? index + 1).padStart(3, "0");
      const targetPath = path.join(
        segments,
        `rank_${cardComponent}_${rankPadded}.mp4`,
      );

      if (fs.existsSync(targetPath)) {
        log(`[W${workerId}] 跳过: ${typeName} ${song.rank}`);
        results[index] = targetPath;
        continue;
      }

      const videoPath = song._videoPath;
      const thumbPath = song._thumbPath;

      if (!videoPath) {
        log(`[W${workerId}] 无视频: ${typeName} ${song.rank}`);
        continue;
      }

      log(`[W${workerId}] 渲染: ${typeName} ${song.rank} (${song._duration}s)`);

      const songAny = song as unknown as Record<string, any>;
      const videoUrl = `http://localhost:${PORT}/downloads/${path.basename(videoPath)}`;
      const trendKey =
        (config.trendKey as string | undefined) || "daily_trends";

      const props = {
        ...songAny,

        boardType: config.boardType,

        point_before: songAny.point_before,
        point_rate: songAny.rate,

        copyrightLabel: getCopyrightLabel(songAny.copyright),

        vocalists: songAny.vocalist,
        producers: songAny.producer,
        synthesizers: songAny.synthesizer,
        songType: songAny.type,

        thumb: thumbPath,
        thumbnail: thumbPath || songAny.thumbnail,

        videoSource: videoUrl,
        videoSrc: videoUrl,

        view_rate: songAny.viewR,
        favorite_rate: songAny.favoriteR,
        danmaku_rate: songAny.danmakuR,
        coin_rate: songAny.coinR,
        like_rate: songAny.likeR,
        reply_rate: songAny.replyR,
        share_rate: songAny.shareR,

        showCount: config.showCount !== false,
        trendCount: config.trendCount,
        seperate_ranks: songAny[trendKey] || songAny.daily_trends,

        _compName: cardComponent,
      };

      const outputName = `rank_${cardComponent}_${rankPadded}.mp4`;
      const fadeDuration =
        config.audioFade !== false ? Number(config.fadeDuration || 2) : 0;

      results[index] = await renderVideo(
        cardComponent,
        props,
        outputName,
        segments,
        song._duration,
        fadeDuration,
      );

      log(`[W${workerId}] 完成: ${typeName} ${song.rank}`);
    }
  }

  log(`========== 并行渲染 ${typeName} (${RENDER_POOL_SIZE}路) ==========`);

  const workerTasks: Promise<void>[] = [];

  for (let index = 0; index < RENDER_POOL_SIZE; index++) {
    const startIdx = index * chunkSize;
    const endIdx = Math.min((index + 1) * chunkSize, songs.length);

    if (startIdx < endIdx) {
      workerTasks.push(worker(index + 1, startIdx, endIdx));
    }
  }

  await Promise.all(workerTasks);

  return results.filter((result): result is string => Boolean(result));
}

export async function renderSubRankBatch(
  chunks: RenderSongInfo[][],
  segments: string,
  duration: number,
  config: Record<string, unknown>,
) {
  const results: string[] = [];

  log(`========== 并行渲染 副榜 (${SUB_RANK_POOL_SIZE}路) ==========`);

  for (let index = 0; index < chunks.length; index += SUB_RANK_POOL_SIZE) {
    const batch = chunks.slice(index, index + SUB_RANK_POOL_SIZE);

    const batchResults = await Promise.all(
      batch.map(async (chunk, idx) => {
        const pageNum = index + idx + 1;
        const outputName = `${SEGMENT_PREFIX.subRank}_SubRank_Page${pageNum}.mp4`;
        const targetPath = path.join(segments, outputName);

        if (fs.existsSync(targetPath)) {
          log(`副榜 Page${pageNum} 跳过`);
          return targetPath;
        }

        const processed = await Promise.all(
          chunk.map(async (item) => ({
            ...item,
            thumbnail: await downloadImage(item.thumbnail || ""),
          })),
        );

        log(`副榜 Page${pageNum} 渲染中...`);

        const fadeDuration =
          config.audioFade !== false ? Number(config.fadeDuration || 2) : 0;

        return await renderVideo(
          "SubRank",
          {
            list: processed,
            showCount: config.showCount,
            trendKey: config.trendKey,
            trendCount: config.trendCount,
            boardType: config.boardType,
          },
          outputName,
          segments,
          duration,
          fadeDuration,
        );
      }),
    );

    results.push(
      ...batchResults.filter((result): result is string => Boolean(result)),
    );
  }

  return results;
}
