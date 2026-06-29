// packages/controller/src/synthesis/cover.ts

import fs from "fs-extra";
import path from "path";

import type {
  IssueConfig,
  SegmentOrderItem,
  SongRankConfig,
} from "shared-config";
import { log } from "../state.js";
import { downloadImage } from "../utils/download.js";
import { renderImage } from "../utils/render.js";
import type {
  EditorConfig,
  RankingData,
  RenderSongInfo,
} from "../types/index.js";
import { DURATION, FPS } from "./constants.js";

export function formatDate(dateStr: string) {
  return dateStr.replace(/-/g, ".");
}

export async function resolveIntroCover(
  name: string,
  data: RankingData,
  editorConfig: EditorConfig,
  config: IssueConfig,
): Promise<string> {
  if (editorConfig.cover?.thumbnail) {
    const cover = await downloadImage(editorConfig.cover.thumbnail);
    log(`封面: 使用指定 ${editorConfig.cover.bvid}`);
    return cover;
  }

  const mainRankSegment = config.segmentOrder.find(
    (segment) =>
      segment.type === "songRank" &&
      ["CoverMainRankCard", "MainRankCard"].includes(
        (segment.config as SongRankConfig)?.cardComponent,
      ),
  );

  const mainRankConfig = mainRankSegment?.config as SongRankConfig | undefined;
  const mainRankList = mainRankConfig?.dataField
    ? ((data[mainRankConfig.dataField] || []) as RenderSongInfo[])
    : [];

  const firstAppearSong = config.showCount
    ? mainRankList.find((song) => song.count === 1)
    : mainRankList[0];

  if (!firstAppearSong) {
    log(`封面: ${name} 未找到可用主榜歌曲`);
    return "";
  }

  const cover = await downloadImage(firstAppearSong.thumbnail);

  log(
    `封面: ${config.showCount ? `主榜首上榜 #${firstAppearSong.rank}` : "主榜第一"}`,
  );

  return cover;
}

export async function prepareCoverImage(
  name: string,
  data: RankingData,
  config: IssueConfig,
  base: string,
  introCover: string,
): Promise<void> {
  const introSegment = config.segmentOrder.find(
    (segment: SegmentOrderItem) => segment.type === "intro",
  );

  const introDuration = introSegment?.config?.duration || DURATION.intro;
  const coverFrame = introDuration * FPS - 31;
  const coverFileName = `${name}.png`;
  const coverPath = path.join(base, coverFileName);

  if (fs.existsSync(coverPath)) {
    fs.unlinkSync(coverPath);
    log("删除旧封面，重新生成");
  }

  await renderImage(
    "Intro",
    {
      issue: data.index ? `#${data.index}` : "",
      date: formatDate(name.split("_").at(-1) as string),
      coverImg: introCover,
      boardType: config._type,
    },
    coverFileName,
    base,
    coverFrame,
  );

  log(`封面已生成: ${coverFileName}`);
}
