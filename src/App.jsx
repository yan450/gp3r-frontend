// =============================================================================
// App.jsx — Composant racine. Gère l'authentification, la navigation,
// et la sélection de course.
// =============================================================================

import React, { useState, useEffect } from "react";
import { COLOR } from "./lib/format.js";
import { api, auth, ApiError } from "./lib/api.js";
import { FullScreenLoader } from "./components/UI.jsx";
import Nav from "./components/Nav.jsx";
import AuthScreen from "./views/AuthScreen.jsx";
import HomeView from "./views/HomeView.jsx";
import RaceDetailView from "./views/RaceDetailView.jsx";
import MyRacesView from "./views/MyRacesView.jsx";
import AdminView from "./views/AdminView.jsx";
import CartView from "./views/CartView.jsx";
import PaymentsView from "./views/PaymentsView.jsx";

export default function App() {
  const [bootstrapping, setBootstrapping] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState("home");
  const [selectedRaceId, setSelectedRaceId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [balance, setBalance] = useState(0);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);

  // Vérifie le token au chargement
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!auth.getToken()) {
        if (!cancelled) setBootstrapping(false);
        return;
      }
      try {
        const res = await api.me();
        if (!cancelled) setCurrentUser(res.user);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          auth.clear();
        }
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Rafraîchit le solde utilisateur et les paiements en attente admin
  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    (async () => {
      try {
        const cart = await api.getCart();
        if (!cancelled) {
          setBalance(Number(cart?.summary?.TotalOwing) || 0);
        }
      } catch {
        // silencieux
      }
      if (currentUser.isAdmin) {
        try {
          const pending = await api.listPendingPayments();
          if (!cancelled) {
            setPendingPaymentsCount((pending?.pending || []).length);
          }
        } catch {
          // silencieux
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser, refreshKey]);

  const handleAuthenticated = (user) => {
    setCurrentUser(user);
    setView("home");
  };

  const handleLogout = () => {
    auth.clear();
    setCurrentUser(null);
    setSelectedRaceId(null);
    setView("home");
    setBalance(0);
    setPendingPaymentsCount(0);
  };

  const handleNavigate = (key) => {
    setView(key);
    if (key !== "race-detail") setSelectedRaceId(null);
  };

  const handleOpenRace = (raceId) => {
    setSelectedRaceId(raceId);
    setView("race-detail");
  };

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  if (bootstrapping) return <FullScreenLoader />;

  if (!currentUser) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLOR.bg, color: COLOR.text }}>
      <Nav
        user={currentUser}
        view={view}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        balance={balance}
        pendingPaymentsCount={pendingPaymentsCount}
      />

      {view === "home" && (
        <HomeView
          currentUser={currentUser}
          onOpenRace={handleOpenRace}
          refreshKey={refreshKey}
        />
      )}

      {view === "race-detail" && selectedRaceId && (
        <RaceDetailView
          raceId={selectedRaceId}
          currentUser={currentUser}
          onBack={() => {
            setSelectedRaceId(null);
            setView("home");
          }}
          onChanged={triggerRefresh}
        />
      )}

      {view === "my-races" && (
        <MyRacesView onOpenRace={handleOpenRace} refreshKey={refreshKey} />
      )}

      {view === "cart" && (
        <CartView refreshKey={refreshKey} onChanged={triggerRefresh} />
      )}

      {view === "admin" && currentUser.isAdmin && (
        <AdminView
          onOpenRace={handleOpenRace}
          onOpenPayments={() => setView("payments")}
          refreshKey={refreshKey}
          onChanged={triggerRefresh}
        />
      )}

      {view === "payments" && currentUser.isAdmin && (
        <PaymentsView
          onBack={() => setView("admin")}
          refreshKey={refreshKey}
          onChanged={triggerRefresh}
        />
      )}

      <footer
        className="px-8 py-6 text-center text-xs mt-12"
        style={{
          color: COLOR.muted,
          borderTop: `1px solid ${COLOR.border}`,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        GP3R Tirages · v1.2
      </footer>
    </div>
  );
}
