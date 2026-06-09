#!/usr/bin/env python3
"""生成翻譯落地頁靜態 HTML"""

import os

PAIRS = [
    ("vi-to-zh-tw",  "Vietnamese",             "Chinese (Traditional)", "越南文翻繁體中文"),
    ("zh-tw-to-vi",  "Chinese (Traditional)",  "Vietnamese",            "繁體中文翻越南文"),
    ("ja-to-zh-tw",  "Japanese",               "Chinese (Traditional)", "日文翻繁體中文"),
    ("zh-tw-to-ja",  "Chinese (Traditional)",  "Japanese",              "繁體中文翻日文"),
    ("en-to-zh-tw",  "English",                "Chinese (Traditional)", "英文翻繁體中文"),
    ("zh-tw-to-en",  "Chinese (Traditional)",  "English",               "繁體中文翻英文"),
    ("ko-to-zh-tw",  "Korean",                 "Chinese (Traditional)", "韓文翻繁體中文"),
    ("zh-tw-to-ko",  "Chinese (Traditional)",  "Korean",                "繁體中文翻韓文"),
    ("ja-to-en",     "Japanese",               "English",               "日文翻英文"),
    ("en-to-ja",     "English",                "Japanese",              "英文翻日文"),
    ("vi-to-en",     "Vietnamese",             "English",               "越南文翻英文"),
    ("en-to-vi",     "English",                "Vietnamese",            "英文翻越南文"),
    ("zh-tw-to-th",  "Chinese (Traditional)",  "Thai",                  "繁體中文翻泰文"),
    ("th-to-zh-tw",  "Thai",                   "Chinese (Traditional)", "泰文翻繁體中文"),
    ("zh-tw-to-id",  "Chinese (Traditional)",  "Indonesian",            "繁體中文翻印尼文"),
    ("id-to-zh-tw",  "Indonesian",             "Chinese (Traditional)", "印尼文翻繁體中文"),
    ("zh-tw-to-ko",  "Chinese (Traditional)",  "Korean",                "繁體中文翻韓文"),
    ("en-to-vi",     "English",                "Vietnamese",            "英文翻越南文"),
]

# 去重（slug 唯一）
seen = set()
PAIRS = [p for p in PAIRS if p[0] not in seen and not seen.add(p[0])]

ALL_PAIR_LINKS = "".join(
    f'<a href="/translation/{slug}/" '
    f'class="text-sm text-blue-600 hover:underline bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm hover:shadow transition">'
    f'{title}</a>\n      '
    for slug, _, _, title in PAIRS
)

TEMPLATE = """\
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title} | 免費線上翻譯</title>
  <meta name="description" content="免費{title}工具，即時翻譯，支援語音輸入與朗讀。" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-gradient-to-br from-blue-50 to-white">
  <div class="max-w-4xl mx-auto px-4 py-10">
    <a href="/translation/" class="text-sm text-blue-500 hover:underline mb-6 inline-block">← 所有語言</a>
    <h1 class="text-3xl font-bold text-center text-gray-800 mb-2">{title}</h1>
    <p class="text-center text-gray-500 text-sm mb-8">免費線上{title}工具 · 即時翻譯 · 語音輸入 · 語音朗讀</p>

    <div id="translator" data-from="{from_code}" data-to="{to_code}"></div>

    <section class="mt-16">
      <h2 class="text-lg font-semibold text-gray-700 mb-4">其他熱門翻譯</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {pair_links}
      </div>
    </section>
  </div>

  <script src="/translation/translator.js"></script>
</body>
</html>
"""

base = os.path.join(os.path.dirname(__file__), "translation")

for slug, from_code, to_code, title in PAIRS:
    folder = os.path.join(base, slug)
    os.makedirs(folder, exist_ok=True)
    html = TEMPLATE.format(
        title=title,
        from_code=from_code,
        to_code=to_code,
        pair_links=ALL_PAIR_LINKS,
        slug=slug,
    )
    with open(os.path.join(folder, "index.html"), "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  ✓ {slug}/index.html")

print(f"\n完成！共生成 {len(PAIRS)} 個頁面。")
