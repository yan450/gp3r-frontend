// =============================================================================
// AuthScreen.jsx — Écran connexion / inscription
// =============================================================================

import React, { useState } from "react";
import { Flag, Eye, EyeOff, ArrowRight, Crown } from "lucide-react";
import { Btn, Input, ErrorBanner, CheckerStrip } from "../components/UI.jsx";
import { COLOR, FONT_DISPLAY } from "../lib/format.js";
import { api, auth } from "../lib/api.js";

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", password: "", confirm: "", email: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.username.trim() || !form.password) {
      setError("Tous les champs sont requis.");
      return;
    }

    if (mode === "register") {
      if (form.password.length < 6) {
        setError("Mot de passe trop court (6+ caractères).");
        return;
      }
      if (form.password !== form.confirm) {
        setError("Les mots de passe ne correspondent pas.");
        return;
      }
    }

    setLoading(true);
    try {
      const res =
        mode === "login"
          ? await api.login({ username: form.username.trim(), password: form.password })
          : await api.register({
              username: form.username.trim(),
              password: form.password,
              email: form.email.trim() || null,
            });

      auth.setToken(res.token);
      onAuthenticated(res.user);
    } catch (err) {
      setError(err.message || "Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: COLOR.bg, color: COLOR.text }}
    >
      <CheckerStrip height={14} />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div
              className="inline-flex items-center justify-center w-20 h-20 mb-6"
              style={{ backgroundColor: COLOR.red }}
            >
              <Flag size={42} color="white" strokeWidth={2.5} />
            </div>
            <h1
              style={{ fontFamily: FONT_DISPLAY, lineHeight: 0.9, letterSpacing: 2 }}
              className="text-6xl sm:text-7xl mb-3"
            >
              GP<span style={{ color: COLOR.red }}>3</span>R
            </h1>
            <div
              style={{ fontFamily: FONT_DISPLAY, letterSpacing: 4, color: COLOR.muted }}
              className="text-xl uppercase"
            >
              ─ Tirages ─
            </div>
            <p className="mt-4 text-sm" style={{ color: COLOR.muted }}>
              Le pool officiel pour piger des numéros de voiture
            </p>
          </div>

          <div
            className="p-8"
            style={{
              backgroundColor: COLOR.bgCard,
              border: `1px solid ${COLOR.border}`,
            }}
          >
            <div className="flex gap-1 mb-6" style={{ backgroundColor: COLOR.bg, padding: 4 }}>
              {["login", "register"].map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setError("");
                  }}
                  style={{
                    backgroundColor: mode === m ? COLOR.red : "transparent",
                    color: mode === m ? "#fff" : COLOR.muted,
                  }}
                  className="flex-1 py-2 text-sm font-bold uppercase tracking-wider transition-colors"
                >
                  {m === "login" ? "Connexion" : "Inscription"}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-4">
              <Input
                label="Nom d'utilisateur"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="ex: jeremie"
                autoComplete="username"
                disabled={loading}
              />

              {mode === "register" && (
                <Input
                  label="Courriel (optionnel)"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="exemple@courriel.com"
                  autoComplete="email"
                  disabled={loading}
                />
              )}

              <div className="relative">
                <Input
                  label="Mot de passe"
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-3 top-9 p-1"
                  style={{ color: COLOR.muted }}
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {mode === "register" && (
                <Input
                  label="Confirmer le mot de passe"
                  type={showPwd ? "text" : "password"}
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  disabled={loading}
                />
              )}

              <ErrorBanner>{error}</ErrorBanner>

              <Btn type="submit" className="w-full" disabled={loading}>
                {loading
                  ? "Veuillez patienter…"
                  : mode === "login"
                  ? "Se connecter"
                  : "Créer mon compte"}
                {!loading && <ArrowRight size={16} />}
              </Btn>

              {mode === "register" && (
                <p
                  className="text-xs text-center"
                  style={{ color: COLOR.gold }}
                >
                  <Crown size={12} className="inline mr-1" />
                  Le premier compte créé sera administrateur
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
