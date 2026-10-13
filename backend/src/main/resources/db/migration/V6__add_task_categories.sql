CREATE TABLE categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    CONSTRAINT uk_categories_name UNIQUE (name)
);

ALTER TABLE tasks ADD COLUMN category_id BIGINT;
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_category
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
CREATE INDEX idx_tasks_category_id ON tasks(category_id);

INSERT INTO categories (name) VALUES ('仕事'), ('私用'), ('勉強');