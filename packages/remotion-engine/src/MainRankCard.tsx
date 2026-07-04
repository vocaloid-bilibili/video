// packages/remotion-engine/src/MainRankCard.tsx

import { VideoRankCard } from "./VideoRankCard";
import type { WeeklyMain } from "./types";
import type { BoardType } from "../../shared/src/boardTypes";

type MainRankCardProps = WeeklyMain & {
  boardType?: BoardType;
  showCount?: boolean;
};

export function MainRankCard(props: MainRankCardProps) {
  const boardType = props.boardType || "weekly";

  return (
    <VideoRankCard
      props={props}
      boardType={boardType}
      rankLabel="主榜"
      rankWatermark="RANK"
      showCount={props.showCount !== false}
      showRanks
      forceNew={false}
    />
  );
}
