package com.webappfoundation.butterbrews.repo;

import com.webappfoundation.butterbrews.model.SeatingArea;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SeatingAreaRepository extends JpaRepository<SeatingArea, Long> {
    List<SeatingArea> findByActiveTrueOrderBySortOrderAsc();
    List<SeatingArea> findAllByOrderBySortOrderAsc();
    List<SeatingArea> findByIdIn(Collection<Long> ids);
    Optional<SeatingArea> findBySlug(String slug);
    boolean existsBySlug(String slug);
}
