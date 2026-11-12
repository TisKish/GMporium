import { useState } from "react";
import {
  IonButton,
  IonInput,
  IonLabel,
  IonProgressBar,
  IonSegment,
  IonSegmentButton,
} from "@ionic/react";
import { api } from "./api";
import EquipmentPanel from "./EquipmentPanel";
import InventoryPanel from "./InventoryPanel";

const ABILITIES = [
  ["strength", "STR"],
  ["dexterity", "DEX"],
  ["constitution", "CON"],
  ["intelligence", "INT"],
  ["wisdom", "WIS"],
  ["charisma", "CHA"],
];

function modifier(score) {
  const m = Math.floor((score - 10) / 2);
  return m >= 0 ? `+${m}` : `${m}`;
}

/** One character's sheet: stats, HP tracker, resources, inventory. */
export default function CharacterSheet({ character, onChange }) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [invTab, setInvTab] = useState("inventory");

  // Every mutation returns the updated character, so the UI just swaps it in.
  async function mutate(fn) {
    setError("");
    try {
      onChange(await fn());
      setAmount("");
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="sheet">
      {error && <p className="error">{error}</p>}

      <header>
        <h2>{character.name}</h2>
        <p className="subtitle">
          {character.race} · {character.characterClass} · Level {character.level}
        </p>
      </header>

      <section>
        <h3>Hit Points</h3>
        <IonProgressBar value={character.currentHp / character.maxHp} />
        <p>
          {character.currentHp} / {character.maxHp}
        </p>
        <div className="row">
          <IonInput
            className="amountinput"
            type="number"
            min="1"
            placeholder="amount"
            value={amount}
            onIonInput={(e) => setAmount(e.detail.value ?? "")}
          />
          <IonButton
            onClick={() => mutate(() => api.damage(character.id, Number(amount)))}
          >
            Damage
          </IonButton>
          <IonButton
            onClick={() => mutate(() => api.heal(character.id, Number(amount)))}
          >
            Heal
          </IonButton>
          <IonButton
            color="success"
            onClick={() =>
              window.confirm("Long rest? HP and all resources refill.") &&
              mutate(() => api.longRest(character.id))
            }
          >
            Long Rest
          </IonButton>
        </div>
      </section>

      <section>
        <h3>Ability Scores</h3>
        <div className="abilities">
          {ABILITIES.map(([key, label]) => (
            <div key={key} className="ability">
              <span className="alabel">{label}</span>
              <span className="ascore">{character.abilityScores[key]}</span>
              <span className="amod">{modifier(character.abilityScores[key])}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3>Resources</h3>
        {character.resources.length === 0 && <p className="muted">None tracked.</p>}
        {character.resources.map((r) => (
          <div key={r.id} className="row resource">
            <span>
              {r.name}: {r.current} / {r.max}
            </span>
            <span>
              <button onClick={() => mutate(() => api.useResource(r.id))}>Use</button>
              <button onClick={() => mutate(() => api.restoreResource(r.id))}>
                Restore
              </button>
            </span>
          </div>
        ))}
      </section>

      <section>
        <IonSegment
          value={invTab}
          onIonChange={(e) => setInvTab(e.detail.value)}
        >
          <IonSegmentButton value="inventory">
            <IonLabel>Inventory</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="equipment">
            <IonLabel>Equipment</IonLabel>
          </IonSegmentButton>
        </IonSegment>
        {invTab === "inventory" ? (
          <InventoryPanel character={character} mutate={mutate} />
        ) : (
          <EquipmentPanel character={character} mutate={mutate} />
        )}
      </section>
    </div>
  );
}
