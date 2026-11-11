package com.webappfoundation.butterbrews.service;

import com.webappfoundation.butterbrews.catalog.BBTypes;
import com.webappfoundation.butterbrews.dto.BBDtos.*;
import com.webappfoundation.butterbrews.model.SeatingArea;
import com.webappfoundation.butterbrews.model.SlotHold;
import com.webappfoundation.butterbrews.repo.SeatingAreaRepository;
import com.webappfoundation.butterbrews.repo.SlotHoldRepository;
import com.webappfoundation.dto.BulkUploadResult;
import com.webappfoundation.exception.ResourceNotFoundException;
import com.webappfoundation.service.AuditService;
import com.webappfoundation.service.SpreadsheetParser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SeatingService {

    private final SeatingAreaRepository areas;
    private final SlotHoldRepository holds;
    private final SpreadsheetParser parser;
    private final AuditService audit;

    public SeatingService(SeatingAreaRepository areas, SlotHoldRepository holds, SpreadsheetParser parser, AuditService audit) {
        this.areas = areas;
        this.holds = holds;
        this.parser = parser;
        this.audit = audit;
    }

    public List<SeatingAreaDto> listActive() {
        return areas.findByActiveTrueOrderBySortOrderAsc().stream().map(SeatingService::toDto).toList();
    }

    public List<SeatingAreaDto> listAll() {
        return areas.findAllByOrderBySortOrderAsc().stream().map(SeatingService::toDto).toList();
    }

    public SeatingArea require(Long id) {
        return areas.findById(id).orElseThrow(() -> new ResourceNotFoundException("Seating area not found"));
    }

    /** Seats left per slot, per active area, for one date (yyyy-MM-dd; default today). */
    public List<AreaAvailabilityDto> availability(String dateStr) {
        LocalDate date;
        try {
            date = dateStr == null || dateStr.isBlank() ? LocalDate.now(BBTypes.ZONE) : LocalDate.parse(dateStr);
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Date must look like 2026-11-20");
        }
        Map<String, Integer> reserved = holds.findBySlotKeyStartingWith(date.toString()).stream()
                .collect(Collectors.toMap(h -> h.getAreaId() + "|" + h.getSlotKey(), SlotHold::getReserved, Integer::sum));
        List<AreaAvailabilityDto> out = new ArrayList<>();
        for (SeatingArea a : areas.findByActiveTrueOrderBySortOrderAsc()) {
            List<SlotDto> slots = new ArrayList<>();
            for (LocalTime t : SlotRules.slotTimes(a)) {
                String key = SlotRules.key(date, t);
                int left = Math.max(0, a.getSeatsPerSlot() - reserved.getOrDefault(a.getId() + "|" + key, 0));
                slots.add(new SlotDto(key, key.substring(11), left, left > 0 && SlotRules.isBookable(LocalDateTime.of(date, t))));
            }
            out.add(new AreaAvailabilityDto(a.getId(), a.getName(), a.getMaxParty(), a.isOutdoor(), a.isPetFriendly(), slots));
        }
        return out;
    }

    @Transactional
    public SeatingAreaDto create(UpsertSeatingAreaRequest r) {
        SeatingArea a = new SeatingArea();
        a.setCreatedAt(Instant.now());
        apply(a, r);
        a = areas.save(a);
        audit.record("BB_SEATING_AREA_CREATED", "SUCCESS", "SEATING_AREA", String.valueOf(a.getId()), a.getName());
        return toDto(a);
    }

    @Transactional
    public SeatingAreaDto update(Long id, UpsertSeatingAreaRequest r) {
        SeatingArea a = require(id);
        apply(a, r);
        a = areas.save(a);
        audit.record("BB_SEATING_AREA_UPDATED", "SUCCESS", "SEATING_AREA", String.valueOf(id), a.getName());
        return toDto(a);
    }

    /** Soft delete: existing bookings keep their area. */
    @Transactional
    public void delete(Long id) {
        SeatingArea a = require(id);
        a.setActive(false);
        a.setUpdatedAt(Instant.now());
        areas.save(a);
        audit.record("BB_SEATING_AREA_DELETED", "SUCCESS", "SEATING_AREA", String.valueOf(id), a.getName());
    }

    /** Columns: name, slug, description, seatsPerSlot, maxParty, firstSlot, lastSlot, slotMinutes, outdoor, petFriendly, sortOrder. */
    @Transactional
    public BulkUploadResult bulkImport(MultipartFile file) {
        BulkUploadResult result = BulkUploadResult.builder().build();
        int rowNo = 1;
        for (Map<String, String> row : parser.parse(file)) {
            rowNo++;
            try {
                String slug = BulkRows.str(row, "slug");
                if (slug != null && areas.existsBySlug(slugify(slug))) {
                    result.setSkipped(result.getSkipped() + 1);
                    continue;
                }
                SeatingArea a = new SeatingArea();
                a.setCreatedAt(Instant.now());
                apply(a, new UpsertSeatingAreaRequest(BulkRows.str(row, "name"), slug, BulkRows.str(row, "description"),
                        BulkRows.integer(row, "seatsperslot"), BulkRows.integer(row, "maxparty"),
                        BulkRows.str(row, "firstslot"), BulkRows.str(row, "lastslot"), BulkRows.integer(row, "slotminutes"),
                        BulkRows.bool(row, "outdoor", false), BulkRows.bool(row, "petfriendly", false), true,
                        BulkRows.integer(row, "sortorder")));
                areas.save(a);
                result.setCreated(result.getCreated() + 1);
            } catch (ResponseStatusException e) {
                result.addError(rowNo, e.getReason());
            } catch (Exception e) {
                result.addError(rowNo, e.getMessage());
            }
        }
        audit.record("BB_SEATING_AREA_BULK_UPLOAD", "SUCCESS", "SEATING_AREA", null,
                "created=" + result.getCreated() + " failed=" + result.getFailed());
        return result;
    }

    private void apply(SeatingArea a, UpsertSeatingAreaRequest r) {
        if (r == null || r.name() == null || r.name().isBlank()) bad("Name is required");
        if (r.seatsPerSlot() == null || r.seatsPerSlot() < 1 || r.seatsPerSlot() > 200) bad("Seats per slot must be 1 to 200");
        if (r.maxParty() == null || r.maxParty() < 1 || r.maxParty() > r.seatsPerSlot()) bad("Max party must be between 1 and seats per slot");
        if (r.slotMinutes() == null || r.slotMinutes() < 15 || r.slotMinutes() > 240) bad("Slot length must be 15 to 240 minutes");
        if (r.firstSlot() == null || r.lastSlot() == null) bad("First and last slot times are required");
        SlotRules.requireHhMm(r.firstSlot(), "First slot");
        SlotRules.requireHhMm(r.lastSlot(), "Last slot");
        if (LocalTime.parse(r.lastSlot()).isBefore(LocalTime.parse(r.firstSlot()))) bad("Last slot must be after the first");
        String slug = r.slug() == null || r.slug().isBlank() ? slugify(r.name()) : slugify(r.slug());
        areas.findBySlug(slug).filter(o -> !Objects.equals(o.getId(), a.getId()))
                .ifPresent(o -> bad("Another area already uses the slug " + slug));
        a.setName(r.name().trim());
        a.setSlug(slug);
        a.setDescription(DishNoteService.blank(r.description()));
        a.setSeatsPerSlot(r.seatsPerSlot());
        a.setMaxParty(r.maxParty());
        a.setFirstSlot(r.firstSlot());
        a.setLastSlot(r.lastSlot());
        a.setSlotMinutes(r.slotMinutes());
        a.setOutdoor(Boolean.TRUE.equals(r.outdoor()));
        a.setPetFriendly(Boolean.TRUE.equals(r.petFriendly()));
        a.setActive(r.active() == null || r.active());
        a.setSortOrder(r.sortOrder() == null ? 0 : r.sortOrder());
        a.setUpdatedAt(Instant.now());
    }

    static String slugify(String s) {
        return s.trim().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    }

    static SeatingAreaDto toDto(SeatingArea a) {
        return new SeatingAreaDto(a.getId(), a.getName(), a.getSlug(), a.getDescription(), a.getSeatsPerSlot(),
                a.getMaxParty(), a.getFirstSlot(), a.getLastSlot(), a.getSlotMinutes(), a.isOutdoor(),
                a.isPetFriendly(), a.isActive(), a.getSortOrder());
    }

    private static void bad(String msg) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }
}
