import { useState } from "react";
import { Capacitor } from "@capacitor/core";
import {
  IonApp,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonText,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
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
      <IonApp>
        <IonPage>
          <IonContent className="ion-padding">
            <div className="login">
              <h1>Party Sheets</h1>
              <p className="muted">Character sheets for the table. Log in to begin.</p>
              <form onSubmit={login}>
                <IonList>
                  <IonItem>
                    <IonInput
                      label="Username"
                      labelPlacement="stacked"
                      placeholder="dm, uri, etsuko, jelly, odessa"
                      value={form.username}
                      onIonInput={(e) =>
                        setForm({ ...form, username: e.detail.value ?? "" })
                      }
                    />
                  </IonItem>
                  <IonItem>
                    <IonInput
                      label="Password"
                      labelPlacement="stacked"
                      type="password"
                      value={form.password}
                      onIonInput={(e) =>
                        setForm({ ...form, password: e.detail.value ?? "" })
                      }
                    />
                  </IonItem>
                  {isNative && (
                    <IonItem>
                      <IonInput
                        label="Server URL"
                        labelPlacement="stacked"
                        placeholder="http://192.168.1.42:8080"
                        value={serverUrl}
                        onIonInput={(e) => setServerUrl(e.detail.value ?? "")}
                      />
                    </IonItem>
                  )}
                </IonList>
                {isNative && (
                  <p className="muted small">
                    Your PC's address on the same Wi-Fi as the phone. Find it
                    with ipconfig (look for IPv4 Address). Leave it saved
                    once and the app remembers it.
                  </p>
                )}
                <IonButton expand="block" type="submit">
                  Log in
                </IonButton>
              </form>
              {error && (
                <IonText color="danger">
                  <p>{error}</p>
                </IonText>
              )}
              <p className="muted small">Dev logins: dm / dm, or a player name / password</p>
            </div>
          </IonContent>
        </IonPage>
      </IonApp>
    );
  }

  const selected = characters.find((c) => c.id === selectedId);

  return (
    <IonApp>
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Party Sheets</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={logout}>Log out ({user})</IonButton>
            </IonButtons>
          </IonToolbar>
          <IonToolbar>
            <IonSegment
              value={selectedId === null ? "" : String(selectedId)}
              onIonChange={(e) => setSelectedId(Number(e.detail.value))}
              scrollable
            >
              {characters.map((c) => (
                <IonSegmentButton key={c.id} value={String(c.id)}>
                  <IonLabel>{c.name}</IonLabel>
                </IonSegmentButton>
              ))}
            </IonSegment>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="app">
            {selected && (
              <CharacterSheet character={selected} onChange={handleChange} />
            )}
          </div>
        </IonContent>
      </IonPage>
    </IonApp>
  );
}
