package com.tiskish.GMporium.web;

import com.tiskish.GMporium.model.TrackedResource;
import com.tiskish.GMporium.service.CharacterService;
import org.springframework.web.bind.annotation.*;

/** Spend/restore tracked resources. Item mutations live in ItemController. */
@RestController
public class ResourceController {

    private final CharacterService service;

    public ResourceController(CharacterService service) {
        this.service = service;
    }

    @PostMapping("/api/resources/{id}/use")
    public TrackedResource use(@PathVariable("id") Long id) {
        return service.useResource(id);
    }

    @PostMapping("/api/resources/{id}/restore")
    public TrackedResource restore(@PathVariable("id") Long id) {
        return service.restoreResource(id);
    }
}
