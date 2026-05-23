/**
 * 期刊段落配置
 */
export type BoardType = 
  | "weekly"
  | "monthly"
  | "coverWeekly"
  | "special"

// 段落类型枚举
// 注意: songRank 统一处理歌曲展示，通过 cardComponent 区分具体组件
export type SegmentType = 
  | "intro" 
  | "infoCard" 
  | "rules"
  | "achievementTitle"
  | "songRank"
  | "singerRank"
  | "millionRank"
  | "achievementRank"
  | "historyRank"
  | "statsCard"
  | "staffCard"
  | "subRankTitle"
  | "subRank";

// ========== 段落配置接口 ==========

// 基础段落配置
export interface BaseSegmentConfig {
  duration?: number;
}

// 标题段落配置
export interface TitleSegmentConfig extends BaseSegmentConfig {
  title?: string;
  color?: string;
}

// 信息卡片配置
export interface InfoCardSegmentConfig extends BaseSegmentConfig {
  lastPeriodLabel?: string;
}

// 榜单基础配置（用于 singerRank、millionRank、achievementRank、historyRank 等）
export interface RankSegmentConfig extends BaseSegmentConfig {
  showCount?: boolean;
  trendCount?: number;
  trendKey?: string | null;
  dataField?: string | null;
}

// 歌曲展示配置（统一处理 newRank、mainRank、newAchievement）
export interface SongRankConfig extends BaseSegmentConfig {
  // 卡片组件类型: achievementCard | NewSongCard | MainRankCard | CoverMainRankCard | SpecialCard
  cardComponent: string;
  // 标题配置（合并了原来的 xxxRankTitle）
  showTitle?: boolean;
  title?: string;
  color?: string;
  titleDuration?: number;
  // 歌曲数量配置
  rankCount: number;
  // 数据源字段
  dataField: string;
  // 趋势数据配置
  showCount?: boolean;
  trendCount?: number;
  trendKey?: string | null;
  // 成就专用：成就数据字段
  achievementDataField?: string | null;
  // 无缝剪辑指定。写法与排名无关，就是第几个视频前面是无缝，比如3表示第3、4个视频之间无缝
  connects?: number[]
  // 顺序反向，从高分到低分
  reverse?: boolean
}

// 副榜标题配置
export interface SubRankTitleConfig extends BaseSegmentConfig {
  title?: string;
  color?: string;
}

// 副榜配置
export interface SubRankSegmentConfig extends BaseSegmentConfig {
  showCount?: boolean;
  trendKey?: string | null;
  range: [number, number];
  perPage: number;
  dataField: string;
}

// 成就展示配置（用于 achievementRank 等）
export interface AchievementSegmentConfig extends BaseSegmentConfig {
  showCount?: boolean;
  trendCount?: number;
  trendKey?: string | null;
  dataField?: string | null;
}

// 数据统计配置
export interface StatsCardSegmentConfig extends BaseSegmentConfig {
  pointThresholds?: PointThreshold[];
}

// type 到 config 类型的映射
export interface SegmentConfigMap {
  intro: BaseSegmentConfig;
  infoCard: InfoCardSegmentConfig;
  rules: BaseSegmentConfig;
  achievementTitle: TitleSegmentConfig;
  songRank: SongRankConfig;
  singerRank: RankSegmentConfig;
  millionRank: RankSegmentConfig;
  achievementRank: RankSegmentConfig;
  historyRank: RankSegmentConfig;
  statsCard: StatsCardSegmentConfig;
  staffCard: BaseSegmentConfig;
  subRankTitle: SubRankTitleConfig;
  subRank: SubRankSegmentConfig;
}

// 段落配置项，使用泛型根据 type 推断 config 类型
export interface SegmentOrderItem<T extends SegmentType = SegmentType> {
  type: T;
  audioMix?: "op" | "ed";
  config?: SegmentConfigMap[T];
}

export interface PointThreshold {
  key: string;
  label: string;
}

export interface BoardTypeConfig {
  boardType: string
  boardLabel: string;
  datePattern: RegExp | null;
  achievementCount?: number;
  trendCount: number;
  trendKey: string | null;
  pointThresholds: PointThreshold[] | null;
  playRateCoef: number;
  showCount: boolean;
  showAchievements: boolean;
  specialRateNote?: boolean;
  audioFade: boolean;
  fadeDuration: number;
  timeRange?: string;
  // 段落顺序配置：定义视频中各段落的排列顺序
  segmentOrder: SegmentOrderItem[];
}

export interface DerivedValues {
  subRankMax: number;
  topN: number;
  newSongPeriod: string;
  lastPeriodLabel: string;
  achievementTitleFull: string;
  subRankTitleFull: string;
}


// 默认段落顺序（周刊标准顺序）
const DEFAULT_WEEKLY_ORDER: SegmentOrderItem[] = [
  { type: "intro", audioMix: "op", config: { duration: 3 } },
  { type: "infoCard", audioMix: "op", config: { duration: 5 } },
  { type: "rules", audioMix: "op", config: { duration: 35 } },
  // 成就展示（通过 cardComponent 区分）
  { type: "songRank", config: { 
    cardComponent: "achievementCard",
    showTitle: false,
    rankCount: 10,
    showCount: true, trendCount: 7, trendKey: "daily_trends",
    achievementDataField: "achievement_data"
  } },
  // 新曲榜
  { type: "songRank", config: { 
    cardComponent: "NewSongCard",
    showTitle: true, title: "新曲榜", color: "#23ade5", titleDuration: 2, rankCount: 10,
    showCount: true, trendCount: 7, trendKey: "daily_trends", dataField: "new_rank_top10"
  } },
  // 主榜
  { type: "songRank", config: { 
    cardComponent: "MainRankCard",
    showTitle: true, title: "主榜", color: "#f25d8e", titleDuration: 2, rankCount: 20,
    showCount: true, trendCount: 7, trendKey: "daily_trends", dataField: "total_rank_top20"
  } },
  { type: "singerRank", audioMix: "ed" },
  { type: "millionRank", audioMix: "ed" },
  { type: "achievementRank", audioMix: "ed" },
  { type: "historyRank", audioMix: "ed" },
  { type: "statsCard", audioMix: "ed", config: { duration: 7 } },
  { type: "staffCard", audioMix: "ed", config: { duration: 7 } },
  { type: "subRankTitle", audioMix: "ed", config: { title: "副榜", color: "#66ccff", duration: 2 } },
  { type: "subRank", audioMix: "ed", config: { 
    showCount: true, trendKey: "daily_trends", dataField: "total_rank_sub", range: [21, 100], perPage: 4
   } },
];

// 月刊默认顺序
const DEFAULT_MONTHLY_ORDER: SegmentOrderItem[] = [
  { type: "intro", audioMix: "op", config: { duration: 3 } },
  { type: "infoCard", audioMix: "op", config: { duration: 5 } },
  { type: "rules", audioMix: "op", config: { duration: 30 } },
  // 新曲榜
  { type: "songRank", config: { 
    cardComponent: "NewSongCard",
    showTitle: true, title: "新曲榜", color: "#23ade5", titleDuration: 2, rankCount: 20,
    showCount: false, trendCount: 5, trendKey: "weekly_trends", dataField: "new_rank_top20"
  } },
  // 主榜
  { type: "songRank", config: { 
    cardComponent: "MainRankCard",
    showTitle: true, title: "主榜", color: "#f25d8e", titleDuration: 2, rankCount: 20,
    showCount: false, trendCount: 5, trendKey: "weekly_trends", dataField: "total_rank_top20"
  } },
  { type: "singerRank", audioMix: "ed" },
  { type: "millionRank", audioMix: "ed" },
  { type: "achievementRank", audioMix: "ed" },
  { type: "historyRank", audioMix: "ed" },
  { type: "statsCard", audioMix: "ed", config: { duration: 7 } },
  { type: "staffCard", audioMix: "ed", config: { duration: 7 } },
  { type: "subRankTitle", audioMix: "ed", config: { title: "副榜", color: "#66ccff", duration: 2 } },
  { type: "subRank", audioMix: "ed", config: { 
    showCount: false, trendKey: "weekly_trends", dataField: "total_rank_sub", range: [21, 200], perPage: 4 } },
];

// 翻唱周刊默认顺序（只有intro和rules，没有成就和新曲榜）
const DEFAULT_COVER_WEEKLY_ORDER: SegmentOrderItem[] = [
  { type: "intro", audioMix: "op", config: { duration: 3 } },
  { type: "infoCard", audioMix: "op", config: { duration: 5 } },
  { type: "rules", audioMix: "op", config: { duration: 30 } },
  { type: "singerRank", audioMix: "op", config: { duration: 7 } },
  { type: "staffCard", audioMix: "op", config: { duration: 7 } },
  // 主榜
  { type: "songRank", config: { 
    cardComponent: "CoverMainRankCard",
    showTitle: true, title: "主榜", color: "#f25d8e", titleDuration: 2, rankCount: 20,
    showCount: true, trendCount: 7, trendKey: "daily_trends", dataField: "total_rank_top20"
  } }]


// 特刊默认顺序（通常只有排行榜，不加OP/ED）
const DEFAULT_SPECIAL_ORDER: SegmentOrderItem[] = [
  // 主榜（默认不显示标题）
  { type: "songRank", config: { cardComponent: "SpecialCard", showTitle: false, dataField: "total_rank_top20", rankCount: 20 } },
];

/**
 * 这些是刊物默认的配置。
 * 你可以在config文件中填写config字段，会覆盖这里面的字段。
 * 注意，一个字段会被完整覆盖，比如你想要更改segmentOrder就要填写完整的segmentOrder。
 */
export const ISSUE_TYPES: Record<BoardType, BoardTypeConfig> = {
  weekly: {
    boardType: "weekly",
    boardLabel: "周刊",
    datePattern: /^\d{4}-\d{2}-\d{2}$/,

    achievementCount: 1,

    trendCount: 7,
    trendKey: "daily_trends",

    pointThresholds: [
      { key: "count_over_500k", label: "50万分以上" },
      { key: "count_over_100k", label: "10万分以上" },
      { key: "count_over_50k", label: "5万分以上" },
    ],

    playRateCoef: 10,

    showCount: true,
    showAchievements: true,

    audioFade: true,
    fadeDuration: 2,

    segmentOrder: DEFAULT_WEEKLY_ORDER,
  },

  monthly: {
    boardType: "monthly",
    boardLabel: "月刊",
    datePattern: /^\d{4}-\d{2}$/,

    trendCount: 5,
    trendKey: "weekly_trends",

    pointThresholds: [
      { key: "count_over_1m", label: "100万分以上" },
      { key: "count_over_500k", label: "50万分以上" },
      { key: "count_over_100k", label: "10万分以上" },
    ],

    playRateCoef: 15,
    
    showCount: false,
    showAchievements: false,

    audioFade: true,
    fadeDuration: 2,

    segmentOrder: DEFAULT_MONTHLY_ORDER,
  },

  coverWeekly: {
    boardType: "coverWeekly",
    boardLabel: "翻唱周刊",
    datePattern: /^cover_\d{4}-\d{2}-\d{2}$/,

    trendCount: 0,
    trendKey: null,

    pointThresholds: [
      { key: "count_over_500k", label: "50万分以上" },
      { key: "count_over_100k", label: "10万分以上" },
      { key: "count_over_50k", label: "5万分以上" },
    ],

    playRateCoef: 10,

    showCount: true,
    showAchievements: true,

    audioFade: true,
    fadeDuration: 2,

    segmentOrder: DEFAULT_COVER_WEEKLY_ORDER,
  },

  special: {
    boardType: "special",
    boardLabel: "特刊",
    datePattern: null,

    trendCount: 0,
    trendKey: null,

    pointThresholds: null,
    playRateCoef: 15,
    showCount: false,
    showAchievements: false,
    specialRateNote: true,

    audioFade: false,
    fadeDuration: 0,

    segmentOrder: DEFAULT_SPECIAL_ORDER,
  },
};

export function detectBoardType(dateStr: string): string {
  if (ISSUE_TYPES.weekly.datePattern?.test(dateStr)) return "weekly";
  if (ISSUE_TYPES.monthly.datePattern?.test(dateStr)) return "monthly";
  if (ISSUE_TYPES.coverWeekly.datePattern?.test(dateStr)) return "coverWeekly";
  return "special";
}

export function getDerivedValues(config: BoardTypeConfig): DerivedValues {
  const subMax = (config.segmentOrder.filter((item => item.type == 'subRank'))[0]?.config as SubRankSegmentConfig)?.range[1] ?? 100;

  const isMonthly = config.boardLabel === "月刊";
  const isSpecial = config.boardLabel === "特刊";

  // 从 segmentOrder 中获取各标题的配置
  const getTitleConfig = (type: SegmentType) => {
    const item = config.segmentOrder.find(s => s.type === type);
    return item?.config as Record<string, unknown> || {};
  };

  const achievementTitleConfig = getTitleConfig("achievementTitle");
  const subRankTitleConfig = getTitleConfig("subRankTitle");

  return {
    subRankMax: subMax,
    topN: subMax,
    newSongPeriod: isMonthly || isSpecial ? "当月" : "2周内",
    lastPeriodLabel: isMonthly ? "上月" : "上期",
    achievementTitleFull: `${achievementTitleConfig.title || "成就"}共 ${config.achievementCount} 首达成`,
    subRankTitleFull: subMax
      ? `${subRankTitleConfig.title || "副榜"} Top ${subMax}`
      : "",
  };
}

// 扩展配置类型，包含运行时添加的字段
export interface IssueConfig extends BoardTypeConfig, DerivedValues {
  _type: string;
  _date: string;
  [key: string]: unknown;
}

export function getIssueConfig(name: string, infoData: { boardType?: string; config?: Partial<BoardTypeConfig> } = {}): IssueConfig {
  const boardType = detectBoardType(name);
  const type = ( infoData.boardType || detectBoardType(name) ) as keyof typeof ISSUE_TYPES

  const baseConfig = JSON.parse(
    JSON.stringify(ISSUE_TYPES[type] || ISSUE_TYPES.special),
  ) as BoardTypeConfig;

  if (infoData.config) {
    deepMerge(baseConfig as unknown as Record<string, unknown>, infoData.config as unknown as Record<string, unknown>);
  }

  const configWithRuntime = baseConfig as unknown as IssueConfig;
  configWithRuntime._type = type;
  configWithRuntime.boardType = type;
  configWithRuntime._date = name;

  Object.assign(configWithRuntime, getDerivedValues(baseConfig));

  return configWithRuntime;
}

// 获取所有可用的段落类型
export function getAllSegmentTypes(): SegmentType[] {
  return [
    "intro",
    "infoCard",
    "rules",
    "achievementTitle",
    "songRank",
    "singerRank",
    "millionRank",
    "achievementRank",
    "historyRank",
    "statsCard",
    "staffCard",
    "subRankTitle",
    "subRank",
  ];
}

export function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      if (!target[key]) (target as Record<string, unknown>)[key] = {};
      deepMerge(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
    } else {
      (target as Record<string, unknown>)[key] = source[key] as unknown;
    }
  }
  return target;
}
