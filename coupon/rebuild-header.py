#!/usr/bin/env python3
"""Rebuild store page header from scratch using flexbox - no absolute positioning."""
import os, re

BASE = os.path.dirname(os.path.abspath(__file__))

# ── New CSS ──────────────────────────────────────────────────────────────────
NEW_CSS = """
        /* ── Store page header ── */
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
            width: 90px;
            height: 90px;
            border-radius: 12px;
            object-fit: contain;
            background: #d9d9d9;
            flex-shrink: 0;
        }

        .sph-text {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .sph-title-text {
            font-size: 40px;
            font-weight: 700;
            color: #422826;
            line-height: 48px;
            font-family: 'Inter', 'Arial', 'Microsoft JhengHei', sans-serif;
            margin: 0;
        }

        .sph-brand {
            font-size: 20px;
            font-weight: 500;
            color: #422826;
            line-height: 24px;
            font-family: 'Inter', 'Arial', 'Microsoft JhengHei', sans-serif;
            margin: 0;
        }

        .sph-spacer { flex: 1; }

        .sph-download {
            display: flex;
            gap: 25px;
            align-items: center;
            flex-shrink: 0;
        }

        .sph-download-btn {
            display: block;
            text-decoration: none;
            height: 62px;
        }

        .sph-download-btn img {
            height: 62px;
            width: auto;
            display: block;
        }

        @media (max-width: 900px) {
            .store-page-header {
                height: 104px;
                padding: 0 10px;
                gap: 12px;
            }

            .sph-logo {
                width: 62px;
                height: 62px;
            }

            .sph-title-text {
                font-size: 30px;
                line-height: 36px;
            }

            .sph-brand {
                font-size: 14px;
                line-height: 17px;
            }

            .sph-download-btn {
                height: 40px;
            }

            .sph-download-btn img {
                height: 40px;
            }

            .sph-download {
                gap: 8px;
            }
        }"""

# ── New HTML ─────────────────────────────────────────────────────────────────
def make_header_html(href, icon_path, title_text):
    return f"""    <a href="{href}" class="store-page-header" id="store-page-header">
        <img class="sph-logo" src="{icon_path}" alt="{title_text}" />
        <div class="sph-text">
            <span class="sph-title-text">{title_text}</span>
            <span class="sph-brand">JUNLANDO</span>
        </div>
        <div class="sph-spacer"></div>
        <div class="sph-download">
            <a href="https://play.google.com/store/apps/details?id=com.junlando.japancoupon"
               class="sph-download-btn" target="_blank" rel="noopener noreferrer">
                <img src="/google_play_downnload.png" alt="Google Play" />
            </a>
            <a href="https://apps.apple.com/app/6449156306"
               class="sph-download-btn" target="_blank" rel="noopener noreferrer">
                <img src="/app_store_download.png" alt="App Store" />
            </a>
        </div>
    </a>"""

ZH_HEADER = make_header_html("/coupon/", "../drawables/net_icon.webp", "日本優惠券")
KR_HEADER  = make_header_html("/coupon/kr/", "../drawables/net_icon.webp", "일본 할인 쿠폰")

# ── Patterns to strip out ────────────────────────────────────────────────────
# Remove ALL old sph-* CSS blocks (between the marker comment and </style>)
OLD_CSS_PATTERN = re.compile(
    r'\n?\s*/\* ── Store page header.*?(?=\n\s*</style>)',
    re.DOTALL
)

# Remove old <a class="store-page-header"> block (with all nested content)
OLD_HTML_PATTERN = re.compile(
    r'\n?\s*<a [^>]*class="store-page-header"[^>]*>.*?</a>',
    re.DOTALL
)

# Also strip the inline background-image style that some pages may have gotten
OLD_STYLE_BG = re.compile(r'\s*style="background-image:[^"]*"')


def rebuild_file(filepath, is_kr):
    with open(filepath, encoding='utf-8') as f:
        html = f.read()

    if 'store-page-header' not in html:
        return False

    original = html

    # 1. Strip all old sph CSS
    html = OLD_CSS_PATTERN.sub('', html)

    # 2. Strip old header HTML
    html = OLD_HTML_PATTERN.sub('', html)

    # 3. Inject new CSS (before </style>)
    html = html.replace('</style>', NEW_CSS + '\n    </style>', 1)

    # 4. Inject new header HTML (after <body>)
    new_header = KR_HEADER if is_kr else ZH_HEADER
    # Set background-image via style attr on the <a> so the path is baked in
    bg_url = "../drawables/header_bg.webp"   # used for both; desktop overrides via JS? No - just set in CSS
    # Actually the CSS uses generic class, we need to set bg per-file via a style attr
    bg_desktop = "../drawables/header_bg_desktop.webp"
    new_header_with_bg = new_header.replace(
        '<a href=',
        f'<a style="background-image:url(\'{bg_desktop}\')" href=',
        1
    )
    # Add responsive bg for mobile via a small inline style block
    mobile_bg_style = f"""    <style>
        @media (max-width: 900px) {{
            #store-page-header {{ background-image: url('../drawables/header_bg.webp') !important; }}
        }}
    </style>"""

    html = re.sub(
        r'(<body[^>]*>)',
        r'\1\n' + mobile_bg_style + '\n' + new_header_with_bg,
        html,
        count=1
    )

    if html != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
        return True
    return False


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
        if rebuild_file(filepath, is_kr):
            print(f'  rebuilt: {rel}')
            fixed += 1

print(f'\nDone: {fixed} files rebuilt')
