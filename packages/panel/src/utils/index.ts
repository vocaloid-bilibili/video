import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const CARD_COMPONENT_LABELS: Record<string, string> = {
  NewSongCard: "新曲榜",
  MainRankCard: "主榜",
  CoverMainRankCard: "主榜",
  Near1kwMainRankCard: "主榜",
  SpecialCard: "特刊",
};

export function formatTime(seconds: number, showMs = true): string {
  const m = Math.floor(seconds / 60);
  const s = showMs ? (seconds % 60).toFixed(2) : Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(showMs ? 5 : 2, "0")}`;
}

export function getGroupLabel(cardComponent: string): string {
  return CARD_COMPONENT_LABELS[cardComponent] || cardComponent;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
