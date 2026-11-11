package com.webappfoundation.butterbrews.service;

import com.webappfoundation.butterbrews.catalog.BBTypes;
import com.webappfoundation.butterbrews.dto.BBDtos.*;
import com.webappfoundation.butterbrews.model.Diet;
import com.webappfoundation.butterbrews.model.DishNote;
import com.webappfoundation.butterbrews.repo.DishNoteRepository;
import com.webappfoundation.dto.BulkUploadResult;
import com.webappfoundation.exception.ResourceNotFoundException;
import com.webappfoundation.model.Product;
import com.webappfoundation.repository.ProductRepository;
import com.webappfoundation.service.AuditService;
import com.webappfoundation.service.SpreadsheetParser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Menu extras (veg marks, signature, "new" window, pairing) layered over the foundation Product catalogue. */
@Service
public class DishNoteService {

    private final DishNoteRepository notes;
    private final ProductRepository products;
    private final SpreadsheetParser parser;
    private final AuditService audit;

    public DishNoteService(DishNoteRepository notes, ProductRepository products, SpreadsheetParser parser, AuditService audit) {
        this.notes = notes;
        this.products = products;
        this.parser = parser;
        this.audit = audit;
    }

    public List<DishNoteDto> list() {
        List<DishNote> all = notes.findAll();
        Map<Long, String> names = products.findByIdIn(all.stream().map(DishNote::getProductId).toList()).stream()
                .collect(Collectors.toMap(Product::getId, Product::getName, (a, b) -> a));
        LocalDate today = LocalDate.now(BBTypes.ZONE);
        return all.stream().map(n -> toDto(n, names.get(n.getProductId()), today))
                .sorted(Comparator.comparing(d -> d.productName() == null ? "" : d.productName()))
                .toList();
    }

    @Transactional
    public DishNoteDto upsert(UpsertDishNoteRequest r) {
        if (r == null || r.productId() == null) bad("Pick a menu item");
        Product p = products.findById(r.productId()).orElseThrow(() -> new ResourceNotFoundException("Menu item not found"));
        if (r.pairing() != null && r.pairing().length() > 160) bad("Pairing note must be under 160 characters");
        DishNote n = notes.findByProductId(p.getId()).orElseGet(() -> DishNote.builder().productId(p.getId()).build());
        boolean created = n.getId() == null;
        n.setDiet(r.diet() == null ? Diet.VEG : r.diet());
        n.setSignature(Boolean.TRUE.equals(r.signature()));
        n.setNewUntil(r.newUntil());
        n.setPairing(blank(r.pairing()));
        n.setUpdatedAt(Instant.now());
        n = notes.save(n);
        audit.record(created ? "BB_DISH_NOTE_CREATED" : "BB_DISH_NOTE_UPDATED", "SUCCESS", "DISH_NOTE",
                String.valueOf(n.getId()), p.getName());
        return toDto(n, p.getName(), LocalDate.now(BBTypes.ZONE));
    }

    @Transactional
    public void delete(Long id) {
        DishNote n = notes.findById(id).orElseThrow(() -> new ResourceNotFoundException("Menu note not found"));
        notes.delete(n);
        audit.record("BB_DISH_NOTE_DELETED", "SUCCESS", "DISH_NOTE", String.valueOf(id), null);
    }

    /** Columns: productSlug, diet (VEG/EGG/NON_VEG/VEGAN), signature, newUntil (yyyy-MM-dd), pairing. */
    @Transactional
    public BulkUploadResult bulkImport(MultipartFile file) {
        BulkUploadResult result = BulkUploadResult.builder().build();
        int rowNo = 1;
        for (Map<String, String> row : parser.parse(file)) {
            rowNo++;
            try {
                String slug = BulkRows.str(row, "productslug");
                if (slug == null) throw new IllegalArgumentException("productSlug is required");
                Product p = products.findBySlug(slug).orElseThrow(() -> new IllegalArgumentException("No menu item with slug " + slug));
                upsert(new UpsertDishNoteRequest(p.getId(), BulkRows.enumOf(Diet.class, row, "diet", Diet.VEG),
                        BulkRows.bool(row, "signature", false), BulkRows.date(row, "newuntil"), BulkRows.str(row, "pairing")));
                result.setCreated(result.getCreated() + 1);
            } catch (ResponseStatusException e) {
                result.addError(rowNo, e.getReason());
            } catch (Exception e) {
                result.addError(rowNo, e.getMessage());
            }
        }
        audit.record("BB_DISH_NOTE_BULK_UPLOAD", "SUCCESS", "DISH_NOTE", null,
                "created=" + result.getCreated() + " failed=" + result.getFailed());
        return result;
    }

    private static DishNoteDto toDto(DishNote n, String name, LocalDate today) {
        boolean isNew = n.getNewUntil() != null && !n.getNewUntil().isBefore(today);
        return new DishNoteDto(n.getId(), n.getProductId(), name, n.getDiet(), n.isSignature(), n.getNewUntil(), isNew, n.getPairing());
    }

    static String blank(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static void bad(String msg) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }
}
