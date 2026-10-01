# リポジトリの取得と起動(setup)

> **初回の環境構築(WSL2 + Ubuntu 〜 VS Code、Git/PATの設定)は、training-docs の [ローカル開発環境セットアップ手順書](https://github.com/BFHcopilot/training-docs/blob/main/生成AI研修_ローカル開発環境セットアップ手順書.md) で行います(そちらが正)。**
> 本書は環境構築が済んだ状態で、このリポジトリを取得して動かす手順です。つまずいたら [troubleshooting.md](./troubleshooting.md) を参照してください。

## 1. リポジトリの取得と起動

1. ブラウザでテンプレートリポジトリを開き、**Use this template → Create a new repository** で自分のリポジトリを作成する(名前は全員共通で **`my-training-task`**)
2. WSLに clone する。**必ず `~/projects` 配下にすること。`/mnt/c` 配下は禁止**(性能とホットリロードが壊れます)

```bash
$ cd ~/projects
$ git clone https://github.com/<自分のアカウント>/my-training-task.git
$ cd my-training-task
```

   初回cloneでは Username にGitHubのユーザー名、Password にセットアップ手順書の3章で発行したPAT(`github_pat_...`)を貼り付けます。**パスワード欄は貼り付けても何も表示されません**が、そのままEnterで認証されます。成功するとPATは自動で保存され、次回からは聞かれません

3. VS Code で開き、推奨拡張を入れる

```bash
$ code .
```

   リポジトリを開くと右下に「推奨拡張機能をインストールしますか?」と表示されるので**すべてインストール**する(Claude Code、Java Extension Pack、ESLint、Prettier等)。その後、Claude Code 拡張を開き、**会社から貸与されたアカウント**でログインする

4. 環境診断を実行し、**全項目 OK** になることを確認する

```bash
$ bash scripts/doctor.sh
```

5. NGがあれば [troubleshooting.md](./troubleshooting.md) を見て解消する
6. アプリを起動する(手順は [local-run.md](./local-run.md))。ブラウザで http://localhost:5173 を開き、初期タスクが3件表示されれば準備完了です

## 2. 動作確認チェックリスト

- [ ] doctor.sh が全項目 OK
- [ ] http://localhost:5173 でタスク一覧が表示される
- [ ] タスクを追加・完了・削除できる
- [ ] http://localhost:8080/api/docs で Swagger UI が開く
- [ ] VSCode の左下に「WSL: Ubuntu-22.04」と表示されている
- [ ] Claude Code にログインできている
