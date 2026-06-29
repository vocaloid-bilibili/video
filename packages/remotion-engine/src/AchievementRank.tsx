// packages/remotion-engine/src/AchievementRank.tsx

import { AbsoluteFill } from "remotion";

import { FitTitle } from "./components/FitTitle";
import { ListImage, ListRankPage } from "./components/ListRankPage";
import { getStyles } from "./styles";
import type { BoardType } from "../../shared/src/boardTypes";

interface AchievementRankItem {
  title?: string;
  producer?: string;
  pubdate?: string;
  thumbnail?: string;
  honor?: string | string[];
}

const HONOR_BADGE_WIDTH: Record<string, number> = {
  "Emerging Hit!": 300,
  "Mega Hit!!!": 250,
  门番候补: 200,
  门番: 130,
};

function getPrimaryHonor(honor: AchievementRankItem["honor"]): string {
  if (Array.isArray(honor)) return honor[0] || "";
  return honor || "";
}

function AchievementBadge({
  honor,
  boardType,
}: {
  honor: string;
  boardType: BoardType;
}) {
  const styles = getStyles(boardType);
  const preset =
    styles.colors.honor[honor as keyof typeof styles.colors.honor] ||
    styles.colors.honor.default;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "8px 20px",
        borderRadius: 12,
        border: `4px solid ${preset.border}`,
        backgroundColor: preset.bg,
        boxShadow: `4px 4px 0 ${preset.border}`,
      }}
    >
      <span
        style={{
          fontFamily: styles.fontMain,
          fontSize: 32,
          fontWeight: 900,
          letterSpacing: 1,
          color: preset.text,
        }}
      >
        {honor}
      </span>
    </div>
  );
}

function AchievementItem({
  item,
  boardType,
}: {
  item: AchievementRankItem;
  boardType: BoardType;
}) {
  const styles = getStyles(boardType);
  const honor = getPrimaryHonor(item.honor);
  const badgeWidth = honor ? HONOR_BADGE_WIDTH[honor] || 200 : 0;
  const pubDate = item.pubdate ? item.pubdate.split(" ")[0] : "";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        border: "3px solid #222",
        borderRadius: 14,
        backgroundColor: styles.colors.cardBg,
        boxShadow: "8px 8px 0 #000",
        height: "100%",
        overflow: "hidden",
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          height: "100%",
          aspectRatio: "16 / 9",
          flexShrink: 0,
          backgroundColor: "#ddd",
          borderRight: "3px solid #222",
          overflow: "hidden",
        }}
      >
        <ListImage src={item.thumbnail || ""} />
      </div>

      <div
        style={{
          flex: 1,
          width: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 6,
          padding: "12px 20px",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <div style={{ width: "100%", overflow: "hidden" }}>
          <FitTitle
            text={item.title || ""}
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: "#222",
              fontFamily: styles.fontMain,
              whiteSpace: "nowrap",
            }}
          />
        </div>

        <div
          style={{
            width: badgeWidth > 0 ? `calc(100% - ${badgeWidth}px)` : "100%",
            overflow: "hidden",
            paddingLeft: 8,
          }}
        >
          <FitTitle
            text={item.producer || ""}
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#333",
              fontFamily: styles.fontMain,
              whiteSpace: "nowrap",
            }}
          />
        </div>

        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#555",
            fontFamily: styles.fontMain,
            paddingLeft: 8,
          }}
        >
          {pubDate}
        </div>
      </div>

      {honor && (
        <div
          style={{
            position: "absolute",
            right: 16,
            bottom: 10,
          }}
        >
          <AchievementBadge honor={honor} boardType={boardType} />
        </div>
      )}
    </div>
  );
}

export function AchievementRank({
  list = [],
  boardType = "weekly",
}: {
  list: AchievementRankItem[];
  boardType?: BoardType;
}) {
  return (
    <AbsoluteFill>
      <ListRankPage
        title="成就达成"
        items={list}
        boardType={boardType}
        renderItem={(item) => (
          <AchievementItem item={item} boardType={boardType} />
        )}
      />
    </AbsoluteFill>
  );
}
