package com.webappfoundation.butterbrews.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/** Admin-editable "Our story" chapter, told as the steps of making a bagel. */
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "bb_story_chapter")
public class StoryChapter {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Integer ordinal;
    /** The bagel step this chapter is named after, e.g. "Mix", "Proof". */
    @Column(nullable = false, length = 24)
    private String step;
    @Column(length = 24)
    private String marker;
    @Column(nullable = false, length = 120)
    private String title;
    @Column(nullable = false, length = 1200)
    private String body;
    @Builder.Default
    private boolean active = true;
    private Instant updatedAt;
}
