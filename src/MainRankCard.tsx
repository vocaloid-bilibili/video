// src/RankCard.tsx
import {
  AbsoluteFill,
  OffthreadVideo,
  useVideoConfig,
  useCurrentFrame,
  spring,
  interpolate,
  Easing,
} from "remotion";

import { STYLES } from "./styles";
import { StatRow } from "./components/StatRow" 
import { FitContent } from "./components/FitContent"
import { FitTitle } from "./components/FitTitle";
import { TrendBar } from "./components/TrendBar";
import { HonorBadge } from "./components/HonorBadge";
import { InfoTag } from "./components/InfoTag";
import { StatRows } from "./components/StatRows";
import { OverallPoint } from "./components/OverallPoint";
import { RankTrend } from "./components/RankTrend";
import { RankCore } from "./components/RankCore";
import { SongInfo } from "./SongInfo";
import { VideoContainer } from "./VideoContainer";

// ------------------------------------------------------------------
// 主组件
// ------------------------------------------------------------------
export const MainRankCard = (props: any) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  const safeParse = (val: any) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };


  // 配置参数
  const showCount = props.showCount !== false;
  const trendKey = props.trendKey || "daily_trends";
  const trendCount = props.trendCount || 7;
  const trendData =
    props[trendKey] || props.daily_trends || props.weekly_trends;

  // 业务逻辑判断
  const isNewSong = props.rank_before === "-" || props.rate === "NEW";

  // 计算各项数据的最佳排名
  const allRanks = [
    props.view_rank,
    props.favorite_rank,
    props.coin_rank,
    props.like_rank,
    props.danmaku_rank,
    props.reply_rank,
    props.share_rank,
  ]
    .map((r) => parseInt(r))
    .filter((n) => !isNaN(n) && n > 0);

  const minRank = allRanks.length > 0 ? Math.min(...allRanks) : 0;

  // 动画逻辑
  const transitionFrames = 35;

  const volume = interpolate(
    frame,
    [
      0,
      transitionFrames,
      durationInFrames - transitionFrames,
      durationInFrames,
    ],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const exitStartFrame = durationInFrames - transitionFrames;
  const exitProgress = interpolate(
    frame,
    [exitStartFrame, durationInFrames],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.back(1.5)),
    },
  );

  const videoEntranceY = spring({
    frame,
    fps,
    from: -1000,
    to: 0,
    config: { damping: 14 },
  });
  const videoExitY = interpolate(exitProgress, [0, 1], [0, -1000]);
  const videoTranslateY = frame < exitStartFrame ? videoEntranceY : videoExitY;

  const infoEntranceY = spring({
    frame,
    fps,
    from: 300,
    to: 0,
    config: { damping: 15 },
  });
  const infoExitY = interpolate(exitProgress, [0, 1], [0, 400]);
  const infoTranslateY = frame < exitStartFrame ? infoEntranceY : infoExitY;

  const sidebarEntranceX = spring({
    frame,
    fps,
    from: 800,
    to: 0,
    config: { damping: 14, mass: 0.8 },
  });
  const sidebarExitX = interpolate(exitProgress, [0, 1], [0, 800]);
  const sidebarTranslateX =
    frame < exitStartFrame ? sidebarEntranceX : sidebarExitX;

  // 排名UI逻辑
  let rankDiffValue = 0;
  if (!isNewSong && props.rank_before) {
    rankDiffValue = Number(props.rank_before) - props.rank;
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: STYLES.colors.bg,
        fontFamily: STYLES.fontMain,
        color: STYLES.colors.textMain,
        backgroundImage: "radial-gradient(#d7ccc8 3px, transparent 3px)",
        backgroundSize: "24px 24px",
        display: "flex",
        flexDirection: "row",
        padding: 24,
        gap: 24,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* ================= 左侧主体 ================= */}
      <div
        style={{
          flex: 120,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          height: "100%",
          minWidth: 0,
        }}
      >
        {/* 1. 视频容器 */}
        <VideoContainer
          videoTranslateY={videoTranslateY}
          videoSource={props.videoSource}
          volume={volume}
        />

        {/* 2. 底部信息栏 */}
        <SongInfo
          props={props}
          infoTranslateY={infoTranslateY}
        />
      </div>

      {/* ================= 右侧侧边栏 ================= */}
      <div
        style={{
          flex: 34,
          maxWidth: "24%",
          backgroundColor: "#ffffff",
          border: STYLES.border,
          borderRadius: 24,
          boxShadow: STYLES.shadow,
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          transform: `translateX(${sidebarTranslateX}px)`,
          boxSizing: "border-box",
        }}
      >
        {/* --- 上半部分：排名与分数 --- */}
        <div
          style={{
            flex: "0 0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {/* 第一行：排名 + 趋势 */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 16,
              height: 160,
            }}
          >
            {/* 左块：核心排名展示 */}
            <RankCore 
              rank={props.rank}
              showCount={showCount}
              count={props.count}
            />

            {/* 右块：趋势与上周对比 */}
            <RankTrend 
              isNewSong={isNewSong}
              trendCount={trendCount}
              trendData={trendData}
              rank_before={props.rank_before}
              rankDiffValue={rankDiffValue}
            />
          </div>

          {/* 第二行：综合得分 */}
          <OverallPoint
            isNewSong={isNewSong}
            score={props.score}
            point_before={props.point_before}
            fixB={props.fixB}
            fixC={props.fixC}
          />
        </div>

        {/* --- 下半部分：详细数据 --- */}
        <StatRows 
          allRanks={allRanks}
        />

      </div>
    </AbsoluteFill>
  );
};
