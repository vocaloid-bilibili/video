// packages/remotion-engine/src/components/HonorBadge.tsx

import { getStyles } from "../styles";
import type { BoardType } from "../../../shared/src/boardTypes";

type HonorBadgeSize = "normal" | "small";

const SIZE_STYLE = {
  normal: {
    padding: "6px 18px",
    fontSize: 26,
    borderWidth: 3,
    borderRadius: 10,
  },
  small: {
    padding: "3px 12px",
    fontSize: 17,
    borderWidth: 2,
    borderRadius: 6,
  },
} as const;

export function HonorBadge({
  text,
  boardType = "weekly",
  size = "normal",
}: {
  text: string;
  boardType?: BoardType;
  size?: HonorBadgeSize;
}) {
  const styles = getStyles(boardType);
  const preset =
    styles.colors.honor[text as keyof typeof styles.colors.honor] ||
    styles.colors.honor.default;
  const sizeStyle = SIZE_STYLE[size];

  return (
    <span
      style={{
        display: "inline-block",
        backgroundColor: preset.bg,
        border: `${sizeStyle.borderWidth}px solid ${preset.border}`,
        borderRadius: sizeStyle.borderRadius,
        padding: sizeStyle.padding,
        fontSize: sizeStyle.fontSize,
        fontWeight: 900,
        color: preset.text,
        boxShadow: "2px 2px 0 rgba(0,0,0,0.1)",
        whiteSpace: "nowrap",
        letterSpacing: 0.5,
        lineHeight: 1.2,
        fontFamily: styles.fontNum,
      }}
    >
      {text}
    </span>
  );
}
