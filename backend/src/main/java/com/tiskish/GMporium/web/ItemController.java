package com.tiskish.GMporium.backend.web;

import com.tiskish.GMporium.backend.model.PlayerCharacter;
import com.tiskish.GMporium.backend.service.CharacterService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

/**
 * Inventory mutations: equip, unequip, use, drop. Every one returns the
 * updated character, matching the app's UI convention (the frontend swaps
 * the returned character straight into its list).
 */
@RestController
public class ItemController {

    private final CharacterService service;

    public ItemController(CharacterService service) {
        this.service = service;
    }

    @PostMapping("/api/items/{id}/equip")
    public PlayerCharacter equip(@PathVariable("id") Long id,
            @Valid @RequestBody Requests.EquipItemRequest body) {
        return service.equipItem(id, body.slot());
    }

    @PostMapping("/api/items/{id}/unequip")
    public PlayerCharacter unequip(@PathVariable("id") Long id) {
        return service.unequipItem(id);
    }

    @PostMapping("/api/items/{id}/use")
    public PlayerCharacter use(@PathVariable("id") Long id) {
        return service.useItem(id);
    }

    @DeleteMapping("/api/items/{id}")
    public PlayerCharacter drop(@PathVariable("id") Long id) {
        return service.removeItem(id);
    }
}
