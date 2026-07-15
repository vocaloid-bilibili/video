// packages/remotion-engine/src/StaffCard.tsx

import { spring, useCurrentFrame, useVideoConfig } from "remotion";

import { FramedPage } from "./components/FramedPage";
import { ListImage } from "./components/ListRankPage";
import { getStyles } from "./styles";
import type { BoardType } from "../../shared/src/boardTypes";

interface StaffMember {
  name: string;
  uid: string;
  avatar?: string;
}

function StaffMemberRow({
  member,
  index,
  boardType,
}: {
  member: StaffMember;
  index: number;
  boardType: BoardType;
}) {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const styles = getStyles(boardType);

  const delay = 15 + index * 3;

  const opacity = spring({
    frame: frame - delay,
    fps,
    from: 0,
    to: 1,
    config: { mass: 0.5 },
  });

  const translateX = spring({
    frame: frame - delay,
    fps,
    from: -20,
    to: 0,
    config: { mass: 0.5 },
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        borderBottom: "2px dashed #ddd",
        padding: "8px 0",
        opacity,
        transform: `translateX(${translateX}px)`,
      }}
    >
      <div
        style={{
          width: 100,
          height: 100,
          border: styles.border,
          borderRadius: 14,
          marginRight: 24,
          backgroundColor: "#eee",
          overflow: "hidden",
          flexShrink: 0,
          boxShadow: "4px 4px 0 rgba(0,0,0,0.15)",
        }}
      >
        <ListImage
          src={member.avatar || ""}
          fallback={member.name.slice(0, 1) || "?"}
        />
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 4,
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontSize: 32,
            fontWeight: 900,
            color: styles.colors.nameText,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontFamily: styles.fontMain,
          }}
        >
          {member.name}
        </span>

        <span
          style={{
            fontFamily: styles.fontMono,
            fontSize: 24,
            color: styles.colors.uidText,
            fontWeight: 700,
          }}
        >
          UID: {member.uid}
        </span>
      </div>
    </div>
  );
}

function ContactInfo({ boardType }: { boardType: BoardType }) {
  const styles = getStyles(boardType);

  const entries = [
    {
      label: "术力口数据库QQ群",
      value: "974585468",
      icon: "QQ",
      color: styles.colors.qqBlue,
    },
    {
      label: "术力口数据库网站",
      value: "vocabili.top",
      icon: "W",
      color: styles.colors.webRed,
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-end",
        padding: "8px 0",
        gap: 20,
      }}
    >
      {entries.map((entry) => (
        <div
          key={entry.label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 15,
          }}
        >
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 900,
                color: styles.colors.uidText,
                letterSpacing: 1,
                marginBottom: 2,
                fontFamily: styles.fontMain,
              }}
            >
              {entry.label}
            </div>

            <div
              style={{
                fontFamily: styles.fontMono,
                fontSize: 36,
                fontWeight: 900,
                color: styles.colors.nameText,
                lineHeight: 1,
              }}
            >
              {entry.value}
            </div>
          </div>

          <div
            style={{
              width: 50,
              height: 50,
              backgroundColor: entry.color,
              borderRadius: 12,
              border: "3px solid #000",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#fff",
              boxShadow: "3px 3px 0 rgba(0,0,0,0.3)",
            }}
          >
            <span
              style={{
                fontWeight: 900,
                fontFamily: styles.fontMono,
                fontSize: entry.icon === "QQ" ? 20 : 24,
              }}
            >
              {entry.icon}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StaffCard({
  staffList,
  boardType = "weekly",
}: {
  staffList: StaffMember[];
  boardType?: BoardType;
}) {
  const styles = getStyles(boardType);

  return (
    <FramedPage
      title={
        <h1
          style={{
            color: styles.colors.headerText,
            fontSize: 40,
            margin: 0,
            letterSpacing: 2,
            fontWeight: 900,
            fontFamily: styles.fontMono,
          }}
        >
          STAFF
        </h1>
      }
      boardType={boardType}
      enterFromY={1080}
      exitToY={1080}
      contentStyle={{
        padding: "30px 100px 50px",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gridTemplateRows: "repeat(4, 1fr)",
          gridAutoFlow: "column",
          gap: "8px 50px",
          boxSizing: "border-box",
        }}
      >
        {staffList.map((member, index) => (
          <StaffMemberRow
            key={`${member.uid}-${index}`}
            member={member}
            index={index}
            boardType={boardType}
          />
        ))}

        <ContactInfo boardType={boardType} />
      </div>
    </FramedPage>
  );
}
