import { Router } from "express";
import { downloadFullVideo } from "../utils/fullVideo.js";
import { log } from "../state.js";

const router: Router = Router()



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
    } catch (e: any) {
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
  } catch (e: any) {
    res.status(500).send({ error: e.message });
  }
});

export default router;