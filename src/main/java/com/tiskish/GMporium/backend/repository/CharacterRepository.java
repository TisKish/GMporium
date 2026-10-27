package com.tiskish.GMporium.backend.repository;

import com.tiskish.GMporium.backend.model.PlayerCharacter;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CharacterRepository extends JpaRepository<PlayerCharacter, Long> {
    List<PlayerCharacter> findByOwnerUsername(String ownerUsername);
}
