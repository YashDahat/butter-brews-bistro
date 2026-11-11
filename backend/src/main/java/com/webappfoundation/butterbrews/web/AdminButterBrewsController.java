package com.webappfoundation.butterbrews.web;

import com.webappfoundation.butterbrews.dto.BBDtos.*;
import com.webappfoundation.butterbrews.service.*;
import com.webappfoundation.dto.BulkUploadResult;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/** Back-office for the bistro's own content. /api/v1/admin/** is ADMIN-gated by the fenced SecurityConfig. */
@RestController
@RequestMapping("/api/v1/admin/bb")
public class AdminButterBrewsController {

    private final DishNoteService dishNotes;
    private final BakeBoardService bakeBoard;
    private final SeatingService seating;
    private final ReservationService reservations;
    private final IdeaService ideas;
    private final StoryService story;

    public AdminButterBrewsController(DishNoteService dishNotes, BakeBoardService bakeBoard, SeatingService seating,
                                      ReservationService reservations, IdeaService ideas, StoryService story) {
        this.dishNotes = dishNotes;
        this.bakeBoard = bakeBoard;
        this.seating = seating;
        this.reservations = reservations;
        this.ideas = ideas;
        this.story = story;
    }

    // dish notes
    @GetMapping("/dish-notes") public List<DishNoteDto> dishNotes() { return dishNotes.list(); }
    @PutMapping("/dish-notes") public DishNoteDto upsertDishNote(@RequestBody UpsertDishNoteRequest r) { return dishNotes.upsert(r); }
    @DeleteMapping("/dish-notes/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void deleteDishNote(@PathVariable Long id) { dishNotes.delete(id); }
    @PostMapping("/dish-notes/bulk-upload") public BulkUploadResult bulkDishNotes(@RequestParam("file") MultipartFile file) { return dishNotes.bulkImport(file); }

    // bake board
    @GetMapping("/bake-drops") public List<BakeDropDto> bakeDrops() { return bakeBoard.listAll(); }
    @PostMapping("/bake-drops") @ResponseStatus(HttpStatus.CREATED) public BakeDropDto createBake(@RequestBody UpsertBakeDropRequest r) { return bakeBoard.create(r); }
    @PutMapping("/bake-drops/{id}") public BakeDropDto updateBake(@PathVariable Long id, @RequestBody UpsertBakeDropRequest r) { return bakeBoard.update(id, r); }
    @DeleteMapping("/bake-drops/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void deleteBake(@PathVariable Long id) { bakeBoard.delete(id); }
    @PostMapping("/bake-drops/bulk-upload") public BulkUploadResult bulkBakes(@RequestParam("file") MultipartFile file) { return bakeBoard.bulkImport(file); }

    // seating
    @GetMapping("/seating") public List<SeatingAreaDto> seating() { return seating.listAll(); }
    @PostMapping("/seating") @ResponseStatus(HttpStatus.CREATED) public SeatingAreaDto createArea(@RequestBody UpsertSeatingAreaRequest r) { return seating.create(r); }
    @PutMapping("/seating/{id}") public SeatingAreaDto updateArea(@PathVariable Long id, @RequestBody UpsertSeatingAreaRequest r) { return seating.update(id, r); }
    @DeleteMapping("/seating/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void deleteArea(@PathVariable Long id) { seating.delete(id); }
    @PostMapping("/seating/bulk-upload") public BulkUploadResult bulkSeating(@RequestParam("file") MultipartFile file) { return seating.bulkImport(file); }

    // story
    @GetMapping("/story") public List<StoryChapterDto> story() { return story.all(); }
    @PostMapping("/story") @ResponseStatus(HttpStatus.CREATED) public StoryChapterDto createChapter(@RequestBody UpsertStoryChapterRequest r) { return story.create(r); }
    @PutMapping("/story/{id}") public StoryChapterDto updateChapter(@PathVariable Long id, @RequestBody UpsertStoryChapterRequest r) { return story.update(id, r); }
    @DeleteMapping("/story/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void deleteChapter(@PathVariable Long id) { story.delete(id); }
    @PostMapping("/story/bulk-upload") public BulkUploadResult bulkStory(@RequestParam("file") MultipartFile file) { return story.bulkImport(file); }

    // ideas (Schmear Lab)
    @GetMapping("/ideas") public List<IdeaDto> ideas() { return ideas.adminList(); }
    @PutMapping("/ideas/{id}") public IdeaDto updateIdea(@PathVariable Long id, @RequestBody UpdateIdeaRequest r) { return ideas.adminUpdate(id, r); }
    @DeleteMapping("/ideas/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void deleteIdea(@PathVariable Long id) { ideas.adminDelete(id); }
    @PostMapping("/ideas/bulk-upload") public BulkUploadResult bulkIdeas(@RequestParam("file") MultipartFile file) { return ideas.bulkImport(file); }

    // bookings (read view over the order spine; stages are managed on the order board)
    @GetMapping("/reservations") public List<AdminReservationRow> reservations() { return reservations.adminList(); }
}
