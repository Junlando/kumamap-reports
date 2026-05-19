#!/usr/bin/env python3
"""Fix store-page-header: move background from ::before to the element directly."""
import os, re

BASE = os.path.dirname(os.path.abspath(__file__))

OLD_CSS_BLOCK = """        /* ── Store page header (matches homepage design) ── */
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
        }"""

NEW_CSS_BLOCK = """        /* ── Store page header (matches homepage design) ── */
        .store-page-header {
            display: block;
            text-decoration: none;
            position: relative;
            overflow: hidden;
            height: 136px;
            cursor: pointer;
            background-image: url('../drawables/header_bg_desktop.webp');
            background-size: cover;
            background-position: center top;
            background-repeat: no-repeat;
        }

        .store-page-header:hover {
            filter: brightness(0.97);
        }

        .sph-content {
            position: relative;
            max-width: 1200px;
            margin: 0 auto;
            height: 136px;
        }"""

OLD_MOBILE_BEFORE = """            .store-page-header::before {
                height: 104px;
                background-image: url('../drawables/header_bg.webp') !important;
            }"""

NEW_MOBILE_BEFORE = """            .store-page-header {
                background-image: url('../drawables/header_bg.webp') !important;
            }"""

OLD_MOBILE_HEIGHT = """            .store-page-header {
                height: 104px;
                overflow: hidden;
            }"""

NEW_MOBILE_HEIGHT = """            .store-page-header {
                height: 104px;
                overflow: hidden;
                background-image: url('../drawables/header_bg.webp') !important;
            }"""


def fix_file(filepath):
    with open(filepath, encoding='utf-8') as f:
        html = f.read()

    if 'sph-content' not in html:
        return False
    if 'background-image: url(\'../drawables/header_bg_desktop.webp\')' in html and '::before' not in html:
        return False  # already fixed

    original = html

    # Fix desktop block
    if OLD_CSS_BLOCK in html:
        html = html.replace(OLD_CSS_BLOCK, NEW_CSS_BLOCK)

    # Fix mobile: merge the ::before rule into the .store-page-header rule
    if OLD_MOBILE_BEFORE in html:
        html = html.replace(OLD_MOBILE_BEFORE, '')
        html = html.replace(OLD_MOBILE_HEIGHT, NEW_MOBILE_HEIGHT)

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
        if parts in (['index.html'], ['kr', 'index.html']):
            continue
        if fix_file(filepath):
            print(f'  fixed: {rel}')
            fixed += 1

print(f'\nDone: {fixed} files fixed')
