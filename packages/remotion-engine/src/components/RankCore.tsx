import { STYLES } from "../styles"


export const RankCore = ({
  rank = 1,
  showCount = true,
  count = 10,
}: {
  rank: number,
  showCount: boolean,
  count: number
}) => {
  return (
    <div
      style={{
        flex: 4,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
        border: "3px solid #000",
        borderRadius: 16,
        boxShadow: "4px 4px 0 rgba(0,0,0,0.2)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          backgroundColor: "#000",
          color: "#fff",
          fontSize: 20,
          fontWeight: "bold",
          textAlign: "center",
          padding: "6px 0",
          letterSpacing: 2,
        }}
      >
        本期排名
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontFamily: STYLES.fontNum,
            fontWeight: "900",
            color: STYLES.colors.textMain,
            lineHeight: 1,
            letterSpacing: "-4px",
            textShadow: "4px 4px 0px rgba(255,255,255,1)",
          }}
        >
          {rank}
        </div>

        {showCount && count >= 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "center",
              marginTop: 4,
            }}
          >
            <span
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: "#444",
                fontFamily: STYLES.fontMain,
              }}
            >
              累计
            </span>
            <span
              style={{
                fontSize: 26,
                fontFamily: STYLES.fontNum,
                color: STYLES.colors.accentRed,
                fontWeight: "900",
                lineHeight: 1,
                margin: "0 2px",
                textShadow: "1px 1px 0 rgba(255,255,255,0.5)",
              }}
            >
              {count}
            </span>
            <span
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: "#444",
                fontFamily: STYLES.fontMain,
              }}
            >
              周上榜
            </span>
          </div>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 5,
          fontSize: 40,
          fontWeight: "900",
          color: "rgba(0,0,0,0.05)",
          pointerEvents: "none",
          lineHeight: 1,
          fontFamily: "Arial Black",
        }}
      >
        RANK
      </div>
    </div>
  )
}