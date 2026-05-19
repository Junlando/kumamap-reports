#!/usr/bin/env python3
"""Fix broken sph-mobile-title closing tag across all store pages."""
import os, re

BASE = os.path.dirname(os.path.abspath(__file__))

def fix_file(filepath):
    with open(filepath, encoding='utf-8') as f:
        html = f.read()

    if 'sph-download' not in html:
        return False

    original = html

    # Fix 1: Add missing </div> after sph-mobile-brand span (before sph-download opens)
    html = re.sub(
        r'(<span class="sph-mobile-brand">JUNLANDO</span>\n)(\s*<div class="sph-download">)',
        r'\1            </div>\n\2',
        html
    )

    # Fix 2: Remove the extra stray </div> that was the misplaced closer
    # Pattern: after sph-download-mobile closes, there's an extra </div> before </div></a>
    html = re.sub(
        r'(            </div>\n)            </div>\n(        </div>\n    </a>)',
        r'\1\2',
        html
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
        if parts in (['index.html'], ['kr', 'index.html']):
            continue
        if fix_file(filepath):
            print(f'  fixed: {rel}')
            fixed += 1

print(f'\nDone: {fixed} files fixed')
