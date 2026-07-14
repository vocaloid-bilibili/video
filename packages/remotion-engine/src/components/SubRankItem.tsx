// packages/remotion-engine/src/components/SubRankItem.tsx

import { FitTitle } from "./FitTitle";
import { HonorBadge } from "./HonorBadge";
import { ListImage } from "./ListRankPage";
import { SongMetricGrid } from "./SongMetricGrid";
import { getStyles } from "../styles";
import { formatNumber, safeParse } from "../utils/safeParse";
import type { BoardType } from "../../../shared/src/boardTypes";

export interface SubRankSong {
  rank?: number | string;
  rank_before?: number | string | "-";
  count?: number | string;
  title?: string;
  producer?: string;
  producers?: string;
  vocalist?: string;
  vocalists?: string;
  thumbnail?: string;
  honor?: string[];
  [key: string]: unknown;
}

function isNewRank(rankBefore: unknown): boolean {
  return (
    rankBefore === "-" ||
    rankBefore === undefined ||
    rankBefore === null ||
    rankBefore === ""
  );
}

function getTrend({
  rank,
  rankBefore,
  boardType,
}: {
  rank: unknown;
  rankBefore: unknown;
  boardType: BoardType;
}) {
  const styles = getStyles(boardType);

  if (isNewRank(rankBefore)) {
    return {
      label: "NEW!!",
      color: styles.colors.red,
      showPrevious: false,
    };
  }

  const diff = safeParse(rankBefore) - safeParse(rank);

  if (diff > 0) {
    return {
      label: "▲",
      color: styles.colors.red,
      showPrevious: true,
    };
  }

  if (diff < 0) {
    return {
      label: "▼",
      color: styles.colors.green,
      showPrevious: true,
    };
  }

  return {
    label: "◼",
    color: styles.colors.gray,
    showPrevious: true,
  };
}

function RankPanel({
  item,
  showCount,
  boardType,
}: {
  item: SubRankSong;
  showCount: boolean;
  boardType: BoardType;
}) {
  const styles = getStyles(boardType);
  const trend = getTrend({
    rank: item.rank,
    rankBefore: item.rank_before,
    boardType,
  });

  return (
    <div
      style={{
        width: 160,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
        borderRight: "2px solid #e0e0e0",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 16,
        }}
      >
        <div
          style={{
            fontSize: 68,
            lineHeight: 0.9,
            color: styles.colors.textMain,
            textShadow: "3px 3px 0 #fff",
            fontFamily: styles.fontNum,
            fontWeight: 900,
          }}
        >
          {item.rank ?? "-"}
        </div>

        <div
          style={{
            fontSize: trend.label === "NEW!!" ? 24 : 32,
            lineHeight: 1,
            fontFamily: styles.fontNum,
            marginTop: 4,
            color: trend.color,
            fontWeight: 900,
          }}
        >
          {trend.label}
        </div>

        {trend.showPrevious && (
          <div
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: "#666",
              backgroundColor: "rgba(255, 255, 255, 0.6)",
              padding: "4px 10px",
              borderRadius: 4,
              marginTop: 4,
              fontFamily: styles.fontMain,
            }}
          >
            上期 {item.rank_before}
          </div>
        )}
      </div>

      {showCount && (
        <div
          style={{
            width: "100%",
            height: 42,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 6,
            borderTop: "2px solid #ccc",
            backgroundColor: "#e8e8e8",
            fontSize: 18,
            fontWeight: 900,
            color: "#555",
            fontFamily: styles.fontMain,
          }}
        >
          在榜
          <span
            style={{
              fontSize: 28,
              lineHeight: 1,
              color: styles.colors.red,
              position: "relative",
              top: -1,
              fontFamily: styles.fontNum,
            }}
          >
            {formatNumber(item.count)}
          </span>
          次
        </div>
      )}
    </div>
  );
}

function HonorList({
  honors,
  boardType,
}: {
  honors?: string[];
  boardType: BoardType;
}) {
  if (!honors || honors.length === 0) return null;

  return (
    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
      {honors.map((honor, index) => (
        <HonorBadge
          key={`${honor}-${index}`}
          text={honor}
          boardType={boardType}
        />
      ))}
    </div>
  );
}

export function SubRankItem({
  item,
  index,
  showCount = true,
  boardType = "weekly",
}: {
  item: SubRankSong;
  index: number;
  showCount?: boolean;
  boardType?: BoardType;
}) {
  const styles = getStyles(boardType);
  const producer = item.producer || item.producers || "";
  const vocalist = item.vocalist || item.vocalists || "";
  const honors = Array.isArray(item.honor) ? item.honor : [];
  const producerLine = [
    String(producer || ""),
    vocalist ? `feat. ${String(vocalist)}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        backgroundColor: boardType === "near1kw" ? styles.colors.uidText : styles.colors.cardBg,
        border: `3px solid ${styles.colors.cardBorder}`,
        borderRadius: 16,
        boxShadow: `6px 6px 0 ${styles.colors.shadow}`,
        overflow: "hidden",
        width: "100%",
      }}
    >
      <RankPanel item={item} showCount={showCount} boardType={boardType} />

      <div
        style={{
          width: 280,
          flexShrink: 0,
          position: "relative",
          borderRight: `3px solid ${styles.colors.cardBorder}`,
          backgroundColor: "#ddd",
        }}
      >
        <ListImage src={item.thumbnail || ""} />
      </div>

      <div
        style={{
          flex: 1,
          width: 0,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          padding: "8px 16px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            marginBottom: 4,
            flexShrink: 0,
          }}
        >
          <div style={{ width: "100%", marginBottom: 4, overflow: "visible" }}>
            <FitTitle
              text={item.title || ""}
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: "#000",
                fontFamily: styles.fontMain,
                whiteSpace: "nowrap",
                lineHeight: 1.2,
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              minHeight: 32,
            }}
          >
            <div
              style={{
                flex: 1,
                width: 0,
                minWidth: 0,
                marginRight: 12,
              }}
            >
              <FitTitle
                text={producerLine}
                style={{
                  fontSize: 20,
                  color: "#555",
                  fontFamily: styles.fontMain,
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                }}
              />
            </div>

            <HonorList honors={honors} boardType={boardType} />
          </div>
        </div>

        <SongMetricGrid
          item={{
            ...item,
            listIndex: index,
          }}
          boardType={boardType}
        />
      </div>
    </div>
  );
}
