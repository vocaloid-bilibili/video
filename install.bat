@echo off
chcp 65001 >nul

echo Install pnpm (if not installed)...
where pnpm >nul 2>nul
if errorlevel 1 (
    npm install -g pnpm
)

echo Setting pnpm config...
pnpm config set store-dir %USERPROFILE%\.pnpm-store
pnpm config set auto-install-peers true
pnpm config set strict-peer-dependencies false

echo Clearing node_modules and lock files...
rmdir /s /q node_modules 2>nul
rmdir /s /q packages\controller\node_modules 2>nul
rmdir /s /q packages\remotion-engine\node_modules 2>nul
rmdir /s /q packages\shared\node_modules 2>nul
del pnpm-lock.yaml 2>nul

echo Installing workspace dependencies...
pnpm install --no-frozen-lockfile

echo Installation completed!
echo.
echo Run project commands:
echo - Start controller: pnpm start or pnpm run dev:controller
echo - Start Remotion Studio: pnpm run dev:remotion
echo - Build all projects: pnpm run build

pause