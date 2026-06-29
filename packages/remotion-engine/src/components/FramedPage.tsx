// packages/remotion-engine/src/components/FramedPage.tsx

import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { CSSProperties, ReactNode } from "react";

import { getStyles } from "../styles";
import type { BoardType } from "../../../shared/src/boardTypes";

export function DotPattern({
  boardType = "weekly",
}: {
  boardType?: BoardType;
}) {
  const styles = getStyles(boardType);

  return (
    <AbsoluteFill
      style={{
        backgroundImage: `radial-gradient(${styles.colors.dot} 3px, transparent 3px)`,
        backgroundSize: "24px 24px",
        opacity: 0.6,
        zIndex: 0,
      }}
    />
  );
}

export function FramedPage({
  title,
  children,
  boardType = "weekly",
  width = 1700,
  height = 940,
  headerHeight = 80,
  enterFromY = 50,
  exitToY = 50,
  headerStyle,
  contentStyle,
}: {
  title: ReactNode;
  children: ReactNode;
  boardType?: BoardType;
  width?: number;
  height?: number;
  headerHeight?: number;
  enterFromY?: number;
  exitToY?: number;
  headerStyle?: CSSProperties;
  contentStyle?: CSSProperties;
}) {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const styles = getStyles(boardType);

  const entranceY = spring({
    frame,
    fps,
    from: enterFromY,
    to: 0,
    config: { damping: 12 },
  });

  const entranceOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const exitStartFrame = durationInFrames - 30;
  const exitProgress = interpolate(
    frame,
    [exitStartFrame, exitStartFrame + 20],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const exitY = interpolate(exitProgress, [0, 1], [0, exitToY]);
  const exitOpacity = interpolate(exitProgress, [0, 1], [1, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: styles.colors.bg,
        fontFamily: styles.fontMain,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <DotPattern boardType={boardType} />

      <div
        style={{
          width,
          height,
          zIndex: 1,
          backgroundColor: styles.colors.cardBg,
          border: styles.border,
          borderRadius: 24,
          boxShadow: styles.shadow,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          opacity: entranceOpacity * exitOpacity,
          transform: `translateY(${entranceY + exitY}px)`,
        }}
      >
        <header
          style={{
            height: headerHeight,
            flexShrink: 0,
            backgroundColor: styles.colors.headerBg,
            color: styles.colors.headerText,
            display: "flex",
            alignItems: "center",
            padding: "0 40px",
            borderBottom: styles.border,
            boxSizing: "border-box",
            ...headerStyle,
          }}
        >
          {title}
        </header>

        <main
          style={{
            flex: 1,
            minHeight: 0,
            boxSizing: "border-box",
            ...contentStyle,
          }}
        >
          {children}
        </main>
      </div>
    </AbsoluteFill>
  );
}
