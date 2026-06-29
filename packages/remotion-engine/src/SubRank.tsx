// packages/remotion-engine/src/SubRank.tsx

import { AbsoluteFill } from "remotion";

import { AnimatedListItem } from "./components/ListRankPage";
import { SubRankItem, type SubRankSong } from "./components/SubRankItem";
import { getStyles } from "./styles";
import type { BoardType } from "../../shared/src/boardTypes";

export function SubRank({
  list = [],
  showCount = true,
  boardType = "weekly",
}: {
  list: SubRankSong[];
  showCount?: boolean;
  trendKey?: string;
  trendCount?: number;
  boardType?: BoardType;
}) {
  const styles = getStyles(boardType);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: styles.colors.bg,
        backgroundImage: "radial-gradient(#d7ccc8 3px, transparent 3px)",
        backgroundSize: "24px 24px",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {list.map((item, index) => (
          <AnimatedListItem
            key={`${item.bvid || item.title || "sub"}-${index}`}
            index={index}
            style={{
              height: 240,
              flexShrink: 0,
            }}
          >
            <SubRankItem
              item={item}
              index={index}
              showCount={showCount}
              boardType={boardType}
            />
          </AnimatedListItem>
        ))}
      </div>
    </AbsoluteFill>
  );
}
