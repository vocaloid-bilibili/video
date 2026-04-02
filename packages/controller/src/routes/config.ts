import { Router } from "express";
import path from "path";
import fs from "fs-extra";
import { DIR_DATA } from "shared-config";
import { log } from "../state.js";
import { getIssueConfig } from "shared-config";
const router: Router = Router()


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
  } catch (e: any) {
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
  } catch (e: any) {
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
  } catch (e: any) {
    res.status(500).send({ error: e.message });
  }
});

export default router