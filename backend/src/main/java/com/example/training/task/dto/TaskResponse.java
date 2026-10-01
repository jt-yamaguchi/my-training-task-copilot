package com.example.training.task.dto;

import com.example.training.task.Task;
import java.time.OffsetDateTime;

/**
 * タスクのレスポンス。エンティティからの変換はfromメソッドに集約する。
 */
public record TaskResponse(
        Long id,
        String title,
        String description,
        boolean done,
        OffsetDateTime createdAt
) {

    public static TaskResponse from(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.isDone(),
                task.getCreatedAt()
        );
    }
}
