package com.tiskish.GMporium.repository;

import com.tiskish.GMporium.model.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemRepository extends JpaRepository<InventoryItem, Long> {
}
