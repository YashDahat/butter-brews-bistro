package com.webappfoundation.butterbrews.repo;

import com.webappfoundation.butterbrews.model.Favourite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavouriteRepository extends JpaRepository<Favourite, Long> {
    List<Favourite> findByUserIdOrderByCreatedAtDesc(Integer userId);
    Optional<Favourite> findByUserIdAndProductId(Integer userId, Long productId);
    long countByUserId(Integer userId);
}
