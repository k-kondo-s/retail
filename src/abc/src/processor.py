import time


class Processor():

    def __init__(self, dao, repeat_ratio=0.9) -> None:
        self.dao = dao
        self.threshold_repeat_ratio = repeat_ratio

    def do(self, product_category, price_kind):
        """ABC分析を行う

        ABC分析を行って、その結果を全部返す。Viewはここでは考慮しない
        """
        # (debug) 処理時間を計算するために、スタート時間を取得しておく
        _start_time = time.time()

        # 分析に必要なデータを持ってくる
        # ここにめちゃくちゃ時間がかかる。最低30秒。見直し必須。
        raw_data = self.dao.get_for_abc(product_category, price_kind)

        # とってきたデータフォーマットがそのままでは扱いにくいので、List[dict]に変換しておく
        list_data = []
        for d in raw_data:
            r = d.items()
            list_data.append({'category': r[0][1],
                              'total_sales': r[1][1],
                              'people_num': r[2][1],
                              'unique_people_num': r[3][1]})
        # 売り上げ順にソートしておく（降順）
        list_data = sorted(
            list_data,
            key=lambda x: x['total_sales'],
            reverse=True)

        # 売り上げの合計を計算する。あとで売り上げ構成比を計算するのに使う。
        total_sales = sum([i['total_sales'] for i in list_data])

        # いよいよABC分析を行う。
        _results = []
        for i in range(len(list_data)):

            # まずresultsのフォーマットを以下のように定義する。
            _r = {
                'category': '',  # 商品の分類名
                'total_sales': 0,  # 分類の中の総売り上げ（円）
                'ratio_sales': 0,  # 売り上げ構成比
                'cumulative_ratio_sales': 0,  # 累積売り上げ構成比
                'people_num': 0,  # その分類を買った総合の人数
                'unique_people_num': 0,  # その分類を買ったユニーク数
                'repeat_ratio': 0,  # リピート率。
                'class': '',  # A, B, Cのいずれのクラスであるか
                'danger': False,  # Cクラスでかつリピート率が高かったら、Trueになる
            }

            # DBからとってきたデータからそれぞれを計算する
            _r['category'] = list_data[i]['category']
            _r['total_sales'] = list_data[i]['total_sales']
            _r['ratio_sales'] = list_data[i]['total_sales'] / total_sales
            # 累積売り上げ構成比は、以前に計算した結果に足し算して計算する
            if i != 0:
                _r['cumulative_ratio_sales'] = _results[i - \
                    1]['cumulative_ratio_sales'] + _r['ratio_sales']
            else:
                _r['cumulative_ratio_sales'] = _r['ratio_sales']
            _r['people_num'] = list_data[i]['people_num']
            _r['unique_people_num'] = list_data[i]['unique_people_num']
            # リピート率は、(総買上人数 - ユニーク数)/総買上人数 で計算する
            _r['repeat_ratio'] = (list_data[i]['people_num'] - list_data[i]['unique_people_num']) / \
                list_data[i]['people_num'] if list_data[i]['people_num'] != 0 else 0
            # クラスの分類は、A < 0.70 <= B < 0.95 <= C とした
            if _r['cumulative_ratio_sales'] >= 0.95:
                _r['class'] = 'C'
            elif _r['cumulative_ratio_sales'] < 0.70:
                _r['class'] = 'A'
            else:
                _r['class'] = 'B'
            # 注目すべき分類の判定は、クラスCであり、かつリピート率がthreshold_repeat_ratio以上のものとした
            if _r['class'] == 'C' and _r['repeat_ratio'] >= self.threshold_repeat_ratio:
                _r['danger'] = True

            # resultsに追加
            _results.append(_r)

        # (debug) 処理時間を計算する
        _end_time = time.time()
        _processing_time = round(_end_time - _start_time)
        results = [_results, _processing_time]

        return results
