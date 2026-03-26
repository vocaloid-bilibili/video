// ------------------------------------------------------------------
// 组件：信息标签
// ------------------------------------------------------------------
export const InfoTag = ({ text, color = "#eee", icon = null }: any) => (
  <span
    style={{
      backgroundColor: color,
      border: "2px solid #000",
      padding: "4px 16px",
      borderRadius: 8,
      fontSize: 22,
      fontWeight: "bold",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      boxShadow: "2px 2px 0 rgba(0,0,0,0.1)",
    }}
  >
    {icon} {text}
  </span>
);
