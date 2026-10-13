package com.example.training.task;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import jakarta.persistence.EntityManager;
import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import com.jayway.jsonpath.JsonPath;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
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

    @Autowired
    private EntityManager entityManager;

    @Test
    void カテゴリ付きで作成して取得でき更新後も保持する() throws Exception {
        long categoryId = createCategory("業務");
        long taskId = createCategorizedTask("カテゴリ付き", categoryId, "HIGH");
        entityManager.flush();
        entityManager.clear();
        mockMvc.perform(get("/api/tasks/{id}", taskId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categoryId").value(categoryId));
        mockMvc.perform(put("/api/tasks/{id}", taskId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"更新後\",\"done\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categoryId").value(categoryId));
    }

    @Test
    void カテゴリ省略とnullは未設定になる() throws Exception {
        for (String body : new String[] { "{\"title\":\"未設定\"}",
                "{\"title\":\"未設定\",\"categoryId\":null}" }) {
            mockMvc.perform(post("/api/tasks").contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.categoryId").hasJsonPath())
                    .andExpect(jsonPath("$.categoryId").value((Object) null));
        }
        mockMvc.perform(get("/api/tasks"))
                .andExpect(jsonPath("$[0].categoryId").hasJsonPath())
                .andExpect(jsonPath("$[0].categoryId").value((Object) null));
    }

    @Test
    void 存在しないカテゴリと不正なIDは400になる() throws Exception {
        for (String categoryId : new String[] { "999999", "0", "-1", "\"invalid\"" }) {
            mockMvc.perform(post("/api/tasks")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"title\":\"不正カテゴリ\",\"categoryId\":" + categoryId + "}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").exists());
        }
        for (String categoryId : new String[] { "999999", "0", "-1", "invalid" }) {
            mockMvc.perform(get("/api/tasks").param("categoryId", categoryId))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").exists());
        }
    }

    @Test
    void カテゴリで絞り込み優先度順と併用できる() throws Exception {
        long categoryId = createCategory("絞り込み");
        long otherId = createCategory("別カテゴリ");
        long lowId = createCategorizedTask("低", categoryId, "LOW");
        long highId = createCategorizedTask("高", categoryId, "HIGH");
        long secondHighId = createCategorizedTask("高その2", categoryId, "HIGH");
        createCategorizedTask("対象外", otherId, "HIGH");
        mockMvc.perform(get("/api/tasks").param("categoryId", Long.toString(categoryId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].id").value(lowId))
                .andExpect(jsonPath("$[1].id").value(highId));
        mockMvc.perform(get("/api/tasks").param("categoryId", Long.toString(categoryId)).param("sort", "priority"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].id").value(highId))
                .andExpect(jsonPath("$[1].id").value(secondHighId))
                .andExpect(jsonPath("$[2].id").value(lowId));
        mockMvc.perform(get("/api/tasks"))
                .andExpect(jsonPath("$.length()").value(7))
                .andExpect(jsonPath("$[0].categoryId").value((Object) null));
        long emptyId = createCategory("空カテゴリ");
        mockMvc.perform(get("/api/tasks").param("categoryId", Long.toString(emptyId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void 使用中カテゴリの削除はタスクを残してカテゴリだけ未設定にする() throws Exception {
        long categoryId = createCategory("削除対象");
        long otherId = createCategory("残すカテゴリ");
        long taskId = createCategorizedTask("保持するタスク", categoryId, "HIGH");
        long secondId = createCategorizedTask("もう一件", categoryId, "LOW");
        long otherTaskId = createCategorizedTask("別カテゴリのタスク", otherId, "MEDIUM");
        mockMvc.perform(put("/api/tasks/{id}", taskId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"保持するタスク\",\"description\":\"説明\",\"done\":true}"))
                .andExpect(status().isOk());
        entityManager.flush();
        entityManager.clear();
        MvcResult persisted = mockMvc.perform(get("/api/tasks/{id}", taskId))
                .andExpect(status().isOk()).andReturn();
        String completedAt = JsonPath.read(persisted.getResponse().getContentAsString(), "$.completedAt");
        String createdAt = JsonPath.read(persisted.getResponse().getContentAsString(), "$.createdAt");
        mockMvc.perform(delete("/api/categories/{id}", categoryId))
                .andExpect(status().isNoContent());
        entityManager.clear();
        mockMvc.perform(get("/api/tasks/{id}", taskId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(taskId))
                .andExpect(jsonPath("$.title").value("保持するタスク"))
                .andExpect(jsonPath("$.description").value("説明"))
                .andExpect(jsonPath("$.priority").value("HIGH"))
                .andExpect(jsonPath("$.done").value(true))
                .andExpect(jsonPath("$.createdAt").value(createdAt))
                .andExpect(jsonPath("$.completedAt").value(completedAt))
                .andExpect(jsonPath("$.categoryId").hasJsonPath())
                .andExpect(jsonPath("$.categoryId").value((Object) null));
        mockMvc.perform(get("/api/tasks/{id}", secondId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categoryId").value((Object) null));
        mockMvc.perform(get("/api/tasks/{id}", otherTaskId))
                .andExpect(jsonPath("$.categoryId").value(otherId));
        mockMvc.perform(get("/api/tasks"))
                .andExpect(jsonPath("$.length()").value(6));
        mockMvc.perform(get("/api/tasks").param("categoryId", Long.toString(categoryId)))
                .andExpect(status().isBadRequest());
    }

    private long createCategory(String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/categories")
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"" + name + "\"}"))
                .andExpect(status().isCreated()).andReturn();
        Number id = JsonPath.read(result.getResponse().getContentAsString(), "$.id");
        return id.longValue();
    }

    private long createCategorizedTask(String title, long categoryId, String priority) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/tasks")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"" + title + "\",\"categoryId\":" + categoryId
                        + ",\"priority\":\"" + priority + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.categoryId").value(categoryId)).andReturn();
        Number id = JsonPath.read(result.getResponse().getContentAsString(), "$.id");
        return id.longValue();
    }

    @Test
    void タスク一覧を取得できる() throws Exception {
        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("環境構築を完了する"));
    }

    @Test
    void 優先度を指定して作成し取得できる() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/tasks")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"高優先度\", \"priority\": \"HIGH\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.priority").value("HIGH"))
                .andReturn();

        Number idValue = JsonPath.read(result.getResponse().getContentAsString(), "$.id");
        long id = idValue.longValue();
        mockMvc.perform(get("/api/tasks/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.priority").value("HIGH"));
    }

    @Test
    void 優先度を未指定で作成すると中になる() throws Exception {
        mockMvc.perform(post("/api/tasks")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"既定優先度\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.priority").value("MEDIUM"))
                .andExpect(jsonPath("$.dueDate").value((Object) null));
    }

    @Test
    void 期限付きで作成して取得すると同じ日付が返る() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/tasks")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"期限付きタスク\", \"dueDate\": \"2026-10-15\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.dueDate").value("2026-10-15"))
                .andReturn();

        Number idValue = JsonPath.read(result.getResponse().getContentAsString(), "$.id");
        mockMvc.perform(get("/api/tasks/{id}", idValue.longValue()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dueDate").value("2026-10-15"));
    }

    @Test
    void 期限にnullを指定して作成できる() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/tasks")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"期限なしタスク\", \"dueDate\": null}"))
                .andExpect(status().isCreated())
                .andReturn();

        assertNull(JsonPath.read(result.getResponse().getContentAsString(), "$.dueDate"));
    }

    @Test
    void 更新しても作成時の期限を維持する() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/tasks")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"期限を維持するタスク\", \"dueDate\": \"2026-10-15\"}"))
                .andExpect(status().isCreated())
                .andReturn();

        Number idValue = JsonPath.read(result.getResponse().getContentAsString(), "$.id");
        mockMvc.perform(put("/api/tasks/{id}", idValue.longValue())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"更新後\", \"description\": null, \"done\": true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dueDate").value("2026-10-15"));
    }

    @Test
    void 不正な優先度では400になる() throws Exception {
        mockMvc.perform(post("/api/tasks")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"不正な優先度\", \"priority\": \"URGENT\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void 優先度順では高中低の順に取得できる() throws Exception {
        mockMvc.perform(post("/api/tasks")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"低優先度\", \"priority\": \"LOW\"}"));
        mockMvc.perform(post("/api/tasks")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"高優先度\", \"priority\": \"HIGH\"}"));

        mockMvc.perform(get("/api/tasks").param("sort", "priority"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].priority").value("HIGH"))
                .andExpect(jsonPath("$[1].priority").value("MEDIUM"))
                .andExpect(jsonPath("$[4].priority").value("LOW"));
    }

    @Test
    void 不明な並び替え指定では400になる() throws Exception {
        mockMvc.perform(get("/api/tasks").param("sort", "unknown"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void タスクを作成できる() throws Exception {
        MvcResult created = mockMvc.perform(post("/api/tasks")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"新しいタスク\", \"description\": \"説明\", \"done\": false}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.title").value("新しいタスク"))
                .andExpect(jsonPath("$.done").value(false))
                .andExpect(jsonPath("$.completedAt").hasJsonPath())
                .andExpect(jsonPath("$.completedAt").value((Object) null))
                .andReturn();

        entityManager.flush();
        entityManager.clear();
        Number idValue = JsonPath.read(created.getResponse().getContentAsString(), "$.id");
        mockMvc.perform(get("/api/tasks/{id}", idValue.longValue()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completedAt").hasJsonPath())
                .andExpect(jsonPath("$.completedAt").value((Object) null));
    }

    @Test
    void 完了日時を記録し取り消すとnullに戻る() throws Exception {
        MvcResult created = mockMvc.perform(post("/api/tasks")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"完了日時の検証\"}"))
                .andExpect(status().isCreated())
                .andReturn();

        Number idValue = JsonPath.read(created.getResponse().getContentAsString(), "$.id");
        long id = idValue.longValue();
        Instant beforeCompletion = Instant.now();
        MvcResult completed = mockMvc.perform(put("/api/tasks/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"完了日時の検証\", \"done\": true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.done").value(true))
                .andExpect(jsonPath("$.completedAt").isString())
                .andReturn();

        String completedAt = JsonPath.read(completed.getResponse().getContentAsString(), "$.completedAt");
        Instant completedInstant = OffsetDateTime.parse(completedAt).toInstant();
        assertTrue(!completedInstant.isBefore(beforeCompletion) && !completedInstant.isAfter(Instant.now()));
        entityManager.flush();
        entityManager.clear();
        MvcResult fetched = mockMvc.perform(get("/api/tasks/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completedAt").isString())
                .andReturn();
        String persistedAt = JsonPath.read(fetched.getResponse().getContentAsString(), "$.completedAt");
        Instant persistedInstant = OffsetDateTime.parse(persistedAt).toInstant();
        assertTrue(Duration.between(completedInstant, persistedInstant).abs().compareTo(Duration.ofMillis(1)) < 0);

        mockMvc.perform(put("/api/tasks/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"タイトル変更\", \"done\": true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completedAt").value(persistedAt));
        mockMvc.perform(put("/api/tasks/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"完了日時の検証\", \"done\": false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.done").value(false))
                .andExpect(jsonPath("$.completedAt").hasJsonPath())
                .andExpect(jsonPath("$.completedAt").value((Object) null));
        entityManager.flush();
        entityManager.clear();
        mockMvc.perform(get("/api/tasks/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completedAt").hasJsonPath())
                .andExpect(jsonPath("$.completedAt").value((Object) null));

        Instant beforeRecompletion = Instant.now();
        MvcResult recompleted = mockMvc.perform(put("/api/tasks/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"完了日時の検証\", \"done\": true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completedAt").isString())
                .andReturn();
        String recompletedAt = JsonPath.read(recompleted.getResponse().getContentAsString(), "$.completedAt");
        Instant recompletedInstant = OffsetDateTime.parse(recompletedAt).toInstant();
        assertTrue(!recompletedInstant.isBefore(beforeRecompletion) && !recompletedInstant.isAfter(Instant.now()));
    }

    @Test
    void 導入前の完了タスクは更新しても完了日時を補完しない() throws Exception {
        entityManager.createNativeQuery("UPDATE tasks SET done = true WHERE id = 1").executeUpdate();
        entityManager.clear();

        mockMvc.perform(put("/api/tasks/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"旧完了タスク\", \"done\": true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.done").value(true))
                .andExpect(jsonPath("$.completedAt").hasJsonPath())
                .andExpect(jsonPath("$.completedAt").value((Object) null));
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
