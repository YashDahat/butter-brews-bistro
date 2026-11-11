package com.webappfoundation.butterbrews.repo;

import com.webappfoundation.butterbrews.model.ReservationDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReservationDetailRepository extends JpaRepository<ReservationDetail, Long> {
    List<ReservationDetail> findByUserIdOrderBySlotKeyDesc(Integer userId);
    List<ReservationDetail> findAllByOrderBySlotKeyDesc();
}
