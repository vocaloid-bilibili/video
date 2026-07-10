// packages/remotion-engine/src/styles.ts
import type { BoardType } from "../../shared/src/boardTypes";


const DEFAULT_HONOR_COLORS = {
  default: {
    text: "#333",
    bg: "rgba(255,255,255,0.75)",
    border: "rgba(0,0,0,0.5)",
  },
  "Emerging Hit!": {
    text: "#6A0DAD",
    bg: "rgba(106, 13, 173, 0.25)",
    border: "rgba(106, 13, 173, 0.4)",
  },
  "Mega Hit!!!": {
    text: "#CCA300",
    bg: "rgba(204, 163, 0, 0.25)",
    border: "rgba(204, 163, 0, 0.4)",
  },
  门番: {
    text: "#127436",
    bg: "rgba(18, 116, 54, 0.25)",
    border: "rgba(18, 116, 54, 0.4)",
  },
  门番候补: {
    text: "#23AFA4",
    bg: "rgba(35, 175, 164, 0.25)",
    border: "rgba(35, 175, 164, 0.4)",
  },
} as const;


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

    headerBg: "#222",
    headerText: "#fff",
    EmergingHitColor: "#6A0DAD",
    MegaHitColor: "#CCA300",
    SubGateColor: "#23AFA4",
    GateColor: "#127436",

    card: "#fff",
    dot: "#d7ccc8",
    redBg: "#ffb9b4",
    greenBg: "#d0f9db",
    redText: "#990000",
    greenText: "#004d00",
    gray: "#888",

    cardBg: "#ffffff",
    nameText: "#222222",
    uidText: "#888888",
    qqBlue: "#23ADE5",
    webRed: "#FF5555",

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

    lightGreen: "#00ee99",
    lightYellow: "#fff176",

    background: "rgba(0, 0, 0, 0.5)",
    borderLight: "#e0e0e0",
    accent: "#ff4757",
    textPrimary: "#ffffff",
    textSecondary: "#cccccc",

    honor: DEFAULT_HONOR_COLORS,

    badgeBg: "#222",
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
} as const;


const COVER_WEEKLY_STYLES = {
  ...DEFAULT_STYLES,
  colors: {
    ...DEFAULT_STYLES.colors,
    bg: "#F0F8FF",
    border: "#4a4a6a",
    biliBlue: "#7ec8e3",
    blue: "#4a6fa5",
    orange: "#d4a574",
    cyan: "#5f9ea0",
    pink: "#c9a0dc",
    purple: "#9b59b6",
    yellow: "#f4d03f",
    green: "#58d68d",
    textSub: "#b0b0b0",
    accentRed: "#ff6b6b",
    accentGreen: "#2ecc71",
    accentBlue: "#3498db",

    headerBg: "#16213e",
    headerText: "#f0f0f0",
    EmergingHitColor: "#9b59b6",
    MegaHitColor: "#f4d03f",
    SubGateColor: "#1abc9c",
    GateColor: "#27ae60",

    card: "#16213e",
    dot: "#4a4a6a",
    redBg: "#e74c3c",
    greenBg: "#27ae60",
    redText: "#ff6b6b",
    greenText: "#2ecc71",

    cardBg: "#16213e",
    nameText: "#f0f0f0",
    uidText: "#95a5a6",
    qqBlue: "#7ec8e3",
    webRed: "#ff6b6b",

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

    lightGreen: "#2ecc71",
    lightYellow: "#f4d03f",

    background: "rgba(22, 33, 62, 0.8)",
    borderLight: "#4a4a6a",
    accent: "#ff6b6b",
    textPrimary: "#f0f0f0",
    textSecondary: "#b0b0b0",

    honor: DEFAULT_HONOR_COLORS,

    badgeBg: "#16213e",
    darkGreen: "#27ae60",
  },
  border: "2px solid #4a4a6a",
  shadow: "6px 6px 0px rgba(0,0,0,0.5)",
} as const;


const NEAR1KW_STYLES = {
  ...DEFAULT_STYLES,
  colors: {
    ...DEFAULT_STYLES.colors,
    bg: "#3f3f63",
    border: "#d4af37",
    biliBlue: "#4fc3f7",
    blue: "#5c6bc0",
    orange: "#ffb74d",
    cyan: "#4dd0e1",
    pink: "#f48fb1",
    purple: "#ba68c8",
    yellow: "#ffd54f",
    green: "#81c784",
    textMain: "#000000",
    textSub: "#444444",
    accentRed: "#ff5252",
    accentGreen: "#69f0ae",
    accentBlue: "#448aff",

    headerBg: "#222",
    headerText: "#fff",
    EmergingHitColor: "#6A0DAD",
    MegaHitColor: "#CCA300",
    SubGateColor: "#23AFA4",
    GateColor: "#127436",

    card: "#16213e",
    dot: "#d4af37",
    redBg: "#ffcdd2",
    greenBg: "#c8e6c9",
    redText: "#ff5252",
    greenText: "#69f0ae",

    cardBg: "#1a1a2e",
    nameText: "#ffd700",
    uidText: "#444444",
    qqBlue: "#4fc3f7",
    webRed: "#ff5252",

    cardBorder: "#d4af37",
    shadow: "rgba(212, 175, 55, 0.6)",
    play: "#6E94C8",
    fav: "#ffb74d",
    coin: "#4dd0e1",
    like: "#f48fb1",
    dan: "#af6fbf",
    rep: "#fff176",
    share: "#81c784",
    red: "#ff5252",

    lightGreen: "#69f0ae",
    lightYellow: "#ffd700",

    background: "rgba(26, 26, 46, 0.9)",
    borderLight: "#d4af37",
    accent: "#ffd700",
    textPrimary: "#ffffff",
    textSecondary: "#b0a080",

    honor: DEFAULT_HONOR_COLORS,

    badgeBg: "#0f0f1a",
    darkGreen: "#2e7d32",
  },
  border: "2px solid #d4af37",
  shadow: "6px 6px 0px rgba(212, 175, 55, 0.4)",
} as const;


export type StylesType = 
  | typeof DEFAULT_STYLES 
  | typeof COVER_WEEKLY_STYLES
  | typeof NEAR1KW_STYLES;


export function getStyles(boardType?: BoardType): StylesType {
  if (boardType === "coverWeekly") {
    return COVER_WEEKLY_STYLES;
  }

  if (boardType === "near1kw") {
    return NEAR1KW_STYLES;
  }

  return DEFAULT_STYLES;
}


export const STYLES = DEFAULT_STYLES;
