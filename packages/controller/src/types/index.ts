// packages/controller/src/types/index.ts

import type { BoardTypeConfig, SongInfo } from "shared-config";

export type BoardType =
  | "daily"
  | "weekly"
  | "monthly"
  | "coverWeekly"
  | "special";

export type RenderSongInfo = SongInfo & {
  rank: number;
  thumbnail: string;

  transitionIn?: boolean;
  transitionOut?: boolean;

  _duration: number;
  _defaultDuration: number;
  _videoPath: string;
  _thumbPath: string;
  _startTime: number;
  _isManual?: boolean;
  _isAuto?: boolean;

  [key: string]: any;
};

export interface EditorConfig {
  cover?: {
    thumbnail?: string;
    bvid?: string;
  };
  ed?: {
    bvid?: string;
    name?: string;
    producer?: string;
  };
  script?: {
    opening?: string;
    ending?: string;
  };
  boardType?: string;
  config?: BoardTypeConfig;
  coverWeeklyName?: string;

  [key: string]: any;
}

export interface ValueAndDiff {
  value: number;
  diff: number;
}

export interface ArtistStat {
  name: string;
  score: number;
  firstname?: string;
  rank?: number;
  last_rank?: number;
  [key: string]: any;
}

export interface SongRecord {
  title: string;
  bvid: string;
  producer: string;
  pubdate: string;
  name?: string;
  thumbnail: string;
  [key: string]: any;
}

export interface MillionRecord extends SongRecord {
  million_crossed: number;
}

export interface AchievementRecord extends SongRecord {
  honor: string | string[];
}

export interface HistoryRecord extends SongRecord {
  view?: number;
  favorite?: number;
  favotite?: number;
  coin?: number;
  like?: number;
  point?: number;
  rank?: number;
}

export interface RankingData {
  date?: string;
  index: number;
  period?: string;

  op?: {
    title?: string;
    bvid?: string;
    producer?: string;
    pubdate?: string;
    thumbnail?: string;
  };

  stat?: Record<string, ValueAndDiff>;
  comment?: string;

  total_rank_top20?: SongInfo[];
  total_rank_sub?: SongInfo[];
  new_rank_top10?: SongInfo[];

  vocal_stats?: ArtistStat[];
  producer_stats?: ArtistStat[];

  million_record?: MillionRecord[];
  history_record?: HistoryRecord[];
  achievement_record?: AchievementRecord[];

  [key: string]: any;
}
