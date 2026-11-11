package com.webappfoundation.butterbrews.service;

import com.webappfoundation.butterbrews.dto.BBDtos.*;
import com.webappfoundation.butterbrews.model.StoryChapter;
import com.webappfoundation.butterbrews.repo.StoryChapterRepository;
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
import java.util.List;
import java.util.Map;

/** Admin-editable "Our story" chapters. */
@Service
public class StoryService {

    private final StoryChapterRepository chapters;
    private final SpreadsheetParser parser;
    private final AuditService audit;

    public StoryService(StoryChapterRepository chapters, SpreadsheetParser parser, AuditService audit) {
        this.chapters = chapters;
        this.parser = parser;
        this.audit = audit;
    }

    public List<StoryChapterDto> published() {
        return chapters.findByActiveTrueOrderByOrdinalAsc().stream().map(StoryService::toDto).toList();
    }

    public List<StoryChapterDto> all() {
        return chapters.findAllByOrderByOrdinalAsc().stream().map(StoryService::toDto).toList();
    }

    @Transactional
    public StoryChapterDto create(UpsertStoryChapterRequest r) {
        StoryChapter c = new StoryChapter();
        apply(c, r);
        c = chapters.save(c);
        audit.record("BB_STORY_CHAPTER_CREATED", "SUCCESS", "STORY_CHAPTER", String.valueOf(c.getId()), c.getTitle());
        return toDto(c);
    }

    @Transactional
    public StoryChapterDto update(Long id, UpsertStoryChapterRequest r) {
        StoryChapter c = chapters.findById(id).orElseThrow(() -> new ResourceNotFoundException("Chapter not found"));
        apply(c, r);
        c = chapters.save(c);
        audit.record("BB_STORY_CHAPTER_UPDATED", "SUCCESS", "STORY_CHAPTER", String.valueOf(id), c.getTitle());
        return toDto(c);
    }

    @Transactional
    public void delete(Long id) {
        StoryChapter c = chapters.findById(id).orElseThrow(() -> new ResourceNotFoundException("Chapter not found"));
        chapters.delete(c);
        audit.record("BB_STORY_CHAPTER_DELETED", "SUCCESS", "STORY_CHAPTER", String.valueOf(id), c.getTitle());
    }

    /** Columns: ordinal, step, marker, title, body. */
    @Transactional
    public BulkUploadResult bulkImport(MultipartFile file) {
        BulkUploadResult result = BulkUploadResult.builder().build();
        int rowNo = 1;
        for (Map<String, String> row : parser.parse(file)) {
            rowNo++;
            try {
                StoryChapter c = new StoryChapter();
                apply(c, new UpsertStoryChapterRequest(BulkRows.integer(row, "ordinal"), BulkRows.str(row, "step"),
                        BulkRows.str(row, "marker"), BulkRows.str(row, "title"), BulkRows.str(row, "body"), true));
                chapters.save(c);
                result.setCreated(result.getCreated() + 1);
            } catch (ResponseStatusException e) {
                result.addError(rowNo, e.getReason());
            } catch (Exception e) {
                result.addError(rowNo, e.getMessage());
            }
        }
        audit.record("BB_STORY_BULK_UPLOAD", "SUCCESS", "STORY_CHAPTER", null, "created=" + result.getCreated());
        return result;
    }

    private static void apply(StoryChapter c, UpsertStoryChapterRequest r) {
        if (r == null || r.title() == null || r.title().isBlank() || r.title().length() > 120) bad("Title is required (max 120)");
        if (r.body() == null || r.body().isBlank() || r.body().length() > 1200) bad("Story text is required (max 1200)");
        if (r.step() == null || r.step().isBlank() || r.step().length() > 24) bad("Step name is required (max 24)");
        if (r.marker() != null && r.marker().length() > 24) bad("Marker must be under 24 characters");
        if (r.ordinal() == null || r.ordinal() < 1 || r.ordinal() > 99) bad("Order must be 1 to 99");
        c.setOrdinal(r.ordinal());
        c.setStep(r.step().trim());
        c.setMarker(DishNoteService.blank(r.marker()));
        c.setTitle(r.title().trim());
        c.setBody(r.body().trim());
        c.setActive(r.active() == null || r.active());
        c.setUpdatedAt(Instant.now());
    }

    static StoryChapterDto toDto(StoryChapter c) {
        return new StoryChapterDto(c.getId(), c.getOrdinal(), c.getStep(), c.getMarker(), c.getTitle(), c.getBody(), c.isActive());
    }

    private static void bad(String msg) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }
}
