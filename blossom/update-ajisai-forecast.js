/**
 * update-ajisai-forecast.js
 * 每天自動抓 weathernews.jp 繡球花開花預測，更新 ajisai-2026.json，並 rebuild 縣市頁面。
 * 只處理已確認開花（class="flower"）的地點。
 *
 * 用法：node update-ajisai-forecast.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SOURCE_URL = 'https://weathernews.jp/ajisai/kaikaforecast/';
const FORECAST_PATH = path.join(__dirname, 'data/forecast/ajisai-2026.json');
const PEAK_OFFSET_DAYS = 12;
const YEAR = 2026;

// 城市名稱 → 縣市 key（與 ajisai-2026.json 的 key 對應）
const CITY_TO_PREF = {
  '福岡': 'fukuoka', '佐賀': 'saga', '長崎': 'nagasaki', '大分': 'oita',
  '熊本': 'kumamoto', '宮崎': 'miyazaki', '鹿児島': 'kagoshima',
  '高松': 'kagawa', '徳島': 'tokushima', '松山': 'ehime', '高知': 'kochi',
  '広島': 'hiroshima', '岡山': 'okayama', '松江': 'shimane',
  '鳥取': 'tottori', '下関': 'yamaguchi',
  '大阪': 'osaka', '彦根': 'shiga', '京都': 'kyoto', '神戸': 'hyogo',
  '奈良': 'nara', '和歌山': 'wakayama',
  '名古屋': 'aichi', '岐阜': 'gifu', '静岡': 'shizuoka', '津': 'mie',
  '新潟': 'niigata', '富山': 'toyama', '金沢': 'ishikawa', '福井': 'fukui',
  '長野': 'nagano', '甲府': 'yamanashi',
  '東京': 'tokyo', '横浜': 'kanagawa', '銚子': 'chiba', '熊谷': 'saitama',
  '水戸': 'ibaraki', '宇都宮': 'tochigi', '前橋': 'gunma',
  '仙台': 'miyagi', '秋田': 'akita', '山形': 'yamagata',
  '盛岡': 'iwate', '青森': 'aomori', '福島': 'fukushima', '札幌': 'hokkaido',
};

// "5/27" → "2026-05-27"
function parseMonthDay(str) {
  const m = str.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!m) return null;
  return `${YEAR}-${String(m[1]).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`;
}

// "2026-06-18" → "6/18"
function isoToMD(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// bloom 日期 + N 天
function addDays(isoDate, days) {
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ajisai-bot/1.0)' } }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  console.log(`[${new Date().toISOString()}] Fetching ${SOURCE_URL}`);
  const html = await fetchPage(SOURCE_URL);

  // 解析每一列：<ul class="flowering__table_td"> 裡的第一個 li（城市名）和第二個 li（預測值+class）
  const rowRegex = /<ul class="flowering__table_td">\s*<li>([^<]+)<\/li>\s*<li class="([^"]*)">(.*?)<\/li>/g;

  const forecast = JSON.parse(fs.readFileSync(FORECAST_PATH, 'utf8'));
  const changes = [];

  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const city = match[1].trim();
    const cls  = match[2].trim();
    const value = match[3].trim();

    const prefKey = CITY_TO_PREF[city];
    if (!prefKey) continue;

    const pref = forecast.prefectures[prefKey];
    if (!pref) continue;

    // ── 確認開花（class="flower" + "開花"）──────────────────────
    if (cls === 'flower' && value.includes('開花')) {
      const dateStr = value.replace('開花', '').trim(); // "5/27"
      const bloomDate = parseMonthDay(dateStr);
      if (!bloomDate) { console.warn(`  SKIP: 無法解析開花日期 "${value}"`); continue; }
      if (pref.bloom === bloomDate) continue; // 無變動

      // 新的 forecastRange：開花日〜原本結束日
      const endMD = pref.end ? isoToMD(pref.end) : '';
      const newRange = endMD ? `${dateStr}〜${endMD}` : dateStr;

      // peak：只有在尚未確認的情況下才重算（bloom + 12 天）
      let newPeak = pref.peak;
      let peakRecalculated = false;
      if (!pref.peakConfirmed) {
        newPeak = pref.end && addDays(bloomDate, PEAK_OFFSET_DAYS) > pref.end
          ? pref.end
          : addDays(bloomDate, PEAK_OFFSET_DAYS);
        peakRecalculated = true;
      }

      changes.push({ type: 'bloom', city, prefName: pref.name,
        oldBloom: pref.bloom, newBloom: bloomDate,
        oldPeak: pref.peak, newPeak, peakRecalculated });

      pref.bloom = bloomDate;
      pref.peak = newPeak;
      pref.forecastRange = newRange;
      continue;
    }

    // ── 確認滿開（預留：未來網站若標記滿開時啟用）────────────────
    // 目前 weathernews.jp 尚未提供滿開確認，此段待觀察後補充。
    // 預期格式範例：class="peak" + "6/8満開"
    // if (cls === 'peak' && value.includes('満開')) {
    //   const dateStr = value.replace('満開', '').trim();
    //   const peakDate = parseMonthDay(dateStr);
    //   if (!peakDate || pref.peak === peakDate) continue;
    //   changes.push({ type: 'peak', city, prefName: pref.name,
    //     oldPeak: pref.peak, newPeak: peakDate });
    //   pref.peak = peakDate;
    //   pref.peakConfirmed = true;
    //   continue;
    // }
  }

  if (changes.length === 0) {
    console.log('✅ 無變動，資料已是最新。');
    return;
  }

  console.log(`\n🔄 更新 ${changes.length} 個縣市：`);
  for (const c of changes) {
    if (c.type === 'bloom') {
      const peakNote = c.peakRecalculated ? `peak ${c.oldPeak} → ${c.newPeak}（+${PEAK_OFFSET_DAYS}天推算）` : `peak 保留 ${c.newPeak}（已確認）`;
      console.log(`  ${c.prefName}（${c.city}）: bloom ${c.oldBloom} → ${c.newBloom}, ${peakNote}`);
    } else if (c.type === 'peak') {
      console.log(`  ${c.prefName}（${c.city}）: peak ${c.oldPeak} → ${c.newPeak}（確認滿開）`);
    }
  }

  fs.writeFileSync(FORECAST_PATH, JSON.stringify(forecast, null, 2) + '\n', 'utf8');
  console.log('\n📝 ajisai-2026.json 已更新');

  console.log('\n🏗  Rebuilding 縣市頁面...');
  execSync('node build-prefecture.js', { cwd: __dirname, stdio: 'inherit' });

  console.log('\n✅ 完成！');
}

main().catch(err => {
  console.error('❌ 錯誤：', err.message);
  process.exit(1);
});
