/**
 * build-spot-en.js
 * 生成英文花火景點靜態頁面
 * 輸出：hanabi/spot/en/{id}.html
 */

const fs   = require('fs');
const path = require('path');

const BASE_DIR  = __dirname;
const SITE_ROOT = 'https://junlando.com/blossom/hanabi';
const BUILD_DATE = new Date().toISOString().slice(0, 10);

const EVENTS = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'data/events.en.json'), 'utf8'));

const DOW_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function esc(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function formatDate(ev) {
  const d = new Date(ev.date + 'T00:00:00');
  const m = MONTHS[d.getMonth()+1];
  const day = d.getDate();
  const dow = DOW_EN[d.getDay()];
  const y = d.getFullYear();
  if (ev.endDate) {
    const e = new Date(ev.endDate + 'T00:00:00');
    const span = (e - d) / 86400000;
    if (span > 7) return `${m} ${day} – ${MONTHS[e.getMonth()+1]} ${e.getDate()}, ${y}`;
    return `${m} ${day} & ${e.getDate()} (${dow}/${DOW_EN[e.getDay()]}), ${y}`;
  }
  return `${m} ${day}, ${y} (${dow})`;
}

function formatDateTag(ev) {
  const d = new Date(ev.date + 'T00:00:00');
  const m = MONTHS[d.getMonth()+1];
  if (ev.endDate) {
    const e = new Date(ev.endDate + 'T00:00:00');
    return `${m} ${d.getDate()} – ${MONTHS[e.getMonth()+1]} ${e.getDate()}`;
  }
  return `${m} ${d.getDate()}`;
}

function buildInfoCard(ev) {
  let rows = '';
  rows += `\n    <div class="info-row"><div class="info-label">Date</div><div class="info-value">${formatDate(ev)}</div></div>`;
  rows += `\n    <div class="info-row"><div class="info-label">Prefecture</div><div class="info-value">${esc(ev.location)}</div></div>`;
  if (ev.time)        rows += `\n    <div class="info-row"><div class="info-label">Time</div><div class="info-value">${esc(ev.time)}</div></div>`;
  if (ev.venue)       rows += `\n    <div class="info-row"><div class="info-label">Venue</div><div class="info-value">${esc(ev.venue)}</div></div>`;
  if (ev.count)       rows += `\n    <div class="info-row"><div class="info-label">Fireworks</div><div class="info-value">${esc(ev.count)}</div></div>`;
  if (ev.paid_seats !== undefined)
    rows += `\n    <div class="info-row"><div class="info-label">Paid Seats</div><div class="info-value">${ev.paid_seats ? 'Available' : 'Free only'}</div></div>`;
  if (ev.yatai !== undefined)
    rows += `\n    <div class="info-row"><div class="info-label">Food Stalls</div><div class="info-value">${ev.yatai ? 'Available' : 'None'}</div></div>`;
  if (ev.access)      rows += `\n    <div class="info-row"><div class="info-label">Access</div><div class="info-value">${esc(ev.access)}</div></div>`;
  if (ev.rain)        rows += `\n    <div class="info-row"><div class="info-label">Rain Policy</div><div class="info-value">${esc(ev.rain)}</div></div>`;
  if (ev.note)        rows += `\n    <div class="info-row"><div class="info-label">Notes</div><div class="info-value">${esc(ev.note)}</div></div>`;
  return `  <div class="info-card">\n    <div class="info-card-title">Event Details</div>${rows}\n  </div>`;
}

function buildMapSection(ev) {
  if (!ev.lat || !ev.lng) return '';
  const openUrl = `https://www.google.com/maps/search/?api=1&query=${ev.lat},${ev.lng}`;
  return `  <div class="map-card">
    <iframe src="https://maps.google.com/maps?q=${ev.lat},${ev.lng}&z=15&output=embed&hl=en" width="100%" height="300" style="border:0;border-radius:12px;display:block" allowfullscreen loading="lazy"></iframe>
    <a class="map-link" href="${openUrl}" target="_blank" rel="noopener">🗺️ Open in Google Maps</a>
  </div>\n`;
}

const outDir = path.join(BASE_DIR, 'spot/en');
fs.mkdirSync(outDir, { recursive: true });

let count = 0;
for (const ev of EVENTS) {
  const canonical   = `${SITE_ROOT}/spot/en/${ev.id}.html`;
  const zhCanonical = `${SITE_ROOT}/spot/${ev.id}.html`;
  const prefUrl     = `${SITE_ROOT}/pref/en/${ev.ken}.html`;
  const isLong      = ev.endDate && (new Date(ev.endDate+'T00:00:00') - new Date(ev.date+'T00:00:00')) / 86400000 > 7;

  const title   = `${ev.name} | ${ev.location} Fireworks Festival 2026 | Junlando`;
  const metaDesc = `${ev.note ? ev.note + ' ' : ''}${formatDate(ev)}. ${ev.venue ? 'Venue: ' + ev.venue + '. ' : ''}Japan fireworks festival guide & access info.`;

  const jsonldEvent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Event",
    "name": ev.name,
    "description": metaDesc,
    "startDate": ev.date,
    "endDate": ev.endDate || ev.date,
    "url": canonical,
    "location": { "@type": "Place", "name": ev.venue || ev.location, "address": { "@type": "PostalAddress", "addressRegion": ev.location, "addressCountry": "JP" } },
    ...(ev.lat && ev.lng ? { "location": { "@type": "Place", "name": ev.venue || ev.location, "geo": { "@type": "GeoCoordinates", "latitude": ev.lat, "longitude": ev.lng } } } : {})
  });
  const jsonldBreadcrumb = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Fireworks Festivals", "item": `${SITE_ROOT}/en/` },
      { "@type": "ListItem", "position": 2, "name": ev.location, "item": prefUrl },
      { "@type": "ListItem", "position": 3, "name": ev.name, "item": canonical },
    ]
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(metaDesc)}" />
  <meta property="og:title" content="${esc(ev.name)} | Japan Fireworks 2026" />
  <meta property="og:description" content="${esc(metaDesc)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${SITE_ROOT}/images/${ev.id}/1.jpg" />
  <link rel="canonical" href="${canonical}" />
  <link rel="alternate" hreflang="zh-Hant" href="${zhCanonical}" />
  <link rel="alternate" hreflang="en" href="${canonical}" />
  <link rel="icon" href="../../../../favicon.ico" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet" />
  <script type="application/ld+json">${jsonldEvent}</script>
  <script type="application/ld+json">${jsonldBreadcrumb}</script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root { --hanabi:#e05a00; --hanabi-dark:#b84400; --hanabi-light:#fff4ee; --gray:#f5f6f8; --border:#e8e9ec; --text:#1a1a2e; --text-sub:#6b7280; --radius:12px; --active:#7c5cbf; }
    body { font-family:'Inter','Noto Sans JP',-apple-system,sans-serif; background:#fafbfc; color:var(--text); line-height:1.6; min-height:100vh; }
    header { background:white; border-bottom:1px solid var(--border); position:sticky; top:0; z-index:100; }
    .header-inner { max-width:1100px; margin:0 auto; padding:0 20px; height:58px; display:flex; align-items:center; gap:16px; }
    .logo { display:flex; align-items:center; gap:8px; text-decoration:none; color:var(--text); font-weight:700; font-size:18px; }
    .header-links { margin-left:auto; display:flex; align-items:center; gap:4px; }
    .header-links a { padding:6px 12px; border-radius:8px; text-decoration:none; font-size:13px; color:var(--text-sub); font-weight:500; transition:background .15s,color .15s; }
    .header-links a:hover { background:var(--gray); color:var(--text); }
    .breadcrumb-bar { background:white; border-bottom:1px solid var(--border); }
    .breadcrumb-inner { max-width:1100px; margin:0 auto; padding:8px 20px; font-size:13px; display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
    .breadcrumb-inner a { color:var(--active); text-decoration:none; font-weight:500; }
    .breadcrumb-inner a:hover { text-decoration:underline; }
    .breadcrumb-sep { color:#ccc; font-size:12px; }
    .breadcrumb-current { color:var(--text); font-weight:600; }
    .event-header { background:white; border-bottom:1px solid var(--border); }
    .event-header-inner { max-width:900px; margin:0 auto; padding:20px 20px 18px; }
    .event-title { font-size:26px; font-weight:800; color:var(--text); margin-bottom:12px; line-height:1.3; }
    .event-tags { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-bottom:10px; }
    .tag-date { background:var(--hanabi-light); color:var(--hanabi-dark); font-size:13px; font-weight:700; padding:4px 12px; border-radius:20px; }
    .tag-long { background:#fff8ec; color:#7a5200; font-size:12px; font-weight:700; padding:3px 10px; border-radius:20px; border:1px solid #f0c060; }
    .tag-pref { background:var(--gray); color:var(--text-sub); font-size:13px; font-weight:600; padding:4px 12px; border-radius:20px; }
    .event-note { font-size:14px; color:var(--text-sub); margin-top:4px; }
    .main { max-width:720px; margin:0 auto; padding:20px 20px 60px; }
    .intro-block { margin-bottom:32px; }
    .intro-subtitle { font-size:22px; font-weight:800; color:var(--text); padding-bottom:10px; border-bottom:2px solid var(--border); margin-top:24px; margin-bottom:16px; line-height:1.3; }
    .intro-block p { font-size:17px; color:var(--text); line-height:1.9; margin-bottom:28px; }
    .intro-block p:last-child { margin-bottom:0; }
    .blog-img { width:100%; aspect-ratio:4/3; max-height:480px; object-fit:cover; border-radius:var(--radius); display:block; margin-bottom:14px; }
    @media (max-width:600px) { .blog-img { max-height:260px; } .intro-block p { font-size:16px; margin-bottom:22px; } }
    .info-card { background:white; border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; margin-bottom:24px; }
    .info-card-title { padding:12px 18px; font-size:14px; font-weight:700; border-bottom:1px solid var(--border); background:var(--gray); }
    .info-row { display:flex; padding:11px 18px; border-bottom:1px solid var(--border); font-size:14px; }
    .info-row:last-child { border-bottom:none; }
    .info-label { width:100px; flex-shrink:0; color:var(--text-sub); font-weight:600; font-size:12px; padding-top:1px; }
    .info-value { color:var(--text); }
    .map-card { margin-bottom:24px; border-radius:var(--radius); overflow:hidden; }
    .map-link { display:inline-block; margin-top:10px; font-size:13px; color:var(--active); text-decoration:none; font-weight:600; }
    .map-link:hover { text-decoration:underline; }
    .back-btn { display:inline-flex; align-items:center; gap:6px; padding:9px 18px; border-radius:10px; background:var(--hanabi-light); color:var(--hanabi-dark); font-size:13px; font-weight:700; text-decoration:none; border:1.5px solid #ffc49e; transition:background .12s; }
    .back-btn:hover { background:#ffe0cc; }
    .updated-date { font-size:11px; color:var(--text-sub); margin-top:24px; }
  </style>
</head>
<body>

<header>
  <div class="header-inner">
    <a class="logo" href="../../../../"><img src="../../../../favicon.ico" style="width:32px;height:32px;border-radius:8px;display:block" alt="Junlando" />Junlando</a>
    <nav class="header-links">
      <a href="../../en/">Fireworks Festivals</a>
      <a href="../../../../en/index.html">Flower Forecast</a>
    </nav>
  </div>
</header>

<nav class="breadcrumb-bar">
  <div class="breadcrumb-inner">
    <a href="../../en/">Fireworks Festivals</a>
    <span class="breadcrumb-sep">›</span>
    <a href="${prefUrl}">${esc(ev.location)}</a>
    <span class="breadcrumb-sep">›</span>
    <span class="breadcrumb-current">${esc(ev.name)}</span>
  </div>
</nav>

<div class="event-header">
  <div class="event-header-inner">
    <h1 class="event-title">${esc(ev.name)}</h1>
    <div class="event-tags">
      <span class="tag-date">📅 ${esc(formatDateTag(ev))}</span>
      ${isLong ? '<span class="tag-long">⭐ Long-running</span>' : ''}
      <span class="tag-pref">📍 ${esc(ev.location)}</span>
    </div>
    ${ev.note ? `<div class="event-note">${esc(ev.note)}</div>` : ''}
  </div>
</div>

<div class="main">
  <div class="intro-block">
    <img class="blog-img" src="../../images/${ev.id}/1.jpg" alt="${esc(ev.name)}" onerror="this.style.display='none'" />
    ${ev.note ? `<div class="intro-subtitle">${esc(ev.note)}</div>` : ''}
    <img class="blog-img" src="../../images/${ev.id}/2.jpg" alt="${esc(ev.name)}" onerror="this.style.display='none'" />
    <img class="blog-img" src="../../images/${ev.id}/3.jpg" alt="${esc(ev.name)}" onerror="this.style.display='none'" />
  </div>

${buildInfoCard(ev)}

${buildMapSection(ev)}
  <a class="back-btn" href="../../en/">← Back to Fireworks Calendar</a>
  <p class="updated-date">Last updated: ${BUILD_DATE}</p>
</div>
</body>
</html>`;

  fs.writeFileSync(path.join(outDir, `${ev.id}.html`), html, 'utf8');
  count++;
}

console.log(`✅ EN spot: ${count} pages → spot/en/`);
