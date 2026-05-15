// spot.js — shared rendering logic for spot pages
// window.__BASE  : base path prefix ('' for spot.html, '../../' for generated pages)
// window.__SPOT  : { name, flower, pref } pre-set by generated pages (optional)

const BASE = window.__BASE || '';

const TODAY = new Date('2026-05-12');
const FLOWER_YEAR = { ajisai: 2026, koyo: 2026, sakura: 2027 };
const FLOWERS = {
  ajisai: { label: '繡球花', emoji: '💠', color: '#7c5cbf', light: '#f0eafb' },
  koyo:   { label: '紅葉',   emoji: '🍁', color: '#d4570a', light: '#fff0e6' },
  sakura: { label: '桜',     emoji: '🌸', color: '#d46b8a', light: '#fff0f5' },
};
const DETAIL_FILES = {
  ajisai: 'data/spots/detail-ajisai.json',
  koyo:   'data/spots/detail-koyo.json',
  sakura: 'data/spots/detail-sakura.json',
};

function getParams() {
  if (window.__SPOT) {
    return { flower: window.__SPOT.flower || 'ajisai', spotName: window.__SPOT.name || '', pref: window.__SPOT.pref || '' };
  }
  const p = new URLSearchParams(location.search);
  return { flower: p.get('flower') || 'ajisai', spotName: p.get('spot') || '', pref: p.get('pref') || '' };
}

function fmtShort(d, flower) {
  if (!d) return '—';
  const dt = new Date(d);
  if (flower === 'koyo') {
    const day = dt.getDate();
    const jun = day <= 10 ? '上旬' : day <= 20 ? '中旬' : '下旬';
    return `${dt.getMonth()+1}月${jun}`;
  }
  return `${dt.getMonth()+1}月${dt.getDate()}日`;
}

function getStatus(bloom, peak, end) {
  if (!bloom) return 'none';
  const b = new Date(bloom), p = new Date(peak), e = new Date(end);
  if (TODAY < b) return 'upcoming';
  if (TODAY >= b && TODAY < p) return 'blooming';
  if (TODAY >= p && TODAY <= e) return 'peak';
  return 'ended';
}

function daysUntil(d) {
  if (!d) return null;
  return Math.round((new Date(d) - TODAY) / 86400000);
}

function renderBloomCard(fc, flower) {
  if (!fc || !fc.bloom) return '';
  const f = FLOWERS[flower];
  const s = getStatus(fc.bloom, fc.peak, fc.end);
  const isKoyo = flower === 'koyo';
  const statusMap = {
    upcoming: { icon: '📅', label: isKoyo ? '賞楓前'   : '開花前', color: '#1565c0' },
    blooming: { icon: f.emoji, label: isKoyo ? '轉紅中'   : '開花中', color: '#2e7d32' },
    peak:     { icon: '🔥', label: isKoyo ? '最紅！'   : '滿開！', color: '#ef6c00' },
    ended:    { icon: '🍃', label: '已結束',                        color: '#757575' },
    none:     { icon: 'ℹ️', label: '—',                            color: '#999' },
  };
  const st = statusMap[s];
  const days = daysUntil(fc.bloom);
  const subText = s === 'upcoming' && days > 0 ? `距開花還有 ${days} 天`
    : s === 'blooming' ? `預計 ${fmtShort(fc.peak, flower)} 滿開`
    : s === 'peak' ? '最佳賞花期！'
    : s === 'ended' ? '本季已結束' : '';

  const bloomLabel = flower === 'koyo' ? '轉紅開始' : '開花日';
  const peakLabel  = flower === 'koyo' ? '全紅高峰' : '滿開日';
  const endLabel   = flower === 'koyo' ? '賞楓結束' : '結束日';

  return `
    <div class="bloom-card">
      <div class="bloom-card-header">${fc.name} ${f.label}預測</div>
      <div class="bloom-status-row">
        <div class="bloom-status-icon">${st.icon}</div>
        <div>
          <div class="bloom-status-label" style="color:${st.color}">${st.label}</div>
          ${subText ? `<div class="bloom-status-sub">${subText}</div>` : ''}
        </div>
      </div>
      <div class="bloom-dates">
        <div class="bloom-date-item">
          <div class="bloom-date-label">${bloomLabel}</div>
          <div class="bloom-date-val">${fmtShort(fc.bloom, flower)}</div>
        </div>
        <div class="bloom-date-item">
          <div class="bloom-date-label">${peakLabel}</div>
          <div class="bloom-date-val">${fmtShort(fc.peak, flower)}</div>
        </div>
        <div class="bloom-date-item">
          <div class="bloom-date-label">${endLabel}</div>
          <div class="bloom-date-val">${fmtShort(fc.end, flower)}</div>
        </div>
      </div>
    </div>`;
}

function renderInfoCard(detail) {
  if (!detail) return '';
  const rows = [
    detail.types   ? { label: '品種',   val: detail.types } : null,
    detail.count   ? { label: '株數',   val: detail.count } : null,
    detail.hours   ? { label: '開放時間', val: detail.hours } : null,
    detail.fee     ? { label: '入場費', val: detail.fee } : null,
    detail.address ? { label: '地址',   val: detail.address } : null,
    detail.contact ? { label: '電話',   val: detail.contact } : null,
    (detail.access_train || detail.access_car) ? {
      label: '交通',
      val: `${detail.access_train ? `<div class="access-item"><span>🚃</span><span>${detail.access_train}</span></div>` : ''}
            ${detail.access_car   ? `<div class="access-item"><span>🚗</span><span>${detail.access_car}</span></div>` : ''}`
    } : null,
  ].filter(Boolean);

  return `
    <div class="info-card">
      <div class="info-card-header">景點資訊</div>
      ${rows.map(r => `
        <div class="info-row">
          <div class="info-label">${r.label}</div>
          <div class="info-val">${r.val}</div>
        </div>`).join('')}
    </div>`;
}

async function render() {
  const { flower, spotName, pref: prefParam } = getParams();
  const f = FLOWERS[flower] || FLOWERS.ajisai;
  const year = FLOWER_YEAR[flower];
  const app = document.getElementById('app');

  document.documentElement.style.setProperty('--active', f.color);
  document.documentElement.style.setProperty('--active-light', f.light);
  const heroPlaceholderEl = document.getElementById('heroPlaceholder');
  if (heroPlaceholderEl) heroPlaceholderEl.textContent = f.emoji;

  if (!spotName) {
    app.classList.remove('loading');
    app.innerHTML = `<div class="error-msg"><p>找不到景點</p><a href="${BASE}index.html" style="color:var(--active)">← 返回花卉預測</a></div>`;
    return;
  }

  try {
    const detailFile = DETAIL_FILES[flower];
    const [top20All, forecast, detailAll, spotsAll] = await Promise.all([
      fetch(BASE + 'data/top20.json').then(r => r.json()),
      fetch(BASE + `data/forecast/${flower}-${year}.json`).then(r => r.json()).catch(() => ({ prefectures: {} })),
      detailFile ? fetch(BASE + detailFile).then(r => r.json()).catch(() => ({})) : Promise.resolve({}),
      fetch(BASE + `data/spots/${flower}.json`).then(r => r.json()).catch(() => ({})),
    ]);

    // 1. Try top20 first
    let spot = (top20All[flower] || []).find(s => s.name === spotName);

    // 2. Fall back to per-prefecture spots
    if (!spot) {
      const prefKey = prefParam || Object.keys(spotsAll).find(k => spotsAll[k].some(s => s.name === spotName));
      if (prefKey) {
        const s = (spotsAll[prefKey] || []).find(s => s.name === spotName);
        if (s) {
          const fc = forecast.prefectures?.[prefKey] || {};
          spot = { name: s.name, prefName: fc.name || prefKey, pref: prefKey, period: s.period || '', desc: '', img: '', mapUrl: s.mapUrl || '' };
        }
      }
    }

    const detail = detailAll[spotName] || null;

    if (!spot) {
      app.classList.remove('loading');
      app.innerHTML = `<div class="error-msg"><p>找不到「${spotName}」的資料</p><a href="${BASE}index.html" style="color:var(--active)">← 返回花卉預測</a></div>`;
      return;
    }

    // Hero image
    const heroWrap = document.getElementById('heroWrap');
    if (spot.img) {
      heroWrap.innerHTML = `<img src="${BASE}${spot.img}" alt="${spot.name}" onerror="this.parentElement.style.display='none'" />`;
    } else {
      heroWrap.style.display = 'none';
    }

    document.title = `${spot.name} | Junlando`;

    // Breadcrumb
    const prefKey = prefParam || spot.pref;
    const sep = `<span class="breadcrumb-sep">›</span>`;
    const crumbPref = prefKey
      ? `${sep} <a href="${BASE}prefecture.html?ken=${prefKey}&flower=${flower}">${spot.prefName}</a> `
      : '';
    document.getElementById('breadcrumb').innerHTML =
      `<a href="${BASE}index.html?flower=${flower}">花卉預測</a> ${crumbPref}${sep} <span class="breadcrumb-current">${spot.name}</span>`;

    const fc = forecast.prefectures?.[spot.pref] || null;

    app.classList.remove('loading');
    app.innerHTML = `
      <div class="spot-title-block">
        <div class="spot-name">${spot.name}</div>
        <div class="spot-meta">
          <span>📍 ${spot.prefName}</span>
          <span>🌸 ${spot.period}</span>
        </div>
      </div>

      ${spot.desc ? `<div class="desc-block">${spot.desc}</div>` : ''}

      ${renderBloomCard(fc, flower)}

      ${renderInfoCard(detail)}

      <a class="btn-map" href="${spot.mapUrl}" target="_blank" rel="noopener">
        🗺️ 在 Google Maps 上查看
      </a>
    `;

  } catch(e) {
    console.error(e);
    app.classList.remove('loading');
    app.innerHTML = `<div class="error-msg"><p>載入失敗，請稍後再試</p></div>`;
  }
}

render();
