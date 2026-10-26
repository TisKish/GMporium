package com.tiskish.GMporium;

import com.tiskish.GMporium.model.PlayerCharacter;
import com.tiskish.GMporium.model.TrackedResource;
import com.tiskish.GMporium.service.CharacterNotFoundException;
import com.tiskish.GMporium.service.CharacterService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Service tests run against the real H2 database (no mocks): if the JPA
 * mapping or the transaction boundaries are wrong, these fail. @Transactional
 * on the test rolls everything back, so tests never pollute each other.
 */
@SpringBootTest
@Transactional
class CharacterServiceTest {

    @Autowired
    private CharacterService service;

    private PlayerCharacter newCharacter(String name, int maxHp) {
        PlayerCharacter c = new PlayerCharacter();
        c.setName(name);
        c.setCharacterClass("Fighter");
        c.setLevel(1);
        c.setMaxHp(maxHp);
        return service.create(c);
    }

    @Test
    void newCharacterStartsAtFullHp() {
        PlayerCharacter c = newCharacter("Test", 30);
        assertEquals(30, c.getCurrentHp());
    }

    @Test
    void damageReducesHpButNeverBelowZero() {
        PlayerCharacter c = newCharacter("Test", 30);
        assertEquals(22, service.applyDamage(c.getId(), 8).getCurrentHp());
        assertEquals(0, service.applyDamage(c.getId(), 999).getCurrentHp());
    }

    @Test
    void healRestoresHpButNeverAboveMax() {
        PlayerCharacter c = newCharacter("Test", 30);
        service.applyDamage(c.getId(), 10);
        assertEquals(25, service.applyHeal(c.getId(), 5).getCurrentHp());
        assertEquals(30, service.applyHeal(c.getId(), 999).getCurrentHp());
    }

    @Test
    void longRestRefillsHpAndResources() {
        PlayerCharacter c = newCharacter("Test", 30);
        TrackedResource r = service.addResource(c.getId(), "Rage", 2);
        service.applyDamage(c.getId(), 10);
        service.useResource(r.getId());
        assertEquals(1, service.findById(c.getId()).getResources().get(0).getCurrent());

        PlayerCharacter rested = service.longRest(c.getId());
        assertEquals(30, rested.getCurrentHp());
        assertEquals(2, rested.getResources().get(0).getCurrent());
    }

    @Test
    void unknownCharacterThrows() {
        assertThrows(CharacterNotFoundException.class, () -> service.findById(99999L));
    }

    @Test
    void negativeDamageIsRejected() {
        PlayerCharacter c = newCharacter("Test", 30);
        assertThrows(IllegalArgumentException.class, () -> service.applyDamage(c.getId(), -5));
    }
}
