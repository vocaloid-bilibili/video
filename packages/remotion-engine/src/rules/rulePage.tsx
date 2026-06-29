// packages/remotion-engine/src/rules/RulePage.tsx

import { getStyles } from "../styles";
import type { RulePageData } from "./rulesData";
import type { BoardType } from "../../../shared/src/boardTypes";

export function RulePage({
  data,
  pageIndex,
  total,
  boardType = "weekly",
}: {
  data: RulePageData;
  pageIndex: number;
  total: number;
  boardType?: BoardType;
}) {
  const styles = getStyles(boardType);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "30px 40px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          borderBottom: "4px solid #000",
          paddingBottom: 10,
        }}
      >
        <div
          style={{
            fontSize: 42,
            fontWeight: 900,
            fontFamily: styles.fontMain,
            color: styles.colors.textMain,
          }}
        >
          {data.title}
        </div>

        <div
          style={{
            fontSize: 32,
            fontWeight: "bold",
            color: "#666",
            fontFamily: styles.fontHeader,
          }}
        >
          {pageIndex + 1} / {total}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {data.sections.map((section) => (
          <div
            key={section.head}
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontSize: 34,
                fontWeight: 900,
                color: "#fff",
                backgroundColor: "#000",
                padding: "4px 12px",
                alignSelf: "flex-start",
                marginBottom: 8,
                borderRadius: 4,
              }}
            >
              {section.head}
            </div>

            <ul
              style={{
                margin: 0,
                paddingLeft: 28,
                fontSize: 30,
                fontFamily: styles.fontMain,
                lineHeight: 1.5,
                color: "#333",
                fontWeight: 600,
              }}
            >
              {section.items.map((item) => (
                <li key={item} style={{ marginBottom: 4 }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
