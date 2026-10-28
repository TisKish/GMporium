import { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { api, setCredentials, clearCredentials } from "./api";
import CharacterSheet from "./CharacterSheet";

// Capacitor only: the phone app needs to know where the backend lives
// (your PC's LAN IP on the same Wi-Fi). Web dev never sees this field —
// there the Vite proxy handles it. Saved to localStorage on login, so the
// app remembers the server between launches.
const isNative = Capacitor.isNativePlatform();

export default function App() {
  const [user, setUser] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({ username: "", password: "" });
  const [serverUrl, setServerUrl] = useState(
    () => localStorage.getItem("apiBase") || ""
  );
  const [error, setError] = useState("");

  async function login(e) {
    e.preventDefault();
    setError("");
    if (isNative) {
      localStorage.setItem("apiBase", serverUrl.trim());
    }
    setCredentials(form.username, form.password);
    try {
      // Listing characters doubles as a credentials check.
      const chars = await api.listCharacters();
      setCharacters(chars);
      setUser(form.username);
      if (chars.length > 0) setSelectedId(chars[0].id);
    } catch (err) {
      clearCredentials();
      setError(err.message);
    }
  }

  function logout() {
    clearCredentials();
    setUser(null);
    setCharacters([]);
    setSelectedId(null);
    setForm({ username: "", password: "" });
  }

  // Swap the updated character into the list (identity by id).
  function handleChange(updated) {
    setCharacters((cs) => cs.map((c) => (c.id === updated.id ? updated : c)));
  }

  if (!user) {
    return (
      <div className="login">
        <h1>Party Sheets</h1>
        <p className="muted">Character sheets for the table. Log in to begin.</p>
        <form onSubmit={login}>
          <input
            placeholder="username (dm, uri, etsuko, jelly, odessa)"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <input
            type="password"
            placeholder="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {isNative && (
            <>
              <input
                placeholder="Server URL, e.g. http://192.168.1.42:8080"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
              />
              <p className="muted small">
                Your PC's address on the same Wi-Fi as the phone. Find it
                with ipconfig (look for IPv4 Address). Leave it saved once
                and the app remembers it.
              </p>
            </>
          )}
          <button type="submit">Log in</button>
        </form>
        {error && <p className="error">{error}</p>}
        <p className="muted small">Dev logins: dm / dm, or a player name / password</p>
      </div>
    );
  }

  const selected = characters.find((c) => c.id === selectedId);

  return (
    <div className="app">
      <nav>
        <strong>Party Sheets</strong>
        <div className="tabs">
          {characters.map((c) => (
            <button
              key={c.id}
              className={c.id === selectedId ? "active" : ""}
              onClick={() => setSelectedId(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
        <span>
          {user} <button onClick={logout}>log out</button>
        </span>
      </nav>
      {selected && (
        <CharacterSheet character={selected} onChange={handleChange} />
      )}
    </div>
  );
}
