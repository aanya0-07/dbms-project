package com.example.shoptrack.controller;

import com.example.shoptrack.model.InventoryItem;
import com.example.shoptrack.repository.InventoryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "http://localhost:3000")
public class InventoryController {

    private final InventoryRepository repo;

    public InventoryController(InventoryRepository repo) {
        this.repo = repo;
    }

    // GET: all stock levels as { "Refrigerator": 5, "LED TV": 2, ... } — the shape the frontend uses
    @GetMapping
    public Map<String, Integer> getInventory() {
        Map<String, Integer> stock = new LinkedHashMap<>();
        for (InventoryItem item : repo.findAll()) {
            stock.put(item.getItemName(), item.getCurrentStock() == null ? 0 : item.getCurrentStock());
        }
        return stock;
    }

    // PUT: set the stock level for one item, creating its row if it doesn't exist yet
    @PutMapping("/{itemName}")
    public Map<String, Integer> setStock(@PathVariable String itemName, @RequestBody Map<String, Object> payload) {
        Object raw = payload.get("stock");
        int stock;
        try {
            stock = Integer.parseInt(String.valueOf(raw));
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "stock must be a whole number");
        }
        if (stock < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "stock cannot be negative");
        }

        InventoryItem item = repo.findByItemName(itemName).orElseGet(() -> {
            InventoryItem created = new InventoryItem();
            created.setItemName(itemName);
            return created;
        });
        item.setCurrentStock(stock);
        repo.save(item);
        return Map.of(itemName, stock);
    }
}
