export type ThemeMode = "dark" | "light";

const DOMAIN_PALETTE = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#a855f7",
];

const TYPE_FALLBACK: Record<string, string> = {
  file: "#94a3b8",
  concept: "#f97316",
  stack: "#a855f7",
  project: "#0ea5e9",
  owner: "#10b981",
  learning: "#ef4444",
  domain: "#22c55e",
};

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function alphaHex(opacity: number) {
  const normalized = Math.max(0, Math.min(1, opacity));
  return Math.round(normalized * 255)
    .toString(16)
    .padStart(2, "0");
}

export function colorForDomain(domain: string, theme: ThemeMode) {
  const base = DOMAIN_PALETTE[hashString(domain.toLowerCase()) % DOMAIN_PALETTE.length];
  if (theme === "dark") {
    return base;
  }
  return `${base}${alphaHex(0.9)}`;
}

export function colorForNodeType(nodeType: string) {
  return TYPE_FALLBACK[nodeType] ?? "#94a3b8";
}
