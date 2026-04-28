// =============================================================================
// UI.jsx — Boutons, inputs, badges, modal, bandeaux d'erreur
// =============================================================================

import React, { useEffect } from "react";
import { X, AlertCircle, Loader2 } from "lucide-react";
import { COLOR, FONT_DISPLAY, FONT_BODY } from "../lib/format.js";

export const CheckerStrip = ({ height = 16 }) => (
  <div
    style={{
      height,
      backgroundImage:
        "linear-gradient(45deg, #fff 25%, transparent 25%), linear-gradient(-45deg, #fff 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #fff 75%), linear-gradient(-45deg, transparent 75%, #fff 75%)",
      backgroundSize: `${height}px ${height}px`,
      backgroundPosition: `0 0, 0 ${height / 2}px, ${height / 2}px -${height / 2}px, -${height / 2}px 0px`,
      backgroundColor: "#000",
    }}
  />
);

export const Btn = ({ children, variant = "primary", className = "", disabled, ...props }) => {
  const base =
    "inline-flex items-center justify-center gap-2 px-5 py-3 font-semibold tracking-wide transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed select-none uppercase text-sm";
  const variants = {
    primary: "text-white hover:translate-y-px active:translate-y-0.5 shadow-lg",
    secondary: "bg-transparent border-2 hover:bg-white hover:text-black",
    ghost: "bg-transparent hover:bg-white/5",
    gold: "text-black font-bold",
    danger: "bg-transparent border-2 border-red-900 text-red-500 hover:bg-red-950",
  };
  const styles = {
    primary: { backgroundColor: COLOR.red },
    secondary: { borderColor: "#fff", color: "#fff" },
    gold: { backgroundColor: COLOR.gold },
  };
  return (
    <button
      {...props}
      disabled={disabled}
      style={{ ...(styles[variant] || {}), ...(props.style || {}) }}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export const Input = ({ label, error, type = "text", ...props }) => (
  <label className="block">
    {label && (
      <span
        className="block text-xs font-bold uppercase tracking-widest mb-2"
        style={{ color: COLOR.muted, fontFamily: FONT_BODY }}
      >
        {label}
      </span>
    )}
    <input
      type={type}
      {...props}
      style={{
        backgroundColor: COLOR.bgRaised,
        border: `1px solid ${error ? COLOR.red : COLOR.border}`,
        color: COLOR.text,
        fontFamily: FONT_BODY,
        ...(props.style || {}),
      }}
      className="w-full px-4 py-3 outline-none focus:border-white transition-colors"
    />
    {error && (
      <span className="block text-xs mt-1" style={{ color: COLOR.red }}>
        {error}
      </span>
    )}
  </label>
);

export const Badge = ({ children, color = "gray" }) => {
  const colors = {
    gray: { bg: "#2a2a30", text: "#cfcfd6" },
    green: { bg: "#0d3d24", text: "#4ade80" },
    yellow: { bg: "#3d2f0d", text: "#fbbf24" },
    red: { bg: "#3d0d0d", text: "#f87171" },
    gold: { bg: "#3d300d", text: "#f5c518" },
  };
  const c = colors[color] || colors.gray;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold uppercase tracking-wider"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {children}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const map = {
    draft: { label: "Brouillon", color: "gray" },
    open: { label: "Ouverte", color: "green" },
    closed: { label: "Fermée", color: "yellow" },
    finished: { label: "Terminée", color: "red" },
  };
  const s = map[status] || map.draft;
  return <Badge color={s.color}>{s.label}</Badge>;
};

export const Modal = ({ open, onClose, children, title, maxWidth = 520 }) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: COLOR.bgCard,
          border: `1px solid ${COLOR.border}`,
          maxWidth,
        }}
        className="w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between mb-6 gap-4">
          <h3
            style={{ fontFamily: FONT_DISPLAY }}
            className="text-3xl uppercase tracking-wider"
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:opacity-70"
            style={{ color: COLOR.muted }}
            aria-label="Fermer"
          >
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const ErrorBanner = ({ children }) =>
  children ? (
    <div
      className="flex items-center gap-2 p-3 text-sm"
      style={{ backgroundColor: "#3d0d0d", color: "#f87171" }}
    >
      <AlertCircle size={16} />
      <span>{children}</span>
    </div>
  ) : null;

export const Stat = ({ label, value, highlight = false }) => (
  <div>
    <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: COLOR.muted }}>
      {label}
    </div>
    <div
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        color: highlight ? COLOR.gold : COLOR.text,
      }}
      className="text-2xl font-bold"
    >
      {value}
    </div>
  </div>
);

export const FullScreenLoader = () => (
  <div
    className="min-h-screen flex items-center justify-center"
    style={{ backgroundColor: COLOR.bg, color: COLOR.muted }}
  >
    <Loader2 size={28} className="animate-spin" />
  </div>
);
