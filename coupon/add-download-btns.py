#!/usr/bin/env python3
"""Add download buttons to store page headers (already have sph-content)."""
import os, re

BASE = os.path.dirname(os.path.abspath(__file__))

# --- Append to existing CSS (before closing </style>) ---
EXTRA_CSS = """
        /* Download buttons in store page header */
        .sph-download {
            position: absolute;
            right: 39px;
            top: 38px;
            display: flex;
            gap: 25px;
            align-items: center;
            z-index: 10;
        }

        .sph-download-btn {
            width: 187px;
            height: 62px;
            display: block;
            text-decoration: none;
        }

        .sph-download-btn img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .sph-download-mobile {
            display: none;
        }

        @media (max-width: 900px) {
            .sph-download {
                display: none;
            }

            .sph-download-mobile {
                display: flex;
                gap: 8px;
                align-items: center;
                position: absolute;
                right: 10px;
                top: 20px;
                z-index: 10;
            }

            .sph-download-mobile-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 48px;
                height: 48px;
                border-radius: 10px;
                background: #fff;
                border: 1px solid #ddd;
                text-decoration: none;
            }

            .sph-download-mobile-btn img {
                width: 32px;
                height: 32px;
                object-fit: contain;
            }
        }"""

# Download buttons HTML block (same for zh and kr)
DOWNLOAD_HTML = """            <div class="sph-download">
                <a href="https://play.google.com/store/apps/details?id=com.junlando.japancoupon"
                   class="sph-download-btn" target="_blank" rel="noopener noreferrer">
                    <img src="/google_play_downnload.png" alt="Google Play" />
                </a>
                <a href="https://apps.apple.com/app/6449156306"
                   class="sph-download-btn" target="_blank" rel="noopener noreferrer">
                    <img src="/app_store_download.png" alt="App Store" />
                </a>
            </div>
            <div class="sph-download-mobile">
                <a href="https://apps.apple.com/app/6449156306"
                   class="sph-download-mobile-btn" target="_blank" rel="noopener noreferrer">
                    <img src="../drawables/app_store_icon.png" alt="App Store" />
                </a>
                <a href="https://play.google.com/store/apps/details?id=com.junlando.japancoupon"
                   class="sph-download-mobile-btn" target="_blank" rel="noopener noreferrer">
                    <img src="../drawables/google_play_icon.png" alt="Google Play" />
                </a>
            </div>"""


def patch_file(filepath):
    with open(filepath, encoding='utf-8') as f:
        html = f.read()

    # Skip if already patched
    if 'sph-download' in html:
        return False

    # Skip if doesn't have the new header
    if 'sph-content' not in html:
        return False

    changed = False

    # 1. Inject CSS before </style>
    if EXTRA_CSS not in html:
        html = html.replace('</style>', EXTRA_CSS + '\n    </style>', 1)
        changed = True

    # 2. Inject download buttons inside sph-content, before closing </div>
    # Find the closing </div> of sph-content block and insert before the last one
    # The sph-content div ends before </a> (the closing tag of store-page-header)
    # Pattern: last </div> before </a> that closes store-page-header
    html = re.sub(
        r'(            </div>\n        </div>\n    </a>)',
        DOWNLOAD_HTML + r'\n            </div>\n        </div>\n    </a>',
        html,
        count=1
    )
    changed = True

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
        if parts in (['index.html'], ['kr', 'index.html']):
            continue
        if patch_file(filepath):
            print(f'  patched: {rel}')
            fixed += 1

print(f'\nDone: {fixed} pages updated')
