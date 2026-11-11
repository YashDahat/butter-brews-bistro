package com.webappfoundation.butterbrews.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

/** One line on the "Out of the oven" board: what the bakehouse baked today and when it came out. */
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "bb_bake_drop")
public class BakeDrop {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String name;
    /** Optional link to the menu Product so the board can add it to the cart. */
    private Long productId;
    @Column(nullable = false)
    private LocalDate bakeDate;
    /** "HH:mm" the batch is / was due out of the oven. */
    @Column(length = 5)
    private String outAt;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    @Builder.Default
    private BakeStatus status = BakeStatus.IN_THE_OVEN;
    @Column(length = 140)
    private String note;
    @Builder.Default
    private Integer sortOrder = 0;
    private Instant updatedAt;
}
