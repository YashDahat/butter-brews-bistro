package com.webappfoundation.butterbrews.repo;

import com.webappfoundation.butterbrews.model.DishNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DishNoteRepository extends JpaRepository<DishNote, Long> {
    Optional<DishNote> findByProductId(Long productId);
}
