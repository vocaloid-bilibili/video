 
import { 
  useRef,
  useState,
  useLayoutEffect
} from "react";

export const FitContent = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => {
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

    if (actualWidth > availableWidth && availableWidth > 0) {
      setScale(availableWidth / actualWidth);
    } else {
      setScale(1);
    }

    content.style.transform = `scaleX(${actualWidth > availableWidth ? availableWidth / actualWidth : 1})`;
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
      {/* 占位元素：撑开高度 */}
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

      {/* 实际显示元素：绝对定位 */}
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
};
