import { useState } from "react";
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

  const hpPct = Math.round((character.currentHp / character.maxHp) * 100);

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
        <div className="hpbar">
          <div className="hpfill" style={{ width: `${hpPct}%` }} />
          <span>
            {character.currentHp} / {character.maxHp}
          </span>
        </div>
        <div className="row">
          <input
            type="number"
            min="1"
            placeholder="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button
            onClick={() => mutate(() => api.damage(character.id, Number(amount)))}
          >
            Damage
          </button>
          <button
            onClick={() => mutate(() => api.heal(character.id, Number(amount)))}
          >
            Heal
          </button>
          <button
            className="rest"
            onClick={() =>
              window.confirm("Long rest? HP and all resources refill.") &&
              mutate(() => api.longRest(character.id))
            }
          >
            Long Rest
          </button>
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
        <div className="tabs invtabs">
          <button
            className={invTab === "inventory" ? "active" : ""}
            onClick={() => setInvTab("inventory")}
          >
            Inventory
          </button>
          <button
            className={invTab === "equipment" ? "active" : ""}
            onClick={() => setInvTab("equipment")}
          >
            Equipment
          </button>
        </div>
        {invTab === "inventory" ? (
          <InventoryPanel character={character} mutate={mutate} />
        ) : (
          <EquipmentPanel character={character} mutate={mutate} />
        )}
      </section>
    </div>
  );
}
