package com.webappfoundation.butterbrews.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/** A bookable part of the bistro (indoor tables, outdoor seating) with its own seats-per-slot grid. */
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "bb_seating_area")
public class SeatingArea {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String name;
    @Column(nullable = false, unique = true)
    private String slug;
    @Column(length = 400)
    private String description;
    @Column(nullable = false)
    private Integer seatsPerSlot;
    @Column(nullable = false)
    private Integer maxParty;
    /** "HH:mm" first and last slot start, and slot length in minutes. */
    @Column(nullable = false, length = 5)
    private String firstSlot;
    @Column(nullable = false, length = 5)
    private String lastSlot;
    @Column(nullable = false)
    private Integer slotMinutes;
    @Builder.Default
    private boolean outdoor = false;
    @Builder.Default
    private boolean petFriendly = false;
    @Builder.Default
    private boolean active = true;
    @Builder.Default
    private Integer sortOrder = 0;
    private Instant createdAt;
    private Instant updatedAt;
}
