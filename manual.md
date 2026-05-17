# 如何做视频

非常幸运，幻梦已经把前端部署到网站上了，所以前端的部分你可以不用管，只要运行后端就可以了。

运行后端只需要一行代码：

```
pnpm start
```

首先你需要导出的JSON数据。按照那边数据脚本导出的就是符合格式的。

## 如何写配置文件

配置文件的文件名就是前面那个数据文件的文件名，后面加上 `_config` 。基本上参照以下格式：

```json
{
  "cover": {
    "bvid": "BV1W8cwzeEr1",
    "image_url": "http://i1.hdslb.com/bfs/archive/98a7f2cbbf259b8d54307b5e023c7213eb645f3c.jpg"
  },
  "ed": {
    "bvid": "BV1Nx411N7cR",
    "name": "好き！雪！本気マジック",
    "author": "Mitchie M"
  },
  "script": {
    "opening": "修改了搬运视频的补正系数\n你懂的吧",
    "ending": "这里什么也没有"
  }
}

```

## 如何做特刊

注意特刊文件最前面必须以 `special_` 开头。

然后你还需要 config 文件，里面除了写基本的那些配置之外，还要增加一个 `config` 字段，用于设置这个特刊的特别定制配置。

参考 [boardTypes.ts](/packages/shared/src/boardTypes.ts) 里面对标准刊的定义，你需要自己更改其中的一些字段，其中最重要的是 `segmentOrder` 字段，你需要完全自己定义这个特刊的段落。示例如下：

```json
{
  "script": {
    "opening": "梦的结唱特刊10。这次尝试了全部自动化"
  },
  "boardType": "special",
  "config": {
    "segmentOrder": [
      { "type": "infoCard", "audioMix": "op", "config": { "duration": 5 } },
      { "type": "rules", "audioMix": "op", "config": { "duration": 35 } },
      {
        "type": "songRank",
        "config": {
          "cardComponent": "PickupCard",
          "showTitle": true,
          "title": "PICKUP",
          "color": "#f25d8e",
          "titleDuration": 2,
          "showCount": false,
          "dataField": "pickup_songs",
          "rankCount": 10,
          "reverse": true
        }
      },
      {
        "type": "songRank",
        "config": {
          "cardComponent": "SpecialCard",
          "showTitle": true,
          "title": "主榜",
          "color": "#f25d8e",
          "titleDuration": 2,
          "showCount": false,
          "dataField": "songs",
          "rankCount": 30
        }
      }
    ]
  }
}

```
