/**
 * translate-spots.js
 * 將 detail-{flower}.json 的 tagline / desc / period 翻譯成英文或日文
 *
 * 用法：
 *   OPENAI_API_KEY=sk-xxx node translate-spots.js --flower ajisai --lang en
 *   OPENAI_API_KEY=sk-xxx node translate-spots.js --flower ajisai --lang ja
 *
 * 輸出：data/spots/detail-ajisai.en.json（或 .ja.json）
 *
 * 選項：
 *   --sample        只翻第一個景點，看效果用
 *   --resume        跳過已有翻譯的景點（斷點續跑）
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ── 參數 ──────────────────────────────────────────────────
const args = process.argv.slice(2);
const get = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null; };
const has = (flag) => args.includes(flag);

const FLOWER = get('--flower') || 'ajisai';
const LANG   = get('--lang')   || 'en';
const SAMPLE = has('--sample');
const RESUME = has('--resume');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('❌ 請設定 OPENAI_API_KEY 環境變數');
  process.exit(1);
}

const LANG_CONFIG = {
  en: {
    name: 'English',
    instruction: `You are a travel copywriter. Translate the following Japanese flower spot information into natural, engaging English for travelers.
Rules:
- tagline: Keep it punchy and inspiring, under 25 words
- desc: Translate naturally, preserving paragraph breaks (<br><br>). Keep the blog-style tone.
- period: Translate to English format (e.g. "late June to mid-July")
- Do NOT translate proper nouns (temple names, place names) — keep them in Japanese romanization or original
- Return ONLY valid JSON, no explanation`,
  },
  ja: {
    name: '日本語',
    instruction: `あなたは旅行ライターです。以下の花見スポット情報を、旅行者向けの自然で魅力的な日本語に翻訳してください。
ルール：
- tagline: 簡潔でインパクトのある表現に（25文字以内）
- desc: 自然に翻訳し、段落区切り（<br><br>）を保持。ブログ調のトーンを維持
- period: 日本語の時期表現に（例：「6月下旬〜7月中旬」）
- 固有名詞（寺院名・地名）はそのまま維持
- 有効なJSONのみを返し、説明は不要`,
  },
};

// ── ファイルパス ──────────────────────────────────────────
const INPUT_PATH  = path.join(__dirname, `data/spots/detail-${FLOWER}.json`);
const OUTPUT_PATH = path.join(__dirname, `data/spots/detail-${FLOWER}.${LANG}.json`);

// ── OpenAI API 呼び出し ───────────────────────────────────
function callOpenAI(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) return reject(new Error(json.error.message));
          resolve(json.choices[0].message.content.trim());
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── 翻訳処理 ─────────────────────────────────────────────
async function translateSpot(name, spot, langConfig) {
  const input = {
    tagline:      spot.tagline      || '',
    desc:         spot.desc         || '',
    period:       spot.period       || '',
    types:        spot.types        || '',
    count:        spot.count        || '',
    access_train: spot.access_train || '',
    access_car:   spot.access_car   || '',
  };

  // 空欄位不送去翻
  Object.keys(input).forEach(k => { if (!input[k]) delete input[k]; });

  const prompt = `${langConfig.instruction}

Spot name: ${name}
Input JSON:
${JSON.stringify(input, null, 2)}

Return translated JSON with exactly the same keys as input (only include keys that were provided):
{"tagline":"...","desc":"...","period":"...","types":"...","count":"...","access_train":"...","access_car":"..."}`;

  const result = await callOpenAI(prompt);

  // JSON 抽出
  const match = result.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`Invalid JSON response: ${result}`);
  return JSON.parse(match[0]);
}

// ── メイン ───────────────────────────────────────────────
async function main() {
  const langConfig = LANG_CONFIG[LANG];
  if (!langConfig) {
    console.error(`❌ 不支援的語言：${LANG}（支援：en, ja）`);
    process.exit(1);
  }

  const source = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
  const output = RESUME && fs.existsSync(OUTPUT_PATH)
    ? JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'))
    : {};

  const entries = Object.entries(source);
  const targets = SAMPLE ? entries.slice(0, 1) : entries;

  console.log(`🌸 翻譯 ${FLOWER} → ${langConfig.name}`);
  console.log(`   景點數：${targets.length}${SAMPLE ? '（sample 模式）' : ''}`);
  console.log(`   輸出：${OUTPUT_PATH}\n`);

  let success = 0, skipped = 0, failed = 0;

  for (const [name, spot] of targets) {
    // resume: 已翻譯的跳過
    if (RESUME && output[name]?.tagline) {
      skipped++;
      continue;
    }

    try {
      process.stdout.write(`  翻譯中：${name} ... `);
      const translated = await translateSpot(name, spot, langConfig);

      // 合併：保留原始所有欄位，只覆蓋翻譯欄位
      output[name] = {
        ...spot,
        tagline:      translated.tagline      || spot.tagline,
        desc:         translated.desc         || spot.desc,
        period:       translated.period       || spot.period,
        types:        translated.types        || spot.types,
        count:        translated.count        || spot.count,
        access_train: translated.access_train || spot.access_train,
        access_car:   translated.access_car   || spot.access_car,
      };

      console.log(`✓`);
      success++;

      // 途中保存（每 10 景點）
      if (success % 10 === 0) {
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8');
        console.log(`  💾 已保存（${success} 個）`);
      }

      // Rate limit 対策
      await new Promise(r => setTimeout(r, 200));

    } catch (e) {
      console.log(`❌ 失敗：${e.message}`);
      failed++;
    }
  }

  // 最終保存
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8');

  console.log(`\n✅ 完成！成功：${success} / 跳過：${skipped} / 失敗：${failed}`);

  if (SAMPLE) {
    const first = Object.entries(output)[0];
    console.log(`\n=== Sample 結果（${first[0]}）===`);
    console.log('tagline:', first[1].tagline);
    console.log('period: ', first[1].period);
    console.log('desc:\n',  first[1].desc);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
