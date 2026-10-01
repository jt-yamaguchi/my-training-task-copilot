package com.example.training.task;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * タスクAPIの結合テスト。H2(PostgreSQL互換モード)+ Flyway で実行される。
 * 新しいAPIを追加するときはこのテストの書き方を模倣すること。
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class TaskApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void タスク一覧を取得できる() throws Exception {
        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("環境構築を完了する"));
    }

    @Test
    void タスクを作成できる() throws Exception {
        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"新しいタスク\", \"description\": \"説明\", \"done\": false}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.title").value("新しいタスク"))
                .andExpect(jsonPath("$.done").value(false));
    }

    @Test
    void タイトルが空だと400になる() throws Exception {
        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"\", \"description\": null, \"done\": false}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void タスクを更新できる() throws Exception {
        mockMvc.perform(put("/api/tasks/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"更新後\", \"description\": null, \"done\": true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("更新後"))
                .andExpect(jsonPath("$.done").value(true));
    }

    @Test
    void 存在しないタスクは404になる() throws Exception {
        mockMvc.perform(get("/api/tasks/99999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void タスクを削除できる() throws Exception {
        mockMvc.perform(delete("/api/tasks/1"))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/tasks/1"))
                .andExpect(status().isNotFound());
    }
}
