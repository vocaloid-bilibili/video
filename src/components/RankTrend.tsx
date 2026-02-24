import { TrendBar } from "./TrendBar"
import { STYLES } from "../styles"

export const RankTrend = ({
  isNewSong = false,
  trendCount = 7,
  trendData = [1, 1, 1, 1, 1, 1, 1, 1],
  rankDiffValue = 0,
  rank_before = 1,
  main_rank
}: {
  isNewSong: boolean,
  trendCount: number,
  trendData: number[],
  rankDiffValue: number,
  rank_before: number,
  main_rank?: number | "-"
}) => {

  let isNewPart = false
  if (main_rank) {
    isNewSong = true
    isNewPart = true
  }


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

      {/* 上部：排名变动区域 */}
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
                fontFamily: STYLES.fontNum,
                color: STYLES.colors.accentRed,
                lineHeight: 1,
                textShadow: "3px 3px 0 rgba(0,0,0,0.1)",
              }}
            >
              NEW!!
            </span>
          </div>
        ) : (
          <>
            {/* 左侧：排名变动 */}
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
                        color: STYLES.colors.accentRed,
                        marginRight: 2,
                        fontFamily: STYLES.fontNum,
                      }}
                    >
                      ▲
                    </span>
                    <span
                      style={{
                        fontSize: 30,
                        fontWeight: "900",
                        color: STYLES.colors.accentRed,
                        fontFamily: STYLES.fontNum,
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
                        color: STYLES.colors.accentGreen,
                        marginRight: 2,
                        fontFamily: STYLES.fontNum,
                      }}
                    >
                      ▼
                    </span>
                    <span
                      style={{
                        fontSize: 30,
                        fontWeight: "900",
                        color: STYLES.colors.accentGreen,
                        fontFamily: STYLES.fontNum,
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
                      fontFamily: STYLES.fontNum,
                    }}
                  >
                    ◼ 持平
                  </span>
                )}
              </div>
            </div>

            {/* 分隔线 */}
            <div
              style={{
                width: 2,
                height: "50%",
                backgroundColor: "#f0f0f0",
                alignSelf: "center",
              }}
            />

            {/* 右侧：上周排名 */}
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 36,
                }}
              >
                <span
                  style={{
                    fontSize: 30,
                    fontWeight: "900",
                    fontFamily: STYLES.fontNum,
                    color: "#444",
                    lineHeight: 1,
                  }}
                >
                  #{rank_before}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 中间：可能有总榜排名 */}
      {isNewPart && (
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
          <span
            style={{ fontSize: 18, color: "#999", fontWeight: "bold" }}
          >
            总榜排名
          </span>
          <span
            style={{
              fontSize: 26,
              fontWeight: "900",
              fontFamily: STYLES.fontNum,
              color: "#444",
            }}
          >
            #{main_rank || "-"}
          </span>
        </div>
      )}
      {/* 下部：趋势条 */}
      {trendData && (
        <div style={{ padding: "0 8px 8px 8px" }}>
          <TrendBar trends={trendData} count={trendCount} />
        </div>
      )}
    </div>
  )
}