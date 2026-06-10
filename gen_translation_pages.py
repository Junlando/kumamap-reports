#!/usr/bin/env python3
"""生成翻譯落地頁靜態 HTML（SEO 優化版）"""

import os

# slug, from_code, to_code, h1, title_tag, meta_description, html_lang
PAIRS = [
    (
        "vi-to-zh-tw",
        "Vietnamese", "Chinese (Traditional)",
        "越南語翻譯中文",
        "越南語翻譯中文 | 越南文翻中文免費工具",
        "越南語翻譯成中文，越南文翻中文即時翻譯，語音輸入支援。免費越南語翻譯工具，比 Google 翻譯更自然。",
        "zh-Hant",
    ),
    (
        "zh-tw-to-vi",
        "Chinese (Traditional)", "Vietnamese",
        "越南文翻譯・中文翻越南語",
        "越南文翻譯 | 免費中文翻越南語工具",
        "免費中文翻越南文翻譯，支援越南語即時翻譯、語音朗讀。翻譯越南語比 Google 更準確，越南語言翻譯首選。",
        "zh-Hant",
    ),
    (
        "ja-to-zh-tw",
        "Japanese", "Chinese (Traditional)",
        "日文翻中文",
        "日文翻中文 | 免費日語翻譯工具",
        "免費日文翻中文翻譯工具，即時翻譯、語音輸入。日語翻譯成繁體中文，快速準確。",
        "zh-Hant",
    ),
    (
        "zh-tw-to-ja",
        "Chinese (Traditional)", "Japanese",
        "中文翻日文",
        "中文翻日文 | 免費線上日語翻譯",
        "免費中文翻日文翻譯工具，繁體中文翻譯成日語，支援語音輸入與朗讀。",
        "zh-Hant",
    ),
    (
        "en-to-zh-tw",
        "English", "Chinese (Traditional)",
        "英文翻中文",
        "英文翻中文 | 免費英語翻譯工具",
        "免費英文翻中文翻譯，即時將英語翻譯成繁體中文，支援語音輸入。",
        "zh-Hant",
    ),
    (
        "zh-tw-to-en",
        "Chinese (Traditional)", "English",
        "中文翻英文",
        "中文翻英文 | 免費線上中英翻譯",
        "免費中文翻英文翻譯工具，繁體中文翻譯成英語，即時翻譯、語音朗讀。",
        "zh-Hant",
    ),
    (
        "ko-to-zh-tw",
        "Korean", "Chinese (Traditional)",
        "韓文翻中文",
        "韓文翻中文 | 免費韓語翻譯工具",
        "免費韓文翻中文翻譯，韓語翻譯成繁體中文，即時翻譯、語音輸入。",
        "zh-Hant",
    ),
    (
        "zh-tw-to-ko",
        "Chinese (Traditional)", "Korean",
        "中文翻韓文",
        "中文翻韓文 | 免費韓語翻譯工具",
        "免費中文翻韓文翻譯，繁體中文翻譯成韓語，支援語音輸入與朗讀。",
        "zh-Hant",
    ),
    (
        "ja-to-en",
        "Japanese", "English",
        "日文翻英文",
        "日文翻英文 | 免費日語英語翻譯",
        "免費日文翻英文翻譯工具，即時將日語翻譯成英語，支援語音輸入。",
        "zh-Hant",
    ),
    (
        "en-to-ja",
        "English", "Japanese",
        "英文翻日文",
        "英文翻日文 | 免費英語日語翻譯",
        "免費英文翻日文翻譯工具，即時將英語翻譯成日語，支援語音輸入與朗讀。",
        "zh-Hant",
    ),
    (
        "vi-to-en",
        "Vietnamese", "English",
        "越南文翻英文",
        "越南文翻英文 | 免費越南語英語翻譯",
        "免費越南文翻英文翻譯工具，即時翻譯、語音輸入。",
        "zh-Hant",
    ),
    (
        "en-to-vi",
        "English", "Vietnamese",
        "英文翻越南文",
        "英文翻越南文 | 免費英語越南語翻譯",
        "免費英文翻越南文翻譯工具，即時將英語翻譯成越南語，支援語音輸入。",
        "zh-Hant",
    ),
    (
        "zh-tw-to-th",
        "Chinese (Traditional)", "Thai",
        "中文翻泰文",
        "中文翻泰文 | 免費泰語翻譯工具",
        "免費中文翻泰文翻譯，繁體中文翻譯成泰語，即時翻譯、語音朗讀。",
        "zh-Hant",
    ),
    (
        "th-to-zh-tw",
        "Thai", "Chinese (Traditional)",
        "泰文翻中文",
        "泰文翻中文 | 免費泰語翻譯工具",
        "免費泰文翻中文翻譯工具，泰語翻譯成繁體中文，即時翻譯、語音輸入。",
        "zh-Hant",
    ),
    (
        "zh-tw-to-id",
        "Chinese (Traditional)", "Indonesian",
        "中文翻印尼文",
        "中文翻印尼文 | 免費印尼語翻譯工具",
        "免費中文翻印尼文翻譯，繁體中文翻譯成印尼語，即時翻譯。",
        "zh-Hant",
    ),
    (
        "id-to-zh-tw",
        "Indonesian", "Chinese (Traditional)",
        "印尼文翻中文",
        "印尼文翻中文 | 免費印尼語翻譯工具",
        "免費印尼文翻中文翻譯工具，印尼語翻譯成繁體中文，即時翻譯。",
        "zh-Hant",
    ),
    # 日本市場：ハングル翻訳・韓国語日本語翻訳
    (
        "ko-to-ja",
        "Korean", "Japanese",
        "ハングル翻訳・韓国語日本語翻訳",
        "ハングル翻訳・韓国語日本語翻訳 | 無料オンライン翻訳",
        "ハングル翻訳ツール。韓国語→日本語・日本語→韓国語の両方向に対応。日本語から韓国語に翻訳、韓国語から日本語翻訳を無料・即時に。音声入力対応。",
        "ja",
    ),
    (
        "ja-to-ko",
        "Japanese", "Korean",
        "히라가나·한자 번역기・일본어 한국어 번역",
        "히라가나·한자 번역기 | 일본어 한국어 번역 무료",
        "히라가나·가타카나·한자를 한국어로 무료 번역. 일본어 한국어 번역, 한국어 일본어 번역 양방향 지원. AI 번역기로 빠르고 정확하게.",
        "ko",
    ),
    # 韓國市場：韓越翻譯
    (
        "ko-to-vi",
        "Korean", "Vietnamese",
        "베트남어 번역기・한국어 베트남어 번역",
        "베트남어 번역기 | 한국어 베트남어 무료 번역",
        "베트남어 번역기로 한국어↔베트남어 양방향 무료 번역. 베트남어 번역, 한국어 번역 즉시 지원. 음성 입력 가능.",
        "ko",
    ),
    # 日本市場：越南語日本語翻訳
    (
        "ja-to-vi",
        "Japanese", "Vietnamese",
        "ベトナム語日本語翻訳",
        "ベトナム語日本語翻訳 | ベトナム語翻訳無料",
        "ベトナム語翻訳無料ツール。ベトナム語→日本語・日本語→ベトナム語の両方向に対応。ベトナム語訳を即時・音声入力で。",
        "ja",
    ),
    # 越南市場：越日翻譯
    (
        "vi-to-ja",
        "Vietnamese", "Japanese",
        "Dịch Nhật Việt",
        "Dịch Nhật Việt | Dịch tiếng Nhật sang tiếng Việt miễn phí",
        "Dịch Nhật Việt và Việt Nhật miễn phí. Dịch sang tiếng Nhật hoặc dịch tiếng Nhật sang tiếng Việt nhanh chóng. Hỗ trợ nhập liệu giọng nói.",
        "vi",
    ),
    # 越南市場：越韓翻譯
    (
        "vi-to-ko",
        "Vietnamese", "Korean",
        "Dịch sang tiếng Hàn",
        "Dịch Tiếng Hàn | Dịch sang tiếng Hàn Quốc miễn phí",
        "Công cụ dịch tiếng Hàn miễn phí. Dịch sang tiếng Hàn hoặc dịch tiếng Hàn sang tiếng Việt nhanh chóng. Hỗ trợ nhập liệu giọng nói. Phiên dịch tiếng Hàn chính xác.",
        "vi",
    ),
]

ALL_PAIR_LINKS = "".join(
    f'<a href="/translation/{slug}/" '
    f'class="text-sm text-blue-600 hover:underline bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm hover:shadow transition">'
    f'{h1}</a>\n      '
    for slug, _, _, h1, _, _, _ in PAIRS
)

TEMPLATE = """\
<!DOCTYPE html>
<html lang="{html_lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title_tag}</title>
  <meta name="description" content="{meta_description}" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-gradient-to-br from-blue-50 to-white">
  <div class="max-w-4xl mx-auto px-4 py-10">
    <a href="/translation/" class="text-sm text-blue-500 hover:underline mb-6 inline-block">← 所有語言</a>
    <h1 class="text-3xl font-bold text-center text-gray-800 mb-2">{h1}</h1>
    <p class="text-center text-gray-500 text-sm mb-8">{meta_description}</p>

    <div id="translator" data-from="{from_code}" data-to="{to_code}"></div>

    <section class="mt-16">
      <h2 class="text-lg font-semibold text-gray-700 mb-4">其他熱門翻譯</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {pair_links}
      </div>
    </section>
  </div>

  <script type="module" src="/translation/translator.js"></script>
</body>
</html>
"""

base = os.path.join(os.path.dirname(__file__), "translation")

for slug, from_code, to_code, h1, title_tag, meta_description, html_lang in PAIRS:
    folder = os.path.join(base, slug)
    os.makedirs(folder, exist_ok=True)
    html = TEMPLATE.format(
        h1=h1,
        title_tag=title_tag,
        meta_description=meta_description,
        from_code=from_code,
        to_code=to_code,
        pair_links=ALL_PAIR_LINKS,
        html_lang=html_lang,
    )
    with open(os.path.join(folder, "index.html"), "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  ✓ {slug}/index.html")

print(f"\n完成！共生成 {len(PAIRS)} 個頁面。")
