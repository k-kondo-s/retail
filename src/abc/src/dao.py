from sqlalchemy.sql import text


class Dao():
    def __init__(self, session) -> None:
        self.sqlclient = session

    def get_for_abc(self, product_category, price_kind):
        """ABC分析に必要なデータをDBから持ってくる
        """

        # sqlを引数を使って構成する
        # sqlalchemyのプレイスホルダーの機能を使うと、カラム名にシングルクオートがついてしまうので
        # 以下のように文字列のフォーマットの機能を使っている。
        # これはSQLインジェクションできる。本番では使うべきではない。
        # そもそもRDBを使うかも検討の段階なので、今はいったんこれで対応する。
        sql = text(f'''
        SELECT {product_category},
        SUM({price_kind}) AS total,
        COUNT(顧客カード番号) AS count_num,
        COUNT(DISTINCT 顧客カード番号) AS unique_num
        FROM sales_modified
        GROUP BY {product_category}
        ''')

        # DBからデータをとってくる
        results = self.sqlclient.execute(sql)

        return results
