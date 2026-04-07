// src/Root.tsx
import React from "react";
import { Composition } from "remotion";
import { MainRankCard } from "./MainRankCard";
import { Intro } from "./Intro";
import { CoverIntro } from "./CoverIntro";
import { InfoCard } from "./InfoCard";
import { SectionTitle } from "./SectionTitle";
import { MergedRulesCard } from "./MergedRulesCard";
import { SingerRank } from "./SingerRank";
import { MillionRank } from "./MillionRank";
import { AchievementRank } from "./AchievementRank";
import { HistoryRank } from "./HistoryRank";
import { NewSongCard } from "./NewSongCard";
import { SubRank } from "./SubRank";
import { StatsCard } from "./StatsCard";
import { StaffCard } from "./StaffCard";
import { SpecialCard } from "./SpecialCard";
import { PickupCard } from "./PickupCard";
import mainRankProps from "./example/mainRank"
import coverMainRankProps from "./example/coverMainRank"
import specialProps from "./example/specialRank";
import vocalStats from "./example/vocalStats"

import { weeklyMainSchema } from "./types/zod";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Intro"
        component={Intro}
        durationInFrames={60 * 3}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          issue: "#68",
          date: "2025.12.20",
          coverImg: "",
          boardType: "weekly",
        }}
      />
      <Composition
        id="CoverIntro"
        component={CoverIntro}
        durationInFrames={60 * 3}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          issue: "#68",
          date: "2025.12.20",
          coverImg: "",
          boardType: "weekly",
        }}
      />
      <Composition
        id="InfoCard"
        component={InfoCard}
        durationInFrames={60 * 5}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          opTitle: "测试",
          opArtist: "测试",
          opCover: "",
          timeLabel: "统计时间",
          timeRange: "2025.12.20 — 2025.12.27",
          note: "测试",
        }}
      />
      <Composition
        id="RulesAndAchivements"
        component={MergedRulesCard}
        durationInFrames={60 * 35}
        fps={60}
        width={1920}
        height={1080}
      />
      <Composition
        id="SectionTitle"
        component={SectionTitle}
        durationInFrames={60 * 2}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          title: "新曲榜",
          from: 10,
          to: 1,
          themeColor: "#23ade5",
          edName: "",
          edAuthor: "",
        }}
      />
      <Composition
        id="NewSongCard"
        component={NewSongCard}
        durationInFrames={60 * 35}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          rank: 1,
          title: "测试",
          point: 100000,
          trendCount: 7,
          trendKey: "daily_trends",
        }}
      />
      <Composition
        id="MainRankCard"
        component={MainRankCard as unknown as React.ComponentType<Record<string, unknown>>}
        durationInFrames={60 * 35}
        fps={60}
        width={1920}
        height={1080}
        schema={weeklyMainSchema}
        defaultProps={mainRankProps}
      />
      <Composition
        id="CoverMainRankCard"
        component={MainRankCard as unknown as React.ComponentType<Record<string, unknown>>}
        durationInFrames={60 * 35}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={coverMainRankProps}
      />
      <Composition
        id="SpecialCard"
        component={SpecialCard}
        durationInFrames={60 * 20}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={specialProps}
      />
      <Composition
        id="PickupCard"
        component={PickupCard}
        durationInFrames={60 * 20}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={specialProps}
      />
      <Composition
        id="SingerRank"
        component={SingerRank}
        durationInFrames={60 * 7}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{ list: vocalStats }}
      />
      <Composition
        id="MillionRank"
        component={MillionRank}
        durationInFrames={60 * 7}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{ list: [] }}
      />
      <Composition
        id="AchievementRank"
        component={AchievementRank}
        durationInFrames={60 * 7}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{ list: [] }}
      />
      <Composition
        id="HistoryRank"
        component={HistoryRank}
        durationInFrames={60 * 7}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{ list: [] }}
      />
      <Composition
        id="StatsCard"
        component={StatsCard}
        durationInFrames={60 * 7}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          stat: {},
          topN: 100,
        }}
      />
      <Composition
        id="StaffCard"
        component={StaffCard}
        durationInFrames={60 * 7}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{ staffList: [] }}
      />
      <Composition
        id="SubRank"
        component={SubRank}
        durationInFrames={60 * 20}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          list: [],
          showCount: true,
        }}
      />
    </>
  );
};
