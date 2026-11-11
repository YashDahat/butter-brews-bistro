package com.webappfoundation.butterbrews.repo;

import com.webappfoundation.model.ProductReview;
import org.springframework.data.repository.Repository;

/** Read-only count over the foundation's product reviews (separate from the fenced repository). */
public interface ReviewCountRepository extends Repository<ProductReview, Long> {
    long countByUserId(Integer userId);
}
