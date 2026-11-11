package com.webappfoundation.butterbrews.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/** A "Get started" step a guest completed that no other table records (e.g. used one-tap reorder). */
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "bb_journey_mark", uniqueConstraints = @UniqueConstraint(columnNames = {"userId", "mark"}))
public class JourneyMark {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Integer userId;
    @Column(nullable = false, length = 32)
    private String mark;
    private Instant createdAt;
}
