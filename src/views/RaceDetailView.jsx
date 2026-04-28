// =============================================================================
// RaceDetailView.jsx — Vue détaillée d'une course (grille de numéros + participants)
// =============================================================================

import React, { useState, useEffect, useCallback } from "react";
import {
  Trophy,
  Calendar,
  Hash,
  Sparkles,
  ChevronLeft,
  ArrowRight,
  CheckCircle2,
  Car,
  AlertCircle,
} from "lucide-react";
import {
  Btn,
  Modal,
  Badge,
  StatusBadge,
  Stat,
  ErrorBanner,
  FullScreenLoader,
} from "../components/UI.jsx";
import {
  COLOR,
  FONT_DISPLAY,
  FONT_MONO,
  FONT_BODY,
  formatMoney,
  formatDate,
} from "../lib/format.js";
import { api } from "../lib/api.js";

/* -------------------------------------------------------------------------- */

function NumberTile({ car, holderUsername, isWinner, isMine, isAvailable }) {
  const bg = isWinner
    ? COLOR.gold
    : isMine
    ? COLOR.red
    : holderUsername
    ? COLOR.bgRaised
    : COLOR.bgCard;
  const txt = isWinner ? "#000" : "#fff";
  const border = isWinner
    ? `2px solid ${COLOR.gold}`
    : isMine
    ? `2px solid ${COLOR.red}`
    : `1px solid ${COLOR.border}`;
  return (
    <div
      style={{
        backgroundColor: bg,
        color: txt,
        border,
        opacity: holderUsername || isAvailable ? 1 : 0.55,
      }}
      className="aspect-[5/6] p-2 flex flex-col items-center justify-between text-center transition-all"
    >
      <div className="w-full">
        {isWinner && <Trophy size={14} className="mx-auto mb-0.5" style={{ color: "#000" }} />}
        {!isWinner && isMine && <Sparkles size={12} className="mx-auto mb-0.5" />}
      </div>
      <div
        style={{ fontFamily: FONT_MONO, fontWeight: 800, letterSpacing: -1 }}
        className="text-3xl sm:text-4xl leading-none"
      >
        {car.CarNumber}
      </div>
      <div className="w-full min-h-[28px]">
        {car.DriverName && (
          <div
            className="text-[9px] uppercase tracking-wider truncate leading-tight opacity-70"
            style={{ fontFamily: FONT_BODY }}
          >
            {car.DriverName}
          </div>
        )}
        {holderUsername && (
          <div
            className="text-[10px] font-bold truncate leading-tight"
            style={{ fontFamily: FONT_BODY }}
          >
            {holderUsername}
          </div>
        )}
      </div>
    </div>
  );
}

function DrawAnimation({ assigned, onDone }) {
  const [display, setDisplay] = useState("--");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const total = 22;
    const interval = setInterval(() => {
      i++;
      if (i >= total) {
        clearInterval(interval);
        setDisplay(String(assigned));
        setDone(true);
      } else {
        setDisplay(String(Math.floor(Math.random() * 99) + 1));
      }
    }, 80);
    return () => clearInterval(interval);
  }, [assigned]);

  return (
    <div className="text-center py-6">
      <div className="text-xs uppercase tracking-widest mb-3" style={{ color: COLOR.muted }}>
        Tirage en cours…
      </div>
      <div
        style={{
          fontFamily: FONT_MONO,
          fontWeight: 800,
          color: done ? COLOR.gold : COLOR.text,
          textShadow: done ? `0 0 30px ${COLOR.gold}` : "none",
          letterSpacing: -4,
        }}
        className="text-9xl leading-none mb-4 tabular-nums"
      >
        {display}
      </div>
      {done && (
        <>
          <div className="flex items-center justify-center gap-2 mb-4">
            <CheckCircle2 size={18} style={{ color: COLOR.gold }} />
            <span
              style={{ color: COLOR.gold, fontFamily: FONT_DISPLAY, letterSpacing: 2 }}
              className="text-xl uppercase"
            >
              Numéro attribué !
            </span>
          </div>
          <Btn variant="gold" onClick={onDone}>
            Voir la course <ArrowRight size={16} />
          </Btn>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export default function RaceDetailView({ raceId, currentUser, onBack, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showJoin, setShowJoin] = useState(false);
  const [joining, setJoining] = useState(false);
  const [drawnNumber, setDrawnNumber] = useState(null);

  const reload = useCallback(async () => {
    try {
      const res = await api.getRace(raceId);
      setData(res);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [raceId]);

  useEffect(() => {
    setLoading(true);
    reload();
  }, [reload]);

  const handleConfirmJoin = async () => {
    setShowJoin(false);
    setJoining(true);
    try {
      const res = await api.joinRace(raceId, { paymentMethod: "simulated" });
      setDrawnNumber(res.entry.CarNumber);
      // recharger en arrière-plan pour voir la nouvelle entrée dans la grille
      await reload();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <FullScreenLoader />;
  if (error && !data) {
    return (
      <div className="px-8 py-10 max-w-3xl mx-auto">
        <ErrorBanner>{error}</ErrorBanner>
        <Btn variant="ghost" onClick={onBack} className="mt-4">
          <ChevronLeft size={16} /> Retour
        </Btn>
      </div>
    );
  }

  const { race, grid, participants } = data;
  const myEntry = participants.find((p) => p.UserId === currentUser.userId);
  const totalCars = race.TotalCars || 0;
  const taken = race.ParticipantCount || 0;
  const pot = Number(race.Pot || 0);
  const winnerEntry = race.WinningCarNumber
    ? participants.find((p) => String(p.CarNumber) === String(race.WinningCarNumber))
    : null;

  return (
    <div className="px-4 sm:px-8 py-10 max-w-7xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm mb-8 hover:opacity-70"
        style={{ color: COLOR.muted }}
      >
        <ChevronLeft size={16} /> Toutes les courses
      </button>

      {error && <div className="mb-4"><ErrorBanner>{error}</ErrorBanner></div>}

      {/* HERO */}
      <div
        className="p-6 sm:p-10 mb-8 relative overflow-hidden"
        style={{ backgroundColor: COLOR.bgCard, border: `1px solid ${COLOR.border}` }}
      >
        <div className="relative">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <StatusBadge status={race.Status} />
            {race.RaceDate && (
              <span className="text-xs flex items-center gap-1.5" style={{ color: COLOR.muted }}>
                <Calendar size={12} /> {formatDate(race.RaceDate)}
              </span>
            )}
          </div>
          <h1
            style={{ fontFamily: FONT_DISPLAY, letterSpacing: 2, lineHeight: 0.9 }}
            className="text-5xl sm:text-7xl uppercase mb-4"
          >
            {race.Name}
          </h1>
          {race.Description && (
            <p className="max-w-2xl mb-6" style={{ color: COLOR.muted }}>
              {race.Description}
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Stat label="Mise" value={formatMoney(race.EntryFee)} />
            <Stat label="Cagnotte" value={formatMoney(pot)} highlight />
            <Stat label="Pigés" value={`${taken}/${totalCars}`} />
            <Stat label="Restants" value={String(Math.max(0, totalCars - taken))} />
          </div>

          {race.Status === "finished" && winnerEntry && (
            <div
              className="p-5 mb-2 flex items-center gap-4"
              style={{ backgroundColor: COLOR.gold, color: "#000" }}
            >
              <Trophy size={36} />
              <div>
                <div
                  style={{ fontFamily: FONT_DISPLAY, letterSpacing: 2 }}
                  className="text-2xl uppercase leading-none mb-1"
                >
                  Gagnant
                </div>
                <div className="font-bold">
                  {winnerEntry.Username} avec le #{winnerEntry.CarNumber} — remporte{" "}
                  {formatMoney(pot)}
                </div>
              </div>
            </div>
          )}
          {race.Status === "finished" && !winnerEntry && race.WinningCarNumber && (
            <div
              className="p-5 mb-2 flex items-center gap-4"
              style={{
                backgroundColor: COLOR.bgRaised,
                border: `1px solid ${COLOR.border}`,
              }}
            >
              <AlertCircle size={28} style={{ color: COLOR.gold }} />
              <div>
                <div className="font-bold">
                  Voiture gagnante : #{race.WinningCarNumber}
                </div>
                <div className="text-sm" style={{ color: COLOR.muted }}>
                  Personne n'avait pigé ce numéro — la cagnotte est non réclamée.
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {race.Status === "open" && !myEntry && totalCars > taken && (
              <Btn onClick={() => setShowJoin(true)} disabled={joining}>
                {joining ? "Veuillez patienter…" : `Participer · ${formatMoney(race.EntryFee)}`}
                {!joining && <ArrowRight size={16} />}
              </Btn>
            )}
            {myEntry && (
              <Badge color="gold">
                <Hash size={12} /> Tu as pigé le #{myEntry.CarNumber}
              </Badge>
            )}
            {race.Status === "open" && totalCars === taken && (
              <Badge color="yellow">Tous les numéros sont pris</Badge>
            )}
          </div>
        </div>
      </div>

      {/* GRILLE */}
      {totalCars === 0 ? (
        <div
          className="p-12 text-center"
          style={{
            backgroundColor: COLOR.bgCard,
            border: `1px dashed ${COLOR.border}`,
          }}
        >
          <Car size={36} className="mx-auto mb-3" style={{ color: COLOR.muted }} />
          <p style={{ color: COLOR.muted }}>
            Les numéros de voiture n'ont pas encore été ajoutés à cette course.
          </p>
        </div>
      ) : (
        <div>
          <h2
            style={{ fontFamily: FONT_DISPLAY, letterSpacing: 2 }}
            className="text-2xl uppercase mb-4"
          >
            Grille des numéros
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-2">
            {[...grid]
              .sort((a, b) => Number(a.CarNumber) - Number(b.CarNumber))
              .map((cell) => {
                const isWinner =
                  race.Status === "finished" &&
                  String(race.WinningCarNumber) === String(cell.CarNumber);
                const isMine = cell.HolderUserId === currentUser.userId;
                return (
                  <NumberTile
                    key={cell.CarId}
                    car={cell}
                    holderUsername={cell.HolderUsername}
                    isWinner={isWinner}
                    isMine={isMine}
                    isAvailable={!cell.HolderUserId && race.Status === "open"}
                  />
                );
              })}
          </div>
        </div>
      )}

      {/* LISTE PARTICIPANTS */}
      {taken > 0 && (
        <div className="mt-10">
          <h2
            style={{ fontFamily: FONT_DISPLAY, letterSpacing: 2 }}
            className="text-2xl uppercase mb-4"
          >
            Participants ({taken})
          </h2>
          <div
            style={{
              backgroundColor: COLOR.bgCard,
              border: `1px solid ${COLOR.border}`,
            }}
          >
            {[...participants]
              .sort((a, b) => Number(a.CarNumber) - Number(b.CarNumber))
              .map((p, i) => {
                const isWinner =
                  race.Status === "finished" &&
                  String(race.WinningCarNumber) === String(p.CarNumber);
                return (
                  <div
                    key={p.EntryId}
                    className="flex items-center gap-4 p-4"
                    style={{
                      borderTop: i === 0 ? "none" : `1px solid ${COLOR.border}`,
                      backgroundColor: isWinner
                        ? "rgba(245, 197, 24, 0.1)"
                        : "transparent",
                    }}
                  >
                    <div
                      className="w-14 h-14 flex items-center justify-center"
                      style={{
                        backgroundColor: isWinner ? COLOR.gold : COLOR.bgRaised,
                        color: isWinner ? "#000" : "#fff",
                        fontFamily: FONT_MONO,
                        fontWeight: 800,
                      }}
                    >
                      <span className="text-xl">{p.CarNumber}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">
                        {p.Username}
                        {p.UserId === currentUser.userId && (
                          <span
                            className="ml-2 text-[10px] uppercase tracking-wider"
                            style={{ color: COLOR.red }}
                          >
                            ── toi
                          </span>
                        )}
                      </div>
                      <div className="text-xs" style={{ color: COLOR.muted }}>
                        {p.DriverName || "Pilote inconnu"}
                      </div>
                    </div>
                    {isWinner && (
                      <Badge color="gold">
                        <Trophy size={12} />
                        Gagnant
                      </Badge>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* MODAL: confirmation */}
      <Modal open={showJoin} onClose={() => setShowJoin(false)} title="Confirmer la participation">
        <div className="space-y-4">
          <p>
            Tu vas payer <strong>{formatMoney(race.EntryFee)}</strong> pour
            participer à <strong>{race.Name}</strong>. Un numéro de voiture te
            sera assigné aléatoirement parmi ceux encore disponibles.
          </p>
          <div
            className="p-4 text-sm"
            style={{
              backgroundColor: COLOR.bg,
              border: `1px solid ${COLOR.border}`,
            }}
          >
            <div className="flex justify-between mb-2">
              <span style={{ color: COLOR.muted }}>Mise</span>
              <span style={{ fontFamily: FONT_MONO }}>{formatMoney(race.EntryFee)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: COLOR.muted }}>Numéros restants</span>
              <span style={{ fontFamily: FONT_MONO }}>{totalCars - taken}</span>
            </div>
          </div>
          <p className="text-xs" style={{ color: COLOR.muted }}>
            Note : le paiement n'est pas encore intégré — un système Stripe ou
            Interac e-Transfer doit être ajouté pour la production.
          </p>
          <div className="flex gap-3 pt-2">
            <Btn variant="ghost" onClick={() => setShowJoin(false)} className="flex-1">
              Annuler
            </Btn>
            <Btn onClick={handleConfirmJoin} className="flex-1">
              Confirmer & Piger
            </Btn>
          </div>
        </div>
      </Modal>

      {/* MODAL: animation tirage */}
      <Modal
        open={!!drawnNumber}
        onClose={() => setDrawnNumber(null)}
        title="🎲 Tirage"
        maxWidth={460}
      >
        <DrawAnimation
          assigned={drawnNumber}
          onDone={() => setDrawnNumber(null)}
        />
      </Modal>
    </div>
  );
}
