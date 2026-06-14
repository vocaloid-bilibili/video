import React, { useMemo } from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  useVideoConfig,
} from "remotion";
import { STYLES, getStyles } from "./styles";
import type { BoardType } from "../../shared/src/boardTypes";

// 工具函数（保留核心）
const formatFix = (num: number, precision = 2) => {
  return Number.isFinite(num) ? num.toFixed(precision) : "0.00";
};

const safeParse = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

// InfoTag 组件（信息标签，移除动画相关样式）
interface InfoTagProps {
  label: string;
  value: string;
  backgroundColor?: string;
}
const InfoTag: React.FC<InfoTagProps> = ({
  label,
  value,
  backgroundColor = STYLES.colors.bg,
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: `${STYLES.sizes.infoTag.height / 4}px ${STYLES.sizes.infoTag.paddingX}px`,
        backgroundColor,
        borderRadius: STYLES.sizes.infoTag.height / 2,
        border: `1px solid ${STYLES.colors.border}`,
        backdropFilter: "blur(8px)",
      }}
    >
      <span
        style={{
          color: STYLES.colors.textSub,
          fontSize: 14,
          fontFamily: STYLES.fontMain,
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: STYLES.colors.textMain,
          fontSize: 16,
          fontFamily: STYLES.fontMain,
          fontWeight: 500,
        }}
      >
        {value}
      </span>
    </div>
  );
};

// HonorBadge 组件（成就胶囊，移除动画相关样式）
interface HonorBadgeProps {
  title: string;
  type?: "default" | "mega" | "emerging" | "门番";
}
const HonorBadge: React.FC<HonorBadgeProps> = ({
  title,
  type = "default",
}) => {
  const bgColor = STYLES.colors.honor[type as keyof typeof STYLES.colors.honor];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: STYLES.sizes.honorBadge.height,
        padding: `0 ${STYLES.sizes.honorBadge.paddingX}px`,
        backgroundColor: bgColor,
        borderRadius: STYLES.sizes.honorBadge.height / 2,
        boxShadow: `0 4px 12px rgba(0,0,0,0.2)`,
      }}
    >
      <span
        style={{
          color: "#ffffff",
          fontSize: 18,
          fontFamily: STYLES.fonts.sans,
          fontWeight: 600,
          textShadow: "0 1px 2px rgba(0,0,0,0.3)",
        }}
      >
        {title}
      </span>
    </div>
  );
};

// TrendBar 组件（趋势条，移除动画相关样式）
interface TrendBarProps {
  data: number[];
  period?: "day" | "week";
}
const TrendBar: React.FC<TrendBarProps> = ({
  data = [],
  period = "day",
}) => {
  const processedData = useMemo(() => data.map(safeParse), [data]);
  const maxValue = useMemo(() => Math.max(...processedData, 1), [processedData]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        height: STYLES.sizes.trendBar.height,
        padding: `0 ${STYLES.sizes.trendBar.paddingX}px`,
        backgroundColor: STYLES.colors.background,
        borderRadius: 8,
        border: `1px solid ${STYLES.colors.border}`,
        backdropFilter: "blur(8px)",
      }}
    >
      {processedData.map((value, index) => {
        const height = (value / maxValue) * (STYLES.sizes.trendBar.height - 30);
        const barColor = period === "day" ? "#70a1ff" : "#ff6b81";
        return (
          <div
            key={index}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              width: "100%",
              maxWidth: 40,
            }}
          >
            <div
              style={{
                width: "80%",
                height: height,
                backgroundColor: barColor,
                borderRadius: 4,
                // 移除 transition 动画
              }}
            />
            <span
              style={{
                color: STYLES.colors.textMain,
                fontSize: 12,
                fontFamily: STYLES.fontNum,
              }}
            >
              {formatFix(value, 0)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// 核心全屏视频组件（完全移除入场/退场动画）
interface FullScreenVideoCardProps {
  videoSrc: string;
  infoTags: { label: string; value: string }[];
  honorBadge?: { title: string; type?: "default" | "mega" | "emerging" | "门番" };
  trendData: number[];
  trendPeriod?: "day" | "week";
  thumbnail?: string; // 封面图兜底
  boardType?: BoardType;
}

// 修正1：组件接收 props 作为参数（Remotion 标准写法）
export const AchievementCard: React.FC<FullScreenVideoCardProps> = (props) => {
  // 修正2：移除 useRemotionProps，直接使用传入的 props + useVideoConfig（如需视频配置）
  const videoConfig = useVideoConfig(); // 如需视频尺寸/帧率等配置可使用
  console.log("视频配置", videoConfig); // 可选：调试用

  // 兜底值（防止 props 为空）
  const {
    videoSrc = "",
    infoTags = [],
    honorBadge = { title: "成就", type: "default" },
    trendData = [],
    trendPeriod = "day",
    thumbnail = "",
    boardType = "weekly",
  } = props;

  const STYLES = getStyles(boardType);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
        overflow: "hidden",
      }}
    >
      {/* 全屏视频背景（无动画） */}
      <AbsoluteFill>
        {videoSrc ? (
          <OffthreadVideo
            src={videoSrc}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            muted
          />
        ) : (
          <img
            src={thumbnail}
            alt="封面"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </AbsoluteFill>

      {/* 悬浮层：信息标签（移除动画样式） */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          display: "flex",
          flexWrap: "wrap",
          gap: STYLES.sizes.infoTag.margin,
          // 移除 opacity 和 transform 动画属性
        }}
      >
        {infoTags.map((tag, index) => (
          <InfoTag key={index} label={tag.label} value={tag.value} />
        ))}
      </div>

      {/* 悬浮层：成就胶囊（移除动画样式） */}
      {honorBadge && (
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            // 移除 opacity 和 transform 动画属性
          }}
        >
          <HonorBadge title={honorBadge.title} type={honorBadge.type} />
        </div>
      )}

      {/* 悬浮层：趋势条（移除动画样式） */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: `translateX(-50%)`, // 仅保留居中，移除位移动画
          width: "90%",
          // 移除 opacity 动画属性
        }}
      >
        <TrendBar data={trendData} period={trendPeriod} />
      </div>
    </AbsoluteFill>
  );
};

// 兼容原导出名称（可选）
export const achievementCard = AchievementCard;