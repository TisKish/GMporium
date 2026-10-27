import { useState } from "react";
import { api } from "./api";
import { SLOT_LABELS } from "./EquipmentPanel";

export const CATEGORIES = [
  "WEAPON",
  "ARMOR",
  "CONSUMABLE",
  "GEAR",
  "TOOL",
  "TREASURE",
  "MISC",
];

const CATEGORY_LABELS = {
  WEAPON: "Weapons",
  ARMOR: "Armor",
  CONSUMABLE: "Consumables",
  GEAR: "Gear",
  TOOL: "Tools",
  TREASURE: "Treasure",
  MISC: "Misc",
};

// Mirrors the server's slot-compatibility rules (CharacterService).
// Kept in the UI only to populate the equip dropdown; the server still
// enforces it, so a stale list here fails safe with a 400.
const EQUIPPABLE_SLOTS = {
  WEAPON: ["MAIN_HAND", "OFF_HAND"],
  ARMOR: ["HEAD", "SHOULDERS", "CHEST", "HANDS", "WAIST", "LEGS", "FEET", "OFF_HAND"],
  TREASURE: ["NECK", "RING_1", "RING_2"],
};

const RARITIES = ["COMMON", "UNCOMMON", "RARE", "VERY_RARE", "LEGENDARY"];

/**
 * BG3-style inventory: a grid of item tiles with category filter tabs,
 * search, sort, a detail pane, and a weight bar against STR x 15 capacity.
 * The grid shows the backpack only; worn gear lives on the Equipment tab.
 */
export default function InventoryPanel({ character, mutate }) {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");
  const [selectedId, setSelectedId] = useState(null);
  const [equipSlot, setEquipSlot] = useState("MAIN_HAND");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    quantity: 1,
    category: "MISC",
    weight: 0,
    rarity: "COMMON",
    notes: "",
  });

  // Backpack only: equipped items are shown on the paper doll instead.
  const backpack = character.items.filter((i) => !i.equippedSlot);

  const visible = backpack
    .filter((i) => filter === "ALL" || i.category === filter)
    .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "weight") return b.weight * b.quantity - a.weight * a.quantity;
      if (sort === "quantity") return b.quantity - a.quantity;
      return a.name.localeCompare(b.name);
    });

  const selected = character.items.find((i) => i.id === selectedId) || null;
  const equippable = selected && EQUIPPABLE_SLOTS[selected.category];

  const capacity = character.carryingCapacity ?? 0;
  const totalWeight = character.totalWeight ?? 0;
  const weightPct = capacity > 0 ? Math.min(100, (totalWeight / capacity) * 100) : 0;
  const overCapacity = capacity > 0 && totalWeight > capacity;

  async function addItem(e) {
    e.preventDefault();
    await mutate(() =>
      api.addItem(character.id, {
        ...form,
        quantity: Number(form.quantity),
        weight: Number(form.weight),
      })
    );
    setForm({ name: "", quantity: 1, category: "MISC", weight: 0, rarity: "COMMON", notes: "" });
    setShowForm(false);
  }

  function countFor(cat) {
    return cat === "ALL"
      ? backpack.length
      : backpack.filter((i) => i.category === cat).length;
  }

  return (
    <div>
      <div className="tabs filtertabs">
        {["ALL", ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            className={filter === cat ? "active" : ""}
            onClick={() => {
              setFilter(cat);
              setSelectedId(null);
            }}
          >
            {cat === "ALL" ? "All" : CATEGORY_LABELS[cat]} ({countFor(cat)})
          </button>
        ))}
      </div>

      <div className="row invtools">
        <input
          placeholder="Search inventory..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="name">Sort: Name</option>
          <option value="weight">Sort: Weight</option>
          <option value="quantity">Sort: Quantity</option>
        </select>
      </div>

      {visible.length === 0 && (
        <p className="muted">
          {backpack.length === 0 ? "Empty pockets." : "Nothing matches that filter."}
        </p>
      )}

      <div className="invgrid">
        {visible.map((item) => (
          <button
            key={item.id}
            className={`invitem ${selectedId === item.id ? "selected" : ""}`}
            onClick={() => {
              setSelectedId(item.id);
              const slots = EQUIPPABLE_SLOTS[item.category];
              if (slots) setEquipSlot(slots[0]);
            }}
          >
            <span className={`invname rarity-${item.rarity.toLowerCase()}`}>
              {item.name}
            </span>
            {item.quantity > 1 && <span className="qty">x{item.quantity}</span>}
            <span className="invmeta">
              {CATEGORY_LABELS[item.category]} · {item.weight * item.quantity} lb
            </span>
          </button>
        ))}
      </div>

      {selected && (
        <div className="detail">
          <h4 className={`rarity-${selected.rarity.toLowerCase()}`}>{selected.name}</h4>
          <p className="muted small">
            {selected.rarity.charAt(0) + selected.rarity.slice(1).toLowerCase()} ·{" "}
            {CATEGORY_LABELS[selected.category]} · {selected.weight} lb each ·{" "}
            {selected.weight * selected.quantity} lb total
            {selected.equippedSlot && ` · equipped (${SLOT_LABELS[selected.equippedSlot]})`}
          </p>
          {selected.notes && <p>{selected.notes}</p>}
          <div className="row">
            {selected.equippedSlot && (
              <button
                onClick={() => mutate(() => api.unequipItem(selected.id))}
              >
                Unequip
              </button>
            )}
            {equippable && (
              <>
                <select
                  value={equipSlot}
                  onChange={(e) => setEquipSlot(e.target.value)}
                >
                  {equippable.map((s) => (
                    <option key={s} value={s}>
                      {SLOT_LABELS[s]}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() =>
                    mutate(() => api.equipItem(selected.id, equipSlot))
                  }
                >
                  Equip
                </button>
              </>
            )}
            {selected.category === "CONSUMABLE" && (
              <button onClick={() => mutate(() => api.useItem(selected.id))}>
                Use
              </button>
            )}
            <button
              className="danger"
              onClick={() =>
                window.confirm(`Drop ${selected.name}?`) &&
                mutate(() => api.dropItem(selected.id))
              }
            >
              Drop
            </button>
          </div>
          {equippable && (
            <p className="muted small">
              Equipping into an occupied slot swaps the old item back to your
              backpack.
            </p>
          )}
        </div>
      )}

      <div className="weightbar">
        <div className="weighttrack">
          <div
            className={`weightfill ${overCapacity ? "over" : ""}`}
            style={{ width: `${weightPct}%` }}
          />
        </div>
        <span className={overCapacity ? "error" : "muted"}>
          {totalWeight} / {capacity} lb
          {overCapacity && " — encumbered!"}
        </span>
      </div>

      {!showForm ? (
        <button onClick={() => setShowForm(true)}>Add item</button>
      ) : (
        <form className="addform" onSubmit={addItem}>
          <input
            placeholder="Item name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="number"
            min="1"
            placeholder="Qty"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            step="0.1"
            placeholder="Weight (lb each)"
            value={form.weight}
            onChange={(e) => setForm({ ...form, weight: e.target.value })}
          />
          <select
            value={form.rarity}
            onChange={(e) => setForm({ ...form, rarity: e.target.value })}
          >
            {RARITIES.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0) + r.slice(1).toLowerCase().replace("_", " ")}
              </option>
            ))}
          </select>
          <input
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <button type="submit">Add</button>
          <button type="button" onClick={() => setShowForm(false)}>
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}
