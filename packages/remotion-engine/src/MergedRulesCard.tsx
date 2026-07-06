// packages/remotion-engine/src/MergedRulesCard.tsx

import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { ReactNode } from "react";

import { DotPattern } from "./components/FramedPage";
import { AchievementListPage } from "./rules/AchievementListPage";
import { FormulaPage1, FormulaPage2 } from "./rules/FormulaPages";
import { RankRulePage } from "./rules/RankRulePage";
import { RulePage } from "./rules/rulePage";
import { COVER_RULES_DATA, RULES_DATA } from "./rules/rulesData";
import { getStyles } from "./styles";
import type { BoardType } from "../../shared/src/boardTypes";

interface RulesPageSpec {
  headerTitle: string;
  component: ReactNode;
  durationSec: number;
}

function PageWrapper({
  page,
  duration,
  boardType,
}: {
  page: RulesPageSpec;
  duration: number;
  boardType: BoardType;
}) {
  const frame = useCurrentFrame();
  const styles = getStyles(boardType);
  const fadeFrames = 15;

  const opacity = interpolate(
    frame,
    [0, fadeFrames, duration - fadeFrames, duration],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#fff",
        opacity,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          height: 100,
          backgroundColor: styles.colors.headerBg,
          display: "flex",
          alignItems: "center",
          padding: "0 40px",
          borderBottom: styles.border,
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            color: styles.colors.headerText,
            fontSize: 48,
            margin: 0,
            fontFamily: styles.fontMain,
            letterSpacing: 2,
          }}
        >
          {page.headerTitle}
        </h1>
      </div>

      <div style={{ flex: 1, position: "relative" }}>{page.component}</div>
    </AbsoluteFill>
  );
}

function getRulesPages(boardType: BoardType): RulesPageSpec[] {
  const rulesData = boardType === "coverWeekly" ? COVER_RULES_DATA : RULES_DATA;
  const playRateCoef = boardType === "weekly" ? 10 : 15;
  const subRankMax = boardType === "monthly" ? 200 : 100;
  const showAchievements = boardType === "weekly";
  const newSongPeriod = boardType === "weekly" ? "两周以内" : "当月";
  const isSpecial = boardType === "special";
  const showNew = boardType !== "coverWeekly";

  const pages: RulesPageSpec[] = rulesData.map((data, index) => ({
    headerTitle: "收录规则",
    component: (
      <RulePage
        data={data}
        pageIndex={index}
        total={rulesData.length}
        boardType={boardType}
      />
    ),
    durationSec: 5,
  }));

  pages.push(
    {
      headerTitle: "计算公式",
      component: <FormulaPage1 boardType={boardType} />,
      durationSec: 5,
    },
    {
      headerTitle: "计算公式",
      component: (
        <FormulaPage2
          playRateCoef={playRateCoef}
          isSpecial={isSpecial}
          boardType={boardType}
        />
      ),
      durationSec: 5,
    },
  );

  if (showAchievements) {
    pages.push({
      headerTitle: "成就标准",
      component: <AchievementListPage boardType={boardType} />,
      durationSec: 5,
    });
  }

  pages.push({
    headerTitle: "榜单构成",
    component: (
      <RankRulePage
        subRankMax={subRankMax}
        newSongPeriod={newSongPeriod}
        showNew={showNew}
        boardType={boardType}
      />
    ),
    durationSec: 5,
  });

  return pages;
}

export function MergedRulesCard({
  boardType = "coverWeekly",
}: {
  boardType?: BoardType;
}) {
  const styles = getStyles(boardType);
  const pages = getRulesPages(boardType);

  const { fps, height } = useVideoConfig();
  const frame = useCurrentFrame();

  const totalDuration =
    pages.reduce((total, page) => total + page.durationSec, 0) * fps;
  const transitionDuration = 30;

  const entranceY = spring({
    frame,
    fps,
    from: height,
    to: 0,
    config: {
      damping: 14,
      mass: 0.8,
    },
  });

  const exitStart = totalDuration - transitionDuration;
  const exitProgress = interpolate(frame, [exitStart, totalDuration], [0, 1], {
    extrapolateLeft: "clamp",
  });

  const exitY = interpolate(exitProgress, [0, 1], [0, height], {
    easing: Easing.in(Easing.exp),
  });

  const translateY = frame < exitStart ? entranceY : exitY;

  let frameOffset = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: styles.colors.bg }}>
      <DotPattern boardType={boardType} />

      <div
        style={{
          width: 1700,
          height: 940,
          backgroundColor: "#fff",
          border: styles.border,
          borderRadius: 24,
          boxShadow: styles.shadow,
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) translateY(${translateY}px)`,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          zIndex: 1,
        }}
      >
        <div style={{ flex: 1, position: "relative" }}>
          {pages.map((page) => {
            const durationFrames = page.durationSec * fps;
            const from = frameOffset;
            frameOffset += durationFrames;

            return (
              <Sequence
                key={`${page.headerTitle}-${from}`}
                from={from}
                durationInFrames={durationFrames}
              >
                <PageWrapper
                  page={page}
                  duration={durationFrames}
                  boardType={boardType}
                />
              </Sequence>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}
