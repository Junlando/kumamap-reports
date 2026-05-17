/**
 * build-spots.js
 * 為每個景點生成獨立靜態 HTML，供 SEO 長尾關鍵字使用。
 * 輸出目錄：spot/sakura/, spot/ajisai/, spot/koyo/
 * 執行方式：node build-spots.js
 */

const fs   = require('fs');
const path = require('path');

const BASE_DIR  = __dirname;
const BUILD_DATE = new Date().toISOString().slice(0, 10);  // YYYY-MM-DD
const SITE_ROOT  = 'https://junlando.com/blossom';

const FLOWERS = {
  sakura: { label: '櫻花', labelFull: '日本櫻花', year: 2027, emoji: '🌸' },
  ajisai: { label: '繡球花', labelFull: '日本繡球花', year: 2026, emoji: '💠' },
  koyo:   { label: '楓葉', labelFull: '日本楓葉', year: 2026, emoji: '🍁' },
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

// 景點清單（依縣市）
const SPOTS_BY_FLOWER = {
  sakura: loadJSON('data/spots/sakura.json'),
  ajisai: loadJSON('data/spots/ajisai.json'),
  koyo:   loadJSON('data/spots/koyo.json'),
};

// 打平成陣列，保留 pref 資訊
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

// 同縣市最多 4 個其他景點（排除自己），回傳完整 spot 物件
function siblingsOf(flower, pref, selfName) {
  const all = SPOTS_BY_FLOWER[flower][pref] || [];
  return all
    .filter(s => s.name !== selfName)
    .slice(0, 4);
}

function pad(n) { return String(n).padStart(3, '0'); }

function esc(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── HTML 生成 ──

function genHtml({ id, name, pref, address, flower, flowerInfo, idMap }) {
  const fc       = FORECASTS[flower]?.[pref] || {};
  const prefName = fc.name || pref;
  const range    = fc.forecastRange || '';

  // Title: 景點名 | 年份 花卉種類 賞花預測 | 縣市 | Junlando
  const title = `${name} | ${flowerInfo.year} ${prefName}${flowerInfo.label}預測 | Junlando`;

  // Description: 含縣市花期
  const descRange = range && range !== '未公布' ? `，預計花期 ${range}` : '';
  const desc = `${flowerInfo.year}年${prefName}${name}的${flowerInfo.labelFull}賞花預測${descRange}。提供即時花況、景點資訊與交通方式。`;

  const canonical = `${SITE_ROOT}/spot/${flower}/${id}.html`;
  const prefUrl   = `${SITE_ROOT}/prefecture.html?ken=${pref}&flower=${flower}`;
  const homeUrl   = `${SITE_ROOT}/index.html?flower=${flower}`;

  // JSON-LD: Place
  const jsonldPlace = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    "name": name,
    "description": desc,
    "url": canonical,
    "address": {
      "@type": "PostalAddress",
      "addressRegion": prefName,
      "addressCountry": "JP"
    },
    ...(address ? { "hasMap": `https://maps.google.com/?q=${encodeURIComponent(name)}` } : {})
  });

  // JSON-LD: BreadcrumbList
  const jsonldBreadcrumb = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "花卉預測", "item": homeUrl },
      { "@type": "ListItem", "position": 2, "name": prefName, "item": prefUrl },
      { "@type": "ListItem", "position": 3, "name": name, "item": canonical },
    ]
  });

  // 同縣市其他景點
  const siblings = siblingsOf(flower, pref, name);
  const siblingsHtml = siblings.length ? `
<section class="siblings-section">
  <div class="section-heading">更多 ${esc(prefName)} ${flowerInfo.label}景點</div>
  ${siblings.map(s => {
    const sid = idMap[flower]?.[s.name];
    const href = sid ? `../../spot/${flower}/${sid}.html` : `../../spot.html?flower=${flower}&spot=${encodeURIComponent(s.name)}&pref=${pref}`;
    return `<a class="spot-card" href="${href}" data-track="click_siblings" data-track-params='${JSON.stringify({spot: s.name, pref, flower})}'>
    <div class="spot-info">
      <div class="spot-name">${esc(s.name)}</div>
      ${s.address ? `<div class="spot-address">📍 ${esc(s.address)}</div>` : ''}
      ${s.period ? `<div class="spot-period-row">預估賞花期：<span>${esc(s.period)}</span></div>` : ''}
    </div>
    <div class="spot-arrow">›</div>
  </a>`;
  }).join('\n  ')}
</section>` : '';

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <meta property="og:title" content="${esc(name)} | ${flowerInfo.year} ${esc(prefName)}${flowerInfo.label}預測" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonical}" />
  <link rel="canonical" href="${canonical}" />
  <link rel="icon" href="/favicon.ico" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../../spot.css" />
  <style>
    :root { --active: #7c5cbf; --active-light: #f0eafb; }
    .updated-date { font-size: 11px; color: var(--text-sub); margin-top: 4px; }
  </style>
  <script type="application/ld+json">${jsonldPlace}</script>
  <script type="application/ld+json">${jsonldBreadcrumb}</script>
  <script>
    window.__SPOT = { name: ${JSON.stringify(name)}, flower: ${JSON.stringify(flower)}, pref: ${JSON.stringify(pref)} };
    window.__BASE = '../../';
    window.__SIBLINGS_HTML = ${JSON.stringify(siblingsHtml)};
    window.__BUILD_DATE = '${BUILD_DATE}';
  </script>
</head>
<body>

<header>
  <div class="header-inner">
    <a class="logo" href="../../index.html">
      <img src="/favicon.ico" style="width:32px;height:32px;border-radius:8px;display:block" alt="Junlando" />
      Junlando
    </a>
    <nav class="header-links">
      <a href="../../index.html">花卉預測</a>
      <a href="https://community.junlando.com" target="_blank" rel="noopener" data-track="click_nav" data-track-params='{"label":"forum"}'>旅遊論壇</a>
      <a href="/coupon/" target="_blank" rel="noopener" data-track="click_nav" data-track-params='{"label":"coupon"}'>優惠券</a>
    </nav>
  </div>
</header>

<nav class="breadcrumb-bar">
  <div class="breadcrumb-inner" id="breadcrumb">
    <a href="../../index.html?flower=${flower}">花卉預測</a>
    <span class="breadcrumb-sep">›</span>
    <a href="../../prefecture.html?ken=${pref}&flower=${flower}">${esc(prefName)}</a>
    <span class="breadcrumb-sep">›</span>
    <span class="breadcrumb-current">${esc(name)}</span>
  </div>
</nav>

<div id="spotHeader"></div>

<div class="hero-img-wrap" id="heroWrap">
  <div class="hero-placeholder" id="heroPlaceholder">${flowerInfo.emoji}</div>
</div>

<main class="main">
  <h1 style="display:none">${esc(name)} ${flowerInfo.year} ${esc(prefName)}${flowerInfo.label}預測</h1>
  <div id="app" class="loading">載入中…</div>
  <div id="siblings-mount"></div>
</main>

<footer>
  <p>© 2026 Junlando | <a href="../../">首頁</a> · <a href="../../index.html">花卉預測</a></p>
</footer>

<script src="../../spot.js"></script>
<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-analytics.js";
  import { initTracking } from "../../analytics-events.js";
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
  // 注入同縣市景點 + 最後更新日期
  document.addEventListener('DOMContentLoaded', () => {
    const mount = document.getElementById('siblings-mount');
    if (mount && window.__SIBLINGS_HTML) mount.innerHTML = window.__SIBLINGS_HTML;
    // 在 app 下方加更新日期
    const app = document.getElementById('app');
    if (app) {
      const obs = new MutationObserver(() => {
        if (!app.classList.contains('loading') && !document.querySelector('.updated-date')) {
          const d = document.createElement('p');
          d.className = 'updated-date';
          d.textContent = '資料更新日期：' + window.__BUILD_DATE;
          app.appendChild(d);
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

function genSitemap(allPages) {
  const today = BUILD_DATE;
  const urls = allPages.map(({ url, flower }) => {
    // 花季期間 daily，非花季 weekly
    const changefreq = 'weekly';
    return `  <url>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>0.7</priority>
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_ROOT}/index.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
${urls.join('\n')}
</urlset>`;
}

// ── 主程式 ──

const idMap   = {};   // { flower: { name: id } }  ← 反查用
const rawMap  = {};   // { flower: { id: {name,pref} } }  ← 輸出用
const mapping = [];
const allPages = [];

// 第一輪：建立 ID 對照
for (const [flower, flowerInfo] of Object.entries(FLOWERS)) {
  const spots = flattenSpots(SPOTS_BY_FLOWER[flower]);
  idMap[flower]  = {};
  rawMap[flower] = {};
  spots.forEach((spot, i) => {
    const id = pad(i + 1);
    idMap[flower][spot.name] = id;
    rawMap[flower][id] = { name: spot.name, pref: spot.pref };
  });
}

// 第二輪：生成 HTML（需要 idMap 做同縣市內鏈）
for (const [flower, flowerInfo] of Object.entries(FLOWERS)) {
  const spots  = flattenSpots(SPOTS_BY_FLOWER[flower]);
  const outDir = path.join(BASE_DIR, 'spot', flower);
  fs.mkdirSync(outDir, { recursive: true });

  spots.forEach((spot, i) => {
    const id  = pad(i + 1);
    const html = genHtml({ id, name: spot.name, pref: spot.pref, address: spot.address, flower, flowerInfo, idMap });
    fs.writeFileSync(path.join(outDir, `${id}.html`), html, 'utf8');
    mapping.push({ flower, id, name: spot.name, pref: spot.pref });
    allPages.push({ url: `${SITE_ROOT}/spot/${flower}/${id}.html`, flower });
  });

  console.log(`✅ ${flower}: ${spots.length} 個景點 → spot/${flower}/`);
}

// 寫 ID 對照 JSON
fs.writeFileSync(path.join(BASE_DIR, 'data', 'spot-id-map.json'), JSON.stringify(rawMap, null, 2), 'utf8');
console.log('✅ data/spot-id-map.json');

// 寫 Markdown 對照表
let md = `# 景點 ID 對照表\n生成日期：${BUILD_DATE}\n\n`;
for (const flower of ['sakura', 'ajisai', 'koyo']) {
  md += `## ${FLOWERS[flower].labelFull}（${flower}）\n\n| ID | 景點名稱 | 縣市 |\n|---|---|---|\n`;
  mapping.filter(r => r.flower === flower).forEach(r => {
    md += `| ${r.id} | ${r.name} | ${r.pref} |\n`;
  });
  md += '\n';
}
fs.writeFileSync(path.join(BASE_DIR, 'spot-id-map.md'), md, 'utf8');
console.log('✅ spot-id-map.md');

// 寫 Sitemap
fs.writeFileSync(path.join(BASE_DIR, 'sitemap.xml'), genSitemap(allPages), 'utf8');
console.log('✅ sitemap.xml');

console.log(`\n📦 總計：${mapping.length} 個景點頁面`);
console.log(`📅 Build 日期：${BUILD_DATE}`);
