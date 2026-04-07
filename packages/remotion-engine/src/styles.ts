// ------------------------------------------------------------------
// 风格配置
// ------------------------------------------------------------------
import type { BoardType } from "../../shared/src/boardTypes";

// 默认样式（周刊/月刊等使用）
const DEFAULT_STYLES = {
  colors: {
    bg: "#fffbf0",
    border: "#000000",
    biliBlue: "#23ade5",
    blue: "#bbdefb",
    orange: "#ffe0b2",
    cyan: "#b2ebf2",
    pink: "#f8bbd0",
    purple: "#e1bee7",
    yellow: "#e9dc6aff",
    green: "#c8e6c9",
    textMain: "#000000",
    textSub: "#444444",
    accentRed: "#d50000",
    accentGreen: "#2e7d32",
    accentBlue: "#2979ff",
    // 额外颜色 - MergedRulesCard
    headerBg: "#222",
    headerText: "#fff",
    EmergingHitColor: "#6A0DAD",
    MegaHitColor: "#CCA300",
    SubGateColor: "#23AFA4",
    GateColor: "#127436",
    // 额外颜色 - StatsCard
    card: "#fff",
    dot: "#d7ccc8",
    redBg: "#ffb9b4",
    greenBg: "#d0f9db",
    redText: "#990000",
    greenText: "#004d00",
    gray: "#888",
    // 额外颜色 - StaffCard
    cardBg: "#ffffff",
    nameText: "#222222",
    uidText: "#888888",
    qqBlue: "#23ADE5",
    webRed: "#FF5555",
    // 额外颜色 - SubRank
    cardBorder: "#000000",
    shadow: "rgba(0, 0, 0, 1)",
    play: "#bbdefb",
    fav: "#ffe0b2",
    coin: "#b2ebf2",
    like: "#f8bbd0",
    dan: "#e1bee7",
    rep: "#fff59d",
    share: "#c8e6c9",
    red: "#d50000",
    // 额外颜色 - CoverIntro
    lightGreen: "#00ee99",
    lightYellow: "#fff176",
    // 额外颜色 - achievementCard
    background: "rgba(0, 0, 0, 0.5)",
    borderLight: "#e0e0e0",
    accent: "#ff4757",
    textPrimary: "#ffffff",
    textSecondary: "#cccccc",
    honor: {
      default: "#2f3542",
      mega: "#ffa502",
      emerging: "#2ed573",
      门番: "#ff3838",
    },
    // 额外颜色 - MillionRank, AchievementRank, HistoryRank
    badgeBg: "#222",
    // 额外颜色 - SingerRank
    darkGreen: "#2e7d32",
  },
  border: "3px solid #000",
  shadow: "8px 8px 0px rgba(0,0,0,1)",
  fontHeader: '"Arial Black", "Impact", sans-serif',
  fontMain:
    '"Microsoft YaHei", "Heiti SC", "Arial Rounded MT Bold", sans-serif',
  fontNum: '"Arial Black", "Impact", sans-serif',
  fontMono: 'Consolas, "Arial Black", monospace',
  fonts: {
    sans: "PingFang SC, Microsoft YaHei, sans-serif",
    number: "SF Pro Display, Roboto, monospace",
  },
  sizes: {
    infoTag: { height: 36, paddingX: 16, margin: 8 },
    honorBadge: { height: 40, paddingX: 20, margin: 8 },
    trendBar: { height: 80, paddingX: 20, margin: 16 },
  },
};

// 翻唱周刊专用样式
const COVER_WEEKLY_STYLES = {
  colors: {
    bg: "#1a1a2e",
    border: "#4a4a6a",
    biliBlue: "#7ec8e3",
    blue: "#4a6fa5",
    orange: "#d4a574",
    cyan: "#5f9ea0",
    pink: "#c9a0dc",
    purple: "#9b59b6",
    yellow: "#f4d03f",
    green: "#58d68d",
    textMain: "#f0f0f0",
    textSub: "#b0b0b0",
    accentRed: "#ff6b6b",
    accentGreen: "#2ecc71",
    accentBlue: "#3498db",
    // 额外颜色 - MergedRulesCard
    headerBg: "#16213e",
    headerText: "#f0f0f0",
    EmergingHitColor: "#9b59b6",
    MegaHitColor: "#f4d03f",
    SubGateColor: "#1abc9c",
    GateColor: "#27ae60",
    // 额外颜色 - StatsCard
    card: "#16213e",
    dot: "#4a4a6a",
    redBg: "#e74c3c",
    greenBg: "#27ae60",
    redText: "#ff6b6b",
    greenText: "#2ecc71",
    gray: "#7f8c8d",
    // 额外颜色 - StaffCard
    cardBg: "#16213e",
    nameText: "#f0f0f0",
    uidText: "#95a5a6",
    qqBlue: "#7ec8e3",
    webRed: "#ff6b6b",
    // 额外颜色 - SubRank
    cardBorder: "#4a4a6a",
    shadow: "rgba(0, 0, 0, 0.5)",
    play: "#4a6fa5",
    fav: "#d4a574",
    coin: "#5f9ea0",
    like: "#c9a0dc",
    dan: "#9b59b6",
    rep: "#f4d03f",
    share: "#58d68d",
    red: "#ff6b6b",
    // 额外颜色 - CoverIntro
    lightGreen: "#2ecc71",
    lightYellow: "#f4d03f",
    // 额外颜色 - achievementCard
    background: "rgba(22, 33, 62, 0.8)",
    borderLight: "#4a4a6a",
    accent: "#ff6b6b",
    textPrimary: "#f0f0f0",
    textSecondary: "#b0b0b0",
    honor: {
      default: "#34495e",
      mega: "#f4d03f",
      emerging: "#2ecc71",
      门番: "#ff6b6b",
    },
    // 额外颜色 - MillionRank, AchievementRank, HistoryRank
    badgeBg: "#16213e",
    // 额外颜色 - SingerRank
    darkGreen: "#27ae60",
  },
  border: "2px solid #4a4a6a",
  shadow: "6px 6px 0px rgba(0,0,0,0.5)",
  fontHeader: '"Arial Black", "Impact", sans-serif',
  fontMain:
    '"Microsoft YaHei", "Heiti SC", "Arial Rounded MT Bold", sans-serif',
  fontNum: '"Arial Black", "Impact", sans-serif',
  fontMono: 'Consolas, "Arial Black", monospace',
  fonts: {
    sans: "PingFang SC, Microsoft YaHei, sans-serif",
    number: "SF Pro Display, Roboto, monospace",
  },
  sizes: {
    infoTag: { height: 36, paddingX: 16, margin: 8 },
    honorBadge: { height: 40, paddingX: 20, margin: 8 },
    trendBar: { height: 80, paddingX: 20, margin: 16 },
  },
};

// 导出类型
type StylesType = typeof DEFAULT_STYLES;

// 根据 boardType 获取样式
export function getStyles(boardType?: BoardType): StylesType {
  if (boardType === "coverWeekly") {
    return COVER_WEEKLY_STYLES;
  }
  return DEFAULT_STYLES;
}

// 为了向后兼容，保留默认导出
export const STYLES = DEFAULT_STYLES;