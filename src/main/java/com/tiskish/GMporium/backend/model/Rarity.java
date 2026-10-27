package com.tiskish.GMporium.backend.model;

/**
 * Diablo-style rarity. Purely presentational (item-name color on the
 * frontend) — no stat bonuses hang off it, so it never complicates rules.
 */
public enum Rarity {
    COMMON,
    UNCOMMON,
    RARE,
    VERY_RARE,
    LEGENDARY
}
