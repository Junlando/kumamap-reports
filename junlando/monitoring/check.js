/**
 * Junlando 網站 AI 視覺監控腳本（使用 Gemini API，免費）
 *
 * 執行方式：
 *   GEMINI_API_KEY=xxx LINE_NOTIFY_TOKEN=xxx node check.js
 *
 * 環境變數：
 *   GEMINI_API_KEY      - Google Gemini API 金鑰（免費）
 *   LINE_NOTIFY_TOKEN   - LINE Notify 權杖（可選，沒有只會印 log）
 */

const { chromium } = require('playwright');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const https = require('https');

// ── 設定 ────────────────────────────────────────────────────────────────────

const SITE_URL = 'https://community.junlando.com';
const WAIT_MS = 2500;

// 要檢查的頁面清單
const PAGES_TO_CHECK = [
  {
    name: '首頁',
    url: SITE_URL,
    reloads: 5,
    prompt: `這是 Junlando 日本旅遊社群網站的首頁截圖。
請檢查以下幾點，並逐一回答「正常」或「異常：[描述]」：

1. 圖片卡片：圖片是否以 center crop 方式顯示（填滿卡片、不壓扁、不顯示全圖）
2. 頁面載入：頁面是否有正常的貼文卡片（非空白、非載入失敗）
3. 整體版面：有沒有明顯跑版或元素位置異常

最後一行請用這個格式總結：
結果：正常 或 結果：異常`
  },
  {
    name: '貼文頁',
    url: `${SITE_URL}/post/`,
    reloads: 1,
    prompt: `這是 Junlando 的貼文頁面截圖。
請檢查：
1. 頁面是否正常顯示（非空白、非錯誤畫面）
2. 有沒有明顯的版面問題

最後一行請用這個格式總結：
結果：正常 或 結果：異常`
  }
];

// ── 工具函式 ────────────────────────────────────────────────────────────────

/** 發送 LINE Notify 通知 */
function sendLineNotify(message) {
  const token = process.env.LINE_NOTIFY_TOKEN;
  if (!token) {
    console.log('[LINE] 未設定 LINE_NOTIFY_TOKEN，跳過通知');
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const body = `message=${encodeURIComponent(message)}`;
    const req = https.request({
      hostname: 'notify-api.line.me',
      path: '/api/notify',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      console.log(`[LINE] 通知發送完成，狀態碼：${res.statusCode}`);
      resolve();
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/** 用 Gemini API 分析截圖 */
async function analyzeScreenshot(model, screenshotBuffer, prompt) {
  const result = await model.generateContent([
    {
      inlineData: {
        data: screenshotBuffer.toString('base64'),
        mimeType: 'image/png',
      },
    },
    prompt,
  ]);
  return result.response.text();
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ── 主流程 ──────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ 請設定 GEMINI_API_KEY 環境變數');
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

  const allIssues = [];
  const timestamp = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });

  console.log(`\n🔍 Junlando 視覺監控開始 - ${timestamp}\n`);

  const browser = await chromium.launch({ args: ['--no-sandbox'] });

  try {
    for (const pageConfig of PAGES_TO_CHECK) {
      console.log(`\n📄 檢查：${pageConfig.name} (${pageConfig.url})`);

      for (let i = 1; i <= pageConfig.reloads; i++) {
        const context = await browser.newContext({
          viewport: { width: 390, height: 844 }, // iPhone 14 尺寸
        });
        const page = await context.newPage();

        try {
          await page.goto(pageConfig.url, { waitUntil: 'load', timeout: 15000 });
          await sleep(WAIT_MS);

          const screenshot = await page.screenshot({ fullPage: false });
          const analysis = await analyzeScreenshot(model, screenshot, pageConfig.prompt);

          const lastLine = analysis.trim().split('\n').pop();
          const isAbnormal = lastLine.includes('結果：異常');
          const icon = isAbnormal ? '❌' : '✅';
          console.log(`  ${icon} 第 ${i} 次 → ${lastLine}`);

          if (isAbnormal) {
            allIssues.push(`【${pageConfig.name}】第 ${i} 次載入\n${analysis.trim()}`);
          }
        } catch (err) {
          const msg = `【${pageConfig.name}】第 ${i} 次發生錯誤：${err.message}`;
          console.error(`  ⚠️  ${msg}`);
          allIssues.push(msg);
        } finally {
          await context.close();
        }
      }
    }
  } finally {
    await browser.close();
  }

  // ── 結果輸出 ──────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────');
  if (allIssues.length === 0) {
    console.log('✅ 所有檢查通過，無異常');
  } else {
    console.log(`❌ 偵測到 ${allIssues.length} 個問題`);

    const lineMessage = [
      `⚠️ Junlando 網站監控警告`,
      `時間：${timestamp}`,
      `發現 ${allIssues.length} 個問題：`,
      '',
      ...allIssues.map((issue, i) => `${i + 1}. ${issue.split('\n')[0]}`),
      '',
      `請至 ${SITE_URL} 確認`,
    ].join('\n');

    await sendLineNotify(lineMessage);
  }
}

main().catch(err => {
  console.error('❌ 監控腳本執行失敗：', err);
  process.exit(1);
});
