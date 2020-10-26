# ABC分析

ABC分析のインサイトをHTMLで返すAPI

整理していないので、コードはめちゃくちゃ汚い。

grafanaのpluginのコードなどもここに含まれてしまっているので、
あとでcommit logはいじる。重くなってしまうので。

## build

```bash
docker build --no-cache -t abc_api .
```

## run locally

```bash
docker run -d --rm --name abc_api -p 5001:5001 \
-e DB_HOST=<auroraのエンドポイント> \
-e DB_USER=<auroraのユーザー名> \
-e DB_PASS=<auroraのパスワード> \
-e DB_NAME=<DB名> \
abc_api
```

## run for development(set environment variables)

```bash
export DB_HOST=<auroraのエンドポイント>
export DB_USER=<auroraのユーザー名>
export DB_PASS=<auroraのパスワード>
export DB_NAME=<DB名>
```

## run on k8s

```bash

```

## リクエスト例

dockerで動かした場合のリクエスト例。

まず、あらかじめエンドポイントを設定しておく。

```bash
ENDPOINT=<<エンドポイントのIPなど。ローカルならば127.0.0.1>>
```

### `ping`

```bash
http://${ENDPOINT}:5001/ping
```

`pong`と返す。アプリがそもそも生きているかを確認するAPI。他のAPIは応答までに時間がかかるのでこれを作っておいた。

### `abc`

```bash
http://${ENDPOINT}:5001/abc?cat=商品大分類&price=税抜売上額&threshold=0.9
```

ABC分析のインサイトをHTMLを返す。ブラウザからみる。

リクエストが返るまで恐ろしく時間がかかるので注意。最低30秒はかかる。

クエリパラメータで使えるのは以下:

|パラメータ|説明|使える値|
|-|-|-|
|`cat`|商品の分類|`商品大分類`, `商品中分類`, `商品小分類`|
|`price`|売上額の分類|`税抜売上額`, `税抜売上額`|
|`threshold`|(オプション)クラスCの中の注意すべきリピート率の閾値|0から1の間の数値(デフォルト: `0.9`)|

### grafana plugins memo

```bash
# https://grafana.com/grafana/plugins/mxswat-separator-panel/installation
grafana-cli plugins install mxswat-separator-panel
# https://grafana.com/grafana/plugins/gretamosa-topology-panel/installation
grafana-cli plugins install gretamosa-topology-panel
# https://grafana.com/grafana/plugins/innius-video-panel/installation
grafana-cli plugins install innius-video-panel
# https://grafana.com/grafana/plugins/isaozler-paretochart-panel/installation
grafana-cli plugins install isaozler-paretochart-panel
# https://grafana.com/grafana/plugins/ryantxu-annolist-panel/installation
grafana-cli plugins install ryantxu-annolist-panel
# https://grafana.com/grafana/plugins/digrich-bubblechart-panel
grafana-cli plugins install digrich-bubblechart-panel
# https://grafana.com/grafana/plugins/speakyourcode-button-panel
grafana-cli plugins install speakyourcode-button-panel
# https://grafana.com/grafana/plugins/cloudspout-button-panel
grafana-cli plugins install cloudspout-button-panel
# https://grafana.com/grafana/plugins/briangann-datatable-panel
grafana-cli plugins install briangann-datatable-panel
# https://grafana.com/grafana/plugins/natel-discrete-panel
grafana-cli plugins install natel-discrete-panel
# https://grafana.com/grafana/plugins/dalvany-image-panel
grafana-cli plugins install marcusolsson-dynamictext-panel
# https://grafana.com/grafana/plugins/agenty-flowcharting-panel
grafana-cli plugins install agenty-flowcharting-panel
# https://grafana.com/grafana/plugins/aidanmountford-html-panel
grafana-cli plugins install aidanmountford-html-panel
# https://grafana.com/grafana/plugins/simpod-json-datasource
grafana-cli plugins install simpod-json-datasource
# https://grafana.com/grafana/plugins/marcusolsson-json-datasource
grafana-cli plugins install marcusolsson-json-datasource
# https://grafana.com/grafana/plugins/michaeldmoore-multistat-panel
grafana-cli plugins install michaeldmoore-multistat-panel
```

## plugins 所感

- Datatable Panelはページネーションできて良い感じ
- Pareto Chart はそのまま出してくれる
- newsはアナウンスにちょうど良いかも
- 

(使えない、あるいは使い方ようわからん)

- https://github.com/marcusolsson/grafana-jsonapi-datasource?utm_source=grafana_add_ds　はproduction-readyではない
