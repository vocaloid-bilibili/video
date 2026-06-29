// packages/remotion-engine/src/components/HonorBadge.tsx

import { getStyles } from "../styles";
import type { BoardType } from "../../../shared/src/boardTypes";

export type HonorText = "Emerging Hit!" | "Mega Hit!!!" | "门番" | "门番候补";

export function HonorBadge({
  text,
  boardType = "weekly",
}: {
  text: string;
  boardType?: BoardType;
}) {
  const styles = getStyles(boardType);
  const honorColors = styles.colors.honor;

  const preset =
    honorColors[text as keyof typeof honorColors] || honorColors.default;

  return (
    <div
      style={{
        display: "inline-block",
        backgroundColor: preset.bg,
        border: `3px solid ${preset.border}`,
        borderRadius: 10,
        padding: "6px 18px",
        fontSize: 26,
        fontWeight: "900",
        color: preset.text,
        boxShadow: "3px 3px 0 rgba(0,0,0,0.1)",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
}
