// packages/controller/src/synthesis/assets.ts

import fs from "fs-extra";
import path from "path";

import { DIR_DOWNLOADS } from "../config.js";
import { log } from "../state.js";
import { getDuration } from "../utils/ffmpeg.js";
import { downloadClip, downloadImage } from "../utils/download.js";
import { getClipSetting } from "../utils/clips.js";
import type { IssueConfig, SegmentType } from "shared-config";
import type { RankingData, RenderSongInfo } from "../types/index.js";
import { DOWNLOAD_CONCURRENCY } from "./constants.js";

function getSongSegmentSourceField(
  segConfig: Record<string, unknown>,
): string | null {
  return (segConfig.dataField as string | undefined) || null;
}

function getSongSegmentCount(
  segConfig: Record<string, unknown>,
  _config: IssueConfig,
  fallback: number,
): number {
  const rankCount = Number(segConfig.rankCount || 0);

  return Number(rankCount || fallback);
}

export async function prepareAllAssets(
  songs: RenderSongInfo[],
  progressCallback?: (current: number, total: number) => void,
) {
  log("========== 准备视频素材 ==========");

  for (const song of songs) {
    const saved = getClipSetting(song.bvid);

    if (saved) {
      song._startTime = saved.startTime;
      song._duration = saved.duration;
      song._isManual = true;

      log(
        `手动设置: ${song.bvid} (${saved.startTime.toFixed(1)}s - ${saved.endTime.toFixed(1)}s)`,
      );
    } else {
      const defaultDuration = song._defaultDuration || 20;

      song._startTime = 0;
      song._duration = defaultDuration;
      song._isAuto = true;

      log(`默认设置: ${song.bvid} -> 0s (时长 ${defaultDuration}s)`);
    }
  }

  log("========== 下载缺失的视频 ==========");

  let downloadedCount = 0;
  let skippedCount = 0;

  for (let index = 0; index < songs.length; index += DOWNLOAD_CONCURRENCY) {
    const batch = songs.slice(index, index + DOWNLOAD_CONCURRENCY);

    await Promise.all(
      batch.map(async (song) => {
        const fileName = `${song.bvid}_${song._startTime.toFixed(2)}_${song._duration}.mp4`;
        const filePath = path.join(DIR_DOWNLOADS, fileName);

        if (fs.existsSync(filePath)) {
          try {
            const actualDuration = await getDuration(filePath);

            if (actualDuration >= song._duration - 1) {
              song._videoPath = filePath;
              song._thumbPath = await downloadImage(song.thumbnail || "");
              skippedCount++;

              log(`跳过已有: ${song.bvid}`);
              return;
            }
          } catch {
            log(`文件损坏: ${song.bvid}, 重新下载`);
          }
        }

        log(
          `下载: ${song.bvid} (${song._startTime.toFixed(1)}s - ${(song._startTime + song._duration).toFixed(1)}s)`,
        );

        const [videoPath, thumbPath] = await Promise.all([
          downloadClip(song.bvid, song._startTime, song._duration),
          downloadImage(song.thumbnail || ""),
        ]);

        if (!videoPath) {
          throw new Error("获取视频路径失败");
        }

        song._videoPath = videoPath;
        song._thumbPath = thumbPath;
        downloadedCount++;
      }),
    );

    progressCallback?.(
      Math.min(index + DOWNLOAD_CONCURRENCY, songs.length),
      songs.length,
    );
  }

  const manualCount = songs.filter((song) => song._isManual).length;
  const autoCount = songs.filter((song) => song._isAuto).length;
  const successCount = songs.filter((song) => song._videoPath).length;

  log("========== 素材准备完成 ==========");
  log(
    `手动设置: ${manualCount} | 默认设置: ${autoCount} | 跳过: ${skippedCount} | 下载: ${downloadedCount} | 成功: ${successCount}/${songs.length}`,
  );
}

export function collectSongsFromSegments(
  data: RankingData,
  config: IssueConfig,
): { allSongs: RenderSongInfo[]; subList: RenderSongInfo[] } {
  const rankSegmentTypes: SegmentType[] = ["songRank"];
  const allSongs: RenderSongInfo[] = [];
  const subList: RenderSongInfo[] = [];
  const configRecord = config as unknown as Record<string, unknown>;

  for (const orderItem of config.segmentOrder) {
    const segType = orderItem.type;
    const segConfig = (orderItem.config || {}) as Record<string, unknown>;

    if (segType === "subRank") {
      const subDataField = segConfig.dataField as string | undefined;
      const subRange = (segConfig.range as [number, number] | undefined) ||
        (configRecord.subRankRange as [number, number] | undefined) || [
          21, 100,
        ];

      if (!subDataField) continue;

      const songs = (data[subDataField] || []) as RenderSongInfo[];
      const filtered = songs.filter(
        (song) => song.rank >= subRange[0] && song.rank <= subRange[1],
      );

      subList.push(...filtered.sort((a, b) => a.rank - b.rank));

      log(
        `副榜: 从 ${subDataField} 取 ${filtered.length} 首 (排名 ${subRange[0]}-${subRange[1]})`,
      );

      continue;
    }

    if (!rankSegmentTypes.includes(segType)) continue;

    const sourceField = getSongSegmentSourceField(segConfig);
    if (!sourceField) continue;

    const songs = (data[sourceField] || []) as RenderSongInfo[];
    if (songs.length === 0) continue;

    const count = getSongSegmentCount(segConfig, config, songs.length);
    const segmentSongs = songs.slice(0, count);

    segmentSongs.forEach((song) => {
      song._defaultDuration = 20;
    });

    allSongs.push(...segmentSongs);

    log(`准备 ${segType}: 从 ${sourceField} 取 ${segmentSongs.length} 首`);
  }

  return { allSongs, subList };
}
