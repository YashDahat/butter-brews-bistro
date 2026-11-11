package com.webappfoundation.butterbrews.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "bb_favourite", uniqueConstraints = @UniqueConstraint(columnNames = {"userId", "productId"}))
public class Favourite {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Integer userId;
    @Column(nullable = false)
    private Long productId;
    private Instant createdAt;
}
