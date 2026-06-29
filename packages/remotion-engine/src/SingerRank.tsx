// packages/remotion-engine/src/SingerRank.tsx

import { AbsoluteFill } from "remotion";

import { FitTitle } from "./components/FitTitle";
import { ListImage, ListRankPage } from "./components/ListRankPage";
import { formatNumber, safeParse } from "./utils/safeParse";
import { getStyles } from "./styles";
import type { BoardType } from "../../shared/src/boardTypes";

interface SingerRankItem {
  name?: string;
  avatar?: string;
  point?: number;
  score?: number;
  firstname?: string;
  first_name?: string;
  rank?: number;
  last_rank?: number;
}

function getAvatarUrl(singer: SingerRankItem): string {
  if (singer.avatar) return singer.avatar;

  return `http://localhost:3002/config/avatar/${encodeURIComponent(
    singer.name || "",
  )}.png`;
}

function SingerItem({
  singer,
  boardType,
}: {
  singer: SingerRankItem;
  boardType: BoardType;
}) {
  const styles = getStyles(boardType);
  const rank = safeParse(singer.rank);
  const lastRank = safeParse(singer.last_rank);
  const score = singer.point ?? singer.score ?? 0;
  const firstSong = singer.firstname ?? singer.first_name ?? "";

  let trendIcon = "■";
  let trendColor = "#888";

  if (lastRank > 0 && rank > 0) {
    const rankDiff = lastRank - rank;

    if (rankDiff > 0) {
      trendIcon = "▲";
      trendColor = styles.colors.accentRed;
    } else if (rankDiff < 0) {
      trendIcon = "▼";
      trendColor = styles.colors.accentGreen;
    }
  } else {
    trendIcon = "NEW";
    trendColor = styles.colors.accentRed;
  }

  const avatarColors = [
    styles.colors.cyan,
    styles.colors.pink,
    styles.colors.green,
    styles.colors.yellow,
    styles.colors.purple,
  ];

  const avatarBg = avatarColors[(Math.max(1, rank) - 1) % avatarColors.length];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        border: "3px solid #000",
        borderRadius: 14,
        padding: "10px 14px",
        boxShadow: "8px 8px 0px rgba(0,0,0,1)",
        gap: 12,
        height: "100%",
        boxSizing: "border-box",
        overflow: "hidden",
        width: "100%",
      }}
    >
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 12,
          border: "2px solid #000",
          backgroundColor: avatarBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        <ListImage
          src={getAvatarUrl(singer)}
          fallback={(singer.name || "?").substring(0, 1)}
        />
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 6,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <div style={{ width: "100%", overflow: "hidden" }}>
          <FitTitle
            text={singer.name || ""}
            style={{
              fontSize: 34,
              fontWeight: 900,
              color: "#222",
              fontFamily: styles.fontMain,
              whiteSpace: "nowrap",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 6,
            paddingLeft: 2,
          }}
        >
          <span style={{ fontSize: 20, color: "#555", fontWeight: "bold" }}>
            总分
          </span>
          <span
            style={{
              fontSize: 26,
              fontFamily: styles.fontNum,
              fontWeight: "bold",
              color: "#333",
            }}
          >
            {formatNumber(score)}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 6,
            paddingLeft: 2,
            overflow: "hidden",
            width: "100%",
          }}
        >
          <span
            style={{
              fontSize: 20,
              color: "#555",
              fontWeight: "bold",
              flexShrink: 0,
            }}
          >
            首位
          </span>
          <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
            <FitTitle
              text={firstSong}
              style={{
                fontSize: 20,
                fontWeight: "500",
                color: "#333",
              }}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: 75,
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontFamily: styles.fontNum,
            lineHeight: 0.9,
            fontWeight: "900",
            textShadow: "3px 3px 0px rgba(0,0,0,0.1)",
            color: "#222",
          }}
        >
          {rank || "-"}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 2,
          }}
        >
          {trendIcon === "NEW" ? (
            <span
              style={{
                fontSize: 28,
                fontWeight: "900",
                color: styles.colors.accentRed,
                fontFamily: styles.fontNum,
              }}
            >
              NEW
            </span>
          ) : (
            <>
              <span
                style={{
                  fontSize: 28,
                  color: trendColor,
                  lineHeight: 0.8,
                }}
              >
                {trendIcon}
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                <span
                  style={{
                    fontSize: 14,
                    color: "#888",
                    fontWeight: "bold",
                  }}
                >
                  上期
                </span>
                <span
                  style={{
                    fontSize: 20,
                    fontFamily: styles.fontNum,
                    fontWeight: "bold",
                  }}
                >
                  {lastRank || "-"}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function SingerRank({
  list = [],
  boardType = "weekly",
}: {
  list: SingerRankItem[];
  boardType?: BoardType;
}) {
  return (
    <AbsoluteFill>
      <ListRankPage
        title="歌手排名"
        items={list}
        boardType={boardType}
        columns={2}
        rowsPerColumn={5}
        renderItem={(singer) => (
          <SingerItem singer={singer} boardType={boardType} />
        )}
      />
    </AbsoluteFill>
  );
}
