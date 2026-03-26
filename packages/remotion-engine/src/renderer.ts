// Remotion渲染器接口
// 这个文件导出控制器可以调用的渲染接口

import { renderComposition as internalRenderComposition } from './utils/render.js';
import { renderStill as internalRenderStill } from './utils/render.js';
import { renderRankSegment as internalRenderRankSegment } from './utils/render.js';

export interface RenderOptions {
  compositionId: string;
  props: Record<string, any>;
  outputPath: string;
  durationInSeconds?: number;
  fadeDuration?: number;
  concurrency?: number;
}

export interface StillOptions {
  compositionId: string;
  props: Record<string, any>;
  outputPath: string;
  frameNumber?: number;
}

export interface RankSegmentOptions {
  data: any;
  videoPath: string;
  thumb: string;
  type: 'main' | 'new';
  dir: string;
  durationSec?: number;
  config?: Record<string, any>;
}

/**
 * 渲染Remotion组件
 */
export async function renderComposition(options: RenderOptions): Promise<string> {
  const {
    compositionId,
    props,
    outputPath,
    durationInSeconds,
    fadeDuration = 2,
    concurrency = 4
  } = options;

  // 这里需要调用实际的渲染逻辑
  // 注意：实际的渲染函数需要从controller的utils中调用命令行
  // 这个接口主要用于类型定义和接口规范
  throw new Error('renderComposition should be called from controller package');
}

/**
 * 渲染静态帧/封面
 */
export async function renderStill(options: StillOptions): Promise<string> {
  const {
    compositionId,
    props,
    outputPath,
    frameNumber = 0
  } = options;

  // 这里需要调用实际的渲染逻辑
  throw new Error('renderStill should be called from controller package');
}

/**
 * 渲染榜单片段
 */
export async function renderRankSegment(options: RankSegmentOptions): Promise<string> {
  const {
    data,
    videoPath,
    thumb,
    type,
    dir,
    durationSec = 20,
    config = {}
  } = options;

  // 这里需要调用实际的渲染逻辑
  throw new Error('renderRankSegment should be called from controller package');
}

/**
 * 验证Props是否符合组件schema
 */
export function validateProps(compositionId: string, props: any): boolean {
  // 这里可以实现Zod验证逻辑
  // 暂时返回true
  return true;
}

// 导出组件ID常量，供控制器使用
export const COMPOSITION_IDS = {
  INTRO: 'Intro',
  INFO_CARD: 'InfoCard',
  RULES_AND_ACHIEVEMENTS: 'RulesAndAchivements',
  SECTION_TITLE: 'SectionTitle',
  NEW_SONG_CARD: 'NewSongCard',
  MAIN_RANK_CARD: 'MainRankCard',
  SPECIAL_CARD: 'SpecialCard',
  SINGER_RANK: 'SingerRank',
  MILLION_RANK: 'MillionRank',
  ACHIEVEMENT_RANK: 'AchievementRank',
  HISTORY_RANK: 'HistoryRank',
  STATS_CARD: 'StatsCard',
  STAFF_CARD: 'StaffCard',
  SUB_RANK: 'SubRank'
} as const;