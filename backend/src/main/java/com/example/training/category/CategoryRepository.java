package com.example.training.category;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findAllByOrderByIdAsc();

    boolean existsByName(String name);

    @Lock(LockModeType.PESSIMISTIC_READ)
    @Query("select category from Category category where category.id = :id")
    Optional<Category> findByIdForTask(@Param("id") Long id);
}
