// packages/remotion-engine/src/components/StatRows.tsx

import {
  CoinIcon,
  DanmakuIcon,
  LikeIcon,
  PlayIcon,
  ReplyIcon,
  ShareIcon,
  StarIcon,
} from "../Icons";
import { getStyles } from "../styles";
import { safeParse } from "../utils/safeParse";
import { getBestRank, StatRow } from "./StatRow";
import type { BoardType } from "../../../shared/src/boardTypes";

export function StatRows({
  props,
  showRanks = true,
  boardType = "weekly",
}: {
  props: Record<string, any>;
  showRanks?: boolean;
  boardType?: BoardType;
}) {
  const styles = getStyles(boardType);

  const minRank = getBestRank(
    props.view_rank,
    props.favorite_rank,
    props.coin_rank,
    props.like_rank,
    props.danmaku_rank,
    props.reply_rank,
    props.share_rank,
  );

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        overflow: "hidden",
      }}
    >
      <StatRow
        bgChar="播放"
        icon={<PlayIcon />}
        count={props.view}
        rank={props.view_rank}
        isBestRank={safeParse(props.view_rank) === minRank}
        rate={props.view_rate}
        bgColor={styles.colors.blue}
        showRank={showRanks}
        boardType={boardType}
      />
      <StatRow
        bgChar="收藏"
        icon={<StarIcon />}
        count={props.favorite}
        rank={props.favorite_rank}
        isBestRank={safeParse(props.favorite_rank) === minRank}
        rate={props.favorite_rate}
        bgColor={styles.colors.orange}
        showRank={showRanks}
        boardType={boardType}
      />
      <StatRow
        bgChar="硬币"
        icon={<CoinIcon />}
        count={props.coin}
        rank={props.coin_rank}
        isBestRank={safeParse(props.coin_rank) === minRank}
        rate={props.coin_rate}
        bgColor={styles.colors.cyan}
        fixValue={props.fixA}
        showRank={showRanks}
        boardType={boardType}
      />
      <StatRow
        bgChar="点赞"
        icon={<LikeIcon />}
        count={props.like}
        rank={props.like_rank}
        isBestRank={safeParse(props.like_rank) === minRank}
        rate={props.like_rate}
        bgColor={styles.colors.pink}
        showRank={showRanks}
        boardType={boardType}
      />
      <StatRow
        bgChar="弹幕"
        icon={<DanmakuIcon />}
        count={props.danmaku}
        rank={props.danmaku_rank}
        isBestRank={safeParse(props.danmaku_rank) === minRank}
        rate={props.danmaku_rate}
        bgColor={styles.colors.purple}
        showRank={showRanks}
        boardType={boardType}
      />
      <StatRow
        bgChar="评论"
        icon={<ReplyIcon />}
        count={props.reply}
        rank={props.reply_rank}
        isBestRank={safeParse(props.reply_rank) === minRank}
        rate={props.reply_rate}
        bgColor={styles.colors.yellow}
        fixValue={props.fixD}
        showRank={showRanks}
        boardType={boardType}
      />
      <StatRow
        bgChar="分享"
        icon={<ShareIcon />}
        count={props.share}
        rank={props.share_rank}
        isBestRank={safeParse(props.share_rank) === minRank}
        rate={props.share_rate}
        bgColor={styles.colors.green}
        showRank={showRanks}
        boardType={boardType}
      />
    </div>
  );
}
