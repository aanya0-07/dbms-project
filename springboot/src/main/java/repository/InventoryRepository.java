package com.example.shoptrack.repository;

import com.example.shoptrack.model.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InventoryRepository extends JpaRepository<InventoryItem, Integer> {
    Optional<InventoryItem> findByItemName(String itemName);
}
