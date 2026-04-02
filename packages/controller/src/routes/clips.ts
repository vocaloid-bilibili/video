import { Router } from "express";
import { getAllClipSettings, getClipSetting, setClipSetting, deleteClipSetting } from "../utils/clips.js";
import { log } from "../state.js";

const router: Router = Router()

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
router.get("", (req, res) => {
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
router.get("/:bvid", (req, res) => {
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
router.post("/:bvid", (req, res) => {
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
router.delete("/:bvid", (req, res) => {
  const deleted = deleteClipSetting(req.params.bvid);
  if (deleted) {
    log(`删除裁切设置: ${req.params.bvid}`);
  }
  res.send({ success: deleted });
});

export default router;