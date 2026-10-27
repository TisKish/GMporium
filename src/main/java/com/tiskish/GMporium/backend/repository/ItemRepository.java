package com.tiskish.GMporium.backend.repository;

import com.tiskish.GMporium.backend.model.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemRepository extends JpaRepository<InventoryItem, Long> {
}
