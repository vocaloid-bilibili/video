// packages/remotion-engine/src/rules/AchievementListPage.tsx

import { getStyles } from "../styles";
import type { BoardType } from "../../../shared/src/boardTypes";

interface AchievementRule {
  title: string;
  desc: string;
  colorKey: "EmergingHitColor" | "MegaHitColor" | "SubGateColor" | "GateColor";
}

const ACHIEVEMENT_RULES: AchievementRule[] = [
  {
    title: "Emerging Hit!",
    colorKey: "EmergingHitColor",
    desc: "最近连续三期排名前五，即可永久获得Emerging Hit!。",
  },
  {
    title: "Mega Hit!!!",
    colorKey: "MegaHitColor",
    desc: "最近连续五期排名前三，即可永久获得Mega Hit!!!。",
  },
  {
    title: "门番候补",
    colorKey: "SubGateColor",
    desc: "最近15期内有10期在榜，即可永久获得门番候补。",
  },
  {
    title: "门番",
    colorKey: "GateColor",
    desc: "最近30期内有20期在榜，即可永久获得门番。",
  },
];

export function AchievementListPage({
  boardType = "weekly",
}: {
  boardType?: BoardType;
}) {
  const styles = getStyles(boardType);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        padding: "20px 40px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      {ACHIEVEMENT_RULES.map((rule) => (
        <div key={rule.title} style={{ marginBottom: 32 }}>
          <div
            style={{
              fontSize: 55,
              fontWeight: 900,
              color: styles.colors[rule.colorKey],
              fontFamily: styles.fontMain,
              marginBottom: 8,
              textShadow: "2px 2px 0px rgba(0,0,0,0.1)",
            }}
          >
            {rule.title}
          </div>

          <div
            style={{
              fontSize: 34,
              color: "#333",
              fontWeight: "bold",
              fontFamily: styles.fontMain,
              lineHeight: 1.3,
            }}
          >
            {rule.desc}
          </div>
        </div>
      ))}
    </div>
  );
}
