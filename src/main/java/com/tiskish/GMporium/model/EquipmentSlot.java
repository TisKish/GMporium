package com.tiskish.GMporium.model;

/**
 * Diablo-style paper-doll slots. One item per slot; equipping into an
 * occupied slot swaps the old item back to the backpack. An item is
 * equipped exactly when its equippedSlot is non-null (see InventoryItem).
 */
public enum EquipmentSlot {
    HEAD,
    NECK,
    SHOULDERS,
    CHEST,
    HANDS,
    WAIST,
    LEGS,
    FEET,
    RING_1,
    RING_2,
    MAIN_HAND,
    OFF_HAND
}
