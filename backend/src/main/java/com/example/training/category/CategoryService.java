package com.example.training.category;

import com.example.training.category.dto.CategoryCreateRequest;
import com.example.training.category.dto.CategoryResponse;
import com.example.training.common.BadRequestException;
import com.example.training.common.NotFoundException;
import java.util.List;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<CategoryResponse> findAll() {
        return categoryRepository.findAllByOrderByIdAsc().stream()
                .map(CategoryResponse::from)
                .toList();
    }

    @Transactional
    public CategoryResponse create(CategoryCreateRequest request) {
        if (categoryRepository.existsByName(request.name())) {
            throw new BadRequestException("同名のカテゴリが存在します");
        }
        try {
            return CategoryResponse.from(categoryRepository.saveAndFlush(new Category(request.name())));
        } catch (DataIntegrityViolationException exception) {
            if (exception.getCause() instanceof ConstraintViolationException violation
                    && "23505".equals(violation.getSQLState())) {
                throw new BadRequestException("同名のカテゴリが存在します");
            }
            throw exception;
        }
    }

    @Transactional
    public void delete(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("カテゴリが見つかりません: id=" + id));
        categoryRepository.delete(category);
        categoryRepository.flush();
    }
}
