// =============================================================================
// HomeView.jsx — Liste de toutes les courses
// =============================================================================

import React, { useState, useEffect } from "react";
import { Flag, Gauge } from "lucide-react";
import RaceCard from "../components/RaceCard.jsx";
import { ErrorBanner, FullScreenLoader } from "../components/UI.jsx";
import { COLOR, FONT_DISPLAY, FONT_BODY } from "../lib/format.js";
import { api } from "../lib/api.js";

export default function HomeView({ currentUser, onOpenRace, refreshKey }) {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .listRaces()
      .then((res) => {
        if (!cancelled) {
          setRaces(res.races || []);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (loading) return <FullScreenLoader />;

  const open = races.filter((r) => r.Status === "open");
  const others = races.filter((r) => r.Status !== "open");

  return (
    <div className="px-4 sm:px-8 py-10 max-w-7xl mx-auto">
      <div className="mb-12">
        <div
          className="inline-flex items-center gap-2 mb-3 px-3 py-1"
          style={{ backgroundColor: COLOR.red }}
        >
          <Gauge size={14} />
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ fontFamily: FONT_BODY }}
          >
            Saison en cours
          </span>
        </div>
        <h1
          style={{ fontFamily: FONT_DISPLAY, letterSpacing: 2, lineHeight: 0.9 }}
          className="text-5xl sm:text-7xl uppercase mb-3"
        >
          Les courses
        </h1>
        <p className="max-w-xl" style={{ color: COLOR.muted }}>
          Pige un numéro pour chaque course à laquelle tu veux participer. Si la
          voiture associée à ton numéro gagne, tu remportes la cagnotte
          complète.
        </p>
      </div>

      {error && <div className="mb-6"><ErrorBanner>{error}</ErrorBanner></div>}

      {open.length > 0 && (
        <section className="mb-12">
          <h2
            style={{ fontFamily: FONT_DISPLAY, letterSpacing: 2 }}
            className="text-2xl uppercase mb-5 flex items-center gap-3"
          >
            <span className="w-2 h-2" style={{ backgroundColor: "#4ade80" }} />
            Inscriptions ouvertes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {open.map((r) => (
              <RaceCard key={r.RaceId} race={r} onOpen={onOpenRace} />
            ))}
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section>
          <h2
            style={{ fontFamily: FONT_DISPLAY, letterSpacing: 2 }}
            className="text-2xl uppercase mb-5 flex items-center gap-3"
          >
            <span className="w-2 h-2" style={{ backgroundColor: COLOR.muted }} />
            Autres courses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {others.map((r) => (
              <RaceCard key={r.RaceId} race={r} onOpen={onOpenRace} />
            ))}
          </div>
        </section>
      )}

      {races.length === 0 && !error && (
        <div
          className="p-16 text-center"
          style={{
            backgroundColor: COLOR.bgCard,
            border: `1px dashed ${COLOR.border}`,
          }}
        >
          <Flag size={48} className="mx-auto mb-4" style={{ color: COLOR.muted }} />
          <h3
            style={{ fontFamily: FONT_DISPLAY, letterSpacing: 1.5 }}
            className="text-2xl uppercase mb-2"
          >
            Aucune course pour l'instant
          </h3>
          <p style={{ color: COLOR.muted }}>
            {currentUser?.isAdmin
              ? "Crée la première course depuis le panneau admin."
              : "Reviens bientôt — un administrateur va publier les courses."}
          </p>
        </div>
      )}
    </div>
  );
}
