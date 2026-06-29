// packages/remotion-engine/src/components/ListRankPage.tsx

import {
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import { getStyles } from "../styles";
import type { BoardType } from "../../../shared/src/boardTypes";

export function ListImage({
  src,
  fallback = "NO IMG",
  style,
}: {
  src?: string;
  fallback?: string;
  style?: CSSProperties;
}) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#aaa",
          fontSize: 24,
          fontWeight: "bold",
          ...style,
        }}
      >
        {fallback}
      </div>
    );
  }

  return (
    <Img
      src={src}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        ...style,
      }}
      onError={() => setHasError(true)}
    />
  );
}

export function AnimatedListItem({
  index,
  children,
  style,
}: {
  index: number;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  const entranceY = spring({
    frame: frame - index * 3,
    fps,
    from: 50,
    to: 0,
    config: { damping: 12 },
  });

  const entranceOpacity = interpolate(frame - index * 3, [0, 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const exitStartFrame = durationInFrames - 40;
  const exitProgress = interpolate(
    frame,
    [exitStartFrame + index * 2, exitStartFrame + index * 2 + 15],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const exitY = interpolate(exitProgress, [0, 1], [0, 50]);
  const exitOpacity = interpolate(exitProgress, [0, 1], [1, 0]);

  return (
    <div
      style={{
        transform: `translateY(${entranceY + exitY}px)`,
        opacity: entranceOpacity * exitOpacity,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function ListRankPage<T>({
  title,
  items,
  renderItem,
  boardType = "weekly",
  columns = 1,
  rowsPerColumn = 5,
  cardHeight = 176,
  cardGap = 14,
  middleGap = 20,
  cardStyle,
}: {
  title: string;
  items?: T[];
  renderItem: (item: T, index: number) => ReactNode;
  boardType?: BoardType;
  columns?: number;
  rowsPerColumn?: number;
  cardHeight?: number;
  cardGap?: number;
  middleGap?: number;
  cardStyle?: CSSProperties;
}) {
  const displayList = items || [];
  const { durationInFrames, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const styles = getStyles(boardType);

  const titleEntranceX = spring({
    frame: frame - 5,
    fps,
    from: 100,
    to: 0,
    config: { damping: 12 },
  });

  const titleEntranceOpacity = interpolate(frame - 5, [0, 15], [0, 1], {
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

  const titleExitOpacity = interpolate(exitProgress, [0, 1], [1, 0]);
  const titleExitX = interpolate(exitProgress, [0, 1], [0, 50]);

  const totalCardsHeight =
    rowsPerColumn * cardHeight + (rowsPerColumn - 1) * cardGap;
  const availableHeight = 1040;
  const verticalPadding = (availableHeight - totalCardsHeight) / 2;

  const columnLists = Array.from({ length: columns }, (_, columnIndex) => {
    const start = columnIndex * rowsPerColumn;
    return displayList.slice(start, start + rowsPerColumn);
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: styles.colors.bg,
        fontFamily: styles.fontMain,
        backgroundImage: "radial-gradient(#d7ccc8 3px, transparent 3px)",
        backgroundSize: "24px 24px",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "row",
        gap: 30,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "calc(100% - 380px)",
          display: "flex",
          flexDirection: "row",
          gap: middleGap,
          height: "100%",
          paddingTop: verticalPadding,
          paddingRight: 20,
          boxSizing: "border-box",
        }}
      >
        {columnLists.map((columnItems, columnIndex) => (
          <div
            key={columnIndex}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: cardGap,
              minWidth: 0,
            }}
          >
            {columnItems.map((item, itemIndex) => {
              const absoluteIndex = columnIndex * rowsPerColumn + itemIndex;

              return (
                <AnimatedListItem
                  key={absoluteIndex}
                  index={absoluteIndex}
                  style={{
                    height: cardHeight,
                    flexShrink: 0,
                    ...cardStyle,
                  }}
                >
                  {renderItem(item, absoluteIndex)}
                </AnimatedListItem>
              );
            })}
          </div>
        ))}
      </div>

      <div
        style={{
          width: 340,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          alignItems: "flex-end",
          flexShrink: 0,
          paddingBottom: verticalPadding,
          opacity: titleEntranceOpacity * titleExitOpacity,
          transform: `translateX(${titleEntranceX + titleExitX}px)`,
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 900,
            color: "#222",
            fontFamily: styles.fontMain,
            lineHeight: 1,
            textShadow: "4px 4px 0px #fff",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
}
