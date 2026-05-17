
const CARD_COMPONENT_LABELS: Record<string, string> = {
  achievementCard: "成就达成展示",
  NewSongCard: "新曲榜",
  MainRankCard: "主榜",
  CoverMainRankCard: "主榜",
  SpecialCard: "特刊",
}

export function formatTime(seconds: number, showMs = true): string {
  const m = Math.floor(seconds / 60)
  const s = showMs ? (seconds % 60).toFixed(2) : Math.floor(seconds % 60)
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(showMs ? 5 : 2, "0")}`
}

export function getGroupLabel(cardComponent: string): string {
  return CARD_COMPONENT_LABELS[cardComponent] || cardComponent
}

export async function fetchAPI<T>(url: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(url, opts)
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data
}
