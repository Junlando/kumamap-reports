/**
 * build-prefecture.js
 * 為每個花種 × 都道府縣生成靜態 HTML，供 SEO 使用。
 * 輸出目錄：prefecture/sakura/, prefecture/ajisai/, prefecture/koyo/
 * 執行方式：node build-prefecture.js
 */

const fs   = require('fs');
const path = require('path');

const BASE_DIR   = __dirname;
const BUILD_DATE = new Date().toISOString().slice(0, 10);
const SITE_ROOT  = 'https://junlando.com/blossom';

const FLOWERS = {
  sakura: { label: '櫻花',  labelFull: '日本櫻花',  year: 2027, emoji: '🌸', color: '#d46b8a', light: '#fff0f5' },
  ajisai: { label: '繡球花', labelFull: '日本繡球花', year: 2026, emoji: '💠', color: '#7c5cbf', light: '#f0eafb' },
  koyo:   { label: '紅葉',  labelFull: '日本楓葉',  year: 2026, emoji: '🍁', color: '#d4570a', light: '#fff0e6' },
};

function loadJSON(rel) {
  return JSON.parse(fs.readFileSync(path.join(BASE_DIR, rel), 'utf8'));
}

const FORECASTS = {
  sakura: loadJSON('data/forecast/sakura-2027.json').prefectures,
  ajisai: loadJSON('data/forecast/ajisai-2026.json').prefectures,
  koyo:   loadJSON('data/forecast/koyo-2026.json').prefectures,
};

function esc(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function loadPrefDescZh(flower) {
  const p = path.join(BASE_DIR, `data/prefecture/detail-${flower}.json`);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {};
}

function genHtml({ ken, flower, flowerInfo, fc, prefDescZh }) {
  const prefName    = fc.name;
  const range       = fc.forecastRange || '';
  const canonical   = `${SITE_ROOT}/prefecture/${flower}/${ken}.html`;
  const homeUrl     = `${SITE_ROOT}/index.html?flower=${flower}`;

  const prefDesc = prefDescZh?.[ken] || {};

  const isKoyo = flower === 'koyo';
  const titleSuffix = isKoyo ? `${prefName}楓葉景點` : `${prefName}${flowerInfo.label}景點`;
  const title = `${titleSuffix} ${flowerInfo.year} | Junlando`;

  const descRange = range && range !== '未公布' ? `，預測花期 ${range}` : '';
  const desc = `${flowerInfo.year}年${prefName}${flowerInfo.label}賞花資訊${descRange}。提供開花預測時程、推薦景點與交通資訊。`;

  const jsonldBreadcrumb = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "花卉預測", "item": homeUrl },
      { "@type": "ListItem", "position": 2, "name": prefName,   "item": canonical },
    ]
  });

  // JS 段落：把 prefecture.html 裡的 <script> 整段複製，但做三處修改：
  // 1. getParams() 改成回傳硬編碼值
  // 2. fetch('data/...') → fetch('../../data/...')
  // 3. href 中的相對路徑補上 ../../
  // 4. spotUrl 回傳路徑補上 ../../

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <meta property="og:title" content="${esc(titleSuffix)} ${flowerInfo.year}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonical}" />
  <link rel="canonical" href="${canonical}" />
  <link rel="icon" href="/favicon.ico" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet" />
  <script type="application/ld+json">${jsonldBreadcrumb}</script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --active: ${flowerInfo.color};
      --active-light: ${flowerInfo.light};
      --gray: #f5f6f8;
      --border: #e8e9ec;
      --text: #1a1a2e;
      --text-sub: #6b7280;
      --radius: 12px;
    }
    body { font-family: 'Inter','Noto Sans JP',-apple-system,sans-serif; background:#fafbfc; color:var(--text); line-height:1.6; min-height:100vh; }
    header { background:white; border-bottom:1px solid var(--border); position:sticky; top:0; z-index:100; }
    .header-inner { max-width:900px; margin:0 auto; padding:0 20px; height:58px; display:flex; align-items:center; gap:16px; }
    .logo { display:flex; align-items:center; gap:8px; text-decoration:none; color:var(--text); font-weight:700; font-size:18px; }
    .back-btn { margin-left:auto; display:flex; align-items:center; gap:6px; padding:7px 14px; border-radius:8px; border:1px solid var(--border); background:white; font-size:13px; font-weight:500; color:var(--text-sub); cursor:pointer; text-decoration:none; transition:all 0.15s; }
    .back-btn:hover { background:var(--gray); color:var(--text); }
    .breadcrumb-bar { background:white; border-bottom:1px solid var(--border); }
    .breadcrumb-inner { max-width:900px; margin:0 auto; padding:9px 20px; font-size:13px; color:var(--text-sub); }
    .main { max-width:900px; margin:0 auto; padding:28px 20px 60px; }
    .timeline-card { background:white; border:1px solid var(--border); border-radius:var(--radius); margin-bottom:24px; overflow:hidden; }
    .card-header { padding:16px 20px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:10px; }
    .card-header h2 { font-size:15px; font-weight:700; }
    .timeline-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:0; }
    .timeline-item { padding:20px 16px; text-align:center; border-right:1px solid var(--border); position:relative; }
    .timeline-item:last-child { border-right:none; }
    .timeline-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:var(--text-sub); margin-bottom:6px; }
    .timeline-date { font-size:22px; font-weight:700; line-height:1.2; }
    .timeline-date-sub { font-size:12px; color:var(--text-sub); margin-top:4px; }
    .timeline-badge { display:inline-block; margin-top:8px; padding:3px 10px; border-radius:12px; font-size:11px; font-weight:700; }
    .progress-wrap { padding:16px 20px 20px; border-top:1px solid var(--border); }
    .progress-label { display:flex; justify-content:space-between; font-size:12px; color:var(--text-sub); margin-bottom:8px; }
    .progress-bar { height:8px; background:var(--gray); border-radius:99px; overflow:hidden; }
    .progress-fill { height:100%; border-radius:99px; background:var(--active); transition:width 0.6s ease; }
    .status-banner { display:flex; align-items:flex-start; gap:10px; padding:16px 20px; border-radius:var(--radius); margin-bottom:16px; font-size:14px; }
    .status-banner .icon { font-size:20px; flex-shrink:0; line-height:1.4; }
    .status-banner.upcoming { background:#e8f4fd; }
    .status-banner.blooming { background:#e8f5e9; }
    .status-banner.peak { background:#fff3e0; }
    .status-banner.ended { background:#f5f5f5; }
    .status-banner.none { background:#f5f5f5; }
    .pref-intro { margin-bottom:8px; }
    .pref-intro-tagline { font-size:25px; font-weight:800; color:var(--text); padding-bottom:10px; border-bottom:2px solid var(--border); margin-top:40px; margin-bottom:16px; line-height:1.4; }
    .pref-intro-desc { font-size:15px; color:var(--text-sub); line-height:1.8; margin-bottom:14px; }
    .spots-title { font-size:13px; font-weight:700; color:var(--text-sub); text-transform:uppercase; letter-spacing:0.6px; margin:24px 0 10px; }
    .spot-card { display:flex; align-items:center; background:white; border:1px solid var(--border); border-radius:var(--radius); padding:14px 16px; margin-bottom:10px; text-decoration:none; color:var(--text); transition:all 0.15s; }
    .spot-card:hover { border-color:var(--active); box-shadow:0 2px 8px rgba(0,0,0,0.06); }
    .spot-info { flex:1; }
    .spot-name { font-size:15px; font-weight:600; }
    .spot-address { font-size:12px; color:var(--text-sub); margin-top:3px; }
    .spot-period-row { font-size:12px; color:var(--text-sub); margin-top:3px; }
    .spot-period-row span { color:var(--active); font-weight:600; }
    .spot-arrow { font-size:20px; color:var(--text-sub); margin-left:8px; }
    .nearby-title { font-size:13px; font-weight:700; color:var(--text-sub); text-transform:uppercase; letter-spacing:0.6px; margin:28px 0 10px; }
    .nearby-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:10px; }
    .nearby-card { display:block; background:white; border:1px solid var(--border); border-radius:var(--radius); padding:14px; text-decoration:none; color:var(--text); transition:all 0.15s; }
    .nearby-card:hover { border-color:var(--active); }
    .nearby-name { font-size:14px; font-weight:600; }
    .nearby-date { font-size:11px; color:var(--text-sub); margin-top:4px; }
    .error-msg { text-align:center; padding:40px 20px; }
    .loading { color:var(--text-sub); font-size:14px; padding:40px 0; text-align:center; }
  </style>
</head>
<body>

<header>
  <div class="header-inner">
    <a class="logo" href="../../index.html">
      <img src="/favicon.ico" style="width:32px;height:32px;border-radius:8px;display:block" alt="Junlando" />
      Junlando
    </a>
    <a class="back-btn" href="../../index.html?flower=${flower}">← 花卉預測</a>
  </div>
</header>

<div class="breadcrumb-bar">
  <div class="breadcrumb-inner">
    <a href="../../index.html?flower=${flower}" style="color:var(--text-sub);text-decoration:none">花卉預測</a>
    <span style="margin:0 6px">›</span>
    <span>${esc(prefName)}</span>
  </div>
</div>

<main class="main">
  <h1 style="display:none">${esc(prefName)} ${esc(flowerInfo.label)} ${flowerInfo.year} 賞花景點</h1>
  ${prefDesc.tagline || prefDesc.desc ? `
  <div class="pref-intro">
    ${prefDesc.tagline ? `<div class="pref-intro-tagline">${esc(prefDesc.tagline)}</div>` : ''}
    ${prefDesc.desc    ? prefDesc.desc.split('\n\n').map(p => `<p class="pref-intro-desc">${esc(p).replace(/\n/g,'<br>')}</p>`).join('') : ''}
  </div>` : ''}
  <div id="app" class="loading">載入資料中…</div>
</main>

<footer>
  <p>© 2026 Junlando | <a href="../../">首頁</a> · <a href="../../index.html">花卉預測</a> · <a href="https://community.junlando.com" target="_blank" rel="noopener">旅遊論壇</a></p>
  <p style="margin-top:6px">預測資料僅供參考，實際花況受氣候影響可能有所差異。</p>
</footer>

<script>
const TODAY = new Date();

let _spotIdCache = null;
async function getSpotIdMap() {
  if (_spotIdCache) return _spotIdCache;
  try {
    const raw = await fetch('../../data/spot-id-map.json').then(r => r.json());
    _spotIdCache = {};
    for (const [flower, entries] of Object.entries(raw)) {
      _spotIdCache[flower] = {};
      for (const [id, info] of Object.entries(entries)) {
        _spotIdCache[flower][info.name] = id;
      }
    }
  } catch(e) { _spotIdCache = {}; }
  return _spotIdCache;
}
function spotUrl(flower, name) {
  const id = _spotIdCache?.[flower]?.[name];
  return id ? \`../../spot/\${flower}/\${id}.html\` : \`../../spot.html?flower=\${flower}&spot=\${encodeURIComponent(name)}\`;
}

const FLOWERS = {
  ajisai: { label: '繡球花', emoji: '💠', color: '#7c5cbf', light: '#f0eafb' },
  koyo:   { label: '紅葉',   emoji: '🍁', color: '#d4570a', light: '#fff0e6' },
  sakura: { label: '桜',     emoji: '🌸', color: '#d46b8a', light: '#fff0f5' },
};

function getParams() {
  return { ken: ${JSON.stringify(ken)}, flower: ${JSON.stringify(flower)} };
}

function getStatus(bloom, peak, end) {
  if (!bloom) return 'none';
  const b = new Date(bloom), p = new Date(peak), e = new Date(end);
  if (TODAY < b) return 'upcoming';
  if (TODAY >= b && TODAY < p) return 'blooming';
  if (TODAY >= p && TODAY <= e) return 'peak';
  return 'ended';
}

const FLOWER_YEAR = { ajisai: 2026, koyo: 2026, sakura: 2027 };

function isFresh(dateStr) {
  if (!dateStr) return false;
  const diff = (TODAY - new Date(dateStr)) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 14;
}

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return \`\${dt.getFullYear()}/\${dt.getMonth()+1}/\${dt.getDate()}\`;
}
function fmtShort(d, flower) {
  if (!d) return '—';
  const dt = new Date(d);
  if (flower === 'koyo') {
    const day = dt.getDate();
    const jun = day <= 10 ? '上旬' : day <= 20 ? '中旬' : '下旬';
    return \`\${dt.getMonth()+1}月\${jun}\`;
  }
  return \`\${dt.getMonth()+1}月\${dt.getDate()}日\`;
}
function fmtMD(dateStr) {
  if (!dateStr) return '—';
  return dateStr.slice(5).replace('-', '/');
}
function daysUntil(d) {
  if (!d) return null;
  return Math.round((new Date(d) - TODAY) / (1000 * 60 * 60 * 24));
}
function progressPct(bloom, end) {
  if (!bloom || !end) return 0;
  const b = new Date(bloom), e = new Date(end);
  if (TODAY < b) return 0;
  if (TODAY > e) return 100;
  return Math.round((TODAY - b) / (e - b) * 100);
}

function statusBanner(fc, liveData, flower) {
  const s = liveData ? liveData.status : getStatus(fc.bloom, fc.peak, fc.end);
  const f = FLOWERS[flower];
  const isLive = !!liveData;
  const msgs = {
    upcoming: () => { const d = daysUntil(fc.bloom); return d > 0 ? \`預計 <strong>\${fmtShort(fc.bloom, flower)}</strong> \${flower === 'koyo' ? '開始轉紅' : '開花'}，還有 \${d} 天\` : flower === 'koyo' ? '即將開始轉紅' : '即將開花'; },
    blooming: () => \`目前\${flower === 'koyo' ? '轉紅中' : '開花中'}\${liveData?.pct != null ? \`，開花率約 \${liveData.pct}%\` : ''}，預計 <strong>\${fmtShort(fc.peak, flower)}</strong> \${flower === 'koyo' ? '全紅' : '滿開'}\`,
    peak:     () => \`現在是最佳觀賞時期！\${liveData?.pct != null ? \`開花率 \${liveData.pct}%，\` : ''}預計至 <strong>\${fmtShort(fc.end, flower)}</strong>\`,
    ended:    () => \`本季賞花期已於 \${fmtShort(fc.end, flower)} 結束\`,
    none:     () => '此縣市暫無對應花卉預測資料'
  };
  const icons = { upcoming:'📅', blooming: f.emoji, peak:'🔥', ended:'🍃', none:'ℹ️' };
  return \`
    <div class="status-banner \${s}">
      <span class="icon">\${icons[s]}</span>
      <span class="msg">\${(msgs[s] || msgs.none)()}
        \${isLive ? '<span style="font-size:11px;opacity:0.7;margin-left:6px">（實況）</span>' : ''}
      </span>
    </div>\`;
}

function timelineCard(fc, flower) {
  const f = FLOWERS[flower];
  const s = getStatus(fc.bloom, fc.peak, fc.end);
  const pct = progressPct(fc.bloom, fc.end);
  const isKoyo = flower === 'koyo';
  const badgeMap = {
    upcoming: { bg:'#e8f4fd', color:'#1976d2', txt: isKoyo ? '賞楓前' : '開花前' },
    blooming: { bg:'#e8f5e9', color:'#2e7d32', txt: isKoyo ? '轉紅中' : '開花中' },
    peak:     { bg:'#fff3e0', color:'#ef6c00', txt: isKoyo ? '最紅🔥' : '滿開🔥' },
    ended:    { bg:'#f5f5f5', color:'#757575', txt:'已結束' },
    none:     { bg:'#f5f5f5', color:'#aaa',    txt:'—' },
  }[s];
  return \`
    <div class="timeline-card">
      <div class="card-header">
        <h2>\${fc.name} \${f.label}\${isKoyo ? '賞楓日程' : '開花日程'}</h2>
      </div>
      <div class="timeline-grid">
        <div class="timeline-item">
          <div class="timeline-label">\${isKoyo ? '轉紅開始' : '開花日'}</div>
          <div class="timeline-date">\${fc.bloom ? fmtShort(fc.bloom, flower) : '—'}</div>
        </div>
        <div class="timeline-item">
          <div class="timeline-label">\${isKoyo ? '全紅高峰' : '滿開日'}</div>
          <div class="timeline-date">\${fc.peak ? fmtShort(fc.peak, flower) : '—'}</div>
          <div class="timeline-badge" style="background:\${badgeMap.bg};color:\${badgeMap.color}">\${badgeMap.txt}</div>
        </div>
        <div class="timeline-item">
          <div class="timeline-label">\${isKoyo ? '賞楓結束' : '結束日'}</div>
          <div class="timeline-date">\${fc.end ? fmtShort(fc.end, flower) : '—'}</div>
        </div>
      </div>
      \${fc.bloom ? \`
      <div class="progress-wrap">
        <div class="progress-label"><span>花期進度</span><span>\${pct}%</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:\${pct}%"></div></div>
      </div>\` : ''}
      \${fc.forecastRange || fc.lastYearDate ? \`
      <div style="padding:10px 20px;border-top:1px solid var(--border);display:flex;gap:20px;flex-wrap:wrap">
        \${fc.forecastRange ? \`<div style="font-size:12px;color:var(--text-sub)">📊 今年預測區間 <strong style="color:var(--text)">\${fc.forecastRange}</strong></div>\` : ''}
        \${fc.lastYearDate  ? \`<div style="font-size:12px;color:var(--text-sub)">🗓 去年開花日 <strong style="color:var(--text)">\${fc.lastYearDate}</strong></div>\` : ''}
      </div>\` : ''}
    </div>\`;
}

function trendSection(updates, ken, flower) {
  if (!updates || updates.length < 2) return '';
  const f = FLOWERS[flower];
  const STATUS_COLOR = { peak:'#ffa726', blooming:'#66bb6a', upcoming:'#42a5f5', ended:'#bdbdbd', none:'#eee' };
  const STATUS_LABEL = { upcoming:'開花前', blooming:'開花中', peak:'滿開', ended:'已結束', none:'—' };
  const rows = updates.map(u => {
    const d = u.data[ken];
    const s = d?.status || 'none';
    return \`
      <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border)">
        <div style="font-size:12px;color:var(--text-sub);width:44px;flex-shrink:0">\${fmtMD(u.date)}</div>
        <div style="width:10px;height:10px;border-radius:50%;background:\${STATUS_COLOR[s]};flex-shrink:0"></div>
        <div style="font-size:13px;font-weight:600">\${STATUS_LABEL[s]}</div>
        \${d?.pct != null ? \`<div style="font-size:12px;color:var(--text-sub)">\${d.pct}%</div>\` : ''}
        \${d?.note ? \`<div style="font-size:12px;color:var(--text-sub);margin-left:auto">\${d.note}</div>\` : ''}
      </div>\`;
  }).reverse().join('');
  return \`
    <div class="timeline-card" style="margin-bottom:20px">
      <div class="card-header">
        <h2>近期花況記錄</h2>
        <span style="font-size:12px;color:var(--text-sub)">最新在上</span>
      </div>
      <div style="padding:0 20px 4px">\${rows}</div>
    </div>\`;
}

function spotsSection(spots, flower, ken) {
  const f = FLOWERS[flower];
  if (!spots || spots.length === 0) return '';
  const html = spots.map(s => \`
    <a class="spot-card" href="\${spotUrl(flower, s.name)}" data-track="click_pref_card" data-track-params='\${JSON.stringify({spot: s.name, pref: ken, flower})}'>
      <div class="spot-info">
        <div class="spot-name">\${s.name}</div>
        <div class="spot-address">📍 \${s.address}</div>
        \${s.period ? \`<div class="spot-period-row">預估賞花期：<span>\${s.period}</span></div>\` : ''}
      </div>
      <div class="spot-arrow">›</div>
    </a>\`).join('');
  return \`<div class="spots-title">推薦賞花景點</div>\${html}\`;
}

function nearbySection(forecastPrefs, currentId, latestData, flower) {
  const others = Object.entries(forecastPrefs).filter(([id]) => id !== currentId).slice(0, 8);
  if (!others.length) return '';
  const STATUS_LABEL = { upcoming:'開花前', blooming:'開花中', peak:'滿開', ended:'已結束', none:'—' };
  const cards = others.map(([id, fc]) => {
    const liveS = latestData?.data?.[id];
    const s = liveS ? liveS.status : getStatus(fc.bloom, fc.peak, fc.end);
    return \`
      <a class="nearby-card" href="../\${flower}/\${id}.html">
        <div class="nearby-name">\${fc.name}</div>
        <div class="nearby-date">\${fc.bloom ? fmtShort(fc.bloom, flower) + ' 開花' : '—'}</div>
        <div style="font-size:11px;margin-top:3px;color:var(--text-sub)">\${STATUS_LABEL[s]}</div>
      </a>\`;
  }).join('');
  return \`<div class="nearby-title">其他都道府縣預測</div><div class="nearby-grid">\${cards}</div>\`;
}

async function render() {
  const { ken, flower } = getParams();
  const f = FLOWERS[flower] || FLOWERS.ajisai;
  const year = FLOWER_YEAR[flower] || 2026;
  const app = document.getElementById('app');

  document.documentElement.style.setProperty('--active', f.color);
  document.documentElement.style.setProperty('--active-light', f.light);

  try {
    const [forecast, statusRes, spotsData] = await Promise.all([
      fetch(\`../../data/forecast/\${flower}-\${year}.json\`).then(r => r.json()),
      fetch(\`../../data/status/\${flower}-\${year}.json\`).then(r => r.json()).catch(() => ({ updates: [] })),
      fetch(\`../../data/spots/\${flower}.json\`).then(r => r.json()).catch(() => ({})),
      getSpotIdMap(),
    ]);

    const fc = forecast.prefectures[ken];
    if (!fc) {
      app.classList.remove('loading');
      app.innerHTML = \`<div class="error-msg"><h2>找不到「\${ken}」的資料</h2>
        <p style="margin-top:8px"><a href="../../index.html" style="color:var(--active)">← 回到花卉預測首頁</a></p></div>\`;
      return;
    }

    const updates = statusRes.updates || [];
    const latest = updates.length > 0 ? updates[updates.length - 1] : null;
    const isLiveMode = latest && isFresh(latest.date);
    const liveData = isLiveMode ? latest.data?.[ken] : null;

    app.classList.remove('loading');
    app.innerHTML = \`
      \${statusBanner(fc, liveData, flower)}
      \${timelineCard(fc, flower)}
      \${isLiveMode ? trendSection(updates, ken, flower) : ''}
      \${spotsSection(spotsData[ken] || [], flower, ken)}
      \${nearbySection(forecast.prefectures, ken, isLiveMode ? latest : null, flower)}
    \`;
  } catch (e) {
    console.error(e);
    app.classList.remove('loading');
    app.innerHTML = \`<div class="error-msg"><h2>載入失敗，請稍後再試</h2></div>\`;
  }
}

render();
</script>
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
</body>
</html>`;
}

// ── 主程式 ──

const allPrefPages = [];

for (const [flower, flowerInfo] of Object.entries(FLOWERS)) {
  const forecast   = FORECASTS[flower];
  const prefDescZh = loadPrefDescZh(flower);
  const outDir     = path.join(BASE_DIR, 'prefecture', flower);
  fs.mkdirSync(outDir, { recursive: true });

  let count = 0;
  for (const [ken, fc] of Object.entries(forecast)) {
    const html = genHtml({ ken, flower, flowerInfo, fc, prefDescZh });
    fs.writeFileSync(path.join(outDir, `${ken}.html`), html, 'utf8');
    allPrefPages.push({ url: `${SITE_ROOT}/prefecture/${flower}/${ken}.html` });
    count++;
  }
  console.log(`✅ ${flower}: ${count} 個縣市 → prefecture/${flower}/`);
}

// ── 更新 Sitemap ──

const existingSitemap = fs.readFileSync(path.join(BASE_DIR, 'sitemap.xml'), 'utf8');
const newEntries = allPrefPages.map(({ url }) => `  <url>
    <loc>${url}</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n');

const updatedSitemap = existingSitemap.replace('</urlset>', `${newEntries}\n</urlset>`);
fs.writeFileSync(path.join(BASE_DIR, 'sitemap.xml'), updatedSitemap, 'utf8');
console.log(`✅ sitemap.xml 新增 ${allPrefPages.length} 個縣市頁面`);
console.log(`\n📦 總計：${allPrefPages.length} 個縣市頁面`);
console.log(`📅 Build 日期：${BUILD_DATE}`);
