#!/usr/bin/env python3
"""Remove leftover old header fragments after the new header's closing </a>."""
import os, re

BASE = os.path.dirname(os.path.abspath(__file__))

def clean_file(filepath):
    with open(filepath, encoding='utf-8') as f:
        html = f.read()

    original = html

    # Remove any leftover sph-download-mobile-btn or orphaned sph-download-btn fragments
    # These appear between the new </a> and <div class="coupon-container"> or <div class="hidden-seo">
    # Pattern: content between first </a> (new header) and the next real div after it
    #
    # Strategy: find the sequence:
    #   </a>
    #   [junk containing sph-download or orphaned </div></a>]
    #   </a>         ← mismatched old header close
    #   <div class=  ← first real content div
    # and replace with just:
    #   </a>
    #   <div class=

    html = re.sub(
        r'(    </a>\n)(?:(?!    <div class=)[\s\S])*?(    <div class=)',
        r'\1    \2',
        html,
        count=1
    )

    # Also move the <style> block from <body> into <head> (clean up)
    # Find <style>@media...</style> block immediately after <body>
    html = re.sub(
        r'(<body[^>]*>)\n\s*(<style>\s*@media[^<]+</style>)\n',
        lambda m: (
            m.group(1) + '\n'
        ),
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
        if clean_file(filepath):
            print(f'  cleaned: {rel}')
            fixed += 1

print(f'\nDone: {fixed} files cleaned')
