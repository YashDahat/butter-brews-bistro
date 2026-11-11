package com.webappfoundation.butterbrews.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "bb_idea_vote", uniqueConstraints = @UniqueConstraint(columnNames = {"ideaId", "userId"}))
public class IdeaVote {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Long ideaId;
    @Column(nullable = false)
    private Integer userId;
    private Instant createdAt;
}
