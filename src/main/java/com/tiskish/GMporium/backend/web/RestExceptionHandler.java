package com.tiskish.GMporium.backend.web;

import com.tiskish.GMporium.backend.service.CharacterNotFoundException;
import jakarta.persistence.OptimisticLockException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.util.Map;

/**
 * One place that turns exceptions into HTTP statuses with readable bodies.
 * Without this, a CharacterNotFoundException would come back as a generic
 * 500 with a stack trace — leaking internals and confusing API consumers.
 */
@RestControllerAdvice
public class RestExceptionHandler {

    @ExceptionHandler(CharacterNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, String> notFound(CharacterNotFoundException ex) {
        return Map.of("error", ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> badRequest(IllegalArgumentException ex) {
        return Map.of("error", ex.getMessage());
    }

    /**
     * Two tabs open on the same character, both saving HP: the loser's
     * transaction fails on the @Version check. 409 tells the client exactly
     * what happened: refresh and retry, nothing is corrupt.
     */
    @ExceptionHandler(OptimisticLockException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, String> conflict(OptimisticLockException ex) {
        return Map.of("error", "Someone else updated this character just now — refresh and retry.");
    }

    /** Bean validation failures (@NotBlank, @Min, ...) land here as 400s. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> validationFailed(MethodArgumentNotValidException ex) {
        String detail = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + " " + e.getDefaultMessage())
                .sorted()
                .reduce((a, b) -> a + "; " + b)
                .orElse("invalid request");
        return Map.of("error", detail);
    }
}
