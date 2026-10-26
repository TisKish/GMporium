package com.tiskish.GMporium.web;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

/**
 * Request bodies as records: immutable, no boilerplate, and validation
 * annotations work on record components. Controllers take these instead of
 * raw Maps — typed contracts are easier to test and to document.
 */
public final class Requests {

    private Requests() {
    }

    public record DamageRequest(@Min(1) int amount) {
    }

    public record HealRequest(@Min(1) int amount) {
    }

    public record CreateResourceRequest(@NotBlank String name, @Min(1) int max) {
    }

    public record CreateItemRequest(@NotBlank String name, @Min(1) int quantity, String notes) {
    }
}
