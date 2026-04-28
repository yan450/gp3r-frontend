// =============================================================================
// format.js — Helpers d'affichage
// =============================================================================

export const FONT_DISPLAY = "'Anton', 'Bebas Neue', sans-serif";
export const FONT_BODY = "'DM Sans', system-ui, sans-serif";
export const FONT_MONO = "'JetBrains Mono', monospace";

export const COLOR = {
  bg: "#0a0a0b",
  bgRaised: "#16161a",
  bgCard: "#1c1c20",
  border: "#2a2a30",
  red: "#e10600",
  redDeep: "#a30400",
  gold: "#f5c518",
  text: "#fafafa",
  muted: "#8a8a92",
};

export const formatMoney = (n) =>
  `${(Number(n) || 0).toLocaleString("fr-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} $`;

export const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("fr-CA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
