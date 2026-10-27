package com.tiskish.GMporium.model;

/**
 * BG3-style filter tabs. Every item has exactly one category, which is what
 * the inventory screen filters on. Categories also drive the equip rules:
 * only WEAPON, ARMOR and TREASURE (jewelry) can be equipped, and each maps
 * to a fixed set of slots (see CharacterService.EQUIPPABLE_SLOTS).
 */
public enum ItemCategory {
    WEAPON,
    ARMOR,
    CONSUMABLE,
    GEAR,
    TOOL,
    TREASURE,
    MISC
}
