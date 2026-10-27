package com.tiskish.GMporium.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

/** One line on the character's inventory list. */
@Entity
@Table(name = "inventory_items")
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private int quantity = 1;
    private String notes;

    /** BG3 filter category. Defaults to MISC when the client omits it. */
    @Enumerated(EnumType.STRING)
    private ItemCategory category = ItemCategory.MISC;

    /** Weight of ONE unit, in pounds. Total = weight x quantity. */
    private double weight = 0;

    /** Diablo-style rarity color. Presentational only, no rules hang off it. */
    @Enumerated(EnumType.STRING)
    private Rarity rarity = Rarity.COMMON;

    /**
     * Paper-doll slot this item occupies, or null when it sits in the
     * backpack. Non-null is exactly what "equipped" means — there is no
     * separate boolean to drift out of sync with it.
     */
    @Enumerated(EnumType.STRING)
    private EquipmentSlot equippedSlot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "character_id")
    @JsonBackReference
    private PlayerCharacter character;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public ItemCategory getCategory() {
        return category;
    }

    public void setCategory(ItemCategory category) {
        this.category = category;
    }

    public double getWeight() {
        return weight;
    }

    public void setWeight(double weight) {
        this.weight = weight;
    }

    public Rarity getRarity() {
        return rarity;
    }

    public void setRarity(Rarity rarity) {
        this.rarity = rarity;
    }

    public EquipmentSlot getEquippedSlot() {
        return equippedSlot;
    }

    public void setEquippedSlot(EquipmentSlot equippedSlot) {
        this.equippedSlot = equippedSlot;
    }

    /** Convenience for the frontend: equipped means "has a slot". */
    public boolean isEquipped() {
        return equippedSlot != null;
    }

    public PlayerCharacter getCharacter() {
        return character;
    }

    public void setCharacter(PlayerCharacter character) {
        this.character = character;
    }
}
