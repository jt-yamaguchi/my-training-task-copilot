-- 起動直後に画面で動作確認するための初期データ
INSERT INTO tasks (title, description, done) VALUES
    ('環境構築を完了する', 'docs/setup.md の手順を最後まで実施し doctor.sh で確認する', TRUE),
    ('CLAUDE.md を読む', 'このリポジトリの開発ルールを理解する', FALSE),
    ('最初の機能を追加する', 'Claude Code に指示して期限(due_date)機能を追加してみる', FALSE);
