import { useState } from "react";
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonProgressBar,
  IonRow,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
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
 * BG3-style inventory, Ionic edition: filter segments, a search bar, a
 * card grid, a modal detail sheet, a progress-bar weight meter, and a
 * modal add-item form. The grid shows the backpack only; worn gear lives
 * on the Equipment tab.
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
      <IonSegment
        value={filter}
        onIonChange={(e) => {
          setFilter(e.detail.value);
          setSelectedId(null);
        }}
        scrollable
      >
        {["ALL", ...CATEGORIES].map((cat) => (
          <IonSegmentButton key={cat} value={cat}>
            <IonLabel>
              {cat === "ALL" ? "All" : CATEGORY_LABELS[cat]} ({countFor(cat)})
            </IonLabel>
          </IonSegmentButton>
        ))}
      </IonSegment>

      <IonSearchbar
        value={search}
        debounce={150}
        showClearButton="focus"
        placeholder="Search inventory..."
        onIonInput={(e) => setSearch(e.detail.value ?? "")}
      />

      <IonItem>
        <IonSelect
          value={sort}
          onIonChange={(e) => setSort(e.detail.value)}
          label="Sort"
          interface="action-sheet"
        >
          <IonSelectOption value="name">Name</IonSelectOption>
          <IonSelectOption value="weight">Weight</IonSelectOption>
          <IonSelectOption value="quantity">Quantity</IonSelectOption>
        </IonSelect>
      </IonItem>

      {visible.length === 0 && (
        <IonText color="medium">
          <p>
            {backpack.length === 0 ? "Empty pockets." : "Nothing matches that filter."}
          </p>
        </IonText>
      )}

      <IonGrid>
        <IonRow>
          {visible.map((item) => (
            <IonCol key={item.id} size="6" sizeMd="4">
              <IonCard
                className={`invcard ${selectedId === item.id ? "selected" : ""}`}
                onClick={() => {
                  setSelectedId(item.id);
                  const slots = EQUIPPABLE_SLOTS[item.category];
                  if (slots) setEquipSlot(slots[0]);
                }}
              >
                <IonCardHeader>
                  <IonCardTitle className={`rarity-${item.rarity.toLowerCase()}`}>
                    {item.name}
                    {item.quantity > 1 && ` ×${item.quantity}`}
                  </IonCardTitle>
                  <IonCardSubtitle>
                    {CATEGORY_LABELS[item.category]} · {item.weight * item.quantity} lb
                  </IonCardSubtitle>
                </IonCardHeader>
              </IonCard>
            </IonCol>
          ))}
        </IonRow>
      </IonGrid>

      <IonProgressBar
        value={weightPct / 100}
        color={overCapacity ? "danger" : "primary"}
      />
      <IonText color={overCapacity ? "danger" : "medium"}>
        <p>
          {totalWeight} / {capacity} lb
          {overCapacity && " — encumbered!"}
        </p>
      </IonText>

      <IonButton expand="block" onClick={() => setShowForm(true)}>
        Add item
      </IonButton>

      <IonModal isOpen={selected !== null} onDidDismiss={() => setSelectedId(null)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{selected?.name}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setSelectedId(null)}>Close</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          {selected && (
            <>
              <IonText color="medium">
                <p>
                  {selected.rarity.charAt(0) + selected.rarity.slice(1).toLowerCase()} ·{" "}
                  {CATEGORY_LABELS[selected.category]} · {selected.weight} lb each ·{" "}
                  {selected.weight * selected.quantity} lb total
                  {selected.equippedSlot &&
                    ` · equipped (${SLOT_LABELS[selected.equippedSlot]})`}
                </p>
              </IonText>
              {selected.notes && <p>{selected.notes}</p>}
              {equippable && (
                <IonItem>
                  <IonSelect
                    value={equipSlot}
                    onIonChange={(e) => setEquipSlot(e.detail.value)}
                    label="Equip to"
                    interface="action-sheet"
                  >
                    {equippable.map((s) => (
                      <IonSelectOption key={s} value={s}>
                        {SLOT_LABELS[s]}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
              )}
              <div className="row" style={{ marginTop: "1rem" }}>
                {equippable && (
                  <IonButton
                    onClick={() => mutate(() => api.equipItem(selected.id, equipSlot))}
                  >
                    Equip
                  </IonButton>
                )}
                {selected.equippedSlot && (
                  <IonButton
                    onClick={() => mutate(() => api.unequipItem(selected.id))}
                  >
                    Unequip
                  </IonButton>
                )}
                {selected.category === "CONSUMABLE" && (
                  <IonButton onClick={() => mutate(() => api.useItem(selected.id))}>
                    Use
                  </IonButton>
                )}
                <IonButton
                  color="danger"
                  onClick={() =>
                    window.confirm(`Drop ${selected.name}?`) &&
                    mutate(() => api.dropItem(selected.id))
                  }
                >
                  Drop
                </IonButton>
              </div>
              {equippable && (
                <IonText color="medium">
                  <p className="small">
                    Equipping into an occupied slot swaps the old item back to
                    your backpack.
                  </p>
                </IonText>
              )}
            </>
          )}
        </IonContent>
      </IonModal>

      <IonModal isOpen={showForm} onDidDismiss={() => setShowForm(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Add item</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowForm(false)}>Cancel</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <form onSubmit={addItem}>
            <IonList>
              <IonItem>
                <IonInput
                  label="Item name"
                  labelPlacement="stacked"
                  required
                  value={form.name}
                  onIonInput={(e) => setForm({ ...form, name: e.detail.value ?? "" })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label="Quantity"
                  labelPlacement="stacked"
                  type="number"
                  min="1"
                  value={form.quantity}
                  onIonInput={(e) =>
                    setForm({ ...form, quantity: e.detail.value ?? 1 })
                  }
                />
              </IonItem>
              <IonItem>
                <IonSelect
                  label="Category"
                  labelPlacement="stacked"
                  value={form.category}
                  onIonChange={(e) => setForm({ ...form, category: e.detail.value })}
                  interface="action-sheet"
                >
                  {CATEGORIES.map((c) => (
                    <IonSelectOption key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonInput
                  label="Weight (lb each)"
                  labelPlacement="stacked"
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.weight}
                  onIonInput={(e) =>
                    setForm({ ...form, weight: e.detail.value ?? 0 })
                  }
                />
              </IonItem>
              <IonItem>
                <IonSelect
                  label="Rarity"
                  labelPlacement="stacked"
                  value={form.rarity}
                  onIonChange={(e) => setForm({ ...form, rarity: e.detail.value })}
                  interface="action-sheet"
                >
                  {RARITIES.map((r) => (
                    <IonSelectOption key={r} value={r}>
                      {r.charAt(0) + r.slice(1).toLowerCase().replace("_", " ")}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonInput
                  label="Notes (optional)"
                  labelPlacement="stacked"
                  value={form.notes}
                  onIonInput={(e) => setForm({ ...form, notes: e.detail.value ?? "" })}
                />
              </IonItem>
            </IonList>
            <IonButton expand="block" type="submit" style={{ marginTop: "1rem" }}>
              Add
            </IonButton>
          </form>
        </IonContent>
      </IonModal>
    </div>
  );
}
