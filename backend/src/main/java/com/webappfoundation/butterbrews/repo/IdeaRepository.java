package com.webappfoundation.butterbrews.repo;

import com.webappfoundation.butterbrews.model.Idea;
import com.webappfoundation.butterbrews.model.IdeaStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface IdeaRepository extends JpaRepository<Idea, Long> {
    List<Idea> findByStatusInOrderByVotesDescCreatedAtDesc(Collection<IdeaStatus> statuses);
    List<Idea> findByUserIdOrderByCreatedAtDesc(Integer userId);
    List<Idea> findAllByOrderByCreatedAtDesc();
    long countByUserId(Integer userId);
}
