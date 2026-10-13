package com.example.training.task.dto;

import com.example.training.task.Task;
import com.example.training.task.TaskPriority;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * タスクのレスポンス。エンティティからの変換はfromメソッドに集約する。
 */
public record TaskResponse(
        Long id,
        String title,
        String description,
        TaskPriority priority,
        boolean done,
        LocalDate dueDate,
        OffsetDateTime createdAt,
        OffsetDateTime completedAt,
        Long categoryId) {

    public static TaskResponse from(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getPriority(),
                task.isDone(),
                task.getDueDate(),
                task.getCreatedAt(),
                task.getCompletedAt(),
                task.getCategoryId());
    }
}
