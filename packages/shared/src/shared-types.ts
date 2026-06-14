// shared-types.d.ts
// 共享类型定义（控制器 + Remotion 通用）

/**
 * 数字或无（"-"）
 */
export type NumberOrNone = number | "-";

/**
 * 数据统计
 */
export interface Stats {
  view: number;
  favorite: number;
  coin: number;
  like: number;
  danmaku: number;
  reply: number;
  share: number;

  viewR: number;
  favoriteR: number;
  coinR: number;
  likeR: number;
  danmakuR: number;
  replyR: number;
  shareR: number;

  fixA: number;
  fixB: number;
  fixC: number;
  fixD: number;

  point: number;

  thumbnail: string;

  view_rank: number;
  favorite_rank: number;
  coin_rank: number;
  like_rank: number;
  danmaku_rank: number;
  reply_rank: number;
  share_rank: number;
}

/**
 * 歌曲信息
 */
export interface SongInfo {
  title: string;
  bvid: string;
  aid: number;
  name: string;
  producer: string;
  uploader: string;
  copyright: number;
  synthesizer: string;
  vocalist: string;
  type: string;
  pubdate: string;
  duration: string;
  page: number;
  thumbnail: string;
  rank: number;
  count: number;
  daily_trends: unknown;
  honor: unknown[]
}

/**
 * 附加信息
 */
export interface Appendix {
  showCount: boolean;
  trendKey: string;
  trendCount: number;
  videoSource: string;
  point: number;
}

/**
 * 基础排名数据
 */
export type BasicRank = Stats & SongInfo & Appendix & {
  rank: number;
};

/**
 * 周榜主数据
 */
export interface WeeklyMain extends BasicRank {
  count: number;
  rank_before: NumberOrNone;
  point_before: NumberOrNone;
  rate: string;
  honor: unknown[];
  seperate_ranks: Record<string, NumberOrNone>;
}

/**
 * 路径配置
 */
export interface PathConfig {
  base: string;
  segments: string;
  final: string;
}



export interface Appendix {
  showCount: boolean;
  trendKey: string;
  trendCount: number;
  videoSource: string;
  point: number;
}

export interface Stats {
  view:          number;
  favorite:      number;
  coin:          number;
  like:          number;
  danmaku:       number;
  reply:         number;
  share:         number;
  viewR:         number;
  favoriteR:     number;
  coinR:         number;
  likeR:         number;
  danmakuR:      number;
  replyR:        number;
  shareR:        number;
  fixA:          number;
  fixB:          number;
  fixC:          number;
  fixD:          number;
  point:         number;
  thumbnail:     string;
  view_rank:     number;
  favorite_rank: number;
  coin_rank:     number;
  like_rank:     number;
  danmaku_rank:  number;
  reply_rank:    number;
  share_rank:    number;
}



