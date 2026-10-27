package com.tiskish.GMporium.model;

import jakarta.persistence.Embeddable;

/**
 * The six D&D ability scores, stored as columns on the character's own row
 * (no separate table needed). @Embeddable = "this object's fields live
 * inside the owning entity's table".
 */
@Embeddable
public class AbilityScores {

    private int strength = 10;
    private int dexterity = 10;
    private int constitution = 10;
    private int intelligence = 10;
    private int wisdom = 10;
    private int charisma = 10;

    public int getStrength() {
        return strength;
    }

    public void setStrength(int strength) {
        this.strength = strength;
    }

    public int getDexterity() {
        return dexterity;
    }

    public void setDexterity(int dexterity) {
        this.dexterity = dexterity;
    }

    public int getConstitution() {
        return constitution;
    }

    public void setConstitution(int constitution) {
        this.constitution = constitution;
    }

    public int getIntelligence() {
        return intelligence;
    }

    public void setIntelligence(int intelligence) {
        this.intelligence = intelligence;
    }

    public int getWisdom() {
        return wisdom;
    }

    public void setWisdom(int wisdom) {
        this.wisdom = wisdom;
    }

    public int getCharisma() {
        return charisma;
    }

    public void setCharisma(int charisma) {
        this.charisma = charisma;
    }

    /** The classic D&D ability modifier: (score - 10) / 2, rounded down. */
    public int modifier(int score) {
        return Math.floorDiv(score - 10, 2);
    }
}
