// packages/controller/src/synthesis/honors.ts

export const HONORS = {
  "Emerging Hit!": true,
  "Mega Hit!!!": true,
  门番: true,
  门番候补: true,
} as const;

export type AchievementHonor = keyof typeof HONORS;
export type HonorBadgeType = AchievementHonor | "default";

export function isAchievementHonor(value: unknown): value is AchievementHonor {
  return typeof value === "string" && value in HONORS;
}

export function normalizeHonors(value: unknown): AchievementHonor[] {
  const rawHonors = Array.isArray(value) ? value : [value];

  return rawHonors
    .map((honor) => String(honor ?? "").trim())
    .filter(isAchievementHonor);
}

export function getPrimaryHonorBadge(value: unknown): {
  title: string;
  type: HonorBadgeType;
} {
  const first = normalizeHonors(value)[0];

  if (!first) {
    return {
      title: "成就",
      type: "default",
    };
  }

  return {
    title: first,
    type: first,
  };
}
