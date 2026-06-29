// packages/remotion-engine/src/components/FitTitle.tsx

import { useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

export function FitTitle({
  text,
  children,
  style,
}: {
  text?: string;
  children?: React.ReactNode;
  style?: CSSProperties;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(1);

  const content = text ?? children ?? "";

  useLayoutEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;

    if (!container || !textEl) return;

    const availableWidth = container.clientWidth;
    const actualWidth = textEl.scrollWidth;

    setScale(
      actualWidth > availableWidth && availableWidth > 0
        ? availableWidth / actualWidth
        : 1,
    );
  }, [content, style]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        overflow: "hidden",
        display: "block",
        ...style,
      }}
    >
      <span
        ref={textRef}
        style={{
          display: "inline-block",
          whiteSpace: "nowrap",
          transformOrigin: "left center",
          transform: `scaleX(${scale})`,
        }}
      >
        {content}
      </span>
    </div>
  );
}
