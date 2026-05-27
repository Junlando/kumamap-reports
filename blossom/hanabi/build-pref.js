/**
 * build-pref.js
 * 為每個有花火大會的都道府縣生成靜態 HTML
 * 輸出目錄：hanabi/pref/
 * 執行方式：node build-pref.js
 */

const fs   = require('fs');
const path = require('path');

const BASE_DIR  = __dirname;
const OUT_DIR   = path.join(BASE_DIR, 'pref');
const SITE_ROOT = 'https://junlando.com/blossom/hanabi';
const DOW_ZH    = ['日','一','二','三','四','五','六'];

const EVENTS = JSON.parse(fs.readFileSync(path.join(BASE_DIR, 'data/events.json'), 'utf8'));

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// ── 從 spot HTML 抽取 intro-subtitle ──────────────────────────────────────
function getSpotSubtitle(id) {
  const file = path.join(BASE_DIR, 'spot', `${id}.html`);
  if (!fs.existsSync(file)) return '';
  const html = fs.readFileSync(file, 'utf8');
  const m = html.match(/<div class="intro-subtitle">([^<]+)<\/div>/);
  return m ? m[1].trim() : '';
}

// ── 縣市介紹文 ────────────────────────────────────────────────────────────
const PREF_INTRO = {
  tokyo:     { tagline: '江戶傳統與現代夜景共演，全日本人口最密集的百萬人級煙火聖地', body: '東京都集中了日本最具規模的花火大會，從夏季旗艦的隅田川到秋季壓軸的東京灣大花火，跨越整個夏秋季節。江戶時代傳承至今的花火文化在此融合現代都市夜景，特別是足立、江戶川、板橋三大會場同日競演的7月底至8月初，被花火迷稱為「東京花火週」，動員人次超過百萬。' },
  osaka:     { tagline: '天神祭的篝火船與紅梅煙火，大阪灣南北貫穿日本夏日最熱情的煙火文化', body: '大阪府花火大會密度居關西之冠，從7月天神祭的宗教祭典煙火到10月淀川的秋季大會，四季皆有。天神祭奉納花火是日本三大祭之一的壓軸，觀眾在川面船隊與紅梅煙火的交融中感受浪速文化；8月的泉州夢花火則在泉佐野市海濱展現大阪灣的南方魅力。' },
  kyoto:     { tagline: '古都風雅與千年祭典，嵐山保津川峽谷將煙火之美推向極致', body: '京都府的花火大會以精緻著稱，以千發至萬發規模呈現最高水準的音樂同步演出。6月的京都藝術花火是關西6月規格天花板；8月的保津川花火在峽谷地形中形成天然音響迴廊；宮津燈籠流放花火則將舞鶴灣的月夜化為煙火與燈籠共演的詩篇。' },
  hokkaido:  { tagline: '道北的藍天與原野，從洞爺湖每日常駐到秋季藝術花火，北海道的夏天比本州更純粹', body: '北海道的花火賽季從4月一直延伸到9月，氣候涼爽讓觀賞體驗格外舒適。洞爺湖長期花火從4月底至10月底每晚20:45施放，是日本唯一可長期規劃的常駐煙火；8月的勝每花火以大自然為舞台；9月的北海道藝術花火則以音樂同步演出在廣闊草原上呈現視聽盛宴。' },
  niigata:   { tagline: '長岡復興之花的壯烈故事，新潟是日本花火技術的發源聖地', body: '新潟縣是日本最重要的花火競技產地之一，長岡市更是花火師世家的根據地。長岡祭大花火大會的「白菊」與「正三尺玉」是技術巔峰的代名詞；片貝煙火大會則保存了世界最大單發煙火的傳統，連續兩日施放的三尺玉直徑展開超過600公尺。' },
  shizuoka:  { tagline: '富士山麓與駿河灣，靜岡的花火舞台自帶日本最美的天然背景', body: '靜岡縣的花火大會以地形景觀取勝。熱海海上花火大會每年多次舉辦，盆地海灣地形產生天然重低音音響效果，是日本花火迷公認的「震撼感第一」；袋井遠州、安倍川等會場則搭配靜岡傳統祭典氛圍，為觀眾帶來兼具文化深度的夏夜體驗。' },
  hyogo:     { tagline: '神戶港灣夜景與瀨戶內海，兵庫的花火在六甲山系包圍下更顯壯麗', body: '兵庫縣的花火大會橫跨夏秋兩季，兼具海景與都市景觀。秋季的神戶港みなとHANABI在メリケンパーク連續多夜施放，是關西少見的秋季連日煙火；蘆屋夏日嘉年華在蘆屋灘半島地形上呈現精緻的情侶向花火；姬路港的海上花火則以世界遺產姬路城為背景，構成獨一無二的文化地景。' },
  kanagawa:  { tagline: '橫濱港灣夜景與多摩川秋煙，神奈川的煙火連結海港繁華與河川悠閒', body: '神奈川縣以橫濱開港祭花火作為6月關東最大規模的港灣煙火，結合雷射光雕與音樂共演呈現未來感；秋季的多摩川花火大會則延續了神奈川與東京兩地市民共賞的悠閒河川傳統，是10月最受親子與情侶喜愛的都市郊外花火。' },
  aichi:     { tagline: '岡崎城下家康故里，東海花火文化最重要的交匯點', body: '愛知縣的花火大會融合了歷史文化與現代祭典。岡崎城下家康公夏日祭花火是東海地區施放規模數一數二的大型會場，城下祭典氛圍讓煙火兼具歷史感；豐田OIDEN祭則展現了現代工業城市活力十足的夏日慶典，吸引大量在地年輕人參與。' },
  ibaraki:   { tagline: '古河の利根川水景與土浦三大競技，茨城是花火技術競賽的最高殿堂', body: '茨城縣擁有日本三大花火競技大會之一的土浦全國花火競技大會，每年11月吸引全國頂尖花火師競演技藝，是鑑賞花火藝術水準的最佳舞台。夏季的古河花火大會在利根川水景映照下，則是關東夏日不可錯過的清涼感花火體驗。' },
  yamagata:  { tagline: '赤川的700公尺橫向震撼，山形保存著日本最動人的地方花火魂', body: '山形縣的赤川花火大會以橫向施放寬度達700公尺著稱，是日本花火迷票選「感動度」排行前茅的地方花火，保留著不追求規模、追求情感深度的傳統美學。9月的酒田花火大會則依傍最上川水面，在山形秋意中畫上一年的完美句點。' },
  akita:     { tagline: '大曲の全國競技，秋田是花火師最嚮往的技術殿堂', body: '秋田縣大仙市的全國花火競技大會（大曲花火）與土浦、諏訪並列日本三大花火，是花火師職人最高榮譽的舞台。每年8月最後一個週六，全國花火師匯聚雄物川河川敷，在夏日尾聲呈現一年中最精緻的技術競演，吸引超過80萬名觀眾。' },
  nagano:    { tagline: '高山湖泊的迴音奇蹟，諏訪湖是日本最壯觀的萬發級花火舞台', body: '長野縣諏訪湖祭湖上花火大會每年8月15日固定舉行，依托海拔797公尺的高山湖泊地形，四周山壁形成天然音響迴廊，施放發數高達數萬發居全日之冠。夏夜中煙火倒映在湖面，與群山輪廓構成無可複製的立體全景，是許多花火迷心中「一生必看」的名場面。' },
  mie:       { tagline: '熊野古道終點的海上轟鳴，三重的花火與信仰在太平洋畔交匯', body: '三重縣熊野大花火大會在面臨太平洋的熊野市海岸舉行，是日本花火大會中背景最壯闊的場地之一。海上施放的煙火映照在黑潮流過的太平洋海面，盆節祭典的宗教氣氛與煙火的視覺衝擊交融，每年8月17日吸引大批朝聖者與花火迷同場共賞。' },
  shimane:   { tagline: '神話之國的湖上鏡面，松江水鄉祭是島根夏日最夢幻的雙日花火', body: '島根縣松江水鄉祭湖上花火大會在宍道湖水面連續舉辦兩日，每夜煙火倒映在靜謐的湖面形成完美鏡像。松江城天守閣的輪廓在煙火光芒中若隱若現，日本海的涼風與出雲神話土地的特殊氛圍，讓這場花火成為山陰地區最具文化深度的夏日體驗。' },
  fukuoka:   { tagline: '九州最大河川的夏夜盛典，筑後川花火是博多人共同的夏日記憶', body: '福岡縣筑後川花火大會在久留米市的筑後川河川敷舉行，是九州規模最大的花火大會之一。超過一萬發煙火沿河岸施放，搭配當地夏祭的熱鬧氛圍，是福岡、佐賀兩縣居民共同的夏日記憶。博多帶來的活力讓現場氣氛更為熱烈。' },
  kumamoto:  { tagline: '八代全國競技，九州最重要的花火技術競演舞台', body: '熊本縣八代市的全國花火競技大會是九州規模最大的花火競技會，每年10月吸引全國花火師齊聚球磨川河川敷競演技藝。球磨川的寬闊水面讓煙火得以完整展開，秋夜涼爽的九州氣候也讓觀賞環境比夏季更為舒適。' },
  miyagi:    { tagline: '仙台七夕祭前夜的星空煙火，東北夏日節慶的絢爛序章', body: '宮城縣仙台花火祭作為仙台七夕祭的前夜祭，每年8月5日固定登場，在廣瀨川河岸為日本最大七夕祭典揭開序幕。東北最大都市的夏夜在煙火中沸騰，是旅遊仙台七夕的旅客必排行程之一。' },
  aomori:    { tagline: '青森祭典文化的煙火傳承，津輕海峽邊的短暫夏日最燦爛', body: '青森縣青森花火大會與青森睡魔祭同期舉行，是東北夏季祭典群中的重要一環。短暫的東北夏季讓當地人對花火有著特別深厚的情感，煙火在津輕海峽的夜空中綻放，成為一年中最珍貴的夏日記憶。' },
  kagawa:    { tagline: '讚岐高松祭的瀨戶內海花火，四國最大城市的夏日狂歡', body: '香川縣讚岐高松祭花火大會在高松港海面施放，以瀨戶內海島嶼群作為天然背景，構成四國最美的花火地景。8月中旬盆節期間，高松市區人潮湧現，是造訪四國的旅客參與當地祭典文化的最佳機會。' },
  hiroshima: { tagline: '蘆田川夏夜的和平祈願，廣島的花火在盆節中承載著特別的歷史溫度', body: '廣島縣福山夏日祭蘆田川花火大會在每年8月15日盆節舉行，這一天在廣島縣有著超越純粹娛樂的歷史意義。蘆田川的寬闊河面讓煙火得以盡情展開，是廣島縣東部城市居民最重要的夏日盛典。' },
  yamaguchi: { tagline: '關門海峽兩岸對打，山口與福岡的跨縣聯手演出日本最戲劇化的海峽花火', body: '山口縣下關市的關門海峽花火大會是日本唯一跨縣市對打的花火大會，與對岸福岡縣北九州市門司港同步施放，兩側花火在最窄僅600公尺的海峽上空交匯，形成極具戲劇張力的視覺奇觀。' },
  gifu:      { tagline: '清流長良川映照天守，岐阜城下最美的夏夜水景花火', body: '岐阜縣長良川花火大會在流經岐阜城腳下的清流長良川上施放，河面倒影與金華山城天守的輪廓構成獨特的花火地景。作為東海地區水質最清澈的河川之一，長良川為煙火提供了最純粹的倒影舞台。' },
  ishikawa:  { tagline: '加賀百萬石的夏日花火，北陸最大規模的全國競技會場', body: '石川縣川北大會是北陸地區規模最大的花火大會之一，也是北國大花火競技大會的主要會場。每年8月1日，全國頂尖花火師在手取川河川敷競演，吸引加賀・能登各地觀眾聚集，是金澤近郊夏日最重要的戶外盛事。' },
  tochigi:   { tagline: '渡良瀨川夏夜的浪漫光影，栃木最受在地人喜愛的花火大會', body: '栃木縣足利花火大會依傍渡良瀨川舉行，是栃木縣最具規模的夏季花火大會。渡良瀨川的寬闊河道讓煙火得以充分展開，足利市傳統織物産業帶來的文化底蘊也讓這場夏日盛典別具一格。' },
  chiba:     { tagline: '東京灣夜景中的幕張狂歡，千葉夏日最大的濱海煙火盛典', body: '千葉縣幕張海灘花火節在東京灣海濱舉行，以幕張新都心的現代夜景為背景，是關東夏季規模最大的海灘花火大會之一。8月1日的花火盛典吸引大批來自東京圈的遊客，浴衣人潮與海灘夏祭的氛圍讓整個幕張沸騰。' },
  shiga:     { tagline: '日本最大淡水湖的夏日震撼，琵琶湖大花火是近畿花火的年度頂點', body: '滋賀縣琵琶湖大花火大會在日本面積最大的湖泊水面施放，是近畿地區規模最大的花火大會之一。廣闊的琵琶湖提供了無邊際的視野，煙火在湖面水平線上同時盛開，加上比叡山與対岸山系的輪廓，構成其他場地無法複製的壯觀全景。' },
  okinawa:   { tagline: '全日本最早迎來夏天的花火大會，沖繩的海風與琉球音樂讓煙火更加繽紛', body: '沖繩縣琉球海炎祭是全日本最早舉辦的夏季花火大會，每年4月在那霸市近郊海濱登場，比本州各大會場早整整三個月迎來夏天。結合琉球傳統音樂與熱帶海灘的特殊氛圍，是沖繩旅遊的獨特花火體驗，也是宣告日本花火季正式開跑的第一聲。' },
  saitama:   { tagline: '冬夜祭典的煙火奇蹟，秩父夜祭是日本三大曳山祭的壓軸煙火', body: '埼玉縣秩父夜祭花火大會是日本三大曳山祭之一的秩父夜祭壓軸項目，每年12月3日在冬夜寒空中施放。曳山（山車）巡行的燈光與冬季煙火的組合是日本罕見的冬季祭典景觀，寒冷的空氣讓煙火顯色更加鮮豔飽和。' },
};

function getPrefIntro(ken) {
  return PREF_INTRO[ken] || {
    tagline: `${byKen[ken]?.location || ''}的花火大會，在日本各地的夜空中綻放獨特的地方魅力`,
    body: `本縣市的花火大會承載著當地夏日祭典文化，每場活動都是在地居民最珍視的年度盛典。無論是河川、湖泊或海濱，不同的地形賦予每場花火大會獨一無二的視覺體驗。`
  };
}

// Group events by ken
const byKen = {};
EVENTS.forEach(ev => {
  if (!byKen[ev.ken]) byKen[ev.ken] = { location: ev.location, evts: [] };
  byKen[ev.ken].evts.push(ev);
});
Object.values(byKen).forEach(g => g.evts.sort((a,b) => a.date.localeCompare(b.date)));

function esc(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function isLongRunning(ev) {
  if (!ev.endDate) return false;
  return (new Date(ev.endDate+'T00:00:00') - new Date(ev.date+'T00:00:00')) / 86400000 > 7;
}

function formatDateLabel(ev) {
  const d = new Date(ev.date + 'T00:00:00');
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const dow = DOW_ZH[d.getDay()];
  if (isLongRunning(ev)) {
    const e = new Date(ev.endDate + 'T00:00:00');
    return `${m}/${day} ～ ${e.getMonth()+1}/${e.getDate()}`;
  }
  if (ev.endDate) {
    const e = new Date(ev.endDate + 'T00:00:00');
    return `${m}/${day}・${e.getDate()}（連兩日）`;
  }
  return `${m}月${day}日（${dow}）`;
}

let count = 0;
Object.entries(byKen).forEach(([ken, { location, evts }]) => {
  const intro     = getPrefIntro(ken);
  const canonical = `${SITE_ROOT}/pref/${ken}.html`;
  const title     = `${location}花火大會 2026｜Junlando`;
  const desc      = `2026年${location}的花火大會一覽，共${evts.length}場。${intro.tagline}`;
  const heroId    = evts[0].id;

  const jsonld = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "花卉預測", "item": "https://junlando.com/blossom/" },
      { "@type": "ListItem", "position": 2, "name": "花火大會", "item": `${SITE_ROOT}/` },
      { "@type": "ListItem", "position": 3, "name": location,   "item": canonical },
    ]
  });

  // Build cards
  const cardsHtml = evts.map(ev => {
    const subtitle   = getSpotSubtitle(ev.id);
    const dateLabel  = esc(formatDateLabel(ev));
    const longBadge  = isLongRunning(ev) ? `<span class="card-long-badge">常駐</span>` : '';
    const descHtml   = subtitle
      ? `<div class="card-subtitle">${esc(subtitle)}</div>`
      : (ev.note ? `<div class="card-subtitle">${esc(ev.note)}</div>` : '');
    return `
      <a class="event-card" href="../spot/${esc(ev.id)}.html">
        <div class="card-img-wrap">
          <img class="card-img" src="../images/${esc(ev.id)}/1.jpg" alt="${esc(ev.name)}" loading="lazy" onerror="this.closest('.card-img-wrap').style.background='#e8e9ec'" />
          ${longBadge}
        </div>
        <div class="card-body">
          <div class="card-date-row">
            <span class="card-date-chip">${dateLabel}</span>
          </div>
          <div class="card-name">${esc(ev.name)}</div>
          ${descHtml}
          <div class="card-arrow">查看詳情 →</div>
        </div>
      </a>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonical}" />
  <link rel="canonical" href="${canonical}" />
  <link rel="icon" href="../../../favicon.ico" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet" />
  <script type="application/ld+json">${jsonld}</script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --hanabi: #e05a00;
      --hanabi-dark: #b84400;
      --hanabi-light: #fff4ee;
      --gray: #f5f6f8;
      --border: #e8e9ec;
      --text: #1a1a2e;
      --text-sub: #6b7280;
      --radius: 12px;
      --active: #7c5cbf;
    }
    body { font-family: 'Inter','Noto Sans JP',-apple-system,sans-serif; background:#fafbfc; color:var(--text); line-height:1.6; min-height:100vh; }

    header { background:white; border-bottom:1px solid var(--border); position:sticky; top:0; z-index:100; }
    .header-inner { max-width:1100px; margin:0 auto; padding:0 20px; height:58px; display:flex; align-items:center; gap:16px; }
    .logo { display:flex; align-items:center; gap:8px; text-decoration:none; color:var(--text); font-weight:700; font-size:18px; }
    .header-links { margin-left:auto; display:flex; align-items:center; gap:4px; }
    .header-links a { padding:6px 12px; border-radius:8px; text-decoration:none; font-size:13px; color:var(--text-sub); font-weight:500; transition:background .15s,color .15s; }
    .header-links a:hover { background:var(--gray); color:var(--text); }
    .header-links .btn-primary { background:var(--text); color:white; margin-left:4px; }

    .breadcrumb-bar { background:white; border-bottom:1px solid var(--border); }
    .breadcrumb-inner { max-width:1100px; margin:0 auto; padding:8px 20px; font-size:13px; display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
    .breadcrumb-inner a { color:var(--active); text-decoration:none; font-weight:500; }
    .breadcrumb-inner a:hover { text-decoration:underline; }
    .breadcrumb-sep { color:#ccc; font-size:12px; }
    .breadcrumb-current { color:var(--text); font-weight:600; }

    /* HERO */
    .hero { position:relative; width:100%; height:340px; overflow:hidden; background:#1a1a2e; }
    .hero-img { width:100%; height:100%; object-fit:cover; display:block; opacity:0.72; }
    .hero-overlay { position:absolute; inset:0; background:linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.05) 55%); }
    .hero-content { position:absolute; bottom:0; left:0; right:0; padding:28px 32px; }
    .hero-label { font-size:13px; font-weight:600; color:rgba(255,255,255,0.6); margin-bottom:6px; letter-spacing:.4px; }
    .hero-title { font-size:36px; font-weight:800; color:white; line-height:1.2; margin-bottom:10px; }
    .hero-count { display:inline-block; background:var(--hanabi); color:white; font-size:13px; font-weight:700; padding:4px 14px; border-radius:20px; }
    @media (max-width:600px) { .hero { height:220px; } .hero-title { font-size:26px; } .hero-content { padding:18px 20px; } }

    /* MAIN */
    .main { max-width:1000px; margin:0 auto; padding:28px 20px 60px; }

    /* INTRO */
    .pref-intro { margin-bottom:36px; border-bottom:1px solid var(--border); padding-bottom:32px; }
    .pref-tagline { font-size:20px; font-weight:800; color:var(--text); line-height:1.6; margin-bottom:14px; }
    .pref-body { font-size:15px; color:var(--text); line-height:1.9; }

    /* GRID */
    .grid-title { font-size:18px; font-weight:800; color:var(--text); margin-bottom:16px; }
    .events-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; margin-bottom:32px; }
    @media (max-width:820px) { .events-grid { grid-template-columns:repeat(2,1fr); } }
    @media (max-width:500px) { .events-grid { grid-template-columns:1fr; } }

    .event-card {
      background:white; border:1px solid var(--border); border-radius:var(--radius);
      overflow:hidden; text-decoration:none; color:var(--text);
      display:flex; flex-direction:column;
      transition:border-color .15s, box-shadow .15s;
    }
    .event-card:hover { border-color:#ffc49e; box-shadow:0 4px 16px rgba(224,90,0,0.1); }
    .card-img-wrap { position:relative; aspect-ratio:4/3; overflow:hidden; background:var(--gray); flex-shrink:0; }
    .card-img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .35s; }
    .event-card:hover .card-img { transform:scale(1.05); }
    .card-long-badge {
      position:absolute; top:10px; right:10px;
      background:rgba(122,82,0,0.85); color:white;
      font-size:11px; font-weight:700; padding:3px 8px; border-radius:20px;
      backdrop-filter:blur(4px);
    }
    .card-body { padding:12px 14px 14px; flex:1; display:flex; flex-direction:column; gap:5px; }
    .card-date-row { display:flex; align-items:center; gap:8px; }
    .card-date-chip {
      font-size:11px; font-weight:700; color:var(--hanabi-dark);
      background:var(--hanabi-light); padding:3px 9px; border-radius:20px;
      white-space:nowrap; flex-shrink:0;
    }
    .card-name { font-size:15px; font-weight:700; color:var(--text); line-height:1.35; }
    .card-subtitle { font-size:12px; color:var(--text-sub); line-height:1.55; flex:1; }
    .card-arrow { font-size:12px; color:var(--hanabi); font-weight:600; margin-top:4px; }

    .back-btn { display:inline-flex; align-items:center; gap:6px; padding:9px 18px; border-radius:10px; background:var(--hanabi-light); color:var(--hanabi-dark); font-size:13px; font-weight:700; text-decoration:none; border:1.5px solid #ffc49e; transition:background .12s; }
    .back-btn:hover { background:#ffe0cc; }
  </style>
</head>
<body>

<header>
  <div class="header-inner">
    <a class="logo" href="../../"><img src="../../../favicon.ico" style="width:32px;height:32px;border-radius:8px;display:block" alt="Junlando" />Junlando</a>
    <nav class="header-links">
      <a href="../../">花卉預測</a>
      <a href="https://community.junlando.com" target="_blank" rel="noopener">旅遊論壇</a>
      <a href="https://junlando.com/coupon/" target="_blank" rel="noopener" class="btn-primary">優惠券</a>
    </nav>
  </div>
</header>

<nav class="breadcrumb-bar">
  <div class="breadcrumb-inner">
    <a href="../../">花卉預測</a>
    <span class="breadcrumb-sep">›</span>
    <a href="../">花火大會</a>
    <span class="breadcrumb-sep">›</span>
    <span class="breadcrumb-current">${esc(location)}</span>
  </div>
</nav>

<div class="hero">
  <img class="hero-img" src="../images/${esc(heroId)}/1.jpg" alt="${esc(location)} 花火大會" />
  <div class="hero-overlay"></div>
  <div class="hero-content">
    <div class="hero-label">🎆 2026 花火大會</div>
    <div class="hero-title">${esc(location)}</div>
    <span class="hero-count">${evts.length} 場</span>
  </div>
</div>

<div class="main">

  <div class="pref-intro">
    <p class="pref-tagline">${esc(intro.tagline)}</p>
    <p class="pref-body">${esc(intro.body)}</p>
  </div>

  <div class="grid-title">📅 2026 全場次一覽</div>
  <div class="events-grid">
${cardsHtml}
  </div>
  <a class="back-btn" href="../">← 返回花火大會日曆</a>

</div>
</body>
</html>`;

  fs.writeFileSync(path.join(OUT_DIR, `${ken}.html`), html, 'utf8');
  count++;
  console.log(`  ✓ ${ken}.html  （${location}，${evts.length} 場）`);
});

console.log(`\n完成：共生成 ${count} 個縣市頁面 → hanabi/pref/`);
