package com.webappfoundation.butterbrews.web;

import com.webappfoundation.butterbrews.dto.BBDtos.*;
import com.webappfoundation.butterbrews.service.*;
import com.webappfoundation.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Public reads + signed-in guest actions for the Butter Brews site. Guests get 401 on the auth-only routes. */
@RestController
@RequestMapping("/api/v1/bb")
public class ButterBrewsController {

    private final DishNoteService dishNotes;
    private final BakeBoardService bakeBoard;
    private final SeatingService seating;
    private final ReservationService reservations;
    private final IdeaService ideas;
    private final FavouriteService favourites;
    private final StoryService story;
    private final RewardsService rewards;

    public ButterBrewsController(DishNoteService dishNotes, BakeBoardService bakeBoard, SeatingService seating,
                                 ReservationService reservations, IdeaService ideas, FavouriteService favourites,
                                 StoryService story, RewardsService rewards) {
        this.dishNotes = dishNotes;
        this.bakeBoard = bakeBoard;
        this.seating = seating;
        this.reservations = reservations;
        this.ideas = ideas;
        this.favourites = favourites;
        this.story = story;
        this.rewards = rewards;
    }

    // public
    @GetMapping("/dish-notes")
    public List<DishNoteDto> dishNotes() { return dishNotes.list(); }

    @GetMapping("/bake-board")
    public BakeBoardDto bakeBoard() { return bakeBoard.board(); }

    @GetMapping("/seating")
    public List<SeatingAreaDto> seating() { return seating.listActive(); }

    @GetMapping("/seating/availability")
    public List<AreaAvailabilityDto> availability(@RequestParam(required = false) String date) { return seating.availability(date); }

    @GetMapping("/story")
    public List<StoryChapterDto> story() { return story.published(); }

    @GetMapping("/ways-to-earn")
    public List<EarnRuleDto> waysToEarn() { return rewards.waysToEarn(); }

    @GetMapping("/ideas")
    public List<IdeaDto> ideas(@CurrentUser Integer userId) { return ideas.publicList(userId); }

    // signed-in
    @PostMapping("/ideas")
    @ResponseStatus(HttpStatus.CREATED)
    public IdeaSubmitResult submitIdea(@CurrentUser Integer userId, @RequestBody CreateIdeaRequest req) { return ideas.submit(userId, req); }

    @PostMapping("/ideas/{id}/vote")
    public IdeaDto vote(@CurrentUser Integer userId, @PathVariable Long id) { return ideas.vote(userId, id); }

    @GetMapping("/ideas/mine")
    public List<IdeaDto> myIdeas(@CurrentUser Integer userId) { return ideas.mine(userId); }

    @PostMapping("/reservations")
    @ResponseStatus(HttpStatus.CREATED)
    public ReservationView book(@CurrentUser Integer userId, @RequestBody CreateReservationRequest req) { return reservations.create(userId, req); }

    @GetMapping("/reservations/mine")
    public List<ReservationView> myReservations(@CurrentUser Integer userId) { return reservations.mine(userId); }

    @GetMapping("/favourites")
    public List<Long> myFavourites(@CurrentUser Integer userId) { return favourites.mine(userId); }

    @PutMapping("/favourites/{productId}")
    public List<Long> addFavourite(@CurrentUser Integer userId, @PathVariable Long productId) { return favourites.add(userId, productId); }

    @DeleteMapping("/favourites/{productId}")
    public List<Long> removeFavourite(@CurrentUser Integer userId, @PathVariable Long productId) { return favourites.remove(userId, productId); }

    @GetMapping("/journey")
    public JourneyDto journey(@CurrentUser Integer userId) { return rewards.journey(userId); }

    @PostMapping("/journey/marks")
    public JourneyDto mark(@CurrentUser Integer userId, @RequestBody Map<String, String> body) {
        return rewards.mark(userId, body == null ? null : body.get("mark"));
    }
}
