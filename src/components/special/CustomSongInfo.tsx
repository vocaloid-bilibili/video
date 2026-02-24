import { STYLES } from "../../styles"
import { FitTitle } from "../FitTitle"
import { HonorBadge } from "../HonorBadge"
import { FitContent } from "../FitContent"
import { InfoTag } from "../InfoTag"
import { MarqueeTitle } from "../MarqueeTitle"

export const CustomSongInfo = ({
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

      {/* 第一行：自定义文本 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <MarqueeTitle
            text={props.extraInfo}
            style={{
              fontSize: 36,
              fontWeight: "900",
              fontFamily: STYLES.fontMain,
            }}
          />
        </div>

      </div>

      {/* 第二行：作者 | 标签 */}
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
              {props.producers}
            </span>
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