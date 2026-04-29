package com.example.shoptrack.controller;

import com.example.shoptrack.model.Product;
import com.example.shoptrack.model.Sale;
import com.example.shoptrack.repository.ProductRepository;
import com.example.shoptrack.repository.SaleRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:3000") // Allows React to talk to Java
public class ProductController {

    private final ProductRepository repo;     // For current billing
    private final SaleRepository saleRepo;   // For permanent sales history

    // Centralized product prices for easier management
    private static final Map<String, Double> PRODUCT_PRICES = Map.of(
            "refrigerator", 45000.00,
            "washing machine", 32000.00,
            "microwave oven", 15000.00,
            "air conditioner", 55000.00,
            "led tv", 48000.00
    );

    // Constructor Injection: This tells Spring Boot to give the controller both "assistants"
    public ProductController(ProductRepository repo, SaleRepository saleRepo) {
        this.repo = repo;
        this.saleRepo = saleRepo;
    }

    // 1. GET: Fetch all items currently being added to the active bill
    @GetMapping
    public List<Product> getAll() {
        return repo.findAll();
    }

    // 2. POST: Validate appliance selection and add to current bill
    @PostMapping("/validate-and-add")
    public Product validateAndAdd(@RequestBody Map<String, Object> payload) {
        String name = (String) payload.get("name");
        int quantity = Integer.parseInt(payload.get("quantity").toString());

        // Get unit price from the centralized map, default to 0.0 if not found
        double unitPrice = PRODUCT_PRICES.getOrDefault(name.toLowerCase(), 0.0);

        Product p = new Product();
        p.setName(name + " (x" + quantity + ")");
        p.setPrice(unitPrice * quantity);
        p.setStockQty(quantity); // Using this field to store quantity for the bill

        return repo.save(p);
    }

    // 3. POST: Save the Final Bill to Sales History and clear the current bill
    @PostMapping("/save-final-bill")
    public void saveFinalBill(@RequestBody Map<String, Object> payload) {
        Sale sale = new Sale();

        // Generate a unique transaction ID using the current timestamp
        sale.setTransactionId("TRX-" + System.currentTimeMillis());

        // "summary" and "total" come from your React frontend
        sale.setItemsSummary(payload.get("summary").toString());
        sale.setTotalAmount(Double.valueOf(payload.get("total").toString()));

        // Save to the sales_history table
        saleRepo.save(sale);

        // CRITICAL: Clear the current products table so the next customer starts with a fresh bill
        // NOTE: This approach clears the entire 'products' table. In a multi-user environment,
        // this would clear other users' active bills. For a single-user POS, it might be acceptable.
        // A more robust solution for multi-user systems would involve associating products with a
        // specific bill ID or user session and deleting only those.
        repo.deleteAll();
    }

    // 4. DELETE: Remove a specific item if the customer changes their mind
    @DeleteMapping("/{id}")
    public void deleteProduct(@PathVariable Long id) {
        repo.deleteById(id);
    }
    @GetMapping("/history")
    public List<Sale> getSalesHistory() {
        // This tells the saleRepo assistant to go get everything from the history table
        return saleRepo.findAll();
    }

}