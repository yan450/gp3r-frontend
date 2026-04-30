// =============================================================================
// RaceManageModal.jsx — Modal admin pour gérer une course (info, voitures,
// statut, gagnant, suppression)
// =============================================================================

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Check, Trophy, Sparkles } from "lucide-react";
import { Modal, Btn, Input, ErrorBanner, StatusBadge } from "../components/UI.jsx";
import { COLOR, FONT_BODY, FONT_MONO, formatMoney } from "../lib/format.js";
import { api } from "../lib/api.js";

function StatusOption({ label, description, active, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left p-4 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        backgroundColor: active ? COLOR.bgRaised : COLOR.bg,
        border: `1px solid ${active ? COLOR.red : COLOR.border}`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-4 h-4 flex items-center justify-center"
          style={{
            backgroundColor: active ? COLOR.red : "transparent",
            border: `2px solid ${active ? COLOR.red : COLOR.muted}`,
          }}
        >
          {active && <Check size={10} color="#fff" strokeWidth={3} />}
        </div>
        <div>
          <div className="font-bold uppercase tracking-wider text-sm">{label}</div>
          <div className="text-xs" style={{ color: COLOR.muted }}>
            {description}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function RaceManageModal({ raceId, onClose, onChanged }) {
  const [tab, setTab] = useState("info");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Formulaires
  const [info, setInfo] = useState({ name: "", date: "", description: "", entryFee: "0" });
  const [carForm, setCarForm] = useState({ number: "", driver: "", position: "" });
  const [bulkInput, setBulkInput] = useState("");
  const [winnerNumber, setWinnerNumber] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const reload = async () => {
    try {
      const res = await api.getRace(raceId);
      setData(res);
      setInfo({
        name: res.race.Name,
        date: res.race.RaceDate ? String(res.race.RaceDate).slice(0, 10) : "",
        description: res.race.Description || "",
        entryFee: String(res.race.EntryFee || 0),
      });
      setWinnerNumber(res.race.WinningCarNumber || "");
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raceId]);

  const safeRun = async (fn) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading || !data) {
    return (
      <Modal open onClose={onClose} title="Chargement…" maxWidth={780}>
        <div style={{ color: COLOR.muted }} className="py-6 text-center">
          Veuillez patienter…
        </div>
      </Modal>
    );
  }

  const { race, grid, participants } = data;

  const saveInfo = () =>
    safeRun(async () => {
      await api.updateRace(raceId, {
        name: info.name.trim() || race.Name,
        raceDate: info.date || null,
        description: info.description.trim() || null,
        entryFee: parseFloat(info.entryFee) || 0,
      });
      await reload();
    });

  const addCar = () => {
    const n = carForm.number.trim();
    if (!n) return;
    safeRun(async () => {
      await api.addCar(raceId, {
        carNumber: n,
        driverName: carForm.driver.trim() || null,
        startPosition: carForm.position.trim() || null,
      });
      setCarForm({ number: "", driver: "", position: "" });
      await reload();
    });
  };

  const updateCarPosition = (carId, value) =>
    safeRun(async () => {
      await api.updateCarPosition(carId, value === "" ? null : Number(value));
      await reload();
    });

  const toggleReveal = () =>
    safeRun(async () => {
      await api.revealNumbers(raceId, !race.NumbersRevealed);
      await reload();
    });

  const addBulk = () => {
    const lines = bulkInput
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const cars = [];
    for (const line of lines) {
      // Formats acceptés :
      //   44
      //   44 - Lewis Hamilton
      //   44, Lewis Hamilton
      //   44 - Lewis Hamilton - 7   (avec position en 3e)
      //   44, Lewis Hamilton, 7
      const parts = line.split(/\s*[-,:]\s*/);
      if (parts.length === 0) continue;
      const carNumber = parts[0].trim();
      if (!carNumber) continue;
      let driverName = null;
      let startPosition = null;
      if (parts.length >= 2) driverName = parts[1].trim() || null;
      if (parts.length >= 3) {
        const p = parts[2].trim().replace(/[^0-9]/g, "");
        if (p) startPosition = Number(p);
      }
      cars.push({ carNumber, driverName, startPosition });
    }
    if (cars.length === 0) return;
    safeRun(async () => {
      await api.addCarsBulk(raceId, cars);
      setBulkInput("");
      await reload();
    });
  };

  const removeCar = (carId) =>
    safeRun(async () => {
      await api.removeCar(carId);
      await reload();
    });

  const setStatus = (status) =>
    safeRun(async () => {
      await api.changeStatus(raceId, status);
      await reload();
    });

  const declareWinner = () => {
    const n = String(winnerNumber).trim();
    if (!n) return;
    safeRun(async () => {
      await api.declareWinner(raceId, n);
      await reload();
    });
  };

  const handleDelete = () =>
    safeRun(async () => {
      await api.deleteRace(raceId);
      onClose();
    });

  const tabBtn = (key, label) => (
    <button
      onClick={() => setTab(key)}
      style={{
        backgroundColor: tab === key ? COLOR.red : "transparent",
        color: tab === key ? "#fff" : COLOR.muted,
      }}
      className="px-4 py-2 text-xs font-bold uppercase tracking-wider"
    >
      {label}
    </button>
  );

  return (
    <Modal open onClose={onClose} title={race.Name} maxWidth={780}>
      <div className="flex gap-1 mb-6 flex-wrap" style={{ backgroundColor: COLOR.bg, padding: 4 }}>
        {tabBtn("info", "Informations")}
        {tabBtn("cars", `Voitures (${grid.length})`)}
        {tabBtn("status", "Statut & cycle")}
        {tabBtn("winner", "Gagnant")}
        {tabBtn("danger", "Zone rouge")}
      </div>

      {error && <div className="mb-4"><ErrorBanner>{error}</ErrorBanner></div>}

      {tab === "info" && (
        <div className="space-y-4">
          <Input
            label="Nom"
            value={info.name}
            onChange={(e) => setInfo({ ...info, name: e.target.value })}
          />
          <Input
            label="Date"
            type="date"
            value={info.date}
            onChange={(e) => setInfo({ ...info, date: e.target.value })}
          />
          <Input
            label="Mise par participant ($)"
            type="number"
            step="0.50"
            value={info.entryFee}
            onChange={(e) => setInfo({ ...info, entryFee: e.target.value })}
          />
          <div>
            <span
              className="block text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: COLOR.muted, fontFamily: FONT_BODY }}
            >
              Description
            </span>
            <textarea
              value={info.description}
              onChange={(e) => setInfo({ ...info, description: e.target.value })}
              rows={3}
              style={{
                backgroundColor: COLOR.bgRaised,
                border: `1px solid ${COLOR.border}`,
                color: COLOR.text,
                fontFamily: FONT_BODY,
                resize: "vertical",
              }}
              className="w-full px-4 py-3 outline-none focus:border-white"
            />
          </div>
          <Btn onClick={saveInfo} className="w-full" disabled={busy}>
            <Check size={16} /> Enregistrer
          </Btn>
        </div>
      )}

      {tab === "cars" && (
        <div className="space-y-5">
          <div>
            <h4
              className="text-sm font-bold uppercase tracking-wider mb-3"
              style={{ color: COLOR.muted }}
            >
              Ajouter une voiture
            </h4>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <input
                value={carForm.number}
                onChange={(e) => setCarForm({ ...carForm, number: e.target.value })}
                placeholder="N°"
                style={{
                  backgroundColor: COLOR.bgRaised,
                  border: `1px solid ${COLOR.border}`,
                  color: COLOR.text,
                  fontFamily: FONT_MONO,
                  width: 80,
                }}
                className="px-3 py-2 outline-none focus:border-white"
              />
              <input
                value={carForm.position}
                onChange={(e) =>
                  setCarForm({ ...carForm, position: e.target.value.replace(/[^0-9]/g, "") })
                }
                placeholder="Pos"
                title="Position de départ (optionnel)"
                style={{
                  backgroundColor: COLOR.bgRaised,
                  border: `1px solid ${COLOR.border}`,
                  color: COLOR.text,
                  fontFamily: FONT_MONO,
                  width: 70,
                }}
                className="px-3 py-2 outline-none focus:border-white"
              />
              <input
                value={carForm.driver}
                onChange={(e) => setCarForm({ ...carForm, driver: e.target.value })}
                placeholder="Nom du pilote (optionnel)"
                style={{
                  backgroundColor: COLOR.bgRaised,
                  border: `1px solid ${COLOR.border}`,
                  color: COLOR.text,
                }}
                className="flex-1 px-3 py-2 outline-none focus:border-white"
              />
              <Btn onClick={addCar} type="button" disabled={busy}>
                <Plus size={14} /> Ajouter
              </Btn>
            </div>
          </div>

          <div>
            <h4
              className="text-sm font-bold uppercase tracking-wider mb-3"
              style={{ color: COLOR.muted }}
            >
              Ajout en lot
            </h4>
            <textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              rows={4}
              placeholder={
                "Une ligne par voiture. Formats acceptés:\n44\n44 - Lewis Hamilton\n44 - Lewis Hamilton - 7  (position 7)\n16, Charles Leclerc, 3"
              }
              style={{
                backgroundColor: COLOR.bgRaised,
                border: `1px solid ${COLOR.border}`,
                color: COLOR.text,
                fontFamily: FONT_MONO,
                resize: "vertical",
                fontSize: 13,
              }}
              className="w-full px-3 py-2 outline-none focus:border-white"
            />
            <Btn variant="ghost" onClick={addBulk} className="mt-2" disabled={busy}>
              <Plus size={14} /> Importer
            </Btn>
          </div>

          {grid.length > 0 && (
            <div>
              <h4
                className="text-sm font-bold uppercase tracking-wider mb-3"
                style={{ color: COLOR.muted }}
              >
                Voitures ({grid.length})
              </h4>
              <div
                className="max-h-72 overflow-y-auto"
                style={{ border: `1px solid ${COLOR.border}` }}
              >
                {[...grid]
                  .sort((a, b) => {
                    const posA = a.StartPosition;
                    const posB = b.StartPosition;
                    if (posA != null && posB != null) return posA - posB;
                    if (posA != null) return -1;
                    if (posB != null) return 1;
                    return Number(a.CarNumber) - Number(b.CarNumber);
                  })
                  .map((c, i) => {
                    const holders = c.Holders || [];
                    return (
                      <div
                        key={c.CarId}
                        className="flex items-center gap-3 p-3"
                        style={{
                          backgroundColor: COLOR.bg,
                          borderTop: i === 0 ? "none" : `1px solid ${COLOR.border}`,
                        }}
                      >
                        <div
                          style={{
                            fontFamily: FONT_MONO,
                            fontWeight: 800,
                            backgroundColor: COLOR.bgCard,
                            width: 56,
                          }}
                          className="text-center py-2"
                        >
                          {c.CarNumber}
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          defaultValue={c.StartPosition ?? ""}
                          onBlur={(e) => {
                            const v = e.target.value.trim();
                            const current = c.StartPosition ?? "";
                            if (String(v) !== String(current)) {
                              updateCarPosition(c.CarId, v);
                            }
                          }}
                          placeholder="Pos"
                          title="Position de départ"
                          style={{
                            backgroundColor: COLOR.bgCard,
                            border: `1px solid ${COLOR.border}`,
                            color: COLOR.text,
                            fontFamily: FONT_MONO,
                            width: 50,
                          }}
                          className="px-2 py-1 outline-none focus:border-white text-center text-sm"
                        />
                        <div className="flex-1 text-sm min-w-0">
                          <div className="font-semibold truncate">
                            {c.DriverName || (
                              <span style={{ color: COLOR.muted }}>
                                — pilote non renseigné —
                              </span>
                            )}
                          </div>
                          {holders.length > 0 && (
                            <div className="text-xs" style={{ color: COLOR.gold }}>
                              Pigé par{" "}
                              {holders
                                .map(
                                  (h) =>
                                    `${h.HolderUsername}${h.DrawRound > 1 ? ` (T${h.DrawRound})` : ""}`
                                )
                                .join(", ")}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeCar(c.CarId)}
                          className="p-2 hover:opacity-70"
                          style={{ color: COLOR.muted }}
                          disabled={holders.length > 0 || busy}
                          title={holders.length > 0 ? "Voiture déjà pigée" : "Retirer"}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "status" && (
        <div className="space-y-5">
          <p style={{ color: COLOR.muted }}>
            Statut actuel : <StatusBadge status={race.Status} />
          </p>
          <div className="space-y-3">
            <StatusOption
              label="Brouillon"
              description="La course n'est visible que pour les administrateurs."
              active={race.Status === "draft"}
              onClick={() => setStatus("draft")}
              disabled={busy}
            />
            <StatusOption
              label="Ouverte"
              description="Les utilisateurs peuvent piger un numéro."
              active={race.Status === "open"}
              onClick={() => setStatus("open")}
              disabled={busy}
            />
            <StatusOption
              label="Fermée"
              description="Plus de nouvelles inscriptions, en attente du résultat."
              active={race.Status === "closed"}
              onClick={() => setStatus("closed")}
              disabled={busy}
            />
            <StatusOption
              label="Terminée"
              description="Le numéro gagnant a été annoncé."
              active={race.Status === "finished"}
              onClick={() => setTab("winner")}
              disabled={busy}
            />
          </div>

          {/* Bouton "Démarrer la course" — révèle qui a pigé quel pilote */}
          <div
            className="p-4 mt-6"
            style={{
              backgroundColor: COLOR.bg,
              border: `2px solid ${race.NumbersRevealed ? COLOR.gold : COLOR.red}`,
            }}
          >
            <div className="flex items-start gap-3 mb-3">
              <Sparkles
                size={20}
                style={{ color: race.NumbersRevealed ? COLOR.gold : COLOR.red }}
              />
              <div>
                <div className="font-bold uppercase tracking-wider text-sm mb-1">
                  {race.NumbersRevealed
                    ? "Numéros révélés"
                    : "Numéros cachés (avant la course)"}
                </div>
                <div className="text-xs" style={{ color: COLOR.muted }}>
                  {race.NumbersRevealed
                    ? "Tous les utilisateurs voient qui a pigé chaque pilote."
                    : "Chaque utilisateur ne voit que son propre numéro. Clique 'Démarrer la course' au moment du départ pour tout révéler."}
                </div>
              </div>
            </div>
            <Btn
              variant={race.NumbersRevealed ? "ghost" : "gold"}
              onClick={toggleReveal}
              disabled={busy}
              className="w-full"
            >
              <Sparkles size={16} />
              {race.NumbersRevealed
                ? "Cacher à nouveau les numéros"
                : "Démarrer la course (révéler tout)"}
            </Btn>
          </div>
        </div>
      )}

      {tab === "winner" && (
        <div className="space-y-5">
          {grid.length === 0 ? (
            <p style={{ color: COLOR.muted }}>
              Aucune voiture dans cette course — ajoute-en avant de déclarer un gagnant.
            </p>
          ) : (
            <>
              <p style={{ color: COLOR.muted }}>
                Choisis le numéro de la voiture qui a remporté la course. La
                personne qui avait pigé ce numéro gagne la cagnotte de{" "}
                <strong style={{ color: COLOR.gold }}>{formatMoney(race.Pot)}</strong>.
              </p>
              <div>
                <span
                  className="block text-xs font-bold uppercase tracking-widest mb-2"
                  style={{ color: COLOR.muted }}
                >
                  Numéro gagnant
                </span>
                <select
                  value={winnerNumber}
                  onChange={(e) => setWinnerNumber(e.target.value)}
                  style={{
                    backgroundColor: COLOR.bgRaised,
                    border: `1px solid ${COLOR.border}`,
                    color: COLOR.text,
                    fontFamily: FONT_MONO,
                  }}
                  className="w-full px-3 py-3 outline-none"
                >
                  <option value="">— Choisir —</option>
                  {[...grid]
                    .sort((a, b) => Number(a.CarNumber) - Number(b.CarNumber))
                    .map((c) => (
                      <option key={c.CarId} value={c.CarNumber}>
                        #{c.CarNumber}
                        {c.DriverName ? ` — ${c.DriverName}` : ""}
                        {c.HolderUsername
                          ? ` (pigé par ${c.HolderUsername})`
                          : " (libre)"}
                      </option>
                    ))}
                </select>
              </div>
              <Btn variant="gold" onClick={declareWinner} className="w-full" disabled={busy}>
                <Trophy size={16} /> Annoncer le gagnant
              </Btn>
            </>
          )}
        </div>
      )}

      {tab === "danger" && (
        <div className="space-y-4">
          <p style={{ color: COLOR.muted }}>
            Supprimer définitivement cette course et toutes les pigées
            associées. Action irréversible.
          </p>
          {!confirmDelete ? (
            <Btn
              variant="danger"
              onClick={() => setConfirmDelete(true)}
              className="w-full"
              disabled={busy}
            >
              <Trash2 size={16} /> Supprimer la course
            </Btn>
          ) : (
            <div className="space-y-3">
              <p className="font-bold" style={{ color: "#f87171" }}>
                Es-tu sûr ? Cette action est définitive.
              </p>
              <div className="flex gap-2">
                <Btn
                  variant="ghost"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1"
                >
                  Annuler
                </Btn>
                <Btn
                  variant="danger"
                  onClick={handleDelete}
                  className="flex-1"
                  disabled={busy}
                >
                  Oui, supprimer
                </Btn>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
