// packages/remotion-engine/src/components/SongMetricGrid.tsx

import type { ComponentType, CSSProperties } from "react";

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
import { formatNumber, safeParse } from "../utils/safeParse";
import type { BoardType } from "../../../shared/src/boardTypes";

interface SongMetricGridProps {
  item: Record<string, unknown>;
  boardType?: BoardType;
}

interface MetricCellConfig {
  icon: ComponentType<{ style?: CSSProperties }>;
  valueKey: string;
  rankKey: string;
  bgColor: string;
}

function getBestRank(item: Record<string, unknown>): number {
  const ranks = [
    item.view_rank,
    item.favorite_rank,
    item.coin_rank,
    item.like_rank,
    item.danmaku_rank,
    item.reply_rank,
    item.share_rank,
  ]
    .map((value) => safeParse(value))
    .filter((value) => value > 0);

  return ranks.length > 0 ? Math.min(...ranks) : 0;
}

function formatRankLabel(value: unknown): string {
  const rank = safeParse(value);

  return rank > 0 ? String(rank) : "-";
}

function MetricCell({
  item,
  config,
  minRank,
  boardType,
}: {
  item: Record<string, unknown>;
  config: MetricCellConfig;
  minRank: number;
  boardType: BoardType;
}) {
  const styles = getStyles(boardType);
  const Icon = config.icon;
  const rank = safeParse(item[config.rankKey]);
  const isBestRank = rank > 0 && rank === minRank;
  const rankLabel = formatRankLabel(item[config.rankKey]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 10px",
        border: "1px solid #000",
        borderRadius: 8,
        boxShadow: "2px 2px 0 rgba(0,0,0,0.05)",
        minWidth: 0,
        backgroundColor: config.bgColor,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          minWidth: 0,
        }}
      >
        <div style={{ width: 34, height: 34, flexShrink: 0 }}>
          <Icon
            style={{
              width: "100%",
              height: "100%",
              filter: "drop-shadow(1px 1px 0 rgba(0,0,0,0.2))",
            }}
          />
        </div>

        <span
          style={{
            fontSize: 24,
            fontWeight: 900,
            letterSpacing: -0.5,
            lineHeight: 1,
            fontFamily: styles.fontNum,
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          {formatNumber(item[config.valueKey])}
        </span>
      </div>

      {boardType !== "near1kw" && (
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          padding: "2px 6px",
          borderRadius: 6,
          backgroundColor: "rgba(255,255,255,0.6)",
          color: "#333",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: isBestRank ? styles.colors.red : "#000",
            fontFamily: styles.fontNum,
            textShadow: isBestRank ? "1px 1px 0 rgba(255,255,255,0.8)" : "none",
          }}
        >
          {rankLabel}
        </span>

        <span
          style={{
            fontSize: 13,
            fontWeight: "bold",
            marginLeft: 1,
            color: "#444",
            fontFamily: styles.fontMain,
          }}
        >
          位
        </span>
      </div>
    )}
    </div>
  );
}

function TotalPointCell({
  item,
  boardType,
}: {
  item: Record<string, unknown>;
  boardType: BoardType;
}) {
  const styles = getStyles(boardType);
  const rate = String(item.rate ?? "");
  const rateLabel = rate === "NEW" ? "NEW!!" : rate;
  const point = item.point ?? item.score ?? 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 10px",
        border: "2px solid #000",
        borderRadius: 8,
        background: "linear-gradient(135deg, #1a1a1a, #333333)",
        color: "#fff",
        boxShadow:
          "inset 0 0 0 2px rgba(255,215,0,0.1), 4px 4px 0 rgba(0,0,0,0.4)",
      }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "flex-end",
          gap: 4,
          paddingRight: 8,
        }}
      >
        <span
          style={{
            fontSize: 22,
            fontWeight: "bold",
            color: "#fff",
            letterSpacing: 2,
            whiteSpace: "nowrap",
            marginBottom: 3,
            fontFamily: styles.fontMain,
          }}
        >
          总
        </span>

        <span
          style={{
            fontSize: 40,
            fontWeight: 900,
            lineHeight: 1,
            color: "#fff",
            textShadow: "0 4px 8px rgba(0,0,0,0.8)",
            fontFamily: styles.fontNum,
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          {formatNumber(point)}
        </span>
      </div>

      {rateLabel && (
        <span
          style={{
            fontSize: rateLabel === "NEW!!" ? 18 : 20,
            fontWeight: 900,
            padding: "3px 8px",
            borderRadius: 6,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.3)",
            backdropFilter: "blur(4px)",
            color: rateLabel.startsWith("-") ? "#b9f6ca" : "#ff8a80",
            fontFamily: styles.fontNum,
            letterSpacing: rateLabel === "NEW!!" ? 1 : 0,
            whiteSpace: "nowrap",
          }}
        >
          {rateLabel}
        </span>
      )}
    </div>
  );
}

export function SongMetricGrid({
  item,
  boardType = "weekly",
}: SongMetricGridProps) {
  const styles = getStyles(boardType);
  const minRank = getBestRank(item);

  const metrics: MetricCellConfig[] = [
    {
      icon: PlayIcon,
      valueKey: "view",
      rankKey: "view_rank",
      bgColor: styles.colors.play,
    },
    {
      icon: StarIcon,
      valueKey: "favorite",
      rankKey: "favorite_rank",
      bgColor: styles.colors.fav,
    },
    {
      icon: CoinIcon,
      valueKey: "coin",
      rankKey: "coin_rank",
      bgColor: styles.colors.coin,
    },
    {
      icon: LikeIcon,
      valueKey: "like",
      rankKey: "like_rank",
      bgColor: styles.colors.like,
    },
    {
      icon: DanmakuIcon,
      valueKey: "danmaku",
      rankKey: "danmaku_rank",
      bgColor: styles.colors.dan,
    },
    {
      icon: ReplyIcon,
      valueKey: "reply",
      rankKey: "reply_rank",
      bgColor: styles.colors.rep,
    },
    {
      icon: ShareIcon,
      valueKey: "share",
      rankKey: "share_rank",
      bgColor: styles.colors.share,
    },
  ];

  return (
    <div
      style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gridTemplateRows: "repeat(2, 1fr)",
        gap: 8,
        borderTop: "2px solid #eee",
        paddingTop: 6,
      }}
    >
      {metrics.map((config) => (
        <MetricCell
          key={config.valueKey}
          item={item}
          config={config}
          minRank={minRank}
          boardType={boardType}
        />
      ))}

      <TotalPointCell item={item} boardType={boardType} />
    </div>
  );
}
