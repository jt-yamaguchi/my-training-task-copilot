package com.example.training.task.dto;

import com.example.training.task.Task;
import com.example.training.task.TaskPriority;
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
        OffsetDateTime createdAt) {

    public static TaskResponse from(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getPriority(),
                task.isDone(),
                task.getCreatedAt());
    }
}
