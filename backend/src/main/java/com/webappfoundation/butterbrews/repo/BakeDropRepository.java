package com.webappfoundation.butterbrews.repo;

import com.webappfoundation.butterbrews.model.BakeDrop;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface BakeDropRepository extends JpaRepository<BakeDrop, Long> {
    List<BakeDrop> findByBakeDateOrderBySortOrderAscIdAsc(LocalDate bakeDate);
    List<BakeDrop> findAllByOrderByBakeDateDescSortOrderAsc();
    boolean existsByBakeDate(LocalDate bakeDate);
}
