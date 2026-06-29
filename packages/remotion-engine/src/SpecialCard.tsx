// packages/remotion-engine/src/SpecialCard.tsx

import { VideoRankCard } from "./VideoRankCard";
import { CustomRightTop } from "./components/special/CustomRightTop";
import type { BasicRank } from "./types";
import type { BoardType } from "../../shared/src/boardTypes";

export function SpecialCard(props: BasicRank & { boardType?: BoardType }) {
  const boardType = props.boardType || "special";

  return (
    <VideoRankCard
      props={{
        ...props,
        point_before: "-",
      }}
      boardType={boardType}
      showCount={false}
      showRanks
      forceNew
      rightTop={<CustomRightTop boardType={boardType} />}
    />
  );
}
