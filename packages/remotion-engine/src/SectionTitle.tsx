// src/SectionTitle.tsx
import {
  AbsoluteFill,
  useVideoConfig,
  useCurrentFrame,
  spring,
  interpolate,
  Easing,
} from "remotion";
import type { CSSProperties, FC } from "react";
import { STYLES, getStyles } from "./styles";
import type { BoardType } from "../../shared/src/boardTypes";

const DotPattern = () => (
  <AbsoluteFill
    style={{
      backgroundImage: "radial-gradient(#d7ccc8 3px, transparent 3px)" as const,
      backgroundSize: "24px 24px" as const,
      opacity: 0.6,
      zIndex: 0,
    } as CSSProperties}
  />
);

export interface SectionTitleProps {
  title?: string;
  from?: string | number;
  to?: string | number;
  themeColor?: string;
  edName?: string;
  edAuthor?: string;
  showNumber?: boolean;
  titleStyle?: CSSProperties;
  titleContainerStyle?: CSSProperties;
}

export interface SectionTitleProps {
  title?: string;
  from?: string | number;
  to?: string | number;
  themeColor?: string;
  edName?: string;
  edAuthor?: string;
  showNumber?: boolean;
  titleStyle?: CSSProperties;
  titleContainerStyle?: CSSProperties;
  boardType?: BoardType;
}

export const SectionTitle: FC<SectionTitleProps> = ({
  title = "",
  from = 10,
  to = 1,
  themeColor = "#23ade5",
  edName = "",
  edAuthor = "",
  showNumber = true,
  titleStyle = {},
  titleContainerStyle = {},
  boardType = "weekly",
}) => {
  const STYLES = getStyles(boardType);
  const { fps, durationInFrames, height } = useVideoConfig();
  const frame = useCurrentFrame();

  const entranceY = spring({
    frame,
    fps,
    from: height,
    to: 0,
    config: { damping: 14, mass: 0.8 },
  });

  const titleSlide = spring({
    frame: frame - 10,
    fps,
    from: -50,
    to: 0,
    config: { damping: 12 },
  });
  const titleOpacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const numScale = spring({
    frame: frame - 15,
    fps,
    from: 0,
    to: 1,
    config: { damping: 12, stiffness: 80 },
  });

  const edOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const edSlide = spring({
    frame: frame - 20,
    fps,
    from: 30,
    to: 0,
    config: { damping: 12 },
  });

  const exitFrames = 30;
  const exitStart = durationInFrames - exitFrames;
  const exitProgress = interpolate(
    frame,
    [exitStart, durationInFrames],
    [0, 1],
    { extrapolateLeft: "clamp" },
  );
  const exitY = interpolate(exitProgress, [0, 1], [0, height], {
    easing: Easing.in(Easing.exp),
  });

  const translateY = frame < exitStart ? entranceY : exitY;
  const hasEd = edName && edAuthor;

  // 基础标题容器样式（显式约束 CSSProperties，固定字面量类型）
  const baseTitleContainerStyle: CSSProperties = {
    opacity: titleOpacity,
    transform: `translateX(${titleSlide}px)` as string, // 动态样式显式标注 string
    position: showNumber ? "absolute" : "relative",
    top: showNumber ? 60 : "auto",
    left: showNumber ? 60 : "auto",
    display: "flex",
    flexDirection: "column", // 字面量类型，非 string
    alignItems: showNumber ? "flex-start" : "center", // 字面量类型
    width: showNumber ? "auto" : "100%",
  };

  // 基础标题文字样式
  const baseTitleTextStyle: CSSProperties = {
    fontSize: showNumber ? 90 : 110,
    fontWeight: 900, // 用数字代替字符串，避免类型问题
    fontFamily: STYLES.fontMain,
    color: "#222",
    lineHeight: 1,
    marginBottom: 16,
    textAlign: showNumber ? "left" : "center",
  };

  const titleLineStyle: CSSProperties = {
    width: showNumber ? 120 : 440,
    height: 12,
    backgroundColor: themeColor,
    borderRadius: 6,
    marginLeft: showNumber ? 0 : 80,
    marginRight: showNumber ? 0 : "auto",
  };

  // 主容器样式（单独提取，避免内联类型冲突）
  const mainContainerStyle: CSSProperties = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: `translate(-50%, -50%) translateY(${translateY}px)` as string,
    width: 1400,
    height: 800,
    backgroundColor: "#fff",
    border: STYLES.border,
    borderRadius: 32,
    boxShadow: STYLES.shadow,
    overflow: "hidden",
    zIndex: 1,
    display: "flex",
    flexDirection: "column", // 字面量类型
    alignItems: "center",
    justifyContent: "center",
  };

  // 数字区域样式
  const numberAreaStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 60,
    transform: `scale(${numScale})` as string,
  };

  // 数字文本样式
  const numberTextStyle: CSSProperties = {
    fontSize: 320,
    fontFamily: STYLES.fontNum,
    color: "#222",
    lineHeight: 1,
    fontWeight: "bold",
  };

  // 箭头容器样式
  const arrowContainerStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 320,
  };

  // 箭头文本样式
  const arrowTextStyle: CSSProperties = {
    fontSize: 180,
    fontFamily: STYLES.fontMain,
    color: "#222",
    lineHeight: 1,
  };

  // ED 区域样式
  const edAreaStyle: CSSProperties = {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    opacity: edOpacity,
    transform: `translateY(${edSlide}px)` as string,
    display: "flex",
    flexDirection: "column", // 字面量类型
    alignItems: "center",
    gap: 12,
  };

  // ED 文本样式（分层定义）
  const edLabelStyle: CSSProperties = {
    fontSize: 28,
    fontFamily: STYLES.fontMain,
    fontWeight: 600, // 数字代替字符串
    color: "#999",
    letterSpacing: 4,
  };

  const edNameStyle: CSSProperties = {
    fontSize: 48,
    fontFamily: STYLES.fontMain,
    fontWeight: "bold",
    color: "#333",
  };

  const edAuthorStyle: CSSProperties = {
    fontSize: 36,
    fontFamily: STYLES.fontMain,
    fontWeight: 500, // 数字代替字符串
    color: "#666",
  };

  // 装饰圆样式
  const decorCircleStyle: CSSProperties = {
    position: "absolute",
    bottom: -50,
    right: -50,
    width: 200,
    height: 200,
    backgroundColor: themeColor,
    opacity: 0.1,
    borderRadius: "50%",
  };

  return (
    <AbsoluteFill style={{ backgroundColor: STYLES.colors.bg } as CSSProperties}>
      <DotPattern />

      <div style={mainContainerStyle}>
        {title && (
          <div
            style={{
              ...baseTitleContainerStyle,
              ...titleContainerStyle,
            }}
          >
            <div
              style={{
                ...baseTitleTextStyle,
                ...titleStyle,
              }}
            >
              {title}
            </div>
            <div style={titleLineStyle} />
          </div>
        )}

        {showNumber && (
          <div style={numberAreaStyle}>
            <span style={numberTextStyle}>{from}</span>

            <div style={arrowContainerStyle}>
              <span style={arrowTextStyle}>→</span>
            </div>

            <span style={numberTextStyle}>{to}</span>
          </div>
        )}

        {hasEd && (
          <div style={edAreaStyle}>
            <div style={edLabelStyle}>ED</div>
            <div style={edNameStyle}>{edName}</div>
            <div style={edAuthorStyle}>{edAuthor}</div>
          </div>
        )}

        <div style={decorCircleStyle} />
      </div>
    </AbsoluteFill>
  );
};