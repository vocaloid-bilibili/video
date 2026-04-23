import fs from 'fs-extra';
import path from 'path';

import { DIR_DATA, DIR_DOWNLOADS, PORT, STAFF_LIST } from '../config.js';
import type {SongRankConfig, SongInfo, IssueConfig} from 'shared-config'
import { log, updateProgress, setTaskStatus, TASK_STATUS } from '../state.js';
import { getPaths, chunkArray, getCopyrightLabel } from '../utils/helpers.js';
import { detectBoardType, getIssueConfig } from 'shared-config';
import type { SegmentType, SegmentOrderItem } from 'shared-config';
import {
  downloadImage,
  downloadClip,
  downloadAudio,
} from '../utils/download.js';
import {
  concatVideos,
  replaceAudio,
  finalMerge,
  getDuration,
} from '../utils/ffmpeg.js';
import { renderVideo, renderImage } from '../utils/render.js';
import { getClipSetting } from '../utils/clips.js';
import type { EditorConfig, RankingData, RenderSongInfo } from '../types/index.js';

// 基础时长配置
const FPS = 60;
const DUR_INTRO = 3;
const DUR_SHORT = 7;
const DUR_SECTION_TITLE = 2;
const DUR_RULES = 35;

// 段落ID前缀常量
const SEGMENT_PREFIX: Record<string, string> = {
  intro: "01",
  infoCard: "02",
  rules: "03",
  achievementTitle: "04",
  songRank: "06",  // 统一处理歌曲展示（成就、新曲榜、主榜）
  singerRank: "10",
  millionRank: "11",
  achievementRank: "12",
  historyRank: "13",
  statsCard: "14",
  staffCard: "15",
  subRankTitle: "16",
  subRank: "17",
};

// 并行配置
const DOWNLOAD_CONCURRENCY = 4;
const RENDER_POOL_SIZE = 2;
const SUB_RANK_POOL_SIZE = 4;

// ========== 工具函数 ==========

function formatDate(dateStr: string) {
  // 2025-01-17 -> 2025.01.17
  // 2025-01 -> 2025.01
  return dateStr.replace(/-/g, ".");
}


async function prepareAllAssets(songs: RenderSongInfo[], progressCallback: (current: number, total: number) => void) {
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

  for (let i = 0; i < songs.length; i += DOWNLOAD_CONCURRENCY) {
    const batch = songs.slice(i, i + DOWNLOAD_CONCURRENCY);

    await Promise.all(
      batch.map(async (song) => {
        const fileName = `${song.bvid}_${song._startTime.toFixed(2)}_${song._duration}.mp4`;
        const filePath = path.join(DIR_DOWNLOADS, fileName);

        if (fs.existsSync(filePath)) {
          try {
            const actualDuration = await getDuration(filePath);
            if (actualDuration >= song._duration - 1) {
              song._videoPath = filePath;
              song._thumbPath = await downloadImage(song.image_url);
              skippedCount++;
              log(`跳过已有: ${song.bvid}`);
              return;
            }
          } catch (e) {
            log(`文件损坏: ${song.bvid}, 重新下载`);
          }
        }

        log(
          `下载: ${song.bvid} (${song._startTime.toFixed(1)}s - ${(song._startTime + song._duration).toFixed(1)}s)`,
        );

        const [vid, thumb] = await Promise.all([
          downloadClip(song.bvid, song._startTime, song._duration),
          downloadImage(song.image_url),
        ]);

        if (vid){
          song._videoPath = vid;
        } else {
          throw Error("获取视频路径失败")
        }

        song._thumbPath = thumb;
        if (vid) downloadedCount++;
      }),
    );

    if (progressCallback) {
      progressCallback(
        Math.min(i + DOWNLOAD_CONCURRENCY, songs.length),
        songs.length,
      );
    }
  }

  const manualCount = songs.filter((s) => s._isManual).length;
  const autoCount = songs.filter((s) => s._isAuto).length;
  const successCount = songs.filter((s) => s._videoPath).length;

  log(`========== 素材准备完成 ==========`);
  log(
    `手动设置: ${manualCount} | 默认设置: ${autoCount} | 跳过: ${skippedCount} | 下载: ${downloadedCount} | 成功: ${successCount}/${songs.length}`,
  );
}

  // 并行渲染榜单
async function renderRankBatch(songs: RenderSongInfo[], cardComponent: string, segments: string, config: Record<string, any>) {
  const results = new Array(songs.length);
  const typeName = cardComponent === "NewSongCard" ? "新曲榜" : cardComponent === "achievementCard" ? "成就展示" : "主榜";

  // 将歌曲列表分片给不同的worker
  const chunkSize = Math.ceil(songs.length / RENDER_POOL_SIZE);
  
  async function worker(workerId: number, startIdx: number, endIdx: number) {
    for (let index = startIdx; index < endIdx; index++) {
      const song = songs[index];
      if (!song) continue;

      const rankPadded = song.rank.toString().padStart(3, "0");
      const targetPath = path.join(segments, `rank_${cardComponent}_${rankPadded}.mp4`);

      if (fs.existsSync(targetPath)) {
        log(`[W${workerId}] 跳过: ${typeName} ${song.rank}`);
        results[index] = targetPath;
        continue;
      }

      const vid = song._videoPath;
      const thumb = song._thumbPath;

      if (!vid) {
        log(`[W${workerId}] 无视频: ${typeName} ${song.rank}`);
        continue;
      }

      log(`[W${workerId}] 渲染: ${typeName} ${song.rank} (${song._duration}s)`);

      // 准备 Remotion props（数据转换移到这里）
      const songAny = song as any;
      const videoUrl = `http://localhost:${PORT}/downloads/${path.basename(vid)}`;
      const props = {
        ...songAny,
        point_before: songAny.point_before,
        point_rate: songAny.rate,
        copyrightLabel: getCopyrightLabel(songAny.copyright),
        vocalists: songAny.vocal,
        producers: songAny.author,
        synthesizers: songAny.synthesizer,
        songType: songAny.type,
        thumb,
        videoSource: videoUrl,
        view_rate: songAny.viewR,
        favorite_rate: songAny.favoriteR,
        danmaku_rate: songAny.danmakuR,
        coin_rate: songAny.coinR,
        like_rate: songAny.likeR,
        reply_rate: songAny.replyR,
        share_rate: songAny.shareR,
        showCount: config.showCount !== false,
        trendCount: config.trendCount,
        seperate_ranks: songAny[config.trendKey || "daily_trends"] || songAny.daily_trends,
        _compName: cardComponent,
      };

      const outputName = `rank_${cardComponent}_${song.rank.toString().padStart(3, "0")}.mp4`;
      const fadeDuration = config.audioFade !== false ? (config.fadeDuration || 2) : 0;

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
  
  // 创建worker任务，每个处理一部分歌曲
  const workerTasks = [];
  for (let i = 0; i < RENDER_POOL_SIZE; i++) {
    const startIdx = i * chunkSize;
    const endIdx = Math.min((i + 1) * chunkSize, songs.length);
    if (startIdx < endIdx) {
      workerTasks.push(worker(i + 1, startIdx, endIdx));
    }
  }
  
  await Promise.all(workerTasks);

  return results.filter(Boolean);
}

// 并行渲染副榜
async function renderSubRankBatch(chunks: RenderSongInfo[][], segments: string, duration: number, config: Record<string, any>) {
  const results = [];

  log(`========== 并行渲染 副榜 (${SUB_RANK_POOL_SIZE}路) ==========`);

  for (let i = 0; i < chunks.length; i += SUB_RANK_POOL_SIZE) {
    const batch = chunks.slice(i, i + SUB_RANK_POOL_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (chunk, idx: number) => {
        const pageNum = i + idx + 1;
        const targetPath = path.join(segments, `13_SubRank_Page${pageNum}.mp4`);

        if (fs.existsSync(targetPath)) {
          log(`副榜 Page${pageNum} 跳过`);
          return targetPath;
        }

        const processed = await Promise.all(
          chunk.map(async (item) => ({
            ...item,
            image_url: await downloadImage(item.image_url),
          })),
        );

        log(`副榜 Page${pageNum} 渲染中...`);

        const fadeDuration = config.audioFade ? (config.fadeDuration || 2) : 0;

        return await renderVideo(
          "SubRank",
          {
            list: processed,
            showCount: config.showCount,
            trendKey: config.trendKey,
            trendCount: config.trendCount,
          },
          `13_SubRank_Page${pageNum}.mp4`,
          segments,
          duration,
          fadeDuration,
        );
      }),
    );
    results.push(...batchResults);
  }

  return results.filter(Boolean);
}

// ========== 配置驱动的段落渲染系统 ==========

// 段落渲染上下文（包含所有需要的数据）
interface SegmentContext {
  name: string;
  data: RankingData;
  editorConfig: EditorConfig;
  config: IssueConfig;
  segments: string;
  base: string;
  allSongs: RenderSongInfo[];
  subList: RenderSongInfo[];
  subChunks: RenderSongInfo[][];
  subDurationPerChunk: number;
  fadeDuration: number;
  introCover: string;
  milChunks: any[][];
  achChunks: any[][];
  orderItem: SegmentOrderItem; // 当前渲染的段落配置
}

// 段落渲染器映射表
const segmentRenderers: Record<SegmentType, (ctx: SegmentContext) => Promise<string | null | undefined>> = {
  // 片头
  intro: async (ctx) => {
    const segmentDuration = ctx.orderItem.config?.duration || DUR_INTRO;
    return await renderVideo(
      "Intro",
      {
        issue: `#${ctx.data.index}`,
        date: formatDate(ctx.name.split('_').at(-1) as string),
        coverImg: ctx.introCover,
        ...ctx.config, // 直接展开 config
      },
      `${SEGMENT_PREFIX.intro}_Intro.mp4`,
      ctx.segments,
      segmentDuration,
      ctx.fadeDuration,
    );
  },

  // 信息卡片
  infoCard: async (ctx) => {
    const opData = ctx.data.op || {};
    const opCover = await downloadImage(opData.image_url);
    const segConfig = ctx.orderItem.config as Record<string, unknown> || {};
    const lastPeriodLabel = (segConfig.lastPeriodLabel as string) || ctx.config.lastPeriodLabel;
    const segmentDuration = (segConfig.duration as number) || 5;
    return await renderVideo(
      "InfoCard",
      {
        opLabel: lastPeriodLabel
          ? `OP / ${lastPeriodLabel}冠军`
          : null,
        opTitle: opData.title || "未知",
        opArtist: opData.author || "Unknown",
        opCover,
        timeLabel: "统计时间",
        timeRange: (ctx.config.timeRange as string) || ctx.data.period,
        note: ctx.editorConfig.script?.opening || `第${ctx.data.index}期`,
        ...ctx.config,
      },
      `${SEGMENT_PREFIX.infoCard}_InfoCard.mp4`,
      ctx.segments,
      segmentDuration,
      ctx.fadeDuration,
    );
  },

  // 规则页面
  rules: async (ctx) => {
    const segmentDuration = ctx.orderItem.config?.duration || DUR_RULES;
    return await renderVideo(
      "RulesAndAchivements",
      ctx.config, // 直接传递 config
      `${SEGMENT_PREFIX.rules}_Rules.mp4`,
      ctx.segments,
      segmentDuration,
      ctx.fadeDuration,
    );
  },

  // 成就展示标题
  achievementTitle: async (ctx) => {
    const segConfig = ctx.orderItem.config as Record<string, unknown> || {};
    const segmentDuration = (segConfig.duration as number) || DUR_SECTION_TITLE;
    return await renderVideo(
      "SectionTitle",
      {
        title: ctx.config.achievementTitleFull || `本周共有 ${ctx.config.achievementCount} 首歌曲达成周刊成就`,
        showNumber: false,
        titleStyle: {
          fontSize: 110,
          fontWeight: "1000",
          textAlign: "center"
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

  // 统一歌曲展示（通过 cardComponent 区分具体组件）
  songRank: async (ctx) => {
    const segConfig = ctx.orderItem.config as Record<string, unknown> || {};
    const cardComponent = segConfig.cardComponent as string;
    const dataField = segConfig.dataField as string;
    const rankCount = (segConfig.rankCount as number) || 0;

    // 获取歌曲列表
    let songs = (ctx.data[dataField] || []) as RenderSongInfo[];
    
    // 成就卡片需要特殊处理
    if (cardComponent === "achievementCard") {
      const achievementDataField = segConfig.achievementDataField as string;
      const count = (ctx.config.achievementCount as number) || rankCount || songs.length;
      songs = (ctx.data[achievementDataField] || songs).slice(0, count);
      
      if (songs.length === 0) return null;

      // 格式化成就展示数据
      const formattedSongs = songs.reverse().map(item => {
        const trendData = Object.values(item.daily_trends || {}).map(Number);
        const infoTags = [
          { label: "发布日期", value: item.pubdate || "未知" },
          { label: "时长", value: item.duration || "未知" },
          { label: "类型", value: item.type || "未知" },
          { label: "作者", value: item.author || "未知" },
          { label: "演唱", value: item.vocal || "未知" },
        ];
        const honorTypeMap: Record<string, string> = {
          "Emerging Hit!": "emerging",
          "Mega Hit!": "mega",
          "门番": "门番",
          "门番候补": "门番候补"
        };
        const honorTitle = (item.honor?.[0] || "成就") as string;
        const honorType = honorTypeMap[honorTitle] || "default";
        const videoSrc = item.bvid
          ? `https://www.bilibili.com/video/${item.bvid}`
          : item.image_url || "";

        return {
          ...item,
          videoSrc,
          infoTags,
          honorBadge: { title: honorTitle, type: honorType },
          trendData,
          trendPeriod: "day",
        };
      });

      // 预先给 config 注入 segment 特有配置
      const mergedConfig = {
        ...ctx.config,
        ...ctx.orderItem.config,
      };

      const results = await renderRankBatch(
        formattedSongs,
        cardComponent,
        ctx.segments,
        mergedConfig,
      );
      
      if (results.length === 0) return null;
      
      const mergedPath = path.join(ctx.segments, `${SEGMENT_PREFIX.songRank}_Achievement.mp4`);
      
      if (fs.existsSync(mergedPath)) {
        log(`成就展示合并文件已存在: ${path.basename(mergedPath)}`);
        return mergedPath;
      }
      
      log(`合并 ${results.length} 个成就展示卡片`);
      return await concatVideos(results, `${SEGMENT_PREFIX.songRank}_Achievement.mp4`, ctx.segments);
    }

    // 其他榜单类型（新曲榜、主榜等）
    const useSongs = songs.slice(0, rankCount);
    const finalSongs = segConfig.reverse ? useSongs : songs.reverse()
    
    if (finalSongs.length === 0) return null;

    const showTitle = segConfig.showTitle !== false;

    // 预先给 config 注入 segment 特有配置
    const mergedConfig = {
      ...ctx.config,
      ...ctx.orderItem.config,
    };

    // 添加连接配置
    const connects = segConfig.connects as number[] || []
    finalSongs.forEach((song, idx) => {
      song.transitionIn = true
      song.transitionOut = true
      if (connects.includes(idx)) song.transitionIn = false
      if (connects.includes(idx+1)) song.transitionOut = false
    });



    // 如果需要显示标题，先渲染标题
    const titleResults: string[] = [];
    if (showTitle) {
      const titleDuration = (segConfig.titleDuration as number) || DUR_SECTION_TITLE;
      const titleName = `${cardComponent}Title.mp4`;
      const titlePath = path.join(ctx.segments, `${SEGMENT_PREFIX.songRank}_${titleName}`);
      
      if (!fs.existsSync(titlePath)) {
        log(`渲染标题: ${segConfig.title || "榜单"} Top ${rankCount}`);
        const titleResult = await renderVideo(
          "SectionTitle",
          {
            title: `${segConfig.title || "榜单"} Top ${rankCount}`,
            from: rankCount,
            to: 1,
            themeColor: (segConfig.color as string) || "#f25d8e",
            edName: "",
            edAuthor: "",
            ...ctx.config,
          },
          `${SEGMENT_PREFIX.songRank}_${titleName}`,
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

    // 渲染歌曲卡片
    const results = await renderRankBatch(
      finalSongs,
      cardComponent,
      ctx.segments,
      mergedConfig,
    );
    
    if (results.length === 0 && titleResults.length === 0) return null;
    
    // 合并所有内容为一个视频文件
    const mergedPath = path.join(ctx.segments, `${SEGMENT_PREFIX.songRank}_${cardComponent}.mp4`);
    
    if (fs.existsSync(mergedPath)) {
      log(`歌曲榜单合并文件已存在: ${path.basename(mergedPath)}`);
      return mergedPath;
    }
    
    // 合并标题和卡片
    const allResults = [...titleResults, ...results];
    log(`合并 ${allResults.length} 个歌曲榜单片段`);
    return await concatVideos(allResults, `${SEGMENT_PREFIX.songRank}_${cardComponent}.mp4`, ctx.segments);
  },

  // 歌手排名
  singerRank: async (ctx) => {
    const singerList = (ctx.data.vocal_stats || []).map((s) => ({
      ...s,
      avatar: `http://localhost:${PORT}/config/avatar/${encodeURIComponent(s.name)}.png`,
    }));
    return await renderVideo(
      "SingerRank",
      { list: singerList, ...ctx.config },
      `${SEGMENT_PREFIX.singerRank}_SingerRank.mp4`,
      ctx.segments,
      DUR_SHORT,
      ctx.fadeDuration,
    );
  },

  // 百万达成
  millionRank: async (ctx) => {
    if (ctx.milChunks.length === 0) return null;

    const results: string[] = [];
    for (let i = 0; i < ctx.milChunks.length; i++) {
      const processed = await Promise.all(
        ctx.milChunks[i]!.map(async (item) => ({
          ...item,
          image_url: await downloadImage(item.image_url),
        })),
      );
      const result = await renderVideo(
        "MillionRank",
        { list: processed, ...ctx.config },
        `${SEGMENT_PREFIX.millionRank}_MillionRank_Page${i + 1}.mp4`,
        ctx.segments,
        DUR_SHORT,
        ctx.fadeDuration,
      );
      if (result) results.push(result);
    }
    
    // 合并所有百万达成页面为一个视频文件
    if (results.length === 0) return null;
    
    const mergedPath = path.join(ctx.segments, `${SEGMENT_PREFIX.millionRank}_MillionRank.mp4`);
    
    if (fs.existsSync(mergedPath)) {
      log(`百万达成合并文件已存在: ${path.basename(mergedPath)}`);
      return mergedPath;
    }
    
    log(`合并 ${results.length} 个百万达成页面`);
    const merged = await concatVideos(results, `${SEGMENT_PREFIX.millionRank}_MillionRank.mp4`, ctx.segments);
    return merged;
  },

  // 成就达成
  achievementRank: async (ctx) => {
    if (ctx.achChunks.length === 0) return null;

    const results: string[] = [];
    for (let i = 0; i < ctx.achChunks.length; i++) {
      const processed = await Promise.all(
        ctx.achChunks[i]!.map(async (item) => ({
          ...item,
          image_url: await downloadImage(item.image_url),
        })),
      );
      const result = await renderVideo(
        "AchievementRank",
        { list: processed, ...ctx.config },
        `${SEGMENT_PREFIX.achievementRank}_AchievementRank_Page${i + 1}.mp4`,
        ctx.segments,
        DUR_SHORT,
        ctx.fadeDuration,
      );
      if (result) results.push(result);
    }
    
    // 合并所有成就达成页面为一个视频文件
    if (results.length === 0) return null;
    
    const mergedPath = path.join(ctx.segments, `${SEGMENT_PREFIX.achievementRank}_AchievementRank.mp4`);
    
    if (fs.existsSync(mergedPath)) {
      log(`成就达成合并文件已存在: ${path.basename(mergedPath)}`);
      return mergedPath;
    }
    
    log(`合并 ${results.length} 个成就达成页面`);
    const merged = await concatVideos(results, `${SEGMENT_PREFIX.achievementRank}_AchievementRank.mp4`, ctx.segments);
    return merged;
  },

  // 历史回顾
  historyRank: async (ctx) => {
    const historyList = ctx.data.history_record || [];
    const historyProcessed = await Promise.all(
      historyList.map(async (item) => ({
        ...item,
        image_url: await downloadImage(item.image_url),
      })),
    );
    return await renderVideo(
      "HistoryRank",
      { list: historyProcessed, ...ctx.config },
      `${SEGMENT_PREFIX.historyRank}_HistoryRank.mp4`,
      ctx.segments,
      DUR_SHORT,
      ctx.fadeDuration,
    );
  },

  // 数据统计
  statsCard: async (ctx) => {
    const segConfig = ctx.orderItem.config as Record<string, unknown> || {};
    const segmentDuration = (segConfig.duration as number) || DUR_SHORT;
    return await renderVideo(
      "StatsCard",
      {
        stat: ctx.data.stat,
        comment: ctx.editorConfig.script?.ending || ctx.data.comment || "",
        topN: ctx.config.topN || ctx.config.subRankMax || 100,
        pointThresholds: ctx.config.pointThresholds,
        newSongPeriod: ctx.config.newSongPeriod,
        ...ctx.config,
      },
      `${SEGMENT_PREFIX.statsCard}_StatsCard.mp4`,
      ctx.segments,
      segmentDuration,
      ctx.fadeDuration,
    );
  },

  // Staff
  staffCard: async (ctx) => {
    return await renderVideo(
      "StaffCard",
      {
        staffList: STAFF_LIST.map((s) => ({
          ...s,
          avatar: `http://localhost:${PORT}/config/staff/${encodeURIComponent(s.name)}.jpg`,
        })),
        ...ctx.config,
      },
      `${SEGMENT_PREFIX.staffCard}_StaffCard.mp4`,
      ctx.segments,
      DUR_SHORT,
      ctx.fadeDuration,
    );
  },

  // 副榜标题
  subRankTitle: async (ctx) => {
    const segConfig = ctx.orderItem.config as Record<string, unknown> || {};
    return await renderVideo(
      "SectionTitle",
      {
        title: ctx.config.subRankTitleFull || `副榜 Top ${ctx.config.subRankMax || 100}`,
        from: ctx.config.subRankRange ?? 21,
        to: ctx.config.subRankRange ?? 100,
        themeColor: (segConfig.color as string) || "#66ccff",
        edName: ctx.editorConfig.ed?.name || "",
        edAuthor: ctx.editorConfig.ed?.author || "",
        ...ctx.config,
      },
      `${SEGMENT_PREFIX.subRankTitle}_SubRankTitle.mp4`,
      ctx.segments,
      DUR_SECTION_TITLE,
      ctx.fadeDuration,
    );
  },

  // 副榜卡片
  subRank: async (ctx) => {
    if (ctx.subChunks.length === 0) return null;

    // 预先给 config 注入 segment 特有配置
    const mergedConfig = {
      ...ctx.config,
      ...ctx.orderItem.config,
    };

    const results = await renderSubRankBatch(
      ctx.subChunks,
      ctx.segments,
      ctx.subDurationPerChunk,
      mergedConfig,
    );
    
    // 合并所有副榜页面为一个视频文件
    if (results.length === 0) return null;
    
    const mergedPath = path.join(ctx.segments, `${SEGMENT_PREFIX.subRank}_SubRank.mp4`);
    
    if (fs.existsSync(mergedPath)) {
      log(`副榜合并文件已存在: ${path.basename(mergedPath)}`);
      return mergedPath;
    }
    
    log(`合并 ${results.length} 个副榜页面`);
    const merged = await concatVideos(results, `${SEGMENT_PREFIX.subRank}_SubRank.mp4`, ctx.segments);
    return merged;
  },
};

// ========== 音频混音处理 ==========

interface SegmentResultItem {
  path: string;
  orderItem: SegmentOrderItem;
}

/**
 * 处理 OP/ED 音频混音
 * @param segmentsDir 段落输出目录
 * @param segmentResults 段落结果列表（直接修改）
 * @param audioMixType 混音类型 ('op' | 'ed')
 * @param audioBvid 音频BV号
 */
async function processAudioMix(
  segmentsDir: string,
  segmentResults: SegmentResultItem[],
  audioMixType: 'op' | 'ed',
  audioBvid: string | undefined,
): Promise<void> {
  // 找出所有指定类型的段落索引
  const mixIndices = segmentResults
    .map((s, i) => s.orderItem.audioMix === audioMixType ? i : -1)
    .filter(i => i >= 0);

  if (!audioBvid || mixIndices.length === 0) {
    log(`${audioMixType.toUpperCase()} 混音跳过: bvid=${audioBvid || '空'}, 段落数量=${mixIndices.length}`);
    return;
  }

  log(`开始${audioMixType.toUpperCase()}混音: bvid=${audioBvid}, 段落数量=${mixIndices.length}`);

  // 检查是否已存在混合后的文件
  const mixedPath = path.join(segmentsDir, `${audioMixType}_mixed.mp4`);
  if (fs.existsSync(mixedPath)) {
    log(`${audioMixType.toUpperCase()}混音文件已存在，直接使用`);
    mixIndices.forEach((origIdx, i) => {
      segmentResults[origIdx]!.path = i === 0 ? mixedPath : "";
    });
    return;
  }

  // 下载音频
  const audioPath = await downloadAudio(audioBvid, `${audioBvid}.mp3`);
  if (!audioPath || typeof audioPath !== 'string') {
    log(`警告: ${audioMixType.toUpperCase()}音频下载失败`);
    return;
  }
  log(`${audioMixType.toUpperCase()}音频下载完成: ${audioPath}`);

  // 收集段落路径并合并
  const segmentPaths = mixIndices
    .map(i => segmentResults[i]?.path)
    .filter((p): p is string => !!p);

  if (segmentPaths.length === 0) {
    log(`警告: 没有找到有效的${audioMixType.toUpperCase()}段落路径`);
    return;
  }

  const merged = await concatVideos(segmentPaths, `${audioMixType}_raw.mp4`, segmentsDir);
  if (!merged) {
    log(`警告: ${audioMixType.toUpperCase()}段落合并失败`);
    return;
  }

  // 替换音频
  const mixed = await replaceAudio(merged, audioPath, `${audioMixType}_mixed.mp4`, segmentsDir);
  if (mixed) {
    log(`${audioMixType.toUpperCase()}混音完成: ${mixed}`);
    mixIndices.forEach((origIdx, i) => {
      segmentResults[origIdx]!.path = i === 0 ? mixed : "";
    });
  }
}

// ========== 封面处理 ==========

async function prepareCoverImage(
  name: string,
  data: RankingData,
  _editorConfig: EditorConfig,
  config: any,
  base: string,
  introCover: string,
): Promise<void> {
  const introSegment = config.segmentOrder.find((s: SegmentOrderItem) => s.type === "intro");
  const introDuration = introSegment?.config?.duration || DUR_INTRO;
  const coverFrame = introDuration * FPS - 31;
  const coverFileName = `${name}.png`;
  const coverPath = path.join(base, coverFileName);

  if (fs.existsSync(coverPath)) {
    fs.unlinkSync(coverPath);
    log("删除旧封面，重新生成");
  }

  await renderImage(
    "Intro",
    {
      issue: data.index ? `#${data.index}` : '',
      date: formatDate(name.split("_").at(-1) as string),
      coverImg: introCover,
      boardType: config._type,
    },
    coverFileName,
    base,
    coverFrame,
  );
  log(`封面已生成: ${coverFileName}`);
}

// ========== 歌曲收集 ==========

function collectSongsFromSegments(
  data: RankingData,
  config: any,
): { allSongs: RenderSongInfo[]; subList: RenderSongInfo[] } {
  const RANK_SEGMENT_TYPES: SegmentType[] = ["songRank"];
  const allSongs: RenderSongInfo[] = [];
  const subList: RenderSongInfo[] = [];

  for (const orderItem of config.segmentOrder) {
    const segType = orderItem.type;
    const segConfig = orderItem.config as Record<string, unknown> || {};

    // 副榜单独处理（不需要下载视频，只在渲染时用）
    if (segType === "subRank") {
      const subDataField = segConfig.dataField as string | null;
      const subRange = (segConfig.range as [number, number]) 
        || (config.subRankRange as [number, number]) 
        || [21, 100];
      
      if (subDataField) {
        const songs = (data[subDataField] || []) as RenderSongInfo[];
        const filtered = songs.filter((s: SongInfo) => s.rank >= subRange[0] && s.rank <= subRange[1]);
        subList.push(...filtered.sort((a: SongInfo, b: SongInfo) => a.rank - b.rank));
        log(`副榜: 从 ${subDataField} 取 ${subList.length} 首 (排名 ${subRange[0]}-${subRange[1]})`);
      }
      continue;
    }

    // 只处理需要视频的 segment
    if (!RANK_SEGMENT_TYPES.includes(segType)) {
      continue;
    }

    const dataField = segConfig.dataField as string | null;
    if (!dataField) continue;

    const songs = (data[dataField] || []) as RenderSongInfo[];
    if (songs.length === 0) continue;

    const count = (segConfig.rankCount as number) || songs.length;
    const segmentSongs = songs.slice(0, count);
    segmentSongs.forEach((s) => (s._defaultDuration = 20));
    allSongs.push(...segmentSongs);

    log(`准备 ${segType}: 从 ${dataField} 取 ${segmentSongs.length} 首`);
  }

  return { allSongs, subList };
}

// ========== 副榜时长计算 ==========

async function calculateSubDuration(
  editorConfig: EditorConfig,
  config: any,
  milChunks: any[][],
  achChunks: any[][],
  subChunks: RenderSongInfo[][],
): Promise<number> {
  let subDuration = 3;

  if (editorConfig.ed?.bvid) {
    const edAudioPath = await downloadAudio(
      editorConfig.ed.bvid,
      `${editorConfig.ed.bvid}.mp3`,
    );
    
    if (edAudioPath) {
      const edTotalDuration = await getDuration(edAudioPath);
      const orderedTypes = config.segmentOrder.map((item: SegmentOrderItem) => item.type);

      // 计算固定时长段落
      const fixedEdSegments = ['singerRank', 'historyRank', 'statsCard', 'staffCard'];
      let edSegmentsDuration = 0;
      for (const segType of fixedEdSegments) {
        if (orderedTypes.includes(segType as SegmentType)) {
          edSegmentsDuration += DUR_SHORT;
        }
      }

      // 计算分页段落时长
      if (orderedTypes.includes('millionRank') && milChunks.length > 0) {
        edSegmentsDuration += milChunks.length * DUR_SHORT;
      }
      if (orderedTypes.includes('achievementRank') && achChunks.length > 0) {
        edSegmentsDuration += achChunks.length * DUR_SHORT;
      }
      if (orderedTypes.includes('subRankTitle')) {
        edSegmentsDuration += DUR_SECTION_TITLE;
      }

      const subTotalDuration = edTotalDuration - edSegmentsDuration;
      if (subTotalDuration > 0 && subChunks.length > 0) {
        subDuration = Math.max(2, subTotalDuration / subChunks.length);
      }

      log(
        `ED时长 ${edTotalDuration.toFixed(1)}s, ED段落 ${edSegmentsDuration}s, ` +
        `副榜总时长 ${subTotalDuration.toFixed(1)}s, 副榜每页 ${subDuration.toFixed(2)}s (共${subChunks.length}页)`,
      );
    }
  }

  return subDuration;
}

// ========== 主合成任务 ==========

/**
 * 核心中的核心！执行视频生成任务
 * 使用配置驱动的段落顺序，所有段落一律平等
 */
async function runSynthesisTask(name: string) {
  const { base, segments, final } = getPaths(name);
  const dataFile = path.join(DIR_DATA, `${name}.json`);
  const configFile = path.join(DIR_DATA, `${name}_config.json`);

  // ============== 1. 读取数据 ==============
  log("读取数据");
  const data: RankingData = await fs.readJson(dataFile);
  const editorConfig: EditorConfig = await fs.readJson(configFile);
  const config = getIssueConfig(name, editorConfig);

  log(`期刊类型: ${config.boardLabel} (${config._type})`);
  log(`段落顺序: ${(config.segmentOrder as SegmentOrderItem[]).map(s => s.type).join(" → ")}`);

  const totalSteps = 70;
  updateProgress("准备", 0, totalSteps);
  let progressCounter = 0;

  // ============== 2. 准备封面 ==============
  // 选择封面图片
  let introCover = "";
  if (editorConfig.cover?.image_url) {
    introCover = await downloadImage(editorConfig.cover.image_url);
    log(`封面: 使用指定 ${editorConfig.cover.bvid}`);
  } else {
    // 从主榜获取首登歌曲作为封面
    const mainRankSeg = config.segmentOrder.find(s => 
      s.type === "songRank" && ["CoverMainRankCard","MainRankCard"].includes((s.config as SongRankConfig)?.cardComponent)
    );
    const mainRankConfig = mainRankSeg?.config as SongRankConfig;
    const mainRankList = mainRankConfig?.dataField 
      ? (data[mainRankConfig.dataField] || []) as RenderSongInfo[] 
      : [];
    const firstAppearSong = config.showCount
      ? mainRankList.find((s: RenderSongInfo) => s.count === 1)
      : mainRankList[0];
    
    if (firstAppearSong) {
      introCover = await downloadImage(firstAppearSong.image_url);
      log(`封面: ${config.showCount ? `主榜首上榜 #${firstAppearSong.rank}` : "主榜第一"}`);
    }
  }

  // 生成封面图片
  await prepareCoverImage(name, data, editorConfig, config, base, introCover);
  updateProgress("封面", ++progressCounter, totalSteps);

  // ============== 3. 准备素材 ==============
  const { allSongs, subList } = collectSongsFromSegments(data, config);

  if (allSongs.length > 0) {
    await prepareAllAssets(allSongs, (current: number, total: number) => {
      updateProgress(`素材 ${current}/${total}`, progressCounter, totalSteps);
    });
  }

  progressCounter += 5;
  updateProgress("素材完成", progressCounter, totalSteps);

  // ============== 4. 准备额外数据 ==============
  const milChunks = chunkArray(
    (data.million_record || []).sort((a: any, b: any) => b.million_crossed - a.million_crossed),
    5
  );
  const achChunks = chunkArray(data.achievement_record || [], 5);
  const subChunks = chunkArray(subList, (config.subRankPerPage as number) || 4);
  const subDurationPerChunk = await calculateSubDuration(editorConfig, config, milChunks, achChunks, subChunks);
  const fadeDuration = config.audioFade ? (config.fadeDuration || 2) : 0;

  // ============== 5. 构建段落上下文 ==============
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

  // ============== 6. 配置驱动的段落渲染 ==============
  log("========== 按配置顺序渲染段落 ==========");
  const segmentResults: SegmentResultItem[] = [];
  
  for (const orderItem of config.segmentOrder) {
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
        log(`${segmentType} 完成: ${path.basename(result)}${orderItem.audioMix ? ` [${orderItem.audioMix}]` : ''}`);
      } else {
        log(`${segmentType} 无数据，跳过`);
      }
      
      progressCounter++;
      updateProgress(`${segmentType}`, progressCounter, totalSteps);
    } catch (error) {
      log(`渲染 ${segmentType} 失败: ${error}`);
    }
  }

  log(`========== 段落渲染完成，共 ${segmentResults.length} 个段落 ==========`);

  // ============== 7. 清理旧产物 ==============
  log("清理旧的合并产物...");
  const tempFiles = ["op_raw.mp4", "ed_raw.mp4", "concat_temp.mp4"];
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

  // ============== 8. 音频混音 ==============
  updateProgress("音频混音", totalSteps - 2, totalSteps);
  
    // 处理 OP 混音
  await processAudioMix(
    segments,
    segmentResults,
    'op',
    data.op?.bvid
  );

  // 处理 ED 混音
  await processAudioMix(
    segments,
    segmentResults,
    'ed',
    editorConfig.ed?.bvid
  );

  // 过滤空段落（被合并的）
  const uniqueSegments = segmentResults.map(s => s.path).filter(s => s && s.length > 0);

  // ============== 9. 最终合并 ==============
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

export {
  runSynthesisTask,
  prepareAllAssets,
  renderRankBatch,
  renderSubRankBatch,
  formatDate,
};
