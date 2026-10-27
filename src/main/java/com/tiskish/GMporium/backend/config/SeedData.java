package com.tiskish.GMporium.backend.config;

import com.tiskish.GMporium.backend.model.AbilityScores;
import com.tiskish.GMporium.backend.model.InventoryItem;
import com.tiskish.GMporium.backend.model.PlayerCharacter;
import com.tiskish.GMporium.backend.model.TrackedResource;
import com.tiskish.GMporium.backend.repository.CharacterRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeds your actual table on first boot so the app is usable immediately.
 * <p>
 * The stats below are PLACEHOLDERS — I don't know your party's real numbers.
 * Open each sheet in the UI and fix them, or edit this file and restart.
 * (H2 is in-memory, so edits apply on the next boot.)
 */
@Component
public class SeedData implements CommandLineRunner {

    private final CharacterRepository characters;

    public SeedData(CharacterRepository characters) {
        this.characters = characters;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (characters.count() > 0) {
            return; // already seeded
        }

        PlayerCharacter uri = character("Uri", "Hexblood/Eladrin", "Grave Cleric / Pact of the Hag Warlock",
                6, "uri", 45, scores(10, 14, 14, 12, 18, 14));
        addResource(uri, "Channel Divinity", 2);
        addResource(uri, "Pact Spell Slots", 2);
        addItem(uri, "Healing Potion", 2, "2d4+2");

        PlayerCharacter etsuko = character("Etsuko", "Half-orc/Half-oni", "Eldritch Knight Fighter",
                6, "etsuko", 58, scores(18, 14, 16, 12, 10, 8));
        addResource(etsuko, "Action Surge", 1);
        addResource(etsuko, "Second Wind", 1);
        addItem(etsuko, "Healing Potion", 1, "2d4+2");

        PlayerCharacter jelly = character("Jelly", "Satyr", "Circle of Roses Druid / Pact of the Old Wood Warlock",
                6, "jelly", 44, scores(10, 14, 14, 12, 18, 16));
        addResource(jelly, "Wild Shape", 2);
        addResource(jelly, "Druid Spell Slots (3rd)", 2);
        addItem(jelly, "Healing Potion", 1, "2d4+2");

        PlayerCharacter odessa = character("Odessa", "Halfling", "Swarmkeeper Ranger",
                6, "odessa", 48, scores(12, 18, 14, 10, 16, 10));
        addResource(odessa, "Favored Foe", 4);
        addResource(odessa, "Spell Slots (2nd)", 2);
        addItem(odessa, "Healing Potion", 2, "2d4+2");

        characters.save(uri);
        characters.save(etsuko);
        characters.save(jelly);
        characters.save(odessa);
    }

    private PlayerCharacter character(String name, String race, String clazz, int level,
            String owner, int maxHp, AbilityScores scores) {
        PlayerCharacter c = new PlayerCharacter();
        c.setName(name);
        c.setRace(race);
        c.setCharacterClass(clazz);
        c.setLevel(level);
        c.setOwnerUsername(owner);
        c.setMaxHp(maxHp);
        c.setCurrentHp(maxHp);
        c.setAbilityScores(scores);
        return c;
    }

    private AbilityScores scores(int str, int dex, int con, int intel, int wis, int cha) {
        AbilityScores s = new AbilityScores();
        s.setStrength(str);
        s.setDexterity(dex);
        s.setConstitution(con);
        s.setIntelligence(intel);
        s.setWisdom(wis);
        s.setCharisma(cha);
        return s;
    }

    private void addResource(PlayerCharacter c, String name, int max) {
        TrackedResource r = new TrackedResource();
        r.setName(name);
        r.setMax(max);
        r.setCurrent(max);
        r.setCharacter(c);
        c.getResources().add(r);
    }

    private void addItem(PlayerCharacter c, String name, int quantity, String notes) {
        InventoryItem i = new InventoryItem();
        i.setName(name);
        i.setQuantity(quantity);
        i.setNotes(notes);
        i.setCharacter(c);
        c.getItems().add(i);
    }
}
