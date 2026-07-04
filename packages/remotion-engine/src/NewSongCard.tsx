// packages/remotion-engine/src/NewSongCard.tsx

import { VideoRankCard } from "./VideoRankCard";
import type { BoardType } from "../../shared/src/boardTypes";

type NewSongCardProps = Record<string, unknown> & {
  boardType?: BoardType;
};

export function NewSongCard(props: NewSongCardProps) {
  const boardType = props.boardType || "weekly";

  return (
    <VideoRankCard
      props={props}
      boardType={boardType}
      rankLabel="新曲榜"
      rankWatermark="NEW"
      showCount={false}
      showRanks
      forceNew
    />
  );
}
