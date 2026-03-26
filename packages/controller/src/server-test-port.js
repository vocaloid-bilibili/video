// server-test-port.js - 测试不同端口
import 'dotenv/config';

// 添加全局错误处理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获异常:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
  process.exit(1);
});

console.log("=== 测试服务器启动 ===");

try {
  // 使用固定端口避免环境变量问题
  const PORT = 3003;
  
  const express = await import('express');
  const cors = await import('cors');
  const path = await import('path');
  const fs = await import('fs-extra');
  const { fileURLToPath } = await import('url');
  
  const app = express.default();
  
  // 基本路由
  app.use(cors.default());
  app.use(express.default.json());
  
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', port: PORT });
  });
  
  // 启动服务器
  const server = app.listen(PORT, () => {
    console.log(`✅ 测试服务器运行在 http://localhost:${PORT}`);
    console.log("服务器已启动，按 Ctrl+C 停止");
  });
  
  // 服务器错误处理
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ 端口 ${PORT} 已被占用`);
    } else {
      console.error('❌ 服务器错误:', error.message);
    }
    process.exit(1);
  });
  
  // 保持进程运行
  process.on('SIGINT', () => {
    console.log("\n正在关闭服务器...");
    server.close(() => {
      console.log("服务器已关闭");
      process.exit(0);
    });
  });
  
} catch (error) {
  console.error('❌ 启动失败:');
  console.error(error.message);
  console.error(error.stack);
  process.exit(1);
}