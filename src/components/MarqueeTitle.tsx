// 组件：自适应跑马灯标题
import { useRef, useState, useLayoutEffect } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion"

export const MarqueeTitle = ({
  text,
  style,
  speed = 1,            // 滚动速度倍率
}: {
  text: string;
  style?: React.CSSProperties;
  waitFrames?: number;
  endWaitFrames?: number;
  speed?: number;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  const [overflow, setOverflow] = useState(false);
  const [distance, setDistance] = useState(0);

  const { durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  // ⭐ 只在 text 变化时测量一次
  useLayoutEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;

    const availableWidth = container.clientWidth;
    const actualWidth = textEl.scrollWidth;

    if (actualWidth > availableWidth) {
      setOverflow(true);
      setDistance(actualWidth - availableWidth);
    } else {
      setOverflow(false);
      setDistance(0);
    }
  }, [text]);

  // ⭐ 计算滚动位移
  let translateX = 0;

  if (overflow) {
    const moveStart = durationInFrames / 3;
    const moveEnd = durationInFrames * 2 / 3;

    translateX = -interpolate(
      frame,
      [moveStart, moveEnd],
      [0, distance],
      {extrapolateLeft: "clamp", extrapolateRight: "clamp"}
    );
  }

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
          transform: `translateX(${translateX}px)`,
        }}
      >
        {text}
      </span>
    </div>
  );
};