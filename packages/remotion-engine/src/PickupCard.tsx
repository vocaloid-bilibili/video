// 特刊用的视频卡片。可定制，也许代码会频繁修改。
import {
  AbsoluteFill,
  useVideoConfig,
  useCurrentFrame,
  spring,
  interpolate,
  Easing,
} from "remotion";
import { VideoContainer } from "./VideoContainer";
import { SongInfo } from "./components/SongInfo";
import { StatRows } from "./components/StatRows";
import { STYLES, getStyles } from "./styles";
import { OverallPoint } from "./components/OverallPoint";
import { PickupRank as RankCore } from "./components/special/PickupRank";
// import { RankPart as RightTop } from "./components/special/RankPart";
import { CustomRightTop as RightTop } from './components/special/CustomRightTop'
import { BasicRank } from "./types";
import type { BoardType } from "../../shared/src/boardTypes";

export const PickupCard = (props: BasicRank & { boardType?: BoardType }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const boardType = props.boardType || "weekly";
  const STYLES = getStyles(boardType);

  const safeParse = (val: any) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };


  // 动画逻辑
  const transitionFrames = 35;

  // 是否启用淡入淡出（默认 true）
  const transitionIn = props.transitionIn !== false;
  const transitionOut = props.transitionOut !== false;

  // 根据 transitionIn/transitionOut 控制音量曲线
  const volume = interpolate(
    frame,
    [
      0,
      transitionFrames,
      durationInFrames - transitionFrames,
      durationInFrames,
    ],
    [
      transitionIn ? 0 : 1,  // 开始：淡入时从 0 开始，否则从 1 开始
      1,
      1,
      transitionOut ? 0 : 1,  // 结束：淡出时到 0，否则保持 1
    ],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const exitStartFrame = durationInFrames - transitionFrames;

  // 退出进度（仅当 transitionOut 为 true 时有动画）
  const exitProgress = transitionOut
    ? interpolate(
        frame,
        [exitStartFrame, durationInFrames],
        [0, 1],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.in(Easing.back(1.5)),
        },
      )
    : 0;

  // 视频容器位移
  const videoEntranceY = transitionIn
    ? spring({
        frame,
        fps,
        from: -1000,
        to: 0,
        config: { damping: 14 },
      })
    : 0;
  const videoExitY = transitionOut ? interpolate(exitProgress, [0, 1], [0, -1000]) : 0;
  const videoTranslateY = frame < exitStartFrame ? videoEntranceY : videoExitY;

  // 底部信息栏位移
  const infoEntranceY = transitionIn
    ? spring({
        frame,
        fps,
        from: 300,
        to: 0,
        config: { damping: 15 },
      })
    : 0;
  const infoExitY = transitionOut ? interpolate(exitProgress, [0, 1], [0, 400]) : 0;
  const infoTranslateY = frame < exitStartFrame ? infoEntranceY : infoExitY;

  // 侧边栏位移
  const sidebarEntranceX = transitionIn
    ? spring({
        frame,
        fps,
        from: 800,
        to: 0,
        config: { damping: 14, mass: 0.8 },
      })
    : 0;
  const sidebarExitX = transitionOut ? interpolate(exitProgress, [0, 1], [0, 800]) : 0;
  const sidebarTranslateX =
    frame < exitStartFrame ? sidebarEntranceX : sidebarExitX;

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
          boardType={boardType}
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
        {/* 上半部分：排名与分数 */}
        <div
          style={{
            flex: "0 0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {/* 第一行：排名 + 板块 */}
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
              showCount={false}
              count={0}
            />

            {/* 右块：趋势与上周对比 */}
            <RightTop
              // partName="主榜"
            />
          </div>

          {/* 第二行：综合得分 */}
          <OverallPoint
            isNewSong={true}
            point={props.point}
            point_before={"-"}
            fixB={props.fixB}
            fixC={props.fixC}
          />
        </div>

        {/* 下半部分：详细数据 */}
        <StatRows
          props={props}
          show_ranks={false}
        />
      </div>
    </AbsoluteFill>
  );
};
