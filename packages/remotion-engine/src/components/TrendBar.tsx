// packages/remotion-engine/src/components/TrendBar.tsx

import { getStyles } from "../styles";
import type { BoardType } from "../../../shared/src/boardTypes";

export function TrendBar({
  trends,
  count = 7,
  boardType = "weekly",
}: {
  trends?: Record<string, unknown>;
  count?: number;
  boardType?: BoardType;
}) {
  if (!trends) return null;

  const styles = getStyles(boardType);

  const trendColors = [
    styles.colors.blue,
    styles.colors.orange,
    styles.colors.cyan,
    styles.colors.pink,
    styles.colors.purple,
    styles.colors.yellow,
    styles.colors.green,
  ];

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
              backgroundColor: trendColors[idx % trendColors.length],
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
                fontFamily: styles.fontNum,
                color: "#333",
                lineHeight: 1,
              }}
            >
              {String(displayValue)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
