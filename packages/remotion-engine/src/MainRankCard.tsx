// packages/remotion-engine/src/MainRankCard.tsx

import { VideoRankCard } from "./VideoRankCard";
import type { WeeklyMain } from "./types";
import type { BoardType } from "../../shared/src/boardTypes";

export function MainRankCard(props: WeeklyMain & { boardType?: BoardType }) {
  const boardType = props.boardType || "weekly";

  return <VideoRankCard props={props} boardType={boardType} />;
}
