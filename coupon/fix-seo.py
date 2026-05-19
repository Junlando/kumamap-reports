#!/usr/bin/env python3
"""Fix 4 SEO issues across all coupon pages."""
import os, re, json

BASE = os.path.dirname(os.path.abspath(__file__))
BASE_URL = "https://junlando.com/coupon"

OLD_HIDDEN_SEO = """\
        .hidden-seo {
            position: absolute;
            left: -9999px;
            visibility: hidden;
            opacity: 0;
        }"""

NEW_HIDDEN_SEO = """\
        .hidden-seo {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }"""


def canonical_for(rel_path):
    """Return the correct canonical URL for a given relative path from coupon/."""
    parts = rel_path.replace("\\", "/").split("/")
    # parts looks like ['aeon', 'index.html'] or ['kr', 'aeon', 'index.html']
    page_parts = [p for p in parts if p != "index.html"]
    return BASE_URL + ("/" + "/".join(page_parts) if page_parts else "") + "/"


def rewrite_schema(schema_str):
    """Rewrite DiscountOffer schema to Product+Offer."""
    try:
        obj = json.loads(schema_str)
    except json.JSONDecodeError:
        return schema_str  # skip if unparseable

    if obj.get("@type") != "DiscountOffer":
        return schema_str

    new_obj = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": obj.get("name", ""),
        "description": obj.get("description", ""),
        "url": obj.get("url", ""),
        "brand": {
            "@type": "Brand",
            "name": obj.get("alternateName", obj.get("name", ""))
        },
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "JPY",
            "availability": "https://schema.org/InStock",
            "validThrough": obj.get("validThrough", ""),
            "description": obj.get("discountCode", "")
        }
    }
    return json.dumps(new_obj, ensure_ascii=False, indent=2)


def fix_file(filepath, rel_path):
    with open(filepath, encoding="utf-8") as f:
        html = f.read()

    changed = False

    # 1. Fix canonical
    correct_canonical = canonical_for(rel_path)
    new_html, n = re.subn(
        r'<link rel="canonical" href="[^"]*"',
        f'<link rel="canonical" href="{correct_canonical}"',
        html
    )
    if n:
        html = new_html
        changed = True

    # 2. Fix year 2025 → 2026 (only in meta description and ld+json, not in URL or validThrough)
    def fix_year_in_meta(m):
        return m.group(0).replace("2025", "2026")

    new_html = re.sub(
        r'<meta name="description" content="[^"]*2025[^"]*"',
        fix_year_in_meta,
        html
    )
    if new_html != html:
        html = new_html
        changed = True

    # 3. Fix hidden-seo CSS
    if OLD_HIDDEN_SEO in html:
        html = html.replace(OLD_HIDDEN_SEO, NEW_HIDDEN_SEO)
        changed = True

    # 4. Rewrite DiscountOffer schema to Product+Offer (and fix 2025 in description)
    def replace_schema(m):
        fixed = rewrite_schema(m.group(1))
        fixed = fixed.replace("2025", "2026")
        return f'<script type="application/ld+json">\n{fixed}\n    </script>'

    new_html = re.sub(
        r'<script type="application/ld\+json">\s*(.*?)\s*</script>',
        replace_schema,
        html,
        flags=re.DOTALL
    )
    if new_html != html:
        html = new_html
        changed = True

    if changed:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(html)
        return True
    return False


fixed = 0
skipped = 0
for root, dirs, files in os.walk(BASE):
    # skip non-html directories
    dirs[:] = [d for d in dirs if d not in ("coupon_images", "coupon_stores",
                                              "coupon_stores_mobile", "drawables",
                                              "store_icons", "favicon", "markers")]
    for fname in files:
        if fname != "index.html":
            continue
        filepath = os.path.join(root, fname)
        rel_path = os.path.relpath(filepath, BASE)
        if fix_file(filepath, rel_path):
            print(f"  fixed: {rel_path}")
            fixed += 1
        else:
            skipped += 1

print(f"\nDone: {fixed} fixed, {skipped} skipped (already correct)")
