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

export default function App() {
  const [bootstrapping, setBootstrapping] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState("home");
  const [selectedRaceId, setSelectedRaceId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
        // Token invalide/expiré → on nettoie
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

  const handleAuthenticated = (user) => {
    setCurrentUser(user);
    setView("home");
  };

  const handleLogout = () => {
    auth.clear();
    setCurrentUser(null);
    setSelectedRaceId(null);
    setView("home");
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

      {view === "admin" && currentUser.isAdmin && (
        <AdminView
          onOpenRace={handleOpenRace}
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
        GP3R Tirages · v1.0
      </footer>
    </div>
  );
}
