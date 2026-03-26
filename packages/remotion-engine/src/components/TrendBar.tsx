// ------------------------------------------------------------------
// 组件：趋势条（支持日刊7天/周刊5周）
// ------------------------------------------------------------------
import { STYLES } from "../styles";

// 趋势颜色
const TREND_COLORS = [
  STYLES.colors.blue,
  STYLES.colors.orange,
  STYLES.colors.cyan,
  STYLES.colors.pink,
  STYLES.colors.purple,
  STYLES.colors.yellow,
  STYLES.colors.green,
];

export const TrendBar = ({
  trends,
  count = 7,
}: {
  trends: Record<string, any>;
  count?: number;
}) => {
  if (!trends) return null;

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: 32,
        borderRadius: 6,
        overflow: "hidden",
        border: "2px solid rgba(0,0,0,0.3)",
      }}
    >
      {Array.from({ length: count }, (_, idx) => {
        const day = idx + 1;
        const value = trends[String(day)];
        const displayValue = value === "-" || value === undefined ? "-" : value;

        return (
          <div
            key={day}
            style={{
              flex: 1,
              backgroundColor: TREND_COLORS[idx % TREND_COLORS.length],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRight:
                idx < count - 1 ? "1px solid rgba(0,0,0,0.15)" : "none",
            }}
          >
            <span
              style={{
                fontSize: count > 5 ? 14 : 16,
                fontWeight: 900,
                fontFamily: STYLES.fontNum,
                color: "#333",
                lineHeight: 1,
              }}
            >
              {displayValue}
            </span>
          </div>
        );
      })}
    </div>
  );
};