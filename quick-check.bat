@echo off
chcp 65001 >nul

echo ============================================
echo 快速系统检查
echo ============================================

echo.
echo 1. 检查控制器服务状态...
tasklist | findstr "node.exe" >nul
if errorlevel 1 (
    echo   [ ] 控制器服务未运行
    echo   请运行: pnpm start
) else (
    echo   [✓] 控制器服务正在运行
)

echo.
echo 2. 测试API接口...
curl -s http://localhost:3002/api/files > nul
if errorlevel 1 (
    echo   [ ] API接口不可用
) else (
    echo   [✓] API接口正常
)

echo.
echo 3. 检查包结构...
if exist "packages\controller\package.json" (
    echo   [✓] 控制器包存在
) else (
    echo   [ ] 控制器包缺失
)

if exist "packages\remotion-engine\package.json" (
    echo   [✓] Remotion包存在
) else (
    echo   [ ] Remotion包缺失
)

if exist "packages\shared\package.json" (
    echo   [✓] 共享包存在
) else (
    echo   [ ] 共享包缺失
)

echo.
echo 4. 检查配置文件...
if exist "packages\shared\src\index.js" (
    echo   [✓] shared/index.js存在
) else (
    echo   [ ] shared/index.js缺失
)

if exist "packages\shared\src\config\config.js" (
    echo   [✓] shared/config.js存在
) else (
    echo   [ ] shared/config.js缺失
)

if exist "packages\shared\src\config\issueTypes.js" (
    echo   [✓] shared/issueTypes.js存在
) else (
    echo   [ ] shared/issueTypes.js缺失
)

echo.
echo 5. 检查数据目录...
if exist "data\" (
    echo   [✓] data目录存在
) else (
    echo   [ ] data目录不存在 (会自动创建)
)

echo.
echo ============================================
echo 检查完成!
echo.
echo 如果看到所有[✓]，系统已准备好。
echo 如果有[ ]，请运行 install.bat 修复。
echo ============================================
pause