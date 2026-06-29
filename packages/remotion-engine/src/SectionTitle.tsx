// packages/remotion-engine/src/SectionTitle.tsx

import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { CSSProperties, FC } from "react";

import { DotPattern } from "./components/FramedPage";
import { getStyles } from "./styles";
import type { BoardType } from "../../shared/src/boardTypes";

export interface SectionTitleProps {
  title?: string;
  from?: string | number;
  to?: string | number;
  themeColor?: string;
  edName?: string;
  edAuthor?: string;
  showNumber?: boolean;
  titleStyle?: CSSProperties;
  titleContainerStyle?: CSSProperties;
  boardType?: BoardType;
}

export const SectionTitle: FC<SectionTitleProps> = ({
  title = "",
  from = 10,
  to = 1,
  themeColor = "#23ade5",
  edName = "",
  edAuthor = "",
  showNumber = true,
  titleStyle = {},
  titleContainerStyle = {},
  boardType = "weekly",
}) => {
  const { fps, durationInFrames, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const styles = getStyles(boardType);

  const entranceY = spring({
    frame,
    fps,
    from: height,
    to: 0,
    config: { damping: 14, mass: 0.8 },
  });

  const titleX = spring({
    frame: frame - 10,
    fps,
    from: -50,
    to: 0,
    config: { damping: 12 },
  });

  const titleOpacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const numberScale = spring({
    frame: frame - 15,
    fps,
    from: 0,
    to: 1,
    config: { damping: 12, stiffness: 80 },
  });

  const edOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const edY = spring({
    frame: frame - 20,
    fps,
    from: 30,
    to: 0,
    config: { damping: 12 },
  });

  const exitFrames = 30;
  const exitStart = durationInFrames - exitFrames;

  const exitProgress = interpolate(
    frame,
    [exitStart, durationInFrames],
    [0, 1],
    { extrapolateLeft: "clamp" },
  );

  const exitY = interpolate(exitProgress, [0, 1], [0, height], {
    easing: Easing.in(Easing.exp),
  });

  const translateY = frame < exitStart ? entranceY : exitY;
  const hasEd = Boolean(edName && edAuthor);

  const containerStyle: CSSProperties = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: `translate(-50%, -50%) translateY(${translateY}px)`,
    width: 1400,
    height: 800,
    backgroundColor: "#fff",
    border: styles.border,
    borderRadius: 32,
    boxShadow: styles.shadow,
    overflow: "hidden",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  };

  const titleContainerBase: CSSProperties = {
    opacity: titleOpacity,
    transform: `translateX(${titleX}px)`,
    position: showNumber ? "absolute" : "relative",
    top: showNumber ? 60 : "auto",
    left: showNumber ? 60 : "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: showNumber ? "flex-start" : "center",
    width: showNumber ? "auto" : "100%",
  };

  const titleTextBase: CSSProperties = {
    fontSize: showNumber ? 90 : 110,
    fontWeight: 900,
    fontFamily: styles.fontMain,
    color: "#222",
    lineHeight: 1,
    marginBottom: 16,
    textAlign: showNumber ? "left" : "center",
  };

  return (
    <AbsoluteFill style={{ backgroundColor: styles.colors.bg }}>
      <DotPattern boardType={boardType} />

      <div style={containerStyle}>
        {title && (
          <div style={{ ...titleContainerBase, ...titleContainerStyle }}>
            <div style={{ ...titleTextBase, ...titleStyle }}>{title}</div>

            <div
              style={{
                width: showNumber ? 120 : 440,
                height: 12,
                backgroundColor: themeColor,
                borderRadius: 6,
                marginLeft: showNumber ? 0 : 80,
                marginRight: showNumber ? 0 : "auto",
              }}
            />
          </div>
        )}

        {showNumber && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 60,
              transform: `scale(${numberScale})`,
            }}
          >
            <span
              style={{
                fontSize: 320,
                fontFamily: styles.fontNum,
                color: "#222",
                lineHeight: 1,
                fontWeight: "bold",
              }}
            >
              {from}
            </span>

            <span
              style={{
                fontSize: 180,
                fontFamily: styles.fontMain,
                color: "#222",
                lineHeight: 1,
              }}
            >
              →
            </span>

            <span
              style={{
                fontSize: 320,
                fontFamily: styles.fontNum,
                color: "#222",
                lineHeight: 1,
                fontWeight: "bold",
              }}
            >
              {to}
            </span>
          </div>
        )}

        {hasEd && (
          <div
            style={{
              position: "absolute",
              bottom: 60,
              left: 0,
              right: 0,
              opacity: edOpacity,
              transform: `translateY(${edY}px)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontFamily: styles.fontMain,
                fontWeight: 600,
                color: "#999",
                letterSpacing: 4,
              }}
            >
              ED
            </div>

            <div
              style={{
                fontSize: 48,
                fontFamily: styles.fontMain,
                fontWeight: "bold",
                color: "#333",
              }}
            >
              {edName}
            </div>

            <div
              style={{
                fontSize: 36,
                fontFamily: styles.fontMain,
                fontWeight: 500,
                color: "#666",
              }}
            >
              {edAuthor}
            </div>
          </div>
        )}

        <div
          style={{
            position: "absolute",
            bottom: -50,
            right: -50,
            width: 200,
            height: 200,
            backgroundColor: themeColor,
            opacity: 0.1,
            borderRadius: "50%",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
