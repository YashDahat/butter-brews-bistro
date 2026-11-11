package com.webappfoundation.butterbrews.repo;

import com.webappfoundation.butterbrews.model.JourneyMark;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JourneyMarkRepository extends JpaRepository<JourneyMark, Long> {
    List<JourneyMark> findByUserId(Integer userId);
    boolean existsByUserIdAndMark(Integer userId, String mark);
}
