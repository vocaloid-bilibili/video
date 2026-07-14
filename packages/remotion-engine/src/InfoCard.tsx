// packages/remotion-engine/src/InfoCard.tsx

import {
  AbsoluteFill,
  Img,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import { DotPattern } from "./components/FramedPage";
import { getStyles } from "./styles";
import type { BoardType } from "../../shared/src/boardTypes";

interface InfoCardProps {
  opLabel?: string | null;
  opTitle?: string;
  opArtist?: string;
  opCover?: string;
  timeLabel?: string;
  timeRange?: string;
  note?: string;
  boardType?: BoardType;
}

function getDefaultOpLabel(boardType: BoardType): string {
  switch (boardType) {
    case "monthly":
      return "OP / 上月冠军";
    case "special":
      return "OP";
    default:
      return "OP / 上期冠军";
  }
}

function slideY({
  frame,
  fps,
  durationInFrames,
  height,
  enterDelay,
  exitDelay,
}: {
  frame: number;
  fps: number;
  durationInFrames: number;
  height: number;
  enterDelay: number;
  exitDelay: number;
}): number {
  const entrance = spring({
    frame: frame - enterDelay,
    fps,
    from: height,
    to: 0,
    config: {
      damping: 14,
      mass: 0.8,
      stiffness: 100,
    },
  });

  const exitStartFrame = durationInFrames - 35;

  const exit = spring({
    frame: frame - exitStartFrame - exitDelay,
    fps,
    from: 0,
    to: height,
    config: {
      damping: 14,
      mass: 0.8,
      stiffness: 100,
    },
  });

  return entrance + exit;
}

export function InfoCard({
  opLabel,
  opTitle = "未知",
  opArtist = "Unknown",
  opCover = "",
  timeLabel = "统计时间",
  timeRange = "",
  note = "",
  boardType = "special",
}: InfoCardProps) {
  const { fps, durationInFrames, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const styles = getStyles(boardType);

  const displayOpLabel = opLabel ?? getDefaultOpLabel(boardType);

  const block1Y = slideY({
    frame,
    fps,
    durationInFrames,
    height,
    enterDelay: 0,
    exitDelay: 10,
  });

  const block2Y = slideY({
    frame,
    fps,
    durationInFrames,
    height,
    enterDelay: 5,
    exitDelay: 5,
  });

  const block3Y = slideY({
    frame,
    fps,
    durationInFrames,
    height,
    enterDelay: 10,
    exitDelay: 0,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: styles.colors.bg }}>
      <DotPattern boardType={boardType} />

      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 1400,
            display: "flex",
            flexDirection: "column",
            gap: 32,
            zIndex: 1,
          }}
        >
          <div style={{ transform: `translateY(${block1Y}px)` }}>
            <div
              style={{
                fontSize: 48,
                fontWeight: 900,
                fontFamily: styles.fontMain,
                marginBottom: 16,
                color: boardType === "near1kw" ? "#fff" : "#333",
              }}
            >
              {displayOpLabel}
            </div>

            <div
              style={{
                backgroundColor: "#fff",
                border: styles.border,
                borderRadius: 24,
                boxShadow: styles.shadow,
                padding: 24,
                display: "flex",
                alignItems: "center",
                gap: 32,
              }}
            >
              <div
                style={{
                  width: 280,
                  aspectRatio: "16/9",
                  backgroundColor: "#eee",
                  border: "2px solid #000",
                  borderRadius: 12,
                  overflow: "hidden",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {opCover ? (
                  <Img
                    src={opCover}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 40 }}>🎵</span>
                )}
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <div
                  style={{
                    fontSize: 42,
                    fontWeight: "bold",
                    fontFamily: styles.fontMain,
                    lineHeight: 1.2,
                  }}
                >
                  {opTitle}
                </div>

                <div
                  style={{
                    fontSize: 32,
                    color: "#666",
                    fontFamily: styles.fontMain,
                  }}
                >
                  {opArtist}
                </div>
              </div>
            </div>
          </div>

          <div style={{ transform: `translateY(${block2Y}px)` }}>
            <div
              style={{
                fontSize: 48,
                fontWeight: 900,
                fontFamily: styles.fontMain,
                marginBottom: 16,
                color: boardType === "near1kw" ? "#fff" : "#333",
              }}
            >
              {timeLabel}
            </div>

            <div
              style={{
                backgroundColor: "#fff",
                border: styles.border,
                borderRadius: 24,
                boxShadow: styles.shadow,
                padding: "24px 40px",
                fontSize: 40,
                fontWeight: "bold",
                fontFamily: styles.fontHeader,
                textAlign: "center",
                color: styles.colors.textSub,
                letterSpacing: 1,
              }}
            >
              {timeRange}
            </div>
          </div>

          <div style={{ transform: `translateY(${block3Y}px)` }}>
            <div
              style={{
                backgroundColor: styles.colors.yellow,
                border: styles.border,
                borderRadius: 24,
                boxShadow: styles.shadow,
                padding: "32px 40px",
                marginTop: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: 36,
                  fontWeight: "bold",
                  fontFamily: styles.fontMain,
                  color: "#000",
                }}
              >
                {note}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
