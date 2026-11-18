package com.example.shoptrack.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

// Maps to the existing `inventory` table: one row per appliance with its current stock level.
@Entity
@Table(name = "inventory")
@Data
@NoArgsConstructor
public class InventoryItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "item_name", unique = true, length = 100)
    private String itemName;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "current_stock")
    private Integer currentStock;

    @Column(length = 100)
    private String category;
}
