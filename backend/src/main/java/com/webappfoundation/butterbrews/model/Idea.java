package com.webappfoundation.butterbrews.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/** A guest suggestion for the "Schmear Lab": a new bagel, dish, brew or improvement. */
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "bb_idea")
public class Idea {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Integer userId;
    /** First name only, shown publicly. */
    @Column(length = 40)
    private String authorName;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private IdeaTopic topic;
    @Column(nullable = false, length = 80)
    private String title;
    @Column(length = 600)
    private String details;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    @Builder.Default
    private IdeaStatus status = IdeaStatus.NEW;
    @Column(length = 280)
    private String teamReply;
    @Builder.Default
    private Integer votes = 0;
    private Instant createdAt;
    private Instant updatedAt;
}
