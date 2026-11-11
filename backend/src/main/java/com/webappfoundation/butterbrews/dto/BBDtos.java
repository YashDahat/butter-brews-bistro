package com.webappfoundation.butterbrews.dto;

import com.webappfoundation.butterbrews.model.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** Request/response shapes for the Butter Brews domain (records serialize as plain JSON). */
public final class BBDtos {
    private BBDtos() {}

    // Menu extras
    public record DishNoteDto(Long id, Long productId, String productName, Diet diet, boolean signature,
                              LocalDate newUntil, boolean isNew, String pairing) {}
    public record UpsertDishNoteRequest(Long productId, Diet diet, Boolean signature, LocalDate newUntil, String pairing) {}

    // Bake board
    public record BakeDropDto(Long id, String name, Long productId, String productSlug, BigDecimal price,
                              LocalDate bakeDate, String outAt, BakeStatus status, String note, Integer sortOrder) {}
    public record UpsertBakeDropRequest(String name, Long productId, LocalDate bakeDate, String outAt,
                                        BakeStatus status, String note, Integer sortOrder) {}
    public record BakeBoardDto(LocalDate date, boolean today, List<BakeDropDto> drops) {}

    // Seating & bookings
    public record SeatingAreaDto(Long id, String name, String slug, String description, Integer seatsPerSlot,
                                 Integer maxParty, String firstSlot, String lastSlot, Integer slotMinutes,
                                 boolean outdoor, boolean petFriendly, boolean active, Integer sortOrder) {}
    public record UpsertSeatingAreaRequest(String name, String slug, String description, Integer seatsPerSlot,
                                           Integer maxParty, String firstSlot, String lastSlot, Integer slotMinutes,
                                           Boolean outdoor, Boolean petFriendly, Boolean active, Integer sortOrder) {}
    public record SlotDto(String key, String time, int seatsLeft, boolean bookable) {}
    public record AreaAvailabilityDto(Long areaId, String name, Integer maxParty, boolean outdoor,
                                      boolean petFriendly, List<SlotDto> slots) {}
    public record CreateReservationRequest(Long areaId, String date, String time, Integer guests,
                                           String occasion, Boolean withPet, String note) {}
    public record ReservationView(Long orderId, String orderNumber, Long areaId, String areaName, String slotKey,
                                  Integer guests, String stageCode, boolean cancellable, String occasion,
                                  boolean withPet, String note, Instant createdAt) {}
    public record AdminReservationRow(Long id, Long orderId, String orderNumber, String stageCode, String areaName,
                                      String slotKey, Integer guests, String occasion, boolean withPet,
                                      String note, Instant createdAt) {}

    // Schmear Lab (suggestions)
    public record IdeaDto(Long id, String authorName, IdeaTopic topic, String title, String details,
                          IdeaStatus status, String teamReply, Integer votes, boolean mine, boolean voted,
                          Instant createdAt) {}
    public record CreateIdeaRequest(IdeaTopic topic, String title, String details) {}
    public record IdeaSubmitResult(IdeaDto idea, int coinsEarned, String message) {}
    public record UpdateIdeaRequest(IdeaStatus status, String teamReply) {}

    // Story
    public record StoryChapterDto(Long id, Integer ordinal, String step, String marker, String title,
                                  String body, boolean active) {}
    public record UpsertStoryChapterRequest(Integer ordinal, String step, String marker, String title,
                                            String body, Boolean active) {}

    // Rewards journey
    public record EarnRuleDto(String eventType, String title, String detail, BigDecimal coins,
                              Integer perDayCap, boolean onceOnly) {}
    public record JourneyStepDto(String key, String title, String hint, String href, boolean done) {}
    public record JourneyDto(List<JourneyStepDto> steps, int done, int total) {}
}
