package com.webappfoundation.butterbrews.catalog;

import com.webappfoundation.butterbrews.model.SeatingArea;
import com.webappfoundation.butterbrews.model.SlotHold;
import com.webappfoundation.butterbrews.repo.SeatingAreaRepository;
import com.webappfoundation.butterbrews.repo.SlotHoldRepository;
import com.webappfoundation.butterbrews.service.SlotRules;
import com.webappfoundation.inventory.InventoryProvider;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Seats-per-slot inventory for BB_SEATING (variantKey = "yyyy-MM-ddTHH:mm", qty = guests). Reserve locks the
 * (area, slot) row and refuses with 409 when the party would overflow it. Called only via the fenced InventoryService.
 */
@Component
public class SeatingInventoryProvider implements InventoryProvider {

    private final SeatingAreaRepository areas;
    private final SlotHoldRepository holds;

    public SeatingInventoryProvider(SeatingAreaRepository areas, SlotHoldRepository holds) {
        this.areas = areas;
        this.holds = holds;
    }

    @Override
    public String itemType() {
        return BBTypes.SEATING;
    }

    @Override
    public boolean availableAt(Long itemId, Long branchId) {
        return areas.findById(itemId).map(SeatingArea::isActive).orElse(false);
    }

    @Override
    @Transactional
    public void reserve(Long itemId, String variantKey, Long branchId, int qty) {
        SeatingArea area = areas.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown seating area"));
        SlotRules.requireBookable(area, variantKey);
        if (qty < 1 || qty > area.getMaxParty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Party size must be between 1 and " + area.getMaxParty() + " for " + area.getName());
        }
        SlotHold hold = holds.lockByAreaAndSlot(itemId, variantKey)
                .orElseGet(() -> holds.saveAndFlush(SlotHold.builder().areaId(itemId).slotKey(variantKey).reserved(0).build()));
        int left = area.getSeatsPerSlot() - hold.getReserved();
        if (qty > left) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    left <= 0 ? "That slot has just filled up. Please pick another time."
                              : "Only " + left + " seats left in " + area.getName() + " at that time");
        }
        hold.setReserved(hold.getReserved() + qty);
        holds.save(hold);
    }

    @Override
    public void commit(Long itemId, String variantKey, Long branchId, int qty) {
        // Seats stay held until the booking is cancelled.
    }

    @Override
    @Transactional
    public void release(Long itemId, String variantKey, Long branchId, int qty) {
        holds.lockByAreaAndSlot(itemId, variantKey).ifPresent(h -> {
            h.setReserved(Math.max(0, h.getReserved() - qty));
            holds.save(h);
        });
    }
}
