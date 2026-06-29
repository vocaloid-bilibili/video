// packages/remotion-engine/src/MillionRank.tsx

import { AbsoluteFill } from "remotion";

import { FitTitle } from "./components/FitTitle";
import { ListImage, ListRankPage } from "./components/ListRankPage";
import { getStyles } from "./styles";
import type { BoardType } from "../../shared/src/boardTypes";

interface MillionRankItem {
  title?: string;
  producer?: string;
  pubdate?: string;
  thumbnail?: string;
  million_crossed?: number | string;
}

function MillionItem({
  item,
  boardType,
}: {
  item: MillionRankItem;
  boardType: BoardType;
}) {
  const styles = getStyles(boardType);
  const pubDate = item.pubdate ? item.pubdate.split(" ")[0] : "";
  const badgeWidth = 280;

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
            width: `calc(100% - ${badgeWidth}px - 20px)`,
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

      <div
        style={{
          position: "absolute",
          right: 16,
          bottom: 10,
          display: "flex",
          alignItems: "baseline",
          justifyContent: "center",
          padding: "8px 20px",
          borderRadius: 12,
          backgroundColor: "#222",
          boxShadow: "3px 3px 0 rgba(0,0,0,0.2)",
        }}
      >
        <span
          style={{
            fontFamily: styles.fontNum,
            fontSize: 48,
            fontWeight: 900,
            color: "#fff",
            lineHeight: 1,
          }}
        >
          {item.million_crossed ?? ""}00
        </span>
        <span
          style={{
            fontFamily: styles.fontMain,
            fontSize: 36,
            fontWeight: 900,
            color: "#fff",
            marginLeft: 2,
            lineHeight: 1,
          }}
        >
          万达成！
        </span>
      </div>
    </div>
  );
}

export function MillionRank({
  list = [],
  boardType = "weekly",
}: {
  list: MillionRankItem[];
  boardType?: BoardType;
}) {
  return (
    <AbsoluteFill>
      <ListRankPage
        title="百万达成"
        items={list}
        boardType={boardType}
        renderItem={(item) => <MillionItem item={item} boardType={boardType} />}
      />
    </AbsoluteFill>
  );
}
