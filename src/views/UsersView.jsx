// =============================================================================
// UsersView.jsx — Gestion complète des utilisateurs (admin)
// Liste + fiche détaillée + reset password + activer/désactiver + supprimer
// =============================================================================

import React, { useState, useEffect } from "react";
import {
  Crown,
  ChevronLeft,
  ChevronRight,
  Key,
  UserX,
  UserCheck,
  Trash2,
  Trophy,
  Wallet,
  Mail,
  Calendar,
  Shield,
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  Btn,
  Badge,
  Modal,
  Input,
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

/* ==========================================================================
   Modal de réinitialisation du mot de passe
========================================================================== */
function ResetPasswordModal({ open, onClose, onConfirm, username }) {
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setPwd("");
      setConfirm("");
      setError("");
    }
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (pwd.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }
    if (pwd !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setBusy(true);
    try {
      await onConfirm(pwd);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Réinitialiser le mot de passe">
      <form onSubmit={submit} className="space-y-4">
        <p style={{ color: COLOR.muted }}>
          Définir un nouveau mot de passe pour <strong>{username}</strong>. Tu
          devras le lui communiquer.
        </p>
        <Input
          label="Nouveau mot de passe"
          type="text"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          placeholder="min. 6 caractères"
        />
        <Input
          label="Confirmer"
          type="text"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <ErrorBanner>{error}</ErrorBanner>
        <div className="flex gap-3 pt-2">
          <Btn variant="ghost" onClick={onClose} type="button" className="flex-1" disabled={busy}>
            Annuler
          </Btn>
          <Btn type="submit" className="flex-1" disabled={busy}>
            <Key size={16} /> {busy ? "…" : "Réinitialiser"}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

/* ==========================================================================
   Modal de suppression définitive
========================================================================== */
function DeleteUserModal({ open, onClose, onConfirm, username }) {
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setConfirmText("");
      setError("");
    }
  }, [open]);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await onConfirm();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Supprimer définitivement">
      <div className="space-y-4">
        <div
          className="p-4 flex items-start gap-3"
          style={{ backgroundColor: "#3d0d0d", color: "#f87171" }}
        >
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong>Action irréversible.</strong> Ceci supprimera{" "}
            <strong>{username}</strong> ainsi que toutes ses participations et
            son historique de paiements. Les courses qu'il a créées seront
            réattribuées à ton compte.
          </div>
        </div>
        <p className="text-sm" style={{ color: COLOR.muted }}>
          Pour confirmer, tape le nom d'utilisateur <strong>{username}</strong>{" "}
          ci-dessous :
        </p>
        <Input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={username}
        />
        <ErrorBanner>{error}</ErrorBanner>
        <div className="flex gap-3 pt-2">
          <Btn variant="ghost" onClick={onClose} type="button" className="flex-1" disabled={busy}>
            Annuler
          </Btn>
          <Btn
            variant="danger"
            onClick={submit}
            className="flex-1"
            disabled={busy || confirmText !== username}
          >
            <Trash2 size={16} /> {busy ? "…" : "Supprimer"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

/* ==========================================================================
   Fiche détaillée d'un utilisateur
========================================================================== */
function UserDetail({ userId, currentUserId, onBack, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  const reload = () => setTick((t) => t + 1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getUserDetails(userId)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setError("");
        }
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [userId, tick]);

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

  const handleReset = async (newPassword) => {
    await api.resetUserPassword(userId, newPassword);
    setShowReset(false);
  };

  const toggleActive = (u) =>
    safeRun(async () => {
      await api.setUserActive(userId, !u.IsActive);
      reload();
    });

  const toggleSuspend = (u) =>
    safeRun(async () => {
      await api.suspendUser(userId, !u.IsSuspended);
      reload();
    });

  const handleDelete = async () => {
    await api.deleteUser(userId);
    onChanged?.();
    onBack();
  };

  if (loading) return <FullScreenLoader />;
  if (!data) {
    return (
      <div className="px-8 py-10 max-w-3xl mx-auto">
        <ErrorBanner>{error || "Erreur de chargement."}</ErrorBanner>
        <Btn variant="ghost" onClick={onBack} className="mt-4">
          <ChevronLeft size={16} /> Retour
        </Btn>
      </div>
    );
  }

  const { user, entries, payments, stats } = data;
  const isSelf = String(user.UserId).toLowerCase() === String(currentUserId).toLowerCase();

  return (
    <div className="px-4 sm:px-8 py-10 max-w-5xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm mb-8 hover:opacity-70"
        style={{ color: COLOR.muted }}
      >
        <ChevronLeft size={16} /> Tous les utilisateurs
      </button>

      {error && <div className="mb-6"><ErrorBanner>{error}</ErrorBanner></div>}

      {/* En-tête */}
      <div
        className="p-6 sm:p-8 mb-6"
        style={{
          backgroundColor: COLOR.bgCard,
          border: `1px solid ${COLOR.border}`,
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 flex items-center justify-center text-2xl font-bold flex-shrink-0"
              style={{
                backgroundColor: user.IsAdmin ? COLOR.gold : COLOR.bgRaised,
                color: user.IsAdmin ? "#000" : "#fff",
                fontFamily: FONT_DISPLAY,
              }}
            >
              {user.Username[0].toUpperCase()}
            </div>
            <div>
              <h1
                style={{ fontFamily: FONT_DISPLAY, letterSpacing: 1, lineHeight: 1 }}
                className="text-4xl uppercase mb-2"
              >
                {user.Username}
              </h1>
              <div className="flex flex-wrap gap-2">
                {user.IsAdmin && (
                  <Badge color="gold">
                    <Crown size={11} /> Admin
                  </Badge>
                )}
                {!user.IsActive && (
                  <Badge color="red">
                    <Ban size={11} /> Désactivé
                  </Badge>
                )}
                {user.IsSuspended && (
                  <Badge color="red">
                    <UserX size={11} /> Suspendu
                  </Badge>
                )}
                {user.IsActive && !user.IsSuspended && (
                  <Badge color="green">
                    <CheckCircle2 size={11} /> Actif
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Infos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          <div className="flex items-center gap-2 text-sm" style={{ color: COLOR.muted }}>
            <Mail size={14} /> {user.Email || "Aucun courriel"}
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: COLOR.muted }}>
            <Calendar size={14} /> Inscrit le {formatDate(user.CreatedAt)}
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatBox label="Participations" value={stats?.TotalEntries ?? 0} icon={<Trophy size={16} />} />
        <StatBox label="Victoires" value={stats?.TotalWins ?? 0} icon={<Crown size={16} />} highlight />
        <StatBox label="Total misé" value={formatMoney(stats?.TotalWagered)} icon={<Wallet size={16} />} />
        <StatBox
          label="Solde dû"
          value={formatMoney(user.TotalOwing)}
          icon={<AlertCircle size={16} />}
          danger={Number(user.TotalOwing) > 0}
        />
      </div>

      {/* Actions admin */}
      <div
        className="p-5 mb-6"
        style={{
          backgroundColor: COLOR.bgCard,
          border: `1px solid ${COLOR.border}`,
        }}
      >
        <h3
          style={{ fontFamily: FONT_DISPLAY, letterSpacing: 1 }}
          className="text-lg uppercase mb-4 flex items-center gap-2"
        >
          <Shield size={18} /> Actions administrateur
        </h3>
        {isSelf ? (
          <p className="text-sm" style={{ color: COLOR.muted }}>
            C'est ton propre compte — certaines actions sont désactivées par
            sécurité.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Btn variant="ghost" onClick={() => setShowReset(true)} disabled={busy}>
              <Key size={14} /> Réinitialiser mot de passe
            </Btn>
            <Btn variant="ghost" onClick={() => toggleSuspend(user)} disabled={busy}>
              {user.IsSuspended ? (
                <>
                  <UserCheck size={14} /> Lever la suspension
                </>
              ) : (
                <>
                  <UserX size={14} /> Suspendre
                </>
              )}
            </Btn>
            <Btn variant="ghost" onClick={() => toggleActive(user)} disabled={busy}>
              {user.IsActive ? (
                <>
                  <Ban size={14} /> Désactiver le compte
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} /> Réactiver le compte
                </>
              )}
            </Btn>
            <Btn variant="danger" onClick={() => setShowDelete(true)} disabled={busy}>
              <Trash2 size={14} /> Supprimer définitivement
            </Btn>
          </div>
        )}
      </div>

      {/* Participations */}
      {entries.length > 0 && (
        <section className="mb-6">
          <h2
            style={{ fontFamily: FONT_DISPLAY, letterSpacing: 2 }}
            className="text-2xl uppercase mb-4"
          >
            Participations ({entries.length})
          </h2>
          <div style={{ backgroundColor: COLOR.bgCard, border: `1px solid ${COLOR.border}` }}>
            {entries.map((e, i) => (
              <div
                key={e.EntryId}
                className="flex items-center gap-4 p-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${COLOR.border}` }}
              >
                <div
                  className="w-12 h-12 flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: e.IsWinner ? COLOR.gold : COLOR.bgRaised,
                    color: e.IsWinner ? "#000" : "#fff",
                    fontFamily: FONT_MONO,
                    fontWeight: 800,
                  }}
                >
                  {e.CarNumber}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{e.RaceName}</div>
                  <div className="text-xs" style={{ color: COLOR.muted }}>
                    {e.DriverName || "Pilote inconnu"}
                    {e.DrawRound > 1 && ` · tour ${e.DrawRound}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <PaymentStatusBadge status={e.PaymentStatus} />
                  {e.IsWinner && (
                    <Badge color="gold">
                      <Trophy size={11} />
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Historique paiements */}
      {payments.length > 0 && (
        <section>
          <h2
            style={{ fontFamily: FONT_DISPLAY, letterSpacing: 2 }}
            className="text-2xl uppercase mb-4"
          >
            Historique des paiements ({payments.length})
          </h2>
          <div style={{ backgroundColor: COLOR.bgCard, border: `1px solid ${COLOR.border}` }}>
            {payments.map((p, i) => (
              <div
                key={p.PaymentId}
                className="p-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${COLOR.border}` }}
              >
                <div className="flex items-center gap-4">
                  <div style={{ fontFamily: FONT_MONO }} className="text-lg font-bold flex-shrink-0">
                    {formatMoney(p.Amount)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">
                      {p.Reference || <span style={{ color: COLOR.muted }}>Sans référence</span>}
                    </div>
                    <div className="text-xs" style={{ color: COLOR.muted }}>
                      Déclaré {new Date(p.DeclaredAt).toLocaleDateString("fr-CA")}
                      {p.ConfirmedByUsername && ` · confirmé par ${p.ConfirmedByUsername}`}
                    </div>
                  </div>
                  {p.Status === "confirmed" && (
                    <Badge color="green"><CheckCircle2 size={11} /> Confirmé</Badge>
                  )}
                  {p.Status === "declared" && (
                    <Badge color="yellow"><Clock size={11} /> En attente</Badge>
                  )}
                  {p.Status === "rejected" && (
                    <Badge color="red"><AlertCircle size={11} /> Rejeté</Badge>
                  )}
                </div>
                {(p.UserNote || p.AdminNote) && (
                  <div className="mt-2 text-xs pl-1" style={{ color: COLOR.muted }}>
                    {p.UserNote && <div>Note user : {p.UserNote}</div>}
                    {p.AdminNote && <div>Note admin : {p.AdminNote}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <ResetPasswordModal
        open={showReset}
        onClose={() => setShowReset(false)}
        onConfirm={handleReset}
        username={user.Username}
      />
      <DeleteUserModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        username={user.Username}
      />
    </div>
  );
}

function StatBox({ label, value, icon, highlight, danger }) {
  return (
    <div
      className="p-4"
      style={{
        backgroundColor: COLOR.bgCard,
        border: `1px solid ${COLOR.border}`,
      }}
    >
      <div
        className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest mb-2"
        style={{ color: COLOR.muted }}
      >
        {icon} {label}
      </div>
      <div
        style={{
          fontFamily: FONT_MONO,
          color: danger ? COLOR.red : highlight ? COLOR.gold : COLOR.text,
        }}
        className="text-2xl font-bold"
      >
        {value}
      </div>
    </div>
  );
}

function PaymentStatusBadge({ status }) {
  if (status === "confirmed") return <Badge color="green">Payé</Badge>;
  if (status === "declared") return <Badge color="yellow">Déclaré</Badge>;
  return <Badge color="red">Impayé</Badge>;
}

/* ==========================================================================
   Liste des utilisateurs
========================================================================== */
export default function UsersView({ currentUserId, onBack, refreshKey, onChanged }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [tick, setTick] = useState(0);

  const reload = () => setTick((t) => t + 1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .listUsers()
      .then((res) => {
        if (!cancelled) {
          setUsers(res.users || []);
          setError("");
        }
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [refreshKey, tick]);

  if (selectedUserId) {
    return (
      <UserDetail
        userId={selectedUserId}
        currentUserId={currentUserId}
        onBack={() => setSelectedUserId(null)}
        onChanged={() => {
          reload();
          onChanged?.();
        }}
      />
    );
  }

  if (loading) return <FullScreenLoader />;

  return (
    <div className="px-4 sm:px-8 py-10 max-w-5xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm mb-8 hover:opacity-70"
        style={{ color: COLOR.muted }}
      >
        <ChevronLeft size={16} /> Retour à l'admin
      </button>

      <div className="mb-8">
        <div
          className="inline-flex items-center gap-2 mb-3 px-3 py-1"
          style={{ backgroundColor: COLOR.gold, color: "#000" }}
        >
          <Crown size={14} />
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ fontFamily: FONT_BODY }}
          >
            Administration
          </span>
        </div>
        <h1
          style={{ fontFamily: FONT_DISPLAY, letterSpacing: 2, lineHeight: 0.9 }}
          className="text-5xl sm:text-7xl uppercase"
        >
          Utilisateurs
        </h1>
        <p className="mt-3" style={{ color: COLOR.muted }}>
          {users.length} compte{users.length > 1 ? "s" : ""} au total. Clique sur
          un utilisateur pour voir sa fiche.
        </p>
      </div>

      {error && <div className="mb-6"><ErrorBanner>{error}</ErrorBanner></div>}

      <div style={{ backgroundColor: COLOR.bgCard, border: `1px solid ${COLOR.border}` }}>
        {users.map((u, i) => (
          <button
            key={u.UserId}
            onClick={() => setSelectedUserId(u.UserId)}
            className="w-full flex items-center gap-4 p-4 text-left transition-colors hover:bg-white/5"
            style={{
              borderTop: i === 0 ? "none" : `1px solid ${COLOR.border}`,
              backgroundColor:
                !u.IsActive || u.IsSuspended ? "rgba(225,6,0,0.04)" : "transparent",
            }}
          >
            <div
              className="w-10 h-10 flex items-center justify-center font-bold flex-shrink-0"
              style={{
                backgroundColor: u.IsAdmin ? COLOR.gold : COLOR.bgRaised,
                color: u.IsAdmin ? "#000" : "#fff",
              }}
            >
              {u.Username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold truncate flex items-center gap-2">
                {u.Username}
                {u.IsAdmin && (
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: COLOR.gold }}>
                    admin
                  </span>
                )}
              </div>
              <div className="text-xs truncate" style={{ color: COLOR.muted }}>
                {u.Email || "Aucun courriel"} · inscrit le {formatDate(u.CreatedAt)}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!u.IsActive && (
                <Badge color="red">
                  <Ban size={10} />
                </Badge>
              )}
              {u.IsSuspended && (
                <Badge color="red">
                  <UserX size={10} />
                </Badge>
              )}
              <ChevronRight size={18} style={{ color: COLOR.muted }} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
