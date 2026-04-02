// synthesis/task.js (ES模块最终版本)
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// 修复1：ES模块导入所有依赖，补全.js后缀
import { DIR_DATA, DIR_DOWNLOADS, PORT, STAFF_LIST, USE_GPU, type SongInfo } from 'shared-config';
import { log, updateProgress, setTaskStatus, TASK_STATUS } from '../state.js';
import { getPaths, chunkArray } from '../utils/helpers.js';
import { getIssueConfig } from 'shared-config';
import {
  downloadImage,
  downloadClip,
  downloadAudio,
} from '../utils/download.js';
import {
  concatVideos,
  processP1,
  processP3,
  finalMerge,
  getDuration,
  addAudioFade,
  execPromise,
} from '../utils/ffmpeg.js';
import {
  renderComposition,
  renderCompositionRaw,
  renderRankSegment,
  renderStill,
} from '../utils/render.js';
import { getClipSetting } from '../utils/clips.js';
import type { EditorConfig, RankingData, RenderSongInfo } from '../types/index.js';

// 基础时长配置
const FPS = 60;
const DUR_INTRO = 3;
const DUR_SHORT = 7;
const DUR_SECTION_TITLE = 2;
const DUR_RULES = 35;

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
async function renderRankBatch(songs: RenderSongInfo[], type: string, segments: string, config: Record<string, any>) {
  const results = new Array(songs.length);
  let currentIndex = 0;
  const typeName = type === "new" ? "新曲榜" : type === "achievement" ? "成就展示" : "主榜";

  async function worker(workerId: number) {
    for(const [index, song] of songs.entries()) {

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

      results[index] = await renderRankSegment(
        song,
        vid,
        thumb,
        type,
        segments,
        song._duration,
        config,
      );

      log(`[W${workerId}] 完成: ${typeName} ${song.rank}`);
    }
  }

  log(`========== 并行渲染 ${typeName} (${RENDER_POOL_SIZE}路) ==========`);
  await Promise.all(
    Array.from({ length: RENDER_POOL_SIZE }, (_, i) => worker(i + 1)),
  );

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

        const renderFn = config.audioFade
          ? renderComposition
          : renderCompositionRaw;

        return await renderFn(
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
        );
      }),
    );
    results.push(...batchResults);
  }

  return results.filter(Boolean);
}

// ========== 主合成任务 ==========

/**
 * 核心中的核心！这里就是执行生成视频任务
 * @param {string} date 
 */
async function runSynthesisTask(date: string) {
  const { base, segments, final } = getPaths(date);
  const dataFile = path.join(DIR_DATA, `${date}.json`);
  const configFile = path.join(DIR_DATA, `${date}_config.json`);

  log("读取数据");
  const data: RankingData = await fs.readJson(dataFile);

  // 读取编辑器配置
  const editorConfig: EditorConfig = await fs.readJson(configFile);
  /* 配置文件还能没有吗？那我也不知道怎么办 
  if (await fs.pathExists(configFile)) {
    editorConfig = await fs.readJson(configFile);
    log("已加载编辑器配置");
  }
  */
  // 获取期刊配置
  const config = getIssueConfig(date, {});
  log(`期刊类型: ${config.name} (${config._type})`);

  const totalSteps = 70;
  updateProgress("准备", 0, totalSteps);

  const listP1 = [];
  const listP2 = [];
  const listP3_pre:string[] = [];
  const listP3_sub = [];

  let progressCounter = 0;

  // ========== 封面选择 ==========
  let introCover = "";
  if (editorConfig.cover && editorConfig.cover.image_url) {
    introCover = await downloadImage(editorConfig.cover.image_url);
    log(`封面: 使用指定 ${editorConfig.cover.bvid}`);
  } else {
    const mainRankField = config.dataFields?.mainRank || "total_rank_top20";
    const mainRankList = data[mainRankField] || [];
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

  // ========== 生成视频封面 ==========
  const coverFrame = (config.sections.intro?.duration || DUR_INTRO) * FPS - 31;
  const coverFileName = `${date}.png`;
  const coverPath = path.join(base, coverFileName);

  if (fs.existsSync(coverPath)) {
    fs.unlinkSync(coverPath);
    log("删除旧封面，重新生成");
  }

  await renderStill(
    "Intro",
    {
      issue: `#${data.index}`,
      date: formatDate(date),
      coverImg: introCover,
      issueType: config._type,
    },
    coverFileName,
    base,
    coverFrame,
  );
  log(`封面已生成: ${coverFileName}`);
  updateProgress("封面", ++progressCounter, totalSteps);

  // ========== 准备素材阶段 ==========
  const achievementField = config.dataFields?.newachievement || "achievement_data";
  const newRankField = config.dataFields?.newRank || "new_rank_top10";
  const mainRankField = config.dataFields?.mainRank || "total_rank_top20";

  const achievementList: RenderSongInfo[] = config.sections.newachievement?.enabled
    ? (data[achievementField] || []).slice(0, config.achievementCount)
    : [];
  const newRankList: RenderSongInfo[] = config.sections.newRank?.enabled
    ? (data[newRankField] || []).slice(0, config.newRankCount)
    : [];
  const mainRankList: RenderSongInfo[] = config.sections.mainRank?.enabled
    ? (data[mainRankField] || []).slice(0, config.mainRankCount)
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

  // ========== P1 渲染 ==========
  const renderFn = config.audioFade ? renderComposition : renderCompositionRaw;

  // P1: Intro
  if (config.sections.intro?.enabled) {
    listP1.push(
      await renderFn(
        "Intro",
        {
          issue: `#${data.index}`,
          date: formatDate(date),
          coverImg: introCover,
          issueType: config._type,
        },
        "01_Intro.mp4",
        segments,
        config.sections.intro.duration || DUR_INTRO,
      ),
    );
    updateProgress("片头", ++progressCounter, totalSteps);
  }

  // P1: InfoCard
  if (config.sections.infoCard?.enabled) {
    const opData = data.op || {};
    const opCover = await downloadImage(opData.image_url);
    listP1.push(
      await renderFn(
        "InfoCard",
        {
          opLabel: config.lastPeriodLabel
            ? `OP / ${config.lastPeriodLabel}冠军`
            : "OP / 上期冠军",
          opTitle: opData.title || "未知",
          opArtist: opData.author || "Unknown",
          opCover,
          timeLabel: "统计时间",
          timeRange: data.period,
          note: editorConfig.script?.opening || `第${data.index}期`,
          issueType: config._type,
        },
        "02_InfoCard.mp4",
        segments,
        config.sections.infoCard.duration || 5,
      ),
    );
    updateProgress("信息卡", ++progressCounter, totalSteps);
  }

  // P1: 规则页面
  if (config.sections.rules?.enabled) {
    listP1.push(
      await renderComposition(
        "RulesAndAchivements",
        {
          issueType: config._type, // "weekly" | "monthly" | "special"
        },
        "03_Rules.mp4",
        segments,
        config.sections.rules.duration || DUR_RULES,
      ),
    );
  }

  // P1: 成就展示标题
  if (config.sections.achievementTitle?.enabled && achievementList.length > 0) {
    const titleConfig = config.sections.achievementTitle;
    listP1.push(
      await renderFn(
        "SectionTitle",
        {
          title: config.achievementTitleFull || `本周共有 ${config.achievementCount} 首歌曲达成周刊成就`,
          showNumber: false,
          titleStyle:{
            fontSize: 110,
            fontWeight: "1000",
            textAlign: "center"
          },
          themeColor: titleConfig.color || "#FFD700",
          edName: "",
          edAuthor: "",
        },
        "04_newAchievement.mp4",
        segments,
        titleConfig.duration || DUR_SECTION_TITLE,
      ),
    );
    updateProgress("成就展示标题", ++progressCounter, totalSteps);
  }

  // 成就展示卡片
  if (config.sections.newachievement?.enabled && achievementList.length > 0) {
    const reversedAchievementList = [...achievementList].reverse();
  
  // 关键：将原始数据转换为组件所需的 props 格式
  const formattedAchievementList = reversedAchievementList.map(item => {
    // 1. 处理趋势数据（将 daily_trends 对象转为数组）
    const trendData = Object.values(item.daily_trends || {}).map(Number);
    
    // 2. 组装信息标签
    const infoTags = [
      { label: "发布日期", value: item.pubdate || "未知" },
      { label: "时长", value: item.duration || "未知" },
      { label: "类型", value: item.type || "未知" },
      { label: "作者", value: item.author || "未知" },
      { label: "演唱", value: item.vocal || "未知" },
    ];
    
    // 3. 处理成就胶囊（取第一个荣誉称号）
    const honorTypeMap: Record<string, string> = {
      "Emerging Hit!": "emerging",
      "Mega Hit!": "mega",
      "门番": "门番",
      "门番候补": "门番候补"
    };
    const honorTitle = item.honor?.[0] || "成就";
    const honorType = honorTypeMap[honorTitle] || "default";
    
    // 4. 拼接视频源（优先用bvid拼接B站视频地址，或用封面图兜底）
    const videoSrc = item.bvid 
      ? `https://www.bilibili.com/video/${item.bvid}` 
      : item.image_url || "";

    return {
      ...item, // 保留原始数据
      // 组件所需的核心props
      videoSrc,
      infoTags,
      honorBadge: { title: honorTitle, type: honorType },
      trendData,
      trendPeriod: "day", // 固定为日趋势
    };
  });

  // 传递格式化后的数据给渲染函数
  const achievementResults = await renderRankBatch(
    formattedAchievementList, // 替换为格式化后的数据
    "achievementCard", // 确保组件名称与导出的一致
    segments,
    config,
  );
  
  listP1.push(...achievementResults); 
  progressCounter += reversedAchievementList.length;
  updateProgress("成就展示完成", progressCounter, totalSteps);
  }


  // P1: 新曲榜标题
  if (config.sections.newRankTitle?.enabled && newRankList.length > 0) {
    const titleConfig = config.sections.newRankTitle;
    listP1.push(
      await renderFn(
        "SectionTitle",
        {
          title: config.newRankTitleFull || `新曲榜 Top ${config.newRankCount}`,
          from: config.newRankCount,
          to: 1,
          themeColor: titleConfig.color || "#23ade5",
          edName: "",
          edAuthor: "",
        },
        "04_SectionTitle_New.mp4",
        segments,
        titleConfig.duration || DUR_SECTION_TITLE,
      ),
    );
    updateProgress("新曲榜标题", ++progressCounter, totalSteps);
  }

  // ========== P2 渲染 ==========

  // P2-A: 新曲榜卡片
  if (config.sections.newRank?.enabled && newRankList.length > 0) {
    const reversedNewList = [...newRankList].reverse();
    const newRankResults = await renderRankBatch(
      reversedNewList,
      "new",
      segments,
      config,
    );
    listP2.push(...newRankResults);
    progressCounter += reversedNewList.length;
    updateProgress("新曲榜完成", progressCounter, totalSteps);
  }

  // P2-B: 主榜标题
  if (config.sections.mainRankTitle?.enabled && mainRankList.length > 0) {
    const titleConfig = config.sections.mainRankTitle;
    listP2.push(
      await renderFn(
        "SectionTitle",
        {
          title: config.mainRankTitleFull || `主榜 Top ${config.mainRankCount}`,
          from: config.mainRankCount,
          to: 1,
          themeColor: titleConfig.color || "#f25d8e",
          edName: "",
          edAuthor: "",
        },
        "05_SectionTitle_Main.mp4",
        segments,
        titleConfig.duration || DUR_SECTION_TITLE,
      ),
    );
  }

  // P2-C: 主榜卡片
  if (config.sections.mainRank?.enabled && mainRankList.length > 0) {
    const reversedMainList = [...mainRankList].reverse();
    const mainRankResults = await renderRankBatch(
      reversedMainList,
      "main",
      segments,
      config,
    );
    listP2.push(...mainRankResults);
    progressCounter += reversedMainList.length;
    updateProgress("主榜完成", progressCounter, totalSteps);
  }

  // ========== P3 前段计算 ==========

  // 百万达成
  const milList = (data.million_record || []).sort(
    (a, b) => b.million_crossed - a.million_crossed,
  );
  const milChunks = chunkArray(milList, 5);

  // 成就达成 (仅周刊)
  const achList = config.sections.achievementRank?.enabled
    ? data.achievement_record || []
    : [];
  const achChunks = chunkArray(achList, 5);

  // 计算 P3 前段固定部分数量
  let p3PreFixedCount = 0;
  if (config.sections.singerRank?.enabled) p3PreFixedCount++;
  if (config.sections.historyRank?.enabled) p3PreFixedCount++;
  if (config.sections.statsCard?.enabled) p3PreFixedCount++;
  if (config.sections.staffCard?.enabled) p3PreFixedCount++;

  const p3PreDynamicCount = milChunks.length + achChunks.length;
  const p3PreDuration =
    (p3PreFixedCount + p3PreDynamicCount) * DUR_SHORT + DUR_SECTION_TITLE;

  // 副榜
  const subRankField = config.dataFields?.subRank || "total_rank_sub";
  const subList: RenderSongInfo[] =
    config.sections.subRank?.enabled && config.subRankRange
      ? (data[subRankField] || [])
          .filter(
            (i: SongInfo) =>
              i.rank >= config.subRankRange[0] &&
              i.rank <= config.subRankRange[1],
          )
          .sort((a: SongInfo, b: SongInfo) => a.rank - b.rank)
      : [];
  const subChunks = chunkArray(subList, config.subRankPerPage || 4);
  const subChunkCount = subChunks.length;

  // 计算副榜每页时长
  let subDurationPerChunk = 3;
  if (editorConfig.ed && editorConfig.ed.bvid) {
    const edAudioPath = await downloadAudio(
      editorConfig.ed.bvid,
      `${editorConfig.ed.bvid}.mp3`,
    );
    if (edAudioPath) {
      const edTotalDuration = await getDuration(edAudioPath);
      const subTotalDuration = edTotalDuration - p3PreDuration;
      if (subTotalDuration > 0 && subChunkCount > 0) {
        subDurationPerChunk = Math.max(2, subTotalDuration / subChunkCount);
      }
      log(
        `ED时长 ${edTotalDuration.toFixed(1)}s, P3前段 ${p3PreDuration}s, 副榜每页 ${subDurationPerChunk.toFixed(2)}s`,
      );
    }
  }

  // P3-Pre: 歌手排名
  if (config.sections.singerRank?.enabled) {
    const singerList = (data.vocal_stats || []).map((s) => ({
      ...s,
      avatar: `http://localhost:${PORT}/config/avatar/${encodeURIComponent(s.name)}.png`,
    }));
    listP3_pre.push(
      await renderFn(
        "SingerRank",
        { list: singerList },
        "06_SingerRank.mp4",
        segments,
        DUR_SHORT,
      ),
    );
  }

  // P3-Pre: 百万达成
  if (config.sections.millionRank?.enabled && milChunks.length > 0) {
    for (let i = 0; i < milChunks.length; i++) {
      const processed = await Promise.all(
        milChunks[i]!.map(async (item) => ({
          ...item,
          image_url: await downloadImage(item.image_url),
        })),
      );
      listP3_pre.push(
        await renderFn(
          "MillionRank",
          { list: processed },
          `07_MillionRank_Page${i + 1}.mp4`,
          segments,
          DUR_SHORT,
        ),
      );
    }
  }

  // P3-Pre: 成就达成 (仅周刊)
  if (config.sections.achievementRank?.enabled && achChunks.length > 0) {
    for (let i = 0; i < achChunks.length; i++) {
      const processed = await Promise.all(
        achChunks[i]!.map(async (item) => ({
          ...item,
          image_url: await downloadImage(item.image_url),
        })),
      );
      listP3_pre.push(
        await renderFn(
          "AchievementRank",
          { list: processed },
          `08_AchievementRank_Page${i + 1}.mp4`,
          segments,
          DUR_SHORT,
        ),
      );
    }
  }

  // P3-Pre: 历史回顾
  if (config.sections.historyRank?.enabled) {
    const historyList = data.history_record || [];
    const historyProcessed = await Promise.all(
      historyList.map(async (item) => ({
        ...item,
        image_url: await downloadImage(item.image_url),
      })),
    );
    listP3_pre.push(
      await renderFn(
        "HistoryRank",
        { list: historyProcessed },
        "09_HistoryRank.mp4",
        segments,
        DUR_SHORT,
      ),
    );
  }

  // P3-Pre: 数据统计
  if (config.sections.statsCard?.enabled) {
    listP3_pre.push(
      await renderFn(
        "StatsCard",
        {
          stat: data.stat,
          comment: editorConfig.script?.ending || data.comment || "",
          topN: config.topN || config.subRankMax || 100,
          pointThresholds: config.pointThresholds,
          newSongPeriod: config.newSongPeriod,
        },
        "10_StatsCard.mp4",
        segments,
        DUR_SHORT,
      ),
    );
  }

  // P3-Pre: Staff
  if (config.sections.staffCard?.enabled) {
    listP3_pre.push(
      await renderFn(
        "StaffCard",
        {
          staffList: STAFF_LIST.map((s) => ({
            ...s,
            avatar: `http://localhost:${PORT}/config/staff/${encodeURIComponent(s.name)}.jpg`,
          })),
        },
        "11_StaffCard.mp4",
        segments,
        DUR_SHORT,
      ),
    );
  }

  // P3-Sub: 副榜标题
  if (config.sections.subRankTitle?.enabled && subList.length > 0) {
    const titleConfig = config.sections.subRankTitle;
    listP3_pre.push(
      await renderFn(
        "SectionTitle",
        {
          title:
            config.subRankTitleFull || `副榜 Top ${config.subRankMax || 100}`,
          from: config.subRankRange ? config.subRankRange[0] : 21,
          to: config.subRankRange ? config.subRankRange[1] : 100,
          themeColor: titleConfig.color || "#66ccff",
          edName: editorConfig.ed?.name || "",
          edAuthor: editorConfig.ed?.author || "",
        },
        "12_SubRankTitle.mp4",
        segments,
        DUR_SECTION_TITLE,
      ),
    );
  }

  // P3-Sub: 副榜卡片
  if (config.sections.subRank?.enabled && subChunks.length > 0) {
    const subRankResults = await renderSubRankBatch(
      subChunks,
      segments,
      subDurationPerChunk,
      config,
    );
    listP3_sub.push(...subRankResults);
    progressCounter += subChunkCount;
    updateProgress("副榜完成", progressCounter, totalSteps);
  }

  // ========== 清理旧的合并产物 ==========
  const mergeProducts = [
    "p1_raw.mp4",
    "p1_final.mp4",
    "p2_main.mp4",
    "p3_pre.mp4",
    "p3_sub_raw.mp4",
    "p3_final.mp4",
    "p3_final_fallback.mp4",
    "files_p1.txt",
    "files_p2.txt",
    "files_p3_pre.txt",
    "files_p3_sub.txt",
    "files_final_fallback.txt",
  ];

  log("清理旧的合并产物...");
  for (const file of mergeProducts) {
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

  // ========== 合并阶段 ==========
  updateProgress("合并", totalSteps - 5, totalSteps);

  // P1 合并
  let p1Final: string = null;
  if (listP1.length > 0) {
    log("合并 P1");
    const p1Raw = await concatVideos(listP1, "p1_raw.mp4", segments);
    p1Final = p1Raw;

    const opData = data.op || {};
    if (opData.bvid) {
      const opAudio = await downloadAudio(opData.bvid, `${opData.bvid}.mp3`);
      if (opAudio && p1Raw) {
        log("混音 OP");
        p1Final = await processP1(p1Raw, opAudio, "p1_final.mp4", segments);
      }
    }
  }
  if (!p1Final) throw Error("合并第一段视频出错")

  // P2 合并
  let p2Final = null;
  if (listP2.length > 0) {
    log("合并 P2");
    p2Final = await concatVideos(listP2, "p2_main.mp4", segments);
  }

  if (!p2Final) throw Error("合并第二段视频出错")

  // P3 合并
  let p3Final = null;
  if (listP3_pre.length > 0 || listP3_sub.length > 0) {
    log("合并 P3");
    const p3Pre =
      listP3_pre.length > 0
        ? await concatVideos(listP3_pre, "p3_pre.mp4", segments)
        : null;
    const p3Sub =
      listP3_sub.length > 0
        ? await concatVideos(listP3_sub, "p3_sub_raw.mp4", segments)
        : null;

    if (editorConfig.ed && editorConfig.ed.bvid && p3Pre && p3Sub) {
      const edAudio = await downloadAudio(
        editorConfig.ed.bvid,
        `${editorConfig.ed.bvid}.mp3`,
      );
      if (edAudio) {
        log("混音 ED");
        p3Final = await processP3(
          p3Pre,
          p3Sub,
          edAudio,
          "p3_final.mp4",
          segments,
        );
      }
    }

    if (!p3Final) {
      const p3Parts = [p3Pre, p3Sub].filter(Boolean);
      if (p3Parts.length > 0) {
        p3Final = await concatVideos(
          p3Parts,
          "p3_final_fallback.mp4",
          segments,
        );
      }
    }
  }

  // 最终合并
  updateProgress("最终合并", totalSteps - 1, totalSteps);
  log(`输出 ${final}`);

  const finals = [p1Final, p2Final, p3Final].filter(Boolean);

  if (finals.length === 3) {
    await finalMerge(finals[0], finals[1], finals[2], final);
  } else if (finals.length > 0) {
    const listPath = path.join(segments, "files_final_fallback.txt");
    const content = finals
      .map((p) => `file '${p.replace(/\\/g, "/")}'`)
      .join("\n");
    fs.writeFileSync(listPath, content);
    await execPromise(
      `ffmpeg -f concat -safe 0 -i "${listPath}" -c copy "${final}" -y`,
    );
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
