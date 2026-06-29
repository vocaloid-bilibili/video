// packages/controller/src/services/songs.service.ts

import fs from "fs-extra";
import path from "path";

import { DIR_DATA } from "../config.js";
import { getIssueConfig } from "shared-config";
import type { SongInfo } from "shared-config";
import { getClipSetting } from "../utils/clips.js";
import { getFullVideoInfo } from "../utils/fullVideo.js";
import { httpError } from "../utils/http.js";

interface IssueSongsResult {
  date: string;
  songs: Record<string, Array<SongInfo & Record<string, unknown>>>;
  index: number;
  boardType: string;
  config: Record<string, unknown>;
}

function getSegmentDataField(
  segConfig: Record<string, unknown>,
): string | null {
  const cardComponent = segConfig.cardComponent as string | undefined;
  const dataField = segConfig.dataField as string | undefined;
  const achievementDataField = segConfig.achievementDataField as
    | string
    | undefined;

  if (cardComponent === "achievementCard") {
    return achievementDataField || dataField || null;
  }

  return dataField || null;
}

function enrichSong(song: SongInfo, type: string) {
  const clip = getClipSetting(song.bvid);
  const video = getFullVideoInfo(song.bvid);

  return {
    ...song,
    _type: type,
    _clip: clip,
    _videoExists: video.exists,
    _videoUrl: video.exists ? video.url : null,
  };
}

export async function getIssueSongs(date: string): Promise<IssueSongsResult> {
  const dataFile = path.join(DIR_DATA, `${date}.json`);
  const configFile = path.join(DIR_DATA, `${date}_config.json`);

  if (!(await fs.pathExists(dataFile))) {
    throw httpError(404, "数据文件不存在");
  }

  const data = await fs.readJson(dataFile);
  const infoData = (await fs.pathExists(configFile))
    ? await fs.readJson(configFile)
    : {};

  const config = getIssueConfig(date, infoData);
  const songGroups: Record<string, SongInfo[]> = {};

  for (const segment of config.segmentOrder) {
    if (segment.type !== "songRank") continue;

    const segConfig = (segment.config || {}) as Record<string, unknown>;
    const cardComponent = segConfig.cardComponent as string | undefined;
    const dataField = getSegmentDataField(segConfig);

    if (!cardComponent || !dataField || !data[dataField]) continue;

    const sourceSongs = (data[dataField] || []) as SongInfo[];
    const rankCount = segConfig.rankCount as number | undefined;
    const defaultCount =
      cardComponent === "achievementCard" ? (config.achievementCount ?? 0) : 0;

    const count = Number(rankCount ?? defaultCount) || sourceSongs.length;

    if (!songGroups[cardComponent]) {
      songGroups[cardComponent] = [];
    }

    songGroups[cardComponent].push(...sourceSongs.slice(0, count));
  }

  const songs = Object.fromEntries(
    Object.entries(songGroups).map(([cardComponent, songList]) => [
      cardComponent,
      songList.map((song) => enrichSong(song, cardComponent)),
    ]),
  );

  return {
    date,
    songs,
    index: data.index,
    boardType: config._type,
    config: {
      name: config.name,
      achievementCount: config.achievementCount,
      showCount: config.showCount,
      trendCount: config.trendCount,
      trendKey: config.trendKey,
      subRankRange: config.subRankRange,
    },
  };
}
