package com.example.training.task;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findAllByOrderByIdAsc();

    @Query(value = "SELECT * FROM tasks ORDER BY CASE priority "
            + "WHEN 'HIGH' THEN 0 WHEN 'MEDIUM' THEN 1 WHEN 'LOW' THEN 2 END, id ASC", nativeQuery = true)
    List<Task> findAllByPriorityAsc();
}
