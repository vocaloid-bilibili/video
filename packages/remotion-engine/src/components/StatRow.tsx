// ------------------------------------------------------------------
// 组件：数据条
// ------------------------------------------------------------------
import { STYLES } from "../styles"

// ------------------------------------------------------------------
// 辅助函数
// ------------------------------------------------------------------
const formatFix = (value: any, decimals: number = 2): string => {
  if (value === undefined || value === null || value === "") return "";
  const num = parseFloat(value);
  if (isNaN(num)) return String(value);
  return num.toFixed(decimals);
};


// 辅助组件：显示修正系数
const FixLabel = ({ value }: { value: any }) => {
  if (value === undefined || value === null || value === "") return null;
  return (
    <span
      style={{ fontSize: 20, color: "#666", marginLeft: 8, fontWeight: "bold" }}
    >
      (×{formatFix(value, 2)})
    </span>
  );
};


export const StatRow = ({
  icon,
  count,
  rank,
  rate,
  bgColor,
  bgChar,
  isBestRank,
  fixValue,
}: any) => (
  <div
    style={{
      flex: 1,
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: bgColor,
      border: "2px solid #000",
      borderRadius: 8,
      padding: "0 12px",
      marginBottom: 6,
      boxShadow: "3px 3px 0px rgba(0,0,0,0.15)",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        right: 60,
        bottom: 0,
        fontSize: 80,
        fontWeight: "900",
        fontFamily: STYLES.fontMain,
        color: "rgba(255,255,255,0.7)",
        pointerEvents: "none",
        zIndex: 0,
        lineHeight: 1,
      }}
    >
      {bgChar}
    </div>

    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: "100%",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div style={{ width: 32, display: "flex", justifyContent: "center" }}>
        {icon}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "baseline",
          marginLeft: 12,
        }}
      >
        <span
          style={{
            fontSize: 38,
            fontWeight: "900",
            fontFamily: STYLES.fontNum,
            letterSpacing: "-1.5px",
            lineHeight: 1,
            color: "#222",
            textShadow: "2px 2px 0px rgba(255,255,255,0.4)",
          }}
        >
          {new Intl.NumberFormat().format(count)}
        </span>
        {fixValue && <FixLabel value={fixValue} />}
      </div>
    </div>

    <div style={{ textAlign: "right", position: "relative", zIndex: 1 }}>
      <div style={{ lineHeight: 1 }}>
        <span
          style={{
            color: isBestRank ? STYLES.colors.accentRed : "#333",
            fontSize: 34,
            fontFamily: STYLES.fontNum,
            textShadow: isBestRank
              ? "2px 2px 0px rgba(255,255,255,0.8)"
              : "none",
          }}
        >
          {rank}
        </span>
        <span
          style={{
            fontSize: 18,
            fontWeight: "bold",
            marginLeft: 2,
            color: "#555",
          }}
        >
          位
        </span>
      </div>
      <div
        style={{
          fontSize: 19,
          color: "#555",
          fontWeight: "bold",
          marginTop: 2,
        }}
      >
        {rate && rate !== "-" ? `×${formatFix(rate, 2)}` : ""}
      </div>
    </div>
  </div>
);
