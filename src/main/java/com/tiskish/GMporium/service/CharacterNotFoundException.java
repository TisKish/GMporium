package com.tiskish.GMporium.service;

/**
 * Thrown when a character id doesn't exist. The API layer turns this into a
 * 404.
 */
public class CharacterNotFoundException extends RuntimeException {
    public CharacterNotFoundException(Long id) {
        super("No character with id " + id);
    }
}
