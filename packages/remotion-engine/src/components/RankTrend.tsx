// packages/remotion-engine/src/components/RankTrend.tsx

import { getStyles } from "../styles";
import { TrendBar } from "./TrendBar";
import type { BoardType } from "../../../shared/src/boardTypes";

type RankBefore = number | "-";

export function RankTrend({
  isNewSong = false,
  trendCount = 7,
  trendData,
  view_snapshot = null,
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
  view_snapshot?: number | null;
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
          bottom:  boardType === "near1kw" ? 45 : 40,
          right: 5,
          fontSize: boardType === "near1kw" ? 30 : 36,
          fontWeight: "900",
          color: "rgba(0,0,0,0.05)",
          pointerEvents: "none",
          lineHeight: 1,
          fontFamily: "Arial Black",
        }}
      >
        TREND
      </div>
      
      {/* 仅 near1kw 榜单显示分隔线 + 底部播放量 */}
      {boardType === "near1kw" && (
        <>
          {/* ===== 黑色水平分隔线 ===== */}
          <div
            style={{
              position: "absolute",
              top: "45%",
              left: 0,
              width: "100%",
              height: 2,
              backgroundColor: "#000",
              zIndex: 1,
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "absolute",
              bottom: 2,
              left: 0,
              right: 0,
              zIndex: 1,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                fontSize: 26,
                fontWeight: "bold",
                fontFamily: styles.fontMain,
                color: "#999",
                lineHeight: 1,
                textAlign: "left",
                paddingLeft: 8,
              }}
            >
              总播放
            </div>
            <div
              style={{
                fontSize: 38,
                fontWeight: "bold",
                fontFamily: styles.fontMain,
                color: "#444",
                lineHeight: 1,
                textAlign: "center",
                marginTop: 8,
              }}
            >
              {view_snapshot}
            </div>
          </div>
        </>
      )}

      <div
        // 最外层
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          alignItems: boardType === "near1kw" ? "flex-start" : "center",
          justifyContent: "center",
          padding: boardType === "near1kw" ?  0 : "0 8px",
        }}
      >
        {isNewSong ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: boardType === "near1kw" ? "flex-start" : "center",
              paddingTop: boardType === "near1kw" ? 10 : 0, // 新增：顶部留白
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
                justifyContent:  boardType === "near1kw" ? "flex-start" : "center",
                paddingTop: boardType === "near1kw" ? 10 : 0, // 新增：顶部留白
                gap: boardType === "near1kw" ? 8 : 4, // 从 4 改 6，加大间距
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
                  height: 20,
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
                height: boardType === "near1kw" ? "45%" : "50%",
                backgroundColor: "#f0f0f0",
                alignSelf:  boardType === "near1kw" ? "flex-start" : "center", // 从 center 改 flex-start：垂直靠上
              }}
            />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: boardType === "near1kw" ? "flex-start" : "center",
          paddingTop: boardType === "near1kw" ? 10 : 0, // 新增：顶部留白
          gap: boardType === "near1kw" ? 8 : 4, // 从 4 改 6，加大间距
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
            fontSize: boardType === "near1kw" ? 24 : 30,
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
