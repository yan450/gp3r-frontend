// =============================================================================
// PaymentsView.jsx — Vue admin des paiements (à confirmer / rejeter, suspendre)
// =============================================================================

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  X,
  Clock,
  Crown,
  UserX,
  UserCheck,
  Wallet,
  Copy,
  Check,
  ChevronLeft,
} from "lucide-react";
import { Btn, Badge, ErrorBanner, FullScreenLoader, Modal, Input } from "../components/UI.jsx";
import { COLOR, FONT_DISPLAY, FONT_MONO, formatMoney, FONT_BODY } from "../lib/format.js";
import { api } from "../lib/api.js";

/* -------------------------------------------------------------------------- */
function ActionModal({ open, onClose, onConfirm, title, message, actionLabel, actionVariant = "primary" }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setNote("");
      setError("");
    }
  }, [open]);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await onConfirm(note.trim() || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p>{message}</p>
        <div>
          <span
            className="block text-xs font-bold uppercase tracking-widest mb-2"
            style={{ color: COLOR.muted, fontFamily: FONT_BODY }}
          >
            Note (optionnel)
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
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
        <div className="flex gap-3 pt-2">
          <Btn variant="ghost" onClick={onClose} type="button" className="flex-1" disabled={busy}>
            Annuler
          </Btn>
          <Btn variant={actionVariant} onClick={submit} className="flex-1" disabled={busy}>
            {busy ? "…" : actionLabel}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
export default function PaymentsView({ onBack, refreshKey, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmModal, setConfirmModal] = useState(null); // { paymentId, amount, username }
  const [rejectModal, setRejectModal] = useState(null);
  const [tick, setTick] = useState(0);

  const reload = () => setTick((t) => t + 1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .listPendingPayments()
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
  }, [refreshKey, tick]);

  const handleConfirm = async (note) => {
    await api.confirmPayment(confirmModal.paymentId, note);
    setConfirmModal(null);
    reload();
    onChanged?.();
  };

  const handleReject = async (note) => {
    await api.rejectPayment(rejectModal.paymentId, note);
    setRejectModal(null);
    reload();
    onChanged?.();
  };

  const toggleSuspend = async (userId, current) => {
    try {
      await api.suspendUser(userId, !current);
      reload();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <FullScreenLoader />;
  if (!data) {
    return (
      <div className="px-8 py-10 max-w-3xl mx-auto">
        <ErrorBanner>{error || "Erreur de chargement."}</ErrorBanner>
      </div>
    );
  }

  const { pending, usersWithBalance } = data;

  return (
    <div className="px-4 sm:px-8 py-10 max-w-6xl mx-auto">
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
          <Wallet size={14} />
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ fontFamily: FONT_BODY }}
          >
            Gestion des paiements
          </span>
        </div>
        <h1
          style={{ fontFamily: FONT_DISPLAY, letterSpacing: 2, lineHeight: 0.9 }}
          className="text-5xl sm:text-7xl uppercase"
        >
          Paiements
        </h1>
      </div>

      {error && <div className="mb-6"><ErrorBanner>{error}</ErrorBanner></div>}

      {/* Section : paiements en attente de confirmation */}
      <section className="mb-10">
        <h2
          style={{ fontFamily: FONT_DISPLAY, letterSpacing: 2 }}
          className="text-2xl uppercase mb-4 flex items-center gap-3"
        >
          <Clock size={20} style={{ color: COLOR.gold }} />
          À confirmer ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <div
            className="p-8 text-center"
            style={{
              backgroundColor: COLOR.bgCard,
              border: `1px dashed ${COLOR.border}`,
              color: COLOR.muted,
            }}
          >
            <CheckCircle2 size={32} className="mx-auto mb-3" />
            Aucun paiement en attente.
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((p) => (
              <div
                key={p.PaymentId}
                className="p-5"
                style={{
                  backgroundColor: COLOR.bgCard,
                  border: `1px solid ${COLOR.gold}`,
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                  <div>
                    <div
                      style={{ fontFamily: FONT_DISPLAY, letterSpacing: 1 }}
                      className="text-3xl uppercase leading-none mb-1"
                    >
                      {p.Username}
                    </div>
                    <div className="text-xs" style={{ color: COLOR.muted }}>
                      Déclaré le{" "}
                      {new Date(p.DeclaredAt).toLocaleString("fr-CA", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>
                  </div>
                  <div
                    style={{ fontFamily: FONT_MONO, color: COLOR.gold }}
                    className="text-4xl font-bold"
                  >
                    {formatMoney(p.Amount)}
                  </div>
                </div>

                {p.Reference && (
                  <div className="mb-2 text-sm">
                    <span style={{ color: COLOR.muted }}>N° confirmation : </span>
                    <span style={{ fontFamily: FONT_MONO }}>{p.Reference}</span>
                  </div>
                )}
                {p.UserNote && (
                  <div className="mb-3 text-sm">
                    <span style={{ color: COLOR.muted }}>Note : </span>
                    <span>{p.UserNote}</span>
                  </div>
                )}

                {p.Entries && p.Entries.length > 0 && (
                  <div className="mb-4">
                    <div
                      className="text-xs uppercase tracking-wider mb-2"
                      style={{ color: COLOR.muted }}
                    >
                      Couvre {p.Entries.length} inscription
                      {p.Entries.length > 1 ? "s" : ""} :
                    </div>
                    <div className="space-y-1">
                      {p.Entries.map((e, i) => (
                        <div key={i} className="text-sm flex justify-between">
                          <span>
                            #{e.CarNumber} — {e.RaceName}
                          </span>
                          <span style={{ fontFamily: FONT_MONO }}>
                            {formatMoney(e.AmountPaid)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Btn
                    variant="ghost"
                    onClick={() =>
                      setRejectModal({
                        paymentId: p.PaymentId,
                        username: p.Username,
                        amount: p.Amount,
                      })
                    }
                    className="flex-1"
                  >
                    <X size={14} /> Rejeter
                  </Btn>
                  <Btn
                    variant="gold"
                    onClick={() =>
                      setConfirmModal({
                        paymentId: p.PaymentId,
                        username: p.Username,
                        amount: p.Amount,
                      })
                    }
                    className="flex-1"
                  >
                    <Check size={14} /> Confirmer
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section : utilisateurs avec un solde */}
      {usersWithBalance.length > 0 && (
        <section>
          <h2
            style={{ fontFamily: FONT_DISPLAY, letterSpacing: 2 }}
            className="text-2xl uppercase mb-4"
          >
            Utilisateurs avec solde ({usersWithBalance.length})
          </h2>
          <div
            style={{
              backgroundColor: COLOR.bgCard,
              border: `1px solid ${COLOR.border}`,
            }}
          >
            {usersWithBalance.map((u, i) => (
              <div
                key={u.UserId}
                className="flex flex-wrap items-center gap-4 p-4"
                style={{
                  borderTop: i === 0 ? "none" : `1px solid ${COLOR.border}`,
                  backgroundColor: u.IsSuspended
                    ? "rgba(225, 6, 0, 0.05)"
                    : "transparent",
                }}
              >
                <div
                  className="w-10 h-10 flex items-center justify-center font-bold flex-shrink-0"
                  style={{
                    backgroundColor: u.IsSuspended ? COLOR.red : COLOR.bgRaised,
                  }}
                >
                  {u.Username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate flex items-center gap-2">
                    {u.Username}
                    {u.IsSuspended && (
                      <Badge color="red">
                        <UserX size={10} /> Suspendu
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs" style={{ color: COLOR.muted }}>
                    {u.OwingEntries} inscription
                    {u.OwingEntries > 1 ? "s" : ""} non payée
                    {u.OwingEntries > 1 ? "s" : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    style={{ fontFamily: FONT_MONO, color: COLOR.red }}
                    className="text-xl font-bold"
                  >
                    {formatMoney(u.TotalOwing)}
                  </div>
                  {Number(u.DeclaredAmount) > 0 && (
                    <div className="text-[10px]" style={{ color: COLOR.gold }}>
                      dont {formatMoney(u.DeclaredAmount)} déclaré
                    </div>
                  )}
                </div>
                <Btn
                  variant={u.IsSuspended ? "ghost" : "danger"}
                  onClick={() => toggleSuspend(u.UserId, u.IsSuspended)}
                >
                  {u.IsSuspended ? (
                    <>
                      <UserCheck size={14} /> Réactiver
                    </>
                  ) : (
                    <>
                      <UserX size={14} /> Suspendre
                    </>
                  )}
                </Btn>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modals */}
      {confirmModal && (
        <ActionModal
          open
          onClose={() => setConfirmModal(null)}
          onConfirm={handleConfirm}
          title="Confirmer le paiement"
          message={`Confirmer avoir reçu ${formatMoney(confirmModal.amount)} de ${confirmModal.username} ? Toutes ses inscriptions associées seront marquées payées.`}
          actionLabel="Oui, j'ai reçu le paiement"
          actionVariant="gold"
        />
      )}
      {rejectModal && (
        <ActionModal
          open
          onClose={() => setRejectModal(null)}
          onConfirm={handleReject}
          title="Rejeter le paiement"
          message={`Rejeter la déclaration de ${formatMoney(rejectModal.amount)} de ${rejectModal.username} ? Ses inscriptions repasseront à "non payées" et il pourra redéclarer plus tard.`}
          actionLabel="Rejeter"
          actionVariant="danger"
        />
      )}
    </div>
  );
}
