# 初回環境構築時にすること（タスク管理アプリの確認）

training-docs の [ローカル開発環境セットアップ手順書](https://github.com/BFHcopilot/training-docs/blob/main/生成AI研修_ローカル開発環境セットアップ手順書.md) の続きです。環境構築が終わったら、このリポジトリのタスク管理アプリをローカルで動かして確認します。**コードはまだ変更しません。**

## 1. 環境診断

🟧 **Ubuntu（ローカル）**

```bash
bash scripts/doctor.sh
```

全項目 **OK** になることを確認します。NGが出た項目は [troubleshooting.md](./troubleshooting.md) を見て解消してください。

## 2. タスク管理アプリを動かす

1枚目のターミナルで、DBとbackendを起動します。

🟧 **Ubuntu（ローカル）**

```bash
# 環境変数ファイルを作成
cp .env.example .env

# DBを起動(バックグラウンドで動き続けます)
docker compose up -d

# backendを起動
cd backend && ./mvnw spring-boot:run
```

backendが起動すると、このターミナルはログ表示で占有されたままになります（`Ctrl+C` で停止するまで）。**新しいターミナルをもう1枚開いて**、frontendを起動します。

🟧 **Ubuntu（ローカル）**

```bash
cd <このリポジトリのフォルダ>/frontend
npm install && npm run dev
```

- アプリ: http://localhost:5173 — タスクの**追加・完了・削除**を操作してみてください
- API仕様（Swagger UI）: http://localhost:8080/api/docs — 画面の操作とAPIの対応が確認できます

## 3. A5:SQL Mk-2 でDockerのDBに接続する

アプリの起動が確認できたら、DBの中身をGUIで見られるようにしておきます。A5:SQL Mk-2（無料のDBクライアント。未インストールなら[公式サイト](https://a5m2.mmatsubara.com/)から）をWindows側にインストールして接続します。

1. DBが起動していることを確認する: `docker compose ps`（STATUSが `healthy` であること）
2. A5:SQL Mk-2 のメニュー「データベース」→「データベースの追加と削除」→「追加」→ 接続タイプで「**PostgreSQL（直接接続）**」を選択
3. 以下を入力し、「テスト接続」で成功を確認して「OK」で登録する

   | 項目 | 値 |
   | --- | --- |
   | サーバー名 | `localhost` |
   | ポート番号 | `5432` |
   | データベース名 | `appdb` |
   | ユーザーID | `app` |
   | パスワード | `change-me-local`（`.env` の `DB_PASSWORD` の値） |

4. `tasks` テーブルを開き、画面に表示されていたタスクのデータが入っていることを確認する

接続できないときの確認点や注意（スキーマ変更はGUIからではなくFlywayで行う等）は、[docker-commands.md](./docker-commands.md) の「GUIツール(A5:SQL Mk-2)でDBに入る」を参照してください。

**完了条件**: アプリをローカルで表示・操作できた / A5:SQL Mk-2 でDBに接続できた

次は [ローカルで環境構築後にすること（本番リリースの準備）](./prod-prepare.md) へ。
