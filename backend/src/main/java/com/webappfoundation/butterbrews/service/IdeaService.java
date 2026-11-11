package com.webappfoundation.butterbrews.service;

import com.webappfoundation.butterbrews.dto.BBDtos.*;
import com.webappfoundation.butterbrews.model.*;
import com.webappfoundation.butterbrews.repo.IdeaRepository;
import com.webappfoundation.butterbrews.repo.IdeaVoteRepository;
import com.webappfoundation.dto.BulkUploadResult;
import com.webappfoundation.exception.ResourceNotFoundException;
import com.webappfoundation.model.LoyaltyEventType;
import com.webappfoundation.repository.UserRepository;
import com.webappfoundation.service.AuditService;
import com.webappfoundation.service.CoinService;
import com.webappfoundation.service.LoyaltyEventService;
import com.webappfoundation.service.SpreadsheetParser;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Schmear Lab: guests suggest a bagel, dish, brew or improvement; others +1 it; the team marks it Planned / Done.
 * Submitting records a SUGGESTION loyalty event (coins per the live rule, capped per day by the engine). The
 * reward is for submitting, never for what the idea says.
 */
@Service
public class IdeaService {

    private static final List<IdeaStatus> PUBLIC = List.of(IdeaStatus.NEW, IdeaStatus.PLANNED, IdeaStatus.DONE);

    private final IdeaRepository ideas;
    private final IdeaVoteRepository votes;
    private final UserRepository users;
    private final LoyaltyEventService loyaltyEvents;
    private final CoinService coins;
    private final SpreadsheetParser parser;
    private final AuditService audit;

    public IdeaService(IdeaRepository ideas, IdeaVoteRepository votes, UserRepository users,
                       LoyaltyEventService loyaltyEvents, CoinService coins, SpreadsheetParser parser, AuditService audit) {
        this.ideas = ideas;
        this.votes = votes;
        this.users = users;
        this.loyaltyEvents = loyaltyEvents;
        this.coins = coins;
        this.parser = parser;
        this.audit = audit;
    }

    public List<IdeaDto> publicList(Integer userId) {
        Set<Long> voted = votedBy(userId);
        return ideas.findByStatusInOrderByVotesDescCreatedAtDesc(PUBLIC).stream()
                .map(i -> toDto(i, userId, voted)).toList();
    }

    public List<IdeaDto> mine(Integer userId) {
        requireUser(userId);
        Set<Long> voted = votedBy(userId);
        return ideas.findByUserIdOrderByCreatedAtDesc(userId).stream().map(i -> toDto(i, userId, voted)).toList();
    }

    @Transactional
    public IdeaSubmitResult submit(Integer userId, CreateIdeaRequest r) {
        requireUser(userId);
        if (r == null || r.topic() == null) bad("Pick what your idea is about");
        String title = r.title() == null ? "" : r.title().trim();
        if (title.length() < 4 || title.length() > 80) bad("Give your idea a short title (4 to 80 characters)");
        if (r.details() != null && r.details().length() > 600) bad("Keep the details under 600 characters");
        String first = users.findById(userId).map(u -> u.getFirstName()).filter(n -> n != null && !n.isBlank())
                .map(n -> n.length() > 40 ? n.substring(0, 40) : n).orElse("A guest");
        Instant now = Instant.now();
        Idea idea = ideas.save(Idea.builder().userId(userId).authorName(first).topic(r.topic()).title(title)
                .details(DishNoteService.blank(r.details())).status(IdeaStatus.NEW).votes(0)
                .createdAt(now).updatedAt(now).build());

        BigDecimal before = safeSpendable(userId);
        loyaltyEvents.record(userId, LoyaltyEventType.SUGGESTION, null,
                Map.of("ideaId", idea.getId(), "topic", r.topic().name()));
        int earned = safeSpendable(userId).subtract(before).max(BigDecimal.ZERO).intValue();
        String msg = earned > 0 ? "+" + earned + " coins for your idea. Thank you!"
                : "Thank you! Your idea is in the Lab. (Idea coins are limited to one a day.)";
        return new IdeaSubmitResult(toDto(idea, userId, Set.of()), earned, msg);
    }

    @Transactional
    public IdeaDto vote(Integer userId, Long ideaId) {
        requireUser(userId);
        Idea idea = ideas.findById(ideaId).orElseThrow(() -> new ResourceNotFoundException("Idea not found"));
        if (Objects.equals(idea.getUserId(), userId)) bad("You can't +1 your own idea, but you can share it");
        if (!votes.existsByIdeaIdAndUserId(ideaId, userId)) {
            try {
                votes.saveAndFlush(IdeaVote.builder().ideaId(ideaId).userId(userId).createdAt(Instant.now()).build());
                idea.setVotes((idea.getVotes() == null ? 0 : idea.getVotes()) + 1);
                ideas.save(idea);
            } catch (DataIntegrityViolationException ignored) {
                // a double tap raced us; the vote already exists
            }
        }
        return toDto(idea, userId, votedBy(userId));
    }

    // admin
    public List<IdeaDto> adminList() {
        return ideas.findAllByOrderByCreatedAtDesc().stream().map(i -> toDto(i, null, Set.of())).toList();
    }

    @Transactional
    public IdeaDto adminUpdate(Long id, UpdateIdeaRequest r) {
        Idea idea = ideas.findById(id).orElseThrow(() -> new ResourceNotFoundException("Idea not found"));
        if (r == null || r.status() == null) bad("Pick a status");
        if (r.teamReply() != null && r.teamReply().length() > 280) bad("Reply must be under 280 characters");
        idea.setStatus(r.status());
        idea.setTeamReply(DishNoteService.blank(r.teamReply()));
        idea.setUpdatedAt(Instant.now());
        idea = ideas.save(idea);
        audit.record("BB_IDEA_UPDATED", "SUCCESS", "IDEA", String.valueOf(id), "status=" + r.status());
        return toDto(idea, null, Set.of());
    }

    @Transactional
    public void adminDelete(Long id) {
        Idea idea = ideas.findById(id).orElseThrow(() -> new ResourceNotFoundException("Idea not found"));
        ideas.delete(idea);
        audit.record("BB_IDEA_DELETED", "SUCCESS", "IDEA", String.valueOf(id), null);
    }

    /** Admin import of ideas gathered offline (comment cards). Columns: topic, title, details, status, teamReply. No coins. */
    @Transactional
    public BulkUploadResult bulkImport(MultipartFile file) {
        BulkUploadResult result = BulkUploadResult.builder().build();
        int rowNo = 1;
        for (Map<String, String> row : parser.parse(file)) {
            rowNo++;
            try {
                String title = BulkRows.str(row, "title");
                if (title == null || title.length() > 80) throw new IllegalArgumentException("title is required (max 80)");
                Instant now = Instant.now();
                ideas.save(Idea.builder().authorName("Comment card")
                        .topic(BulkRows.enumOf(IdeaTopic.class, row, "topic", IdeaTopic.MENU)).title(title)
                        .details(BulkRows.str(row, "details"))
                        .status(BulkRows.enumOf(IdeaStatus.class, row, "status", IdeaStatus.NEW))
                        .teamReply(BulkRows.str(row, "teamreply")).votes(0).createdAt(now).updatedAt(now).build());
                result.setCreated(result.getCreated() + 1);
            } catch (Exception e) {
                result.addError(rowNo, e.getMessage());
            }
        }
        audit.record("BB_IDEA_BULK_UPLOAD", "SUCCESS", "IDEA", null, "created=" + result.getCreated() + " failed=" + result.getFailed());
        return result;
    }

    public long countMine(Integer userId) {
        return userId == null ? 0 : ideas.countByUserId(userId);
    }

    private BigDecimal safeSpendable(Integer userId) {
        try {
            BigDecimal b = coins.spendable(userId);
            return b == null ? BigDecimal.ZERO : b;
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    private Set<Long> votedBy(Integer userId) {
        if (userId == null) return Set.of();
        return votes.findByUserId(userId).stream().map(IdeaVote::getIdeaId).collect(Collectors.toSet());
    }

    private static IdeaDto toDto(Idea i, Integer userId, Set<Long> voted) {
        return new IdeaDto(i.getId(), i.getAuthorName(), i.getTopic(), i.getTitle(), i.getDetails(), i.getStatus(),
                i.getTeamReply(), i.getVotes(), userId != null && Objects.equals(i.getUserId(), userId),
                voted.contains(i.getId()), i.getCreatedAt());
    }

    private static void requireUser(Integer userId) {
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in first");
    }

    private static void bad(String msg) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }
}
