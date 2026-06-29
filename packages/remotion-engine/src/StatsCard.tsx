// packages/remotion-engine/src/StatsCard.tsx

import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { ComponentType, CSSProperties } from "react";

import {
  CoinIcon,
  DanmakuIcon,
  LikeIcon,
  PlayIcon,
  ReplyIcon,
  ShareIcon,
  StarIcon,
} from "./Icons";
import { FramedPage } from "./components/FramedPage";
import { getStyles } from "./styles";
import { formatNumber, safeParse } from "./utils/safeParse";
import type { BoardType } from "../../shared/src/boardTypes";

interface StatValue {
  value?: number | string;
  diff?: number | string;
}

type StatsMap = Record<string, StatValue | undefined>;

interface PointThreshold {
  key: string;
  label: string;
}

interface MetricCellConfig {
  key: string;
  icon: ComponentType<{ style?: CSSProperties }>;
}

function getStatValue(stat: StatsMap, key: string): number {
  return safeParse(stat[key]?.value);
}

function getStatDiff(stat: StatsMap, key: string): number | string {
  const diff = stat[key]?.diff;

  return diff ?? "-";
}

function getChangeStyle(
  change: number | string,
  boardType: BoardType,
): CSSProperties {
  const styles = getStyles(boardType);
  const numericChange = typeof change === "number" ? change : safeParse(change);

  if (numericChange > 0) {
    return {
      color: styles.colors.redText,
      backgroundColor: styles.colors.redBg,
    };
  }

  if (numericChange < 0) {
    return {
      color: styles.colors.greenText,
      backgroundColor: styles.colors.greenBg,
    };
  }

  return {
    color: "#333",
    backgroundColor: "#e0e0e0",
  };
}

function formatChange(change: number | string): string {
  if (typeof change === "string") return change;

  if (change > 0) return `+${formatNumber(change)}`;
  if (change < 0) return formatNumber(change);

  return "±0";
}

function StatItem({
  label,
  value,
  unit,
  change,
  delay,
  boardType,
}: {
  label: string;
  value: number;
  unit: string;
  change: number | string;
  delay: number;
  boardType: BoardType;
}) {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const styles = getStyles(boardType);

  const entrance = spring({
    frame: frame - delay,
    fps,
    from: 0,
    to: 1,
    config: { damping: 12 },
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 10,
        opacity: entrance,
        transform: `translateY(${(1 - entrance) * 20}px)`,
      }}
    >
      <span
        style={{
          fontSize: 32,
          fontWeight: 900,
          color: "#333",
          fontFamily: styles.fontMain,
        }}
      >
        {label}
      </span>

      <span
        style={{
          fontFamily: styles.fontMono,
          fontSize: 48,
          fontWeight: 900,
          color: "#222",
        }}
      >
        {formatNumber(value)}
      </span>

      <span
        style={{
          fontSize: 32,
          fontWeight: 900,
          color: "#333",
          fontFamily: styles.fontMain,
        }}
      >
        {unit}
      </span>

      <span
        style={{
          fontFamily: styles.fontMono,
          fontSize: 24,
          fontWeight: 900,
          padding: "4px 12px",
          borderRadius: 6,
          marginLeft: 8,
          ...getChangeStyle(change, boardType),
        }}
      >
        {formatChange(change)}
      </span>
    </div>
  );
}

function CutoffItem({
  tag,
  value,
  change,
  percent,
  delay,
  boardType,
}: {
  tag: string;
  value: number;
  change: number | string;
  percent: number;
  delay: number;
  boardType: BoardType;
}) {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const styles = getStyles(boardType);

  const entrance = spring({
    frame: frame - delay,
    fps,
    from: 0,
    to: 1,
    config: { damping: 12 },
  });

  const percentage =
    percent > 0
      ? `(+${percent.toFixed(1)}%)`
      : percent < 0
        ? `(${percent.toFixed(1)}%)`
        : "(0.0%)";

  return (
    <div
      style={{
        flex: 1,
        border: "3px solid #222",
        borderRadius: 14,
        padding: "8px 12px",
        boxShadow: "4px 4px 0 rgba(0,0,0,0.1)",
        display: "flex",
        alignItems: "center",
        gap: 5,
        flexWrap: "wrap",
        opacity: entrance,
        transform: `scale(${entrance})`,
      }}
    >
      <span
        style={{
          fontSize: 20,
          fontWeight: 900,
          color: "#fff",
          backgroundColor: "#222",
          padding: "4px 12px",
          borderRadius: 8,
          whiteSpace: "nowrap",
          fontFamily: styles.fontMain,
        }}
      >
        {tag}
      </span>

      <span
        style={{
          fontFamily: styles.fontMono,
          fontSize: 36,
          fontWeight: 900,
          color: "#222",
        }}
      >
        {formatNumber(value)}
      </span>

      <span
        style={{
          fontFamily: styles.fontMono,
          fontSize: 18,
          fontWeight: 900,
          padding: "4px 6px",
          borderRadius: 6,
          whiteSpace: "nowrap",
          ...getChangeStyle(change, boardType),
        }}
      >
        {formatChange(change)} {percentage}
      </span>
    </div>
  );
}

function MetricCell({
  icon: Icon,
  value,
  diff,
  delay,
  boardType,
}: {
  icon: ComponentType<{ style?: CSSProperties }>;
  value: number;
  diff: number | string;
  delay: number;
  boardType: BoardType;
}) {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const styles = getStyles(boardType);

  const entrance = spring({
    frame: frame - delay,
    fps,
    from: 0,
    to: 1,
    config: { damping: 12 },
  });

  const numericDiff = typeof diff === "number" ? diff : safeParse(diff);
  const previousValue = value - numericDiff;
  const rate =
    previousValue !== 0 && typeof diff === "number"
      ? (numericDiff / previousValue) * 100
      : 0;

  const rateText =
    rate > 0
      ? `(+${rate.toFixed(1)}%)`
      : rate < 0
        ? `(${rate.toFixed(1)}%)`
        : "(0.0%)";

  return (
    <div
      style={{
        backgroundColor: "#fafafa",
        border: "2px solid #ddd",
        borderRadius: 10,
        padding: "4px 8px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        opacity: entrance,
        transform: `translateY(${(1 - entrance) * 20}px)`,
      }}
    >
      <Icon style={{ width: 64, height: 64, color: "#222" }} />

      <div
        style={{
          fontFamily: styles.fontMono,
          fontSize: 32,
          fontWeight: 900,
          color: "#222",
        }}
      >
        {formatNumber(value)}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <span
          style={{
            fontFamily: styles.fontMono,
            fontSize: 18,
            fontWeight: 900,
            padding: "2px 6px",
            borderRadius: 4,
            ...getChangeStyle(diff, boardType),
          }}
        >
          {formatChange(diff)}
        </span>

        {typeof diff === "number" && (
          <span
            style={{
              fontFamily: styles.fontMono,
              fontSize: 18,
              fontWeight: 900,
              padding: "2px 6px",
              borderRadius: 4,
              ...getChangeStyle(diff, boardType),
            }}
          >
            {rateText}
          </span>
        )}
      </div>
    </div>
  );
}

export function StatsCard({
  stat,
  comment = "请输入文本",
  topN = 100,
  pointThresholds = [
    { key: "count_over_500k", label: "50万分以上" },
    { key: "count_over_100k", label: "10万分以上" },
    { key: "count_over_50k", label: "5万分以上" },
  ],
  boardType = "weekly",
  newSongPeriod = "2周内",
}: {
  stat: StatsMap;
  comment?: string;
  topN?: number;
  pointThresholds?: PointThreshold[];
  newSongPeriod?: string;
  boardType?: BoardType;
}) {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const styles = getStyles(boardType);

  const rowEntrance = spring({
    frame: frame - 43,
    fps,
    from: 0,
    to: 1,
    config: { damping: 12 },
  });

  const commentEntrance = spring({
    frame: frame - 68,
    fps,
    from: 0,
    to: 1,
    config: { damping: 12 },
  });

  const getPercent = (key: string): number => {
    const value = getStatValue(stat, key);
    const diff = stat[key]?.diff;

    if (typeof diff !== "number") return 0;

    const previousValue = value - diff;

    return previousValue === 0 ? 0 : (diff / previousValue) * 100;
  };

  const metricCells: MetricCellConfig[] = [
    { key: "total_view", icon: PlayIcon },
    { key: "total_favorite", icon: StarIcon },
    { key: "total_coin", icon: CoinIcon },
    { key: "total_like", icon: LikeIcon },
    { key: "total_danmaku", icon: DanmakuIcon },
    { key: "total_reply", icon: ReplyIcon },
    { key: "total_share", icon: ShareIcon },
  ];

  return (
    <FramedPage
      title={
        <h1
          style={{
            color: styles.colors.headerText,
            fontSize: 40,
            margin: 0,
            fontWeight: 900,
          }}
        >
          本期榜单统计数据
        </h1>
      }
      boardType={boardType}
      contentStyle={{
        padding: "25px 60px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <div style={{ display: "flex", gap: 50, flexWrap: "wrap" }}>
        {pointThresholds.map((threshold, index) => (
          <StatItem
            key={threshold.key}
            label={threshold.label}
            value={getStatValue(stat, threshold.key)}
            unit="首"
            change={getStatDiff(stat, threshold.key)}
            delay={5 + index * 5}
            boardType={boardType}
          />
        ))}
      </div>

      <div style={{ display: "flex", gap: 50, flexWrap: "wrap" }}>
        <StatItem
          label={`主榜${newSongPeriod}新曲`}
          value={getStatValue(stat, "count_new_main")}
          unit="首"
          change={getStatDiff(stat, "count_new_main")}
          delay={20}
          boardType={boardType}
        />

        <StatItem
          label={`全榜${newSongPeriod}新曲`}
          value={getStatValue(stat, "count_new_total")}
          unit="首"
          change={getStatDiff(stat, "count_new_total")}
          delay={25}
          boardType={boardType}
        />
      </div>

      <div style={{ display: "flex", gap: 25 }}>
        <CutoffItem
          tag="主榜起分"
          value={getStatValue(stat, "cutoff_main")}
          change={getStatDiff(stat, "cutoff_main")}
          percent={getPercent("cutoff_main")}
          delay={30}
          boardType={boardType}
        />

        <CutoffItem
          tag="副榜起分"
          value={getStatValue(stat, "cutoff_sub")}
          change={getStatDiff(stat, "cutoff_sub")}
          percent={getPercent("cutoff_sub")}
          delay={35}
          boardType={boardType}
        />

        <CutoffItem
          tag="新曲榜起分"
          value={getStatValue(stat, "cutoff_new")}
          change={getStatDiff(stat, "cutoff_new")}
          percent={getPercent("cutoff_new")}
          delay={40}
          boardType={boardType}
        />
      </div>

      <div
        style={{
          border: "3px solid #222",
          borderRadius: 16,
          padding: "8px 12px",
          boxShadow: "4px 4px 0 rgba(0,0,0,0.1)",
          opacity: rowEntrance,
          transform: `translateY(${(1 - rowEntrance) * 30}px)`,
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 900,
            color: "#fff",
            backgroundColor: "#222",
            padding: "4px 12px",
            borderRadius: 8,
            display: "inline-block",
            marginBottom: 10,
            fontFamily: styles.fontMain,
          }}
        >
          单项排名前{topN}总数据
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 10,
          }}
        >
          {metricCells.map(({ key, icon }, index) => (
            <MetricCell
              key={key}
              icon={icon}
              value={getStatValue(stat, key)}
              diff={getStatDiff(stat, key)}
              delay={45 + index * 3}
              boardType={boardType}
            />
          ))}
        </div>
      </div>

      <hr
        style={{
          border: "none",
          borderTop: "2px dashed #ccc",
          margin: "8px 0",
          opacity: commentEntrance,
        }}
      />

      <div
        style={{
          border: "3px solid #222",
          borderRadius: 16,
          backgroundColor: "#fafafa",
          padding: "25px 30px",
          boxShadow: "4px 4px 0 rgba(0,0,0,0.1)",
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          opacity: commentEntrance,
          transform: `translateY(${(1 - commentEntrance) * 30}px)`,
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#333",
            lineHeight: 1.8,
            fontFamily: styles.fontMain,
          }}
        >
          {comment}
        </div>
      </div>
    </FramedPage>
  );
}
