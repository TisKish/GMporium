// All backend calls go through here. The Vite dev server proxies /api/*
// to the Spring Boot backend (see vite.config.js), so these are same-origin
// fetches with no CORS headaches.
//
// Auth: HTTP Basic, credentials kept in memory only. That's fine for local
// dev; a deployed app would use a session cookie or token instead.
let credentials = null;

export function setCredentials(username, password) {
  credentials = btoa(`${username}:${password}`);
}

export function clearCredentials() {
  credentials = null;
}

async function request(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(credentials ? { Authorization: `Basic ${credentials}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) throw new Error("Bad username or password");
  if (res.status === 403) throw new Error("Only the DM can do that");
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  listCharacters: () => request("/api/characters"),
  getCharacter: (id) => request(`/api/characters/${id}`),
  damage: (id, amount) =>
    request(`/api/characters/${id}/damage`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),
  heal: (id, amount) =>
    request(`/api/characters/${id}/heal`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),
  longRest: (id) =>
    request(`/api/characters/${id}/long-rest`, { method: "POST" }),
  useResource: (id) =>
    request(`/api/resources/${id}/use`, { method: "POST" }),
  restoreResource: (id) =>
    request(`/api/resources/${id}/restore`, { method: "POST" }),
  // Item mutations all return the updated character, like every other
  // mutation in this app, so the UI just swaps it in.
  addItem: (characterId, item) =>
    request(`/api/characters/${characterId}/items`, {
      method: "POST",
      body: JSON.stringify(item),
    }),
  dropItem: (id) =>
    request(`/api/items/${id}`, { method: "DELETE" }),
  equipItem: (id, slot) =>
    request(`/api/items/${id}/equip`, {
      method: "POST",
      body: JSON.stringify({ slot }),
    }),
  unequipItem: (id) =>
    request(`/api/items/${id}/unequip`, { method: "POST" }),
  useItem: (id) =>
    request(`/api/items/${id}/use`, { method: "POST" }),
};
