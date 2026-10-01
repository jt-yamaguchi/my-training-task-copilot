-- タスクテーブル(H2 PostgreSQL互換モードでも動く構文で書くこと)
CREATE TABLE tasks (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title       VARCHAR(100)             NOT NULL,
    description VARCHAR(500),
    done        BOOLEAN                  NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
