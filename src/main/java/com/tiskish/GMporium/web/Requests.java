package com.tiskish.GMporium.web;

import com.tiskish.GMporium.model.EquipmentSlot;
import com.tiskish.GMporium.model.ItemCategory;
import com.tiskish.GMporium.model.Rarity;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

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

    /**
     * Category, weight and rarity are optional: omitted means MISC / 0 lb /
     * COMMON (the service applies those defaults). Weight must not be
     * negative when it is supplied.
     */
    public record CreateItemRequest(@NotBlank String name, @Min(1) int quantity, String notes,
            ItemCategory category,
            @DecimalMin(value = "0.0", message = "weight must not be negative") Double weight,
            Rarity rarity) {
    }

    public record EquipItemRequest(@NotNull EquipmentSlot slot) {
    }
}
