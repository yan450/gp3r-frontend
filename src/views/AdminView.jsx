// =============================================================================
// AdminView.jsx — Panneau administrateur
// =============================================================================

import React, { useState, useEffect } from "react";
import {
  Crown,
  Plus,
  Users,
  Settings,
  Eye,
  Flag,
} from "lucide-react";
import {
  Btn,
  Modal,
  Input,
  StatusBadge,
  ErrorBanner,
  FullScreenLoader,
} from "../components/UI.jsx";
import {
  COLOR,
  FONT_DISPLAY,
  FONT_BODY,
  FONT_MONO,
  formatMoney,
  formatDate,
} from "../lib/format.js";
import { api } from "../lib/api.js";
import RaceManageModal from "./RaceManageModal.jsx";

/* -------------------------------------------------------------------------- */

function CreateRaceModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    date: "",
    description: "",
    entryFee: "10",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ name: "", date: "", description: "", entryFee: "10" });
      setError("");
    }
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) {
      setError("Donne un nom à la course.");
      return;
    }
    const fee = parseFloat(form.entryFee);
    if (isNaN(fee) || fee < 0) {
      setError("Mise invalide.");
      return;
    }
    setBusy(true);
    try {
      await api.createRace({
        name: form.name.trim(),
        raceDate: form.date || null,
        description: form.description.trim() || null,
        entryFee: fee,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle course">
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Nom de la course"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="ex: GP3R - Coupe Nissan Sentra"
        />
        <Input
          label="Date (optionnel)"
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <Input
          label="Mise par participant ($)"
          type="number"
          step="0.50"
          min="0"
          value={form.entryFee}
          onChange={(e) => setForm({ ...form, entryFee: e.target.value })}
        />
        <div>
          <span
            className="block text-xs font-bold uppercase tracking-widest mb-2"
            style={{ color: COLOR.muted, fontFamily: FONT_BODY }}
          >
            Description (optionnel)
          </span>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Quelques détails sur la course…"
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
        <ErrorBanner>{error}</ErrorBanner>
        <p className="text-xs" style={{ color: COLOR.muted }}>
          La course sera créée en mode <strong>Brouillon</strong>. Tu pourras
          ensuite ajouter les numéros de voiture puis l'ouvrir aux inscriptions.
        </p>
        <div className="flex gap-3 pt-2">
          <Btn variant="ghost" onClick={onClose} type="button" className="flex-1">
            Annuler
          </Btn>
          <Btn type="submit" className="flex-1" disabled={busy}>
            <Plus size={16} /> Créer
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */

function UsersModal({ open, onClose, onPromoted }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .listUsers()
      .then((res) => setUsers(res.users || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [open]);

  const promote = async (userId) => {
    try {
      await api.promoteUser(userId);
      const res = await api.listUsers();
      setUsers(res.users || []);
      onPromoted?.();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Utilisateurs" maxWidth={560}>
      {error && <div className="mb-4"><ErrorBanner>{error}</ErrorBanner></div>}
      {loading ? (
        <div className="text-center py-6" style={{ color: COLOR.muted }}>
          Chargement…
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.UserId}
              className="flex items-center gap-3 p-3"
              style={{
                backgroundColor: COLOR.bg,
                border: `1px solid ${COLOR.border}`,
              }}
            >
              <div
                className="w-9 h-9 flex items-center justify-center font-bold"
                style={{
                  backgroundColor: u.IsAdmin ? COLOR.gold : COLOR.bgRaised,
                  color: u.IsAdmin ? "#000" : "#fff",
                }}
              >
                {u.Username[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-bold">{u.Username}</div>
                {u.IsAdmin && (
                  <div
                    className="text-[10px] uppercase tracking-wider"
                    style={{ color: COLOR.gold }}
                  >
                    Administrateur
                  </div>
                )}
              </div>
              {!u.IsAdmin && (
                <Btn variant="ghost" onClick={() => promote(u.UserId)}>
                  <Crown size={12} /> Promouvoir
                </Btn>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */

export default function AdminView({ onOpenRace, refreshKey, onChanged }) {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [manageRaceId, setManageRaceId] = useState(null);
  const [tick, setTick] = useState(0);

  const reload = () => setTick((t) => t + 1);

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
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [refreshKey, tick]);

  if (loading) return <FullScreenLoader />;

  return (
    <div className="px-4 sm:px-8 py-10 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <div
            className="inline-flex items-center gap-2 mb-3 px-3 py-1"
            style={{ backgroundColor: COLOR.gold, color: "#000" }}
          >
            <Crown size={14} />
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ fontFamily: FONT_BODY }}
            >
              Espace administrateur
            </span>
          </div>
          <h1
            style={{ fontFamily: FONT_DISPLAY, letterSpacing: 2, lineHeight: 0.9 }}
            className="text-5xl sm:text-7xl uppercase"
          >
            Pilotage
          </h1>
        </div>
        <div className="flex gap-3">
          <Btn variant="ghost" onClick={() => setShowUsers(true)}>
            <Users size={16} /> Utilisateurs
          </Btn>
          <Btn onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Nouvelle course
          </Btn>
        </div>
      </div>

      {error && <div className="mb-6"><ErrorBanner>{error}</ErrorBanner></div>}

      {races.length === 0 ? (
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
            Aucune course créée
          </h3>
          <p style={{ color: COLOR.muted, marginBottom: 20 }}>
            Commence en créant ta première course.
          </p>
          <Btn onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Créer une course
          </Btn>
        </div>
      ) : (
        <div className="space-y-3">
          {races.map((r) => {
            const taken = r.ParticipantCount || 0;
            const total = r.TotalCars || 0;
            const pot = Number(r.Pot || 0);
            return (
              <div
                key={r.RaceId}
                className="flex flex-wrap items-center gap-4 p-5"
                style={{
                  backgroundColor: COLOR.bgCard,
                  border: `1px solid ${COLOR.border}`,
                }}
              >
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={r.Status} />
                    {r.RaceDate && (
                      <span className="text-xs" style={{ color: COLOR.muted }}>
                        {formatDate(r.RaceDate)}
                      </span>
                    )}
                  </div>
                  <h3
                    style={{ fontFamily: FONT_DISPLAY, letterSpacing: 1 }}
                    className="text-2xl uppercase leading-tight"
                  >
                    {r.Name}
                  </h3>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-[10px] uppercase" style={{ color: COLOR.muted }}>
                      Pigés
                    </div>
                    <div style={{ fontFamily: FONT_MONO }} className="font-bold">
                      {taken}/{total}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase" style={{ color: COLOR.muted }}>
                      Cagnotte
                    </div>
                    <div
                      style={{ fontFamily: FONT_MONO, color: COLOR.gold }}
                      className="font-bold"
                    >
                      {formatMoney(pot)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase" style={{ color: COLOR.muted }}>
                      Mise
                    </div>
                    <div style={{ fontFamily: FONT_MONO }} className="font-bold">
                      {formatMoney(r.EntryFee)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Btn variant="ghost" onClick={() => onOpenRace(r.RaceId)}>
                    <Eye size={14} /> Voir
                  </Btn>
                  <Btn variant="ghost" onClick={() => setManageRaceId(r.RaceId)}>
                    <Settings size={14} /> Gérer
                  </Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateRaceModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          reload();
          onChanged?.();
        }}
      />

      {manageRaceId && (
        <RaceManageModal
          raceId={manageRaceId}
          onClose={() => {
            setManageRaceId(null);
            reload();
            onChanged?.();
          }}
          onChanged={() => {
            reload();
            onChanged?.();
          }}
        />
      )}

      <UsersModal
        open={showUsers}
        onClose={() => setShowUsers(false)}
        onPromoted={() => onChanged?.()}
      />
    </div>
  );
}
