package com.webappfoundation.butterbrews.service;

import com.webappfoundation.butterbrews.catalog.BBTypes;
import com.webappfoundation.butterbrews.dto.BBDtos.*;
import com.webappfoundation.butterbrews.model.ReservationDetail;
import com.webappfoundation.butterbrews.model.SeatingArea;
import com.webappfoundation.butterbrews.repo.ReservationDetailRepository;
import com.webappfoundation.dto.CartLineInput;
import com.webappfoundation.dto.OrderDto;
import com.webappfoundation.dto.PlaceOrderRequest;
import com.webappfoundation.model.FulfillmentType;
import com.webappfoundation.model.PaymentMode;
import com.webappfoundation.repository.BranchRepository;
import com.webappfoundation.service.OrderService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Table booking = a ₹0 order on the bb-table workflow placed through the fenced OrderService (seats held by
 * SeatingInventoryProvider via InventoryService) + a ReservationDetail row for the bistro extras.
 * Cancelling runs through the order spine's stage policy (POST /api/v1/orders/{id}/cancel).
 */
@Service
public class ReservationService {

    private final OrderService orderService;
    private final SeatingService seatingService;
    private final ReservationDetailRepository details;
    private final BranchRepository branches;

    public ReservationService(OrderService orderService, SeatingService seatingService,
                              ReservationDetailRepository details, BranchRepository branches) {
        this.orderService = orderService;
        this.seatingService = seatingService;
        this.details = details;
        this.branches = branches;
    }

    @Transactional
    public ReservationView create(Integer userId, CreateReservationRequest req) {
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in to book a table");
        if (req == null || req.areaId() == null) bad("Pick where you'd like to sit");
        if (req.guests() == null || req.guests() < 1) bad("How many of you are coming?");
        if (req.note() != null && req.note().length() > 280) bad("Keep the note under 280 characters");
        if (req.occasion() != null && req.occasion().length() > 60) bad("Occasion must be under 60 characters");
        SeatingArea area = seatingService.require(req.areaId());
        if (!area.isActive()) bad("That area isn't taking bookings right now");
        if (Boolean.TRUE.equals(req.withPet()) && !area.isPetFriendly()) {
            bad(area.getName() + " can't host pets. Please pick an area marked pet-friendly.");
        }
        String slotKey = (req.date() == null ? "" : req.date()) + "T" + (req.time() == null ? "" : req.time());
        LocalDateTime slot = SlotRules.requireBookable(area, slotKey);

        Long branchId = branches.findBySlug(BBTypes.BRANCH_SLUG).map(b -> b.getId()).orElse(null);
        OrderDto order = orderService.placeOrder(userId, PlaceOrderRequest.builder()
                .items(List.of(CartLineInput.builder().itemType(BBTypes.SEATING).itemId(area.getId())
                        .variantKey(slotKey).quantity(req.guests()).build()))
                .branchId(branchId)
                .fulfillmentType(FulfillmentType.SELF_PICKUP)
                .paymentMode(PaymentMode.PAY_AT_COUNTER)
                .build());

        ReservationDetail d = details.save(ReservationDetail.builder()
                .orderId(order.getId()).userId(userId).areaId(area.getId()).areaName(area.getName())
                .slotKey(slotKey).slotDate(slot.toLocalDate()).guests(req.guests())
                .occasion(DishNoteService.blank(req.occasion())).withPet(Boolean.TRUE.equals(req.withPet()))
                .note(DishNoteService.blank(req.note())).createdAt(Instant.now())
                .build());
        return view(d, order);
    }

    public List<ReservationView> mine(Integer userId) {
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in");
        Map<Long, OrderDto> orders = orderService.myOrders(userId).stream()
                .collect(Collectors.toMap(OrderDto::getId, Function.identity(), (a, b) -> a));
        return details.findByUserIdOrderBySlotKeyDesc(userId).stream().map(d -> view(d, orders.get(d.getOrderId()))).toList();
    }

    public List<AdminReservationRow> adminList() {
        Map<Long, OrderDto> orders = orderService.all().stream()
                .collect(Collectors.toMap(OrderDto::getId, Function.identity(), (a, b) -> a));
        return details.findAllByOrderBySlotKeyDesc().stream().map(d -> {
            OrderDto o = orders.get(d.getOrderId());
            return new AdminReservationRow(d.getId(), d.getOrderId(), o == null ? null : o.getOrderNumber(),
                    o == null ? null : o.getCurrentStageCode(), d.getAreaName(), d.getSlotKey(), d.getGuests(),
                    d.getOccasion(), d.isWithPet(), d.getNote(), d.getCreatedAt());
        }).toList();
    }

    private static ReservationView view(ReservationDetail d, OrderDto o) {
        return new ReservationView(d.getOrderId(), o == null ? null : o.getOrderNumber(), d.getAreaId(), d.getAreaName(),
                d.getSlotKey(), d.getGuests(), o == null ? null : o.getCurrentStageCode(), o != null && o.isCancellable(),
                d.getOccasion(), d.isWithPet(), d.getNote(), d.getCreatedAt());
    }

    private static void bad(String msg) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }
}
