package com.webappfoundation.butterbrews.service;

import com.webappfoundation.butterbrews.catalog.BBTypes;
import com.webappfoundation.butterbrews.dto.BBDtos.*;
import com.webappfoundation.butterbrews.model.BakeDrop;
import com.webappfoundation.butterbrews.model.BakeStatus;
import com.webappfoundation.butterbrews.repo.BakeDropRepository;
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
import java.util.*;
import java.util.stream.Collectors;

/**
 * The "Out of the oven" board: what the bakehouse baked today and when each batch comes out. If nothing has been
 * posted for today yet, the public board shows the most recent bake day (flagged today=false) rather than nothing.
 */
@Service
public class BakeBoardService {

    private final BakeDropRepository drops;
    private final ProductRepository products;
    private final SpreadsheetParser parser;
    private final AuditService audit;

    public BakeBoardService(BakeDropRepository drops, ProductRepository products, SpreadsheetParser parser, AuditService audit) {
        this.drops = drops;
        this.products = products;
        this.parser = parser;
        this.audit = audit;
    }

    public BakeBoardDto board() {
        LocalDate today = LocalDate.now(BBTypes.ZONE);
        List<BakeDrop> list = drops.findByBakeDateOrderBySortOrderAscIdAsc(today);
        LocalDate shown = today;
        if (list.isEmpty()) {
            Optional<LocalDate> last = drops.findAllByOrderByBakeDateDescSortOrderAsc().stream()
                    .map(BakeDrop::getBakeDate).filter(d -> d.isBefore(today)).findFirst();
            if (last.isPresent()) {
                shown = last.get();
                list = drops.findByBakeDateOrderBySortOrderAscIdAsc(shown);
            }
        }
        return new BakeBoardDto(shown, shown.equals(today), toDtos(list));
    }

    public List<BakeDropDto> listAll() {
        return toDtos(drops.findAllByOrderByBakeDateDescSortOrderAsc());
    }

    @Transactional
    public BakeDropDto create(UpsertBakeDropRequest r) {
        BakeDrop d = new BakeDrop();
        apply(d, r);
        d = drops.save(d);
        audit.record("BB_BAKE_DROP_CREATED", "SUCCESS", "BAKE_DROP", String.valueOf(d.getId()), d.getName());
        return toDtos(List.of(d)).get(0);
    }

    @Transactional
    public BakeDropDto update(Long id, UpsertBakeDropRequest r) {
        BakeDrop d = drops.findById(id).orElseThrow(() -> new ResourceNotFoundException("Bake not found"));
        apply(d, r);
        d = drops.save(d);
        audit.record("BB_BAKE_DROP_UPDATED", "SUCCESS", "BAKE_DROP", String.valueOf(id), d.getName() + " " + d.getStatus());
        return toDtos(List.of(d)).get(0);
    }

    @Transactional
    public void delete(Long id) {
        BakeDrop d = drops.findById(id).orElseThrow(() -> new ResourceNotFoundException("Bake not found"));
        drops.delete(d);
        audit.record("BB_BAKE_DROP_DELETED", "SUCCESS", "BAKE_DROP", String.valueOf(id), d.getName());
    }

    /** Columns: name, productSlug, bakeDate (yyyy-MM-dd, default today), outAt (HH:mm), status, note, sortOrder. */
    @Transactional
    public BulkUploadResult bulkImport(MultipartFile file) {
        BulkUploadResult result = BulkUploadResult.builder().build();
        int rowNo = 1;
        for (Map<String, String> row : parser.parse(file)) {
            rowNo++;
            try {
                Long productId = null;
                String slug = BulkRows.str(row, "productslug");
                if (slug != null) {
                    productId = products.findBySlug(slug).map(Product::getId)
                            .orElseThrow(() -> new IllegalArgumentException("No menu item with slug " + slug));
                }
                BakeDrop d = new BakeDrop();
                apply(d, new UpsertBakeDropRequest(BulkRows.str(row, "name"), productId, BulkRows.date(row, "bakedate"),
                        BulkRows.str(row, "outat"), BulkRows.enumOf(BakeStatus.class, row, "status", BakeStatus.IN_THE_OVEN),
                        BulkRows.str(row, "note"), BulkRows.integer(row, "sortorder")));
                drops.save(d);
                result.setCreated(result.getCreated() + 1);
            } catch (ResponseStatusException e) {
                result.addError(rowNo, e.getReason());
            } catch (Exception e) {
                result.addError(rowNo, e.getMessage());
            }
        }
        audit.record("BB_BAKE_DROP_BULK_UPLOAD", "SUCCESS", "BAKE_DROP", null,
                "created=" + result.getCreated() + " failed=" + result.getFailed());
        return result;
    }

    private void apply(BakeDrop d, UpsertBakeDropRequest r) {
        if (r == null || r.name() == null || r.name().isBlank()) bad("Give the bake a name");
        if (r.name().length() > 80) bad("Name must be under 80 characters");
        if (r.note() != null && r.note().length() > 140) bad("Note must be under 140 characters");
        if (r.outAt() != null && !r.outAt().isBlank()) SlotRules.requireHhMm(r.outAt(), "Out-of-oven time");
        if (r.productId() != null && !products.existsById(r.productId())) bad("Linked menu item not found");
        d.setName(r.name().trim());
        d.setProductId(r.productId());
        d.setBakeDate(r.bakeDate() == null ? LocalDate.now(BBTypes.ZONE) : r.bakeDate());
        d.setOutAt(r.outAt() == null || r.outAt().isBlank() ? null : r.outAt().trim());
        d.setStatus(r.status() == null ? BakeStatus.IN_THE_OVEN : r.status());
        d.setNote(DishNoteService.blank(r.note()));
        d.setSortOrder(r.sortOrder() == null ? 0 : r.sortOrder());
        d.setUpdatedAt(Instant.now());
    }

    private List<BakeDropDto> toDtos(List<BakeDrop> list) {
        Set<Long> ids = list.stream().map(BakeDrop::getProductId).filter(Objects::nonNull).collect(Collectors.toSet());
        Map<Long, Product> ps = ids.isEmpty() ? Map.of() : products.findByIdIn(ids).stream()
                .collect(Collectors.toMap(Product::getId, p -> p, (a, b) -> a));
        return list.stream().map(d -> {
            Product p = d.getProductId() == null ? null : ps.get(d.getProductId());
            return new BakeDropDto(d.getId(), d.getName(), d.getProductId(), p == null ? null : p.getSlug(),
                    p == null ? null : p.getPrice(), d.getBakeDate(), d.getOutAt(), d.getStatus(), d.getNote(), d.getSortOrder());
        }).toList();
    }

    private static void bad(String msg) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }
}
