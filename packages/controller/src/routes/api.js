/**
 * API 路由模块
 *
 * 提供视频生成控制器的所有 RESTful API 接口
 *
 * @module routes/api
 * @description 提供数据文件管理、分片视频管理、合成任务控制、歌曲裁切设置、原视频下载、期刊配置管理等功能的 API 接口
 */

import express from 'express';
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
import { DIR_DATA, DIR_VIDEO_ROOT, PORT } from 'shared-config';

// 导入任务状态管理
import {
  getTask,
  resetTask,
  setTaskStatus,
  log,
  TASK_STATUS,
} from '../state.js';

// 导入工具函数
import { getPaths } from '../utils/helpers.js';
import { getIssueConfig, detectIssueType } from 'shared-config';
import { downloadFullVideo, getFullVideoInfo } from '../utils/fullVideo.js';

// 导入合成任务
import {
  runSynthesisTask,
} from '../synthesis/task.js';

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
const router = express.Router();

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
    if (!date) return cb(new Error("缺少日期参数"));
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
  const names = req.files.map((f) => f.filename);
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
  } catch (e) {
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
    const { segments } = getPaths(date);
    if (!(await fs.pathExists(segments))) {
      return res.send({ segments: [] });
    }
    const files = await fs.readdir(segments);
    // 过滤掉 _raw.mp4 中间文件，只返回最终分片
    const filtered = files
      .filter((f) => f.endsWith(".mp4") && !f.endsWith("_raw.mp4"))
      .sort();
    res.send({ segments: filtered });
  } catch (e) {
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

/**
 * POST /api/synthesis/start
 *
 * 启动完整的视频合成流程（渲染所有分片 + 合并）
 * 任务在后台异步执行，需轮询 /api/status 获取进度
 *
 * @route {POST} /api/synthesis/start
 * @group 任务控制
 * @param {Object} req.body - 请求体
 * @param {string} req.body.date - 期刊日期（必需）
 * @returns {Object} res - 启动结果
 * @returns {string} res.status - 状态标识 "started"
 * @returns {string} res.issueType - 期刊类型（weekly/monthly/special）
 *
 * @example
 * // 请求
 * fetch('/api/synthesis/start', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ date: '2025-01-15' })
 * })
 *
 * // 响应
 * { "status": "started", "issueType": "weekly" }
 *
 * // 错误响应
 * { "error": "缺少日期" }
 * { "error": "任务进行中" }
 */
router.post("/synthesis/start", async (req, res) => {
  const { date } = req.body;
  const task = getTask();

  if (!date) return res.status(400).send({ error: "缺少日期" });
  if (task.status === TASK_STATUS.PROCESSING) {
    return res.status(400).send({ error: "任务进行中" });
  }

  resetTask(date);

  const issueType = detectIssueType(date);
  const typeName =
    issueType === "weekly" ? "周刊" : issueType === "monthly" ? "月刊" : "特刊";
  log(`开始${typeName}合成: ${date}`);

  res.send({ status: "started", issueType });

  // 后台异步执行合成任务
  runSynthesisTask(date).catch((e) => {
    setTaskStatus(TASK_STATUS.FAILED, e.message);
    log(`任务失败: ${e.message}`);
  });
});

/**
 * POST /api/synthesis/merge
 *
 * 仅合并现有的分段视频，不重新渲染
 * 复用已存在的分片文件，直接执行合并操作
 *
 * @route {POST} /api/synthesis/merge
 * @group 任务控制
 * @param {Object} req.body - 请求体
 * @param {string} req.body.date - 期刊日期（必需）
 * @returns {Object} res - 启动结果
 * @returns {string} res.status - 状态标识 "started"
 *
 * @example
 * // 请求
 * fetch('/api/synthesis/merge', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ date: '2025-01-15' })
 * })
 *
 * // 响应
 * { "status": "started" }
 *
 * // 错误响应
 * { "error": "缺少日期" }
 * { "error": "任务进行中" }
 */
router.post("/synthesis/merge", async (req, res) => {
  const { date } = req.body;
  const task = getTask();

  if (!date) return res.status(400).send({ error: "缺少日期" });
  if (task.status === TASK_STATUS.PROCESSING) {
    return res.status(400).send({ error: "任务进行中" });
  }

  resetTask(date);
  log(`开始合并: ${date}`);
  res.send({ status: "started" });

  // 优先使用仅合并函数，如果不存在则使用完整合成任务
  const fn =
    typeof runMergeOnly === "function" ? runMergeOnly : runSynthesisTask;
  fn(date).catch((e) => {
    setTaskStatus(TASK_STATUS.FAILED, e.message);
    log(`合并失败: ${e.message}`);
  });
});

/**
 * POST /api/synthesis/segment
 *
 * 删除指定分片，使其在下次合成时重新生成
 * 同时删除对应的 _raw.mp4 中间文件（如果存在）
 *
 * @route {POST} /api/synthesis/segment
 * @group 任务控制
 * @param {Object} req.body - 请求体
 * @param {string} req.body.date - 期刊日期（必需）
 * @param {string} [req.body.type] - 类型（new/main），与 rank 配合使用
 * @param {number} [req.body.rank] - 排名，与 type 配合使用
 * @param {string} [req.body.segmentName] - 直接指定分片文件名，优先级高于 type+rank
 * @returns {Object} res - 删除结果
 * @returns {string} res.status - 状态标识 "success"
 * @returns {string} res.message - 操作结果描述
 *
 * @example
 * // 示例1：使用 type + rank
 * fetch('/api/synthesis/segment', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ date: '2025-01-15', type: 'new', rank: 1 })
 * })
 *
 * // 示例2：使用 segmentName
 * fetch('/api/synthesis/segment', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ date: '2025-01-15', segmentName: 'intro.mp4' })
 * })
 *
 * // 响应
 * { "status": "success", "message": "已删除 rank_new_001.mp4，下次合成时会重新生成" }
 */
router.post("/synthesis/segment", async (req, res) => {
  const { date, type, rank, segmentName } = req.body;
  const task = getTask();

  if (!date) return res.status(400).send({ error: "缺少日期" });
  if (task.status === TASK_STATUS.PROCESSING) {
    return res.status(400).send({ error: "任务进行中" });
  }

  try {
    const { segments } = getPaths(date);
    let targetFile = segmentName;

    // 根据类型和排名构建文件名（格式：rank_{type}_{排名补零}.mp4）
    if (type && rank) {
      targetFile = `rank_${type}_${rank.toString().padStart(3, "0")}.mp4`;
    }

    if (targetFile) {
      const filePath = path.join(segments, targetFile);
      const rawName = targetFile.replace(".mp4", "_raw.mp4");
      const rawPath = path.join(segments, rawName);

      // 删除分片文件
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
        log(`删除分片: ${targetFile}`);
      }

      // 删除中间文件（如果存在）
      if (await fs.pathExists(rawPath)) {
        await fs.remove(rawPath);
        log(`删除中间文件: ${rawName}`);
      }
    }

    res.send({
      status: "success",
      message: `已删除 ${targetFile}，下次合成时会重新生成`,
    });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

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
    const achievementList = config.sections.newachievement?.enabled
      ? (data[achievementField] || []).slice(0, config.achievementCount)
      : [];
    const newRankList = config.sections.newRank?.enabled
      ? (data[newRankField] || []).slice(0, config.newRankCount)
      : [];
    const mainRankList = config.sections.mainRank?.enabled
      ? (data[mainRankField] || []).slice(0, config.mainRankCount)
      : [];

    // 为每首歌曲添加裁切设置和视频下载状态
    const enrichSong = (song, type) => {
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
      newachievement: achievementList.map((s) => enrichSong(s, "achievement")),
      newRank: newRankList.map((s) => enrichSong(s, "new")),
      mainRank: mainRankList.map((s) => enrichSong(s, "main")),
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
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

/**
 * GET /api/clips
 *
 * 获取所有歌曲的裁切设置
 *
 * @route {GET} /api/clips
 * @group 歌曲和裁切管理
 * @returns {Object.<string, Object>} res - 裁切设置对象（键为 bvid，值为裁切配置）
 * @returns {string} res[bvid].bvid - 视频 BVID
 * @returns {number} res[bvid].startTime - 起始时间（秒）
 * @returns {number} [res[bvid].endTime] - 结束时间（秒，可选）
 *
 * @example
 * // 响应
 * {
 *   "BV1xx411c7mD": {
 *     "bvid": "BV1xx411c7mD",
 *     "startTime": 10.5,
 *     "endTime": 25.0
 *   },
 *   "BV1yy411c7mE": {
 *     "bvid": "BV1yy411c7mE",
 *     "startTime": 0,
 *     "endTime": 30.0
 *   }
 * }
 */
router.get("/clips", (req, res) => {
  res.send(getAllClipSettings());
});

/**
 * GET /api/clips/:bvid
 *
 * 获取指定视频的裁切设置
 *
 * @route {GET} /api/clips/:bvid
 * @group 歌曲和裁切管理
 * @param {string} req.params.bvid - 视频 BVID（路径参数）
 * @returns {Object} res - 裁切设置或未设置标识
 * @returns {string} [res.bvid] - 视频 BVID（已设置时返回）
 * @returns {number} [res.startTime] - 起始时间（秒，已设置时返回）
 * @returns {number} [res.endTime] - 结束时间（秒，已设置时返回）
 * @returns {boolean} [res.exists] - 是否存在裁切设置（未设置时返回 false）
 *
 * @example
 * // 已设置时的响应
 * { "bvid": "BV1xx411c7mD", "startTime": 10.5, "endTime": 25.0 }
 *
 * // 未设置时的响应
 * { "exists": false }
 */
router.get("/clips/:bvid", (req, res) => {
  const clip = getClipSetting(req.params.bvid);
  if (clip) {
    res.send(clip);
  } else {
    res.send({ exists: false });
  }
});

/**
 * POST /api/clips/:bvid
 *
 * 设置或更新视频的裁切时间段
 *
 * @route {POST} /api/clips/:bvid
 * @group 歌曲和裁切管理
 * @param {string} req.params.bvid - 视频 BVID（路径参数）
 * @param {Object} req.body - 请求体
 * @param {number} req.body.startTime - 起始时间（秒，必需，必须 >= 0）
 * @param {number} [req.body.endTime] - 结束时间（秒，可选，不提供表示到视频结尾）
 * @returns {Object} res - 保存结果
 * @returns {boolean} res.success - 是否成功
 * @returns {Object} res.clip - 保存后的裁切设置
 *
 * @example
 * // 请求
 * fetch('/api/clips/BV1xx411c7mD', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ startTime: 10.5, endTime: 25.0 })
 * })
 *
 * // 响应
 * { "success": true, "clip": { "bvid": "BV1xx411c7mD", "startTime": 10.5, "endTime": 25.0 } }
 *
 * // 错误响应
 * { "error": "startTime 无效" }
 */
router.post("/clips/:bvid", (req, res) => {
  const { bvid } = req.params;
  const { startTime, endTime } = req.body;

  if (typeof startTime !== "number" || startTime < 0) {
    return res.status(400).send({ error: "startTime 无效" });
  }

  const result = setClipSetting(bvid, startTime, endTime);
  log(`保存裁切设置: ${bvid} (${result.startTime}s - ${result.endTime}s)`);
  res.send({ success: true, clip: result });
});

/**
 * DELETE /api/clips/:bvid
 *
 * 删除指定视频的裁切设置
 *
 * @route {DELETE} /api/clips/:bvid
 * @group 歌曲和裁切管理
 * @param {string} req.params.bvid - 视频 BVID（路径参数）
 * @returns {Object} res - 删除结果
 * @returns {boolean} res.success - 是否删除成功（不存在时返回 false）
 *
 * @example
 * // 请求
 * fetch('/api/clips/BV1xx411c7mD', { method: 'DELETE' })
 *
 * // 响应
 * { "success": true }
 */
router.delete("/clips/:bvid", (req, res) => {
  const deleted = deleteClipSetting(req.params.bvid);
  if (deleted) {
    log(`删除裁切设置: ${req.params.bvid}`);
  }
  res.send({ success: deleted });
});

// ==================== 视频下载管理 API ====================

/**
 * POST /api/full-video/batch
 *
 * 批量下载 B 站原视频用于预览
 * 任务在后台异步执行，失败的下载会记录日志但不影响其他视频
 *
 * @route {POST} /api/full-video/batch
 * @group 视频下载管理
 * @param {Object} req.body - 请求体
 * @param {string[]} req.body.bvids - 要下载的视频 BVID 数组（必需）
 * @returns {Object} res - 启动结果
 * @returns {boolean} res.success - 是否成功启动
 * @returns {string} res.message - 提示信息
 *
 * @example
 * // 请求
 * fetch('/api/full-video/batch', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ bvids: ['BV1xx411c7mD', 'BV1yy411c7mE'] })
 * })
 *
 * // 响应
 * { "success": true, "message": "开始下载 2 个视频" }
 *
 * // 错误响应
 * { "error": "bvids 必须是数组" }
 */
router.post("/full-video/batch", async (req, res) => {
  const { bvids } = req.body;
  if (!Array.isArray(bvids)) {
    return res.status(400).send({ error: "bvids 必须是数组" });
  }

  res.send({ success: true, message: `开始下载 ${bvids.length} 个视频` });

  // 后台异步批量下载
  for (const bvid of bvids) {
    try {
      await downloadFullVideo(bvid);
    } catch (e) {
      log(`批量下载失败 ${bvid}: ${e.message}`);
    }
  }
});

/**
 * POST /api/full-video/:bvid
 *
 * 下载指定 B 站视频
 *
 * @route {POST} /api/full-video/:bvid
 * @group 视频下载管理
 * @param {string} req.params.bvid - 视频 BVID（路径参数）
 * @returns {Object} res - 下载结果
 * @returns {boolean} res.success - 是否下载成功
 * @returns {string} [res.bvid] - 视频 BVID
 * @returns {string} [res.path] - 本地文件路径
 * @returns {string} [res.url] - 访问 URL
 *
 * @example
 * // 请求
 * fetch('/api/full-video/BV1xx411c7mD', { method: 'POST' })
 *
 * // 响应
 * { "success": true, "bvid": "BV1xx411c7mD", "path": "/storage/downloads/BV1xx411c7mD.mp4", "url": "/downloads/BV1xx411c7mD.mp4" }
 *
 * // 错误响应
 * { "error": "下载失败" }
 */
router.post("/full-video/:bvid", async (req, res) => {
  const { bvid } = req.params;

  try {
    const result = await downloadFullVideo(bvid);
    if (result) {
      res.send({ success: true, ...result });
    } else {
      res.status(500).send({ error: "下载失败" });
    }
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

// ==================== 期刊配置管理 API ====================

/**
 * GET /api/issue-config/:date
 *
 * 获取期刊的默认配置（基于期刊类型）
 * 配置根据日期对应的期刊类型（周刊/月刊/特刊）自动生成
 *
 * @route {GET} /api/issue-config/:date
 * @group 期刊配置管理
 * @param {string} req.params.date - 期刊日期（路径参数）
 * @returns {Object} res - 期刊配置对象
 * @returns {string} res._type - 期刊类型（weekly/monthly/special）
 * @returns {string} res.name - 期刊名称
 * @returns {number} res.newRankCount - 新曲榜数量
 * @returns {number} res.mainRankCount - 主榜数量
 * @returns {boolean} res.showCount - 是否显示计数
 * @returns {number} res.trendCount - 趋势统计天数
 * @returns {string} res.trendKey - 趋势字段键名
 * @returns {number[]} res.subRankRange - 排名范围
 * @returns {Object} res.sections - 各个部分的启用配置
 *
 * @example
 * // 请求
 * fetch('/api/issue-config/2025-01-15')
 *
 * // 响应
 * {
 *   "_type": "weekly",
 *   "name": "周刊",
 *   "newRankCount": 10,
 *   "mainRankCount": 20,
 *   "showCount": true,
 *   "trendCount": 7,
 *   "trendKey": "daily_trends",
 *   "subRankRange": [1, 10],
 *   "sections": {
 *     "intro": { "enabled": true },
 *     "newRank": { "enabled": true },
 *     "mainRank": { "enabled": true },
 *     "outro": { "enabled": true }
 *   }
 * }
 */
router.get("/issue-config/:date", async (req, res) => {
  const { date } = req.params;
  const infoFile = path.join(DIR_DATA, `${date}信息.json`);

  try {
    const infoData = fs.existsSync(infoFile) ? await fs.readJson(infoFile) : {};
    const config = getIssueConfig(date, infoData);
    res.send(config);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

/**
 * GET /api/editor-config/:date
 *
 * 获取期刊的自定义编辑器配置
 * 该配置由用户在编辑器中自定义并保存
 *
 * @route {GET} /api/editor-config/:date
 * @group 期刊配置管理
 * @param {string} req.params.date - 期刊日期（路径参数）
 * @returns {Object} res - 编辑器配置对象或错误信息
 * @returns {Object} [res.greeting] - 开头问候语配置
 * @returns {Object} [res.ending] - 结尾语配置
 * @returns {Object} [res.cover] - 封面配置
 * @returns {Object} [res.clips] - 裁切设置（可覆盖默认裁切设置）
 * @returns {string} [res.error] - 错误信息（配置文件不存在时）
 *
 * @example
 * // 配置存在时的响应
 * {
 *   "greeting": {
 *     "enabled": true,
 *     "text": "大家好，欢迎收看第100期周刊"
 *   },
 *   "ending": {
 *     "enabled": true,
 *     "text": "感谢收看，我们下期再见"
 *   },
 *   "cover": {
 *     "enabled": true,
 *     "image": "/covers/cover_2025-01-15.png",
 *     "title": "第100期周刊"
 *   }
 * }
 *
 * // 配置不存在时的响应
 * { "error": "not_found" }
 */
router.get("/editor-config/:date", async (req, res) => {
  const { date } = req.params;
  const configFile = path.join(DIR_DATA, `${date}_config.json`);

  try {
    if (await fs.pathExists(configFile)) {
      const config = await fs.readJson(configFile);
      res.send(config);
    } else {
      res.send({ error: "not_found" });
    }
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

/**
 * POST /api/editor-config/:date
 *
 * 保存期刊的自定义编辑器配置
 * 配置会保存为 {date}_config.json 文件，优先级高于默认配置
 *
 * @route {POST} /api/editor-config/:date
 * @group 期刊配置管理
 * @param {string} req.params.date - 期刊日期（路径参数）
 * @param {Object} req.body - 完整的配置对象
 * @returns {Object} res - 保存结果
 * @returns {boolean} res.success - 是否保存成功
 *
 * @example
 * // 请求
 * fetch('/api/editor-config/2025-01-15', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     "greeting": {
 *       "enabled": true,
 *       "text": "大家好，欢迎收看第100期周刊"
 *     },
 *     "ending": {
 *       "enabled": true,
 *       "text": "感谢收看，我们下期再见"
 *     },
 *     "cover": {
 *       "enabled": true,
 *       "image": "/covers/cover_2025-01-15.png",
 *       "title": "第100期周刊"
 *     }
 *   })
 * })
 *
 * // 响应
 * { "success": true }
 */
router.post("/editor-config/:date", async (req, res) => {
  const { date } = req.params;
  const configFile = path.join(DIR_DATA, `${date}_config.json`);

  try {
    await fs.writeJson(configFile, req.body, { spaces: 2 });
    log(`保存编辑器配置: ${date}`);
    res.send({ success: true });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

/**
 * 导出 Express 路由器
 * @type {express.Router}
 */
export default router;
