// packages/remotion-engine/src/components/RankTrend.tsx

import { getStyles } from "../styles";
import { TrendBar } from "./TrendBar";
import type { BoardType } from "../../../shared/src/boardTypes";

type RankBefore = number | "-";

export function RankTrend({
  isNewSong = false,
  trendCount = 7,
  trendData,
  rankDiffValue = 0,
  rank_before = "-",
  main_rank = null,
  showMainRank = false,
  boardType = "weekly",
}: {
  isNewSong?: boolean;
  trendCount?: number;
  trendData?: Record<string, unknown>;
  rankDiffValue?: number;
  rank_before?: RankBefore;
  main_rank?: number | null;
  showMainRank?: boolean;
  boardType?: BoardType;
}) {
  const styles = getStyles(boardType);
  const showMainRankBlock = showMainRank && main_rank !== null;

  return (
    <div
      style={{
        flex: 5,
        display: "flex",
        flexDirection: "column",
        border: "2px solid #000",
        borderRadius: 12,
        backgroundColor: "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: 40,
          right: 5,
          fontSize: 36,
          fontWeight: "900",
          color: "rgba(0,0,0,0.05)",
          pointerEvents: "none",
          lineHeight: 1,
          fontFamily: "Arial Black",
        }}
      >
        TREND
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 8px",
        }}
      >
        {isNewSong ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <span
              style={{
                fontSize: 64,
                fontWeight: "900",
                fontFamily: styles.fontNum,
                color: styles.colors.accentRed,
                lineHeight: 1,
                textShadow: "3px 3px 0 rgba(0,0,0,0.1)",
              }}
            >
              NEW!!
            </span>
          </div>
        ) : (
          <>
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                zIndex: 1,
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  color: "#999",
                  fontWeight: "bold",
                  lineHeight: 1,
                }}
              >
                排名变动
              </span>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 36,
                }}
              >
                {rankDiffValue > 0 ? (
                  <>
                    <span
                      style={{
                        fontSize: 24,
                        color: styles.colors.accentRed,
                        marginRight: 2,
                        fontFamily: styles.fontNum,
                      }}
                    >
                      ▲
                    </span>
                    <span
                      style={{
                        fontSize: 30,
                        fontWeight: "900",
                        color: styles.colors.accentRed,
                        fontFamily: styles.fontNum,
                        lineHeight: 1,
                      }}
                    >
                      {rankDiffValue}
                    </span>
                  </>
                ) : rankDiffValue < 0 ? (
                  <>
                    <span
                      style={{
                        fontSize: 24,
                        color: styles.colors.accentGreen,
                        marginRight: 2,
                        fontFamily: styles.fontNum,
                      }}
                    >
                      ▼
                    </span>
                    <span
                      style={{
                        fontSize: 30,
                        fontWeight: "900",
                        color: styles.colors.accentGreen,
                        fontFamily: styles.fontNum,
                        lineHeight: 1,
                      }}
                    >
                      {Math.abs(rankDiffValue)}
                    </span>
                  </>
                ) : (
                  <span
                    style={{
                      fontSize: 24,
                      fontWeight: "900",
                      color: "#888",
                      fontFamily: styles.fontNum,
                    }}
                  >
                    ◼ 持平
                  </span>
                )}
              </div>
            </div>

            <div
              style={{
                width: 2,
                height: "50%",
                backgroundColor: "#f0f0f0",
                alignSelf: "center",
              }}
            />

            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                zIndex: 1,
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  color: "#999",
                  fontWeight: "bold",
                  lineHeight: 1,
                }}
              >
                上期排名
              </span>

              <span
                style={{
                  fontSize: 30,
                  fontWeight: "900",
                  fontFamily: styles.fontNum,
                  color: "#444",
                  lineHeight: 1,
                }}
              >
                #{rank_before}
              </span>
            </div>
          </>
        )}
      </div>

      {showMainRankBlock && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "4px 8px",
            zIndex: 1,
          }}
        >
          <span style={{ fontSize: 18, color: "#999", fontWeight: "bold" }}>
            总榜排名
          </span>

          <span
            style={{
              fontSize: 26,
              fontWeight: "900",
              fontFamily: styles.fontNum,
              color: "#444",
            }}
          >
            #{main_rank}
          </span>
        </div>
      )}

      {trendData && (
        <div style={{ padding: "0 8px 8px 8px" }}>
          <TrendBar
            trends={trendData}
            count={trendCount}
            boardType={boardType}
          />
        </div>
      )}
    </div>
  );
}
