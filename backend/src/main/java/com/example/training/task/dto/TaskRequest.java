package com.example.training.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * タスクの作成・更新リクエスト。
 * バリデーションはこのDTOにBean Validationで記述する。
 */
public record TaskRequest(
        @NotBlank(message = "タイトルは必須です")
        @Size(max = 100, message = "タイトルは100文字以内で入力してください")
        String title,

        @Size(max = 500, message = "説明は500文字以内で入力してください")
        String description,

        boolean done
) {
}
