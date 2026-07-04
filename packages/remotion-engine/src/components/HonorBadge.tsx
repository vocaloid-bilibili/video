// packages/remotion-engine/src/components/HonorBadge.tsx

import { getStyles } from "../styles";
import type { BoardType } from "../../../shared/src/boardTypes";

export type HonorText = "Emerging Hit!" | "Mega Hit!!!" | "门番" | "门番候补";

export function HonorBadge({
  text,
  boardType = "weekly",
  size = "normal",
}: {
  text: string;
  boardType?: BoardType;
  size?: "normal" | "small";
}) {
  const styles = getStyles(boardType);
  const honorColors = styles.colors.honor;
  const displayText = text.trim();

  const preset =
    honorColors[displayText as keyof typeof honorColors] || honorColors.default;

  return (
    <div
      style={{
        display: "inline-block",
        backgroundColor: preset.bg,
        border: `3px solid ${preset.border}`,
        borderRadius: size === "small" ? 8 : 10,
        padding: size === "small" ? "4px 12px" : "6px 18px",
        fontSize: size === "small" ? 18 : 26,
        fontWeight: 900,
        fontFamily: styles.fontMain,
        color: preset.text,
        boxShadow: "3px 3px 0 rgba(0,0,0,0.1)",
        whiteSpace: "nowrap",
        lineHeight: 1,
      }}
    >
      {displayText}
    </div>
  );
}
