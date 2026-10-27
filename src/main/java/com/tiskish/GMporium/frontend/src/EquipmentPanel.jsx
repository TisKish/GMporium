import { api } from "./api";

export const SLOT_LABELS = {
  HEAD: "Head",
  NECK: "Neck",
  SHOULDERS: "Shoulders",
  CHEST: "Chest",
  HANDS: "Hands",
  WAIST: "Waist",
  LEGS: "Legs",
  FEET: "Feet",
  RING_1: "Ring",
  RING_2: "Ring",
  MAIN_HAND: "Main Hand",
  OFF_HAND: "Off Hand",
};

// Grid position of each slot on the paper doll (Diablo layout: slots
// arranged around a center portrait).
const SLOT_AREAS = {
  HEAD: "head",
  NECK: "neck",
  SHOULDERS: "shoulders",
  CHEST: "chest",
  HANDS: "hands",
  WAIST: "waist",
  LEGS: "legs",
  FEET: "feet",
  RING_1: "ring1",
  RING_2: "ring2",
  MAIN_HAND: "mainhand",
  OFF_HAND: "offhand",
};

/**
 * Diablo-style equipment screen: a paper doll with one box per slot.
 * Click an equipped item to unequip it back to the backpack. Equipping
 * happens from the Inventory tab, where the slot picker lives.
 */
export default function EquipmentPanel({ character, mutate }) {
  const equipped = {};
  character.items.forEach((i) => {
    if (i.equippedSlot) equipped[i.equippedSlot] = i;
  });

  function slotBox(slot) {
    const item = equipped[slot];
    return (
      <div
        key={slot}
        className={`dollslot ${item ? "filled" : "empty"}`}
        style={{ gridArea: SLOT_AREAS[slot] }}
        title={item ? "Click to unequip" : SLOT_LABELS[slot]}
        onClick={() => item && mutate(() => api.unequipItem(item.id))}
      >
        <span className="slotlabel">{SLOT_LABELS[slot]}</span>
        {item ? (
          <span className={`slotitem rarity-${item.rarity.toLowerCase()}`}>
            {item.name}
          </span>
        ) : (
          <span className="slotempty">Empty</span>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="doll">
        {Object.keys(SLOT_AREAS).map(slotBox)}
        <div className="portrait">
          <span>{character.name.charAt(0)}</span>
          <small>{character.name}</small>
        </div>
      </div>
      <p className="muted small">
        Click an equipped item to unequip it. To equip something, pick a slot
        for it on the Inventory tab.
      </p>
    </div>
  );
}
