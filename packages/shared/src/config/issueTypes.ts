/**
 * 期刊段落配置
 */

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

export interface IssueTypeConfig {
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
  dataFields: {
    newachievement?: string | null;
    newRank: string | null;
    mainRank: string | null;
    subRank: string | null;
  };
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

export const ISSUE_TYPES: Record<string, IssueTypeConfig> = {
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
  },
};

export function detectIssueType(dateStr: string): string {
  if (ISSUE_TYPES.weekly.datePattern?.test(dateStr)) return "weekly";
  if (ISSUE_TYPES.monthly.datePattern?.test(dateStr)) return "monthly";
  return "special";
}

export function getDerivedValues(config: IssueTypeConfig): DerivedValues {
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

export function getIssueConfig(dateStr: string, infoData: { issueType?: string; config?: Partial<IssueTypeConfig> } = {}): IssueTypeConfig & DerivedValues & { _type: string; _date: string } {
  const type = infoData.issueType || detectIssueType(dateStr);

  const baseConfig = JSON.parse(
    JSON.stringify(ISSUE_TYPES[type] || ISSUE_TYPES.special),
  ) as IssueTypeConfig;

  if (infoData.config) {
    deepMerge(baseConfig, infoData.config);
  }

  baseConfig._type = type;
  baseConfig._date = dateStr;

  Object.assign(baseConfig, getDerivedValues(baseConfig));

  return baseConfig as IssueTypeConfig & DerivedValues & { _type: string; _date: string };
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
