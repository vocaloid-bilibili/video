// packages/controller/src/synthesis/segmentRenderers.ts

import fs from "fs-extra";
import path from "path";

import { PORT, STAFF_LIST } from "../config.js";
import type { SegmentType } from "shared-config";
import { log } from "../state.js";
import { downloadImage } from "../utils/download.js";
import { concatVideos } from "../utils/ffmpeg.js";
import { renderVideo } from "../utils/render.js";
import type { RenderSongInfo } from "../types/index.js";
import type { SegmentContext } from "./context.js";
import { DURATION, SEGMENT_PREFIX } from "./constants.js";
import { formatDate } from "./cover.js";
import { renderRankBatch, renderSubRankBatch } from "./renderBatches.js";

function getSegmentConfig(ctx: SegmentContext): Record<string, unknown> {
  return (ctx.orderItem.config || {}) as Record<string, unknown>;
}

function mergeSegmentConfig(ctx: SegmentContext): Record<string, unknown> {
  return {
    ...(ctx.config as unknown as Record<string, unknown>),
    ...(ctx.orderItem.config || {}),
  };
}

function getSubRankRange(ctx: SegmentContext): [number, number] {
  const segConfig = getSegmentConfig(ctx);
  const configRecord = ctx.config as unknown as Record<string, unknown>;

  return (
    (segConfig.range as [number, number] | undefined) ||
    (configRecord.subRankRange as [number, number] | undefined) || [
      21,
      ctx.config.subRankMax || 100,
    ]
  );
}

function getSongRankSource(
  ctx: SegmentContext,
  segConfig: Record<string, unknown>,
): RenderSongInfo[] {
  const dataField = segConfig.dataField as string | undefined;

  return dataField ? ((ctx.data[dataField] || []) as RenderSongInfo[]) : [];
}

export const segmentRenderers: Record<
  SegmentType,
  (ctx: SegmentContext) => Promise<string | null | undefined>
> = {
  intro: async (ctx) => {
    const segmentDuration = Number(
      ctx.orderItem.config?.duration || DURATION.intro,
    );

    return await renderVideo(
      "Intro",
      {
        issue: `#${ctx.data.index}`,
        date: formatDate(ctx.name.split("_").at(-1) as string),
        coverImg: ctx.introCover,
        ...ctx.config,
      },
      `${SEGMENT_PREFIX.intro}_Intro.mp4`,
      ctx.segments,
      segmentDuration,
      ctx.fadeDuration,
    );
  },

  infoCard: async (ctx) => {
    const opData = ctx.data.op || {};
    const opCover = await downloadImage(opData.thumbnail || "");
    const segConfig = getSegmentConfig(ctx);
    const segmentDuration = Number(segConfig.duration || 5);

    return await renderVideo(
      "InfoCard",
      {
        opLabel: null,
        opTitle: opData.title || "未知",
        opArtist: opData.producer || "Unknown",
        opCover,
        timeLabel: "统计时间",
        timeRange: (ctx.config.timeRange as string) || ctx.data.period || "",
        note: ctx.editorConfig.script?.opening || `第${ctx.data.index}期`,
        ...ctx.config,
      },
      `${SEGMENT_PREFIX.infoCard}_InfoCard.mp4`,
      ctx.segments,
      segmentDuration,
      ctx.fadeDuration,
    );
  },

  rules: async (ctx) => {
    const segmentDuration = Number(
      ctx.orderItem.config?.duration || DURATION.rules,
    );

    return await renderVideo(
      "RulesAndAchivements",
      ctx.config,
      `${SEGMENT_PREFIX.rules}_Rules.mp4`,
      ctx.segments,
      segmentDuration,
      ctx.fadeDuration,
    );
  },

  achievementTitle: async (ctx) => {
    const segConfig = getSegmentConfig(ctx);
    const segmentDuration = Number(segConfig.duration || DURATION.sectionTitle);

    return await renderVideo(
      "SectionTitle",
      {
        title:
          ctx.config.achievementTitleFull ||
          `本周共有 ${ctx.config.achievementCount} 首歌曲达成周刊成就`,
        showNumber: false,
        titleStyle: {
          fontSize: 110,
          fontWeight: "1000",
          textAlign: "center",
        },
        themeColor: (segConfig.color as string) || "#FFD700",
        edName: "",
        edAuthor: "",
        ...ctx.config,
      },
      `${SEGMENT_PREFIX.achievementTitle}_AchievementTitle.mp4`,
      ctx.segments,
      segmentDuration,
      ctx.fadeDuration,
    );
  },

  songRank: async (ctx) => {
    const segConfig = getSegmentConfig(ctx);
    const cardComponent = segConfig.cardComponent as string | undefined;
    const rankCount = Number(segConfig.rankCount || 0);

    if (!cardComponent) {
      log("songRank 缺少 cardComponent，跳过");
      return null;
    }

    const sourceSongs = getSongRankSource(ctx, segConfig);
    const useSongs = sourceSongs.slice(0, rankCount || sourceSongs.length);
    const finalSongs = segConfig.reverse ? useSongs : [...useSongs].reverse();

    if (finalSongs.length === 0) return null;

    const showTitle = segConfig.showTitle !== false;
    const mergedConfig = mergeSegmentConfig(ctx);
    const connects = (segConfig.connects as number[]) || [];

    finalSongs.forEach((song, index) => {
      song.transitionIn = true;
      song.transitionOut = true;

      if (connects.includes(index)) {
        song.transitionIn = false;
      }

      if (connects.includes(index + 1)) {
        song.transitionOut = false;
      }
    });

    const titleResults: string[] = [];
    const titleRankCount = rankCount || finalSongs.length;

    if (showTitle) {
      const titleDuration = Number(
        segConfig.titleDuration || DURATION.sectionTitle,
      );
      const titleName = `${cardComponent}Title.mp4`;
      const outputName = `${SEGMENT_PREFIX.songRank}_${titleName}`;
      const titlePath = path.join(ctx.segments, outputName);

      if (!fs.existsSync(titlePath)) {
        log(`渲染标题: ${segConfig.title || "榜单"} Top ${titleRankCount}`);

        const titleResult = await renderVideo(
          "SectionTitle",
          {
            title: `${segConfig.title || "榜单"} Top ${titleRankCount}`,
            from: titleRankCount,
            to: 1,
            themeColor: (segConfig.color as string) || "#f25d8e",
            edName: "",
            edAuthor: "",
            ...ctx.config,
          },
          outputName,
          ctx.segments,
          titleDuration,
          ctx.fadeDuration,
        );

        if (titleResult) titleResults.push(titleResult);
      } else {
        log(`标题已存在: ${path.basename(titlePath)}`);
        titleResults.push(titlePath);
      }
    }

    const results = await renderRankBatch(
      finalSongs,
      cardComponent,
      ctx.segments,
      mergedConfig,
    );

    if (results.length === 0 && titleResults.length === 0) return null;

    const mergedPath = path.join(
      ctx.segments,
      `${SEGMENT_PREFIX.songRank}_${cardComponent}.mp4`,
    );

    if (fs.existsSync(mergedPath)) {
      log(`歌曲榜单合并文件已存在: ${path.basename(mergedPath)}`);
      return mergedPath;
    }

    const allResults = [...titleResults, ...results];

    log(`合并 ${allResults.length} 个歌曲榜单片段`);

    return await concatVideos(
      allResults,
      `${SEGMENT_PREFIX.songRank}_${cardComponent}.mp4`,
      ctx.segments,
    );
  },

  singerRank: async (ctx) => {
    const singerList = (ctx.data.vocal_stats || []).map(
      (s: { name: string } & Record<string, unknown>) => ({
        ...s,
        avatar: `http://localhost:${PORT}/config/avatar/${encodeURIComponent(s.name)}.png`,
      }),
    );

    return await renderVideo(
      "SingerRank",
      { list: singerList, ...ctx.config },
      `${SEGMENT_PREFIX.singerRank}_SingerRank.mp4`,
      ctx.segments,
      DURATION.short,
      ctx.fadeDuration,
    );
  },

  millionRank: async (ctx) => {
    if (ctx.milChunks.length === 0) return null;

    const results: string[] = [];

    for (let index = 0; index < ctx.milChunks.length; index++) {
      const processed = await Promise.all(
        ctx.milChunks[index]!.map(async (item) => ({
          ...item,
          thumbnail: await downloadImage(item.thumbnail),
        })),
      );

      const result = await renderVideo(
        "MillionRank",
        { list: processed, ...ctx.config },
        `${SEGMENT_PREFIX.millionRank}_MillionRank_Page${index + 1}.mp4`,
        ctx.segments,
        DURATION.short,
        ctx.fadeDuration,
      );

      if (result) results.push(result);
    }

    if (results.length === 0) return null;

    const mergedPath = path.join(
      ctx.segments,
      `${SEGMENT_PREFIX.millionRank}_MillionRank.mp4`,
    );

    if (fs.existsSync(mergedPath)) {
      log(`百万达成合并文件已存在: ${path.basename(mergedPath)}`);
      return mergedPath;
    }

    log(`合并 ${results.length} 个百万达成页面`);

    return await concatVideos(
      results,
      `${SEGMENT_PREFIX.millionRank}_MillionRank.mp4`,
      ctx.segments,
    );
  },

  achievementRank: async (ctx) => {
    if (ctx.achChunks.length === 0) return null;

    const results: string[] = [];

    for (let index = 0; index < ctx.achChunks.length; index++) {
      const processed = await Promise.all(
        ctx.achChunks[index]!.map(async (item) => ({
          ...item,
          thumbnail: await downloadImage(item.thumbnail),
        })),
      );

      const result = await renderVideo(
        "AchievementRank",
        { list: processed, ...ctx.config },
        `${SEGMENT_PREFIX.achievementRank}_AchievementRank_Page${index + 1}.mp4`,
        ctx.segments,
        DURATION.short,
        ctx.fadeDuration,
      );

      if (result) results.push(result);
    }

    if (results.length === 0) return null;

    const mergedPath = path.join(
      ctx.segments,
      `${SEGMENT_PREFIX.achievementRank}_AchievementRank.mp4`,
    );

    if (fs.existsSync(mergedPath)) {
      log(`成就达成合并文件已存在: ${path.basename(mergedPath)}`);
      return mergedPath;
    }

    log(`合并 ${results.length} 个成就达成页面`);

    return await concatVideos(
      results,
      `${SEGMENT_PREFIX.achievementRank}_AchievementRank.mp4`,
      ctx.segments,
    );
  },

  historyRank: async (ctx) => {
    const historyList = ctx.data.history_record || [];

    const historyProcessed = await Promise.all(
      historyList.map(
        async (item: { thumbnail: string } & Record<string, unknown>) => ({
          ...item,
          thumbnail: await downloadImage(item.thumbnail),
        }),
      ),
    );

    return await renderVideo(
      "HistoryRank",
      { list: historyProcessed, ...ctx.config },
      `${SEGMENT_PREFIX.historyRank}_HistoryRank.mp4`,
      ctx.segments,
      DURATION.short,
      ctx.fadeDuration,
    );
  },

  statsCard: async (ctx) => {
    const segConfig = getSegmentConfig(ctx);
    const segmentDuration = Number(segConfig.duration || DURATION.short);

    return await renderVideo(
      "StatsCard",
      {
        stat: ctx.data.stat,
        comment: ctx.editorConfig.script?.ending || ctx.data.comment || "",
        ...ctx.config,
        topN: ctx.config.topN || ctx.config.subRankMax || 100,
      },
      `${SEGMENT_PREFIX.statsCard}_StatsCard.mp4`,
      ctx.segments,
      segmentDuration,
      ctx.fadeDuration,
    );
  },

  staffCard: async (ctx) => {
    return await renderVideo(
      "StaffCard",
      {
        staffList: STAFF_LIST.map((staff) => ({
          ...staff,
          avatar: `http://localhost:${PORT}/config/staff/${encodeURIComponent(staff.name)}.jpg`,
        })),
        ...ctx.config,
      },
      `${SEGMENT_PREFIX.staffCard}_StaffCard.mp4`,
      ctx.segments,
      DURATION.short,
      ctx.fadeDuration,
    );
  },

  subRankTitle: async (ctx) => {
    const segConfig = getSegmentConfig(ctx);
    const subRange = getSubRankRange(ctx);
    const segmentDuration = Number(segConfig.duration || DURATION.sectionTitle);

    return await renderVideo(
      "SectionTitle",
      {
        title:
          ctx.config.subRankTitleFull ||
          `${(segConfig.title as string) || "副榜"} Top ${subRange[1]}`,
        from: subRange[0],
        to: subRange[1],
        themeColor: (segConfig.color as string) || "#66ccff",
        edName: ctx.editorConfig.ed?.name || "",
        edAuthor: ctx.editorConfig.ed?.author || "",
        ...ctx.config,
      },
      `${SEGMENT_PREFIX.subRankTitle}_SubRankTitle.mp4`,
      ctx.segments,
      segmentDuration,
      ctx.fadeDuration,
    );
  },

  subRank: async (ctx) => {
    if (ctx.subChunks.length === 0) return null;

    const results = await renderSubRankBatch(
      ctx.subChunks,
      ctx.segments,
      ctx.subDurationPerChunk,
      mergeSegmentConfig(ctx),
    );

    if (results.length === 0) return null;

    const mergedPath = path.join(
      ctx.segments,
      `${SEGMENT_PREFIX.subRank}_SubRank.mp4`,
    );

    if (fs.existsSync(mergedPath)) {
      log(`副榜合并文件已存在: ${path.basename(mergedPath)}`);
      return mergedPath;
    }

    log(`合并 ${results.length} 个副榜页面`);

    return await concatVideos(
      results,
      `${SEGMENT_PREFIX.subRank}_SubRank.mp4`,
      ctx.segments,
    );
  },
};
