package com.example.shoptrack.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "sales_history") // This links it to the MySQL table we talked about
public class Sale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String transactionId;

    @Column(columnDefinition = "TEXT") // Allows for a long list of items
    private String itemsSummary;

    private Double totalAmount;

    private LocalDateTime saleDate = LocalDateTime.now();
}