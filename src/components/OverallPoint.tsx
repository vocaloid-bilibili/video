import { STYLES } from "../styles";
import { FitContent } from "./FitContent";
import { safeParse } from "../utils/safeParse";


export const OverallPoint = ({
  isNewSong = false,
  point_before = 100000,
  score = 100000,
  fixB = 1.0,
  fixC = 1.0

}: {
  isNewSong: boolean,
  point_before: number | "-",
  score: number,
  fixB: number,
  fixC: number
}) => {
  const scoreStr = new Intl.NumberFormat().format(safeParse(score));

  return (
              <div
            style={{
              height: 110,
              width: "100%",
              backgroundColor: "#222",
              border: "2px solid #000",
              borderRadius: 12,
              padding: "12px 20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 8,
                backgroundColor: STYLES.colors.blue,
              }}
            />

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  color: "#aaa",
                  fontSize: 20,
                  fontWeight: "bold",
                  whiteSpace: "nowrap",
                }}
              >
                综合得分
              </span>

              {isNewSong ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(255,255,255,0.15)",
                    padding: "2px 10px",
                    borderRadius: 6,
                    color: "#ef9a9a",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 18,
                      fontFamily: STYLES.fontNum,
                      fontWeight: "900",
                      lineHeight: 1.2,
                    }}
                  >
                    NEW
                  </span>
                </div>
              ) : point_before && point_before !== "-" ? (
                (() => {
                  const current = safeParse(score);
                  const before = safeParse(point_before);
                  const diff = current - before;
                  const rate =
                    before > 0 ? ((diff / before) * 100).toFixed(1) : "0";
                  const isUp = diff >= 0;
                  return (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(255,255,255,0.15)",
                        padding: "2px 10px",
                        borderRadius: 6,
                        color: isUp ? "#ef9a9a" : "#a5d6a7",
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 18,
                          fontFamily: STYLES.fontNum,
                          fontWeight: "900",
                          lineHeight: 1.2,
                        }}
                      >
                        {isUp ? "+" : ""}
                        {rate}%
                      </span>
                    </div>
                  );
                })()
              ) : null}

              {fixB && fixC && (
                <span
                  style={{
                    fontSize: 18,
                    color: "#555",
                    fontFamily: STYLES.fontNum,
                    fontWeight: "bold",
                    marginLeft: "auto",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  ( ×{(fixB * fixC).toFixed(4)}= )
                </span>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "flex-end",
                overflow: "hidden",
              }}
            >
              {!isNewSong &&
                point_before &&
                point_before !== "-" && (
                  <div
                    style={{
                      flex: "0 1 auto",
                      minWidth: 1,
                      maxWidth: "80%",
                      overflow: "hidden",
                      marginRight: 8,
                    }}
                  >
                    <FitContent>
                      <span
                        style={{
                          fontSize: 24,
                          fontFamily: STYLES.fontNum,
                          color: "#666",
                          fontWeight: "bold",
                          letterSpacing: "-1px",
                        }}
                      >
                        {new Intl.NumberFormat().format(
                          safeParse(point_before),
                        )}
                      </span>
                      <span
                        style={{
                          fontSize: 20,
                          color: "#AAA",
                          fontWeight: "bold",
                          marginLeft: 6,
                        }}
                      >
                        →
                      </span>
                    </FitContent>
                  </div>
                )}

              <span
                style={{
                  fontSize: 42,
                  fontWeight: "900",
                  fontFamily: STYLES.fontNum,
                  color: "#fff",
                  letterSpacing: "-1px",
                  lineHeight: 0.9,
                  textShadow: "0 4px 10px rgba(0,0,0,0.5)",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                {scoreStr}
              </span>
            </div>
          </div>
  )
}