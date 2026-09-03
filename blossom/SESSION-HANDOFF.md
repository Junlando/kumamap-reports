# Blossom 專案 Session Handoff
更新日期：2026-06-04

---

## 專案基本資訊

- **網站**：`https://junlando.com/blossom`
- **本地路徑**：`/Users/chenandy/kumamap-reports/blossom/`
- **Firebase Project**：`blossomweb-42c86`

---

## 核心架構

### 檔案結構
```
blossom/
├── index.html              ← 首頁（地圖 + 人氣景點 + 縣市列表）
├── spot.html               ← 動態景點頁（?flower=ajisai&spot=名稱）
├── prefecture.html         ← 縣市景點列表頁
├── spot.js                 ← 所有景點頁共用渲染邏輯
├── spot.css                ← 景點頁樣式
├── build-spots.js          ← 生成靜態景點 HTML（node build-spots.js）
├── analytics-events.js     ← Firebase Analytics
├── spot/
│   ├── sakura/001.html ... ← 靜態景點頁（SEO 用）
│   ├── ajisai/001.html ...
│   └── koyo/001.html ...
├── data/
│   ├── top20.json          ← 首頁人氣景點 index（20個/花卉）
│   ├── spot-id-map.json    ← 景點名稱 → 靜態頁 ID 對照
│   ├── forecast/           ← 花期預測資料（按縣市）
│   │   ├── ajisai-2026.json
│   │   ├── sakura-2027.json
│   │   └── koyo-2026.json
│   └── spots/
│       ├── detail-ajisai.json  ← ★ 主要維護檔案（繡球花）
│       ├── detail-sakura.json
│       ├── detail-koyo.json
│       ├── ajisai.json         ← 按縣市的景點清單（含 address, period）
│       ├── sakura.json
│       └── koyo.json
└── images/
    ├── ajisai/{景點名}/1.jpg, 2.jpg, 3.jpg ...
    ├── sakura/...
    └── koyo/...
```

---

## 資料架構說明

### detail-ajisai.json（最重要）
**單一維護點**，景點名稱為 key：
```json
"雲昌寺": {
  "pref": "akita",
  "prefName": "秋田縣",
  "period": "6月下旬～7月中旬",
  "tagline": "一句話的 section 標題",
  "desc": "第一段...<br><br>第二段...<br><br>第三段...",
  "img": "images/ajisai/雲昌寺/1.jpg",
  "img_count": 3,
  "thumb": "images/ajisai/thumb/雲昌寺.jpg",
  "mapUrl": "https://maps.google.com/?q=...",
  "displayName": "顯示用名稱（選填，用於 key 是日文的景點）",
  "types": "花卉品種",
  "count": "株數",
  "hours": "開放時間",
  "fee": "入場費",
  "address": "地址",
  "access_train": "電車交通",
  "access_car": "自駕交通"
}
```

### top20.json（首頁顯示用 index）
```json
{
  "ajisai": [
    { "name": "雲昌寺", "pref": "akita",
      "thumb": "images/ajisai/thumb/雲昌寺.jpg",
      "img": "images/ajisai/雲昌寺/1.jpg",
      "prefName": "秋田縣",
      "period": "6月下旬～7月中旬" }
  ]
}
```
⚠️ `top20.json` 的 `prefName` 和 `period` 必須與 detail JSON 保持同步，同步方式：
```bash
cd /Users/chenandy/kumamap-reports/blossom
node -e "
const fs = require('fs');
const top20 = JSON.parse(fs.readFileSync('data/top20.json','utf8'));
const flowers = ['ajisai','koyo','sakura'];
for (const flower of flowers) {
  const detail = JSON.parse(fs.readFileSync(\`data/spots/detail-\${flower}.json\`,'utf8'));
  top20[flower] = top20[flower].map(s => {
    const d = detail[s.name] || {};
    return { ...s, prefName: d.prefName || s.pref, period: d.period || '' };
  });
}
fs.writeFileSync('data/top20.json', JSON.stringify(top20, null, 2), 'utf8');
console.log('done');
"
```

---

## 頁面渲染邏輯（spot.js）

### Blog 版面
- 圖片路徑：`images/{flower}/{spotName}/1.jpg`、`2.jpg`、`3.jpg`...
- 張數由 `detail.img_count` 控制
- `desc` 以 `<br><br>` 分段，每段對應一張圖
- `tagline` 顯示在第一張圖下方（section 標題樣式）
- `displayName` 優先作為頁面顯示名稱（key 是日文時使用）

### 景點頁 section 順序
1. Header（景點名 + 花況 badge）
2. 圖片 + tagline + 各段 desc（交替）
3. `{縣市} {year}{花卉}花期預測` + bloom card
4. `景點資訊` + info table
5. `地圖` + Google Maps embed
6. `更多 {縣市} {花卉}景點` + siblings cards

---

## 圖片規範

- **上傳位置**：`images/ajisai/{景點名}/2.jpg`、`3.jpg`（1.jpg 通常已存在）
- **命名規則**：直接放到對應景點資料夾，按數字順序
- **resize 指令**（macOS sips，1200px、82% quality）：
```bash
sips -s format jpeg -s formatOptions 82 -Z 1200 "原始檔.jpeg" --out "images/ajisai/景點名/2.jpg"
```
- 更新圖片後，記得在 `detail-ajisai.json` 更新 `img_count`

### 特殊資料夾名稱
- 本土寺 → `images/ajisai/本土寺_s/`（detail key 仍為 `本土寺`）

---

## displayName 已設定的景點

| detail key | displayName |
|---|---|
| `せたな青少年旅行村` | 立象山公園（せたな青少年旅行村） |
| `富士見湖パーク` | 富士見湖公園（鶴之舞橋） |
| `川崎あじさい公園` | 川崎紫陽花公園 |
| `赤沢のあじさいロード` | 赤澤紫陽花路 |
| `陣ヶ岡歴史公園` | 陣ヶ岡歷史公園 |
| `加護坊山 田尻あじさいロード` | 加護坊山・田尻繡球花路 |
| `野草園（仙台市）` | 仙台市野草園 |
| `國營みちのく杜の湖畔公園` | 國營みちのく湖畔公園 |
| `折渡あじさいロード` | 折渡繡球花路 |

---

## 靜態頁重建

修改 `detail` / `spots` JSON 後，若需要更新靜態頁：
```bash
cd /Users/chenandy/kumamap-reports/blossom
node build-spots.js
```
會輸出 683 個 HTML 到 `spot/{flower}/`，並更新 `data/spot-id-map.json` 與 `sitemap.xml`。

⚠️ **`build-*.js` 系列腳本都在 `.gitignore`（故意的，不想把 SEO/建置邏輯公開在 public repo），只存在本機。**
如果手動調整了某個靜態頁的樣式、SEO 欄位（title 格式、FAQ schema、breadcrumb 連結等），
**務必同步修改對應的 `build-*.js`**，否則下次重新產生就會整批跑掉、跟線上版本分岔
（2026-09-03 這次修 koyo 資料時，就是發現 `build-spots-ja.js` / `build-spots-en.js` /
`build-spots.js` 三支都已經跟線上頁面分岔了，才回頭重建。詳見下方 session 記錄）。

sitemap 重建順序也要注意：`build-prefecture*.js` 跟 `build-spots*.js` 各自對 `sitemap*.xml`
的更新邏輯都不完整（會重複塞入或整批覆蓋），**跑完那些腳本後一律用 `node build-sitemaps.js`
重新產生一次乾淨完整版本**，不要相信前面腳本自己寫的 sitemap。

---

## 最近完成的工作（本 session）

### 首頁調整
- 地圖 section 移至人氣景點上方
- 「人氣必賞景點」→「2026網路人氣推薦景點」
- 手機版景點卡片放大（寬 210→260px，圖片高 150→185px）
- 手機版 main top padding 從 4px→20px（避免貼近 tab bar）

### 繡球花文案（tagline + desc）
全部 243 個景點已全數補齊（2026-06-04 確認）

### 新增圖片（已處理）
- 明月院：2.jpg、3.jpg（1200px 壓縮）
- 白山神社：2.jpg、3.jpg
- 矢田寺：2.jpg、3.jpg
- 雨引觀音：2.jpg、3.jpg（用戶自行放入）
- 長谷寺：2.jpg、3.jpg
- 本土寺_s：2.jpg、3.jpg

---

## 待辦 / 可繼續的工作

- [x] 繡球花全部 243 個景點 tagline + desc 已完成
- [x] koyo（紅葉）景點文案已完成，含中/日/英三語（2026-09-03，詳見下方）
- [ ] sakura 景點文案尚未開始
- [ ] 有新圖片時：resize → 放入對應資料夾 → 更新 `img_count`
- [ ] 考慮 deploy 時機（`npx firebase deploy --only hosting`）

---

## 2026-09-03 session：紅葉（koyo）2026 第一報資料更新

### 做了什麼
- 依 Weathernews 2026/9/3 紅葉見頃予想第一報，更新 `data/forecast/koyo-2026.json`（47 縣市預測日期）
- 縣市層級介紹文（`data/prefecture/detail-koyo.{json,ja.json,en.json}`）文字中提到的日期，
  依各縣市新舊預測的天數差整批平移校正（寫了 date-shift 工具，處理過中/日/英三種語言的
  日期表達方式，含連續日期範圍、省略月份的簡寫等邊界情況）
- 景點層級（195 個景點）：period 欄位改為套用所屬縣市的預測值（大雪山、立山黑部（室堂）、
  千疊敷窪地、八甲田山、秋田駒岳、花貫溪谷、熱海梅園這 7 個景點因為文案本身強調「全國/區域
  最早或最晚」，保留原本的個別時間，沒有套用縣市平均值）
- **英文版景點資料（`data/spots/detail-koyo.en.json`）發現嚴重錯置**：195 個景點裡有 186 個
  的 tagline/desc 其實是別的花季（櫻花/繡球花）殘留內容，或跟花期完全對不上的罐頭文案。
  已依中文版（正確、已更新）逐一重新翻譯，195 個全部换新
- 修好 `build-spots.js` / `build-spots-ja.js` / `build-spots-en.js`（原本已跟線上頁面分岔，
  詳見上方警語），並拿修好的腳本重新產生全部 683×3 個靜態景點頁 + 141×3 個縣市頁
- 順手修掉一個 ja/en 靜態頁共通的 bug：「同縣市其他景點」連結全部指向自己那一頁
  （`build-spots-ja.js`/`build-spots-en.js` 裡 `${id}` 打成該打 `${sid}`），這個 bug
  同時影響 sakura / ajisai，這次一起修了

### 已知但沒動的東西
- 大雪山等 7 個「全國最早/最晚」景點自己頁面上的「紅葉花期預測」時程卡，因為是讀縣市層級
  單一預測值，還是會跟文案打架（例如大雪山文案說「全日本最早」但時程卡顯示跟函館一樣的日期）。
  這是資料結構限制（一縣市一筆預測，無景點層級預測），要等有更細緻的預測資料再處理
- sakura 資料本身有幾個景點名稱跟目前 `data/spots/sakura.json` 對不上（例如 188/189 號 id
  對應到的實際頁面內容跟現在的名字不一致），這次重建靜態頁時順帶讓內容跟現在的名字對齊了，
  但沒有特別去查這個分岔是怎麼發生的
