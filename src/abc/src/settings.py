from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
import os
from dao import Dao

# 外部から挿入するアプリの環境設定
_settings = {
    'mysql': {
        'host': '127.0.0.1',
        'port': 3306,
        'user': 'root',
        'password': 'root',
        'db': 'testdb'}}
# 'mysql': {
#     'host': '127.0.0.1',
#     'port': 3306,
#     'user': 'root',
#     'password': 'root',
#     'db': 'testdb'}}


def get_settings():
    """アプリの設定を返す
    """
    return _settings


def get_dao():
    """DAOを返す

    Returns:
        Dao: mysqlの設定が施されたDaoインスタンス
    """
    settings = get_settings()['mysql']
    user = settings['user']
    password = settings['password']
    host = settings['host']
    port = settings['port']
    db_name = settings['db']
    db = f'mysql://{user}:{password}@{host}:{port}/{db_name}?charset=utf8'
    engine = create_engine(
        db,
        encoding="utf-8",
        echo=True  # Trueだと実行のたびにSQLが出力される
    )
    session = scoped_session(
        sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=engine
        )
    )

    return Dao(engine)
