/**
 * build-index-ja.js
 * 生成日文花火首頁：hanabi/ja/index.html
 */

const fs   = require('fs');
const path = require('path');

const BASE_DIR  = __dirname;
const SITE_ROOT = 'https://junlando.com/blossom/hanabi';
const BUILD_DATE = new Date().toISOString().slice(0, 10);

const EVENTS = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'data/events.ja.json'), 'utf8'));

const DOW_JA = ['日','月','火','水','木','金','土'];
const MONTHS_JA = ['','1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

function esc(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function isLong(ev) {
  if (!ev.endDate) return false;
  return (new Date(ev.endDate+'T00:00:00') - new Date(ev.date+'T00:00:00')) / 86400000 > 7;
}

function fmtCard(ev) {
  const d = new Date(ev.date+'T00:00:00');
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const dow = DOW_JA[d.getDay()];
  if (isLong(ev)) {
    const e = new Date(ev.endDate+'T00:00:00');
    return `${m}/${day} 〜 ${e.getMonth()+1}/${e.getDate()}`;
  }
  if (ev.endDate) {
    const e = new Date(ev.endDate+'T00:00:00');
    return `${m}/${day}・${e.getDate()}（連続2日）`;
  }
  return `${m}月${day}日（${dow}）`;
}

// Group by month
const byMonth = {};
EVENTS.forEach(ev => {
  const m = ev.date.slice(0,7);
  if (!byMonth[m]) byMonth[m] = [];
  byMonth[m].push(ev);
});
Object.values(byMonth).forEach(arr => arr.sort((a,b) => a.date.localeCompare(b.date)));

const monthsArr = Object.keys(byMonth).sort();

// Get unique prefs
const prefSet = {};
EVENTS.forEach(ev => { if (!prefSet[ev.ken]) prefSet[ev.ken] = ev.location; });
const prefsSorted = Object.entries(prefSet).sort((a,b) => a[1].localeCompare(b[1], 'ja'));

// Build month sections
const monthSections = monthsArr.map(ym => {
  const [y, mStr] = ym.split('-');
  const mNum = parseInt(mStr);
  const label = `${y}年${MONTHS_JA[mNum]}`;
  const evts = byMonth[ym];

  const cards = evts.map(ev => {
    const longBadge = isLong(ev) ? `<span class="card-long-badge">長期開催</span>` : '';
    const noteHtml  = ev.note ? `<div class="card-subtitle">${esc(ev.note)}</div>` : '';
    return `
        <a class="event-card" href="../spot/ja/${esc(ev.id)}.html" data-pref="${ev.ken}">
          <div class="card-img-wrap">
            <img class="card-img" src="../images/${esc(ev.id)}/1.jpg" alt="${esc(ev.name)}" loading="lazy" onerror="this.closest('.card-img-wrap').style.background='#e8e9ec'" />
            ${longBadge}
          </div>
          <div class="card-body">
            <div class="card-date-row">
              <span class="card-date-chip">📅 ${esc(fmtCard(ev))}</span>
              <span class="card-pref-chip">📍 ${esc(ev.location)}</span>
            </div>
            <div class="card-name">${esc(ev.name)}</div>
            ${noteHtml}
            <div class="card-arrow">詳細を見る →</div>
          </div>
        </a>`;
  }).join('\n');

  return `
    <div class="month-section" data-month="${ym}">
      <div class="month-header">
        <span class="month-title">🎆 ${esc(label)}</span>
        <span class="month-count">${evts.length}件</span>
      </div>
      <div class="event-grid">
${cards}
      </div>
    </div>`;
}).join('\n');

const prefTabsHtml = `
    <button class="pref-tab active" data-pref="all">すべての都道府県</button>
${prefsSorted.map(([ken, loc]) => `    <button class="pref-tab" data-pref="${ken}">${esc(loc)}</button>`).join('\n')}`;

const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>2026年 日本花火大会 カレンダー｜全国50件・日程・アクセス完全ガイド｜Junlando</title>
  <meta name="description" content="2026年の日本花火大会カレンダー完全版。隅田川・大曲・長岡など全国50件の花火大会を掲載。日程・都道府県・アクセス情報を詳しく紹介。" />
  <meta property="og:title" content="2026年 日本花火大会 | Junlando" />
  <meta property="og:description" content="全国50件の花火大会情報。都道府県別に日程・会場・アクセスを掲載。" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${SITE_ROOT}/ja/" />
  <meta property="og:image" content="${SITE_ROOT}/images/001/1.jpg" />
  <link rel="canonical" href="${SITE_ROOT}/ja/" />
  <link rel="alternate" hreflang="zh-Hant" href="${SITE_ROOT}/" />
  <link rel="alternate" hreflang="en" href="${SITE_ROOT}/en/" />
  <link rel="alternate" hreflang="ja" href="${SITE_ROOT}/ja/" />
  <link rel="icon" href="../../../favicon.ico" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root { --hanabi:#e05a00; --hanabi-dark:#b84400; --hanabi-light:#fff4ee; --gray:#f5f6f8; --border:#e8e9ec; --text:#1a1a2e; --text-sub:#6b7280; --radius:12px; --active:#7c5cbf; }
    body { font-family:'Inter','Noto Sans JP',-apple-system,sans-serif; background:#fafbfc; color:var(--text); line-height:1.6; min-height:100vh; }

    header { background:white; border-bottom:1px solid var(--border); position:sticky; top:0; z-index:100; }
    .header-inner { max-width:1100px; margin:0 auto; padding:0 20px; height:58px; display:flex; align-items:center; gap:16px; }
    .logo { display:flex; align-items:center; gap:8px; text-decoration:none; color:var(--text); font-weight:700; font-size:18px; flex-shrink:0; }
    .header-links { margin-left:auto; display:flex; align-items:center; gap:4px; }
    .header-links a { padding:6px 12px; border-radius:8px; text-decoration:none; font-size:13px; color:var(--text-sub); font-weight:500; transition:background .15s,color .15s; }
    .header-links a:hover { background:var(--gray); color:var(--text); }

    .hanabi-hero { position:relative; overflow:hidden; background:#0a0a0a; min-height:200px; display:flex; align-items:center; }
    .hanabi-hero-bg { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:center top; opacity:0.88; display:block; }
    .hanabi-hero::after { content:''; position:absolute; inset:0; background:linear-gradient(to bottom,rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.4) 100%); pointer-events:none; }
    .hanabi-hero-inner { position:relative; z-index:1; max-width:700px; margin:0 auto; padding:24px 20px; text-align:center; width:100%; }
    .hanabi-hero-title { font-size:44px; font-weight:800; color:white; line-height:1.2; margin-bottom:6px; -webkit-text-stroke:6px white; position:relative; }
    .hanabi-hero-title::before { content:attr(data-text); position:absolute; inset:0; background:linear-gradient(to bottom,#ffaa00 0%,#dd2200 100%); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; -webkit-text-stroke:0px transparent; z-index:1; }
    .hanabi-hero-sub { font-size:16px; color:rgba(255,255,255,0.9); margin-bottom:16px; }
    .hanabi-stats { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }
    .hanabi-stat-pill { background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.2); border-radius:20px; padding:5px 14px; font-size:14px; font-weight:600; color:rgba(255,255,255,0.88); }

    .pref-filter-bar { background:var(--hanabi); padding:0; overflow:hidden; }
    .pref-filter-inner { max-width:1100px; margin:0 auto; display:flex; padding:0 12px; overflow-x:auto; scrollbar-width:none; }
    .pref-filter-inner::-webkit-scrollbar { display:none; }
    .pref-tab { padding:12px 16px; cursor:pointer; font-size:13px; font-weight:600; border:none; background:transparent; color:rgba(255,255,255,0.75); transition:color .15s,background .15s; position:relative; white-space:nowrap; }
    .pref-tab:hover { color:white; background:rgba(0,0,0,0.1); }
    .pref-tab.active { color:white; background:rgba(0,0,0,0.15); }
    .pref-tab.active::after { content:''; position:absolute; bottom:0; left:0; right:0; height:3px; background:rgba(255,255,255,0.9); border-radius:3px 3px 0 0; }

    .main { max-width:1100px; margin:0 auto; padding:28px 20px 60px; }
    .month-section { margin-bottom:48px; }
    .month-section.hidden { display:none; }
    .month-header { display:flex; align-items:baseline; justify-content:space-between; padding-bottom:12px; margin-bottom:20px; border-bottom:2px solid var(--border); }
    .month-title { font-size:22px; font-weight:800; color:var(--text); }
    .month-count { font-size:13px; color:var(--text-sub); }

    .event-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px; }
    .event-card { background:white; border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; text-decoration:none; color:inherit; display:flex; flex-direction:column; transition:box-shadow .18s,transform .18s; }
    .event-card:hover { box-shadow:0 4px 18px rgba(0,0,0,.1); transform:translateY(-2px); }
    .event-card.hidden { display:none; }
    .card-img-wrap { position:relative; aspect-ratio:16/9; overflow:hidden; background:var(--gray); }
    .card-img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .25s; }
    .event-card:hover .card-img { transform:scale(1.04); }
    .card-long-badge { position:absolute; top:10px; left:10px; background:#f59e0b; color:white; font-size:11px; font-weight:700; padding:3px 9px; border-radius:10px; }
    .card-body { padding:14px 16px; flex:1; display:flex; flex-direction:column; gap:4px; }
    .card-date-row { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:2px; }
    .card-date-chip { font-size:11px; font-weight:700; background:var(--hanabi-light); color:var(--hanabi-dark); padding:3px 9px; border-radius:10px; }
    .card-pref-chip { font-size:11px; font-weight:600; background:var(--gray); color:var(--text-sub); padding:3px 9px; border-radius:10px; }
    .card-name { font-size:14px; font-weight:700; color:var(--text); line-height:1.4; }
    .card-subtitle { font-size:12px; color:var(--text-sub); line-height:1.5; }
    .card-arrow { margin-top:auto; font-size:12px; color:var(--active); font-weight:600; padding-top:4px; }

    .no-results { text-align:center; padding:48px 20px; color:var(--text-sub); font-size:16px; display:none; }
    .no-results.visible { display:block; }

    footer { background:white; border-top:1px solid var(--border); padding:20px; text-align:center; font-size:12px; color:var(--text-sub); }
    footer a { color:var(--active); text-decoration:none; }

    @media (max-width:600px) {
      .hanabi-hero { min-height:160px; }
      .hanabi-hero-title { font-size:36px; -webkit-text-stroke:5px white; }
      .hanabi-hero-sub { font-size:13px; }
      .hanabi-stat-pill { font-size:13px; padding:4px 12px; }
      .pref-tab { padding:10px 12px; font-size:12px; }
    }
  </style>
</head>
<body>

<header>
  <div class="header-inner">
    <a class="logo" href="../../../"><img src="../../../favicon.ico" style="width:32px;height:32px;border-radius:8px;display:block" alt="Junlando" />Junlando</a>
    <nav class="header-links">
      <a href="../../../ja/index.html">開花予報</a>
    </nav>
  </div>
</header>

<div class="hanabi-hero">
  <img class="hanabi-hero-bg" src="../images/001/1.jpg" alt="花火大会" />
  <div class="hanabi-hero-inner">
    <h1 class="hanabi-hero-title" data-text="🎆 花火大会 2026">🎆 花火大会 2026</h1>
    <p class="hanabi-hero-sub">全国の花火大会を日程・都道府県で探す</p>
    <div class="hanabi-stats">
      <span class="hanabi-stat-pill">50件の大会</span>
      <span class="hanabi-stat-pill">29都道府県</span>
      <span class="hanabi-stat-pill">4月 〜 12月</span>
    </div>
  </div>
</div>

<div class="pref-filter-bar">
  <div class="pref-filter-inner">
${prefTabsHtml}
  </div>
</div>

<div class="main">
${monthSections}
  <div class="no-results" id="noResults">この都道府県の花火大会は現在掲載されていません。</div>
</div>

<footer>
  <p>© 2026 Junlando | <a href="../../../ja/index.html">開花予報</a> · <a href="../">花火大会（中文）</a></p>
  <p style="margin-top:4px">最終更新：${BUILD_DATE}</p>
</footer>

<script>
  const tabs = document.querySelectorAll('.pref-tab');
  const cards = document.querySelectorAll('.event-card');
  const sections = document.querySelectorAll('.month-section');
  const noResults = document.getElementById('noResults');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const pref = tab.dataset.pref;

      cards.forEach(card => {
        if (pref === 'all' || card.dataset.pref === pref) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });

      let anyVisible = false;
      sections.forEach(sec => {
        const visCount = sec.querySelectorAll('.event-card:not(.hidden)').length;
        sec.classList.toggle('hidden', visCount === 0);
        if (visCount > 0) anyVisible = true;
      });
      noResults.classList.toggle('visible', !anyVisible);
    });
  });
</script>
</body>
</html>`;

const outDir = path.join(BASE_DIR, 'ja');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
console.log('✅ JA index → ja/index.html');
