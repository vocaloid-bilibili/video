import React, { useRef, useState, useLayoutEffect } from "react";
import {
  LikeIcon,
  ShareIcon,
  ReplyIcon,
  PlayIcon,
  DanmakuIcon,
  StarIcon,
  CoinIcon,
} from "../Icons";
import { StatRow } from "./StatRow";
import { STYLES } from "../styles";

export const StatRows = ({props}: {props:any}) => {


  // 计算各项数据的最佳排名
  const allRanks = [
    props.view_rank,
    props.favorite_rank,
    props.coin_rank,
    props.like_rank,
    props.danmaku_rank,
    props.reply_rank,
    props.share_rank,
  ]
    .map((r) => parseInt(r))
    .filter((n) => !isNaN(n) && n > 0);

  const minRank = allRanks.length > 0 ? Math.min(...allRanks) : 0;

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
        label="播放"
        bgChar="播放"
        icon={<PlayIcon />}
        count={props.view}
        rank={props.view_rank}
        isBestRank={parseInt(props.view_rank) === minRank}
        rate={props.view_rate}
        bgColor={STYLES.colors.blue}
      />
      <StatRow
        label="收藏"
        bgChar="收藏"
        icon={<StarIcon />}
        count={props.favorite}
        rank={props.favorite_rank}
        isBestRank={parseInt(props.favorite_rank) === minRank}
        rate={props.favorite_rate}
        bgColor={STYLES.colors.orange}
      />
      <StatRow
        label="硬币"
        bgChar="硬币"
        icon={<CoinIcon />}
        count={props.coin}
        rank={props.coin_rank}
        isBestRank={parseInt(props.coin_rank) === minRank}
        rate={props.coin_rate}
        bgColor={STYLES.colors.cyan}
        fixValue={props.fixA}
      />
      <StatRow
        label="点赞"
        bgChar="点赞"
        icon={<LikeIcon />}
        count={props.like}
        rank={props.like_rank}
        isBestRank={parseInt(props.like_rank) === minRank}
        rate={props.like_rate}
        bgColor={STYLES.colors.pink}
      />
      <StatRow
        label="弹幕"
        bgChar="弹幕"
        icon={<DanmakuIcon />}
        count={props.danmaku}
        rank={props.danmaku_rank}
        isBestRank={parseInt(props.danmaku_rank) === minRank}
        rate={props.danmaku_rate}
        bgColor={STYLES.colors.purple}
      />
      <StatRow
        label="评论"
        bgChar="评论"
        icon={<ReplyIcon />}
        count={props.reply}
        rank={props.reply_rank}
        isBestRank={parseInt(props.reply_rank) === minRank}
        rate={props.reply_rate}
        bgColor={STYLES.colors.yellow}
        fixValue={props.fixD}
      />
      <StatRow
        label="分享"
        bgChar="分享"
        icon={<ShareIcon />}
        count={props.share}
        rank={props.share_rank}
        isBestRank={parseInt(props.share_rank) === minRank}
        rate={props.share_rate}
        bgColor={STYLES.colors.green}
      />
    </div>
  )
}