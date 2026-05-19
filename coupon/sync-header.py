#!/usr/bin/env python3
"""Replace simple store-page-header with homepage-matching header."""
import os, re

BASE = os.path.dirname(os.path.abspath(__file__))

# --- CSS to remove (old simple header) ---
OLD_CSS = """
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

# --- New CSS matching homepage header ---
NEW_CSS = """
        /* ── Store page header (matches homepage design) ── */
        .store-page-header {
            display: block;
            text-decoration: none;
            position: relative;
            overflow: hidden;
            height: 136px;
            cursor: pointer;
        }

        .store-page-header::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            width: 100%; height: 136px;
            background-image: url('../drawables/header_bg_desktop.webp');
            background-size: cover;
            background-position: center top;
            background-repeat: no-repeat;
            z-index: 0;
        }

        .store-page-header:hover::before {
            filter: brightness(0.97);
        }

        .sph-content {
            position: relative;
            max-width: 1200px;
            margin: 0 auto;
            height: 136px;
            z-index: 1;
        }

        /* Desktop logo */
        .sph-logo-box {
            position: absolute;
            left: 29px; top: 24px;
            width: 90px; height: 90px;
            border-radius: 12px;
            overflow: hidden;
            background: #d9d9d9;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .sph-logo-box img {
            width: 100%; height: 100%;
            object-fit: contain;
        }

        /* Desktop title */
        .sph-title {
            position: absolute;
            left: 190px; top: 21px;
        }

        .sph-title-text {
            display: block;
            font-size: 40px;
            font-weight: 700;
            color: #422826;
            line-height: 48px;
            font-family: 'Inter', 'Arial', 'Microsoft JhengHei', sans-serif;
        }

        .sph-brand {
            display: block;
            position: absolute;
            left: 4px; top: 69px;
            font-size: 20px;
            font-weight: 500;
            color: #422826;
            line-height: 24px;
            font-family: 'Inter', 'Arial', 'Microsoft JhengHei', sans-serif;
        }

        /* Mobile */
        .sph-mobile-logo { display: none; }
        .sph-mobile-title { display: none; }

        @media (max-width: 900px) {
            .store-page-header {
                height: 104px;
                overflow: hidden;
            }

            .store-page-header::before {
                height: 104px;
                background-image: url('../drawables/header_bg.webp') !important;
            }

            .sph-content {
                max-width: 390px;
                height: 104px;
            }

            .sph-logo-box { display: none; }
            .sph-title    { display: none; }

            .sph-mobile-logo {
                display: block;
                position: absolute;
                left: 13px; top: 16px;
                width: 62px; height: 63px;
                border-radius: 12px;
                overflow: hidden;
                background: #d9d9d9;
            }

            .sph-mobile-logo img {
                width: 100%; height: 100%;
                object-fit: contain;
                display: block;
            }

            .sph-mobile-title {
                display: block;
                position: absolute;
                left: 90px; top: 20px;
            }

            .sph-mobile-title-text {
                display: block;
                font-size: 30px;
                font-weight: 700;
                color: #422826;
                line-height: 36px;
                font-family: 'Inter', 'Arial', 'Microsoft JhengHei', sans-serif;
            }

            .sph-mobile-brand {
                display: block;
                font-size: 14px;
                font-weight: 500;
                color: #422826;
                line-height: 17px;
                font-family: 'Inter', 'Arial', 'Microsoft JhengHei', sans-serif;
                margin-top: 3px;
            }
        }"""

# zh-TW HTML
def zh_header_html(icon_path):
    return f"""
    <a href="/coupon/" class="store-page-header" id="store-page-header">
        <div class="sph-content">
            <div class="sph-logo-box">
                <img src="{icon_path}" alt="日本優惠券" />
            </div>
            <div class="sph-title">
                <span class="sph-title-text">日本優惠券</span>
                <span class="sph-brand">JUNLANDO</span>
            </div>
            <div class="sph-mobile-logo">
                <img src="{icon_path}" alt="日本優惠券" />
            </div>
            <div class="sph-mobile-title">
                <span class="sph-mobile-title-text">日本優惠券</span>
                <span class="sph-mobile-brand">JUNLANDO</span>
            </div>
        </div>
    </a>"""

# kr HTML
def kr_header_html(icon_path):
    return f"""
    <a href="/coupon/kr/" class="store-page-header" id="store-page-header">
        <div class="sph-content">
            <div class="sph-logo-box">
                <img src="{icon_path}" alt="일본 할인 쿠폰" />
            </div>
            <div class="sph-title">
                <span class="sph-title-text">일본 할인 쿠폰</span>
                <span class="sph-brand">JUNLANDO</span>
            </div>
            <div class="sph-mobile-logo">
                <img src="{icon_path}" alt="일본 할인 쿠폰" />
            </div>
            <div class="sph-mobile-title">
                <span class="sph-mobile-title-text">일본 할인 쿠폰</span>
                <span class="sph-mobile-brand">JUNLANDO</span>
            </div>
        </div>
    </a>"""

# Old HTML patterns to replace
OLD_ZH_HEADER = '''
    <a href="/coupon/" class="store-page-header" id="store-page-header">
        <img src="../drawables/net_icon.webp" alt="日本優惠券" />
        <span class="store-page-header-title">日本優惠券</span>
    </a>'''

OLD_KR_HEADER = '''
    <a href="/coupon/kr/" class="store-page-header" id="store-page-header">
        <img src="../drawables/net_icon.webp" alt="일본 할인 쿠폰" />
        <span class="store-page-header-title">일본 할인 쿠폰</span>
    </a>'''


def sync_file(filepath, is_kr):
    with open(filepath, encoding='utf-8') as f:
        html = f.read()

    if 'sph-content' in html:
        return False  # already updated

    changed = False

    # 1. Replace old CSS
    if OLD_CSS in html:
        html = html.replace(OLD_CSS, NEW_CSS)
        changed = True

    # 2. Replace old HTML
    icon_path = '../drawables/net_icon.webp'
    if is_kr:
        new_html_block = kr_header_html(icon_path)
        if OLD_KR_HEADER in html:
            html = html.replace(OLD_KR_HEADER, new_html_block)
            changed = True
    else:
        new_html_block = zh_header_html(icon_path)
        if OLD_ZH_HEADER in html:
            html = html.replace(OLD_ZH_HEADER, new_html_block)
            changed = True

    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
    return changed


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
        if parts in (['index.html'], ['kr', 'index.html']):
            continue
        if sync_file(filepath, is_kr):
            print(f'  synced: {rel}')
            fixed += 1

print(f'\nDone: {fixed} pages updated')
