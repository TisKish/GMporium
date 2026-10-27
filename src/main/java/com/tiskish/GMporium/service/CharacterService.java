package com.tiskish.GMporium.service;

import com.tiskish.GMporium.model.EquipmentSlot;
import com.tiskish.GMporium.model.InventoryItem;
import com.tiskish.GMporium.model.ItemCategory;
import com.tiskish.GMporium.model.PlayerCharacter;
import com.tiskish.GMporium.model.Rarity;
import com.tiskish.GMporium.model.TrackedResource;
import com.tiskish.GMporium.repository.CharacterRepository;
import com.tiskish.GMporium.repository.ItemRepository;
import com.tiskish.GMporium.repository.ResourceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

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
    public InventoryItem addItem(Long characterId, String name, int quantity, String notes,
            ItemCategory category, double weight, Rarity rarity) {
        if (weight < 0) {
            throw new IllegalArgumentException("item weight cannot be negative");
        }
        PlayerCharacter c = findById(characterId);
        InventoryItem item = new InventoryItem();
        item.setName(name);
        item.setQuantity(Math.max(1, quantity));
        item.setNotes(notes);
        item.setCategory(category == null ? ItemCategory.MISC : category);
        item.setWeight(weight);
        item.setRarity(rarity == null ? Rarity.COMMON : rarity);
        item.setCharacter(c);
        c.getItems().add(item);
        return items.save(item);
    }

    /**
     * Which slots each equippable category may occupy. Everything else
     * (CONSUMABLE, GEAR, TOOL, MISC) is backpack-only. GEAR includes
     * OFF_HAND so shields have a home; two-handed weapons blocking the
     * off hand is a deferred rule, not an oversight — see SETUP.md.
     */
    private static final Map<ItemCategory, Set<EquipmentSlot>> EQUIPPABLE_SLOTS = new EnumMap<>(Map.of(
            ItemCategory.WEAPON, Set.of(EquipmentSlot.MAIN_HAND, EquipmentSlot.OFF_HAND),
            ItemCategory.GEAR, Set.of(
                    EquipmentSlot.HEAD, EquipmentSlot.SHOULDERS, EquipmentSlot.CHEST,
                    EquipmentSlot.HANDS, EquipmentSlot.WAIST, EquipmentSlot.LEGS,
                    EquipmentSlot.FEET, EquipmentSlot.OFF_HAND),
            ItemCategory.TREASURE, Set.of(
                    EquipmentSlot.NECK, EquipmentSlot.RING_1, EquipmentSlot.RING_2)));

    /** Equip into a slot, swapping whatever was there back to the backpack. */
    @Transactional
    public PlayerCharacter equipItem(Long itemId, EquipmentSlot slot) {
        InventoryItem item = findItem(itemId);
        Set<EquipmentSlot> allowed = EQUIPPABLE_SLOTS.get(item.getCategory());
        if (allowed == null || !allowed.contains(slot)) {
            throw new IllegalArgumentException(
                    "A " + item.getCategory() + " cannot go in the " + slot + " slot");
        }
        PlayerCharacter c = item.getCharacter();
        c.getItems().stream()
                .filter(i -> slot.equals(i.getEquippedSlot()))
                .forEach(i -> i.setEquippedSlot(null)); // swap out, don't delete
        item.setEquippedSlot(slot);
        return c;
    }

    @Transactional
    public PlayerCharacter unequipItem(Long itemId) {
        InventoryItem item = findItem(itemId);
        item.setEquippedSlot(null);
        return item.getCharacter();
    }

    /**
     * Use one charge of a consumable (potion, ration, arrow bundle...).
     * Quantity hits zero and the stack disappears, same as BG3.
     */
    @Transactional
    public PlayerCharacter useItem(Long itemId) {
        InventoryItem item = findItem(itemId);
        if (item.getCategory() != ItemCategory.POTION) {
            throw new IllegalArgumentException("Only potions can be used");
        }
        if (item.isEquipped()) {
            throw new IllegalArgumentException("Unequip an item before using it");
        }
        item.setQuantity(item.getQuantity() - 1);
        PlayerCharacter c = item.getCharacter();
        if (item.getQuantity() <= 0) {
            c.getItems().remove(item);
            items.delete(item);
        }
        return c;
    }

    @Transactional
    public PlayerCharacter removeItem(Long itemId) {
        InventoryItem item = findItem(itemId);
        PlayerCharacter c = item.getCharacter();
        c.getItems().remove(item);
        items.delete(item);
        return c;
    }

    private InventoryItem findItem(Long itemId) {
        return items.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("No item with id " + itemId));
    }
}
