// =============================================================================
// api.js — Client HTTP qui parle au backend Express.
// Gère le token JWT (stocké dans localStorage) et un format d'erreur cohérent.
// =============================================================================

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const TOKEN_KEY = "gp3r_token";

export const auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (t) => {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  },
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request(method, path, body = null) {
  const headers = { "Content-Type": "application/json" };
  const token = auth.getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: { message: text } };
  }

  if (!res.ok) {
    const err = data?.error || {};
    // Token expiré → on nettoie et laisse remonter
    if (res.status === 401 && err.code === "AUTH_INVALID") auth.clear();
    throw new ApiError(
      err.message || `Erreur HTTP ${res.status}`,
      res.status,
      err.code
    );
  }
  return data;
}

const get = (p) => request("GET", p);
const post = (p, b) => request("POST", p, b);
const put = (p, b) => request("PUT", p, b);
const patch = (p, b) => request("PATCH", p, b);
const del = (p) => request("DELETE", p);

/* ============================================================================
   Endpoints
============================================================================ */

export const api = {
  // Auth
  register: ({ username, password, email }) =>
    post("/api/auth/register", { username, password, email }),
  login: ({ username, password }) =>
    post("/api/auth/login", { username, password }),
  me: () => get("/api/auth/me"),

  // Races (public — auth requise)
  listRaces: () => get("/api/races"),
  getRace: (raceId) => get(`/api/races/${raceId}`),
  joinRace: (raceId, payment = {}) =>
    post(`/api/races/${raceId}/join`, payment),

  // My data
  myRaces: () => get("/api/me/races"),

  // Admin — courses
  createRace: (data) => post("/api/admin/races", data),
  updateRace: (raceId, data) => put(`/api/admin/races/${raceId}`, data),
  changeStatus: (raceId, status) =>
    patch(`/api/admin/races/${raceId}/status`, { status }),
  deleteRace: (raceId) => del(`/api/admin/races/${raceId}`),
  declareWinner: (raceId, carNumber) =>
    post(`/api/admin/races/${raceId}/winner`, { carNumber }),

  // Admin — voitures
  addCar: (raceId, { carNumber, driverName, startPosition }) =>
    post(`/api/admin/races/${raceId}/cars`, {
      carNumber,
      driverName,
      startPosition,
    }),
  addCarsBulk: (raceId, cars) =>
    post(`/api/admin/races/${raceId}/cars/bulk`, { cars }),
  removeCar: (carId) => del(`/api/admin/cars/${carId}`),
  updateCarPosition: (carId, startPosition) =>
    patch(`/api/admin/cars/${carId}/position`, { startPosition }),

  // Admin — révéler/cacher les numéros (feature 1)
  revealNumbers: (raceId, reveal) =>
    post(`/api/admin/races/${raceId}/reveal`, { reveal }),

  // Admin — utilisateurs
  listUsers: () => get("/api/admin/users"),
  promoteUser: (userId) => post(`/api/admin/users/${userId}/promote`),
};
