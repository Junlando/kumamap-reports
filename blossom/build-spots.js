/**
 * build-spots.js
 * 為每個景點生成獨立靜態 HTML，供 SEO 長尾關鍵字使用。
 * 輸出目錄：spot/sakura/, spot/ajisai/, spot/koyo/
 * 執行方式：node build-spots.js
 */

const fs   = require('fs');
const path = require('path');

const BASE_DIR = __dirname;

const FLOWERS = {
  sakura: { label: '日本櫻花', year: 2027, emoji: '🌸' },
  ajisai: { label: '日本繡球花', year: 2026, emoji: '💠' },
  koyo:   { label: '日本楓葉', year: 2026, emoji: '🍁' },
};

// 讀取各花種景點 JSON（依縣市分組）
function loadSpots(flower) {
  const filePath = path.join(BASE_DIR, 'data', 'spots', `${flower}.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// 將景點打平成陣列，保留 pref 資訊
function flattenSpots(spotsObj) {
  const result = [];
  for (const [pref, spots] of Object.entries(spotsObj)) {
    for (const spot of spots) {
      // 取中文名（有些 ajisai 景點名含括號補充，取括號前的主名）
      const name = spot.name ? spot.name.trim() : '';
      if (name) result.push({ name, pref, address: spot.address || '' });
    }
  }
  return result;
}

function pad(n) { return String(n).padStart(3, '0'); }

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function genHtml({ id, name, pref, flower, flowerInfo }) {
  const title    = `${name} | ${flowerInfo.year} ${flowerInfo.label}預測 | Junlando`;
  const desc     = `${flowerInfo.year}年${name}（${pref}）的${flowerInfo.label}開花預測，花期日程與景點資訊。`;
  const canonical = `https://junlando.com/blossom/spot/${flower}/${id}.html`;

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(desc)}" />
  <meta property="og:title" content="${escapeHtml(name)} | ${flowerInfo.year} ${flowerInfo.label}預測" />
  <meta property="og:description" content="${escapeHtml(desc)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonical}" />
  <link rel="canonical" href="${canonical}" />
  <link rel="icon" href="/favicon.ico" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../../spot.css" />
  <script>
    window.__SPOT = { name: ${JSON.stringify(name)}, flower: ${JSON.stringify(flower)}, pref: ${JSON.stringify(pref)} };
    window.__BASE = '../../';
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
      <a href="https://community.junlando.com" target="_blank" rel="noopener">旅遊論壇</a>
      <a href="/coupon/" target="_blank" rel="noopener">優惠券</a>
    </nav>
  </div>
</header>

<nav class="breadcrumb-bar">
  <div class="breadcrumb-inner" id="breadcrumb">載入中…</div>
</nav>

<div class="hero-img-wrap" id="heroWrap">
  <div class="hero-placeholder" id="heroPlaceholder">${flowerInfo.emoji}</div>
</div>

<main class="main">
  <div id="app" class="loading">載入中…</div>
</main>

<footer>
  <p>© 2026 Junlando | <a href="../../">首頁</a> · <a href="../../index.html">花卉預測</a></p>
</footer>

<script src="../../spot.js"></script>
</body>
</html>`;
}

// ── 主程式 ──

const idMap   = {};   // { sakura: { '001': '上野公園', ... }, ... }
const mapping = [];   // for CSV output

for (const [flower, flowerInfo] of Object.entries(FLOWERS)) {
  const spotsObj = loadSpots(flower);
  const spots    = flattenSpots(spotsObj);
  const outDir   = path.join(BASE_DIR, 'spot', flower);

  fs.mkdirSync(outDir, { recursive: true });

  idMap[flower] = {};

  spots.forEach((spot, i) => {
    const id  = pad(i + 1);
    const html = genHtml({ id, name: spot.name, pref: spot.pref, flower, flowerInfo });

    fs.writeFileSync(path.join(outDir, `${id}.html`), html, 'utf8');
    idMap[flower][id] = { name: spot.name, pref: spot.pref };
    mapping.push({ flower, id, name: spot.name, pref: spot.pref });
  });

  console.log(`✅ ${flower}: ${spots.length} 個景點 → spot/${flower}/`);
}

// 寫入 ID 對照 JSON
fs.writeFileSync(
  path.join(BASE_DIR, 'data', 'spot-id-map.json'),
  JSON.stringify(idMap, null, 2),
  'utf8'
);
console.log('✅ data/spot-id-map.json 已更新');

// 輸出對照 Markdown 表格
let md = '# 景點 ID 對照表\n\n';
for (const flower of ['sakura', 'ajisai', 'koyo']) {
  const label = FLOWERS[flower].label;
  md += `## ${label}（${flower}）\n\n`;
  md += `| ID | 景點名稱 | 縣市 |\n|---|---|---|\n`;
  const rows = mapping.filter(r => r.flower === flower);
  for (const r of rows) {
    md += `| ${r.id} | ${r.name} | ${r.pref} |\n`;
  }
  md += '\n';
}

fs.writeFileSync(path.join(BASE_DIR, 'spot-id-map.md'), md, 'utf8');
console.log('✅ spot-id-map.md 已產生');
console.log(`\n總計：${mapping.length} 個景點頁面`);
