package com.tiskish.GMporium.backend.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.util.ArrayList;
import java.util.List;

/**
 * One player character. Named PlayerCharacter (not Character) because
 * java.lang.Character already exists and would make imports miserable.
 */
@Entity
@Table(name = "characters")
public class PlayerCharacter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String name;

    private String race;

    // "class" is a reserved word in Java, so the field is characterClass.
    private String characterClass;

    @Min(1)
    private int level;

    /**
     * Login name of the owning player. Square-one simplicity: a plain string.
     * A production app would use a foreign key to a users table instead.
     */
    private String ownerUsername;

    private int maxHp;
    private int currentHp;

    /**
     * Optimistic locking. If two requests load the same character and both
     * try to save HP changes, the second one fails with an
     * OptimisticLockException instead of silently overwriting the first.
     * The API translates that into a 409 ("refresh and retry").
     */
    @Version
    private Long version;

    @Embedded
    private AbilityScores abilityScores = new AbilityScores();

    @OneToMany(mappedBy = "character", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<TrackedResource> resources = new ArrayList<>();

    @OneToMany(mappedBy = "character", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<InventoryItem> items = new ArrayList<>();

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

    public String getRace() {
        return race;
    }

    public void setRace(String race) {
        this.race = race;
    }

    public String getCharacterClass() {
        return characterClass;
    }

    public void setCharacterClass(String characterClass) {
        this.characterClass = characterClass;
    }

    public int getLevel() {
        return level;
    }

    public void setLevel(int level) {
        this.level = level;
    }

    public String getOwnerUsername() {
        return ownerUsername;
    }

    public void setOwnerUsername(String ownerUsername) {
        this.ownerUsername = ownerUsername;
    }

    public int getMaxHp() {
        return maxHp;
    }

    public void setMaxHp(int maxHp) {
        this.maxHp = maxHp;
    }

    public int getCurrentHp() {
        return currentHp;
    }

    public void setCurrentHp(int currentHp) {
        this.currentHp = currentHp;
    }

    public Long getVersion() {
        return version;
    }

    public AbilityScores getAbilityScores() {
        return abilityScores;
    }

    public void setAbilityScores(AbilityScores abilityScores) {
        this.abilityScores = abilityScores;
    }

    public List<TrackedResource> getResources() {
        return resources;
    }

    public List<InventoryItem> getItems() {
        return items;
    }
}
