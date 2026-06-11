/**
 * translate-pref-desc.js
 * 將 data/prefecture/detail-{flower}.json 的縣介紹翻譯成英文或日文
 *
 * 用法：
 *   OPENAI_API_KEY=sk-xxx node translate-pref-desc.js --flower ajisai --lang en
 *   OPENAI_API_KEY=sk-xxx node translate-pref-desc.js --flower ajisai --lang ja
 *
 * 輸出：data/prefecture/detail-ajisai.en.json（或 .ja.json）
 *
 * 選項：
 *   --sample   只翻第一個縣，確認效果
 *   --resume   跳過已有翻譯的縣
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const args   = process.argv.slice(2);
const get    = f => { const i = args.indexOf(f); return i !== -1 ? args[i+1] : null; };
const has    = f => args.includes(f);

const FLOWER = get('--flower') || 'ajisai';
const LANG   = get('--lang')   || 'en';
const SAMPLE = has('--sample');
const RESUME = has('--resume');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) { console.error('❌ 請設定 OPENAI_API_KEY'); process.exit(1); }

const INPUT_PATH  = path.join(__dirname, `data/prefecture/detail-${FLOWER}.json`);
const OUTPUT_PATH = path.join(__dirname, `data/prefecture/detail-${FLOWER}.${LANG}.json`);

const LANG_CONFIG = {
  en: {
    name: 'English',
    instruction: `You are a travel writer. Translate the following Japanese prefecture flower-viewing introduction from Traditional Chinese into natural, engaging English for international travelers.
Rules:
- tagline: One punchy sentence, under 25 words. Keep numbers (e.g. "7 spots").
- desc: Translate naturally, preserving paragraph breaks (\\n\\n). Blog-style tone.
- Do NOT translate proper nouns (place names, temple names) — keep Japanese romanization
- Return ONLY valid JSON: {"tagline":"...","desc":"..."}`,
  },
  ja: {
    name: '日本語',
    instruction: `あなたは旅行ライターです。以下の花見スポット紹介文を繁体字中国語から、旅行者向けの自然で魅力的な日本語に翻訳してください。
ルール：
- tagline: 簡潔でインパクトのある一文（30文字以内）。数字（例：「7スポット」）はそのまま。
- desc: 自然に翻訳し、段落区切り（\\n\\n）を保持。ブログ調のトーンで。
- 固有名詞（地名・寺社名）はそのまま維持
- 有効なJSONのみを返す：{"tagline":"...","desc":"..."}`,
  },
};

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
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) return reject(new Error(json.error.message));
          resolve(json.choices[0].message.content.trim());
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

async function translatePref(prefId, entry, langConfig) {
  const input = { tagline: entry.tagline || '', desc: entry.desc || '' };
  const prompt = `${langConfig.instruction}

Prefecture ID: ${prefId}
Input JSON:
${JSON.stringify(input, null, 2)}`;

  const result = await callOpenAI(prompt);
  const match = result.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`Invalid JSON: ${result}`);
  return JSON.parse(match[0]);
}

async function main() {
  const langConfig = LANG_CONFIG[LANG];
  if (!langConfig) { console.error(`❌ 不支援語言：${LANG}`); process.exit(1); }

  const source = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
  const output = RESUME && fs.existsSync(OUTPUT_PATH)
    ? JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'))
    : {};

  const entries = Object.entries(source);
  const targets = SAMPLE ? entries.slice(0, 1) : entries;

  console.log(`🌸 翻譯縣介紹 ${FLOWER} → ${langConfig.name}`);
  console.log(`   縣數：${targets.length}${SAMPLE ? '（sample）' : ''}`);
  console.log(`   輸出：${OUTPUT_PATH}\n`);

  let success = 0, skipped = 0, failed = 0;

  for (const [prefId, entry] of targets) {
    if (RESUME && output[prefId]?.tagline) { skipped++; continue; }

    try {
      process.stdout.write(`  翻譯中：${prefId} ... `);
      const translated = await translatePref(prefId, entry, langConfig);
      output[prefId] = {
        ...entry,
        tagline: translated.tagline || entry.tagline,
        desc:    translated.desc    || entry.desc,
      };
      console.log('✓');
      success++;

      if (success % 10 === 0) {
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8');
        console.log(`  💾 已保存（${success} 縣）`);
      }
      await new Promise(r => setTimeout(r, 150));
    } catch(e) {
      console.log(`❌ 失敗：${e.message}`);
      failed++;
    }
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8');
  console.log(`\n✅ 完成！成功：${success} / 跳過：${skipped} / 失敗：${failed}`);

  if (SAMPLE) {
    const first = Object.entries(output)[0];
    console.log(`\n=== Sample（${first[0]}）===`);
    console.log('tagline:', first[1].tagline);
    console.log('desc:\n',  first[1].desc?.slice(0, 200) + '...');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
