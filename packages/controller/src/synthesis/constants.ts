// packages/controller/src/synthesis/constants.ts

export const FPS = 60;

export const DURATION = {
  intro: 3,
  short: 7,
  sectionTitle: 2,
  rules: 35,
} as const;

export const SEGMENT_PREFIX: Record<string, string> = {
  intro: "01",
  infoCard: "02",
  rules: "03",
  achievementTitle: "04",
  songRank: "06",
  singerRank: "10",
  millionRank: "11",
  achievementRank: "12",
  historyRank: "13",
  statsCard: "14",
  staffCard: "15",
  subRankTitle: "16",
  subRank: "17",
};

export const DOWNLOAD_CONCURRENCY = 4;
export const RENDER_POOL_SIZE = 2;
export const SUB_RANK_POOL_SIZE = 4;
