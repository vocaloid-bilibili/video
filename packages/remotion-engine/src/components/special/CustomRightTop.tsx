// 右上角小板块的自定义，不需要任何输入。

import { Img, staticFile } from "remotion"
import { STYLES } from "../../styles"

export const RankPart = () => {

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
         
        <Img style={{
          width: "100%"
        }} src={staticFile("image/yumenokessho_logo.png")} />
            
        
      </div>

    </div>
  )
}