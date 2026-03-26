// server-debug.js - 调试版本
import 'dotenv/config'; // 加载环境变量

console.log("=== 启动调试 ===");

try {
  console.log("1. 导入 express...");
  import('express').then(expressModule => {
    const express = expressModule.default;
    
    try {
      console.log("2. 导入 cors...");
      import('cors').then(corsModule => {
        const cors = corsModule.default;
        
        try {
          console.log("3. 导入 path 和 fs...");
          import('path').then(pathModule => {
            const path = pathModule.default;
            import('fs-extra').then(fsModule => {
              const fs = fsModule.default;
              
              try {
                console.log("4. 导入 shared-config...");
                import('shared-config').then(sharedConfig => {
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
                  } = sharedConfig;
                  
                  console.log("5. 创建目录...");
                  fs.ensureDirSync(DIR_DATA);
                  fs.ensureDirSync(DIR_DOWNLOADS);
                  fs.ensureDirSync(DIR_IMAGES);
                  fs.ensureDirSync(DIR_VIDEO_ROOT);
                  fs.ensureDirSync(DIR_AUDIO_CACHE);
                  fs.ensureDirSync(DIR_AVATAR);
                  fs.ensureDirSync(DIR_STAFF);
                  
                  console.log("6. 初始化Express...");
                  const app = express();
                  
                  app.use(cors());
                  app.use(express.json());
                  
                  console.log("7. 尝试导入路由...");
                  import('./routes/api.js').then(apiRoutesModule => {
                    const apiRoutes = apiRoutesModule.default;
                    
                    app.use("/api", apiRoutes);
                    
                    console.log("8. 启动服务器...");
                    app.listen(PORT, () => {
                      console.log(`✅ Server running on http://localhost:${PORT}`);
                      console.log("服务已成功启动！");
                    });
                    
                  }).catch(routesError => {
                    console.error("❌ 路由导入失败:", routesError);
                  });
                  
                }).catch(sharedError => {
                  console.error("❌ shared-config导入失败:", sharedError);
                });
                
              } catch (fsError) {
                console.error("❌ 文件系统错误:", fsError);
              }
            }).catch(fsError => {
              console.error("❌ fs-extra导入失败:", fsError);
            });
          }).catch(pathError => {
            console.error("❌ path导入失败:", pathError);
          });
        } catch (corsError) {
          console.error("❌ cors初始化错误:", corsError);
        }
      }).catch(corsImportError => {
        console.error("❌ cors导入失败:", corsImportError);
      });
    } catch (expressError) {
      console.error("❌ express初始化错误:", expressError);
    }
  }).catch(expressImportError => {
    console.error("❌ express导入失败:", expressImportError);
  });
} catch (globalError) {
  console.error("❌ 全局错误:", globalError);
}

// 保持进程运行
process.on('uncaughtException', (error) => {
  console.error("❌ 未捕获异常:", error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error("❌ 未处理的Promise拒绝:", reason);
});

console.log("调试脚本加载完成，等待异步操作...");