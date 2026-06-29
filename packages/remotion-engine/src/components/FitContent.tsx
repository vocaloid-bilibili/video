// packages/remotion-engine/src/components/FitContent.tsx

import { useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

export function FitContent({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;

    if (!container || !content) return;

    content.style.transform = "scaleX(1)";

    const availableWidth = container.clientWidth;
    const actualWidth = content.scrollWidth;
    const nextScale =
      actualWidth > availableWidth && availableWidth > 0
        ? availableWidth / actualWidth
        : 1;

    setScale(nextScale);
  }, [children]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        overflow: "hidden",
        position: "relative",
        ...style,
      }}
    >
      <div
        style={{
          visibility: "hidden",
          whiteSpace: "nowrap",
          display: "inline-flex",
          alignItems: "baseline",
        }}
      >
        {children}
      </div>

      <div
        ref={contentRef}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          display: "inline-flex",
          alignItems: "baseline",
          whiteSpace: "nowrap",
          transformOrigin: "left center",
          transform: `scaleX(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
