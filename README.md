# Augmented Analytics for Retail TestBed

小売分析のテスト環境

## 動かし方

以下の作業をターミナルから実施

- このレポジトリをgitコマンドでダウンロードします。

```bash
git clone https://github.com/k-kondo-s/retail.git
```

- ダウンロードしたディレクトリの中に入ります。

```bash
cd pj_retail_analytics_testbed
```

- `docker-compose`で、コンテナを立ち上げます。

```bash
docker-compose up -d
```

- ブラウザから、以下のURLにアクセスすると、Grafanaの画面が見えます。

```bash
http://127.0.0.1:3000

user: admin
password: password
```

## アップデートの仕方

以下の作業はターミナル上で行う。

新しい変更を反映するときは、まずrepositoryから最新の状態をダウンロードします。`git pull`コマンドを実行します。

- ローカルにダウンロードしているディレクトリの中に入ります。

```bash
cd pj_retail_analytics_testbed
```

- `git pull`で最新の状態にします。

```bash
git pull origin master
```

- 反映には、コンテナを全て再起動する必要があります。

コンテナが今現在動いているならば、以下のコマンドで再起動します。

```bash
docker-compose down && docker-compose up -d
```

コンテナが停止した状態ならば、立ち上げます。

```bash
docker-compose up -d
```
