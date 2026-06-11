/**
 * build-spots-en.js
 * 為每個景點生成英文靜態 HTML（SEO 用）
 * 輸出目錄：spot/ja/ajisai/  spot/ja/koyo/  spot/ja/sakura/
 * 執行方式：node build-spots-en.js
 */

const fs   = require('fs');
const path = require('path');

const BASE_DIR   = __dirname;
const BUILD_DATE = new Date().toISOString().slice(0, 10);
const SITE_ROOT  = 'https://junlando.com/blossom';

const FLOWERS = {
  ajisai: { label: 'あじさい', labelFull: '日本のあじさい', year: 2026, emoji: '💠' },
  koyo:   { label: '紅葉',     labelFull: '日本の紅葉',     year: 2026, emoji: '🍁' },
  sakura: { label: '桜',       labelFull: '日本の桜',       year: 2027, emoji: '🌸' },
};

// ── 載入資料 ──

function loadJSON(rel) {
  return JSON.parse(fs.readFileSync(path.join(BASE_DIR, rel), 'utf8'));
}

const FORECASTS = {
  sakura: loadJSON('data/forecast/sakura-2027.json').prefectures,
  ajisai: loadJSON('data/forecast/ajisai-2026.json').prefectures,
  koyo:   loadJSON('data/forecast/koyo-2026.json').prefectures,
};

const SPOTS_BY_FLOWER = {
  sakura: loadJSON('data/spots/sakura.json'),
  ajisai: loadJSON('data/spots/ajisai.json'),
  koyo:   loadJSON('data/spots/koyo.json'),
};

// 嘗試載入英文 detail（不存在就空物件）
function loadDetailEn(flower) {
  const p = path.join(BASE_DIR, `data/spots/detail-${flower}.ja.json`);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {};
}

function flattenSpots(spotsObj) {
  const result = [];
  for (const [pref, spots] of Object.entries(spotsObj)) {
    for (const spot of spots) {
      const name = (spot.name || '').trim();
      if (name) result.push({ name, pref, address: spot.address || '' });
    }
  }
  return result;
}

function siblingsOf(flower, pref, selfName) {
  return (SPOTS_BY_FLOWER[flower][pref] || [])
    .filter(s => s.name !== selfName)
    .slice(0, 4);
}

function pad(n) { return String(n).padStart(3, '0'); }
function esc(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── HTML 生成 ──

function genHtml({ id, name, pref, flower, flowerInfo, idMap, detailEn }) {
  const fc       = FORECASTS[flower]?.[pref] || {};
  const prefName = fc.name || pref;  // 日本語の県名
  const range    = fc.forecastRange || '';

  const detail  = detailEn[name] || {};
  const tagline = detail.tagline || '';
  const period  = detail.period  || range || '';

  const title = `${name} | ${flowerInfo.year}年 ${prefName}${flowerInfo.label} | Junlando`;
  const descPeriod = period ? `見頃：${period}。` : '';
  const metaDesc = `${tagline || `${prefName}のおすすめ${flowerInfo.label}スポット「${name}」。`}${descPeriod}開花予報・アクセス情報。`;

  const canonical   = `${SITE_ROOT}/spot/ja/${flower}/${id}.html`;
  const zhCanonical = `${SITE_ROOT}/spot/${flower}/${id}.html`;
  const prefUrl     = `${SITE_ROOT}/prefecture/ja/${flower}/${pref}.html`;
  const homeUrl     = `${SITE_ROOT}/ja/index.html?flower=${flower}`;

  // JSON-LD
  const jsonldPlace = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    "name": name,
    "description": metaDesc,
    "url": canonical,
    "address": { "@type": "PostalAddress", "addressRegion": prefName, "addressCountry": "JP" },
    ...(detail.mapUrl ? { "hasMap": detail.mapUrl } : {})
  });

  const jsonldBreadcrumb = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "開花予報", "item": homeUrl },
      { "@type": "ListItem", "position": 2, "name": prefName, "item": prefUrl },
      { "@type": "ListItem", "position": 3, "name": name, "item": canonical },
    ]
  });

  // Siblings cards
  const siblings = siblingsOf(flower, pref, name);
  const siblingsHtml = siblings.length ? `
<section class="siblings-section">
  <div class="section-heading">${esc(prefName)}の${flowerInfo.label}スポット</div>
  ${siblings.map(s => {
    const sid = idMap[flower]?.[s.name];
    const href = sid ? `${id}.html` : `../../../spot.html?flower=${flower}&spot=${encodeURIComponent(s.name)}&pref=${pref}`;
    const sd = detailEn[s.name] || {};
    return `<a class="spot-card" href="${href}">
    <div class="spot-info">
      <div class="spot-name">${esc(s.name)}</div>
      ${s.address ? `<div class="spot-address">📍 ${esc(s.address)}</div>` : ''}
      ${(sd.period || s.period) ? `<div class="spot-period-row">見頃時期：<span>${esc(sd.period || s.period)}</span></div>` : ''}
    </div>
    <div class="spot-arrow">›</div>
  </a>`;
  }).join('\n  ')}
</section>` : '';

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(metaDesc)}" />
  <meta property="og:title" content="${esc(name)} | ${flowerInfo.year} ${flowerInfo.label} in Japan" />
  <meta property="og:description" content="${esc(metaDesc)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonical}" />
  <link rel="canonical" href="${canonical}" />
  <link rel="alternate" hreflang="zh-Hant" href="${zhCanonical}" />
  <link rel="alternate" hreflang="ja" href="${canonical}" />
  <link rel="icon" href="/favicon.ico" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../../../spot.css" />
  <style>
    :root { --active: #7c5cbf; --active-light: #f0eafb; }
    .updated-date { font-size: 11px; color: var(--text-sub); margin-top: 4px; }
  </style>
  <script type="application/ld+json">${jsonldPlace}</script>
  <script type="application/ld+json">${jsonldBreadcrumb}</script>
  <script>
    window.__SPOT = { name: ${JSON.stringify(name)}, flower: ${JSON.stringify(flower)}, pref: ${JSON.stringify(pref)} };
    window.__BASE = '../../../';
    window.__LANG = 'ja';
    window.__SIBLINGS_HTML = ${JSON.stringify(siblingsHtml)};
    window.__BUILD_DATE = '${BUILD_DATE}';
  </script>
</head>
<body>

<header>
  <div class="header-inner">
    <a class="logo" href="../../../index.html">
      <img src="/favicon.ico" style="width:32px;height:32px;border-radius:8px;display:block" alt="Junlando" />
      Junlando
    </a>
    <nav class="header-links">
      <a href="../../../ja/index.html">開花予報</a>
      <a href="https://community.junlando.com" target="_blank" rel="noopener">旅行フォーラム</a>
    </nav>
  </div>
</header>

<nav class="breadcrumb-bar">
  <div class="breadcrumb-inner" id="breadcrumb">
    <a href="../../../ja/index.html?flower=${flower}">開花予報</a>
    <span class="breadcrumb-sep">›</span>
    <a href="../../../prefecture/ja/${flower}/${pref}.html">${esc(prefName)}</a>
    <span class="breadcrumb-sep">›</span>
    <span class="breadcrumb-current">${esc(name)}</span>
  </div>
</nav>

<div id="spotHeader"></div>

<div class="hero-img-wrap" id="heroWrap">
  <div class="hero-placeholder" id="heroPlaceholder">${flowerInfo.emoji}</div>
</div>

<main class="main">
  <h1 style="display:none">${esc(name)} ${flowerInfo.year} ${flowerInfo.label} Japan</h1>
  <div id="app" class="loading">読み込み中…</div>
  <div id="siblings-mount"></div>
</main>

<footer>
  <p>© 2026 Junlando | <a href="../../../ja/">ホーム</a> · <a href="../../../ja/index.html">開花予報</a></p>
</footer>

<script src="../../../spot.js"></script>
<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-analytics.js";
  import { initTracking } from "../../../analytics-events.js";
  const app = initializeApp({
    apiKey: "AIzaSyAByDmbKNZhktfvqIhog4Rr3GtHgrZC1Lo",
    authDomain: "blossomweb-42c86.firebaseapp.com",
    projectId: "blossomweb-42c86",
    storageBucket: "blossomweb-42c86.firebasestorage.app",
    messagingSenderId: "644716298227",
    appId: "1:644716298227:web:19ba11600bc2bf5540dc86",
    measurementId: "G-8L0J9JP7TY"
  });
  initTracking(getAnalytics(app));
</script>
<script>
  document.addEventListener('DOMContentLoaded', () => {
    const mount = document.getElementById('siblings-mount');
    if (mount && window.__SIBLINGS_HTML) mount.innerHTML = window.__SIBLINGS_HTML;
    const app = document.getElementById('app');
    if (app) {
      const obs = new MutationObserver(() => {
        if (!app.classList.contains('loading') && !document.querySelector('.updated-date')) {
          const d = document.createElement('p');
          d.className = 'updated-date';
          d.textContent = 'Last updated: ' + window.__BUILD_DATE;
          app.appendChild(d);
          obs.disconnect();
        }
      });
      obs.observe(app, { attributes: true });
    }
  });
</script>
</body>
</html>`;
}

// ── Sitemap 生成 ──

function genSitemapEntries(allPages) {
  return allPages.map(({ url }) => `  <url>
    <loc>${url}</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n');
}

// ── 主程式 ──

const idMap   = {};
const allPages = [];

// 先建立 ID 對照（與 build-spots.js 相同邏輯，確保 ID 一致）
for (const [flower] of Object.entries(FLOWERS)) {
  const spots = flattenSpots(SPOTS_BY_FLOWER[flower]);
  idMap[flower] = {};
  spots.forEach((spot, i) => {
    idMap[flower][spot.name] = pad(i + 1);
  });
}

// 生成 HTML
for (const [flower, flowerInfo] of Object.entries(FLOWERS)) {
  const spots    = flattenSpots(SPOTS_BY_FLOWER[flower]);
  const detailEn = loadDetailEn(flower);
  const outDir   = path.join(BASE_DIR, 'spot', 'ja', flower);
  fs.mkdirSync(outDir, { recursive: true });

  spots.forEach((spot, i) => {
    const id   = pad(i + 1);
    const html = genHtml({ id, name: spot.name, pref: spot.pref, flower, flowerInfo, idMap, detailEn });
    fs.writeFileSync(path.join(outDir, `${id}.html`), html, 'utf8');
    allPages.push({ url: `${SITE_ROOT}/spot/ja/${flower}/${id}.html` });
  });

  console.log(`✅ en/${flower}: ${spots.length} pages → spot/ja/${flower}/`);
}

// 附加 sitemap 條目到現有 sitemap（或生成獨立 sitemap）
const sitemapEnPath = path.join(BASE_DIR, 'sitemap-ja.xml');
const sitemapEn = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${genSitemapEntries(allPages)}
</urlset>`;
fs.writeFileSync(sitemapEnPath, sitemapEn, 'utf8');
console.log(`✅ sitemap-ja.xml (${allPages.length} URLs)`);

console.log(`\n📦 Total: ${allPages.length} English spot pages`);
console.log(`📅 Build date: ${BUILD_DATE}`);
