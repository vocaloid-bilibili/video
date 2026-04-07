// 特刊中显示当前的板块或者榜单名字，右上角。

import { Img, staticFile } from "remotion"
import { STYLES, getStyles } from "../../styles"
import type { BoardType } from "../../../../shared/src/boardTypes";

export const RankPart = ({
  partName = "主榜",
  boardType = "weekly"
}: {
  partName?: string,
  boardType?: BoardType
}) => {
  const STYLES = getStyles(boardType);

  return (
    <div
      style={{
        flex: 5,
        display: "flex",
        flexDirection: "column",
        border: "2px solid #000",
        borderRadius: 12,
        backgroundColor: "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 5,
          fontSize: 36,
          fontWeight: "900",
          color: "rgba(0,0,0,0.05)",
          pointerEvents: "none",
          lineHeight: 1,
          fontFamily: "Arial Black",
        }}
      >
        SPECIAL
      </div>

      {/* 前景 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 8px",
        }}
      >
         
        <span style={{
          fontSize: 40,
          fontWeight: "900",
          fontFamily: STYLES.fontNum,
          lineHeight: 1,
        }}>
          {partName}
        </span>
        
      </div>

    </div>
  )
}