/**
 * build-sitemaps.js
 * 生成四個 sitemap 檔案：
 *   sitemap.xml        — 繁中（主站）
 *   sitemap-en.xml     — 英文
 *   sitemap-ja.xml     — 日文
 *   sitemap-index.xml  — Sitemap Index（Search Console 只提交這個）
 *
 * 執行：node build-sitemaps.js
 */

const fs   = require('fs');
const path = require('path');

const BASE_DIR   = __dirname;
const SITE_ROOT  = 'https://junlando.com/blossom';
const BUILD_DATE = new Date().toISOString().slice(0, 10);

const FLOWERS  = ['ajisai', 'koyo', 'sakura'];

// ── 讀取檔案清單 ──────────────────────────────────────────

function listHtml(dir) {
  const full = path.join(BASE_DIR, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full).filter(f => f.endsWith('.html')).map(f => f.replace('.html', ''));
}

// ── XML 生成 ──────────────────────────────────────────────

function urlEntry(loc, priority = '0.7', changefreq = 'weekly') {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function buildSitemap(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;
}

// ── 繁中 sitemap ──────────────────────────────────────────

const zhEntries = [];

// 首頁
zhEntries.push(urlEntry(`${SITE_ROOT}/index.html`, '1.0', 'daily'));

// Prefecture 頁（中文）
for (const flower of FLOWERS) {
  for (const ken of listHtml(`prefecture/${flower}`)) {
    zhEntries.push(urlEntry(`${SITE_ROOT}/prefecture/${flower}/${ken}.html`, '0.75'));
  }
}

// Spot 頁（中文）
for (const flower of FLOWERS) {
  for (const id of listHtml(`spot/${flower}`)) {
    zhEntries.push(urlEntry(`${SITE_ROOT}/spot/${flower}/${id}.html`, '0.65'));
  }
}

fs.writeFileSync(path.join(BASE_DIR, 'sitemap.xml'), buildSitemap(zhEntries), 'utf8');
console.log(`✅ sitemap.xml       — ${zhEntries.length} URLs`);

// ── 英文 sitemap ──────────────────────────────────────────

const enEntries = [];

// 首頁
enEntries.push(urlEntry(`${SITE_ROOT}/en/`, '1.0', 'daily'));

// Prefecture 頁（英文）
for (const flower of FLOWERS) {
  for (const ken of listHtml(`prefecture/en/${flower}`)) {
    enEntries.push(urlEntry(`${SITE_ROOT}/prefecture/en/${flower}/${ken}.html`, '0.75'));
  }
}

// Spot 頁（英文）
for (const flower of FLOWERS) {
  for (const id of listHtml(`spot/en/${flower}`)) {
    enEntries.push(urlEntry(`${SITE_ROOT}/spot/en/${flower}/${id}.html`, '0.65'));
  }
}

fs.writeFileSync(path.join(BASE_DIR, 'sitemap-en.xml'), buildSitemap(enEntries), 'utf8');
console.log(`✅ sitemap-en.xml    — ${enEntries.length} URLs`);

// ── 日文 sitemap ──────────────────────────────────────────

const jaEntries = [];

// 首頁
jaEntries.push(urlEntry(`${SITE_ROOT}/ja/`, '1.0', 'daily'));

// Prefecture 頁（日文）
for (const flower of FLOWERS) {
  for (const ken of listHtml(`prefecture/ja/${flower}`)) {
    jaEntries.push(urlEntry(`${SITE_ROOT}/prefecture/ja/${flower}/${ken}.html`, '0.75'));
  }
}

// Spot 頁（日文）
for (const flower of FLOWERS) {
  for (const id of listHtml(`spot/ja/${flower}`)) {
    jaEntries.push(urlEntry(`${SITE_ROOT}/spot/ja/${flower}/${id}.html`, '0.65'));
  }
}

fs.writeFileSync(path.join(BASE_DIR, 'sitemap-ja.xml'), buildSitemap(jaEntries), 'utf8');
console.log(`✅ sitemap-ja.xml    — ${jaEntries.length} URLs`);

// ── Sitemap Index ─────────────────────────────────────────

const index = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_ROOT}/sitemap.xml</loc>
    <lastmod>${BUILD_DATE}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_ROOT}/sitemap-en.xml</loc>
    <lastmod>${BUILD_DATE}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_ROOT}/sitemap-ja.xml</loc>
    <lastmod>${BUILD_DATE}</lastmod>
  </sitemap>
</sitemapindex>`;

fs.writeFileSync(path.join(BASE_DIR, 'sitemap-index.xml'), index, 'utf8');
console.log(`✅ sitemap-index.xml — 3 sitemaps`);

const total = zhEntries.length + enEntries.length + jaEntries.length;
console.log(`\n📦 Total: ${total} URLs across all sitemaps`);
console.log(`📅 Build date: ${BUILD_DATE}`);
console.log(`\n👉 Submit to Search Console: ${SITE_ROOT}/sitemap-index.xml`);
