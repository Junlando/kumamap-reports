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

function renderStatusBadge(fc, flower) {
  if (!fc || !fc.bloom) return '';
  const f = FLOWERS[flower];
  const s = getStatus(fc.bloom, fc.peak, fc.end);
  const isKoyo = flower === 'koyo';
  const map = {
    upcoming: { icon: '📅', label: isKoyo ? '賞楓前' : '開花前', cls: 'status-upcoming' },
    blooming: { icon: f.emoji, label: isKoyo ? '轉紅中' : '開花中', cls: 'status-blooming' },
    peak:     { icon: '🔥', label: isKoyo ? '最紅！' : '滿開！', cls: 'status-peak' },
    ended:    { icon: '🍃', label: '已結束', cls: 'status-ended' },
  };
  const st = map[s];
  if (!st) return '';
  return `<span class="status-badge ${st.cls}">${st.icon} ${st.label}</span>`;
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
      ${rows.map(r => `
        <div class="info-row">
          <div class="info-label">${r.label}</div>
          <div class="info-val">${r.val}</div>
        </div>`).join('')}
    </div>`;
}

function initGallery() {
  const gallery = document.getElementById('heroGallery');
  const btnL    = document.getElementById('heroLeft');
  const btnR    = document.getElementById('heroRight');
  if (!gallery) return;

  function updateBtns() {
    if (!btnL || !btnR) return;
    btnL.classList.toggle('hidden', gallery.scrollLeft <= 4);
    btnR.classList.toggle('hidden', gallery.scrollLeft >= gallery.scrollWidth - gallery.clientWidth - 4);
  }
  if (btnL) { btnL.classList.add('hidden'); btnL.addEventListener('click', () => gallery.scrollBy({ left: -(gallery.clientWidth * 0.88 + 10), behavior: 'smooth' })); }
  if (btnR) { btnR.addEventListener('click', () => gallery.scrollBy({ left: gallery.clientWidth * 0.88 + 10, behavior: 'smooth' })); }
  gallery.addEventListener('scroll', updateBtns, { passive: true });

  // Drag to scroll (desktop)
  let isDown = false, startX, scrollStart;
  gallery.addEventListener('mousedown', e => { isDown = true; startX = e.pageX; scrollStart = gallery.scrollLeft; gallery.classList.add('dragging'); });
  document.addEventListener('mouseup', () => { isDown = false; gallery.classList.remove('dragging'); });
  gallery.addEventListener('mousemove', e => { if (!isDown) return; e.preventDefault(); gallery.scrollLeft = scrollStart - (e.pageX - startX); });
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
    const [top20All, forecast, detailAll, spotsAll, idMapAll] = await Promise.all([
      fetch(BASE + 'data/top20.json').then(r => r.json()),
      fetch(BASE + `data/forecast/${flower}-${year}.json`).then(r => r.json()).catch(() => ({ prefectures: {} })),
      detailFile ? fetch(BASE + detailFile).then(r => r.json()).catch(() => ({})) : Promise.resolve({}),
      fetch(BASE + `data/spots/${flower}.json`).then(r => r.json()).catch(() => ({})),
      fetch(BASE + 'data/spot-id-map.json').then(r => r.json()).catch(() => ({})),
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

    // Hide hero wrap — images are now inline in the blog layout
    const heroWrap = document.getElementById('heroWrap');
    if (heroWrap) heroWrap.style.display = 'none';

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

    // ── Pre-hero: title + status badge ──
    const spotHeaderEl = document.getElementById('spotHeader');
    if (spotHeaderEl) {
      spotHeaderEl.innerHTML = `
        <div class="spot-pre-hero">
          <h1 class="spot-name">${spot.name}</h1>
          <div class="spot-status-row">
            ${renderStatusBadge(fc, flower)}
            <span class="spot-meta-tag">📍 ${spot.prefName}</span>
            ${spot.period ? `<span class="spot-meta-tag">${f.emoji} ${spot.period}</span>` : ''}
          </div>
        </div>`;
    }

    // ── Blog layout: interleave images + paragraphs ──
    const imgCount = detail?.img_count || (spot.img ? 1 : 0);
    const imgExt = (spot.img || '1.jpg').split('.').pop() || 'jpg';
    const folder = `${BASE}images/${flower}/${encodeURIComponent(spotName)}/`;
    const paras = (spot.desc || '').split('<br><br>').map(p => p.trim()).filter(Boolean);

    function getImgSrc(i) {
      if (imgCount > 1) return `${folder}${i + 1}.${imgExt}`;
      if (i === 0 && spot.img) return `${BASE}${spot.img}`;
      return null;
    }

    let blogHtml = '';
    const blocks = Math.max(imgCount, paras.length);
    for (let i = 0; i < blocks; i++) {
      const src = getImgSrc(i);
      if (src) blogHtml += `<img class="blog-img" src="${src}" alt="${spot.name}" onerror="this.style.display='none'" />`;
      if (paras[i]) blogHtml += `<p class="blog-para">${paras[i]}</p>`;
    }

    const bloomHtml = renderBloomCard(fc, flower);
    const infoHtml  = renderInfoCard(detail);

    app.classList.remove('loading');
    app.innerHTML = `
      ${blogHtml ? `<div class="section-heading">景點介紹</div>${blogHtml}` : ''}

      ${bloomHtml ? `<div class="section-heading">${spot.prefName} ${f.label}預測</div>${bloomHtml}` : ''}

      ${infoHtml ? `<div class="section-heading">景點資訊</div>${infoHtml}` : ''}

      <div class="section-heading">地圖</div>
      <div class="map-embed-wrap">
        <iframe
          class="map-embed"
          src="https://maps.google.com/maps?q=${encodeURIComponent(spot.name)}&output=embed&hl=zh-TW"
          allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade">
        </iframe>
        <a class="map-link" href="${spot.mapUrl}" target="_blank" rel="noopener"
           data-track="click_google_maps" data-track-params='${JSON.stringify({spot: spot.name, flower})}'>
          🗺️ 在 Google Maps 中開啟
        </a>
      </div>
    `;

    // Siblings
    const siblingsMount = document.getElementById('siblings-mount');
    if (siblingsMount) {
      const sibList = (spotsAll[prefKey] || []).filter(s => s.name !== spotName).slice(0, 4);
      if (sibList.length) {
        siblingsMount.innerHTML = `
          <section class="siblings-section">
            <div class="siblings-title">更多 ${spot.prefName} ${f.label}景點</div>
            <div class="siblings-list">
              ${sibList.map(s => {
                const sid = idMapAll[flower]?.[s.name];
                const href = sid
                  ? `${BASE}spot/${flower}/${sid}.html`
                  : `${BASE}spot.html?flower=${flower}&spot=${encodeURIComponent(s.name)}&pref=${prefKey}`;
                return `<a class="siblings-link" href="${href}">${s.name}</a>`;
              }).join('\n')}
            </div>
          </section>`;
      }
    }

  } catch(e) {
    console.error(e);
    app.classList.remove('loading');
    app.innerHTML = `<div class="error-msg"><p>載入失敗，請稍後再試</p></div>`;
  }
}

render();
