# Vocabili Video Monorepo 项目配置指南

## 项目结构

```
vocabili-video/
├── packages/
│   ├── controller/          # 控制器（后端服务）
│   ├── panel/               # 控制器（前端）
│   ├── remotion-engine/     # Remotion视频渲染引擎
│   └── shared/             # 共享配置和类型定义
└── storage/                # 存储文件目录
    ├── data/               # 数据文件
    ├── downloads/          # 下载文件
    └── video/              # 视频文件
```

## 安装 pnpm

### Windows
1. **安装 Node.js**（如果尚未安装）：https://nodejs.org/
2. **安装 pnpm**：
   ```bash
   npm install -g pnpm
   ```

### Linux/macOS
```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

## 配置 pnpm

### 自动配置（推荐）
运行安装脚本：

**Windows：**
```bash
install.bat
```

**Linux/macOS：**
```bash
chmod +x install.sh
./install.sh
```

### 手动配置
如果不想使用脚本，可以手动执行以下步骤：

1. **设置 pnpm 配置**：
   ```bash
   pnpm config set store-dir ~/.pnpm-store
   pnpm config set auto-install-peers true
   pnpm config set strict-peer-dependencies false
   ```

2. **清除现有依赖**：
   ```bash
   pnpm run clean
   ```

3. **安装依赖**：
   ```bash
   pnpm install --no-frozen-lockfile
   ```

## 常用命令

### 项目管理
```bash
# 安装所有依赖（推荐）
pnpm install --no-frozen-lockfile

# 清除并重新安装
pnpm run clean:install

# 查看所有包信息
pnpm run workspace:info
```

### 运行项目
```bash
# 启动控制器（后端服务）
pnpm start
# 或
pnpm run dev:controller

# 启动控制面板（前端）
pnpm run dev:panel

# 启动 Remotion Studio（开发模式）
pnpm run dev:remotion

# 同时启动所有服务（Windows）
pnpm run dev
```

### 构建项目
```bash
# 构建所有包
pnpm run build

# 只构建控制器
pnpm run build:controller

# 只构建 Remotion 引擎
pnpm run build:remotion
```

### 代码检查
```bash
# 检查所有包
pnpm run lint

# 只检查控制器
pnpm run lint:controller

# 只检查 Remotion 引擎
pnpm run lint:remotion
```

### 添加依赖
```bash
# 向根项目添加依赖
pnpm add <package-name>

# 向控制器添加依赖
pnpm add:controller <package-name>

# 向 Remotion 引擎添加依赖
pnpm add:remotion <package-name>

# 向共享包添加依赖
pnpm add:shared <package-name>
```

## 项目说明

### 1. 控制器（controller）
- **入口文件**: `packages/controller/src/server.js`
- **端口**: 3002
- **功能**: 
  - 提供API接口
  - 管理视频合成任务
  - 调用Remotion引擎渲染视频
  - 处理文件下载和存储

### 2. Remotion 引擎（remotion-engine）
- **入口文件**: `packages/remotion-engine/src/index.ts`
- **功能**:
  - 视频渲染组件
  - 动画和特效
  - 视频合成逻辑

### 3. 共享配置（shared）
- **入口文件**: `packages/shared/src/index.js`
- **包含**:
  - 全局配置（端口、路径等）
  - 类型定义
  - 常量配置

## 目录结构说明

```
data/              # JSON数据文件
├── clip_data.json     # 剪辑数据
├── issue_config.json  # 问题配置
└── ...              # 其他数据文件

downloads/         # 下载的文件
├── images/        # 下载的图片
├── avatar/        # 头像文件
├── STAFF/         # 员工文件
├── full_videos/   # 完整视频
└── audio_cache/   # 音频缓存

video/             # 生成的视频文件
└── *.mp4          # 最终输出的视频

config/            # 配置目录
└── editor.html    # 编辑器配置页面
```

## 环境要求

1. **Node.js**: 18.x 或更高版本
2. **pnpm**: 8.x 或更高版本
3. **Chrome**: 用于视频渲染（headless模式）
4. **FFmpeg**: 视频处理工具（已集成在项目中）

## 常见问题

### Q1: 安装依赖时出现 peer dependency 错误
```bash
# 设置宽松的 peer dependency 检查
pnpm config set strict-peer-dependencies false
pnpm install --no-frozen-lockfile
```

### Q2: 启动 Remotion Studio 时出错
确保已正确安装 Remotion 依赖：
```bash
cd packages/remotion-engine
pnpm install
```

### Q3: 控制器无法找到 shared-config
确保所有包都已正确链接：
```bash
pnpm install --no-frozen-lockfile
```

### Q4: Windows 用户无法运行 shell 脚本
使用批处理文件：
```bash
install.bat
```

### Q5: 视频渲染失败
检查 Chrome 路径配置：
1. 打开 `packages/shared/src/config/config.js`
2. 修改 `CHROME_EXECUTABLE` 为正确的 Chrome 路径
3. 或者使用默认的 Chrome 安装路径

## 更新日志

### v1.0.0 (2026-03-26)
- 项目拆分为 Monorepo 结构
- 使用 pnpm workspaces 管理依赖
- 分离控制器和 Remotion 引擎
- 创建共享配置包
- 提供完整的安装和配置指南