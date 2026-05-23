# deploy.ps1
Write-Host "📦 开始打包项目..." -ForegroundColor Cyan
pnpm run build:panel

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 打包失败，停止部署。" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 正在上传到服务器..." -ForegroundColor Cyan

# 你的服务器信息（请自行修改）
$serverUser = "root"
$serverHost = "8.209.210.116"
$remotePath = "/var/www/vocabili-video"

# 清空服务器文件夹的原有文件
ssh "$serverUser@$serverHost" "rm -rf $remotePath/dist/*"

# 上传 dist 文件夹的内容到远程服务器目录
# 上传 app 文件夹的内容到远程服务器目录
7z a dist.zip ./packages/panel/dist
scp dist.zip "$serverUser@${serverHost}:$remotePath"

ssh "$serverUser@$serverHost" "cd $remotePath; unzip dist.zip; "

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 部署完成！" -ForegroundColor Green
} else {
    Write-Host "❌ 上传失败，请检查 SCP 配置或网络。" -ForegroundColor Red
}
