from flask import Flask, request, render_template, jsonify
from flask.helpers import send_file
import pandas as pd
import os

from settings import get_dao
from processor import Processor

# global settings
app = Flask(__name__)
dao = get_dao()

# global variables
search = 'search'
query = 'query'
annotation = 'annotation'

# all: 税抜売上額の商品大分類でsumしたもののAPI
TOTAL_SALES_PER_LARGE_CATEGORY = 'total-sales-per-large-category'


@app.route(f'/{TOTAL_SALES_PER_LARGE_CATEGORY}/')
def get_total_sales_per_large_category():
    return 'ok'


@app.route(f'/{TOTAL_SALES_PER_LARGE_CATEGORY}/{search}', methods=['POST'])
def get_total_sales_per_large_category_search():
    return jsonify(['a'])


@app.route(f'/{TOTAL_SALES_PER_LARGE_CATEGORY}/{query}', methods=['POST'])
def get_total_sales_per_large_category_query():
    df = pd.read_csv(
        f'{os.path.dirname(os.path.abspath(__file__))}/data/total_sales_per_large_cat.csv',
        names=[
            '商品大分類',
            '税抜売上額'])
    result = [{
        "columns": [
            {"text": "商品大分類", "type": "string"},
            {"text": "税抜売上額", "type": "number"}
        ],
        "rows": [],
        "type":"table"
    }]
    for i in zip(list(df['商品大分類']), list(df['税抜売上額'])):
        result[0]['rows'].append(list(i))
    print(result)
    return jsonify(result)


# ABC分析
ABC_FOCUSED = 'abc-focused'


@app.route(f'/{ABC_FOCUSED}/')
def get_abc():
    return 'ok'


@app.route(f'/{ABC_FOCUSED}/{search}', methods=['POST'])
def get_abc_search():
    return jsonify(['a'])


@app.route(f'/{ABC_FOCUSED}/{query}', methods=['POST'])
def get_abc_query():
    df = pd.read_csv(
        f'{os.path.dirname(os.path.abspath(__file__))}/data/focused_items.csv')
    result = [{
        "columns": [
            {"text": "商品名", "type": "string"},
            {"text": "税抜売上額", "type": "number"},
            {"text": "累積税抜売上額", "type": "number"},
            {"text": "売上構成比", "type": "number"},
            {"text": "累積売上構成比", "type": "number"},
            {"text": "クラス", "type": "string"},
            {"text": "総買上数", "type": "number"},
            {"text": "UU数", "type": "number"},
            {"text": "顧客カード番号リスト", "type": "string"},
            {"text": "リピート率", "type": "number"},
            {"text": "購入ユーザー買上額", "type": "number"},
            {"text": "ロイヤルカスタマー買上数", "type": "number"},
            {"text": "ロイヤルカスタマー複数買上数", "type": "number"}
        ],
        "rows": [],
        "type": "table"
    }]
    for i in df.iterrows():
        result[0]['rows'].append(list(i[1]))
    return jsonify(result)


# LDAの画像
@app.route('/lda.png')
def get_lda_png():
    return send_file('templates/2020_lifestream_name_A.png')

# 棒グラフ


@app.route('/histgram.png')
def get_histgram_png():
    return send_file('templates/herbal_topics_dist.png')

# map


@app.route('/map.html')
def get_map():
    return render_template('customer_geolocs.html')


# test


@ app.route('/search', methods=['POST'])
def a():
    return jsonify(
        ["upper_25", "upper_50", "upper_75", "upper_90", "upper_95", 'a'])


@ app.route('/annotation', methods=['POST'])
def annotation():
    return jsonify([
        {
            # The original annotation sent from Grafana.
            'annotation': 'annotation',
            # Time since UNIX Epoch in milliseconds. (required)
            'time': 'time',
            # The title for the annotation tooltip. (required)
            'title': 'title',
            'tags': 'tags',  # Tags for the annotation. (optional)
            'text': 'text'  # Text for the annotation. (optional)
        }
    ])


@ app.route('/query', methods=['POST'])
def get_query():
    # return jsonify([
    #     {
    #         "target": "upper_75",  # The field being queried for
    #         "datapoints": [
    #             # Metric value as a float, unixtimestamp in milliseconds
    #             [622, 1450754160000],
    #             [365, 1450754220000]
    #         ]
    #     },
    #     {
    #         "target": "upper_90",
    #         "datapoints": [
    #             [861, 1450754160000],
    #             [767, 1450754220000]
    #         ]
    #     }
    # ])

    # return jsonify([
    #     {
    #         "columns": [
    #             {"text": "Time", "type": "time"},
    #             {"text": "Country", "type": "string"},
    #             {"text": "Number", "type": "number"}
    #         ],
    #         "rows": [
    #             [1234567, "SE", 123],
    #             [1234567, "DE", 231],
    #             [1234567, "US", 321]
    #         ],
    #         "type":"table"
    #     }
    # ])

    return jsonify([
        {
            "target": "upper_75",  # The field being queried for
            "datapoints": [
                # Metric value as a float, unixtimestamp in milliseconds
                {
                    "columns": [
                        {"text": "Time", "type": "time"},
                        {"text": "Country", "type": "string"},
                        {"text": "Number", "type": "number"}
                    ],
                    "rows": [
                            [1234567, "SE", 123],
                            [1234567, "DE", 231],
                            [1234567, "US", 321]
                    ],
                    "type":"table"
                }
            ]
        }
    ])


@ app.route('/')
@ app.route('/ping', methods=['GET'])
def ping():
    """アプリが生きているかを確認するもの

    他のやつはレスポンスまで時間がかかるので、アプリが生きているか心配になる。
    その時はこれをリクエストするといい。pongが返ってきたら生きてる。
    """
    return 'pong'


@ app.route('/abc', methods=['GET'])
def fetch_abc_insight():
    """ABC分析のインサイトを取得

    Returns:
        Response: ABC分析の結果をナラティブに表現したHTML
    """

    # クエリパラメータを取得
    product_category = request.args.get('cat', '')
    price_kind = request.args.get('price', '')
    repeat_ratio_threshold = float(request.args.get('threshold', 0.9))

    # ABC分析を実行
    processor = Processor(dao, repeat_ratio_threshold)
    results = processor.do(
        product_category,
        price_kind,
    )

    # 実行結果の小数のやつを、見やすいように丸めて％表記にする
    for r in results[0]:
        r['ratio_sales'] = round(r['ratio_sales'], 4) * 100
        r['cumulative_ratio_sales'] = round(
            r['cumulative_ratio_sales'], 4) * 100
        r['repeat_ratio'] = round(r['repeat_ratio'], 2) * 100

    # HTMLに埋め込んで返す
    return render_template(
        'abc.html',
        product_category=product_category,
        price_kind=price_kind,
        result_list=results[0],
        processing_time=results[-1],
    )


if __name__ == '__main__':
    app.run()
