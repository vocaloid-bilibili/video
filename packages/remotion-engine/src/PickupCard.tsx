// packages/remotion-engine/src/PickupCard.tsx

import { VideoRankCard } from "./VideoRankCard";
import { CustomRightTop } from "./components/special/CustomRightTop";
import type { BasicRank } from "./types";
import type { BoardType } from "../../shared/src/boardTypes";

function pickupLetter(rank: number): string {
  if (!Number.isFinite(rank) || rank < 1) return "-";

  return String.fromCharCode(96 + rank);
}

export function PickupCard(props: BasicRank & { boardType?: BoardType }) {
  const boardType = props.boardType || "special";

  return (
    <VideoRankCard
      props={{
        ...props,
        point_before: "-",
      }}
      boardType={boardType}
      rankLabel="PICKUP"
      rankDisplay={pickupLetter(Number(props.rank))}
      showCount={false}
      showRanks={false}
      forceNew
      rightTop={<CustomRightTop boardType={boardType} />}
    />
  );
}
