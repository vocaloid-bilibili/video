// server-with-catch.js - 添加错误处理的版本
import 'dotenv/config'; // 加载环境变量
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

// 添加全局错误处理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获异常:', error.message);
  console.error(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
});

try {
  // 导入配置（从shared包）
  console.log("正在导入shared-config...");
  const {
    PORT,
    DIR_DATA,
    DIR_DOWNLOADS,
    DIR_IMAGES,
    DIR_VIDEO_ROOT,
    DIR_AUDIO_CACHE,
    DIR_FULL_VIDEO,
    DIR_AVATAR,
    DIR_STAFF,
  } = await import('shared-config');
  console.log("shared-config导入成功");

  // 导入路由（注意加.js后缀）
  console.log("正在导入路由...");
  const apiRoutesModule = await import('./routes/api.js');
  const apiRoutes = apiRoutesModule.default;
  console.log("路由导入成功");

  // ES模块中手动定义__dirname（关键！）
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // 创建目录（逻辑不变）
  console.log("创建目录...");
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
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });

  // 添加服务器错误处理
  app.on('error', (error) => {
    console.error('❌ 服务器错误:', error);
  });

} catch (error) {
  console.error('❌ 启动过程中发生错误:');
  console.error(error.message);
  console.error(error.stack);
  process.exit(1);
}

console.log("服务器启动流程完成");