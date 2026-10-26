package com.tiskish.GMporium.web;

import com.tiskish.GMporium.model.InventoryItem;
import com.tiskish.GMporium.model.PlayerCharacter;
import com.tiskish.GMporium.model.TrackedResource;
import com.tiskish.GMporium.service.CharacterService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Thin by design: parse the HTTP request, call the service, return the
 * result. No business logic here — that's what makes the service testable
 * without HTTP.
 */
@RestController
@RequestMapping("/api/characters")
public class CharacterController {

    private final CharacterService service;

    public CharacterController(CharacterService service) {
        this.service = service;
    }

    @GetMapping
    public List<PlayerCharacter> list() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public PlayerCharacter get(@PathVariable("id") Long id) {
        return service.findById(id);
    }

    /** Only the DM creates characters (players get theirs from the DM). */
    @PreAuthorize("hasRole('DM')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PlayerCharacter create(@Valid @RequestBody PlayerCharacter character) {
        return service.create(character);
    }

    @PreAuthorize("hasRole('DM')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("id") Long id) {
        service.delete(id);
    }

    @PostMapping("/{id}/damage")
    public PlayerCharacter damage(@PathVariable("id") Long id,
            @Valid @RequestBody Requests.DamageRequest body) {
        return service.applyDamage(id, body.amount());
    }

    @PostMapping("/{id}/heal")
    public PlayerCharacter heal(@PathVariable("id") Long id,
            @Valid @RequestBody Requests.HealRequest body) {
        return service.applyHeal(id, body.amount());
    }

    @PostMapping("/{id}/long-rest")
    public PlayerCharacter longRest(@PathVariable("id") Long id) {
        return service.longRest(id);
    }

    @PostMapping("/{id}/resources")
    @ResponseStatus(HttpStatus.CREATED)
    public TrackedResource addResource(@PathVariable("id") Long id,
            @Valid @RequestBody Requests.CreateResourceRequest body) {
        return service.addResource(id, body.name(), body.max());
    }

    @PostMapping("/{id}/items")
    @ResponseStatus(HttpStatus.CREATED)
    public InventoryItem addItem(@PathVariable("id") Long id,
            @Valid @RequestBody Requests.CreateItemRequest body) {
        return service.addItem(id, body.name(), body.quantity(), body.notes());
    }
}
