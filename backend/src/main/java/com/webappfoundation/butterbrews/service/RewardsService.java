package com.webappfoundation.butterbrews.service;

import com.webappfoundation.butterbrews.dto.BBDtos.*;
import com.webappfoundation.butterbrews.model.JourneyMark;
import com.webappfoundation.butterbrews.repo.JourneyMarkRepository;
import com.webappfoundation.butterbrews.repo.ReviewCountRepository;
import com.webappfoundation.dto.LoyaltyEventRuleDto;
import com.webappfoundation.dto.OrderDto;
import com.webappfoundation.service.AddressService;
import com.webappfoundation.service.LoyaltyConfigService;
import com.webappfoundation.service.OrderService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;

/** Public "ways to earn" (read live from the loyalty rules) and the signed-in "Get started" checklist. */
@Service
public class RewardsService {

    public static final Set<String> MARKS = Set.of("REORDER");

    private static final Map<String, String[]> COPY = Map.of(
            "REVIEW", new String[]{"Rate a dish", "Tell us how a bagel, bowl or bake was. Any honest rating counts."},
            "REVIEW_MEDIA", new String[]{"Rate it with a photo", "Add a photo to your review of a dish."},
            "FEEDBACK", new String[]{"Tell us how your order went", "Rate an order or a visit once it's done."},
            "SUGGESTION", new String[]{"Drop an idea in the Schmear Lab", "Suggest a bagel, a brew or a fix."},
            "REFERRAL_PURCHASE", new String[]{"Bring a friend", "When a friend you invited places their first order."},
            "SIGNUP", new String[]{"Join Butter Brews", "Create an account."},
            "PROFILE_COMPLETE", new String[]{"Complete your profile", "Add your details and a saved address."});

    private final LoyaltyConfigService loyaltyConfig;
    private final OrderService orderService;
    private final AddressService addressService;
    private final ReviewCountRepository reviewCounts;
    private final IdeaService ideaService;
    private final FavouriteService favouriteService;
    private final JourneyMarkRepository marks;

    public RewardsService(LoyaltyConfigService loyaltyConfig, OrderService orderService, AddressService addressService,
                          ReviewCountRepository reviewCounts, IdeaService ideaService, FavouriteService favouriteService,
                          JourneyMarkRepository marks) {
        this.loyaltyConfig = loyaltyConfig;
        this.orderService = orderService;
        this.addressService = addressService;
        this.reviewCounts = reviewCounts;
        this.ideaService = ideaService;
        this.favouriteService = favouriteService;
        this.marks = marks;
    }

    /** Only rules that actually credit coins, straight from LoyaltyConfigService.listEventRules(). */
    public List<EarnRuleDto> waysToEarn() {
        List<EarnRuleDto> out = new ArrayList<>();
        for (LoyaltyEventRuleDto r : loyaltyConfig.listEventRules()) {
            if (!r.isEarnsCoins() || r.getEventType() == null || r.getPoints() == null || r.getPoints().signum() <= 0) continue;
            String key = r.getEventType().name();
            String[] copy = COPY.getOrDefault(key, new String[]{humanise(key), "Earn coins for this."});
            out.add(new EarnRuleDto(key, copy[0], copy[1], r.getPoints(), r.getPerDayCap(), r.isOnceOnly()));
        }
        out.sort(Comparator.comparing(EarnRuleDto::coins));
        return out;
    }

    public JourneyDto journey(Integer userId) {
        requireUser(userId);
        List<OrderDto> orders = orderService.myOrders(userId);
        boolean hasAddress = !addressService.list(userId).isEmpty();
        boolean ordered = !orders.isEmpty();
        boolean feedback = orders.stream().anyMatch(OrderDto::isFeedbackSubmitted);
        boolean reviewed = reviewCounts.countByUserId(userId) > 0;
        boolean idea = ideaService.countMine(userId) > 0;
        boolean fav = favouriteService.count(userId) > 0;
        Set<String> done = new HashSet<>();
        marks.findByUserId(userId).forEach(m -> done.add(m.getMark()));
        List<JourneyStepDto> steps = List.of(
                new JourneyStepDto("PROFILE", "Save your address", "So delivery and pickup are one tap.", "/account", hasAddress),
                new JourneyStepDto("FIRST_ORDER", "First order or table", "Order a bagel or book a table.", "/menu", ordered),
                new JourneyStepDto("FAVOURITE", "Heart a favourite", "Tap the heart on any dish.", "/menu", fav),
                new JourneyStepDto("REVIEW", "Rate a dish", "Any honest rating earns coins.", "/menu", reviewed),
                new JourneyStepDto("FEEDBACK", "Rate an order", "Tell us how it went once it's done.", "/my-brews#orders", feedback),
                new JourneyStepDto("IDEA", "Drop an idea", "Suggest a bagel in the Schmear Lab.", "/schmear-lab", idea),
                new JourneyStepDto("REORDER", "Try one-tap reorder", "Your usual, back in the cart.", "/my-brews#orders", done.contains("REORDER")));
        int count = (int) steps.stream().filter(JourneyStepDto::done).count();
        return new JourneyDto(steps, count, steps.size());
    }

    @Transactional
    public JourneyDto mark(Integer userId, String mark) {
        requireUser(userId);
        String m = mark == null ? "" : mark.trim().toUpperCase();
        if (!MARKS.contains(m)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown step");
        if (!marks.existsByUserIdAndMark(userId, m)) {
            marks.save(JourneyMark.builder().userId(userId).mark(m).createdAt(Instant.now()).build());
        }
        return journey(userId);
    }

    private static String humanise(String key) {
        String s = key.toLowerCase().replace('_', ' ');
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    private static void requireUser(Integer userId) {
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in");
    }
}
