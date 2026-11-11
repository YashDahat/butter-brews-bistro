package com.webappfoundation.butterbrews.service;

import com.webappfoundation.butterbrews.catalog.BBTypes;
import com.webappfoundation.butterbrews.model.SeatingArea;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

/** Slot maths shared by availability, booking and the seat inventory provider. */
public final class SlotRules {
    private SlotRules() {}

    public static final int BOOKING_WINDOW_DAYS = 21;
    /** Bookings close this many minutes before the slot starts. */
    public static final int LEAD_MINUTES = 45;

    public static List<LocalTime> slotTimes(SeatingArea a) {
        List<LocalTime> out = new ArrayList<>();
        LocalTime t = LocalTime.parse(a.getFirstSlot());
        LocalTime last = LocalTime.parse(a.getLastSlot());
        int step = Math.max(15, a.getSlotMinutes() == null ? 60 : a.getSlotMinutes());
        int guard = 0;
        while (!t.isAfter(last) && guard++ < 96) {
            out.add(t);
            LocalTime next = t.plusMinutes(step);
            if (next.isBefore(t)) break;
            t = next;
        }
        return out;
    }

    public static String key(LocalDate date, LocalTime time) {
        return date + "T" + String.format("%02d:%02d", time.getHour(), time.getMinute());
    }

    public static boolean isBookable(LocalDateTime slot) {
        LocalDateTime now = LocalDateTime.now(BBTypes.ZONE);
        return slot.isAfter(now.plusMinutes(LEAD_MINUTES))
                && !slot.toLocalDate().isAfter(now.toLocalDate().plusDays(BOOKING_WINDOW_DAYS));
    }

    public static LocalDateTime requireBookable(SeatingArea area, String slotKey) {
        if (slotKey == null || slotKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pick a time");
        }
        LocalDateTime slot;
        try {
            slot = LocalDateTime.parse(slotKey);
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That time doesn't look right");
        }
        if (!slotTimes(area).contains(slot.toLocalTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That time isn't a bookable slot for " + area.getName());
        }
        if (!isBookable(slot)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Tables can be booked up to " + BOOKING_WINDOW_DAYS + " days ahead, until " + LEAD_MINUTES + " minutes before");
        }
        return slot;
    }

    public static void requireHhMm(String v, String field) {
        try {
            LocalTime.parse(v);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " must be a time like 09:00");
        }
    }
}
