// packages/remotion-engine/src/components/SongInfo.tsx

import { FitContent } from "./FitContent";
import { FitTitle } from "./FitTitle";
import { HonorBadge } from "./HonorBadge";
import { InfoTag } from "./InfoTag";
import { getStyles } from "../styles";
import type { BoardType } from "../../../shared/src/boardTypes";

export function SongInfo({
  props,
  infoTranslateY,
  boardType = "weekly",
}: {
  props: Record<string, any>;
  infoTranslateY: number;
  boardType?: BoardType;
}) {
  const styles = getStyles(boardType);
  const honors = Array.isArray(props.honor) ? props.honor : [];

  return (
    <div
      style={{
        flex: 1,
        width: "100%",
        boxSizing: "border-box",
        backgroundColor: "#ffffff",
        border: styles.border,
        borderRadius: 24,
        boxShadow: styles.shadow,
        padding: "24px 32px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 12,
        transform: `translateY(${infoTranslateY}px)`,
        overflow: "hidden",
      }}
    >
      <h1 style={{ margin: 0, width: "100%" }}>
        <FitTitle
          text={props.title || ""}
          style={{
            fontSize: 56,
            lineHeight: 1.2,
            fontFamily: styles.fontMain,
            fontWeight: "bold",
            letterSpacing: "-2px",
          }}
        />
      </h1>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <FitTitle
            text={props.producers || props.producer || ""}
            style={{
              fontSize: 36,
              fontWeight: "900",
              fontFamily: styles.fontMain,
            }}
          />
        </div>

        {honors.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "nowrap",
              alignItems: "center",
              gap: 12,
              flexShrink: 0,
            }}
          >
            {honors.map((honor: string, index: number) => (
              <HonorBadge
                key={`${honor}-${index}`}
                text={honor}
                boardType={boardType}
              />
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <FitContent>
            <span
              style={{
                fontSize: 30,
                fontWeight: "bold",
                color: "#444",
                fontFamily: styles.fontMain,
              }}
            >
              {props.vocalists || props.vocalist || ""}
            </span>

            {(props.synthesizers || props.synthesizer) && (
              <>
                <span
                  style={{ display: "inline-block", width: 16, flexShrink: 0 }}
                />
                <span
                  style={{
                    fontSize: 24,
                    color: "#888",
                    fontStyle: "italic",
                    fontFamily: styles.fontMain,
                  }}
                >
                  {props.synthesizers || props.synthesizer}
                </span>
              </>
            )}
          </FitContent>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <InfoTag text={props.pubdate?.split(" ")[0] || ""} color="#fff9c4" />
          <InfoTag text={props.songType || props.type || ""} color="#e1bee7" />
          <InfoTag
            text={props.copyrightLabel || ""}
            color={styles.colors.orange}
          />
          <InfoTag text={props.duration || ""} color="#b2dfdb" />
        </div>
      </div>
    </div>
  );
}
