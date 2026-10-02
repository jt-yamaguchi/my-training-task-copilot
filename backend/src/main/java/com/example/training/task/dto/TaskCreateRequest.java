package com.example.training.task.dto;

import com.example.training.task.TaskPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * タスク作成リクエスト。
 */
public record TaskCreateRequest(
        @NotBlank(message = "タイトルは必須です") @Size(max = 100, message = "タイトルは100文字以内で入力してください") String title,

        @Size(max = 500, message = "説明は500文字以内で入力してください") String description,

        TaskPriority priority) {
}
