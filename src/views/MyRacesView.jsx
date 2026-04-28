// =============================================================================
// MyRacesView.jsx — Mes pigés
// =============================================================================

import React, { useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import RaceCard from "../components/RaceCard.jsx";
import { ErrorBanner, FullScreenLoader } from "../components/UI.jsx";
import { COLOR, FONT_DISPLAY } from "../lib/format.js";
import { api } from "../lib/api.js";

export default function MyRacesView({ onOpenRace, refreshKey }) {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .myRaces()
      .then((res) => {
        if (!cancelled) {
          setRaces(res.races || []);
          setError("");
        }
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (loading) return <FullScreenLoader />;

  return (
    <div className="px-4 sm:px-8 py-10 max-w-7xl mx-auto">
      <h1
        style={{ fontFamily: FONT_DISPLAY, letterSpacing: 2, lineHeight: 0.9 }}
        className="text-5xl sm:text-7xl uppercase mb-3"
      >
        Mes pigés
      </h1>
      <p className="mb-10" style={{ color: COLOR.muted }}>
        Toutes les courses auxquelles tu participes.
      </p>

      {error && <div className="mb-6"><ErrorBanner>{error}</ErrorBanner></div>}

      {races.length === 0 ? (
        <div
          className="p-16 text-center"
          style={{
            backgroundColor: COLOR.bgCard,
            border: `1px dashed ${COLOR.border}`,
          }}
        >
          <Trophy size={48} className="mx-auto mb-4" style={{ color: COLOR.muted }} />
          <h3
            style={{ fontFamily: FONT_DISPLAY, letterSpacing: 1.5 }}
            className="text-2xl uppercase mb-2"
          >
            Aucune participation pour l'instant
          </h3>
          <p style={{ color: COLOR.muted }}>
            Va à la liste des courses pour piger ton premier numéro.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {races.map((r) => (
            <RaceCard key={r.RaceId} race={r} onOpen={onOpenRace} />
          ))}
        </div>
      )}
    </div>
  );
}
