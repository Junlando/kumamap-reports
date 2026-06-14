/**
 * build-sitemap.js
 * 生成 hanabi EN/JA sitemap，並自動更新 blossom/sitemap-en.xml 和 sitemap-ja.xml
 */

const fs   = require('fs');
const path = require('path');

const BASE_DIR    = __dirname;
const BLOSSOM_DIR = path.join(BASE_DIR, '..');
const SITE_ROOT   = 'https://junlando.com/blossom/hanabi';
const TODAY       = new Date().toISOString().slice(0, 10);

const EN_EVENTS = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'data/events.en.json'), 'utf8'));
const JA_EVENTS = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'data/events.ja.json'), 'utf8'));

function urlEntry(loc, priority = '0.7', freq = 'monthly') {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

// ── EN sitemap block ───────────────────────────────────────────────────
const enUrls = [
  urlEntry(`${SITE_ROOT}/en/`, '0.9', 'weekly'),
];

// pref pages
const enPrefs = [...new Set(EN_EVENTS.map(e => e.ken))];
enPrefs.forEach(ken => enUrls.push(urlEntry(`${SITE_ROOT}/pref/en/${ken}.html`, '0.8', 'monthly')));

// spot pages
EN_EVENTS.forEach(ev => enUrls.push(urlEntry(`${SITE_ROOT}/spot/en/${ev.id}.html`, '0.7', 'monthly')));

// ── JA sitemap block ───────────────────────────────────────────────────
const jaUrls = [
  urlEntry(`${SITE_ROOT}/ja/`, '0.9', 'weekly'),
];

const jaPrefs = [...new Set(JA_EVENTS.map(e => e.ken))];
jaPrefs.forEach(ken => jaUrls.push(urlEntry(`${SITE_ROOT}/pref/ja/${ken}.html`, '0.8', 'monthly')));
JA_EVENTS.forEach(ev => jaUrls.push(urlEntry(`${SITE_ROOT}/spot/ja/${ev.id}.html`, '0.7', 'monthly')));

// ── Append to sitemap-en.xml ───────────────────────────────────────────
function appendToSitemap(file, urls) {
  let xml = fs.readFileSync(file, 'utf8');
  // Remove closing tag, append, re-add
  const closingTag = '</urlset>';
  const idx = xml.lastIndexOf(closingTag);
  if (idx === -1) {
    console.error(`  ❌ ${file}: no </urlset> found`);
    return;
  }

  // Remove existing hanabi entries to avoid duplication
  const lines = xml.slice(0, idx).split('\n');
  const filtered = lines.filter(line => !line.includes('/hanabi/'));

  const newXml = filtered.join('\n').trimEnd()
    + '\n\n  <!-- hanabi EN/JA -->\n'
    + urls.join('\n')
    + '\n' + closingTag + '\n';

  fs.writeFileSync(file, newXml, 'utf8');
  console.log(`  ✅ Updated ${path.basename(file)} (+${urls.length} URLs)`);
}

appendToSitemap(path.join(BLOSSOM_DIR, 'sitemap-en.xml'), enUrls);
appendToSitemap(path.join(BLOSSOM_DIR, 'sitemap-ja.xml'), jaUrls);

console.log('\n✅ Sitemap 更新完成');
