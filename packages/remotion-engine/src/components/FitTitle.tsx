// 组件：自适应压缩标题
import { useRef, useState, useLayoutEffect } from "react";

export const FitTitle = ({
  text,
  style,
}: {
  text: string;
  style?: React.CSSProperties;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;

    const availableWidth = container.clientWidth;
    const actualWidth = textEl.scrollWidth;

    if (actualWidth > availableWidth && availableWidth > 0) {
      setScale(availableWidth / actualWidth);
    } else {
      setScale(1);
    }
  }, [text, style]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", overflow: "hidden", ...style, display: "block" }}
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
        {text}
      </span>
    </div>
  );
};
