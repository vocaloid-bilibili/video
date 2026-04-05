/**
 * 期刊段落配置
 */

// 段落类型枚举
export type SegmentType = 
  | "intro" 
  | "infoCard" 
  | "rules"
  | "achievementTitle"
  | "newachievement"
  | "newRankTitle"
  | "newRank"
  | "mainRankTitle"
  | "mainRank"
  | "singerRank"
  | "millionRank"
  | "achievementRank"
  | "historyRank"
  | "statsCard"
  | "staffCard"
  | "subRankTitle"
  | "subRank";

// 段落配置项
export interface SegmentOrderItem {
  type: SegmentType;
  title?: string;  // 可选的标题配置
  color?: string;  // 可选的颜色配置
  audioMix?: "op" | "ed";  // 音频混音标记：op=OP混音，ed=ED混音
}

export interface SectionConfig {
  enabled: boolean;
  duration?: number;
  title?: string;
  color?: string;
}

export interface PointThreshold {
  key: string;
  label: string;
}

export interface BoardTypeConfig {
  name: string;
  datePattern: RegExp | null;
  achievementCount?: number;
  newRankCount: number;
  mainRankCount: number;
  subRankRange: [number, number] | null;
  subRankPerPage: number;
  trendCount: number;
  trendKey: string | null;
  pointThresholds: PointThreshold[] | null;
  playRateCoef: number;
  showCount: boolean;
  showAchievements: boolean;
  specialRateNote?: boolean;
  sections: {
    intro: SectionConfig;
    infoCard: SectionConfig;
    rules: SectionConfig;
    achievementTitle: SectionConfig;
    newachievement: SectionConfig;
    newRankTitle: SectionConfig;
    newRank: SectionConfig;
    mainRankTitle: SectionConfig;
    mainRank: SectionConfig;
    singerRank: SectionConfig;
    millionRank: SectionConfig;
    achievementRank: SectionConfig;
    historyRank: SectionConfig;
    statsCard: SectionConfig;
    staffCard: SectionConfig;
    subRankTitle: SectionConfig;
    subRank: SectionConfig;
  };
  audioFade: boolean;
  fadeDuration: number;
  // 要用JSON文件的哪个字段作为这几个榜的数据
  dataFields: {
    newachievement?: string | null;
    newRank: string | null;
    mainRank: string | null;
    subRank: string | null;
  };
  // 段落顺序配置：定义视频中各段落的排列顺序
  // 每个元素指定一个段落的类型，可以是单个类型字符串，也可以是带配置的数组
  segmentOrder: SegmentOrderItem[];
}

export interface DerivedValues {
  subRankMax: number;
  topN: number;
  newSongPeriod: string;
  lastPeriodLabel: string;
  achievementTitleFull: string;
  newRankTitleFull: string;
  mainRankTitleFull: string;
  subRankTitleFull: string;
}

// 默认段落顺序（周刊标准顺序）
const DEFAULT_WEEKLY_ORDER: SegmentOrderItem[] = [
  { type: "intro", audioMix: "op" },
  { type: "infoCard", audioMix: "op" },
  { type: "rules", audioMix: "op" },
  { type: "achievementTitle" },
  { type: "newachievement" },
  { type: "newRankTitle" },
  { type: "newRank" },
  { type: "mainRankTitle" },
  { type: "mainRank" },
  { type: "singerRank", audioMix: "ed"  },
  { type: "millionRank", audioMix: "ed"  },
  { type: "achievementRank", audioMix: "ed"  },
  { type: "historyRank", audioMix: "ed"  },
  { type: "statsCard", audioMix: "ed"  },
  { type: "staffCard", audioMix: "ed" },
  { type: "subRankTitle", audioMix: "ed" },
  { type: "subRank", audioMix: "ed" },
];

// 月刊默认顺序
const DEFAULT_MONTHLY_ORDER: SegmentOrderItem[] = [
  { type: "intro", audioMix: "op" },
  { type: "infoCard", audioMix: "op" },
  { type: "rules", audioMix: "op" },
  { type: "newRankTitle" },
  { type: "newRank" },
  { type: "mainRankTitle" },
  { type: "mainRank" },
  { type: "singerRank", audioMix: "ed"  },
  { type: "millionRank", audioMix: "ed"  },
  { type: "historyRank", audioMix: "ed"  },
  { type: "statsCard", audioMix: "ed"  },
  { type: "staffCard", audioMix: "ed" },
  { type: "subRankTitle", audioMix: "ed" },
  { type: "subRank", audioMix: "ed" },
];

// 翻唱周刊默认顺序（只有intro和rules，没有成就和新曲榜）
const DEFAULT_COVER_WEEKLY_ORDER: SegmentOrderItem[] = [
  { type: "intro", audioMix: "op" },
  { type: "rules", audioMix: "op" },
  { type: "mainRankTitle" },
  { type: "mainRank" },
  //{ type: "staffCard", audioMix: "ed" },
  //{ type: "subRankTitle", audioMix: "ed" },
];

// 特刊默认顺序（通常只有排行榜，不加OP/ED）
const DEFAULT_SPECIAL_ORDER: SegmentOrderItem[] = [
  { type: "mainRankTitle" },
  { type: "mainRank" },
];

export const ISSUE_TYPES: Record<string, BoardTypeConfig> = {
  weekly: {
    name: "周刊",
    datePattern: /^\d{4}-\d{2}-\d{2}$/,

    achievementCount: 1,
    newRankCount: 10,
    mainRankCount: 20,
    subRankRange: [21, 100],
    subRankPerPage: 4,

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

    sections: {
      intro: { enabled: true, duration: 3 },
      infoCard: { enabled: true, duration: 5 },
      rules: { enabled: true, duration: 35 },

      achievementTitle: {
        enabled: true,
        duration: 2,
        title: "成就达成展示",
        color: "#FFD700",
      },
      newachievement: { enabled: true },

      newRankTitle: {
        enabled: true,
        duration: 2,
        title: "新曲榜",
        color: "#23ade5",
      },
      newRank: { enabled: true },

      mainRankTitle: {
        enabled: true,
        duration: 2,
        title: "主榜",
        color: "#f25d8e",
      },
      mainRank: { enabled: true },

      singerRank: { enabled: true },
      millionRank: { enabled: true },
      achievementRank: { enabled: true },
      historyRank: { enabled: true },
      statsCard: { enabled: true },
      staffCard: { enabled: true },

      subRankTitle: {
        enabled: true,
        duration: 2,
        title: "副榜",
        color: "#66ccff",
      },
      subRank: { enabled: true },
    },

    audioFade: true,
    fadeDuration: 2,

    dataFields: {
      newachievement: "achievement_data",
      newRank: "new_rank_top10",
      mainRank: "total_rank_top20",
      subRank: "total_rank_sub",
    },

    segmentOrder: DEFAULT_WEEKLY_ORDER,
  },

  monthly: {
    name: "月刊",
    datePattern: /^\d{4}-\d{2}$/,

    newRankCount: 20,
    mainRankCount: 20,
    subRankRange: [21, 200],
    subRankPerPage: 4,

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

    sections: {
      intro: { enabled: true, duration: 3 },
      infoCard: { enabled: true, duration: 5 },
      rules: { enabled: true, duration: 30 },
      achievementTitle: { enabled: false },
      newachievement: { enabled: false }, 

      newRankTitle: {
        enabled: true,
        duration: 2,
        title: "新曲榜",
        color: "#23ade5",
      },
      newRank: { enabled: true },
      mainRankTitle: {
        enabled: true,
        duration: 2,
        title: "主榜",
        color: "#f25d8e",
      },
      mainRank: { enabled: true },
      singerRank: { enabled: true },
      millionRank: { enabled: true },
      achievementRank: { enabled: false },
      historyRank: { enabled: true },
      statsCard: { enabled: true },
      staffCard: { enabled: true },
      subRankTitle: {
        enabled: true,
        duration: 2,
        title: "副榜",
        color: "#66ccff",
      },
      subRank: { enabled: true },
    },

    audioFade: true,
    fadeDuration: 2,

    dataFields: {
      newRank: "new_rank_top20",
      mainRank: "total_rank_top20",
      subRank: "total_rank_sub",
    },

    segmentOrder: DEFAULT_MONTHLY_ORDER,
  },

  coverWeekly: {
    name: "周刊",
    datePattern: /^cover_\d{4}-\d{2}-\d{2}$/,

    achievementCount: 1,
    newRankCount: 10,
    mainRankCount: 20,
    subRankRange: [21, 100],
    subRankPerPage: 4,

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

    sections: {
      intro: { enabled: true, duration: 3 },
      infoCard: { enabled: false, duration: 5 },
      rules: { enabled: true, duration: 35 },

      achievementTitle: {
        enabled: false,
        duration: 2,
        title: "成就达成展示",
        color: "#FFD700",
      },
      newachievement: { enabled: false },

      newRankTitle: {
        enabled: false,
        duration: 2,
        title: "新曲榜",
        color: "#23ade5",
      },
      newRank: { enabled: false },

      mainRankTitle: {
        enabled: true,
        duration: 2,
        title: "主榜",
        color: "#f25d8e",
      },
      mainRank: { enabled: true },

      singerRank: { enabled: false },
      millionRank: { enabled: false },
      achievementRank: { enabled: false },
      historyRank: { enabled: false },
      statsCard: { enabled: false },
      staffCard: { enabled: true },

      subRankTitle: {
        enabled: true,
        duration: 2,
        title: "副榜",
        color: "#66ccff",
      },
      subRank: { enabled: false },
    },

    audioFade: true,
    fadeDuration: 2,

    dataFields: {
      newachievement: "achievement_data",
      newRank: "new_rank_top10",
      mainRank: "songs",
      subRank: "total_rank_sub",
    },

    segmentOrder: DEFAULT_COVER_WEEKLY_ORDER,
  },

  special: {
    name: "特刊",
    datePattern: null,

    newRankCount: 0,
    mainRankCount: 20,
    subRankRange: null,
    subRankPerPage: 4,

    trendCount: 0,
    trendKey: null,

    pointThresholds: null,
    playRateCoef: 15,
    showCount: false,
    showAchievements: false,
    specialRateNote: true,

    sections: {
      intro: { enabled: false },
      infoCard: { enabled: false },
      rules: { enabled: false },
      achievementTitle: { enabled: false },
      newachievement: { enabled: false }, 
      newRankTitle: { enabled: false },
      newRank: { enabled: false },
      mainRankTitle: { enabled: true, duration: 2 },
      mainRank: { enabled: true },
      singerRank: { enabled: false },
      millionRank: { enabled: false },
      achievementRank: { enabled: false },
      historyRank: { enabled: false },
      statsCard: { enabled: false },
      staffCard: { enabled: false },
      subRankTitle: { enabled: false },
      subRank: { enabled: false },
    },

    audioFade: false,
    fadeDuration: 0,

    dataFields: {
      newRank: null,
      mainRank: "total_rank_top20",
      subRank: null,
    },

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
  const subMax = config.subRankRange ? config.subRankRange[1] : 100;

  const isMonthly = config.name === "月刊";
  const isSpecial = config.name === "特刊";

  return {
    subRankMax: subMax,

    topN: subMax,

    newSongPeriod: isMonthly || isSpecial ? "当月" : "2周内",

    lastPeriodLabel: isMonthly ? "上月" : "上期",

    achievementTitleFull: config.sections?.achievementTitle?.enabled
      ? `${config.sections.achievementTitle.title}共 ${config.achievementCount} 首达成`
      : "",
    newRankTitleFull: config.sections?.newRankTitle?.enabled
      ? `${config.sections.newRankTitle.title} Top ${config.newRankCount}`
      : "",
    mainRankTitleFull: config.sections?.mainRankTitle?.enabled
      ? `${config.sections.mainRankTitle.title} Top ${config.mainRankCount}`
      : "",
    subRankTitleFull:
      config.sections?.subRankTitle?.enabled && config.subRankRange
        ? `${config.sections.subRankTitle.title} Top ${subMax}`
        : "",
  };
}

export function getIssueConfig(dateStr: string, infoData: { boardType?: string; config?: Partial<BoardTypeConfig> } = {}): BoardTypeConfig & DerivedValues & { _type: string; _date: string } {
  const type = infoData.boardType || detectBoardType(dateStr);

  const baseConfig = JSON.parse(
    JSON.stringify(ISSUE_TYPES[type] || ISSUE_TYPES.special),
  ) as BoardTypeConfig;

  if (infoData.config) {
    deepMerge(baseConfig, infoData.config);
  }

  baseConfig._type = type;
  baseConfig._date = dateStr;

  Object.assign(baseConfig, getDerivedValues(baseConfig));

  return baseConfig as BoardTypeConfig & DerivedValues & { _type: string; _date: string };
}

// 获取所有可用的段落类型
export function getAllSegmentTypes(): SegmentType[] {
  return [
    "intro",
    "infoCard",
    "rules",
    "achievementTitle",
    "newachievement",
    "newRankTitle",
    "newRank",
    "mainRankTitle",
    "mainRank",
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
