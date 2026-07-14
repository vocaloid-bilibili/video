// packages/shared/src/boardTypes.ts

/**
 * 期刊段落配置
 */
export type BoardType = "weekly" | "monthly" | "coverWeekly" | "special" | "near1kw";

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

export interface BaseSegmentConfig {
  duration?: number;
}

export interface TitleSegmentConfig extends BaseSegmentConfig {
  title?: string;
  color?: string;
}

export interface InfoCardSegmentConfig extends BaseSegmentConfig {
  lastPeriodLabel?: string;
}

export interface RankSegmentConfig extends BaseSegmentConfig {
  showCount?: boolean;
  trendCount?: number;
  trendKey?: string | null;
  dataField?: string | null;
}

export interface SongRankConfig extends BaseSegmentConfig {
  // 卡片组件类型: NewSongCard | MainRankCard | CoverMainRankCard | Near1kwMainRankCard | SpecialCard | PickupCard
  cardComponent: string;
  showTitle?: boolean;
  title?: string;
  color?: string;
  titleDuration?: number;
  rankCount: number;
  dataField: string;
  showCount?: boolean;
  trendCount?: number;
  trendKey?: string | null;
  connects?: number[];
  reverse?: boolean;
}

export interface SubRankTitleConfig extends BaseSegmentConfig {
  title?: string;
  color?: string;
}

export interface SubRankSegmentConfig extends BaseSegmentConfig {
  showCount?: boolean;
  trendKey?: string | null;
  range: [number, number];
  perPage: number;
  dataField: string;
}

export interface AchievementSegmentConfig extends BaseSegmentConfig {
  showCount?: boolean;
  trendCount?: number;
  trendKey?: string | null;
  dataField?: string | null;
}

export interface StatsCardSegmentConfig extends BaseSegmentConfig {
  pointThresholds?: PointThreshold[];
}

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
  boardType: BoardType;
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

const DEFAULT_WEEKLY_ORDER: SegmentOrderItem[] = [
  { type: "intro", audioMix: "op", config: { duration: 3 } },
  { type: "infoCard", audioMix: "op", config: { duration: 3 } },
  { type: "rules", audioMix: "op", config: { duration: 21 } },
  {
    type: "songRank",
    config: {
      cardComponent: "NewSongCard",
      showTitle: true,
      title: "新曲榜",
      color: "#23ade5",
      titleDuration: 2,
      rankCount: 10,
      showCount: true,
      trendCount: 7,
      trendKey: "daily_trends",
      dataField: "new_rank_top10",
    },
  },
  {
    type: "songRank",
    config: {
      cardComponent: "MainRankCard",
      showTitle: true,
      title: "主榜",
      color: "#f25d8e",
      titleDuration: 2,
      rankCount: 20,
      showCount: true,
      trendCount: 7,
      trendKey: "daily_trends",
      dataField: "total_rank_top20",
    },
  },
  { type: "singerRank", audioMix: "ed" },
  { type: "millionRank", audioMix: "ed" },
  { type: "achievementRank", audioMix: "ed" },
  { type: "historyRank", audioMix: "ed" },
  { type: "statsCard", audioMix: "ed", config: { duration: 7 } },
  { type: "staffCard", audioMix: "ed", config: { duration: 7 } },
  {
    type: "subRankTitle",
    audioMix: "ed",
    config: { title: "副榜", color: "#66ccff", duration: 2 },
  },
  {
    type: "subRank",
    audioMix: "ed",
    config: {
      showCount: true,
      trendKey: "daily_trends",
      dataField: "total_rank_sub",
      range: [21, 100],
      perPage: 4,
    },
  },
];

const DEFAULT_MONTHLY_ORDER: SegmentOrderItem[] = [
  { type: "intro", audioMix: "op", config: { duration: 3 } },
  { type: "infoCard", audioMix: "op", config: { duration: 3 } },
  { type: "rules", audioMix: "op", config: { duration: 18 } },
  {
    type: "songRank",
    config: {
      cardComponent: "NewSongCard",
      showTitle: true,
      title: "新曲榜",
      color: "#23ade5",
      titleDuration: 2,
      rankCount: 20,
      showCount: false,
      trendCount: 5,
      trendKey: "weekly_trends",
      dataField: "new_rank_top20",
    },
  },
  {
    type: "songRank",
    config: {
      cardComponent: "MainRankCard",
      showTitle: true,
      title: "主榜",
      color: "#f25d8e",
      titleDuration: 2,
      rankCount: 20,
      showCount: false,
      trendCount: 5,
      trendKey: "weekly_trends",
      dataField: "total_rank_top20",
    },
  },
  { type: "singerRank", audioMix: "ed" },
  { type: "millionRank", audioMix: "ed" },
  { type: "achievementRank", audioMix: "ed" },
  { type: "historyRank", audioMix: "ed" },
  { type: "statsCard", audioMix: "ed", config: { duration: 7 } },
  { type: "staffCard", audioMix: "ed", config: { duration: 7 } },
  {
    type: "subRankTitle",
    audioMix: "ed",
    config: { title: "副榜", color: "#66ccff", duration: 2 },
  },
  {
    type: "subRank",
    audioMix: "ed",
    config: {
      showCount: false,
      trendKey: "weekly_trends",
      dataField: "total_rank_sub",
      range: [21, 200],
      perPage: 4,
    },
  },
];

const DEFAULT_COVER_WEEKLY_ORDER: SegmentOrderItem[] = [
  { type: "intro", audioMix: "op", config: { duration: 3 } },
  { type: "infoCard", audioMix: "op", config: { duration: 3 } },
  { type: "rules", audioMix: "op", config: { duration: 18 } },
  { type: "singerRank", audioMix: "op", config: { duration: 7 } },
  { type: "staffCard", audioMix: "op", config: { duration: 7 } },
  {
    type: "songRank",
    config: {
      cardComponent: "CoverMainRankCard",
      showTitle: true,
      title: "主榜",
      color: "#f25d8e",
      titleDuration: 2,
      rankCount: 20,
      showCount: true,
      trendCount: 7,
      trendKey: "daily_trends",
      dataField: "total_rank_top20",
    },
  },
];

const DEFAULT_SPECIAL_ORDER: SegmentOrderItem[] = [
  {
    type: "songRank",
    config: {
      cardComponent: "SpecialCard",
      showTitle: false,
      dataField: "total_rank_top20",
      rankCount: 20,
    },
  },
];

const DEFAULT_NEAR1KW_ORDER: SegmentOrderItem[] = [
  { type: "intro", audioMix: "op", config: { duration: 3 } },
  { type: "infoCard", audioMix: "op", config: { duration: 3 } },
  { type: "rules", audioMix: "op", config: { duration: 18 } },
  {
    type: "songRank",
    config: {
      cardComponent: "NewTenMillion",
      showTitle: true,
      title: "千万达成",
      color: "#23ade5",
      titleDuration: 2,
      showCount: false,
      dataField: "ten_million_record",
    },
  },
  {
    type: "songRank",
    config: {
      cardComponent: "Near1kwMainRankCard",
      showTitle: true,
      title: "主榜",
      color: "#f25d8e",
      titleDuration: 2,
      rankCount: 20,
      showCount: false,
      dataField: "score_top20",
    },
  },
  { type: "staffCard", audioMix: "ed", config: { duration: 7 } },
  {
    type: "subRank",
    audioMix: "ed",
    config: {
      showCount: false,
      dataField: "view_rank_all",
      range: [21, 100],
      perPage: 4,
    },
  },
]
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
    showAchievements: false,

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

  near1kw: {
    boardType: "near1kw",
    boardLabel: "近千万刊",
    datePattern: /^friday_million_issue_\d+$/,

    achievementCount: 0,

    trendCount:0,
    trendKey:null,

    pointThresholds: null,
    playRateCoef: 10,
    showCount: false,
    showAchievements: false,

    audioFade: true,
    fadeDuration: 2,

    segmentOrder: DEFAULT_NEAR1KW_ORDER,
  }
};

function cloneValue<T>(value: T): T {
  if (value instanceof RegExp) return value;

  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        cloneValue(item),
      ]),
    ) as T;
  }

  return value;
}

function resolveBoardType(value: string): BoardType {
  return value in ISSUE_TYPES ? (value as BoardType) : "special";
}

export function detectBoardType(dateStr: string): BoardType {
  if (ISSUE_TYPES.weekly.datePattern?.test(dateStr)) return "weekly";
  if (ISSUE_TYPES.monthly.datePattern?.test(dateStr)) return "monthly";
  if (ISSUE_TYPES.coverWeekly.datePattern?.test(dateStr)) return "coverWeekly";
  if (ISSUE_TYPES.near1kw.datePattern?.test(dateStr)) return "near1kw";
  return "special";
}

export function getDerivedValues(config: BoardTypeConfig): DerivedValues {
  const subRankConfig = config.segmentOrder.find(
    (item) => item.type === "subRank",
  )?.config as SubRankSegmentConfig | undefined;

  const isMonthly = config.boardLabel === "月刊";
  const isSpecial = config.boardLabel === "特刊";
  const isNear1kw = config.boardLabel === "近千万刊";

  const subMax = subRankConfig?.range[1] ?? (isMonthly ? 200 : 100);

  const getTitleConfig = (type: SegmentType) => {
    const item = config.segmentOrder.find((segment) => segment.type === type);
    return (item?.config as Record<string, unknown>) || {};
  };

  const achievementTitleConfig = getTitleConfig("achievementTitle");
  const subRankTitleConfig = getTitleConfig("subRankTitle");

  return {
    subRankMax: subMax,
    topN: subMax,
    newSongPeriod: isMonthly || isSpecial ? "当月" : "2周内",
    lastPeriodLabel: isMonthly ? "上月" : "上期",
    achievementTitleFull: `${achievementTitleConfig.title || "成就"}共 ${
      config.achievementCount ?? 0
    } 首达成`,
    subRankTitleFull: subMax
      ? `${subRankTitleConfig.title || "副榜"} Top ${subMax}`
      : "",
  };
}

export interface IssueConfig extends BoardTypeConfig, DerivedValues {
  _type: BoardType;
  _date: string;
  [key: string]: unknown;
}

export function getIssueConfig(
  name: string,
  infoData: { boardType?: string; config?: Partial<BoardTypeConfig> } = {},
): IssueConfig {
  const type = resolveBoardType(infoData.boardType || detectBoardType(name));
  const baseConfig = cloneValue(ISSUE_TYPES[type]);

  if (infoData.config) {
    deepMerge(
      baseConfig as unknown as Record<string, unknown>,
      infoData.config as unknown as Record<string, unknown>,
    );
  }

  const configWithRuntime = baseConfig as unknown as IssueConfig;
  configWithRuntime._type = type;
  configWithRuntime.boardType = type;
  configWithRuntime._date = name;

  Object.assign(configWithRuntime, getDerivedValues(baseConfig));

  return configWithRuntime;
}

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

export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>,
): T {
  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      if (!target[key]) (target as Record<string, unknown>)[key] = {};

      deepMerge(
        target[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>,
      );
    } else {
      (target as Record<string, unknown>)[key] = source[key] as unknown;
    }
  }

  return target;
}
