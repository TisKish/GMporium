package com.tiskish.GMporium.service;

import com.tiskish.GMporium.model.InventoryItem;
import com.tiskish.GMporium.model.PlayerCharacter;
import com.tiskish.GMporium.model.TrackedResource;
import com.tiskish.GMporium.repository.CharacterRepository;
import com.tiskish.GMporium.repository.ItemRepository;
import com.tiskish.GMporium.repository.ResourceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

/**
 * All character rules live here, not in the controller. Controllers handle
 * HTTP; services handle business logic and transactions. Interviewers love
 * asking why — the answer: testability and keeping @Transactional boundaries
 * explicit (a transaction should wrap the whole business operation, which the
 * controller can't guarantee once you add security checks, logging, etc.).
 */
@Service
public class CharacterService {

    private final CharacterRepository characters;
    private final ResourceRepository resources;
    private final ItemRepository items;

    public CharacterService(CharacterRepository characters,
            ResourceRepository resources,
            ItemRepository items) {
        this.characters = characters;
        this.resources = resources;
        this.items = items;
    }

    public List<PlayerCharacter> findAll() {
        return characters.findAll();
    }

    public PlayerCharacter findById(Long id) {
        return characters.findById(id).orElseThrow(() -> new CharacterNotFoundException(id));
    }

    public PlayerCharacter create(PlayerCharacter character) {
        character.setId(null); // never trust a client-supplied id on create
        if (character.getCurrentHp() == 0 && character.getMaxHp() > 0) {
            character.setCurrentHp(character.getMaxHp()); // new characters start full
        }
        return characters.save(character);
    }

    public void delete(Long id) {
        characters.delete(findById(id));
    }

    /**
     * Damage and heal are @Transactional: the read-modify-write happens inside
     * one database transaction, and the @Version field on PlayerCharacter makes
     * concurrent updates fail safe (OptimisticLockException -> HTTP 409)
     * instead of silently losing one player's update.
     */
    @Transactional
    public PlayerCharacter applyDamage(Long id, int amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("damage amount must be positive");
        }
        PlayerCharacter c = findById(id);
        c.setCurrentHp(Math.max(0, c.getCurrentHp() - amount));
        return c;
    }

    @Transactional
    public PlayerCharacter applyHeal(Long id, int amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("heal amount must be positive");
        }
        PlayerCharacter c = findById(id);
        c.setCurrentHp(Math.min(c.getMaxHp(), c.getCurrentHp() + amount));
        return c;
    }

    /** Long rest: full HP and every tracked resource refills. */
    @Transactional
    public PlayerCharacter longRest(Long id) {
        PlayerCharacter c = findById(id);
        c.setCurrentHp(c.getMaxHp());
        c.getResources().forEach(r -> r.setCurrent(r.getMax()));
        return c;
    }

    @Transactional
    public TrackedResource addResource(Long characterId, String name, int max) {
        if (max <= 0) {
            throw new IllegalArgumentException("resource max must be positive");
        }
        PlayerCharacter c = findById(characterId);
        TrackedResource r = new TrackedResource();
        r.setName(name);
        r.setMax(max);
        r.setCurrent(max); // new resources start full
        r.setCharacter(c);
        c.getResources().add(r);
        return resources.save(r);
    }

    @Transactional
    public TrackedResource useResource(Long resourceId) {
        TrackedResource r = resources.findById(resourceId)
                .orElseThrow(() -> new IllegalArgumentException("No resource with id " + resourceId));
        r.setCurrent(Math.max(0, r.getCurrent() - 1));
        return r;
    }

    @Transactional
    public TrackedResource restoreResource(Long resourceId) {
        TrackedResource r = resources.findById(resourceId)
                .orElseThrow(() -> new IllegalArgumentException("No resource with id " + resourceId));
        r.setCurrent(r.getMax());
        return r;
    }

    @Transactional
    public InventoryItem addItem(Long characterId, String name, int quantity, String notes) {
        PlayerCharacter c = findById(characterId);
        InventoryItem item = new InventoryItem();
        item.setName(name);
        item.setQuantity(Math.max(1, quantity));
        item.setNotes(notes);
        item.setCharacter(c);
        c.getItems().add(item);
        return items.save(item);
    }

    @Transactional
    public void removeItem(Long itemId) {
        items.deleteById(itemId);
    }
}
