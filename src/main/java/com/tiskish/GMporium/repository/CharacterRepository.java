package com.tiskish.GMporium.repository;

import com.tiskish.GMporium.model.PlayerCharacter;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CharacterRepository extends JpaRepository<PlayerCharacter, Long> {
    List<PlayerCharacter> findByOwnerUsername(String ownerUsername);
}
