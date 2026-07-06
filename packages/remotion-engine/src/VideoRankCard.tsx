// packages/remotion-engine/src/VideoRankCard.tsx

import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { getStyles } from "./styles";
import { VideoContainer } from "./VideoContainer";
import { SongInfo } from "./components/SongInfo";
import { StatRows } from "./components/StatRows";
import { RankCore } from "./components/RankCore";
import { RankTrend } from "./components/RankTrend";
import { OverallPoint } from "./components/OverallPoint";
import type { BoardType } from "../../shared/src/boardTypes";

type RankBefore = number | "-";

export interface VideoRankCardProps {
  props: Record<string, any>;
  boardType?: BoardType;
  rankLabel?: string;
  rankWatermark?: string;
  rankDisplay?: string | number;
  showCount?: boolean;
  showRanks?: boolean;
  forceNew?: boolean;
  rightTop?: ReactNode;
}

export function VideoRankCard({
  props,
  boardType = "weekly",
  rankLabel = "本期排名",
  rankWatermark = "RANK",
  rankDisplay,
  showCount = true,
  showRanks = true,
  forceNew = false,
  rightTop,
}: VideoRankCardProps) {
  const runtimeBoardType =
    (props.boardType as BoardType | undefined) || boardType;

  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const styles = getStyles(runtimeBoardType);

  const transitionFrames = 35;
  const transitionIn = props.transitionIn !== false;
  const transitionOut = props.transitionOut !== false;

  const volume = interpolate(
    frame,
    [
      0,
      transitionFrames,
      durationInFrames - transitionFrames,
      durationInFrames,
    ],
    [transitionIn ? 0 : 1, 1, 1, transitionOut ? 0 : 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const exitStartFrame = durationInFrames - transitionFrames;

  const exitProgress = transitionOut
    ? interpolate(frame, [exitStartFrame, durationInFrames], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.in(Easing.back(1.5)),
      })
    : 0;

  const videoEntranceY = transitionIn
    ? spring({ frame, fps, from: -1000, to: 0, config: { damping: 14 } })
    : 0;

  const videoExitY = transitionOut
    ? interpolate(exitProgress, [0, 1], [0, -1000])
    : 0;

  const videoTranslateY = frame < exitStartFrame ? videoEntranceY : videoExitY;

  const infoEntranceY = transitionIn
    ? spring({ frame, fps, from: 300, to: 0, config: { damping: 15 } })
    : 0;

  const infoExitY = transitionOut
    ? interpolate(exitProgress, [0, 1], [0, 400])
    : 0;

  const infoTranslateY = frame < exitStartFrame ? infoEntranceY : infoExitY;

  const sidebarEntranceX = transitionIn
    ? spring({
        frame,
        fps,
        from: 800,
        to: 0,
        config: { damping: 14, mass: 0.8 },
      })
    : 0;

  const sidebarExitX = transitionOut
    ? interpolate(exitProgress, [0, 1], [0, 800])
    : 0;

  const sidebarTranslateX =
    frame < exitStartFrame ? sidebarEntranceX : sidebarExitX;

  const rankBefore = props.rank_before as RankBefore;
  const isNewSongCard = forceNew === true;
  const isMainRankNew = rankBefore === "-";
  const isNewSong = isNewSongCard || isMainRankNew;

  const rankDiffValue = isNewSong ? 0 : Number(rankBefore) - Number(props.rank);

  const trendKey = props.trendKey || "daily_trends";
  const trendCount = props.trendCount || 7;
  const trendData =
    props[trendKey] ||
    props.seperate_ranks ||
    props.daily_trends ||
    props.weekly_trends 

  const mainRank = isNewSongCard ? (props.main_rank as number | null) : null;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: styles.colors.bg,
        fontFamily: styles.fontMain,
        color: styles.colors.textMain,
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
        <VideoContainer
          videoTranslateY={videoTranslateY}
          videoSource={props.videoSource}
          volume={volume}
          boardType={runtimeBoardType}
        />

        <SongInfo
          props={props}
          infoTranslateY={infoTranslateY}
          boardType={runtimeBoardType}
        />
      </div>

      <div
        style={{
          flex: 34,
          maxWidth: "24%",
          backgroundColor: "#ffffff",
          border: styles.border,
          borderRadius: 24,
          boxShadow: styles.shadow,
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          transform: `translateX(${sidebarTranslateX}px)`,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            flex: "0 0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 16,
              height: 160,
            }}
          >
            <RankCore
              rank={rankDisplay ?? props.rank}
              showCount={showCount}
              count={Number(props.count || 0)}
              label={rankLabel}
              watermark={rankWatermark}
              boardType={runtimeBoardType}
            />

            {rightTop || (
              <RankTrend
                isNewSong={isNewSong}
                trendCount={trendCount}
                trendData={trendData}
                rank_before={rankBefore}
                rankDiffValue={rankDiffValue}
                main_rank={mainRank}
                boardType={runtimeBoardType}
              />
            )}
          </div>

          <OverallPoint
            isNewSong={isNewSong}
            point={props.point}
            point_before={props.point_before}
            fixB={props.fixB}
            fixC={props.fixC}
            boardType={runtimeBoardType}
          />
        </div>

        <StatRows
          props={props}
          showRanks={showRanks}
          boardType={runtimeBoardType}
        />
      </div>
    </AbsoluteFill>
  );
}
