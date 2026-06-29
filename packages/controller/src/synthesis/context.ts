// packages/controller/src/synthesis/context.ts

import type { IssueConfig, SegmentOrderItem } from "shared-config";
import type {
  EditorConfig,
  RankingData,
  RenderSongInfo,
} from "../types/index.js";

export interface SegmentContext {
  name: string;
  data: RankingData;
  editorConfig: EditorConfig;
  config: IssueConfig;
  segments: string;
  base: string;
  allSongs: RenderSongInfo[];
  subList: RenderSongInfo[];
  subChunks: RenderSongInfo[][];
  subDurationPerChunk: number;
  fadeDuration: number;
  introCover: string;
  milChunks: any[][];
  achChunks: any[][];
  orderItem: SegmentOrderItem;
}

export interface SegmentResultItem {
  path: string;
  orderItem: SegmentOrderItem;
}
