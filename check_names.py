#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""核对 App 名在两处是否一致：index.html 的 NAMES ↔ view.html 的 APP 表。

⚠️ 为什么需要这个：改 App 名有两个地方要动——
   index.html 的 NAMES 管卡片与看板文案，view.html 的 APP 表管套壳顶栏。
   2026-08-10 就栽过：象义随身/六壬神课/命理精讲三次改名都只改了 index.html，
   结果「卡片叫新名、点进去顶栏还是旧名」，用户直接看出来了。

用法：python3 check_names.py      （不一致则非零退出）
"""
import io
import os
import re
import sys

os.chdir(os.path.dirname(os.path.abspath(__file__)))

v = io.open('view.html', encoding='utf-8').read()
i = io.open('index.html', encoding='utf-8').read()
va = dict(re.findall(r"(\w+):\s*\{u:'[^']*',\s*n:'([^']*)'", v))
m = re.search(r'var NAMES=\{([^}]*)\}', i)
ia = dict(re.findall(r"(\w+):'([^']*)'", m.group(1)))
keys = sorted(set(list(va) + list(ia)))
bad = [k for k in keys if va.get(k) != ia.get(k)]
print('\n两处映射核对（view.html 的 APP 表 vs index.html 的 NAMES）：')
for k in keys:
    print(f"  {'✓' if va.get(k)==ia.get(k) else '✗'} {k:<10} view={va.get(k)}  index={ia.get(k)}")
print('\n' + (f'❌ {len(bad)} 处不一致：' + '、'.join(bad) if bad else '✅ 完全一致'))
sys.exit(1 if bad else 0)
