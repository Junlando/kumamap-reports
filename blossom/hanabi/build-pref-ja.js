/**
 * build-pref-ja.js
 * 生成日文花火縣市頁面
 * 輸出：hanabi/pref/ja/{ken}.html
 */

const fs   = require('fs');
const path = require('path');

const BASE_DIR  = __dirname;
const SITE_ROOT = 'https://junlando.com/blossom/hanabi';
const BUILD_DATE = new Date().toISOString().slice(0, 10);

const EVENTS = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'data/events.ja.json'), 'utf8'));

const DOW_JA = ['日','月','火','水','木','金','土'];

const PREF_INTRO_JA = {
  tokyo:     { tagline: '江戸の伝統と現代の夜景が共演する、全日本最大規模の花火の聖地', body: '東京都は日本最大規模の花火大会を集中して開催しており、夏の隅田川から秋の東京湾大花火まで、夏秋を通じてシーズンが続きます。江戸時代から受け継がれた花火文化は都会の夜景と融合し、7月末から8月初旬にかけて足立・江戸川・板橋の三大会場が同時期に競演する「東京花火ウィーク」には、延べ100万人超の観客が訪れます。' },
  osaka:     { tagline: '天神祭の篝火船と紅梅花火が彩る、大阪は日本で最も熱い夏祭り文化を持つ都市', body: '大阪府の花火大会密度は関西随一で、7月の天神祭から10月の淀川まで四季を通じて楽しめます。天神祭奉納花火は日本三大祭の締めくくりとして大川の水面を花火と船で染め上げ、8月の泉州夢花火は大阪湾の南側で夏の海辺ならではの臨場感を演出します。' },
  kyoto:     { tagline: '古都の雅と千年の祭り、嵐山保津川峡谷が花火の美しさを極限まで高める', body: '京都府の花火大会は精緻さで知られ、数千から数万発の打ち上げで音楽との完全同期演出を実現します。6月の京都芸術花火は関西における6月の最高水準。8月の保津川花火は峡谷地形が生み出す天然音響回廊が圧倒的な迫力を生み、宮津灯籠流し花火は舞鶴湾の月夜を花火と灯籠が彩る詩的な体験です。' },
  hokkaido:  { tagline: '道北の蒼空と大地、洞爺湖の毎日花火から秋のアート花火まで、北海道の夏は本州より純粋', body: '北海道の花火シーズンは4月から9月まで続き、涼しい気候が野外観覧を格別に快適にします。洞爺湖長期花火は4月下旬から10月下旬まで毎夜20時45分に打ち上げられる日本唯一の常駐花火。9月の北海道芸術花火は音楽同期演出を雄大な草原で披露し、世界水準の花火体験を提供します。' },
  niigata:   { tagline: '長岡の復興の花と三尺玉の壮烈な物語、新潟は日本花火技術の発祥の聖地', body: '新潟県は日本で最も重要な花火師の産地のひとつであり、長岡市は花火師一族の本拠地です。長岡まつり大花火大会の「白菊」と「正三尺玉」は技術の頂点。片貝まつり花火は世界最大の単発煙火である四尺玉を2日連続で打ち上げ、直径800メートル以上の大輪を夜空に咲かせます。' },
  shizuoka:  { tagline: '富士山麓と駿河湾、静岡の花火舞台は日本最美の天然背景を自然に備えている', body: '静岡県の花火大会は地形の美しさで際立ちます。熱海海上花火大会は年間複数回開催され、盆地状の湾地形が生む重低音の音響効果は「震動感日本一」として花火ファンに知られています。袋井遠州やその他の山間会場は静岡の伝統的な祭り雰囲気と組み合わさり、文化的な深みのある夏の夜を提供します。' },
  hyogo:     { tagline: '神戸港の夜景と瀬戸内海、兵庫の花火は六甲山系に包まれてより一層輝く', body: '兵庫県の花火大会は夏から秋にかけて開催され、海景と都市景観の両方を楽しめます。秋の神戸港みなとHANABIはメリケンパークで複数夜連続開催される関西では珍しい秋の連日花火。芦屋夏のカーニバルは半島地形を活かした親密な雰囲気のカップル向け花火。姫路港の海上花火は世界遺産の姫路城を背景に唯一無二の文化的景観を演出します。' },
  kanagawa:  { tagline: '横浜港の夜景と多摩川の秋煙火、神奈川は港街の繁栄と川辺の安らぎをつなぐ', body: '神奈川県の横浜開港祭花火は6月の関東最大規模の港湾花火として、レーザー光彫刻や音楽と組み合わせた未来的な演出を披露します。秋の多摩川花火大会は神奈川と東京の市民が共に楽しむ悠久の川辺伝統を継承し、10月に親子やカップルに最も愛される都市郊外の花火大会として定着しています。' },
  aichi:     { tagline: '岡崎城下、家康公の故郷、東海花火文化の最も重要な交差点', body: '愛知県の花火大会は歴史文化と現代の祭りが融合しています。岡崎城下家康公夏まつり花火大会は東海地区最大規模の会場のひとつで、城跡の雰囲気が花火に歴史的な重みを与えます。豊田おいでんまつりは現代工業都市の活気あふれる夏の祭典として多くの若者を魅了しています。' },
  ibaraki:   { tagline: '古河の利根川水景と土浦の三大競技、茨城は花火技術競演の最高峰の聖地', body: '茨城県は日本三大花火競技大会のひとつ、土浦全国花火競技大会を毎年11月に開催し、全国の一流花火師が技を競う花火芸術鑑賞の最高舞台です。夏の古河花火大会は利根川の水景を背景に、関東の夏の爽やかな花火体験を提供します。' },
  yamagata:  { tagline: '赤川の700メートル横幅の震撼と、山形が受け継ぐ日本で最も心を動かす地方花火魂', body: '山形県の赤川花火大会は横幅700メートルに及ぶ横打ちで知られ、日本の花火ファンが「感動度」で最高評価を与える地方花火として名高く、規模より感動の深さを追求する伝統美学を体現しています。9月の酒田花火大会は最上川の水辺で、山形の秋の情緒の中に一年間の完璧な締めくくりを刻みます。' },
  akita:     { tagline: '大曲の全国競技、秋田は花火師が最も憧れる技術の殿堂', body: '秋田県大仙市の全国花火競技大会（大曲の花火）は、土浦・諏訪と並ぶ日本三大花火のひとつで、花火師にとって最高の栄誉の舞台です。毎年8月最終土曜日、全国の花火師が雄物川河川敷に集い、夏の終わりに最も洗練された技術競演を披露します。80万人超の観客が訪れます。' },
  nagano:    { tagline: '高山湖の音響の奇跡、諏訪湖は日本最壮観な数万発規模の花火舞台', body: '長野県の諏訪湖祭湖上花火大会は毎年8月15日に開催され、標高797メートルの高山湖の地形を活かし、四方の山壁が天然音響回廊を形成。数万発の打ち上げ数は一夜の大会としては全国最大級です。花火が静かな湖面に映り、山々のシルエットと織りなす立体的な全景は「一生に一度は見たい」と多くのファンに評されています。' },
  mie:       { tagline: '熊野古道の終点に轟く海上の爆音、三重の花火と信仰が太平洋の岸辺で交わる', body: '三重県の熊野大花火大会は太平洋に面した熊野市の海岸で毎年8月17日に開催され、日本の花火大会の中で最も壮大なロケーションのひとつです。海上から打ち上げられた花火が黒潮の流れる太平洋に映し出され、盆節の宗教的雰囲気と視覚的衝撃が交融し、毎年多くの巡礼者と花火ファンが同じ場所に集います。' },
  shimane:   { tagline: '神話の国の湖上鏡面、松江水郷祭は島根の夏で最も夢幻的な二日間の花火', body: '島根県の松江水郷祭湖上花火大会は静かな宍道湖の上で2夜連続開催され、每夜の花火が湖面に完璧な鏡像を描きます。松江城の天守閣が花火の光の中にシルエットで浮かび上がり、日本海の涼風と出雲神話の大地の特別な雰囲気が、山陰地方で最も文化的な深みのある夏の体験を作り出します。' },
  fukuoka:   { tagline: '九州最大の河川に響く夏の夜の盛典、筑後川花火は博多の人々が共有する夏の記憶', body: '福岡県の筑後川花火大会は久留米市の筑後川河川敷で開催される九州最大規模の花火大会のひとつです。1万発超の花火が河岸に沿って打ち上げられ、地元夏祭りの賑わいとともに、福岡・佐賀両県の人々が共有する夏の記憶となっています。' },
  kumamoto:  { tagline: '八代全国競技、九州で最も重要な花火技術の競演舞台', body: '熊本県八代市の全国花火競技大会は九州最大の花火競技会で、毎年10月に全国の花火師が球磨川の河川敷で技を競います。球磨川の広い水面が花火を十分に広げられる環境を提供し、秋の涼しい九州の気候が夏よりも観賞条件をさらに高めます。' },
  miyagi:    { tagline: '仙台七夕祭前夜の星空花火、東北最大の夏祭りの絢爛な序章', body: '宮城県の仙台花火祭は仙台七夕まつりの前夜祭として毎年8月5日に広瀬川の河岸で開催され、日本最大の七夕祭りの幕開けを告げます。東北最大の都市の夏の夜が花火で沸き上がり、七夕見物に訪れる旅行者にとっても外せない行程の一つとなっています。' },
  aomori:    { tagline: '青森の祭り文化が紡ぐ花火伝統、津軽海峡辺りの短い夏が最も輝く', body: '青森県の青森花火大会は有名な青森ねぶた祭と同時期に開催され、東北で最も壮大なねぶた山車行列とともに行われる花火です。短い東北の夏が地元の人々に花火への特別な思いを抱かせ、花火が津軽海峡の夜空で輝く光景は、一年で最も貴重な夏の記憶となります。' },
  kagawa:    { tagline: '讃岐高松まつりと瀬戸内海の島々、四国最大の都市が夏を港の花火で祝う', body: '香川県の讃岐高松まつり花火大会は高松港の海上で打ち上げられ、瀬戸内海の島々を天然の背景とした四国で最も絵になる花火の場面を作り出します。8月中旬のお盆期間には島内各地から人々が集まり、花火と高松周辺の瀬戸内芸術祭の島めぐりを組み合わせた旅程も人気です。' },
  hiroshima: { tagline: '芦田川の夏夜に灯る平和の祈り、広島の花火はお盆の8月15日に特別な歴史の重みを持つ', body: '広島県の福山夏まつり芦田川花火大会は毎年8月15日に開催され、広島県では純粋な娯楽を超えた歴史的な意味を持つ日です。芦田川の広い川面が花火を十分に広げ、お盆の慰霊の雰囲気が喜びと感慨を同時に伝える体験と評されることが多く、広島県東部の市民にとって最も大切な夏の盛典です。' },
  yamaguchi: { tagline: '関門海峡の両岸から対打ち、山口と福岡による日本唯一の越県同時花火', body: '山口県下関市の関門海峡花火大会は、対岸の福岡県北九州市門司港と同期して打ち上げられる日本唯一の越県対打ち花火大会です。最も狭い場所で600メートルしかない海峡の上空で両岸の花火が交わり、他では体験できない劇場的な視覚体験を生み出します。' },
  gifu:      { tagline: '清流長良川が天守閣を映し出す、岐阜城下で最も美しい夏の夜の水景花火', body: '岐阜県の長良川花火大会は岐阜城の麓を流れる清流長良川の上空に花火を打ち上げ、河面の倒影と金華山の天守閣のシルエットが独特の花火の地景を作り出します。東海地区で最も水が澄んだ河川のひとつである長良川は、花火の純粋な倒影を映し出す最良の舞台を提供します。' },
  ishikawa:  { tagline: '加賀百万石の夏の轟き、北陸最大規模の全国競技会場', body: '石川県の川北大会は北陸地区最大規模の花火大会のひとつで、8月1日に手取川河川敷で開催されます。全国一流の花火師が競い合い、加賀・能登各地から観客が集まります。金沢近郊の夏シーズンのピークを飾る最も重要な野外イベントです。' },
  tochigi:   { tagline: '渡良瀬川の夏夜のロマンス、足利の花火は栃木で最も愛される年間行事', body: '栃木県の足利花火大会は渡良瀬川沿いで開催される県内最大の夏の花火大会です。広い川道が花火を十分に広げる環境を提供し、川面に映る倒影が穏やかな流れとともに揺れる中、両岸に観客が並びます。足利市の伝統的な織物産業がこの祭りに地元への誇りという特別な価値を加えています。' },
  chiba:     { tagline: '東京湾に輝く夜、幕張の夏花火は関東海岸で最大のビーチフロントイベント', body: '千葉県の幕張ビーチ花火フェスタは東京湾沿いの海岸で8月1日に開催される首都圏最大規模のビーチフロント花火大会のひとつです。幕張新都心のスカイラインが現代的な背景を提供し、浴衣姿の人々と都市型海岸の活気が相まって、東京圏から多くの来場者を引きつける夏祭りの雰囲気を作り出します。' },
  shiga:     { tagline: '日本最大の淡水湖と果てしない空、琵琶湖大花火は近畿花火カレンダーの頂点', body: '滋賀県の琵琶湖大花火大会は日本最大の湖の水面で開催され、比叡山と鈴鹿山系のシルエットを背景に360度の大パノラマを誇ります。琵琶湖の広大な水面は河川や港では物理的に不可能な規模で花火を広げることを可能にし、水面の倒影と山々のこだまが生み出す多感覚的な体験は近畿地方で他に類を見ません。' },
  okinawa:   { tagline: '全日本で最初に夏を迎える花火大会、沖縄の琉球海炎祭が日本の花火シーズンを3ヶ月先駆けて火蓋を切る', body: '沖縄県の琉球海炎祭は日本で最も早い夏の花火大会で、毎年4月に那覇近郊の海辺で開催されます。本州の各大会場より3ヶ月も早く夏を先取りし、琉球の伝統音楽と熱帯のビーチが本州の花火とは一線を画す独特の沖縄らしい体験を生み出します。日本の花火シーズンの開幕を告げる最初の一発でもあります。' },
  saitama:   { tagline: '冬祭りの花火の奇跡、秩父夜祭は日本三大曳山祭の圧巻の幕引きを花火で飾る', body: '埼玉県の秩父夜祭花火大会は日本三大曳山祭のひとつ、秩父夜祭の締めくくりとして12月3日の冬の夜空に打ち上げられます。曳山（山車）の行列の灯りと冬の花火の組み合わせは日本で非常に珍しい冬祭りの光景で、冷たい空気が花火の発色をより鮮やかで濃厚にします。' },
};

function getPrefIntroJA(ken, location) {
  return PREF_INTRO_JA[ken] || {
    tagline: `${location}の花火大会 — 日本各地の夜空で輝く地域の魅力`,
    body: `${location}の花火大会は、地元の人々が大切にしている年間行事です。河川・湖・海辺など、それぞれの地形が花火大会に独自のビジュアル体験をもたらします。`
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
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const dow = DOW_JA[d.getDay()];
  if (isLongRunning(ev)) {
    const e = new Date(ev.endDate + 'T00:00:00');
    return `${m}/${day} 〜 ${e.getMonth()+1}/${e.getDate()}`;
  }
  if (ev.endDate) {
    const e = new Date(ev.endDate + 'T00:00:00');
    return `${m}/${day}・${e.getDate()}（連続2日）`;
  }
  return `${m}月${day}日（${dow}）`;
}

// Group events by ken
const byKen = {};
EVENTS.forEach(ev => {
  if (!byKen[ev.ken]) byKen[ev.ken] = { location: ev.location, evts: [] };
  byKen[ev.ken].evts.push(ev);
});
Object.values(byKen).forEach(g => g.evts.sort((a,b) => a.date.localeCompare(b.date)));

const outDir = path.join(BASE_DIR, 'pref/ja');
fs.mkdirSync(outDir, { recursive: true });

let count = 0;
Object.entries(byKen).forEach(([ken, { location, evts }]) => {
  const intro     = getPrefIntroJA(ken, location);
  const canonical = `${SITE_ROOT}/pref/ja/${ken}.html`;
  const zhCanon   = `${SITE_ROOT}/pref/${ken}.html`;
  const title     = `${location}の花火大会 2026 | Junlando`;
  const desc      = `${intro.tagline}。${location}の${evts.length}件の花火大会情報。開催日・会場・アクセスを詳しく紹介。`;
  const heroId    = evts[0].id;

  const jsonld = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "花火大会", "item": `${SITE_ROOT}/ja/` },
      { "@type": "ListItem", "position": 2, "name": location, "item": canonical },
    ]
  });

  const cardsHtml = evts.map(ev => {
    const dateLabel = esc(formatDateLabel(ev));
    const longBadge = isLongRunning(ev) ? `<span class="card-long-badge">長期開催</span>` : '';
    const descHtml  = ev.note ? `<div class="card-subtitle">${esc(ev.note)}</div>` : '';
    return `
      <a class="event-card" href="../../../spot/ja/${esc(ev.id)}.html">
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
          <div class="card-arrow">詳細を見る →</div>
        </div>
      </a>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="ja">
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
  <link rel="alternate" hreflang="ja" href="${canonical}" />
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
      <a href="../../ja/">花火大会</a>
      <a href="../../../../ja/index.html">開花予報</a>
    </nav>
  </div>
</header>

<nav class="breadcrumb-bar">
  <div class="breadcrumb-inner">
    <a href="../../ja/">花火大会</a>
    <span class="breadcrumb-sep">›</span>
    <span class="breadcrumb-current">${esc(location)}</span>
  </div>
</nav>

<div class="hero">
  <img class="hero-img" src="../../images/${heroId}/1.jpg" alt="${esc(location)}の花火" />
  <div class="hero-overlay"></div>
  <div class="hero-content">
    <div class="hero-label">🎆 花火大会 2026</div>
    <h1 class="hero-title">${esc(location)}</h1>
    <div class="hero-count">${evts.length}件の大会</div>
  </div>
</div>

<div class="main">
  <div class="pref-intro">
    <div class="pref-tagline">${esc(intro.tagline)}</div>
    <p class="pref-body">${esc(intro.body)}</p>
  </div>

  <div class="section-title">🎇 ${esc(location)}の全花火大会</div>
  <div class="event-grid">
${cardsHtml}
  </div>

  <a class="back-link" href="../../ja/">← 花火大会カレンダーに戻る</a>
</div>

<footer>
  <p>© 2026 Junlando | <a href="../../ja/">花火大会</a> · <a href="../../../../ja/index.html">開花予報</a></p>
  <p style="margin-top:4px">最終更新：${BUILD_DATE}</p>
</footer>
</body>
</html>`;

  fs.writeFileSync(path.join(outDir, `${ken}.html`), html, 'utf8');
  count++;
});

console.log(`✅ JA pref: ${count} pages → pref/ja/`);
