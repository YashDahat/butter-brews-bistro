package com.webappfoundation.butterbrews.repo;

import com.webappfoundation.butterbrews.model.SlotHold;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SlotHoldRepository extends JpaRepository<SlotHold, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select h from SlotHold h where h.areaId = :areaId and h.slotKey = :slotKey")
    Optional<SlotHold> lockByAreaAndSlot(@Param("areaId") Long areaId, @Param("slotKey") String slotKey);

    List<SlotHold> findBySlotKeyStartingWith(String prefix);
}
