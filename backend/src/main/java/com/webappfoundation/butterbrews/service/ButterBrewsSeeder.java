package com.webappfoundation.butterbrews.service;

import com.webappfoundation.butterbrews.catalog.BBTypes;
import com.webappfoundation.butterbrews.model.*;
import com.webappfoundation.butterbrews.repo.*;
import com.webappfoundation.connector.builtin.EmailConnector;
import com.webappfoundation.connector.demo.DemoDeliveryConnector;
import com.webappfoundation.connector.demo.DemoRefundConnector;
import com.webappfoundation.dto.ProductDto;
import com.webappfoundation.dto.UpsertProductRequest;
import com.webappfoundation.dto.WorkflowDto;
import com.webappfoundation.dto.WorkflowDto.BindingDto;
import com.webappfoundation.dto.WorkflowDto.StageDto;
import com.webappfoundation.model.Branch;
import com.webappfoundation.model.RefundPolicy;
import com.webappfoundation.repository.BranchRepository;
import com.webappfoundation.repository.ProductRepository;
import com.webappfoundation.service.ProductService;
import com.webappfoundation.service.WorkflowService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.function.UnaryOperator;

/**
 * Boot seeder for Butter Brews Bistro: the three real processes (kitchen orders, bakehouse cakes, table bookings)
 * as workflows via the fenced WorkflowService.defineWorkflow, plus the outlet, starter menu, seating and story.
 * Every step is idempotent, so admin edits survive restarts.
 */
@Component
@Order(10)
public class ButterBrewsSeeder {

    private static final Logger log = LoggerFactory.getLogger(ButterBrewsSeeder.class);

    private final WorkflowService workflowService;
    private final BranchRepository branches;
    private final ProductService productService;
    private final ProductRepository products;
    private final DishNoteRepository dishNotes;
    private final SeatingAreaRepository areas;
    private final StoryChapterRepository chapters;
    private final BakeDropRepository bakes;

    public ButterBrewsSeeder(WorkflowService workflowService, BranchRepository branches, ProductService productService,
                             ProductRepository products, DishNoteRepository dishNotes, SeatingAreaRepository areas,
                             StoryChapterRepository chapters, BakeDropRepository bakes) {
        this.workflowService = workflowService;
        this.branches = branches;
        this.productService = productService;
        this.products = products;
        this.dishNotes = dishNotes;
        this.areas = areas;
        this.chapters = chapters;
        this.bakes = bakes;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void seed() {
        try {
            seedWorkflows();
            seedBranch();
            seedMenu();
            seedSeating();
            seedStory();
            seedBakeBoard();
        } catch (Exception e) {
            log.warn("[butter-brews] seeding stopped early: {}", e.getMessage());
        }
    }

    // Workflows
    private void seedWorkflows() {
        workflowService.defineWorkflow(WorkflowDto.builder()
                .code(BBTypes.WF_KITCHEN).label("Kitchen · takeaway & delivery").staffRole("Kitchen").isDefault(true)
                .stages(List.of(
                        stage("PLACED", "Placed", b -> b.initial(true).cancellable(true).refundPolicy(RefundPolicy.FULL).targetMinutes(5)),
                        stage("CONFIRMED", "Confirmed", b -> b.onPaidEntry(true).cancellable(true).refundPolicy(RefundPolicy.FULL).targetMinutes(5)
                                .bindings(List.of(binding(EmailConnector.ID, EmailConnector.EMAIL_CUSTOMER, 0),
                                        binding(EmailConnector.ID, EmailConnector.EMAIL_STORE, 1)))),
                        stage("IN_THE_KITCHEN", "In the kitchen", b -> b.cancellable(true).refundPolicy(RefundPolicy.PARTIAL).refundPercent(50).targetMinutes(20)),
                        stage("READY", "Packed & ready", b -> b.refundPolicy(RefundPolicy.NONE).targetMinutes(15)
                                .bindings(List.of(binding(DemoDeliveryConnector.ID, DemoDeliveryConnector.DELIVERY_INITIATE, 0)))),
                        stage("HANDED_OVER", "Handed over", b -> b.terminal(true).refundPolicy(RefundPolicy.NONE)),
                        stage("CANCELLED", "Cancelled", b -> b.terminal(true).refundPolicy(RefundPolicy.NONE)
                                .bindings(List.of(binding(DemoRefundConnector.ID, DemoRefundConnector.REFUND_ISSUE, 0))))))
                .build());

        workflowService.defineWorkflow(WorkflowDto.builder()
                .code(BBTypes.WF_BAKEHOUSE).label("Bakehouse · cakes to order").staffRole("Baker")
                .stages(List.of(
                        stage("PLACED", "Placed", b -> b.initial(true).cancellable(true).refundPolicy(RefundPolicy.FULL).targetMinutes(60)),
                        stage("CONFIRMED", "Confirmed", b -> b.onPaidEntry(true).cancellable(true).refundPolicy(RefundPolicy.FULL).targetMinutes(120)
                                .bindings(List.of(binding(EmailConnector.ID, EmailConnector.EMAIL_CUSTOMER, 0),
                                        binding(EmailConnector.ID, EmailConnector.EMAIL_STORE, 1)))),
                        stage("BAKING", "In the oven", b -> b.cancellable(true).refundPolicy(RefundPolicy.PARTIAL).refundPercent(50).targetMinutes(480)),
                        stage("FINISHING", "Finishing & boxing", b -> b.refundPolicy(RefundPolicy.NONE).targetMinutes(240)),
                        stage("READY_FOR_PICKUP", "Ready for pickup", b -> b.refundPolicy(RefundPolicy.NONE).targetMinutes(480)
                                .bindings(List.of(binding(EmailConnector.ID, EmailConnector.EMAIL_CUSTOMER, 0)))),
                        stage("COLLECTED", "Collected", b -> b.terminal(true).refundPolicy(RefundPolicy.NONE)),
                        stage("CANCELLED", "Cancelled", b -> b.terminal(true).refundPolicy(RefundPolicy.NONE)
                                .bindings(List.of(binding(DemoRefundConnector.ID, DemoRefundConnector.REFUND_ISSUE, 0))))))
                .build());

        workflowService.defineWorkflow(WorkflowDto.builder()
                .code(BBTypes.WF_TABLE).label("Table bookings").staffRole("Host")
                .stages(List.of(
                        stage("REQUESTED", "Requested", b -> b.initial(true).cancellable(true).refundPolicy(RefundPolicy.FULL).targetMinutes(15)),
                        stage("CONFIRMED", "Table held", b -> b.onPaidEntry(true).cancellable(true).refundPolicy(RefundPolicy.FULL).targetMinutes(1440)
                                .bindings(List.of(binding(EmailConnector.ID, EmailConnector.EMAIL_CUSTOMER, 0),
                                        binding(EmailConnector.ID, EmailConnector.EMAIL_STORE, 1)))),
                        stage("SEATED", "Seated", b -> b.refundPolicy(RefundPolicy.NONE).targetMinutes(120)),
                        stage("COMPLETED", "Visit complete", b -> b.terminal(true).refundPolicy(RefundPolicy.NONE)),
                        stage("CANCELLED", "Cancelled", b -> b.terminal(true).refundPolicy(RefundPolicy.NONE))))
                .build());
    }

    private static StageDto stage(String code, String label, UnaryOperator<StageDto.StageDtoBuilder> cfg) {
        StageDto.StageDtoBuilder b = StageDto.builder().code(code).label(label).bindings(new ArrayList<>());
        return cfg.apply(b).build();
    }

    private static BindingDto binding(String connectorId, String action, int ordinal) {
        return BindingDto.builder().connectorId(connectorId).actionCode(action).ordinal(ordinal).enabled(true).build();
    }

    // Outlet
    private void seedBranch() {
        if (branches.existsBySlug(BBTypes.BRANCH_SLUG)) return;
        Instant now = Instant.now();
        branches.save(Branch.builder()
                .name("Butter Brews · Model Colony").slug(BBTypes.BRANCH_SLUG).phone("+91 96074 04669")
                .addressLine("Shop 11 & 12, Rajas Garden, opp. Hanuman Mandir, Model Colony, Shivajinagar")
                .city("Pune").state("Maharashtra").pincode("411016")
                .latitude(18.5299036).longitude(73.8324434)
                .googleMapsUrl("https://www.google.com/maps/search/?api=1&query=Butter+Brews+Bistro+Model+Colony+Pune")
                .openingHours("Daily 9 am – 10:30 pm").active(true).createdAt(now).updatedAt(now).build());
    }

    // Starter menu (prices are starting values for the owner to confirm in /admin/products)
    private void seedMenu() {
        dish("Chicken Gurkha Bagel", "Bagels", 360, Diet.NON_VEG, true, true,
                "Our signature: Nepali-style spiced chicken in a bagel baked in our own bakehouse.", "Vietnamese Iced Coffee");
        dish("Mushroom Veggie Bagel Sandwich", "Bagels", 320, Diet.VEG, true, false,
                "Sautéed mushrooms and greens, cream cheese, toasted house bagel.", "Basil Slush");
        dish("Tomato Basil Cottage Cheese Bagel", "Bagels", 320, Diet.VEG, false, false,
                "Cottage cheese, tomato and fresh basil on a toasted bagel.", null);
        dish("Cream Cheese Bagel", "Bagels", 220, Diet.VEG, false, false,
                "The classic: a fresh bagel, toasted, with a thick schmear of cream cheese.", "House Cappuccino");
        dish("Cheese Chilli Nutella Bagel", "Bagels", 280, Diet.VEG, false, true,
                "Sweet, salty and a little hot. Cheese, chilli and Nutella, for the curious.", null);
        dish("Scrambled Eggs on a Bagel", "All-day breakfast", 310, Diet.EGG, false, false,
                "Soft scrambled eggs on a toasted bagel, served whenever you wake up.", "House Cappuccino");
        dish("Pancakes with Maple Syrup", "All-day breakfast", 320, Diet.EGG, false, false,
                "A stack of pancakes with maple syrup.", null);
        dish("Cream Cheese Tartine with Orange Zest", "All-day breakfast", 290, Diet.VEG, false, false,
                "House bread, cream cheese and a bright lift of orange zest.", null);
        dish("Chicken Khao Suey Bowl", "Bowls & mains", 420, Diet.NON_VEG, false, false,
                "Coconut curry noodles with chicken and all the crunchy toppings.", "Basil Slush");
        dish("Broodles · Veg", "Bowls & mains", 330, Diet.VEG, false, false,
                "Broth and noodles: a warm bowl for a rainy Pune evening.", null);
        dish("Broodles · Chicken", "Bowls & mains", 380, Diet.NON_VEG, false, false,
                "Broth and noodles with chicken.", null);
        dish("Harissa Chicken Steak", "Bowls & mains", 480, Diet.NON_VEG, false, false,
                "Grilled chicken with a smoky harissa rub.", null);
        dish("Peri Peri Fries", "Bowls & mains", 210, Diet.VEG, false, false, "Crisp fries tossed in peri peri.", null);
        dish("Vietnamese Iced Coffee", "Coffee & coolers", 240, Diet.VEG, true, false,
                "Strong coffee over ice with condensed milk. 100% Arabica.", "Chicken Gurkha Bagel");
        dish("House Cappuccino", "Coffee & coolers", 220, Diet.VEG, false, false, "Our house espresso, 100% Arabica, with steamed milk.", null);
        dish("Basil Slush", "Coffee & coolers", 220, Diet.VEG, false, false, "Icy, green and very refreshing.", null);
        dish("Banana Almond Shake", "Coffee & coolers", 260, Diet.VEG, false, false, "Banana and almond, blended thick.", null);
        dish("New York Cheesecake · slice", "Desserts", 320, Diet.EGG, true, false, "Our signature baked cheesecake, by the slice.", "House Cappuccino");
        dish("Basque Cheesecake · slice", "Desserts", 340, Diet.EGG, false, true, "Burnt top, soft middle. From the bakehouse.", null);
        dish("Cinnamon Roll", "Desserts", 190, Diet.EGG, false, false, "Baked in-house, glazed while warm.", "House Cappuccino");
        dish("Chocolate Hazelnut Pastry", "Desserts", 230, Diet.EGG, false, false, "Layers of chocolate and hazelnut.", null);

        cake("Whole New York Cheesecake", 1450, 2700, "Our signature cheesecake, baked whole for your table. Order a day ahead.");
        cake("Whole Basque Cheesecake", 1550, 2900, "The burnt-top Basque, whole. Order a day ahead.");
        cake("Celebration Cake", 1300, 2400, "Made to order for birthdays and anniversaries. Our bakehouse calls you to confirm flavour and message.");
    }

    private void dish(String name, String category, int price, Diet diet, boolean signature, boolean isNew,
                      String description, String pairing) {
        String slug = SeatingService.slugify(name);
        if (products.existsBySlug(slug) || products.existsByNameIgnoreCase(name)) return;
        ProductDto p = productService.create(UpsertProductRequest.builder()
                .name(name).slug(slug).description(description).price(BigDecimal.valueOf(price)).category(category)
                .active(true).workflowCode(BBTypes.WF_KITCHEN).build());
        dishNotes.save(DishNote.builder().productId(p.getId()).diet(diet).signature(signature)
                .newUntil(isNew ? LocalDate.now(BBTypes.ZONE).plusDays(30) : null).pairing(pairing)
                .updatedAt(Instant.now()).build());
    }

    private void cake(String name, int halfKg, int oneKg, String description) {
        String slug = SeatingService.slugify(name);
        if (products.existsBySlug(slug) || products.existsByNameIgnoreCase(name)) return;
        ProductDto p = productService.create(UpsertProductRequest.builder()
                .name(name).slug(slug).description(description).price(BigDecimal.valueOf(halfKg))
                .category(BBTypes.CATEGORY_BAKEHOUSE).active(true).workflowCode(BBTypes.WF_BAKEHOUSE)
                .features(List.of("Order at least a day ahead", "Pickup from Model Colony", "Ask us about eggless"))
                .variants(List.of(
                        UpsertProductRequest.VariantInput.builder().label("Half kg").sku(slug + "-500").price(BigDecimal.valueOf(halfKg)).build(),
                        UpsertProductRequest.VariantInput.builder().label("1 kg").sku(slug + "-1000").price(BigDecimal.valueOf(oneKg)).build()))
                .build());
        dishNotes.save(DishNote.builder().productId(p.getId()).diet(Diet.EGG).signature(false).updatedAt(Instant.now()).build());
    }

    // Seating
    private void seedSeating() {
        Instant now = Instant.now();
        if (!areas.existsBySlug("indoor-bistro")) {
            areas.save(SeatingArea.builder().name("Indoor bistro").slug("indoor-bistro")
                    .description("The calm, minimal room inside. Good for long breakfasts and laptops.")
                    .seatsPerSlot(24).maxParty(8).firstSlot("09:00").lastSlot("21:00").slotMinutes(60)
                    .outdoor(false).petFriendly(false).active(true).sortOrder(1).createdAt(now).updatedAt(now).build());
        }
        if (!areas.existsBySlug("outdoor-seating")) {
            areas.save(SeatingArea.builder().name("Outdoor seating").slug("outdoor-seating")
                    .description("Open-air tables in the Model Colony lane.")
                    .seatsPerSlot(16).maxParty(6).firstSlot("09:00").lastSlot("21:00").slotMinutes(60)
                    .outdoor(true).petFriendly(true).active(true).sortOrder(2).createdAt(now).updatedAt(now).build());
        }
    }

    // Story (sourced: founders, 2018 opening, in-house bread, Arabica, bakehouse, Aundh 2026)
    private void seedStory() {
        if (!chapters.findAllByOrderByOrdinalAsc().isEmpty()) return;
        Instant now = Instant.now();
        chapters.saveAll(List.of(
                StoryChapter.builder().ordinal(1).step("Mix").marker("2018").title("A small bistro in the by-lanes")
                        .body("Harsh Agarwal and Umang, two young founders, opened Butter Brews in the quiet by-lanes of Model Colony in 2018: a minimal room, a few tables outside, and a short menu of all-day breakfasts, bagels, sandwiches, pasta and coffee.")
                        .active(true).updatedAt(now).build(),
                StoryChapter.builder().ordinal(2).step("Proof").marker("The bread").title("Bread we bake ourselves")
                        .body("From the start the bread has been baked in-house. The bagel sandwiches became the star: Mushroom Veggie, Tomato Basil Cottage Cheese, and the Nepali-inspired Chicken Gurkha that regulars still order first.")
                        .active(true).updatedAt(now).build(),
                StoryChapter.builder().ordinal(3).step("Boil").marker("The coffee").title("Coffee was never optional")
                        .body("The house espresso is 100% Arabica, and the bar pours manual brews from guest roasters that rotate through the year. Many guests leave with a Vietnamese iced coffee in hand.")
                        .active(true).updatedAt(now).build(),
                StoryChapter.builder().ordinal(4).step("Bake").marker("The bakehouse").title("Something sweet, every day")
                        .body("New York cheesecake, a burnt-top Basque cheesecake and cinnamon rolls come out of our own bakehouse. Whole cheesecakes and celebration cakes can be ordered a day ahead.")
                        .active(true).updatedAt(now).build(),
                StoryChapter.builder().ordinal(5).step("Serve").marker("Today").title("Still the lane you come back to")
                        .body("Butter Brews has since grown across Pune, including a large café in Aundh in 2026. Model Colony is where it began, and where the bagels still come out warm.")
                        .active(true).updatedAt(now).build()));
    }

    // A starter bake board so the home page shows the feature on first run (edit at /admin/butter-brews)
    private void seedBakeBoard() {
        if (bakes.count() > 0) return;
        LocalDate today = LocalDate.now(BBTypes.ZONE);
        Long bagel = products.findBySlug("cream-cheese-bagel").map(p -> p.getId()).orElse(null);
        Long ny = products.findBySlug("new-york-cheesecake-slice").map(p -> p.getId()).orElse(null);
        Long basque = products.findBySlug("basque-cheesecake-slice").map(p -> p.getId()).orElse(null);
        Long roll = products.findBySlug("cinnamon-roll").map(p -> p.getId()).orElse(null);
        Instant now = Instant.now();
        bakes.saveAll(List.of(
                BakeDrop.builder().name("Morning bagels").productId(bagel).bakeDate(today).outAt("08:30").status(BakeStatus.OUT_NOW)
                        .note("First batch of the day").sortOrder(1).updatedAt(now).build(),
                BakeDrop.builder().name("Cinnamon rolls").productId(roll).bakeDate(today).outAt("10:00").status(BakeStatus.OUT_NOW)
                        .sortOrder(2).updatedAt(now).build(),
                BakeDrop.builder().name("New York cheesecake").productId(ny).bakeDate(today).outAt("12:00").status(BakeStatus.IN_THE_OVEN)
                        .sortOrder(3).updatedAt(now).build(),
                BakeDrop.builder().name("Basque cheesecake").productId(basque).bakeDate(today).outAt("16:00").status(BakeStatus.IN_THE_OVEN)
                        .note("Burnt top, soft middle").sortOrder(4).updatedAt(now).build()));
    }
}
