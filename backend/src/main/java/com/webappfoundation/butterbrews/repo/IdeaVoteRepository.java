package com.webappfoundation.butterbrews.repo;

import com.webappfoundation.butterbrews.model.IdeaVote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IdeaVoteRepository extends JpaRepository<IdeaVote, Long> {
    boolean existsByIdeaIdAndUserId(Long ideaId, Integer userId);
    List<IdeaVote> findByUserId(Integer userId);
}
