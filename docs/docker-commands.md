# Docker コマンド集

この研修で使うDocker操作のまとめです。**このリポジトリの構成(開発=DBのみコンテナ / 本番=全コンテナ)に即した実用版**です。
コマンドは基本的にリポジトリのルートディレクトリで実行します。

---

## 1. 開発時の日常操作(docker-compose.yml = DBのみ)

```bash
docker compose up -d        # DBをバックグラウンドで起動
docker compose ps           # 状態確認(STATUSがhealthyであること)
docker compose logs -f db   # DBのログを追う(Ctrl+Cで抜ける)
docker compose stop         # 停止(データは残る)
docker compose start        # 再開
docker compose down         # コンテナを削除(データは残る)
docker compose down -v      # データごと削除 = DBの完全初期化
```

### DBを初期状態に戻したいとき(頻出)

「テーブルを壊した」「マイグレーションをやり直したい」ときの定番です。

```bash
docker compose down -v && docker compose up -d
# この後 backend を起動すれば Flyway が V1 から順に適用し直す
```

### DBの中身を直接見る

```bash
docker compose exec db psql -U app appdb     # psqlに入る
```

psql内でよく使うもの:

```
\dt              -- テーブル一覧
\d tasks         -- tasksテーブルの定義
SELECT * FROM tasks;
SELECT * FROM flyway_schema_history;   -- マイグレーションの適用履歴
\q               -- 終了
```

### GUIツール(A5:SQL Mk-2)でDBに入る

DBコンテナはポート5432を公開しており(docker-compose.yml の `ports: "5432:5432"`)、WSL2のlocalhost転送によってWindows側からも `localhost:5432` で届きます。そのため、Windowsにインストールした A5:SQL Mk-2 からそのまま接続できます。

1. DBが起動していることを確認する: `docker compose ps`(STATUSが `healthy` であること)
2. A5:SQL Mk-2 のメニュー「データベース」→「データベースの追加と削除」→「追加」をクリック
3. 接続タイプで「**PostgreSQL(直接接続)**」を選択
4. 以下を入力する(パスワードは `.env` の値。初期値のままなら下記のとおり)

   | 項目 | 値 |
   | --- | --- |
   | サーバー名 | `localhost` |
   | ポート番号 | `5432` |
   | データベース名 | `appdb` |
   | ユーザーID | `app` |
   | パスワード | `change-me-local`(`.env` の `DB_PASSWORD`) |

5. 「テスト接続」で成功を確認して「OK」で登録する

接続できないときは次を確認してください。

- DBが起動していない → `docker compose up -d`
- `.env` でパスワードを初期値から変えている → `.env` の `DB_PASSWORD` の値を入力する
- Windows側で別のPostgreSQLが5432を使っている → ポート競合。`bash scripts/doctor.sh` で検出できるので、該当サービスを停止する

> ※ 接続先はあくまで**開発用DB**です。テーブルの中身の確認やSQLの試行に使い、スキーマ変更は必ずFlywayマイグレーション(`db/migration/` のVファイル)で行ってください(GUIからのALTER/CREATEは禁止)。

## 2. 本番構成の操作(docker-compose.prod.yml)

開発用と同じコマンドに `-f docker-compose.prod.yml` を付けるだけです。

```bash
docker compose -f docker-compose.prod.yml build           # 本番イメージをビルド(ローカルで実行)
docker save <イメージ名...> | gzip > app-images.tar.gz     # イメージをファイル化(ローカル)→ scpで転送
docker load -i app-images.tar.gz                          # イメージを取り込み(サーバーで実行)
docker compose -f docker-compose.prod.yml up -d           # 取り込んだイメージで起動(デプロイ)
docker compose -f docker-compose.prod.yml ps              # 状態確認
docker compose -f docker-compose.prod.yml logs -f         # 全コンテナのログ
docker compose -f docker-compose.prod.yml logs -f backend # backendだけ
docker compose -f docker-compose.prod.yml restart web     # nginxだけ再起動
docker compose -f docker-compose.prod.yml down            # 停止・削除(DBデータは残る)
```

> 新しいイメージを転送し忘れて `up -d` しても**古いイメージのまま起動**します。コード変更を反映するデプロイでは、ローカルでビルドし直したイメージを転送(save → scp → load)してから `up -d` を実行してください。

## 3. 状態確認・調査系

| コマンド | 用途 |
|---|---|
| `docker ps` | 起動中コンテナの一覧 |
| `docker ps -a` | 停止中も含む一覧(起動失敗の調査に) |
| `docker logs コンテナ名` | 単体コンテナのログ(`docker logs training-db` 等) |
| `docker compose exec backend sh` | コンテナの中にシェルで入る(本番構成時) |
| `docker inspect コンテナ名` | 詳細情報(IP・マウント・環境変数) |
| `docker network ls` | ネットワーク一覧 |
| `docker network inspect ネットワーク名` | コンテナ間の名前解決・IPの確認 |
| `docker stats` | CPU・メモリ使用量のリアルタイム表示 |
| `docker system df` | Dockerのディスク使用量 |

## 4. 掃除系(ディスクが足りないとき)

ビルドを繰り返すと古いイメージが溜まります。Lightsailの小容量SSDを圧迫するので定期的に掃除します。

```bash
docker image prune -f       # 使われていない中間イメージの削除(まずこれ)
docker system prune -f      # 停止コンテナ・未使用ネットワーク等もまとめて削除
docker system prune -af     # 未使用イメージを全削除(次回ビルドが遅くなる。最終手段)
docker builder prune -f     # ビルドキャッシュの削除
```

> `-v` 付きの prune(`docker system prune --volumes`)は**DBのデータも消えます**。本番では使わないこと。

---

## 5. 困ったときの逆引き

### 「permission denied while trying to connect to the Docker daemon」

ユーザーがdockerグループに入っていません。

```bash
sudo usermod -aG docker $USER
# PowerShellで wsl --shutdown → 開き直して反映
```

### 「Cannot connect to the Docker daemon」

デーモンが起動していません。

```bash
sudo systemctl start docker      # 起動
sudo systemctl enable docker     # 自動起動を有効化
```

### 「port is already allocated / ポートが使えない」

そのポートを他のプロセスが使っています。

```bash
ss -ltnp | grep 5432      # 使っているプロセスを特定
docker ps                 # 別の自分のコンテナが掴んでいないか確認
```

Windows側のPostgreSQLやSkype等が5432/8080を掴んでいるケースもあります(Windows側のサービスを停止)。

### 「コンテナが Restarting を繰り返す / すぐ落ちる」

```bash
docker logs --tail 50 コンテナ名    # 直近ログに原因が出ている(環境変数不足・設定ミス等が典型)
```

### 「.env を変えたのに反映されない」

環境変数は**コンテナ作成時**に読み込まれます。restart では反映されません。

```bash
docker compose up -d      # 再作成(downは不要。差分だけ作り直される)
```

### 「イメージを作り直したのに動きが変わらない」

キャッシュを疑います。

```bash
docker compose -f docker-compose.prod.yml build --no-cache backend
docker compose -f docker-compose.prod.yml up -d
```

### 「本番でビルドが途中で止まる・killedと出る」

メモリ不足です。スワップが有効か確認します(prod-prepare.md 手順3-1)。

```bash
free -h     # Swap が 2.0Gi あるか
```

### 「DBのデータを消したくないままコンテナだけ作り直したい」

```bash
docker compose down       # -v を付けなければボリューム(データ)は残る
docker compose up -d
```

---

## 6. 概念の整理(詰まったとき用)

| 用語 | 意味 |
|---|---|
| イメージ | アプリの設計図(ビルドで作る)。`docker images` で一覧 |
| コンテナ | イメージから起動した実体。`docker ps` で一覧 |
| ボリューム | データの永続化領域。コンテナを消してもデータが残る仕組み(`db-data` がDBの実データ) |
| サービス名 | compose内の名前(`db` 等)。**コンテナ間の通信はこの名前で名前解決される** |
| ポート公開 | `5432:5432` の記述。ホスト(WSL)側からコンテナへ届く入口 |

- 開発時: backend(WSL上)→ `localhost:5432` → **ポート公開**経由でdbコンテナへ
- 本番時: backend(コンテナ)→ `db:5432` → **Dockerネットワークの名前解決**でdbコンテナへ
- この違いを吸収しているのが環境変数 `DB_HOST`(application.yml 参照)
