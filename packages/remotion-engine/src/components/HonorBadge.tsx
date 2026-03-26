// 组件：成就胶囊
export const HonorBadge = ({ text }: { text: string }) => {
  let color = "#333";
  let bg = "rgba(255,255,255,0.75)";
  let border = "rgba(0,0,0,0.5)";

  if (text.includes("Emerging")) {
    color = "#6A0DAD";
    bg = "rgba(106, 13, 173, 0.25)";
    border = "rgba(106, 13, 173, 0.4)";
  } else if (text.includes("Mega")) {
    color = "#CCA300";
    bg = "rgba(204, 163, 0, 0.25)";
    border = "rgba(204, 163, 0, 0.4)";
  } else if (text === "门番") {
    color = "#127436";
    bg = "rgba(18, 116, 54, 0.25)";
    border = "rgba(18, 116, 54, 0.4)";
  } else if (text.includes("门番")) {
    color = "#23AFA4";
    bg = "rgba(35, 175, 164, 0.25)";
    border = "rgba(35, 175, 164, 0.4)";
  }

  return (
    <div
      style={{
        display: "inline-block",
        backgroundColor: bg,
        border: `3px solid ${border}`,
        borderRadius: 10,
        padding: "6px 18px",
        fontSize: 26,
        fontWeight: "900",
        color: color,
        boxShadow: "3px 3px 0 rgba(0,0,0,0.1)",
      }}
    >
      {text}
    </div>
  );
};