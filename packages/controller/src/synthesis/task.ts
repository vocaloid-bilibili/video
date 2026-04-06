import fs from 'fs-extra';
import path from 'path';

import { DIR_DATA, DIR_DOWNLOADS, PORT, STAFF_LIST } from '../config.js';
import type {SongInfo} from 'shared-config'
import { log, updateProgress, setTaskStatus, TASK_STATUS } from '../state.js';
import { getPaths, chunkArray, getCopyrightLabel } from '../utils/helpers.js';
import { getIssueConfig } from 'shared-config';
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
  newachievement: "05",
  newRank: "06",
  newRankTitle: "06",  // 标题与新曲榜共享前缀
  mainRank: "08",
  mainRankTitle: "08", // 标题与主榜共享前缀
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
async function renderRankBatch(songs: RenderSongInfo[], type: string, segments: string, config: Record<string, any>, cardComponentName?: string) {
  const results = new Array(songs.length);
  const typeName = type === "new" ? "新曲榜" : type === "achievement" ? "成就展示" : "主榜";

  // 将歌曲列表分片给不同的worker
  const chunkSize = Math.ceil(songs.length / RENDER_POOL_SIZE);
  
  async function worker(workerId: number, startIdx: number, endIdx: number) {
    for (let index = startIdx; index < endIdx; index++) {
      const song = songs[index];
      if (!song) continue;

      const rankPadded = song.rank.toString().padStart(3, "0");
      const targetPath = path.join(segments, `rank_${type}_${rankPadded}.mp4`);

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
        _compName: cardComponentName
          || config.cardComponent
          || (type === "achievement" ? "achievementCard" : (type === "new" ? "NewSongCard" : "MainRankCard")),
      };

      const outputName = `rank_${type}_${song.rank.toString().padStart(3, "0")}.mp4`;
      const compName = cardComponentName || config.cardComponent || (type === "achievement" ? "achievementCard" : (type === "new" ? "NewSongCard" : "MainRankCard"));
      const fadeDuration = config.audioFade !== false ? (config.fadeDuration || 2) : 0;

      results[index] = await renderVideo(
        compName,
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
  config: any;
  segments: string;
  base: string;
  allSongs: RenderSongInfo[];
  achievementList: RenderSongInfo[];
  newRankList: RenderSongInfo[];
  mainRankList: RenderSongInfo[];
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
        date: formatDate(ctx.name),
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
          : "OP / 上期冠军",
        opTitle: opData.title || "未知",
        opArtist: opData.author || "Unknown",
        opCover,
        timeLabel: "统计时间",
        timeRange: ctx.data.period,
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

  // 成就展示卡片
  newachievement: async (ctx) => {
    if (ctx.achievementList.length === 0) return null;

    // 预先给 config 注入 segment 特有配置
    const mergedConfig = {
      ...ctx.config,
      ...ctx.orderItem.config,
    };

    const reversedAchievementList = [...ctx.achievementList].reverse();
    const formattedAchievementList = reversedAchievementList.map(item => {
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

    const results = await renderRankBatch(
      formattedAchievementList,
      "achievementCard",
      ctx.segments,
      mergedConfig,
    );
    
    // 合并所有成就展示卡片为一个视频文件
    if (results.length === 0) return null;
    
    const mergedPath = path.join(ctx.segments, `${SEGMENT_PREFIX.newachievement}_Achievement.mp4`);
    
    if (fs.existsSync(mergedPath)) {
      log(`成就展示合并文件已存在: ${path.basename(mergedPath)}`);
      return mergedPath;
    }
    
    log(`合并 ${results.length} 个成就展示卡片`);
    const merged = await concatVideos(results, `${SEGMENT_PREFIX.newachievement}_Achievement.mp4`, ctx.segments);
    return merged;
  },

  // 新曲榜卡片（包含可选标题渲染）
  newRank: async (ctx) => {
    if (ctx.newRankList.length === 0) return null;

    const segConfig = ctx.orderItem.config as Record<string, unknown> || {};
    const reversedNewList = [...ctx.newRankList].reverse();
    const showTitle = segConfig.showTitle !== false;
    const rankCount = (segConfig.rankCount as number) || ctx.config.newRankCount;

    // 预先给 config 注入 segment 特有配置
    const mergedConfig = {
      ...ctx.config,
      ...ctx.orderItem.config,
    };

    // 如果需要显示标题，先渲染标题
    const titleResults: string[] = [];
    if (showTitle) {
      const titleDuration = (segConfig.titleDuration as number) || DUR_SECTION_TITLE;
      const titlePath = path.join(ctx.segments, `${SEGMENT_PREFIX.newRankTitle}_NewRankTitle.mp4`);
      
      if (!fs.existsSync(titlePath)) {
        log(`渲染新曲榜标题: ${segConfig.title || "新曲榜"} Top ${rankCount}`);
        const titleResult = await renderVideo(
          "SectionTitle",
          {
            title: `${segConfig.title || "新曲榜"} Top ${rankCount}`,
            from: rankCount,
            to: 1,
            themeColor: (segConfig.color as string) || "#23ade5",
            edName: "",
            edAuthor: "",
            ...ctx.config,
          },
          `${SEGMENT_PREFIX.newRankTitle}_NewRankTitle.mp4`,
          ctx.segments,
          titleDuration,
          ctx.fadeDuration,
        );
        if (titleResult) titleResults.push(titleResult);
      } else {
        log(`新曲榜标题已存在: ${path.basename(titlePath)}`);
        titleResults.push(titlePath);
      }
    }

    // 渲染新曲榜卡片
    const results = await renderRankBatch(
      reversedNewList,
      "new",
      ctx.segments,
      mergedConfig,
    );
    
    if (results.length === 0 && titleResults.length === 0) return null;
    
    // 合并所有新曲榜内容为一个视频文件
    const mergedPath = path.join(ctx.segments, `${SEGMENT_PREFIX.newRank}_NewRank.mp4`);
    
    if (fs.existsSync(mergedPath)) {
      log(`新曲榜合并文件已存在: ${path.basename(mergedPath)}`);
      return mergedPath;
    }
    
    // 合并标题和卡片
    const allResults = [...titleResults, ...results];
    log(`合并 ${allResults.length} 个新曲榜片段`);
    const merged = await concatVideos(allResults, `${SEGMENT_PREFIX.newRank}_NewRank.mp4`, ctx.segments);
    return merged;
  },

  // 主榜卡片（包含可选标题渲染）
  mainRank: async (ctx) => {
    if (ctx.mainRankList.length === 0) return null;

    const segConfig = ctx.orderItem.config as Record<string, unknown> || {};
    const reversedMainList = [...ctx.mainRankList].reverse();
    const isCoverWeekly = ctx.config._type === "coverWeekly";
    const showTitle = segConfig.showTitle !== false;
    const rankCount = (segConfig.rankCount as number) || ctx.config.mainRankCount;

    // 预先给 config 注入 segment 特有配置
    const mergedConfig = {
      ...ctx.config,
      ...ctx.orderItem.config,
      cardComponent: isCoverWeekly ? "CoverMainRankCard" : (segConfig.cardComponent as string) || "MainRankCard",
    };

    if (isCoverWeekly) {
      const coverWeeklyName = (ctx.editorConfig as any).coverWeeklyName || "本周主榜";
      reversedMainList.forEach(song => {
        song.name = coverWeeklyName;
      });
      log(`coverWeekly 模式: 榜单名称 = "${coverWeeklyName}"`);
    }

    // 如果需要显示标题，先渲染标题
    const titleResults: string[] = [];
    if (showTitle) {
      const titleDuration = (segConfig.titleDuration as number) || DUR_SECTION_TITLE;
      const titlePath = path.join(ctx.segments, `${SEGMENT_PREFIX.mainRankTitle}_MainRankTitle.mp4`);
      
      if (!fs.existsSync(titlePath)) {
        log(`渲染主榜标题: ${segConfig.title || "主榜"} Top ${rankCount}`);
        const titleResult = await renderVideo(
          "SectionTitle",
          {
            title: `${segConfig.title || "主榜"} Top ${rankCount}`,
            from: rankCount,
            to: 1,
            themeColor: (segConfig.color as string) || "#f25d8e",
            edName: "",
            edAuthor: "",
            ...ctx.config,
          },
          `${SEGMENT_PREFIX.mainRankTitle}_MainRankTitle.mp4`,
          ctx.segments,
          titleDuration,
          ctx.fadeDuration,
        );
        if (titleResult) titleResults.push(titleResult);
      } else {
        log(`主榜标题已存在: ${path.basename(titlePath)}`);
        titleResults.push(titlePath);
      }
    }

    const results = await renderRankBatch(
      reversedMainList,
      "main",
      ctx.segments,
      mergedConfig,
      isCoverWeekly ? "CoverMainRankCard" : undefined,
    );
    
    if (results.length === 0 && titleResults.length === 0) return null;
    
    // 合并所有主榜内容为一个视频文件
    const mergedPath = path.join(ctx.segments, `${SEGMENT_PREFIX.mainRank}_MainRank.mp4`);
    
    if (fs.existsSync(mergedPath)) {
      log(`主榜合并文件已存在: ${path.basename(mergedPath)}`);
      return mergedPath;
    }
    
    // 合并标题和卡片
    const allResults = [...titleResults, ...results];
    log(`合并 ${allResults.length} 个主榜片段`);
    const merged = await concatVideos(allResults, `${SEGMENT_PREFIX.mainRank}_MainRank.mp4`, ctx.segments);
    return merged;
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
        from: ctx.config.subRankRange ? ctx.config.subRankRange[0] : 21,
        to: ctx.config.subRankRange ? ctx.config.subRankRange[1] : 100,
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

// ========== 主合成任务 ==========

/**
 * 核心中的核心！这里就是执行生成视频任务
 * 使用配置驱动的段落顺序，所有段落一律平等
 * @param {string} date 
 */
async function runSynthesisTask(name: string) {
  const { base, segments, final } = getPaths(name);
  const dataFile = path.join(DIR_DATA, `${name}.json`);
  const configFile = path.join(DIR_DATA, `${name}_config.json`);

  log("读取数据");
  const data: RankingData = await fs.readJson(dataFile);

  // 读取编辑器配置
  const editorConfig: EditorConfig = await fs.readJson(configFile);
  
  // 获取期刊配置
  const config = getIssueConfig(name, editorConfig);
  log(`期刊类型: ${config.boardLabel} (${config._type})`);
  log(`段落顺序: ${(config.segmentOrder as SegmentOrderItem[]).map(s => s.type).join(" → ")}`);

  const totalSteps = 70;
  updateProgress("准备", 0, totalSteps);

  let progressCounter = 0;

  // ============== 准备数据阶段 ================
  
  // 封面选择
  let introCover = "";
  if (editorConfig.cover && editorConfig.cover.image_url) {
    introCover = await downloadImage(editorConfig.cover.image_url);
    log(`封面: 使用指定 ${editorConfig.cover.bvid}`);
  } else {
    // 从 mainRank segment 获取 dataField
    const mainRankSeg = config.segmentOrder.find(s => s.type === "mainRank");
    const mainRankConfig = mainRankSeg?.config as Record<string, unknown> || {};
    const mainRankField = (mainRankConfig.dataField as string) || "total_rank_top20";
    const mainRankList = (data[mainRankField] || []) as RenderSongInfo[];
    const firstAppearSong = config.showCount
      ? mainRankList.find((s: RenderSongInfo) => s.count === 1)
      : mainRankList[0];
    if (firstAppearSong) {
      introCover = await downloadImage(firstAppearSong.image_url);
      log(
        `封面: ${config.showCount ? `主榜首上榜 #${firstAppearSong.rank}` : "主榜第一"}`,
      );
    }
  }

  // 生成封面图片
  const introSegment = config.segmentOrder.find(s => s.type === "intro");
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
        date: formatDate(name),
        coverImg: introCover,
        boardType: config._type,
      },
      coverFileName,
      base,
      coverFrame,
    );
    log(`封面已生成: ${coverFileName}`);
    updateProgress("封面", ++progressCounter, totalSteps);

  // ============== 准备素材阶段 ================
  // 从各 segment 配置中获取 dataField
  const getDataField = (type: string, defaultField: string): string => {
    const seg = config.segmentOrder.find(s => s.type === type);
    const segConfig = seg?.config as Record<string, unknown>;
    return (segConfig?.dataField as string) || defaultField;
  };

  const achievementField = getDataField("newachievement", "achievement_data");
  const newRankField = getDataField("newRank", "new_rank_top10");
  const mainRankField = getDataField("mainRank", "total_rank_top20");
  const subRankField = getDataField("subRank", "total_rank_sub");

  const achievementList: RenderSongInfo[] = (data[achievementField] || []).slice(0, config.achievementCount);
  const newRankList: RenderSongInfo[] = (data[newRankField] || []).slice(0, config.newRankCount);
  const mainRankList: RenderSongInfo[] = (data[mainRankField] || []).slice(0, config.mainRankCount);
  const subList: RenderSongInfo[] = config.subRankRange
    ? (data[subRankField] || [])
        .filter((i: SongInfo) => {
          if (!config.subRankRange) return false;
          return i.rank >= config.subRankRange[0] && i.rank <= config.subRankRange[1];
        })
        .sort((a: SongInfo, b: SongInfo) => a.rank - b.rank)
    : [];

  achievementList.forEach((s) => (s._defaultDuration = 20));
  newRankList.forEach((s) => (s._defaultDuration = 20));
  mainRankList.forEach((s) => (s._defaultDuration = 20));

  const allSongs = [...achievementList, ...newRankList, ...mainRankList];

  if (allSongs.length > 0) {
    await prepareAllAssets(allSongs, (current: number, total: number) => {
      updateProgress(`素材 ${current}/${total}`, progressCounter, totalSteps);
    });
  }

  progressCounter += 5;
  updateProgress("素材完成", progressCounter, totalSteps);

  // 准备额外数据
  const milList = (data.million_record || []).sort(
    (a: any, b: any) => b.million_crossed - a.million_crossed,
  );
  const milChunks = chunkArray(milList, 5);

  const achList = data.achievement_record || [];
  const achChunks = chunkArray(achList, 5);

  const subChunks = chunkArray(subList, config.subRankPerPage || 4);

  // 计算副榜每页时长
  let subDurationPerChunk = 3;
  if (editorConfig.ed && editorConfig.ed.bvid) {
    const edAudioPath = await downloadAudio(
      editorConfig.ed.bvid,
      `${editorConfig.ed.bvid}.mp3`,
    );
    if (edAudioPath) {
      const edTotalDuration = await getDuration(edAudioPath);
      
      // 获取 segmentOrder 中的段落类型
      const orderedTypes = config.segmentOrder.map(item => item.type);
      
      // 精确计算ED段落总时长（包括所有非subRank的ED段落）
      // ED段落包括: singerRank, millionRank, achievementRank, historyRank, statsCard, staffCard, subRankTitle
      let edSegmentsDuration = 0;
      
      // singerRank, historyRank, statsCard, staffCard 各自固定 DUR_SHORT (7秒)
      const fixedEdSegments = ['singerRank', 'historyRank', 'statsCard', 'staffCard'];
      for (const segType of fixedEdSegments) {
        if (orderedTypes.includes(segType as SegmentType)) {
          edSegmentsDuration += DUR_SHORT;
        }
      }
      
      // millionRank 每个chunk固定 DUR_SHORT (7秒)
      if (orderedTypes.includes('millionRank') && milChunks.length > 0) {
        edSegmentsDuration += milChunks.length * DUR_SHORT;
      }
      
      // achievementRank 每个chunk固定 DUR_SHORT (7秒)
      if (orderedTypes.includes('achievementRank') && achChunks.length > 0) {
        edSegmentsDuration += achChunks.length * DUR_SHORT;
      }
      
      // subRankTitle 固定 DUR_SECTION_TITLE (2秒)
      if (orderedTypes.includes('subRankTitle')) {
        edSegmentsDuration += DUR_SECTION_TITLE;
      }
      
      const subTotalDuration = edTotalDuration - edSegmentsDuration;
      if (subTotalDuration > 0 && subChunks.length > 0) {
        subDurationPerChunk = Math.max(2, subTotalDuration / subChunks.length);
      }
      log(
        `ED时长 ${edTotalDuration.toFixed(1)}s, ED段落 ${edSegmentsDuration}s, 副榜总时长 ${subTotalDuration.toFixed(1)}s, 副榜每页 ${subDurationPerChunk.toFixed(2)}s (共${subChunks.length}页)`,
      );
    }
  }

  const fadeDuration = config.audioFade ? (config.fadeDuration || 2) : 0;

  // ============== 构建段落上下文 ================
  const ctx: SegmentContext = {
    name,
    data,
    editorConfig,
    config,
    segments,
    base,
    allSongs,
    achievementList,
    newRankList,
    mainRankList,
    subList,
    subChunks,
    subDurationPerChunk,
    fadeDuration,
    introCover,
    milChunks,
    achChunks,
    orderItem: { type: "intro" }, // 初始占位，会在循环中更新
  };

  // ============== 配置驱动的段落渲染 ================
  log("========== 按配置顺序渲染段落 ==========");
  
  // 段落结果类型：包含路径和对应的 orderItem（用于音频混音）
  interface SegmentResultItem {
    path: string;
    orderItem: SegmentOrderItem;
  }
  const segmentResults: SegmentResultItem[] = [];
  
  for (const orderItem of config.segmentOrder) {
    const segmentType = orderItem.type;

    // 获取对应的渲染器
    const renderer = segmentRenderers[segmentType];
    if (!renderer) {
      log(`警告: 找不到 ${segmentType} 的渲染器`);
      continue;
    }

    // 更新 ctx 中的 orderItem
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

  // ============== 清理旧的合并产物 ==========
  // 清理 segments 目录下的临时文件和旧产物
  // 注意：op_mixed.mp4 和 ed_mixed.mp4 现在会被保留，如果已存在则跳过渲染
  log("清理旧的合并产物...");
  const tempFiles = [
    "op_raw.mp4", "ed_raw.mp4",
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

  // ============== 音频混音阶段 ==========
  updateProgress("音频混音", totalSteps - 2, totalSteps);
  
  // 收集需要混音的段落信息
  const opData = data.op || {};
  const edData = editorConfig.ed;
  
  // 找出所有 OP 和 ED 段落组
  const opIndices = segmentResults
    .map((s, i) => s.orderItem.audioMix === 'op' ? i : -1)
    .filter(i => i >= 0);
  const edIndices = segmentResults
    .map((s, i) => s.orderItem.audioMix === 'ed' ? i : -1)
    .filter(i => i >= 0);
  
  // 复制结果用于最终合并
  let finalSegments: string[] = segmentResults.map(s => s.path);
  
  // 处理 OP 混音（多个连续段落合并后替换音频）
  if (opData.bvid && opIndices.length > 0) {
    log(`开始OP混音: bvid=${opData.bvid}, OP段落数量=${opIndices.length}`);
    
    // 检查是否已存在混合后的OP文件
    const opMixedPath = path.join(segments, "op_mixed.mp4");
    if (fs.existsSync(opMixedPath)) {
      log(`OP混音文件已存在，直接使用: op_mixed.mp4`);
      opIndices.forEach((origIdx, i) => {
        finalSegments[origIdx] = i === 0 ? opMixedPath : "";
      });
    } else {
      log(`开始下载OP音频: ${opData.bvid}`);
      const opAudio = await downloadAudio(opData.bvid, `${opData.bvid}.mp3`);
      
      if (opAudio && typeof opAudio === 'string') {
        log(`OP音频下载完成: ${opAudio}`);
        
        const opSegmentPaths = opIndices
          .map(i => segmentResults[i]?.path)
          .filter((p): p is string => !!p);
        
        log(`收集到 ${opSegmentPaths.length} 个OP段落路径: ${opSegmentPaths.map(p => path.basename(p)).join(', ')}`);
        
        if (opSegmentPaths.length > 0) {
          log(`开始合并OP段落: ${opSegmentPaths.length} 个段落`);
          const opMerged = await concatVideos(opSegmentPaths, "op_raw.mp4", segments);
          
          if (opMerged) {
            log(`OP段落合并完成: ${opMerged}`);
            log(`开始替换音频生成OP混音: ${opData.bvid}`);
            const opMixed = await replaceAudio(opMerged, opAudio, "op_mixed.mp4", segments);
            
            if (opMixed) {
              log(`OP混音完成: ${opMixed}`);
              // 用混音后的视频替换回原来 OP 段落的位置
              opIndices.forEach((origIdx, i) => {
                finalSegments[origIdx] = i === 0 ? opMixed : "";
              });
            } else {
              log(`警告: OP音频替换失败`);
            }
          } else {
            log(`警告: OP段落合并失败`);
          }
        } else {
          log(`警告: 没有找到有效的OP段落路径`);
        }
      } else {
        log(`警告: OP音频下载失败或返回空`);
      }
    }
  } else {
    log(`OP混音跳过: bvid=${opData.bvid || '空'}, OP段落数量=${opIndices.length}`);
  }
  
  // 处理 ED 混音（多个连续段落合并后替换音频）
  if (edData?.bvid && edIndices.length > 0) {
    // 检查是否已存在混合后的ED文件
    const edMixedPath = path.join(segments, "ed_mixed.mp4");
    if (fs.existsSync(edMixedPath)) {
      log(`ED混音文件已存在，直接使用: ed_mixed.mp4`);
      edIndices.forEach((origIdx, i) => {
        finalSegments[origIdx] = i === 0 ? edMixedPath : "";
      });
    } else {
      const edAudio = await downloadAudio(edData.bvid, `${edData.bvid}.mp3`);
      if (edAudio && typeof edAudio === 'string') {
        const edSegmentPaths = edIndices
          .map(i => segmentResults[i]?.path)
          .filter((p): p is string => !!p);
        if (edSegmentPaths.length > 0) {
          const edMerged = await concatVideos(edSegmentPaths, "ed_raw.mp4", segments);
          if (edMerged) {
            log(`ED 混音: ${edSegmentPaths.length} 个段落 (${edData.bvid})`);
            const edMixed = await replaceAudio(edMerged, edAudio, "ed_mixed.mp4", segments);
            if (edMixed) {
              // 用混音后的视频替换回原来 ED 段落的位置
              edIndices.forEach((origIdx, i) => {
                finalSegments[origIdx] = i === 0 ? edMixed : "";
              });
            }
          }
        }
      }
    }
  }
  
  // 过滤掉空字符串（被合并的段落）
  const uniqueSegments = finalSegments.filter(s => s && s.length > 0);
  
  // ============== 最终合并 ==========
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
