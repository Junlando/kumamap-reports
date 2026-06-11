// spot.js — shared rendering logic for spot pages
// window.__BASE  : base path prefix ('' for spot.html, '../../' for generated pages)
// window.__SPOT  : { name, flower, pref } pre-set by generated pages (optional)
// window.__LANG  : 'en' | 'ja' | 'zh' (default 'zh')

const BASE = window.__BASE || '';
const LANG = window.__LANG || 'zh';

const TODAY = new Date();
const FLOWER_YEAR = { ajisai: 2026, koyo: 2026, sakura: 2027 };
const FLOWERS = {
  ajisai: { label: LANG === 'en' ? 'Hydrangea' : '繡球花', emoji: '💠', color: '#7c5cbf', light: '#f0eafb' },
  koyo:   { label: LANG === 'en' ? 'Autumn Foliage' : '紅葉', emoji: '🍁', color: '#d4570a', light: '#fff0e6' },
  sakura: { label: LANG === 'en' ? 'Cherry Blossom' : '桜',   emoji: '🌸', color: '#d46b8a', light: '#fff0f5' },
};
const DETAIL_FILES = {
  ajisai: `data/spots/detail-ajisai${LANG !== 'zh' ? '.' + LANG : ''}.json`,
  koyo:   `data/spots/detail-koyo${LANG !== 'zh' ? '.' + LANG : ''}.json`,
  sakura: `data/spots/detail-sakura${LANG !== 'zh' ? '.' + LANG : ''}.json`,
};

// Prefecture name English mapping
const PREF_EN = {
  hokkaido:'Hokkaido', aomori:'Aomori', iwate:'Iwate', miyagi:'Miyagi',
  akita:'Akita', yamagata:'Yamagata', fukushima:'Fukushima',
  ibaraki:'Ibaraki', tochigi:'Tochigi', gunma:'Gunma', saitama:'Saitama',
  chiba:'Chiba', tokyo:'Tokyo', kanagawa:'Kanagawa',
  niigata:'Niigata', toyama:'Toyama', ishikawa:'Ishikawa', fukui:'Fukui',
  yamanashi:'Yamanashi', nagano:'Nagano', shizuoka:'Shizuoka',
  aichi:'Aichi', mie:'Mie', shiga:'Shiga', kyoto:'Kyoto',
  osaka:'Osaka', hyogo:'Hyogo', nara:'Nara', wakayama:'Wakayama',
  tottori:'Tottori', shimane:'Shimane', okayama:'Okayama', hiroshima:'Hiroshima',
  yamaguchi:'Yamaguchi', tokushima:'Tokushima', kagawa:'Kagawa',
  ehime:'Ehime', kochi:'Kochi', fukuoka:'Fukuoka', saga:'Saga',
  nagasaki:'Nagasaki', kumamoto:'Kumamoto', oita:'Oita',
  miyazaki:'Miyazaki', kagoshima:'Kagoshima', okinawa:'Okinawa', gifu:'Gifu',
};

// i18n strings
const I18N = {
  zh: {
    upcoming: '開花前', blooming: '開花中', peak: '滿開！', ended: '已結束',
    upcomingKoyo: '賞楓前', bloomingKoyo: '轉紅中', peakKoyo: '最紅！',
    daysUntil: d => `距開花還有 ${d} 天`,
    peakSoon: d => `預計 ${d} 滿開`,
    peakNow: '最佳賞花期！',
    seasonEnded: '本季已結束',
    bloomDay: '開花日', peakDay: '滿開日', endDay: '結束日',
    bloomDayKoyo: '轉紅開始', peakDayKoyo: '全紅高峰', endDayKoyo: '賞楓結束',
    forecastSection: (prefName, year, label) => `${prefName} ${year}${label}花期預測`,
    infoSection: '景點資訊',
    mapSection: '地圖',
    moreSpots: (prefName, label) => `更多 ${prefName} ${label}景點`,
    openMaps: '🗺️ 在 Google Maps 中開啟',
    estimatedPeriod: '預估賞花期：',
    loading: '載入中…',
    notFound: '找不到景點',
    backHome: '← 返回花卉預測',
    loadFail: '載入失敗，請稍後再試',
    mapsLang: 'zh-TW',
    infoLabels: { types: '品種', count: '株數', hours: '開放時間', fee: '入場費', address: '地址', contact: '電話', access: '交通' },
  },
  ja: {
    upcoming: '開花前', blooming: '開花中', peak: '満開！', ended: 'シーズン終了',
    upcomingKoyo: '紅葉前', bloomingKoyo: '色づき中', peakKoyo: '見頃！',
    daysUntil: d => `開花まであと ${d} 日`,
    peakSoon: d => `${d} 頃に満開予定`,
    peakNow: '最高の見頃です！',
    seasonEnded: '今シーズンは終了しました',
    bloomDay: '開花日', peakDay: '満開日', endDay: '終了日',
    bloomDayKoyo: '色づき開始', peakDayKoyo: '見頃ピーク', endDayKoyo: '紅葉終了',
    forecastSection: (prefName, year, label) => `${prefName} ${year}年${label}開花予報`,
    infoSection: 'スポット情報',
    mapSection: '地図',
    moreSpots: (prefName, label) => `${prefName}の${label}スポット`,
    openMaps: '🗺️ Google マップで開く',
    estimatedPeriod: '見頃時期：',
    loading: '読み込み中…',
    notFound: 'スポットが見つかりません',
    backHome: '← 開花予報に戻る',
    loadFail: '読み込みに失敗しました。再度お試しください。',
    mapsLang: 'ja',
    infoLabels: { types: '品種', count: '株数', hours: '営業時間', fee: '入場料', address: '住所', contact: '電話', access: 'アクセス' },
  },
  en: {
    upcoming: 'Coming Soon', blooming: 'Blooming', peak: 'Peak Bloom!', ended: 'Season Ended',
    upcomingKoyo: 'Coming Soon', bloomingKoyo: 'Turning', peakKoyo: 'Peak Color!',
    daysUntil: d => `${d} days until bloom`,
    peakSoon: d => `Peak bloom expected ${d}`,
    peakNow: 'Best viewing time!',
    seasonEnded: 'Season has ended',
    bloomDay: 'First Bloom', peakDay: 'Peak Bloom', endDay: 'End Date',
    bloomDayKoyo: 'Color Start', peakDayKoyo: 'Peak Color', endDayKoyo: 'Season End',
    forecastSection: (prefName, year, label) => `${prefName} ${year} ${label} Forecast`,
    infoSection: 'Spot Info',
    mapSection: 'Map',
    moreSpots: (prefName, label) => `More ${label} Spots in ${prefName}`,
    openMaps: '🗺️ Open in Google Maps',
    estimatedPeriod: 'Best season: ',
    loading: 'Loading…',
    notFound: 'Spot not found',
    backHome: '← Back to Flower Forecast',
    loadFail: 'Failed to load. Please try again.',
    mapsLang: 'en',
    infoLabels: { types: 'Variety', count: 'Count', hours: 'Hours', fee: 'Admission', address: 'Address', contact: 'Phone', access: 'Access' },
  },
};
const T = I18N[LANG] || I18N.zh;

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
    upcoming: { icon: '📅', label: isKoyo ? T.upcomingKoyo : T.upcoming, cls: 'status-upcoming' },
    blooming: { icon: f.emoji, label: isKoyo ? T.bloomingKoyo : T.blooming, cls: 'status-blooming' },
    peak:     { icon: '🔥', label: isKoyo ? T.peakKoyo : T.peak, cls: 'status-peak' },
    ended:    { icon: '🍃', label: T.ended, cls: 'status-ended' },
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
    upcoming: { icon: '📅', label: isKoyo ? T.upcomingKoyo : T.upcoming, color: '#1565c0' },
    blooming: { icon: f.emoji, label: isKoyo ? T.bloomingKoyo : T.blooming, color: '#2e7d32' },
    peak:     { icon: '🔥', label: isKoyo ? T.peakKoyo : T.peak, color: '#ff5722' },
    ended:    { icon: '🍃', label: T.ended, color: '#757575' },
    none:     { icon: 'ℹ️', label: '—', color: '#999' },
  };
  const st = statusMap[s];
  const days = daysUntil(fc.bloom);
  const subText = s === 'upcoming' && days > 0 ? T.daysUntil(days)
    : s === 'blooming' ? T.peakSoon(fmtShort(fc.peak, flower))
    : s === 'peak' ? T.peakNow
    : s === 'ended' ? T.seasonEnded : '';

  const bloomLabel = flower === 'koyo' ? T.bloomDayKoyo : T.bloomDay;
  const peakLabel  = flower === 'koyo' ? T.peakDayKoyo  : T.peakDay;
  const endLabel   = flower === 'koyo' ? T.endDayKoyo   : T.endDay;

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
  const L = T.infoLabels;
  const rows = [
    detail.types   ? { label: L.types,   val: detail.types } : null,
    detail.count   ? { label: L.count,   val: detail.count } : null,
    detail.hours   ? { label: L.hours,   val: detail.hours } : null,
    detail.fee     ? { label: L.fee,     val: detail.fee } : null,
    detail.address ? { label: L.address, val: detail.address } : null,
    detail.contact ? { label: L.contact, val: detail.contact } : null,
    (detail.access_train || detail.access_car) ? {
      label: L.access,
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
    app.innerHTML = `<div class="error-msg"><p>${T.notFound}</p><a href="${BASE}index.html" style="color:var(--active)">${T.backHome}</a></div>`;
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

    const detail = detailAll[spotName] || null;

    // 1. Try detail JSON first (single source of truth)
    let spot = null;
    if (detail) {
      const prefKey = detail.pref || prefParam || '';
      const fc = forecast.prefectures?.[prefKey] || {};
      const jpPrefName = detail.prefName || fc.name || prefKey;
      spot = {
        name: detail.displayName || spotName,
        romaji: detail.romaji || '',
        pref: prefKey,
        prefName: LANG === 'en' ? (PREF_EN[prefKey] || jpPrefName) : jpPrefName,
        period: detail.period || '',
        desc: detail.desc || '',
        img: detail.img || '',
        mapUrl: detail.mapUrl || '',
      };
    }

    // 2. Fall back to per-prefecture spots list
    if (!spot) {
      const prefKey = prefParam || Object.keys(spotsAll).find(k => spotsAll[k].some(s => s.name === spotName));
      if (prefKey) {
        const s = (spotsAll[prefKey] || []).find(s => s.name === spotName);
        if (s) {
          const fc = forecast.prefectures?.[prefKey] || {};
          const jpName2 = fc.name || prefKey;
          spot = { name: s.name, prefName: LANG === 'en' ? (PREF_EN[prefKey] || jpName2) : jpName2, pref: prefKey, period: s.period || '', desc: '', img: '', mapUrl: s.mapUrl || '' };
        }
      }
    }

    if (!spot) {
      app.classList.remove('loading');
      app.innerHTML = `<div class="error-msg"><p>找不到「${spotName}」的資料</p><a href="${BASE}index.html" style="color:var(--active)">← 返回花卉預測</a></div>`;
      return;
    }

    // Hide hero wrap — images are now inline in the blog layout
    const heroWrap = document.getElementById('heroWrap');
    if (heroWrap) heroWrap.style.display = 'none';

    const displayTitle = (LANG === 'en' && spot.romaji) ? spot.romaji : spot.name;
    document.title = `${displayTitle} | Junlando`;

    // Breadcrumb
    const prefKey = spot?.pref || prefParam || '';
    const sep = `<span class="breadcrumb-sep">›</span>`;
    const langDir = LANG !== 'zh' ? `${LANG}/` : '';
    const prefLangDir = LANG !== 'zh' ? `${LANG}/` : '';
    const crumbPref = prefKey
      ? `${sep} <a href="${BASE}prefecture/${prefLangDir}${flower}/${prefKey}.html">${spot.prefName}</a> `
      : '';
    const homeLabel = LANG === 'en' ? 'Flower Forecast' : LANG === 'ja' ? '開花予報' : '花卉預測';
    const breadcrumbCurrent = (LANG === 'en' && spot.romaji) ? spot.romaji
      : (LANG === 'ja' && spot.romaji) ? spot.romaji
      : spot.name;
    document.getElementById('breadcrumb').innerHTML =
      `<a href="${BASE}${langDir}index.html?flower=${flower}">${homeLabel}</a> ${crumbPref}${sep} <span class="breadcrumb-current">${breadcrumbCurrent}</span>`;

    const fc = forecast.prefectures?.[spot.pref] || null;

    // ── Pre-hero: title + status badge (right) ──
    const spotHeaderEl = document.getElementById('spotHeader');
    if (spotHeaderEl) {
      const nameHtml = (LANG === 'en' && spot.romaji)
        ? `<h1 class="spot-name">${spot.romaji}</h1><div class="spot-name-ja">${spot.name}</div>`
        : `<h1 class="spot-name">${spot.name}</h1>`;
      spotHeaderEl.innerHTML = `
        <div class="spot-pre-hero">
          <div class="spot-title-row">
            ${nameHtml}
            ${renderStatusBadge(fc, flower)}
          </div>
          <div class="spot-meta-row">
            <span>📍 ${spot.prefName}</span>
            ${spot.period ? `<span>${f.emoji} ${spot.period}</span>` : ''}
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
      if (i === 0 && detail?.tagline) blogHtml += `<div class="section-heading">${detail.tagline}</div>`;
      if (paras[i]) blogHtml += `<p class="blog-para">${paras[i]}</p>`;
    }

    const bloomHtml = renderBloomCard(fc, flower);
    const infoHtml  = renderInfoCard(detail);

    app.classList.remove('loading');
    app.innerHTML = `
      ${blogHtml}

      ${bloomHtml ? `<div class="section-heading">${T.forecastSection(spot.prefName, year, f.label)}</div>${bloomHtml}` : ''}

      ${infoHtml ? `<div class="section-heading">${T.infoSection}</div>${infoHtml}` : ''}

      <div class="section-heading">${T.mapSection}</div>
      <div class="map-embed-wrap">
        <iframe
          class="map-embed"
          src="https://maps.google.com/maps?q=${encodeURIComponent(spot.name)}&output=embed&hl=${T.mapsLang}"
          allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade">
        </iframe>
        <a class="map-link" href="${spot.mapUrl}" target="_blank" rel="noopener"
           data-track="click_google_maps" data-track-params='${JSON.stringify({spot: spot.name, flower})}'>
          ${T.openMaps}
        </a>
      </div>
    `;

    // Siblings
    const siblingsMount = document.getElementById('siblings-mount');
    if (siblingsMount) {
      const sibList = (spotsAll[prefKey] || []).filter(s => s.name !== spotName).slice(0, 4);
      if (sibList.length) {
        const cards = sibList.map(s => {
          const sid = idMapAll[flower]?.[s.name];
          const langPrefix = LANG !== 'zh' ? `${LANG}/` : '';
          const href = sid
            ? `${BASE}spot/${langPrefix}${flower}/${sid}.html`
            : `${BASE}spot.html?flower=${flower}&spot=${encodeURIComponent(s.name)}&pref=${prefKey}`;
          const sibDetail = detailAll[s.name] || {};
          const sibPeriod = sibDetail.period || s.period || '';
          return `
            <a class="spot-card" href="${href}">
              <div class="spot-info">
                <div class="spot-name">${s.name}</div>
                ${s.address ? `<div class="spot-address">📍 ${s.address}</div>` : ''}
                ${sibPeriod ? `<div class="spot-period-row">${T.estimatedPeriod}<span>${sibPeriod}</span></div>` : ''}
              </div>
              <div class="spot-arrow">›</div>
            </a>`;
        }).join('');
        siblingsMount.innerHTML = `
          <section class="siblings-section">
            <div class="section-heading">${T.moreSpots(spot.prefName, f.label)}</div>
            ${cards}
          </section>`;
      }
    }

  } catch(e) {
    console.error(e);
    app.classList.remove('loading');
    app.innerHTML = `<div class="error-msg"><p>${T.loadFail}</p></div>`;
  }
}

render();
