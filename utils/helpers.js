// utils/helpers.js (ES模块最终版本)
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

// 修复1：导入具体文件，添加.js后缀（解决目录导入错误）
import { DIR_VIDEO_ROOT } from '../config.js';
import { detectIssueType } from '../config/issueTypes.js';

// 修复2：ES模块中手动定义__dirname（如果用到的话，提前定义更规范）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取路径配置
function getPaths(date) {
  const base = path.join(DIR_VIDEO_ROOT, date);
  const segments = path.join(base, "segments");
  fs.ensureDirSync(segments);
  return {
    base,
    segments,
    final: path.join(base, `${date}.mp4`),
  };
}

// 数组分块
function chunkArray(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

// 获取版权标签
function getCopyrightLabel(copyright) {
  if ([1, 3, 100].includes(copyright)) return "本家";
  if ([2, 101].includes(copyright)) return "搬运";
  return "搬运";
}

// 获取期刊类型
function getIssueType(date) {
  return detectIssueType(date);
}

// 格式化日期显示
function formatDateDisplay(date, type) {
  if (type === "weekly") {
    return date; // 2026-01-17
  } else if (type === "monthly") {
    const [year, month] = date.split("-");
    return `${year}年${parseInt(month)}月`;
  }
  return date;
}

// 安全解析数字
export const safeParse = (val) => {
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
};

// 修复3：替换CommonJS导出为ES模块命名导出（统一语法）
export {
  getPaths,
  chunkArray,
  getCopyrightLabel,
  getIssueType,
  formatDateDisplay
};