// packages/remotion-engine/src/rules/RankRulePage.tsx

import { getStyles } from "../styles";
import type { BoardType } from "../../../shared/src/boardTypes";

function RankRangeBox({
  title,
  sub,
  range,
  boardType,
}: {
  title: string;
  sub: string;
  range: string;
  boardType: BoardType;
}) {
  const styles = getStyles(boardType);

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: "#fff",
        border: styles.border,
        borderRadius: 16,
        boxShadow: "6px 6px 0 rgba(0,0,0,0.15)",
        padding: "20px 30px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontSize: 48,
          fontWeight: 900,
          marginBottom: 8,
          fontFamily: styles.fontMain,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 30,
          color: "#666",
          marginBottom: 10,
          fontFamily: styles.fontMain,
        }}
      >
        {sub}
      </div>

      <div
        style={{
          fontSize: 100,
          fontWeight: 900,
          fontFamily: styles.fontNum,
          lineHeight: 1,
          color: "#222",
        }}
      >
        {range}
        <span style={{ fontSize: 40, marginLeft: 8 }}>位</span>
      </div>
    </div>
  );
}

export function RankRulePage({
  subRankMax,
  newSongPeriod,
  showNew,
  boardType = "weekly",
}: {
  subRankMax: number;
  newSongPeriod: string;
  showNew: boolean;
  boardType?: BoardType;
}) {
  const styles = getStyles(boardType);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        padding: "40px",
        display: "flex",
        flexDirection: "column",
        gap: 40,
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", gap: 50, width: "100%" }}>
        <RankRangeBox
          title="主榜单"
          sub="总得点排名作品"
          range="1-20"
          boardType={boardType}
        />

        <RankRangeBox
          title="副榜单"
          sub="简易列表作品"
          range={`21-${subRankMax}`}
          boardType={boardType}
        />
      </div>

      {showNew && (
        <div
          style={{
            backgroundColor: "#fff",
            border: styles.border,
            borderRadius: 16,
            boxShadow: "6px 6px 0 rgba(0,0,0,0.15)",
            padding: 40,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 900,
              fontFamily: styles.fontMain,
            }}
          >
            新曲榜
          </div>

          <div
            style={{
              fontSize: 34,
              lineHeight: 1.5,
              color: "#333",
              fontWeight: 500,
              fontFamily: styles.fontMain,
            }}
          >
            单独排名未入主榜的
            <span
              style={{
                fontWeight: "bold",
                color: styles.colors.accentRed,
              }}
            >
              {" "}
              {newSongPeriod}投稿{" "}
            </span>
            且没有进入过主榜的新曲。
          </div>
        </div>
      )}
    </div>
  );
}
