// =============================================================================
// RaceCard.jsx — Carte d'une course (utilisée sur Home et Mes pigés)
// =============================================================================

import React from "react";
import { Calendar, Hash, Sparkles, ChevronRight } from "lucide-react";
import { COLOR, FONT_DISPLAY, FONT_MONO, formatMoney, formatDate } from "../lib/format.js";
import { StatusBadge, Badge } from "./UI.jsx";

export default function RaceCard({ race, onOpen }) {
  const totalCars = race.TotalCars || 0;
  const taken = race.ParticipantCount || 0;
  const pct = totalCars ? Math.round((taken / totalCars) * 100) : 0;
  const pot = Number(race.Pot || 0);

  // myCarNumber : seulement présent depuis sp_GetUserRaces (vue "Mes pigés")
  const myCarNumber = race.MyCarNumber;

  return (
    <button
      onClick={() => onOpen(race.RaceId)}
      className="text-left w-full group"
      style={{
        backgroundColor: COLOR.bgCard,
        border: `1px solid ${COLOR.border}`,
      }}
    >
      <div
        className="px-5 py-3 flex items-center justify-between gap-3"
        style={{ borderBottom: `1px solid ${COLOR.border}` }}
      >
        <StatusBadge status={race.Status} />
        <div className="flex items-center gap-2 text-xs" style={{ color: COLOR.muted }}>
          <Calendar size={12} />
          {race.RaceDate ? formatDate(race.RaceDate) : "Date à venir"}
        </div>
      </div>

      <div className="p-6">
        <h3
          style={{ fontFamily: FONT_DISPLAY, letterSpacing: 1.5, lineHeight: 1 }}
          className="text-3xl uppercase mb-2 group-hover:text-white"
        >
          {race.Name}
        </h3>
        {race.Description && (
          <p className="text-sm mb-5 line-clamp-2" style={{ color: COLOR.muted }}>
            {race.Description}
          </p>
        )}

        <div className="grid grid-cols-3 gap-4 mb-5">
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: COLOR.muted }}>
              Mise
            </div>
            <div style={{ fontFamily: FONT_MONO }} className="text-lg font-bold">
              {formatMoney(race.EntryFee)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: COLOR.muted }}>
              Cagnotte
            </div>
            <div
              style={{ fontFamily: FONT_MONO, color: COLOR.gold }}
              className="text-lg font-bold"
            >
              {formatMoney(pot)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: COLOR.muted }}>
              Numéros
            </div>
            <div style={{ fontFamily: FONT_MONO }} className="text-lg font-bold">
              {taken}/{totalCars}
            </div>
          </div>
        </div>

        <div className="h-1.5 w-full mb-4" style={{ backgroundColor: COLOR.bg }}>
          <div
            className="h-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: COLOR.red }}
          />
        </div>

        <div className="flex items-center justify-between">
          {myCarNumber ? (
            <Badge color="gold">
              <Hash size={11} />
              Votre #{myCarNumber}
            </Badge>
          ) : race.Status === "open" ? (
            <Badge color="green">
              <Sparkles size={11} />
              Disponible
            </Badge>
          ) : (
            <span className="text-xs" style={{ color: COLOR.muted }}>
              {race.Status === "draft" ? "Brouillon" : "Non participé"}
            </span>
          )}
          <ChevronRight size={18} style={{ color: COLOR.muted }} />
        </div>
      </div>
    </button>
  );
}
