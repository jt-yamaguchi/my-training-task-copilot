package com.example.training.task;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

/**
 * タスクエンティティ。
 * DBのtasksテーブルと1対1で対応する。APIには直接公開せずDTOに変換すること。
 */
@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private boolean done;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected Task() {
        // JPAが使用するデフォルトコンストラクタ
    }

    public Task(String title, String description) {
        this.title = title;
        this.description = description;
        this.done = false;
        this.createdAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public boolean isDone() {
        return done;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void update(String title, String description, boolean done) {
        this.title = title;
        this.description = description;
        this.done = done;
    }
}
