import { useState } from "react";
import { api, setCredentials, clearCredentials } from "./api";
import CharacterSheet from "./CharacterSheet";

export default function App() {
  const [user, setUser] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  async function login(e) {
    e.preventDefault();
    setError("");
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
