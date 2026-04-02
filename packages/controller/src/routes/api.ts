/**
 * API 路由模块
 *
 * 提供视频生成控制器的所有 RESTful API 接口
 *
 * @module routes/api
 * @description 提供数据文件管理、分片视频管理、合成任务控制、歌曲裁切设置、原视频下载、期刊配置管理等功能的 API 接口
 */

import synthesisRouter from './synthesis.js';
import configRouter from './config.js';
import clipsRouter from './clips.js';

import express, { Router } from 'express';
import multer from 'multer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// ==================== 初始化和导入 ====================

/**
 * ES 模块中没有全局 __dirname，需要手动定义
 * @constant {string}
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 导入共享配置
import { DIR_DATA, DIR_VIDEO_ROOT, PORT, type SongInfo } from 'shared-config';

// 导入任务状态管理
import {
  getTask,
  resetTask,
  setTaskStatus,
  log,
  TASK_STATUS,
} from '../state.js';

import { getPaths } from '../utils/helpers.js';
import { detectIssueType, getIssueConfig } from 'shared-config';
import { downloadFullVideo, getFullVideoInfo } from '../utils/fullVideo.js';

// 导入裁切设置管理
import {
  getClipSetting,
  setClipSetting,
  deleteClipSetting,
  getAllClipSettings,
} from '../utils/clips.js';

/**
 * Express 路由器实例
 * @constant {express.Router}
 */
const router: Router = express.Router();
router.use("/synthesis", synthesisRouter)
router.use("", configRouter)
router.use("/clips", clipsRouter)

// ==================== Multer 文件上传配置 ====================

/**
 * 分段视频上传存储配置
 * 文件保存到: {DIR_VIDEO_ROOT}/{date}/segments/
 * 文件名编码: Latin-1 转 UTF-8（处理中文文件名）
 *
 * @type {multer.StorageEngine}
 */
const segmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const date = req.body.date;
    if (!date) return cb(new Error("缺少日期参数"), "");
    const dir = path.join(DIR_VIDEO_ROOT, date, "segments");
    fs.ensureDirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // 将 Latin-1 编码的文件名转换为 UTF-8，解决中文文件名乱码问题
    file.originalname = Buffer.from(file.originalname, "latin1").toString(
      "utf8",
    );
    cb(null, file.originalname);
  },
});

/**
 * 分段视频上传中间件
 * @type {multer.Multer}
 */
const uploadSegment = multer({ storage: segmentStorage });

/**
 * 数据文件上传存储配置
 * 文件保存到: {DIR_DATA}/
 * 文件名编码: Latin-1 转 UTF-8（处理中文文件名）
 *
 * @type {multer.StorageEngine}
 */
const dataStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, DIR_DATA),
  filename: (req, file, cb) => {
    // 将 Latin-1 编码的文件名转换为 UTF-8，解决中文文件名乱码问题
    file.originalname = Buffer.from(file.originalname, "latin1").toString(
      "utf8",
    );
    cb(null, file.originalname);
  },
});

/**
 * 数据文件上传中间件
 * @type {multer.Multer}
 */
const uploadData = multer({ storage: dataStorage });

// ==================== 数据文件管理 API ====================

/**
 * POST /api/upload
 *
 * 上传数据文件到 /data 目录
 *
 * @route {POST} /api/upload
 * @group 数据文件管理
 * @param {File[]} req.files - 要上传的文件数组（字段名: "files"）
 * @returns {Object} res - 上传结果
 * @returns {string} res.status - 状态标识 "success"
 * @returns {string[]} res.files - 上传成功的文件名列表
 *
 * @example
 * // 请求
 * const formData = new FormData();
 * formData.append('files', file1);
 * formData.append('files', file2);
 * fetch('/api/upload', { method: 'POST', body: formData });
 *
 * // 响应
 * { "status": "success", "files": ["2025-01-15.json", "2025-01.json"] }
 */
router.post("/upload", uploadData.array("files"), (req, res) => {
  const files = (req.files as Express.Multer.File[]) ?? [];
  const names = files.map((f) => f.filename);
  log(`上传数据文件: ${names.join(", ")}`);
  res.send({ status: "success", files: names });
});

/**
 * GET /api/files
 *
 * 获取所有期刊数据文件及其状态
 *
 * @route {GET} /api/files
 * @group 数据文件管理
 * @returns {Object} res - 文件列表结果
 * @returns {Object[]} res.files - 文件信息数组
 * @returns {string} res.files[].date - 期刊日期（文件名去掉.json后缀）
 * @returns {string} res.files[].dataFile - 数据文件名
 * @returns {boolean} res.files[].hasConfig - 是否存在编辑器配置文件
 * @returns {boolean} res.files[].hasVideo - 是否已生成完整视频
 * @returns {string} res.files[].issueType - 期刊类型（weekly/monthly/special）
 * @returns {string} res.files[].issueTypeName - 期刊类型中文名称
 *
 * @example
 * // 响应
 * {
 *   "files": [
 *     {
 *       "date": "2025-01",
 *       "dataFile": "2025-01.json",
 *       "hasConfig": true,
 *       "hasVideo": true,
 *       "issueType": "monthly",
 *       "issueTypeName": "月刊"
 *     }
 *   ]
 * }
 */
router.get("/files", async (req, res) => {
  try {
    const files = await fs.readdir(DIR_DATA);

    // 过滤符合命名规则的期刊数据文件
    const dataFiles = files.filter((f) =>
      /^\d{4}-\d{2}(-\d{2})?\.json$/.test(f),
    );

    // 并行查询每个文件的状态信息
    const result = await Promise.all(
      dataFiles.map(async (f) => {
        const date = f.replace(".json", "");
        const { final } = getPaths(date);
        const hasVideo = await fs.pathExists(final);
        const issueType = detectIssueType(date);
        const hasConfig = await fs.pathExists(
          path.join(DIR_DATA, `${date}_config.json`),
        );

        return {
          date,
          dataFile: f,
          hasConfig,
          hasVideo,
          issueType,
          issueTypeName:
            issueType === "weekly"
              ? "周刊"
              : issueType === "monthly"
                ? "月刊"
                : "特刊",
        };
      }),
    );

    // 按日期倒序排列
    res.send({ files: result.sort((a, b) => b.date.localeCompare(a.date)) });
  } catch (e: any) {
    res.status(500).send({ error: e.message });
  }
});

// ==================== 分片管理 API ====================

/**
 * GET /api/segments
 *
 * 获取指定日期的分段视频列表
 *
 * @route {GET} /api/segments
 * @group 分片管理
 * @param {string} req.query.date - 期刊日期（必需）
 * @returns {Object} res - 分片列表结果
 * @returns {string[]} res.segments - 分片文件名数组（已排序）
 *
 * @example
 * // 请求
 * fetch('/api/segments?date=2025-01-15')
 *
 * // 响应
 * { "segments": ["intro.mp4", "rank_new_001.mp4", "rank_new_002.mp4", "outro.mp4"] }
 */
router.get("/segments", async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).send({ error: "缺少日期参数" });
  try {
    const { segments } = getPaths(date as string);
    if (!(await fs.pathExists(segments))) {
      return res.send({ segments: [] });
    }
    const files = await fs.readdir(segments);
    // 过滤掉 _raw.mp4 中间文件，只返回最终分片
    const filtered = files
      .filter((f) => f.endsWith(".mp4") && !f.endsWith("_raw.mp4"))
      .sort();
    res.send({ segments: filtered });
  } catch (e: any) {
    res.status(500).send({ error: e.message });
  }
});

// ==================== 任务控制 API ====================

/**
 * GET /api/status
 *
 * 获取当前合成任务的状态
 *
 * @route {GET} /api/status
 * @group 任务控制
 * @returns {Object} res - 任务状态对象
 * @returns {string} res.status - 任务状态（idle/processing/completed/failed）
 * @returns {string|null} res.date - 当前处理的日期
 * @returns {string|null} res.currentSegment - 当前处理的分片
 * @returns {number|null} res.progress - 进度百分比（0-100）
 * @returns {number|null} res.totalSegments - 总分片数
 * @returns {number|null} res.completedSegments - 已完成分片数
 * @returns {string|null} res.message - 状态描述信息
 * @returns {string|null} res.error - 错误信息（如果有）
 *
 * @example
 * // 响应
 * {
 *   "status": "processing",
 *   "date": "2025-01-15",
 *   "currentSegment": "rank_new_003.mp4",
 *   "progress": 30,
 *   "totalSegments": 10,
 *   "completedSegments": 3,
 *   "message": "正在渲染分片 4/10",
 *   "error": null
 * }
 */
router.get("/status", (req, res) => res.send(getTask()));


// ==================== 歌曲和裁切管理 API ====================

/**
 * GET /api/songs/:date
 *
 * 获取指定期刊的所有歌曲信息及其裁切设置
 * 返回新曲榜和主榜的歌曲列表，并附带裁切设置和原视频下载状态
 *
 * @route {GET} /api/songs/:date
 * @group 歌曲和裁切管理
 * @param {string} req.params.date - 期刊日期（路径参数）
 * @returns {Object} res - 歌曲列表结果
 * @returns {string} res.date - 期刊日期
 * @returns {Object} res.songs - 歌曲分组对象
 * @returns {Object[]} res.songs.newRank - 新曲榜歌曲列表
 * @returns {Object[]} res.songs.mainRank - 主榜歌曲列表
 * @returns {number} res.index - 期刊序号
 * @returns {string} res.issueType - 期刊类型
 * @returns {Object} res.config - 配置信息
 * @returns {string} res.config.name - 期刊名称
 * @returns {number} res.config.newRankCount - 新曲榜数量
 * @returns {number} res.config.mainRankCount - 主榜数量
 * @returns {boolean} res.config.showCount - 是否显示计数
 * @returns {number} res.config.trendCount - 趋势统计天数
 * @returns {string} res.config.trendKey - 趋势字段键名
 * @returns {number[]} res.config.subRankRange - 排名范围
 *
 * @example
 * // 请求
 * fetch('/api/songs/2025-01-15')
 *
 * // 响应
 * {
 *   "date": "2025-01-15",
 *   "songs": {
 *     "newRank": [
 *       {
 *         "bvid": "BV1xx411c7mD",
 *         "title": "歌曲标题",
 *         "rank": 1,
 *         "_type": "new",
 *         "_clip": { "startTime": 10.5, "endTime": 25.0 },
 *         "_videoExists": true,
 *         "_videoUrl": "/downloads/BV1xx411c7mD.mp4"
 *       }
 *     ],
 *     "mainRank": [...]
 *   },
 *   "index": 100,
 *   "issueType": "weekly",
 *   "config": {
 *     "name": "第100期",
 *     "newRankCount": 10,
 *     "mainRankCount": 20,
 *     "showCount": true,
 *     "trendCount": 7,
 *     "trendKey": "daily_trends",
 *     "subRankRange": [1, 10]
 *   }
 * }
 */
router.get("/songs/:date", async (req, res) => {
  const { date } = req.params;
  const dataFile = path.join(DIR_DATA, `${date}.json`);
  const infoFile = path.join(DIR_DATA, `${date}信息.json`);

  if (!fs.existsSync(dataFile)) {
    return res.status(404).send({ error: "数据文件不存在" });
  }

  try {
    const data = await fs.readJson(dataFile);
    const infoData = fs.existsSync(infoFile) ? await fs.readJson(infoFile) : {};
    const config = getIssueConfig(date, infoData);


    const achievementField = config.dataFields?.newachievement || "achievement_data";
    const newRankField = config.dataFields?.newRank || "new_rank_top10";
    const mainRankField = config.dataFields?.mainRank || "total_rank_top20";

    // 提取歌曲列表（根据配置中的数量限制）
    const achievementList: SongInfo[] = config.sections.newachievement?.enabled
      ? (data[achievementField] || []).slice(0, config.achievementCount)
      : [];
    const newRankList: SongInfo[] = config.sections.newRank?.enabled
      ? (data[newRankField] || []).slice(0, config.newRankCount)
      : [];
    const mainRankList: SongInfo[] = config.sections.mainRank?.enabled
      ? (data[mainRankField] || []).slice(0, config.mainRankCount)
      : [];

    // 为每首歌曲添加裁切设置和视频下载状态
    const enrichSong = (song: SongInfo, type: any) => {
      const clip = getClipSetting(song.bvid);
      const video = getFullVideoInfo(song.bvid);
      return {
        ...song,
        _type: type,
        _clip: clip,
        _videoExists: video.exists,
        _videoUrl: video.exists ? video.url : null,
      };
    };

    const songs = {
      newachievement: achievementList.map((s: SongInfo) => enrichSong(s, "achievement")),
      newRank: newRankList.map((s: SongInfo) => enrichSong(s, "new")),
      mainRank: mainRankList.map((s: SongInfo) => enrichSong(s, "main")),
    };

    res.send({
      date,
      songs,
      index: data.index,
      issueType: config._type,
      config: {
        name: config.name,
        achievementCount: config.achievementCount,
        newRankCount: config.newRankCount,
        mainRankCount: config.mainRankCount,
        showCount: config.showCount,
        trendCount: config.trendCount,
        trendKey: config.trendKey,
        subRankRange: config.subRankRange,
      },
    });
  } catch (e: any) {
    res.status(500).send({ error: e.message });
  }
});




/**
 * 导出 Express 路由器
 * @type {express.Router}
 */
export default router;
