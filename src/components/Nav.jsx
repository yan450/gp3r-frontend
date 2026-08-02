// =============================================================================
// Nav.jsx — barre de navigation supérieure
// =============================================================================

import React from "react";
import { Flag, Trophy, Shield, LogOut, Wallet } from "lucide-react";
import { COLOR, FONT_DISPLAY, FONT_MONO, formatMoney } from "../lib/format.js";
import { CheckerStrip } from "./UI.jsx";

export default function Nav({ user, view, onNavigate, onLogout, balance = 0, pendingPaymentsCount = 0 }) {
  const item = (key, label, icon, badge = null) => {
    const active = view === key || (key === "home" && view === "race-detail");
    return (
      <button
        key={key}
        onClick={() => onNavigate(key)}
        className="relative flex items-center gap-2 px-3 py-2 text-sm font-semibold uppercase tracking-wider transition-colors"
        style={{
          color: active ? COLOR.text : COLOR.muted,
          borderBottom: active ? `2px solid ${COLOR.red}` : "2px solid transparent",
        }}
      >
        {icon}
        <span className="hidden sm:inline">{label}</span>
        {badge !== null && badge > 0 && (
          <span
            style={{
              backgroundColor: COLOR.red,
              color: "#fff",
              fontFamily: FONT_MONO,
              fontSize: 10,
              fontWeight: 800,
              padding: "1px 6px",
              minWidth: 20,
              textAlign: "center",
            }}
            className="ml-1"
          >
            {badge}
          </span>
        )}
      </button>
    );
  };

  const cartLabel = balance > 0 ? formatMoney(balance) : "Panier";

  return (
    <>
      <CheckerStrip height={12} />
      <nav
        style={{ backgroundColor: COLOR.bg, borderBottom: `1px solid ${COLOR.border}` }}
        className="px-4 sm:px-8 py-4 flex items-center justify-between gap-4"
      >
        <button onClick={() => onNavigate("home")} className="flex items-center gap-3 group">
          <div
            className="w-10 h-10 flex items-center justify-center"
            style={{ backgroundColor: COLOR.red }}
          >
            <Flag size={22} color="white" strokeWidth={2.5} />
          </div>
          <div className="text-left">
            <div
              style={{ fontFamily: FONT_DISPLAY, lineHeight: 1, letterSpacing: 1 }}
              className="text-2xl"
            >
              GP3R<span style={{ color: COLOR.red }}>.</span>TIRAGES
            </div>
            <div
              style={{ color: COLOR.muted, fontFamily: FONT_MONO }}
              className="text-[10px] uppercase tracking-widest"
            >
              Pool de course officiel
            </div>
          </div>
        </button>

        <div className="flex items-center gap-1">
          {item("home", "Courses", <Flag size={16} />)}
          {item("my-races", "Mes pigés", <Trophy size={16} />)}

          {/* Bouton Panier avec solde intégré */}
          <button
            onClick={() => onNavigate("cart")}
            className="relative flex items-center gap-2 px-3 py-2 text-sm font-semibold uppercase tracking-wider transition-colors"
            style={{
              color: view === "cart" ? COLOR.text : balance > 0 ? COLOR.red : COLOR.muted,
              borderBottom: view === "cart" ? `2px solid ${COLOR.red}` : "2px solid transparent",
            }}
          >
            <Wallet size={16} />
            <span
              className="hidden sm:inline"
              style={{ fontFamily: balance > 0 ? FONT_MONO : undefined }}
            >
              {cartLabel}
            </span>
            {balance > 0 && (
              <span
                className="sm:hidden"
                style={{
                  backgroundColor: COLOR.red,
                  color: "#fff",
                  fontFamily: FONT_MONO,
                  fontSize: 9,
                  fontWeight: 800,
                  padding: "1px 4px",
                }}
              >
                ●
              </span>
            )}
          </button>

          {user?.isAdmin && item("admin", "Admin", <Shield size={16} />, pendingPaymentsCount)}

          <div className="w-px h-8 mx-2" style={{ backgroundColor: COLOR.border }} />

          <div className="hidden md:flex items-center gap-2 px-3">
            <div
              className="w-8 h-8 flex items-center justify-center text-sm font-bold"
              style={{
                backgroundColor: user?.isAdmin ? COLOR.gold : COLOR.bgRaised,
                color: user?.isAdmin ? "#000" : COLOR.text,
              }}
            >
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="text-sm">
              <div className="font-semibold leading-tight">{user?.username}</div>
              {user?.isAdmin && (
                <div
                  className="text-[10px] uppercase tracking-wider"
                  style={{ color: COLOR.gold }}
                >
                  Administrateur
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-2 hover:opacity-70"
            style={{ color: COLOR.muted }}
            title="Se déconnecter"
          >
            <LogOut size={18} />
          </button>
        </div>
      </nav>
    </>
  );
}
