package com.webappfoundation.butterbrews.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

/** Bistro extras for a foundation Product (menu item): diet marker, signature flag, "new" window, pairing note. */
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "bb_dish_note")
public class DishNote {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private Long productId;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    @Builder.Default
    private Diet diet = Diet.VEG;
    @Builder.Default
    private boolean signature = false;
    /** Shown with a "new" marker until this date (inclusive); null = not new. */
    private LocalDate newUntil;
    @Column(length = 160)
    private String pairing;
    private Instant updatedAt;
}
