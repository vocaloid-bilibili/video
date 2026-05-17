# 快速开始指南 (Monorepo 版本)

## 第一步：环境准备

### 1. 安装 Node.js
- 下载地址：https://nodejs.org/
- 推荐版本：18.x 或更高

### 2. 安装 pnpm
```bash
npm install -g pnpm
```

## 第二步：项目配置

### 1. 验证配置
运行配置验证工具：
```bash
test-config.bat
```

### 2. 安装依赖 (三选一)

**选项A：使用安装脚本 (推荐)**
```bash
install.bat
```

**选项B：手动安装**
```bash
# 设置 pnpm 配置
pnpm config set auto-install-peers true
pnpm config set strict-peer-dependencies false

# 清除旧的依赖
rmdir /s /q node_modules 2>nul
rmdir /s /q packages\controller\node_modules 2>nul
rmdir /s /q packages\remotion-engine\node_modules 2>nul
rmdir /s /q packages\shared\node_modules 2>nul
del pnpm-lock.yaml 2>nul

# 安装依赖
pnpm install --no-frozen-lockfile
```

**选项C：使用 package.json 脚本**
```bash
pnpm run clean:install
```

## 第三步：运行项目

### 1. 启动控制器 (后端服务)
```bash
pnpm start
# 或
pnpm run dev:controller
```

### 2. 启动 Remotion Studio (可选，用于调试)
```bash
pnpm run dev:remotion
```

### 3. 访问项目
打开浏览器访问：https://video.vocabili.top

## 第四步：验证安装

### 1. 检查服务是否正常运行
```bash
# 控制器应输出：
# Server running on http://localhost:3002
```

### 2. 测试 API
```bash
# 检查文件列表
curl http://localhost:3002/api/files
```

## 常见问题解决

### Q1: peer dependency 错误
```bash
pnpm config set strict-peer-dependencies false
pnpm install --no-frozen-lockfile
```

### Q2: 找不到 shared-config 包
```bash
# 重新安装依赖
pnpm run clean:install
```

### Q3: Remotion Studio 启动失败
```bash
# 单独安装 remotion-engine 依赖
cd packages/remotion-engine
pnpm install
```

### Q4: Windows 命令提示符乱码
```bash
# 设置 UTF-8 编码
chcp 65001
```

## 项目结构说明

```
项目根目录/
├── packages/              # 所有子包
│   ├── controller/       # 控制器 (后端)
│   ├── remotion-engine/ # Remotion 渲染引擎
│   └── shared/          # 共享配置
├── data/                # 数据文件
├── downloads/           # 下载的文件
├── video/              # 生成的视频
└── 启动脚本/
    ├── install.bat     # 安装脚本
    ├── test-config.bat # 配置验证
    └── 启动.bat        # 原启动脚本
```

## 升级依赖

```bash
# 升级所有包
pnpm update

# 升级特定包
pnpm add <package-name>@latest

# 升级工作区包
pnpm -r update
```

## 开发命令速查

```bash
# 代码检查
pnpm run lint

# 构建项目
pnpm run build

# 查看包信息
pnpm run workspace:info

# 清理项目
pnpm run clean
```

## 获取帮助

如果遇到问题：
1. 查看详细文档：README-MONOREPO.md
2. 运行验证工具：test-config.bat
3. 检查日志：查看控制台输出