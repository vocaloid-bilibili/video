import { Router } from 'express';
import path from 'path';
import fs from 'fs-extra';

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

// 导入合成任务
import {
  runSynthesisTask,
} from '../synthesis/task.js';


const router: Router = Router();


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
router.post("/start", async (req, res) => {
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
router.post("/merge", async (req, res) => {
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
  const fn = runSynthesisTask;
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
router.post("/segment", async (req, res) => {
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
  } catch (e: any) {
    res.status(500).send({ error: e.message });
  }
});

export default router