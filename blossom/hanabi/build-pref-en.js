/**
 * build-pref-en.js
 * 生成英文花火縣市頁面
 * 輸出：hanabi/pref/en/{ken}.html
 */

const fs   = require('fs');
const path = require('path');

const BASE_DIR  = __dirname;
const SITE_ROOT = 'https://junlando.com/blossom/hanabi';
const BUILD_DATE = new Date().toISOString().slice(0, 10);

const EVENTS = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'data/events.en.json'), 'utf8'));

const DOW_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const PREF_INTRO_EN = {
  tokyo:     { tagline: 'Edo tradition meets modern skyline — Tokyo is Japan\'s most iconic fireworks destination', body: 'Tokyo hosts Japan\'s largest and most celebrated fireworks festivals, from the historic Sumida River in summer to the spectacular Tokyo Bay Grand Fireworks in autumn. The Edo-era tradition of hanabi lives on across the city, with three major riverside venues often competing on the same weekend in late July — a stretch fireworks fans call "Tokyo Fireworks Week," drawing well over a million spectators.' },
  osaka:     { tagline: 'Tenjin Matsuri bonfires and fireworks — Osaka\'s passion for summer festivals is unrivaled in Kansai', body: 'Osaka\'s fireworks calendar is the densest in the Kansai region, spanning from the sacred Tenjin Matsuri in July to autumn events in October. The Tenjin Matsuri Hono-Hanabi, part of one of Japan\'s three great festivals, fills the Okawa River with illuminated boats and cascading shells. South Osaka\'s Izumisano Sea of Dreams Fireworks brings a different flavor with its oceanfront summer spectacle.' },
  kyoto:     { tagline: 'Ancient capital elegance — Arashiyama\'s Hozu River gorge frames Japan\'s most refined fireworks', body: 'Kyoto\'s fireworks events are known for precision and artistry, with music-synchronized shows set against temples and gorge landscapes. The Kyoto Art Fireworks in June is a Kansai benchmark for scale and creativity; the Hozugawa Fireworks transforms a dramatic river canyon into a natural amphitheater; and the Miyazu Lantern Float adds a poetic counterpoint of floating lanterns to the summer sky.' },
  hokkaido:  { tagline: 'Pure northern summers — from Lake Toya\'s nightly show to autumn art fireworks on vast prairies', body: 'Hokkaido\'s fireworks season runs from April to September in a cooler climate that makes outdoor viewing especially comfortable. Lake Toya Long Period Fireworks offers a rare nightly schedule from late April to late October, making it the only reliable fireworks you can plan around any summer date. The Hokkaido Art Fireworks in September combines music synchronization with panoramic grassland scenery for a truly world-class experience.' },
  niigata:   { tagline: 'Nagaoka\'s resurrection blossoms and three-shaku shells — Niigata is the cradle of Japan\'s fireworks craft', body: 'Niigata Prefecture is home to many of Japan\'s most respected fireworks artisan families, particularly around Nagaoka City. The Nagaoka Grand Fireworks Festival\'s "White Chrysanthemum" and "Sei-Shakudama" are benchmarks of technical excellence; Katakai\'s Four-Shaku Shell holds the world record for the largest single shell, sending a burst over 800 meters wide across two consecutive nights.' },
  shizuoka:  { tagline: 'Mount Fuji backdrop and Suruga Bay — Shizuoka\'s stages come with Japan\'s most scenic natural settings', body: 'Shizuoka\'s fireworks venues are defined by their exceptional geography. The Atami Sea Fireworks Festival, held multiple times a year in a bowl-shaped harbor, produces a bass resonance that fireworks fans describe as the most physically intense in Japan. Fukuroi Enshu and other valley-based venues pair local festival traditions with the green mountainscapes of inland Shizuoka.' },
  hyogo:     { tagline: 'Kobe harbor lights and Seto Inland Sea — Hyogo\'s fireworks glow brighter against the Rokko mountain backdrop', body: 'Hyogo Prefecture spans summer and autumn with events from seaside Kobe to castle-town Himeji. The Kobe Port Minato HANABI runs multiple autumn nights at Meriken Park — a rare multi-night autumn series in Kansai. Ashiya Summer Carnival\'s peninsula setting creates an intimate, couple-friendly atmosphere; Himeji Port\'s sea fireworks use UNESCO-listed Himeji Castle as an unforgettable backdrop.' },
  kanagawa:  { tagline: 'Yokohama harbor spectacle and Tama River autumn shells — connecting the port city to relaxed riverside evenings', body: 'Kanagawa\'s Yokohama Port Opening Festival Fireworks in June is one of the largest June fireworks events in the Kanto region, blending laser projections and live music with harbor-front pyrotechnics. The autumn Tama River Fireworks Festival continues a shared Kanagawa-Tokyo riverside tradition beloved by families and couples looking for a relaxed urban escape in October.' },
  aichi:     { tagline: 'Ieyasu\'s castle town and Tokai\'s fireworks crossroads — Okazaki is eastern Japan\'s summer pyrotechnics anchor', body: 'Aichi\'s fireworks culture blends samurai heritage with modern festival energy. The Okazaki Castle Summer Fireworks Festival — set beneath the birthplace of shogun Tokugawa Ieyasu — is one of the Tokai region\'s largest events, with the castle ruins silhouetted against the bursts. Toyota\'s Oiden Festival adds a youthful urban energy and is one of the region\'s most popular local summer celebrations.' },
  ibaraki:   { tagline: 'Koga\'s Tone River landscapes and Tsuchiura\'s national competition — Ibaraki is where artistry gets judged', body: 'Ibaraki Prefecture hosts one of Japan\'s three great fireworks competitions — the Tsuchiura National Fireworks Competition in November, where Japan\'s top artisans compete before thousands of connoisseurs. Summer\'s Koga Fireworks Festival offers a contrast: a scenic evening above the Watarase River with the relaxed atmosphere of a Kanto river festival.' },
  yamagata:  { tagline: 'Akagawa\'s 700-meter horizontal burst and the soul of regional hanabi — Yamagata moves you', body: 'Yamagata\'s Akagawa Fireworks is ranked by Japanese fireworks enthusiasts among the most emotionally powerful events in the country, celebrated for its extraordinary 700-meter-wide horizontal spread rather than sheer volume. The September Sakata Fireworks on the Mogami River closes the Yamagata season with a quiet autumn beauty that matches the prefecture\'s understated appeal.' },
  akita:     { tagline: 'Omagari\'s national competition — Akita is where Japan\'s fireworks masters compete for the ultimate honor', body: 'Akita Prefecture\'s Omagari National Fireworks Competition is one of Japan\'s three great fireworks events and the most prestigious technical competition in the craft. Held on the last Saturday of August along the Omono River, it draws over 800,000 spectators and is considered the Olympics of Japanese pyrotechnics. The cool Akita summer provides perfect visibility and a fitting backdrop for the season\'s finest artistry.' },
  nagano:    { tagline: 'Lake Suwa\'s mountain echo miracle — the most spectacular tens-of-thousands-shell stage in Japan', body: 'Nagano\'s Lake Suwa Festival Lakeside Fireworks, held every August 15, harnesses the natural acoustics of a high-altitude lake surrounded by mountains to create a surround-sound fireworks experience unlike any other. With tens of thousands of shells lighting the Yatsugatake and Southern Alps silhouettes, and their reflection shimmering on the calm lake, this is consistently voted one of Japan\'s must-see fireworks destinations.' },
  mie:       { tagline: 'Kumano\'s Pacific coastline thunder — where Kii Peninsula pilgrimage culture and pyrotechnics converge', body: 'Mie Prefecture\'s Kumano Grand Fireworks Festival, held every August 17 on the Kumano coastline, is one of Japan\'s most dramatically sited events. Shells are launched from the sea, reflecting on the Kuroshio Current beneath them, while the religious atmosphere of the Bon season and the ancient pilgrimage landscape lend a solemnity that transforms the spectacle into something close to a spiritual experience.' },
  shimane:   { tagline: 'Shinji Lake\'s perfect mirror — Matsue Water City Festival is San\'in\'s most dreamlike two-night fireworks', body: 'Shimane Prefecture\'s Matsue Water City Festival Lake Fireworks runs two consecutive nights over tranquil Lake Shinji, with every burst reflected in perfect stillness on the water. Matsue Castle\'s keep appears in silhouette between the shells, and the cool Sea of Japan breeze carries the sound of the Izumo mythology landscape across the water, creating San\'in\'s most culturally resonant summer evening.' },
  fukuoka:   { tagline: 'Chikugo River summer thunder — the festival that belongs to all of Kyushu\'s northern heartland', body: 'Fukuoka Prefecture\'s Chikugo River Fireworks Festival in Kurume is one of Kyushu\'s largest events, with over ten thousand shells launched along the broad riverbank. The Fukuoka-Saga border location makes this a shared summer memory across northern Kyushu, and Hakata\'s vibrant festival culture amplifies the energy of the crowd on both sides of the river.' },
  kumamoto:  { tagline: 'Yatsushiro\'s national competition — Kyushu\'s most important stage for fireworks craftsmanship', body: 'Kumamoto Prefecture\'s Yatsushiro National Fireworks Competition in October is Kyushu\'s largest technical fireworks competition, drawing master artisans from across Japan to compete on the wide Kuma River. The autumn timing means cooler air and sharper color saturation, and the Kumamoto fireworks tradition remains one of the strongest regional cultures outside the three great competition venues.' },
  miyagi:    { tagline: 'Sendai Tanabata\'s starry overture — Tohoku\'s grandest summer festival begins with fireworks', body: 'Miyagi Prefecture\'s Sendai Fireworks Festival launches every August 5 as the official pre-event for the Sendai Tanabata Festival — Japan\'s largest Tanabata celebration. The Hirose River banks host the display, and the combination of fireworks, yukata-clad crowds, and the anticipation of the next day\'s bamboo decorations creates an irreplaceable Tohoku midsummer atmosphere.' },
  aomori:    { tagline: 'Brief northern summer burning bright — Aomori\'s fireworks carry the intensity of a season too short to waste', body: 'Aomori Prefecture\'s Aomori Fireworks Festival is held concurrently with the famous Aomori Nebuta Festival, embedding fireworks within one of Tohoku\'s most spectacular lantern float parades. The short Tohoku summer gives local fireworks a particular emotional charge, and the shells burst above Mutsu Bay with a sense of urgency and joy that defines the northern Japanese summer.' },
  kagawa:    { tagline: 'Sanuki Takamatsu Festival and Seto Inland Sea islands — Shikoku\'s largest city celebrates summer with harbor fireworks', body: 'Kagawa Prefecture\'s Sanuki Takamatsu Festival Fireworks are launched over Takamatsu Port with the Seto Inland Sea island chain as a backdrop — creating one of Shikoku\'s most photogenic festival scenes. The mid-August Bon season brings crowds from across the island, and a trip combining the fireworks with the Takamatsu-area islands of the Setouchi Art Festival is a popular regional itinerary.' },
  hiroshima: { tagline: 'Ashida River Bon memorial lights — Hiroshima\'s fireworks on August 15 carry a quiet weight no other date can hold', body: 'Hiroshima Prefecture\'s Fukuyama Summer Festival Ashidagawa Fireworks, held on August 15, carries a historical resonance unique in Japan. The broad Ashida River allows a full spread of shells, and the Bon season\'s spirit of remembrance gives the event a tone that visitors often describe as simultaneously joyful and moving. It is the most important summer gathering in eastern Hiroshima Prefecture.' },
  yamaguchi: { tagline: 'Two shores, one straits — the only cross-prefecture simultaneous fireworks in Japan', body: 'Yamaguchi Prefecture\'s Kanmon Straits Fireworks Festival is Japan\'s only event where two prefectures simultaneously fire shells from opposite banks, with Shimonoseki and Kitakyushu\'s Moji Port launching synchronized displays across a 600-meter channel. The narrow straits create a dramatic tunnel of light and sound that makes this one of the most uniquely theatrical fireworks experiences in the country.' },
  gifu:      { tagline: 'Nagaragawa\'s crystal reflection beneath Gifu Castle — the clearest river in the Tokai region provides the perfect mirror', body: 'Gifu Prefecture\'s Nagaragawa Fireworks Festival launches shells above the crystal-clear Nagara River, whose water reflects the burst patterns in sharp detail beneath the silhouette of Gifu Castle on Kinkazan hill. As one of the Tokai region\'s cleanest rivers, the Nagara provides a reflection stage that many other venues cannot match, and the summer cormorant fishing tradition of ukai adds cultural depth to the evening.' },
  ishikawa:  { tagline: 'Kaga\'s million-koku summer thunder — Hokuriku\'s biggest technical competition draws Japan\'s finest artisans', body: 'Ishikawa Prefecture\'s Kawakita Grand Festival is one of the largest fireworks competitions in the Hokuriku region, held along the Tedori River on August 1. National-level artisans compete under the stars, drawing audiences from across the Kaga-Noto peninsula. The event marks the peak of the Kanazawa-area summer season and is one of the Hokuriku region\'s most important outdoor gatherings.' },
  tochigi:   { tagline: 'Watarase River summer romance — Ashikaga\'s fireworks are Tochigi\'s most beloved annual event', body: 'Tochigi Prefecture\'s Ashikaga Fireworks Festival along the Watarase River is the largest summer fireworks event in the prefecture. The wide river channel gives shells room to fully bloom, and the gentle current carries reflections downstream as spectators line both banks. Ashikaga\'s historic textile culture gives the festival an extra layer of local pride that sets it apart from purely urban events.' },
  chiba:     { tagline: 'Tokyo Bay beach spectacle — Makuhari\'s summer fireworks are the Kanto coast\'s biggest beach-front event', body: 'Chiba Prefecture\'s Makuhari Beach Fireworks Festival is one of the largest beachfront fireworks events in the Greater Tokyo area, held along Tokyo Bay on August 1. The Makuhari Messe skyline provides a modern backdrop, and the combination of beachside yukata crowds and urban coastal energy creates a distinctly contemporary summer festival atmosphere that draws visitors from across the Tokyo metropolitan area.' },
  shiga:     { tagline: 'Japan\'s largest lake and boundless sky — Biwako Grand Fireworks is the visual apex of the Kinki fireworks calendar', body: 'Shiga Prefecture\'s Biwako Grand Fireworks Festival unfolds over Japan\'s largest freshwater lake, offering an unobstructed 360-degree panorama as shells rise against the Hiei and Suzuka mountain silhouettes. The sheer scale of Lake Biwa — over 60 km long — allows bursts to spread in ways physically impossible in river or harbor venues, and the combined reflection and mountain echo create a multi-sensory event unlike anything else in the Kinki region.' },
  okinawa:   { tagline: 'Japan\'s first summer fireworks — Okinawa\'s Ryukyu Sea Blaze ignites the national season three months ahead', body: 'Okinawa Prefecture\'s Ryukyu Kaienai is the earliest major summer fireworks festival in Japan, launching every April near Naha — a full season before mainland events begin. The event combines traditional Ryukyu music and tropical beachside atmosphere in a way that feels nothing like a mainland Japanese festival, offering visitors a uniquely Okinawan entry point into the summer fireworks calendar.' },
  saitama:   { tagline: 'Winter festival\'s impossible fireworks — Chichibu Yomatsuri launches shells into a December night sky', body: 'Saitama Prefecture\'s Chichibu Night Festival Fireworks is one of Japan\'s most extraordinary seasonal contrasts: a major fireworks display in the middle of winter, on December 3, as the climax of one of Japan\'s three great float festivals (hikiyama). Freezing air makes the shells\' colors appear more vivid and saturated than any summer event, and the combination of illuminated floats, festival drums, and cold-sky fireworks is a sensory experience unique in the Japanese festival calendar.' },
};

function getPrefIntroEN(ken, location) {
  return PREF_INTRO_EN[ken] || {
    tagline: `${location} Fireworks Festivals — summer spectacles across Japan's diverse landscapes`,
    body: `${location}'s fireworks festivals are cherished annual events that bring local communities together each summer. Whether set against rivers, lakes, or coastal waters, each event offers a unique visual experience shaped by the prefecture's natural landscape and cultural traditions.`
  };
}

function esc(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function isLongRunning(ev) {
  if (!ev.endDate) return false;
  return (new Date(ev.endDate+'T00:00:00') - new Date(ev.date+'T00:00:00')) / 86400000 > 7;
}

function formatDateLabel(ev) {
  const d = new Date(ev.date + 'T00:00:00');
  const m = MONTHS[d.getMonth()+1];
  const day = d.getDate();
  const dow = DOW_EN[d.getDay()];
  if (isLongRunning(ev)) {
    const e = new Date(ev.endDate + 'T00:00:00');
    return `${m} ${day} – ${MONTHS[e.getMonth()+1]} ${e.getDate()}`;
  }
  if (ev.endDate) {
    const e = new Date(ev.endDate + 'T00:00:00');
    return `${m} ${day} & ${e.getDate()} (${dow}/${DOW_EN[e.getDay()]})`;
  }
  return `${m} ${day} (${dow})`;
}

// Group events by ken
const byKen = {};
EVENTS.forEach(ev => {
  if (!byKen[ev.ken]) byKen[ev.ken] = { location: ev.location, evts: [] };
  byKen[ev.ken].evts.push(ev);
});
Object.values(byKen).forEach(g => g.evts.sort((a,b) => a.date.localeCompare(b.date)));

const outDir = path.join(BASE_DIR, 'pref/en');
fs.mkdirSync(outDir, { recursive: true });

let count = 0;
Object.entries(byKen).forEach(([ken, { location, evts }]) => {
  const intro     = getPrefIntroEN(ken, location);
  const canonical = `${SITE_ROOT}/pref/en/${ken}.html`;
  const zhCanon   = `${SITE_ROOT}/pref/${ken}.html`;
  const title     = `${location} Fireworks Festivals 2026 | Junlando`;
  const desc      = `${intro.tagline}. ${evts.length} events in ${location}. Dates, venues & access info.`;
  const heroId    = evts[0].id;

  const jsonld = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Fireworks Festivals", "item": `${SITE_ROOT}/en/` },
      { "@type": "ListItem", "position": 2, "name": location, "item": canonical },
    ]
  });

  const cardsHtml = evts.map(ev => {
    const dateLabel = esc(formatDateLabel(ev));
    const longBadge = isLongRunning(ev) ? `<span class="card-long-badge">Long-running</span>` : '';
    const descHtml  = ev.note ? `<div class="card-subtitle">${esc(ev.note)}</div>` : '';
    return `
      <a class="event-card" href="../../../spot/en/${esc(ev.id)}.html">
        <div class="card-img-wrap">
          <img class="card-img" src="../../images/${esc(ev.id)}/1.jpg" alt="${esc(ev.name)}" loading="lazy" onerror="this.closest('.card-img-wrap').style.background='#e8e9ec'" />
          ${longBadge}
        </div>
        <div class="card-body">
          <div class="card-date-row">
            <span class="card-date-chip">${dateLabel}</span>
          </div>
          <div class="card-name">${esc(ev.name)}</div>
          ${descHtml}
          <div class="card-arrow">View details →</div>
        </div>
      </a>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${SITE_ROOT}/images/${heroId}/1.jpg" />
  <link rel="canonical" href="${canonical}" />
  <link rel="alternate" hreflang="zh-Hant" href="${zhCanon}" />
  <link rel="alternate" hreflang="en" href="${canonical}" />
  <link rel="icon" href="../../../../favicon.ico" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet" />
  <script type="application/ld+json">${jsonld}</script>
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
    .hero { position:relative; width:100%; height:300px; overflow:hidden; background:#1a1a2e; }
    .hero-img { width:100%; height:100%; object-fit:cover; display:block; opacity:0.72; }
    .hero-overlay { position:absolute; inset:0; background:linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.05) 55%); }
    .hero-content { position:absolute; bottom:0; left:0; right:0; padding:24px 28px; }
    .hero-label { font-size:13px; font-weight:600; color:rgba(255,255,255,0.6); margin-bottom:6px; }
    .hero-title { font-size:32px; font-weight:800; color:white; line-height:1.2; margin-bottom:8px; }
    .hero-count { font-size:14px; color:rgba(255,255,255,0.8); }
    .main { max-width:900px; margin:0 auto; padding:32px 20px 60px; }
    .pref-intro { margin-bottom:36px; }
    .pref-tagline { font-size:22px; font-weight:800; color:var(--text); padding-bottom:10px; border-bottom:2px solid var(--border); margin-bottom:14px; line-height:1.4; }
    .pref-body { font-size:15px; color:var(--text-sub); line-height:1.85; }
    .section-title { font-size:18px; font-weight:700; color:var(--text); margin-bottom:16px; display:flex; align-items:center; gap:8px; }
    .event-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px; }
    .event-card { background:white; border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; text-decoration:none; color:inherit; display:flex; flex-direction:column; transition:box-shadow .18s,transform .18s; }
    .event-card:hover { box-shadow:0 4px 18px rgba(0,0,0,.1); transform:translateY(-2px); }
    .card-img-wrap { position:relative; aspect-ratio:16/9; overflow:hidden; background:var(--gray); }
    .card-img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .25s; }
    .event-card:hover .card-img { transform:scale(1.04); }
    .card-long-badge { position:absolute; top:10px; left:10px; background:#f59e0b; color:white; font-size:11px; font-weight:700; padding:3px 9px; border-radius:10px; }
    .card-body { padding:14px 16px; flex:1; display:flex; flex-direction:column; }
    .card-date-row { margin-bottom:6px; }
    .card-date-chip { font-size:12px; font-weight:700; background:var(--hanabi-light); color:var(--hanabi-dark); padding:3px 10px; border-radius:12px; }
    .card-name { font-size:14px; font-weight:700; color:var(--text); margin-bottom:4px; line-height:1.4; }
    .card-subtitle { font-size:12px; color:var(--text-sub); line-height:1.5; margin-bottom:6px; }
    .card-arrow { margin-top:auto; font-size:12px; color:var(--active); font-weight:600; }
    .back-link { display:inline-flex; align-items:center; gap:6px; font-size:13px; color:var(--active); text-decoration:none; font-weight:600; margin-top:32px; }
    .back-link:hover { text-decoration:underline; }
    footer { background:white; border-top:1px solid var(--border); padding:20px; text-align:center; font-size:12px; color:var(--text-sub); }
    footer a { color:var(--active); text-decoration:none; }
    @media (max-width:600px) { .hero { height:220px; } .hero-title { font-size:24px; } .hero-content { padding:16px 18px; } }
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
    <span class="breadcrumb-current">${esc(location)}</span>
  </div>
</nav>

<div class="hero">
  <img class="hero-img" src="../../images/${heroId}/1.jpg" alt="${esc(location)} fireworks" />
  <div class="hero-overlay"></div>
  <div class="hero-content">
    <div class="hero-label">🎆 Fireworks Festivals 2026</div>
    <h1 class="hero-title">${esc(location)}</h1>
    <div class="hero-count">${evts.length} event${evts.length > 1 ? 's' : ''} listed</div>
  </div>
</div>

<div class="main">
  <div class="pref-intro">
    <div class="pref-tagline">${esc(intro.tagline)}</div>
    <p class="pref-body">${esc(intro.body)}</p>
  </div>

  <div class="section-title">🎇 All Events in ${esc(location)}</div>
  <div class="event-grid">
${cardsHtml}
  </div>

  <a class="back-link" href="../../en/">← All Fireworks Festivals</a>
</div>

<footer>
  <p>© 2026 Junlando | <a href="../../en/">Fireworks Festivals</a> · <a href="../../../../en/index.html">Flower Forecast</a></p>
  <p style="margin-top:4px">Last updated: ${BUILD_DATE}</p>
</footer>
</body>
</html>`;

  fs.writeFileSync(path.join(outDir, `${ken}.html`), html, 'utf8');
  count++;
});

console.log(`✅ EN pref: ${count} pages → pref/en/`);
