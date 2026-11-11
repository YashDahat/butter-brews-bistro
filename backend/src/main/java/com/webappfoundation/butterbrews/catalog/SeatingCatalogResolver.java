package com.webappfoundation.butterbrews.catalog;

import com.webappfoundation.butterbrews.model.SeatingArea;
import com.webappfoundation.butterbrews.repo.SeatingAreaRepository;
import com.webappfoundation.catalog.CatalogItemResolver;
import com.webappfoundation.dto.CatalogItemDto;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * BB_SEATING -> CatalogItemDto. A table booking is free (₹0) and settles through the order spine's ₹0 path
 * straight to the bb-table CONFIRMED stage. Not cartable: bookings are placed from /book, never mixed with food.
 */
@Component
public class SeatingCatalogResolver implements CatalogItemResolver {

    private final SeatingAreaRepository repository;

    public SeatingCatalogResolver(SeatingAreaRepository repository) {
        this.repository = repository;
    }

    @Override
    public String itemType() {
        return BBTypes.SEATING;
    }

    @Override
    public List<CatalogItemDto> resolve(Collection<Long> ids) {
        return repository.findByIdIn(ids).stream().filter(SeatingArea::isActive).map(this::toDto).toList();
    }

    private CatalogItemDto toDto(SeatingArea a) {
        return CatalogItemDto.builder()
                .itemType(BBTypes.SEATING)
                .itemId(a.getId())
                .name("Table · " + a.getName())
                .description(a.getDescription())
                .price(BigDecimal.ZERO)
                .priceUnit("per guest")
                .slug(a.getSlug())
                .detailPath("/book")
                .category("Table booking")
                .active(a.isActive())
                .cartable(false)
                .workflowCode(BBTypes.WF_TABLE)
                .attributes(Map.of("outdoor", a.isOutdoor(), "petFriendly", a.isPetFriendly()))
                .build();
    }
}
