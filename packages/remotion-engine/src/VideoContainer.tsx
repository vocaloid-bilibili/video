// packages/remotion-engine/src/VideoContainer.tsx

import { OffthreadVideo } from "remotion";
import { getStyles } from "./styles";
import type { BoardType } from "../../shared/src/boardTypes";

export function VideoContainer({
  videoTranslateY,
  videoSource,
  volume,
  boardType = "weekly",
}: {
  videoTranslateY: number;
  videoSource?: string;
  volume: number;
  boardType?: BoardType;
}) {
  const styles = getStyles(boardType);

  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "16/9",
        backgroundColor: "#000",
        border: styles.border,
        borderRadius: 24,
        boxShadow: styles.shadow,
        overflow: "hidden",
        position: "relative",
        transform: `translateY(${videoTranslateY}px)`,
        zIndex: 2,
      }}
    >
      {videoSource ? (
        <OffthreadVideo
          src={videoSource}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          volume={volume}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 40,
          }}
        >
          NO SIGNAL
        </div>
      )}
    </div>
  );
}
