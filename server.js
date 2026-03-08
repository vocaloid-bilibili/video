// server.js (ES模块版本)
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

// 导入配置（注意加.js后缀）
import {
  PORT,
  DIR_DATA,
  DIR_DOWNLOADS,
  DIR_IMAGES,
  DIR_VIDEO_ROOT,
  DIR_AUDIO_CACHE,
  DIR_FULL_VIDEO,
  DIR_AVATAR,
  DIR_STAFF,
} from './config.js';

// 导入路由（注意加.js后缀）
import apiRoutes from './routes/api.js';

// ES模块中手动定义__dirname（关键！）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建目录（逻辑不变）
fs.ensureDirSync(DIR_DATA);
fs.ensureDirSync(DIR_DOWNLOADS);
fs.ensureDirSync(DIR_IMAGES);
fs.ensureDirSync(DIR_VIDEO_ROOT);
fs.ensureDirSync(DIR_AUDIO_CACHE);
fs.ensureDirSync(DIR_AVATAR);
fs.ensureDirSync(DIR_STAFF);

// 初始化Express应用
const app = express();

// 中间件配置（逻辑不变）
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/downloads", express.static(DIR_DOWNLOADS));
app.use("/downloads/full_videos", express.static(DIR_FULL_VIDEO));
app.use("/video", express.static(DIR_VIDEO_ROOT));
app.use("/config/avatar", express.static(DIR_AVATAR));
app.use("/config/staff", express.static(DIR_STAFF));

// 挂载路由
app.use("/api", apiRoutes);

// 启动服务
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});