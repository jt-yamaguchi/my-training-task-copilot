package com.example.training.category;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CategoryApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void 初期カテゴリを一覧で取得できる() throws Exception {
        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].name").value("仕事"))
                .andExpect(jsonPath("$[1].name").value("私用"))
                .andExpect(jsonPath("$[2].name").value("勉強"));
    }

    @Test
    void カテゴリを追加して一覧で取得し削除できる() throws Exception {
        MvcResult created = mockMvc.perform(post("/api/categories")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"  趣味  \"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("趣味"))
                .andReturn();
        Number id = JsonPath.read(created.getResponse().getContentAsString(), "$.id");
        mockMvc.perform(get("/api/categories"))
                .andExpect(jsonPath("$[3].id").value(id.intValue()))
                .andExpect(jsonPath("$[3].name").value("趣味"));
        mockMvc.perform(delete("/api/categories/{id}", id.longValue()))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/categories"))
                .andExpect(jsonPath("$.length()").value(3));
        mockMvc.perform(delete("/api/categories/{id}", id.longValue()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void 空白名と長すぎる名前と同名は400になる() throws Exception {
        for (String name : new String[] { "   ", "長".repeat(101), " 仕事 " }) {
            mockMvc.perform(post("/api/categories")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"" + name + "\"}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").exists());
        }
        mockMvc.perform(post("/api/categories")
                .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
    }
}