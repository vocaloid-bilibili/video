// packages/remotion-engine/src/utils/safeParse.ts

export function safeParse(value: unknown): number {
  const num =
    typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));

  return Number.isFinite(num) ? num : 0;
}

export function formatNumber(value: unknown): string {
  return new Intl.NumberFormat().format(safeParse(value));
}

export function formatFix(value: unknown, decimals = 2): string {
  if (value === undefined || value === null || value === "") return "";

  const num = safeParse(value);

  return num.toFixed(decimals);
}
