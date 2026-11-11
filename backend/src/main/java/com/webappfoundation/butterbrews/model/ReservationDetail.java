package com.webappfoundation.butterbrews.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

/** Bistro extras of a table booking. The booking itself is a ₹0 order on the bb-table workflow. */
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "bb_reservation_detail")
public class ReservationDetail {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private Long orderId;
    @Column(nullable = false)
    private Integer userId;
    @Column(nullable = false)
    private Long areaId;
    private String areaName;
    @Column(nullable = false, length = 20)
    private String slotKey;
    @Column(nullable = false)
    private LocalDate slotDate;
    @Column(nullable = false)
    private Integer guests;
    @Column(length = 60)
    private String occasion;
    @Builder.Default
    private boolean withPet = false;
    @Column(length = 280)
    private String note;
    private Instant createdAt;
}
