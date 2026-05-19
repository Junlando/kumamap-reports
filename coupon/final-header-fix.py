#!/usr/bin/env python3
"""
Complete header rebuild: replace EVERYTHING between <body> and
<div class="coupon-container"> with the correct clean header HTML.
Also replace the store-page-header CSS block with the clean version.
"""
import os, re

BASE = os.path.dirname(os.path.abspath(__file__))

# ── Clean CSS ─────────────────────────────────────────────────────────────────
CLEAN_CSS = """        /* ── Store page header ── */
        .store-page-header {
            display: flex;
            align-items: center;
            gap: 20px;
            padding: 0 39px;
            height: 136px;
            background-size: cover;
            background-position: center top;
            background-repeat: no-repeat;
            text-decoration: none;
            cursor: pointer;
        }
        .store-page-header:hover { filter: brightness(0.97); }
        .sph-logo {
            width: 90px; height: 90px;
            border-radius: 12px;
            object-fit: contain;
            background: #d9d9d9;
            flex-shrink: 0;
        }
        .sph-text { display: flex; flex-direction: column; gap: 2px; }
        .sph-title-text {
            font-size: 40px; font-weight: 700; color: #422826;
            line-height: 48px; margin: 0;
            font-family: 'Inter', 'Arial', 'Microsoft JhengHei', sans-serif;
        }
        .sph-brand {
            font-size: 20px; font-weight: 500; color: #422826;
            line-height: 24px; margin: 0;
            font-family: 'Inter', 'Arial', 'Microsoft JhengHei', sans-serif;
        }
        .sph-spacer { flex: 1; }
        .sph-download { display: flex; gap: 25px; align-items: center; flex-shrink: 0; }
        .sph-download-btn { display: block; text-decoration: none; height: 62px; }
        .sph-download-btn img { height: 62px; width: auto; display: block; }
        @media (max-width: 900px) {
            .store-page-header { height: 104px; padding: 0 10px; gap: 12px;
                background-image: url('../drawables/header_bg.webp') !important; }
            .sph-logo { width: 62px; height: 62px; }
            .sph-title-text { font-size: 30px; line-height: 36px; }
            .sph-brand { font-size: 14px; line-height: 17px; }
            .sph-download { gap: 8px; }
            .sph-download-btn { height: 40px; }
            .sph-download-btn img { height: 40px; }
        }"""

# ── Clean HTML ────────────────────────────────────────────────────────────────
def make_header(href, icon, title):
    return (
        f'    <a style="background-image:url(\'{icon.replace("net_icon.webp","header_bg_desktop.webp")}\')"\n'
        f'       href="{href}" class="store-page-header" id="store-page-header">\n'
        f'        <img class="sph-logo" src="{icon}" alt="{title}" />\n'
        f'        <div class="sph-text">\n'
        f'            <span class="sph-title-text">{title}</span>\n'
        f'            <span class="sph-brand">JUNLANDO</span>\n'
        f'        </div>\n'
        f'        <div class="sph-spacer"></div>\n'
        f'        <div class="sph-download">\n'
        f'            <a href="https://play.google.com/store/apps/details?id=com.junlando.japancoupon"\n'
        f'               class="sph-download-btn" target="_blank" rel="noopener noreferrer">\n'
        f'                <img src="/google_play_downnload.png" alt="Google Play" />\n'
        f'            </a>\n'
        f'            <a href="https://apps.apple.com/app/6449156306"\n'
        f'               class="sph-download-btn" target="_blank" rel="noopener noreferrer">\n'
        f'                <img src="/app_store_download.png" alt="App Store" />\n'
        f'            </a>\n'
        f'        </div>\n'
        f'    </a>\n'
    )

ZH_HEADER = make_header("/coupon/",     "../drawables/net_icon.webp", "日本優惠券")
KR_HEADER = make_header("/coupon/kr/",  "../drawables/net_icon.webp", "일본 할인 쿠폰")

# Hide header when ?from=app
JS_HIDE = (
    '    <script>\n'
    '        (function(){\n'
    '            if(new URLSearchParams(window.location.search).get("from")==="app"){\n'
    '                var h=document.getElementById("store-page-header");\n'
    '                if(h) h.style.display="none";\n'
    '            }\n'
    '        })();\n'
    '    </script>\n'
)

def fix_file(filepath, is_kr):
    with open(filepath, encoding='utf-8') as f:
        html = f.read()

    if 'coupon-container' not in html and 'hidden-seo' not in html:
        return False  # unexpected structure

    original = html

    # 1. Replace the store-page-header CSS block
    html = re.sub(
        r'/\* ── Store page header ──.*?(?=\n\s*</style>)',
        CLEAN_CSS,
        html, flags=re.DOTALL
    )

    # 2. Replace everything between <body> and <div class="coupon-container">
    #    with the clean header
    new_header = KR_HEADER if is_kr else ZH_HEADER
    html = re.sub(
        r'(<body[^>]*>)\n.*?(?=\n    <div class="coupon-container">)',
        lambda m: m.group(1) + '\n' + new_header,
        html, flags=re.DOTALL
    )

    # 3. Ensure from=app JS is at end of body (remove old one first, re-add)
    html = re.sub(r'\s*<script>\s*\(function\(\)\s*\{[\s\S]*?from.*?app[\s\S]*?</script>', '', html)
    html = html.replace('</body>', JS_HIDE + '</body>', 1)

    if html != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
        return True
    return False


fixed = skipped = 0
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
        if parts in (['index.html'], ['kr', 'index.html']):
            continue
        if fix_file(filepath, is_kr):
            print(f'  fixed: {rel}')
            fixed += 1
        else:
            skipped += 1

print(f'\nDone: {fixed} fixed, {skipped} skipped')
