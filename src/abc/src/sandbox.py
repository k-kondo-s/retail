import pandas as pd
from flask import jsonify
import pathlib
import os

# df = pd.read_csv(f'{os.path.dirname(os.path.abspath(__file__))}/data/total_sales_per_large_cat.csv', names=['商品大分類', '税抜売上額'])

# for i in zip(list(df['商品大分類']), list(df['税抜売上額'])):
#     print(list(i))

df = pd.read_csv(
    f'{os.path.dirname(os.path.abspath(__file__))}/data/focused_items.csv')
# print(df)

for i in df.iterrows():
    print(list(i[1]))
    break