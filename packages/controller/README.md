# 视频生成控制器

这个东西依然有点前后端不分，不过还好，因为前端东西不多。它真正的前端就仅仅是两个 HTML 文件而已。

这个项目的入口是 `src/server.ts` ，就这样启动了一个 Express 服务器。然后它托管启动了一个 API，可以操纵视频的生成。另外还可以访问我们文件夹里的视频。

API 在 `/routes` 。各种行为都通过它进行，主要就看它。

## 前端介绍

执行 `npm dev`，它会启动服务器，让你可以与文件系统做交互。注意这些东西仅操纵文件系统，并没有任何编辑视频的服务启动。

### 主页

主页是 `/public/index.html` 。用原生HTML我是真的服了，为什么不做一个现代一点的网页呢。可以看到主页被分成左中右三个部分。

左边是文件列表，它里面搜索了 `/data` 文件夹里面的文件。你把JSON文件拖进去，其实就是把文件添加到那个文件夹。所以你把 `/data` 文件夹里面的文件拖进去没用的。如果你的JSON文件在这里没显示出来，说明文件名的格式不符合它的要求。然后呢，它会去 `/video` 文件夹看对应的视频文件，如果已经有合成完毕的完整视频了就可以提供下载，如果有分段视频的话也可以执行"仅合并"。假如点击"编辑合成"，就会进入 `editor.html` ，后面讲。这里面执行"渲染"是通过命令行调用remotion，执行"合成"是通过命令行调用FFmpeg。这两个东西都是另外启动的。

中间是分片管理。就是刚刚说的那些分段视频。你可以重新生成分段视频，或者单独下载分段视频。

右边是处理进度条。并没有什么意思。

### 编辑器

这个编辑器就是 `/public/editor.html` 这也是一个神秘的HTML编辑器，显然是AI写的。你可以什么都不做，点击右上角的"开始合成"，它就会渲染所有分段，然后合并。和刚才一样，也是命令行调用工具。

当然你也可以做点什么。比如说你可以修改歌曲的截取片段。歌曲截取片段是保存在 `/data/clicp_db.json` 文件里面的。也可以修改配置，写一写开头和结尾的问候语，以及写一个封面图片。如果编辑这些的话，会生成一个 `/data_{date}_config.json` 文件。

## 后端介绍

你就看 `/src/routes`，都在里面。

它会生成视频生成配置文件，和视频在同一个文件夹。也就是 `/storage/video` 里面。用完会删掉。

你最想看的可能是 `task.ts` 里面的 `runSynthesisTask` 函数，它里面有详细的生成视频流程。

---

# API 接口文档

## 基础信息

- **Base URL**: `http://localhost:{PORT}`（默认端口见配置）
- **Content-Type**: `application/json`（文件上传为 `multipart/form-data`）
- **数据格式**: JSON

---

## 一、数据文件管理

### 1.1 上传数据文件

**接口**: `POST /api/upload`

**描述**: 上传 JSON 数据文件到 `/data` 目录

**请求参数**:
- **Content-Type**: `multipart/form-data`
- **Body**: `files` - 文件数组

**响应示例**:
```json
{
  "status": "success",
  "files": ["2025-01-15.json", "2025-01.json"]
}
```

**错误响应**:
- 400: 缺少必要参数
- 500: 服务器内部错误

---

### 1.2 获取文件列表

**接口**: `GET /api/files`

**描述**: 获取所有期刊数据文件及其状态

**请求参数**: 无

**响应示例**:
```json
{
  "files": [
    {
      "date": "2025-01",
      "dataFile": "2025-01.json",
      "hasConfig": true,
      "hasVideo": true,
      "issueType": "monthly",
      "issueTypeName": "月刊"
    },
    {
      "date": "2025-01-15",
      "dataFile": "2025-01-15.json",
      "hasConfig": false,
      "hasVideo": false,
      "issueType": "weekly",
      "issueTypeName": "周刊"
    }
  ]
}
```

**字段说明**:
- `date`: 期刊日期（文件名去掉.json后缀）
- `dataFile`: 数据文件名
- `hasConfig`: 是否存在配置文件（`{date}_config.json`）
- `hasVideo`: 是否已生成完整视频
- `issueType`: 期刊类型（`weekly`/`monthly`/`special`）
- `issueTypeName`: 期刊类型中文名称

---

## 二、分片管理

### 2.1 获取分片列表

**接口**: `GET /api/segments`

**描述**: 获取指定日期的分段视频列表

**请求参数**:
- `date` (query, 必需): 期刊日期

**响应示例**:
```json
{
  "segments": [
    "intro.mp4",
    "rank_new_001.mp4",
    "rank_new_002.mp4",
    "rank_main_001.mp4",
    "outro.mp4"
  ]
}
```

**错误响应**:
- 400: 缺少日期参数
- 500: 服务器内部错误

---

## 三、任务控制

### 3.1 获取任务状态

**接口**: `GET /api/status`

**描述**: 获取当前合成任务的状态

**请求参数**: 无

**响应示例**:
```json
{
  "status": "processing",
  "date": "2025-01-15",
  "currentSegment": "rank_new_001.mp4",
  "progress": 45,
  "totalSegments": 10,
  "completedSegments": 4,
  "message": "正在渲染分片 5/10",
  "error": null
}
```

**状态说明**:
- `idle`: 空闲状态
- `processing`: 处理中
- `completed`: 已完成
- `failed`: 失败

---

### 3.2 全量合成

**接口**: `POST /api/synthesis/start`

**描述**: 启动完整的视频合成流程（渲染所有分片 + 合并）

**请求参数**:
```json
{
  "date": "2025-01-15"
}
```

**响应示例**:
```json
{
  "status": "started",
  "issueType": "weekly"
}
```

**错误响应**:
- 400: 缺少日期参数 或 任务正在进行中
- 500: 服务器内部错误

**说明**: 任务在后台异步执行，可通过 `GET /api/status` 查询进度

---

### 3.3 仅合并

**接口**: `POST /api/synthesis/merge`

**描述**: 仅合并现有的分段视频，不重新渲染

**请求参数**:
```json
{
  "date": "2025-01-15"
}
```

**响应示例**:
```json
{
  "status": "started"
}
```

**错误响应**:
- 400: 缺少日期参数 或 任务正在进行中
- 500: 服务器内部错误

---

### 3.4 单片重绘

**接口**: `POST /api/synthesis/segment`

**描述**: 删除指定分片，使其在下次合成时重新生成

**请求参数**:
```json
{
  "date": "2025-01-15",
  "type": "new",
  "rank": 1,
  "segmentName": "rank_new_001.mp4"
}
```

**参数说明**:
- `date` (必需): 期刊日期
- `type` (可选): 类型（`new`/`main`），与 `rank` 配合使用
- `rank` (可选): 排名，与 `type` 配合使用
- `segmentName` (可选): 直接指定分片文件名，优先级高于 type+rank

**响应示例**:
```json
{
  "status": "success",
  "message": "已删除 rank_new_001.mp4，下次合成时会重新生成"
}
```

**说明**: 提供了三种删除方式：
1. 同时提供 `type` 和 `rank`（如 `type: "new", rank: 1`）
2. 直接提供 `segmentName`
3. 参数不完整时不执行删除

---

## 四、歌曲和裁切管理

### 4.1 获取期刊歌曲列表

**接口**: `GET /api/songs/:date`

**描述**: 获取指定期刊的所有歌曲信息及其裁切设置

**请求参数**:
- `date` (path, 必需): 期刊日期

**响应示例**:
```json
{
  "date": "2025-01-15",
  "songs": {
    "newRank": [
      {
        "bvid": "BV1xx411c7mD",
        "title": "歌曲标题",
        "author": "UP主",
        "rank": 1,
        "_type": "new",
        "_clip": {
          "bvid": "BV1xx411c7mD",
          "startTime": 10.5,
          "endTime": 25.0
        },
        "_videoExists": true,
        "_videoUrl": "/downloads/BV1xx411c7mD.mp4"
      }
    ],
    "mainRank": [...]
  },
  "index": 100,
  "issueType": "weekly",
  "config": {
    "name": "第100期",
    "newRankCount": 10,
    "mainRankCount": 20,
    "showCount": true,
    "trendCount": 7,
    "trendKey": "daily_trends",
    "subRankRange": [1, 10]
  }
}
```

**字段说明**:
- `songs.newRank`: 新曲榜歌曲列表
- `songs.mainRank`: 主榜歌曲列表
- `_type`: 歌曲类型（`new`/`main`）
- `_clip`: 裁切设置（如果已设置）
- `_videoExists`: 原视频是否已下载
- `_videoUrl`: 原视频访问地址

**错误响应**:
- 404: 数据文件不存在
- 500: 服务器内部错误

---

### 4.2 获取所有裁切设置

**接口**: `GET /api/clips`

**描述**: 获取所有歌曲的裁切设置

**请求参数**: 无

**响应示例**:
```json
{
  "BV1xx411c7mD": {
    "bvid": "BV1xx411c7mD",
    "startTime": 10.5,
    "endTime": 25.0
  },
  "BV1yy411c7mE": {
    "bvid": "BV1yy411c7mE",
    "startTime": 0,
    "endTime": 30.0
  }
}
```

---

### 4.3 获取单个裁切设置

**接口**: `GET /api/clips/:bvid`

**描述**: 获取指定视频的裁切设置

**请求参数**:
- `bvid` (path, 必需): 视频 BVID

**响应示例**（已设置）:
```json
{
  "bvid": "BV1xx411c7mD",
  "startTime": 10.5,
  "endTime": 25.0
}
```

**响应示例**（未设置）:
```json
{
  "exists": false
}
```

---

### 4.4 保存裁切设置

**接口**: `POST /api/clips/:bvid`

**描述**: 设置或更新视频的裁切时间段

**请求参数**:
- `bvid` (path, 必需): 视频 BVID
- **Body**:
```json
{
  "startTime": 10.5,
  "endTime": 25.0
}
```

**响应示例**:
```json
{
  "success": true,
  "clip": {
    "bvid": "BV1xx411c7mD",
    "startTime": 10.5,
    "endTime": 25.0
  }
}
```

**错误响应**:
- 400: `startTime` 无效

**说明**:
- `startTime` 为必需，必须 ≥ 0
- `endTime` 为可选，不提供时表示使用到视频结尾

---

### 4.5 删除裁切设置

**接口**: `DELETE /api/clips/:bvid`

**描述**: 删除指定视频的裁切设置

**请求参数**:
- `bvid` (path, 必需): 视频 BVID

**响应示例**:
```json
{
  "success": true
}
```

---

## 五、视频下载管理

### 5.1 批量下载完整视频

**接口**: `POST /api/full-video/batch`

**描述**: 批量下载 B站原视频用于预览

**请求参数**:
```json
{
  "bvids": ["BV1xx411c7mD", "BV1yy411c7mE"]
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "开始下载 2 个视频"
}
```

**错误响应**:
- 400: `bvids` 必须是数组

**说明**: 任务在后台异步执行，下载失败的日志会记录到系统日志

---

### 5.2 下载单个完整视频

**接口**: `POST /api/full-video/:bvid`

**描述**: 下载指定 B 站视频

**请求参数**:
- `bvid` (path, 必需): 视频 BVID

**响应示例**:
```json
{
  "success": true,
  "bvid": "BV1xx411c7mD",
  "path": "/storage/downloads/BV1xx411c7mD.mp4",
  "url": "/downloads/BV1xx411c7mD.mp4"
}
```

**错误响应**:
- 500: 下载失败

---

## 六、期刊配置管理

### 6.1 获取期刊默认配置

**接口**: `GET /api/issue-config/:date`

**描述**: 获取期刊的默认配置（基于期刊类型）

**请求参数**:
- `date` (path, 必需): 期刊日期

**响应示例**:
```json
{
  "_type": "weekly",
  "name": "周刊",
  "newRankCount": 10,
  "mainRankCount": 20,
  "showCount": true,
  "trendCount": 7,
  "trendKey": "daily_trends",
  "subRankRange": [1, 10],
  "sections": {
    "intro": { "enabled": true },
    "newRank": { "enabled": true },
    "mainRank": { "enabled": true },
    "outro": { "enabled": true }
  },
  "dataFields": {
    "newRank": "new_rank_top10",
    "mainRank": "total_rank_top20"
  }
}
```

**错误响应**:
- 500: 服务器内部错误

---

### 6.2 获取编辑器配置

**接口**: `GET /api/editor-config/:date`

**描述**: 获取期刊的自定义编辑器配置

**请求参数**:
- `date` (path, 必需): 期刊日期

**响应示例**:
```json
{
  "greeting": {
    "enabled": true,
    "text": "大家好，欢迎收看第100期周刊"
  },
  "ending": {
    "enabled": true,
    "text": "感谢收看，我们下期再见"
  },
  "cover": {
    "enabled": true,
    "image": "/covers/cover_2025-01-15.png",
    "title": "第100期周刊"
  },
  "clips": {
    "BV1xx411c7mD": {
      "startTime": 10.5,
      "endTime": 25.0
    }
  }
}
```

**错误响应**:
- 404: 配置文件不存在（返回 `{ "error": "not_found" }`）
- 500: 服务器内部错误

**说明**: 该配置文件是用户在编辑器中自定义并保存的

---

### 6.3 保存编辑器配置

**接口**: `POST /api/editor-config/:date`

**描述**: 保存期刊的自定义编辑器配置

**请求参数**:
- `date` (path, 必需): 期刊日期
- **Body**: 完整的配置对象

**请求示例**:
```json
{
  "greeting": {
    "enabled": true,
    "text": "大家好，欢迎收看第100期周刊"
  },
  "ending": {
    "enabled": true,
    "text": "感谢收看，我们下期再见"
  },
  "cover": {
    "enabled": true,
    "image": "/covers/cover_2025-01-15.png",
    "title": "第100期周刊"
  }
}
```

**响应示例**:
```json
{
  "success": true
}
```

**错误响应**:
- 500: 服务器内部错误

**说明**: 配置会保存为 `/data/{date}_config.json` 文件

---

## 文件存储结构

```
/data/
  ├── 2025-01.json              # 数据文件（月刊）
  ├── 2025-01-15.json           # 数据文件（周刊）
  ├── 2025-01_config.json       # 编辑器配置
  ├── 2025-01-15_config.json   # 编辑器配置
  └── clip_db.json              # 歌曲裁切设置数据库

/video/
  └── {date}/
      ├── intro.mp4             # 片头
      ├── rank_new_001.mp4      # 新曲榜分片
      ├── rank_new_002.mp4
      ├── rank_main_001.mp4     # 主榜分片
      ├── rank_main_002.mp4
      └── final.mp4             # 最终合并视频

/downloads/
  └── {bvid}.mp4                # B站原视频缓存
```

---

## 数据文件命名规则

- **周刊**: `YYYY-MM-DD.json`（如 `2025-01-15.json`）
- **月刊**: `YYYY-MM.json`（如 `2025-01.json`）
- **特刊**: 自定义格式

---

## 期刊类型说明

| 类型 | 文件名格式 | 识别逻辑 |
|------|-----------|----------|
| weekly | YYYY-MM-DD.json | 包含具体日期 |
| monthly | YYYY-MM.json | 仅包含年月 |
| special | 其他格式 | 其他所有格式 |

---

## 任务状态说明

| 状态 | 说明 |
|------|------|
| idle | 空闲，无任务运行 |
| processing | 任务正在执行中 |
| completed | 任务成功完成 |
| failed | 任务执行失败，可通过 `error` 字段查看错误信息 |

---

## 错误响应格式

所有错误响应统一格式：

```json
{
  "error": "错误描述信息"
}
```

常见 HTTP 状态码：
- `200`: 成功
- `400`: 请求参数错误
- `404`: 资源不存在
- `500`: 服务器内部错误

---

## 使用示例

### 完整工作流程

```javascript
// 1. 上传数据文件
await fetch('/api/upload', {
  method: 'POST',
  body: formData
});

// 2. 获取文件列表
const filesRes = await fetch('/api/files');
const { files } = await filesRes.json();

// 3. 设置歌曲裁切
await fetch('/api/clips/BV1xx411c7mD', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ startTime: 10.5, endTime: 25.0 })
});

// 4. 下载原视频
await fetch('/api/full-video/batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ bvids: ['BV1xx411c7mD'] })
});

// 5. 开始合成
await fetch('/api/synthesis/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ date: '2025-01-15' })
});

// 6. 轮询任务状态
const statusRes = await fetch('/api/status');
const status = await statusRes.json();
while (status.status === 'processing') {
  await sleep(1000);
  const statusRes = await fetch('/api/status');
  const status = await statusRes.json();
}
```

---

## 注意事项

1. **并发限制**: 同一时间只能运行一个合成任务
2. **文件名编码**: 上传文件时会自动将 Latin-1 编码转换为 UTF-8
3. **任务状态**: 合成任务在后台异步执行，需要轮询 `/api/status` 获取进度
4. **配置优先级**: 编辑器配置 (`editor-config`) 优先于默认配置 (`issue-config`)
5. **分片缓存**: 已存在的分片会被复用，需调用 `/api/synthesis/segment` 删除后才会重新渲染