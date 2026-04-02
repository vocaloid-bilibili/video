import type { IssueTypeConfig, SongInfo } from "shared-config"

type BoardType = "daily" | "weekly" | "monthly"

type RenderSongInfo = SongInfo & {
  rank: number
  _duration: number
  _defaultDuration: number
  _videoPath: string
  _thumbPath: string
  _startTime: number
  _isManual: boolean
  _isAuto: boolean

}

type EditorConfig = {
  cover: {
    image_url: string
    bvid: string
  }
  ed: {
    bvid: string
    name: string
    author: string
  }
  script: {
    opening: string
    ending: string
  },
  issueType: string
  config: IssueTypeConfig
}

type ValueAndDiff = {
  value: number
  diff: number
}

interface ArtistStat {
    name: string
    score: number
    firstname: string
    rank: number
    last_rank: number
  }


interface SongRecord {
  title: string
  bvid: string
  author: string
  pubdate: string
  name: string
  image_url: string
}


interface MillionRecord extends SongRecord {
  million_crossed: number
}

interface AchievementRecord extends SongRecord {
  honor:     string;
}

interface HistoryRecord extends SongRecord {
  view: number
  favotite: number
  coin: number
  like: number
  point: number
  rank: number
}

interface RankingData {
  date: string
  index: number
  period: string
  op: {
    title: string
    bvid: string
    author: string
    pubdate: string
    image_url: string
  }
  stat: Record<string, ValueAndDiff>
  total_rank_top20: SongInfo[]
  total_rank_sub: SongInfo[]
  new_rank_top10: SongInfo[]
  vocal_stats: ArtistStat[]
  producer_stats: ArtistStat[]
  million_record: MillionRecord[]
  history_record: HistoryRecord[]
  achievement_record: AchievementRecord[]
  [key: string]: any
}

