
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
      "boardType": "monthly",
      "boardTypeName": "月刊"
    },
    {
      "date": "2025-01-15",
      "dataFile": "2025-01-15.json",
      "hasConfig": false,
      "hasVideo": false,
      "boardType": "weekly",
      "boardTypeName": "周刊"
    }
  ]
}
```

**字段说明**:
- `date`: 期刊日期（文件名去掉.json后缀）
- `dataFile`: 数据文件名
- `hasConfig`: 是否存在配置文件（`{date}_config.json`）
- `hasVideo`: 是否已生成完整视频
- `boardType`: 期刊类型（`weekly`/`monthly`/`special`）
- `boardTypeName`: 期刊类型中文名称

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
  "boardType": "weekly"
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
  "boardType": "weekly",
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

