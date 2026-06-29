// packages/remotion-engine/src/rules/FormulaPages.tsx

import type { ReactNode } from "react";

import {
  CoinIcon,
  DanmakuIcon,
  LikeIcon,
  PlayIcon,
  ReplyIcon,
  ShareIcon,
  StarIcon,
} from "../Icons";
import { getStyles } from "../styles";
import type { BoardType } from "../../../shared/src/boardTypes";

function Coef({
  children,
  boardType,
}: {
  children: ReactNode;
  boardType: BoardType;
}) {
  const styles = getStyles(boardType);

  return (
    <span
      style={{
        color: styles.colors.accentRed,
        fontWeight: 900,
      }}
    >
      {children}
    </span>
  );
}

function Num({
  children,
  boardType,
}: {
  children: ReactNode;
  boardType: BoardType;
}) {
  const styles = getStyles(boardType);

  return (
    <span
      style={{
        color: styles.colors.accentBlue,
        fontWeight: 900,
        fontFamily: "Consolas",
      }}
    >
      {children}
    </span>
  );
}

function Op({ children }: { children: ReactNode }) {
  return <span style={{ margin: "0 8px", color: "#888" }}>{children}</span>;
}

function Fraction({
  top,
  bottom,
  boardType,
}: {
  top: ReactNode;
  bottom: ReactNode;
  boardType: BoardType;
}) {
  const styles = getStyles(boardType);

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        textAlign: "center",
        margin: "0 10px",
        lineHeight: 1.1,
        fontSize: "80%",
        fontFamily: styles.fontMain,
      }}
    >
      <div
        style={{
          borderBottom: "3px solid #1d1d1f",
          padding: "0 5px 5px",
          whiteSpace: "nowrap",
        }}
      >
        {top}
      </div>

      <div style={{ paddingTop: 5, whiteSpace: "nowrap" }}>{bottom}</div>
    </div>
  );
}

function FormulaLine({
  name,
  fraction,
  multiplier,
  max,
  boardType,
}: {
  name: string;
  fraction: ReactNode;
  multiplier?: ReactNode;
  max?: string;
  boardType: BoardType;
}) {
  const styles = getStyles(boardType);

  return (
    <>
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          fontSize: 36,
          fontWeight: 900,
          justifyContent: "flex-end",
          fontFamily: styles.fontMain,
        }}
      >
        {name}
      </div>

      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          fontSize: 36,
          fontWeight: 900,
          justifyContent: "center",
        }}
      >
        =
      </div>

      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          fontSize: 36,
          fontWeight: 900,
        }}
      >
        {fraction}
      </div>

      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          fontSize: 36,
          fontWeight: 900,
          justifyContent: "center",
        }}
      >
        {multiplier ? <Op>×</Op> : null}
      </div>

      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          fontSize: 36,
          fontWeight: 900,
        }}
      >
        {multiplier}
      </div>

      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          fontSize: 36,
          fontWeight: 900,
          justifyContent: "center",
        }}
      >
        {max && (
          <div
            style={{
              width: 220,
              fontSize: 26,
              color: "#4A4A4A",
              backgroundColor: "#F5F5F5",
              border: "2px solid #E0E0E0",
              padding: "6px 12px",
              borderRadius: 8,
              fontFamily: "Consolas",
              fontWeight: 900,
            }}
          >
            最大值 {max}
          </div>
        )}
      </div>
    </>
  );
}

export function FormulaPage1({
  boardType = "weekly",
}: {
  boardType?: BoardType;
}) {
  const styles = getStyles(boardType);

  const scoreParts = [
    { icon: PlayIcon, label: "播放量", suffix: "播放分补正" },
    { icon: StarIcon, label: "收藏量", suffix: "收藏分补正" },
    { icon: CoinIcon, label: "硬币量", suffix: "硬币分补正", extra: "fixA" },
    { icon: LikeIcon, label: "点赞量", suffix: "点赞分补正" },
    { icon: ReplyIcon, label: "评论量", suffix: "评论分补正", extra: "fixD" },
    { icon: DanmakuIcon, label: "弹幕量", suffix: "弹幕分补正" },
    { icon: ShareIcon, label: "分享量", suffix: "分享分补正" },
  ];

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1500,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 15,
        padding: "30px 40px",
        boxSizing: "border-box",
      }}
    >
      <p
        style={{
          fontSize: 28,
          margin: "10px 0",
          fontFamily: styles.fontMain,
        }}
      >
        统计范围内所有收录投稿的数据，按以下方式计算得点，按得点从高至低排名。
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 15,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontSize: 48,
            fontWeight: 900,
            lineHeight: 1,
            fontFamily: styles.fontMain,
          }}
        >
          <div>总</div>
          <div>得</div>
          <div>点</div>
        </div>

        <span style={{ fontSize: 48, fontWeight: 900 }}>=</span>

        <span
          style={{
            fontSize: 260,
            color: "#888",
            lineHeight: 1,
            transform: "translateY(-35px)",
            fontWeight: 100,
            fontFamily: styles.fontMain,
          }}
        >
          {"{"}
        </span>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 15,
            margin: "0 15px",
          }}
        >
          {scoreParts.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 24,
                  fontWeight: 700,
                  textAlign: "center",
                  fontFamily: styles.fontMain,
                }}
              >
                <Icon style={{ width: 120, height: 120, opacity: 0.75 }} />
                <div style={{ fontWeight: 900 }}>{item.label}</div>
                <Op>×</Op>
                <div>{item.suffix}</div>
                {item.extra && (
                  <div>
                    <Op>×</Op>
                    <Coef boardType={boardType}>{item.extra}</Coef>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <span
          style={{
            fontSize: 260,
            color: "#888",
            lineHeight: 1,
            transform: "translateY(-35px)",
            fontWeight: 100,
            fontFamily: styles.fontMain,
          }}
        >
          {"}"}
        </span>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 32,
            fontWeight: 900,
            marginLeft: -20,
            lineHeight: 1.4,
            fontFamily: styles.fontNum,
          }}
        >
          <div>
            <Op>×</Op>
            <Coef boardType={boardType}>fixB</Coef>
          </div>
          <div>
            <Op>×</Op>
            <Coef boardType={boardType}>fixC</Coef>
          </div>
        </div>
      </div>

      <div
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px 50px",
          borderTop: "3px solid #F2F2F7",
          paddingTop: 25,
          marginTop: 30,
          fontSize: 36,
          fontWeight: 900,
        }}
      >
        <FormulaLine
          name="fixA"
          boardType={boardType}
          fraction={
            <Fraction
              boardType={boardType}
              top={
                <>
                  播放 <Op>＋</Op> <Num boardType={boardType}>40</Num>
                  <Op>×</Op>收藏 <Op>＋</Op>
                  <Num boardType={boardType}>10</Num>
                  <Op>×</Op>点赞
                </>
              }
              bottom={
                <>
                  <Num boardType={boardType}>150</Num>
                  <Op>×</Op>硬币 <Op>＋</Op>
                  <Num boardType={boardType}>50</Num>
                  <Op>×</Op>弹幕
                </>
              }
            />
          }
        />

        <FormulaLine
          name="fixC"
          boardType={boardType}
          fraction={
            <Fraction
              boardType={boardType}
              top={
                <>
                  收藏 <Op>＋</Op> 点赞 <Op>＋</Op>
                  <Num boardType={boardType}>20</Num>
                  <Op>×</Op>
                  <Coef boardType={boardType}>硬币</Coef>
                </>
              }
              bottom={
                <>
                  <Num boardType={boardType}>2</Num>
                  <Op>×</Op>收藏 <Op>＋</Op>
                  <Num boardType={boardType}>2</Num>
                  <Op>×</Op>点赞
                </>
              }
            />
          }
        />

        <FormulaLine
          name="fixB"
          boardType={boardType}
          fraction={
            <Fraction
              boardType={boardType}
              top={
                <>
                  <Num boardType={boardType}>60</Num>
                  <Op>×</Op>
                  <Coef boardType={boardType}>硬币</Coef>
                  <Op>＋</Op>
                  <Num boardType={boardType}>30</Num>
                  <Op>×</Op>点赞
                </>
              }
              bottom={
                <>
                  播放 <Op>＋</Op>
                  <Num boardType={boardType}>20</Num>
                  <Op>×</Op>收藏
                </>
              }
            />
          }
        />

        <FormulaLine
          name="fixD"
          boardType={boardType}
          fraction={
            <>
              <Op>(</Op>
              <Fraction
                boardType={boardType}
                top={
                  <>
                    收藏 <Op>＋</Op> 点赞
                  </>
                }
                bottom={
                  <>
                    收藏 <Op>＋</Op> 点赞 <Op>＋</Op>
                    <Num boardType={boardType}>0.1</Num>
                    <Op>×</Op>评论
                  </>
                }
              />
              <Op>)</Op>
              <sup
                style={{
                  fontSize: "0.75em",
                  color: styles.colors.accentBlue,
                  position: "relative",
                  top: "-0.7em",
                  marginLeft: 4,
                }}
              >
                20
              </sup>
            </>
          }
        />
      </div>
    </div>
  );
}

export function FormulaPage2({
  playRateCoef,
  isSpecial,
  boardType = "weekly",
}: {
  playRateCoef: number;
  isSpecial: boolean;
  boardType?: BoardType;
}) {
  const styles = getStyles(boardType);

  const rows = [
    {
      name: "播放分补正",
      top: (
        <>
          <Coef boardType={boardType}>硬币</Coef> <Op>＋</Op> 收藏
        </>
      ),
      bottom: <>播放</>,
      multiplier: <Num boardType={boardType}>{playRateCoef}</Num>,
      max: "1.00",
    },
    {
      name: "收藏分补正",
      top: (
        <>
          收藏 <Op>＋</Op> <Num boardType={boardType}>2</Num>
          <Op>×</Op>
          <Coef boardType={boardType}>硬币</Coef>
        </>
      ),
      bottom: (
        <>
          <Num boardType={boardType}>10</Num>
          <Op>×</Op>收藏 <Op>＋</Op>播放
        </>
      ),
      multiplier: <Num boardType={boardType}>200</Num>,
      max: "20.00",
    },
    {
      name: "硬币分补正",
      top: (
        <>
          <Num boardType={boardType}>40</Num>
          <Op>×</Op>
          <Coef boardType={boardType}>硬币</Coef>
        </>
      ),
      bottom: (
        <>
          <Num boardType={boardType}>20</Num>
          <Op>×</Op>
          <Coef boardType={boardType}>硬币</Coef>
          <Op>＋</Op>播放
        </>
      ),
      multiplier: <Num boardType={boardType}>40</Num>,
      max: "40.00",
    },
    {
      name: "点赞分补正",
      top: (
        <>
          <Coef boardType={boardType}>硬币</Coef> <Op>＋</Op> 收藏
        </>
      ),
      bottom: (
        <>
          <Num boardType={boardType}>20</Num>
          <Op>×</Op>点赞 <Op>＋</Op>播放
        </>
      ),
      multiplier: <Num boardType={boardType}>100</Num>,
      max: "5.00",
    },
    {
      name: "弹幕分补正",
      top: (
        <>
          <Num boardType={boardType}>20</Num>
          <Op>×</Op>评论 <Op>＋</Op>收藏 <Op>＋</Op>点赞
        </>
      ),
      bottom: (
        <>
          弹幕 <Op>＋</Op>评论
        </>
      ),
      max: "100.00",
    },
    {
      name: "评论分补正",
      top: (
        <>
          <Num boardType={boardType}>40</Num>
          <Op>×</Op>评论 <Op>＋</Op>点赞 <Op>＋</Op>收藏
        </>
      ),
      bottom: (
        <>
          <Num boardType={boardType}>200</Num>
          <Op>×</Op>评论 <Op>＋</Op>播放
        </>
      ),
      multiplier: <Num boardType={boardType}>20</Num>,
      max: "40.00",
    },
    {
      name: "分享分补正",
      top: (
        <>
          <Num boardType={boardType}>2</Num>
          <Op>×</Op>
          <Coef boardType={boardType}>硬币</Coef>
          <Op>＋</Op>收藏
        </>
      ),
      bottom: (
        <>
          <Num boardType={boardType}>5</Num>
          <Op>×</Op>分享 <Op>＋</Op>点赞
        </>
      ),
      multiplier: <Num boardType={boardType}>10</Num>,
      max: "10.00",
    },
  ];

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1500,
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "260px 80px 400px 40px 100px 280px",
        gridTemplateRows: "repeat(7, 1fr) auto",
        alignItems: "center",
        gap: "10px 0",
        height: "100%",
        padding: "30px 40px",
        boxSizing: "border-box",
      }}
    >
      {rows.map((row) => (
        <FormulaLine
          key={row.name}
          name={row.name}
          fraction={
            <Fraction boardType={boardType} top={row.top} bottom={row.bottom} />
          }
          multiplier={row.multiplier}
          max={row.max}
          boardType={boardType}
        />
      ))}

      <div
        style={{
          gridColumn: "1 / -1",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          fontSize: 22,
          fontWeight: 500,
          color: "#888",
          paddingTop: 10,
          fontFamily: styles.fontMain,
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 100 }}>
          <span>
            *<Coef boardType={boardType}>硬币</Coef>
            <Op>=</Op>硬币<Op>×</Op>
            <Coef boardType={boardType}>fixA</Coef>
          </span>
          <span>*各补正值按进一法取至小数点后两位</span>
        </div>

        {isSpecial && (
          <div
            style={{
              marginTop: 8,
              padding: "12px 16px",
              backgroundColor: "rgba(255,200,0,0.15)",
              border: "2px solid rgba(255,200,0,0.4)",
              borderRadius: 8,
              fontSize: 20,
              color: "#856404",
              fontWeight: 700,
            }}
          >
            *除弹幕分补正外，其余各项补正值线性折合至原有区间的上半部分
          </div>
        )}
      </div>
    </div>
  );
}
