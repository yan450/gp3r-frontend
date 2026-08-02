// =============================================================================
// CartView.jsx — Panier + solde de l'utilisateur (déclarer un paiement Interac)
// =============================================================================

import React, { useState, useEffect } from "react";
import {
  Wallet,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  Copy,
  Check,
  Mail,
  User,
  Lock,
} from "lucide-react";
import { Btn, Badge, Modal, ErrorBanner, FullScreenLoader, Input } from "../components/UI.jsx";
import { COLOR, FONT_DISPLAY, FONT_MONO, FONT_BODY, formatMoney, formatDate } from "../lib/format.js";
import { api } from "../lib/api.js";

/* -------------------------------------------------------------------------- */
function CopyableField({ label, value, icon: Icon }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silencieux
    }
  };
  return (
    <button
      onClick={copy}
      className="w-full text-left flex items-center gap-3 p-3 transition-colors hover:opacity-80"
      style={{
        backgroundColor: COLOR.bg,
        border: `1px solid ${COLOR.border}`,
      }}
    >
      <Icon size={16} style={{ color: COLOR.muted }} />
      <div className="flex-1 min-w-0">
        <div
          className="text-[10px] uppercase tracking-widest"
          style={{ color: COLOR.muted }}
        >
          {label}
        </div>
        <div
          style={{ fontFamily: FONT_MONO }}
          className="text-sm font-bold truncate"
        >
          {value || "(non configuré)"}
        </div>
      </div>
      {value && (copied ? <Check size={16} style={{ color: "#4ade80" }} /> : <Copy size={16} style={{ color: COLOR.muted }} />)}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
function DeclarePaymentModal({ open, onClose, onConfirm, amount, interac }) {
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setReference("");
      setNote("");
      setError("");
    }
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onConfirm(reference.trim() || null, note.trim() || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="J'ai envoyé le paiement"
      maxWidth={520}
    >
      <form onSubmit={submit} className="space-y-4">
        <div
          className="p-4"
          style={{
            backgroundColor: COLOR.bg,
            border: `1px solid ${COLOR.gold}`,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: COLOR.muted }}>
              Montant à payer
            </span>
            <span
              style={{ fontFamily: FONT_MONO, color: COLOR.gold }}
              className="text-2xl font-bold"
            >
              {formatMoney(amount)}
            </span>
          </div>
          <p className="text-xs" style={{ color: COLOR.muted }}>
            Envoie ce montant par Interac e-Transfer à{" "}
            <strong>{interac?.email || "(courriel non configuré)"}</strong>
          </p>
        </div>

        <Input
          label="N° de confirmation Interac (optionnel)"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="ex: CA12345XYZ"
        />
        <div>
          <span
            className="block text-xs font-bold uppercase tracking-widest mb-2"
            style={{ color: COLOR.muted, fontFamily: FONT_BODY }}
          >
            Note pour l'administrateur (optionnel)
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="ex: envoyé de ma banque X"
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
          Ta déclaration sera envoyée à l'administrateur qui va vérifier dans sa
          banque avant de confirmer.
        </p>

        <div className="flex gap-3 pt-2">
          <Btn variant="ghost" onClick={onClose} type="button" className="flex-1" disabled={busy}>
            Annuler
          </Btn>
          <Btn variant="gold" type="submit" className="flex-1" disabled={busy}>
            <Send size={16} /> {busy ? "Envoi…" : "Confirmer"}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
export default function CartView({ refreshKey, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeclare, setShowDeclare] = useState(false);
  const [tick, setTick] = useState(0);

  const reload = () => setTick((t) => t + 1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getCart()
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

  const handleDeclare = async (reference, note) => {
    await api.declarePayment(reference, note);
    setShowDeclare(false);
    reload();
    onChanged?.();
  };

  if (loading) return <FullScreenLoader />;
  if (!data) {
    return (
      <div className="px-8 py-10 max-w-3xl mx-auto">
        <ErrorBanner>{error || "Erreur de chargement."}</ErrorBanner>
      </div>
    );
  }

  const { summary, entries, history, interac } = data;
  const unpaid = Number(summary?.UnpaidAmount) || 0;
  const declared = Number(summary?.DeclaredAmount) || 0;
  const total = Number(summary?.TotalOwing) || 0;

  const unpaidEntries = entries.filter((e) => e.PaymentStatus === "unpaid");
  const declaredEntries = entries.filter((e) => e.PaymentStatus === "declared");

  return (
    <div className="px-4 sm:px-8 py-10 max-w-4xl mx-auto">
      <div className="mb-8">
        <div
          className="inline-flex items-center gap-2 mb-3 px-3 py-1"
          style={{ backgroundColor: unpaid > 0 ? COLOR.red : COLOR.bgRaised }}
        >
          <Wallet size={14} />
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ fontFamily: FONT_BODY }}
          >
            Mon panier
          </span>
        </div>
        <h1
          style={{ fontFamily: FONT_DISPLAY, letterSpacing: 2, lineHeight: 0.9 }}
          className="text-5xl sm:text-7xl uppercase mb-3"
        >
          Solde
        </h1>
      </div>

      {error && <div className="mb-6"><ErrorBanner>{error}</ErrorBanner></div>}

      {/* Résumé du solde */}
      <div
        className="p-6 sm:p-8 mb-6"
        style={{
          backgroundColor: COLOR.bgCard,
          border: `2px solid ${unpaid > 0 ? COLOR.red : COLOR.border}`,
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <div
              className="text-[10px] uppercase tracking-widest mb-1"
              style={{ color: COLOR.muted }}
            >
              À payer
            </div>
            <div
              style={{
                fontFamily: FONT_MONO,
                color: unpaid > 0 ? COLOR.red : COLOR.muted,
              }}
              className="text-4xl font-bold"
            >
              {formatMoney(unpaid)}
            </div>
          </div>
          <div>
            <div
              className="text-[10px] uppercase tracking-widest mb-1"
              style={{ color: COLOR.muted }}
            >
              En attente de confirmation
            </div>
            <div
              style={{
                fontFamily: FONT_MONO,
                color: declared > 0 ? COLOR.gold : COLOR.muted,
              }}
              className="text-4xl font-bold"
            >
              {formatMoney(declared)}
            </div>
          </div>
          <div>
            <div
              className="text-[10px] uppercase tracking-widest mb-1"
              style={{ color: COLOR.muted }}
            >
              Total dû
            </div>
            <div
              style={{ fontFamily: FONT_MONO }}
              className="text-4xl font-bold"
            >
              {formatMoney(total)}
            </div>
          </div>
        </div>

        {unpaid > 0 && (
          <div>
            <h3
              style={{ fontFamily: FONT_DISPLAY, letterSpacing: 1 }}
              className="text-lg uppercase mb-3 flex items-center gap-2"
            >
              <Send size={18} style={{ color: COLOR.red }} /> Comment payer
            </h3>
            <p className="text-sm mb-4" style={{ color: COLOR.muted }}>
              Envoie un Interac e-Transfer de{" "}
              <strong style={{ color: COLOR.gold }}>{formatMoney(unpaid)}</strong>{" "}
              aux coordonnées ci-dessous, puis clique le bouton en dessous pour
              me le confirmer.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              <CopyableField label="Courriel" value={interac?.email} icon={Mail} />
              <CopyableField label="Nom" value={interac?.name} icon={User} />
              {interac?.securityPassword && (
                <CopyableField
                  label="Mot de passe (si demandé)"
                  value={interac.securityPassword}
                  icon={Lock}
                />
              )}
            </div>
            <Btn variant="gold" onClick={() => setShowDeclare(true)} className="w-full">
              <Send size={16} /> J'ai envoyé le paiement de {formatMoney(unpaid)}
            </Btn>
          </div>
        )}

        {unpaid === 0 && declared === 0 && (
          <div className="flex items-center gap-3" style={{ color: "#4ade80" }}>
            <CheckCircle2 size={24} />
            <div>
              <div className="font-bold">Tout est réglé !</div>
              <div className="text-xs" style={{ color: COLOR.muted }}>
                Aucun solde à payer pour le moment.
              </div>
            </div>
          </div>
        )}

        {unpaid === 0 && declared > 0 && (
          <div className="flex items-center gap-3" style={{ color: COLOR.gold }}>
            <Clock size={24} />
            <div>
              <div className="font-bold">
                {formatMoney(declared)} en attente de confirmation admin
              </div>
              <div className="text-xs" style={{ color: COLOR.muted }}>
                L'administrateur va vérifier ton virement.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Entrées non payées */}
      {unpaidEntries.length > 0 && (
        <section className="mb-6">
          <h2
            style={{ fontFamily: FONT_DISPLAY, letterSpacing: 2 }}
            className="text-2xl uppercase mb-4 flex items-center gap-3"
          >
            <span className="w-2 h-2" style={{ backgroundColor: COLOR.red }} />
            À payer ({unpaidEntries.length})
          </h2>
          <div
            style={{
              backgroundColor: COLOR.bgCard,
              border: `1px solid ${COLOR.border}`,
            }}
          >
            {unpaidEntries.map((e, i) => (
              <EntryRow key={e.EntryId} entry={e} isFirst={i === 0} />
            ))}
          </div>
        </section>
      )}

      {/* Entrées déclarées, en attente */}
      {declaredEntries.length > 0 && (
        <section className="mb-6">
          <h2
            style={{ fontFamily: FONT_DISPLAY, letterSpacing: 2 }}
            className="text-2xl uppercase mb-4 flex items-center gap-3"
          >
            <span className="w-2 h-2" style={{ backgroundColor: COLOR.gold }} />
            En attente de confirmation ({declaredEntries.length})
          </h2>
          <div
            style={{
              backgroundColor: COLOR.bgCard,
              border: `1px solid ${COLOR.border}`,
            }}
          >
            {declaredEntries.map((e, i) => (
              <EntryRow key={e.EntryId} entry={e} isFirst={i === 0} showDeclaredBadge />
            ))}
          </div>
        </section>
      )}

      {/* Historique */}
      {history.length > 0 && (
        <section>
          <h2
            style={{ fontFamily: FONT_DISPLAY, letterSpacing: 2 }}
            className="text-2xl uppercase mb-4"
          >
            Historique des paiements
          </h2>
          <div
            style={{
              backgroundColor: COLOR.bgCard,
              border: `1px solid ${COLOR.border}`,
            }}
          >
            {history.map((p, i) => (
              <div
                key={p.PaymentId}
                className="flex items-center gap-4 p-4"
                style={{
                  borderTop: i === 0 ? "none" : `1px solid ${COLOR.border}`,
                }}
              >
                <div style={{ fontFamily: FONT_MONO }} className="text-lg font-bold flex-shrink-0">
                  {formatMoney(p.Amount)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">
                    {p.Reference || (
                      <span style={{ color: COLOR.muted }}>Sans référence</span>
                    )}
                  </div>
                  <div className="text-xs" style={{ color: COLOR.muted }}>
                    Déclaré le{" "}
                    {new Date(p.DeclaredAt).toLocaleDateString("fr-CA")}
                  </div>
                </div>
                {p.Status === "confirmed" && (
                  <Badge color="green">
                    <CheckCircle2 size={12} /> Confirmé
                  </Badge>
                )}
                {p.Status === "declared" && (
                  <Badge color="yellow">
                    <Clock size={12} /> En attente
                  </Badge>
                )}
                {p.Status === "rejected" && (
                  <Badge color="red">
                    <AlertCircle size={12} /> Rejeté
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <DeclarePaymentModal
        open={showDeclare}
        onClose={() => setShowDeclare(false)}
        onConfirm={handleDeclare}
        amount={unpaid}
        interac={interac}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
function EntryRow({ entry, isFirst, showDeclaredBadge }) {
  return (
    <div
      className="flex items-center gap-4 p-4"
      style={{
        borderTop: isFirst ? "none" : `1px solid ${COLOR.border}`,
      }}
    >
      <div
        className="w-12 h-12 flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: COLOR.bgRaised,
          fontFamily: FONT_MONO,
          fontWeight: 800,
        }}
      >
        {entry.CarNumber}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold truncate">{entry.RaceName}</div>
        <div className="text-xs" style={{ color: COLOR.muted }}>
          {entry.DriverName || "Pilote inconnu"}
          {entry.DrawRound > 1 && ` · tour ${entry.DrawRound}`}
        </div>
      </div>
      <div
        style={{ fontFamily: FONT_MONO }}
        className="text-lg font-bold flex-shrink-0"
      >
        {formatMoney(entry.AmountPaid)}
      </div>
      {showDeclaredBadge && (
        <Badge color="yellow">
          <Clock size={12} />
        </Badge>
      )}
    </div>
  );
}
