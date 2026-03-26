import { STYLES } from "../styles"
import { FitTitle } from "./FitTitle"
import { HonorBadge } from "./HonorBadge"
import { FitContent } from "./FitContent"
import { InfoTag } from "./InfoTag"

export const SongInfo = ({
  props,
  infoTranslateY
}: {
  props: any,
  infoTranslateY: number
}) => {
  return (
    <div
      style={{
        flex: 1,
        width: "100%",
        boxSizing: "border-box",
        backgroundColor: "#ffffff",
        border: STYLES.border,
        borderRadius: 24,
        boxShadow: STYLES.shadow,
        padding: "24px 32px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 12,
        transform: `translateY(${infoTranslateY}px)`,
        overflow: "hidden",
      }}
    >
      {/* 标题 */}
      <h1 style={{ margin: 0, width: "100%" }}>
        <FitTitle
          text={props.title}
          style={{
            fontSize: 56,
            lineHeight: 1.2,
            fontFamily: STYLES.fontMain,
            fontWeight: "bold",
            letterSpacing: "-2px",
          }}
        />
      </h1>

      {/* 第一行：作者 | 成就 */}
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
            text={props.producers}
            style={{
              fontSize: 36,
              fontWeight: "900",
              fontFamily: STYLES.fontMain,
            }}
          />
        </div>

        {props.honor && props.honor.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "nowrap",
              alignItems: "center",
              gap: 12,
              flexShrink: 0,
            }}
          >
            {props.honor.map((h: string, i: number) => (
              <HonorBadge key={i} text={h} />
            ))}
          </div>
        )}
      </div>

      {/* 第二行：歌手+引擎 | 标签 */}
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
                fontFamily: STYLES.fontMain,
              }}
            >
              {props.vocalists}
            </span>
            {props.synthesizers && (
              <>
                <span
                  style={{
                    display: "inline-block",
                    width: 16,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 24,
                    color: "#888",
                    fontStyle: "italic",
                    fontFamily: STYLES.fontMain,
                  }}
                >
                  {props.synthesizers}
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
          <InfoTag
            text={props.pubdate?.split(" ")[0] || ""}
            color="#fff9c4"
          />
          <InfoTag text={props.songType} color="#e1bee7" />
          <InfoTag
            text={props.copyrightLabel}
            color={STYLES.colors.orange}
          />
          <InfoTag text={props.duration} color="#b2dfdb" />
        </div>
      </div>
    </div>
  )
}