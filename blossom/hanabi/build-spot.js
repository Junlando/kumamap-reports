const fs = require('fs');
const path = require('path');

const eventsPath = path.join(__dirname, 'data/events.json');
const spotDir = path.join(__dirname, 'spot');
const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));

const DOW_ZH = ['日','一','二','三','四','五','六'];

function formatDate(ev) {
  const d = new Date(ev.date + 'T00:00:00');
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const dow = DOW_ZH[d.getDay()];
  if (ev.endDate) {
    const e = new Date(ev.endDate + 'T00:00:00');
    const span = (e - d) / 86400000;
    if (span > 7) {
      return `${y}年${m}月${day}日 ～ ${e.getMonth()+1}月${e.getDate()}日`;
    } else {
      return `${y}年${m}月${day}日（${dow}）・${e.getDate()}日（${DOW_ZH[e.getDay()]}）`;
    }
  }
  return `${y}年${m}月${day}日（${dow}）`;
}

function buildInfoCard(ev) {
  const dateStr = formatDate(ev);
  let rows = '';

  rows += `\n    <div class="info-row"><div class="info-label">開催日期</div><div class="info-value">${dateStr}</div></div>`;
  rows += `\n    <div class="info-row"><div class="info-label">縣市</div><div class="info-value">${ev.location}</div></div>`;

  if (ev.time)
    rows += `\n    <div class="info-row"><div class="info-label">時間</div><div class="info-value">${ev.time}</div></div>`;

  if (ev.venue)
    rows += `\n    <div class="info-row"><div class="info-label">會場</div><div class="info-value">${ev.venue}</div></div>`;

  if (ev.count)
    rows += `\n    <div class="info-row"><div class="info-label">發數</div><div class="info-value">${ev.count}</div></div>`;

  if (ev.paid_seats !== undefined)
    rows += `\n    <div class="info-row"><div class="info-label">有料席</div><div class="info-value">${ev.paid_seats ? '有' : '無'}</div></div>`;

  if (ev.yatai !== undefined)
    rows += `\n    <div class="info-row"><div class="info-label">屋台</div><div class="info-value">${ev.yatai ? '有' : '無'}</div></div>`;

  if (ev.access)
    rows += `\n    <div class="info-row"><div class="info-label">交通</div><div class="info-value">${ev.access}</div></div>`;

  if (ev.rain)
    rows += `\n    <div class="info-row"><div class="info-label">雨天</div><div class="info-value">${ev.rain}</div></div>`;

  if (ev.note)
    rows += `\n    <div class="info-row"><div class="info-label">備註</div><div class="info-value">${ev.note}</div></div>`;

  return `  <div class="info-card">\n    <div class="info-card-title">基本資訊</div>${rows}\n  </div>`;
}

function buildMapSection(ev) {
  if (!ev.lat || !ev.lng) return '';
  return `  <div class="map-card">\n    <iframe src="https://maps.google.com/maps?q=${ev.lat},${ev.lng}&z=15&output=embed" width="100%" height="300" style="border:0;border-radius:12px;display:block" allowfullscreen loading="lazy"></iframe>\n  </div>\n`;
}

const mapCardCss = `\n    /* MAP CARD */\n    .map-card { margin-bottom:24px; border-radius:var(--radius); overflow:hidden; }`;

let updated = 0, skipped = 0;

for (const ev of events) {
  const htmlPath = path.join(spotDir, `${ev.id}.html`);
  if (!fs.existsSync(htmlPath)) { console.log(`SKIP (no file): ${ev.id}.html`); skipped++; continue; }

  let html = fs.readFileSync(htmlPath, 'utf8');

  // Add .map-card CSS if not already present
  if (!html.includes('.map-card')) {
    html = html.replace('    /* BACK BTN */', mapCardCss + '\n\n    /* BACK BTN */');
  }

  const infoCardStart = html.indexOf('<div class="info-card">');
  const backBtnStart = html.indexOf('<a class="back-btn"');
  if (infoCardStart === -1 || backBtnStart === -1) { console.log(`SKIP (structure): ${ev.id}.html`); skipped++; continue; }

  const before = html.substring(0, infoCardStart);
  const after = html.substring(backBtnStart);

  html = before + buildInfoCard(ev) + '\n\n' + buildMapSection(ev) + '\n  ' + after;

  fs.writeFileSync(htmlPath, html, 'utf8');
  updated++;
}

console.log(`Done: ${updated} updated, ${skipped} skipped`);
