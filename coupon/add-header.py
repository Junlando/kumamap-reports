#!/usr/bin/env python3
"""Add a simple top nav header to all coupon store pages (not index pages)."""
import os, re

BASE = os.path.dirname(os.path.abspath(__file__))

HEADER_CSS = """
        .store-page-header {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 16px;
            background: #fff;
            border-bottom: 1px solid #f0ebe6;
            position: sticky;
            top: 0;
            z-index: 100;
            text-decoration: none;
        }

        .store-page-header:hover {
            background: #fdf8f5;
        }

        .store-page-header img {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            object-fit: contain;
            flex-shrink: 0;
        }

        .store-page-header-title {
            font-size: 16px;
            font-weight: 700;
            color: #422826;
            font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial;
        }"""

# zh-TW store pages
ZH_HEADER_HTML = """
    <a href="/coupon/" class="store-page-header" id="store-page-header">
        <img src="../drawables/net_icon.webp" alt="日本優惠券" />
        <span class="store-page-header-title">日本優惠券</span>
    </a>"""

# kr store pages
KR_HEADER_HTML = """
    <a href="/coupon/kr/" class="store-page-header" id="store-page-header">
        <img src="../drawables/net_icon.webp" alt="일본 할인 쿠폰" />
        <span class="store-page-header-title">일본 할인 쿠폰</span>
    </a>"""

HIDE_FROM_APP_JS = """
    <script>
        (function() {
            var params = new URLSearchParams(window.location.search);
            if (params.get('from') === 'app') {
                var h = document.getElementById('store-page-header');
                if (h) h.style.display = 'none';
            }
        })();
    </script>"""


def add_header_to_file(filepath, is_kr):
    with open(filepath, encoding='utf-8') as f:
        html = f.read()

    # Skip if already patched
    if 'store-page-header' in html:
        return False

    # 1. Inject CSS before </style>
    if '</style>' in html:
        html = html.replace('</style>', HEADER_CSS + '\n    </style>', 1)

    # 2. Inject header HTML right after <body>
    header_html = KR_HEADER_HTML if is_kr else ZH_HEADER_HTML
    html = re.sub(r'(<body[^>]*>)', r'\1' + header_html, html, count=1)

    # 3. Inject hide-from-app JS before </body>
    html = html.replace('</body>', HIDE_FROM_APP_JS + '\n</body>', 1)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html)
    return True


fixed = 0
for root, dirs, files in os.walk(BASE):
    dirs[:] = [d for d in dirs if d not in ('coupon_images', 'coupon_stores',
                                              'coupon_stores_mobile', 'drawables',
                                              'store_icons', 'favicon', 'markers')]
    for fname in files:
        if fname != 'index.html':
            continue
        filepath = os.path.join(root, fname)
        rel = os.path.relpath(filepath, BASE)
        parts = rel.replace('\\', '/').split('/')

        is_kr = 'kr' in parts
        is_root_index = parts == ['index.html']
        is_kr_root_index = parts == ['kr', 'index.html']

        # Only patch store-level pages, not the main index pages
        if is_root_index or is_kr_root_index:
            continue

        if add_header_to_file(filepath, is_kr):
            print(f'  patched: {rel}')
            fixed += 1

print(f'\nDone: {fixed} pages patched')
