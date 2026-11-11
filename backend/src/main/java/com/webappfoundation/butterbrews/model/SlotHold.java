package com.webappfoundation.butterbrews.model;

import jakarta.persistence.*;
import lombok.*;

/** Seats held for one (area, slot). Touched only through SeatingInventoryProvider via the fenced InventoryService. */
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "bb_slot_hold", uniqueConstraints = @UniqueConstraint(columnNames = {"areaId", "slotKey"}))
public class SlotHold {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Long areaId;
    @Column(nullable = false, length = 20)
    private String slotKey;
    @Column(nullable = false)
    @Builder.Default
    private Integer reserved = 0;
}
