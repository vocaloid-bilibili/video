#!/bin/bash

echo "安装 pnpm (如果尚未安装)..."
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm
fi

echo "设置 pnpm 配置..."
pnpm config set store-dir ~/.pnpm-store
pnpm config set auto-install-peers true
pnpm config set strict-peer-dependencies false

echo "清除现有 node_modules 和 lock 文件..."
rm -rf node_modules
rm -rf packages/controller/node_modules
rm -rf packages/remotion-engine/node_modules
rm -rf packages/shared/node_modules
rm -f pnpm-lock.yaml

echo "安装所有工作区依赖..."
pnpm install --no-frozen-lockfile

echo "安装完成！"
echo ""
echo "使用以下命令运行项目："
echo "- 启动控制器: pnpm start 或 pnpm run dev:controller"
echo "- 启动 Remotion Studio: pnpm run dev:remotion"
echo "- 构建所有项目: pnpm run build"