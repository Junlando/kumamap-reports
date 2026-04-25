# Web UI Agent

## 你的職責
只負責 `public/` 資料夾下的 HTML、CSS、JavaScript。
**不要動** `functions/`、`firebase.json`、根目錄的任何檔案。

## 頁面說明

### `index.html`（首頁）
- 從 Firestore `posts` collection 抓最新 80 筆
- 依 `topicTitle` 分組，每個 topic 是一個 section
- 每個 section 有橫向捲動的貼文卡片
- 貼文最多的 topic 排最上面

### `post/index.html`（貼文詳細）
- 從 URL path 取得 postId（`/post/<postId>`）
- 從 Firestore 讀取單篇貼文資料
- 顯示：Hero 圖片、topic tag、標題+星星、作者、內容、留言
- 留言從 `posts/{id}/comments` subcollection 讀取
- 分享按鈕產生 `community.junlando.com/p/<postId>` 連結

## Firebase Config（唯讀，不要修改）
```js
const firebaseConfig = {
  apiKey: "AIzaSyCo8XHh_ln2fpGWkcuKtax0nYSKzlgFW-8",
  authDomain: "japan-community-fb528.firebaseapp.com",
  projectId: "japan-community-fb528",
  storageBucket: "japan-community-fb528.firebasestorage.app",
  messagingSenderId: "112553415405",
  appId: "1:112553415405:web:15aa1ec6c90e9841fa32e4"
};
```

## Logo / Favicon
- Favicon 檔案：`/favicon.ico`（已放在 `public/favicon.ico`）
- HTML 引用：`<link rel="icon" href="/favicon.ico" />`
- Header 的 logo 文字用 `Junlando`，顏色 `var(--primary)`

## 設計規範
```css
--primary: #2B5CE6
--primary-light: #EEF2FF
--text-main: #111827
--text-sub: #6B7280
--star: #F59E0B        /* 星星評分顏色 */
--border: #E5E7EB
--bg: #F3F4F8
--card: #fff

font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif
border-radius 卡片: 16px
border-radius 大卡片: 20px
border-radius chip/tag: 20px（pill 形狀）
```

## Firestore 欄位對照（UI 用到的）
| 欄位 | 說明 | 注意 |
|------|------|------|
| `title` | 貼文標題 | 優先用這個，fallback `restaurantName` |
| `topicTitle` | 所屬話題名稱 | 用於 section header 和 chip tag |
| `thumbnailURLs[0]` | 卡片縮圖 | 優先用，比 imageURLs 小、快 |
| `imageURLs` | 完整圖片陣列 | 詳細頁 hero + gallery 用 |
| `rating` | 1-5 數字 | 用 `Math.round()` 後渲染星星 |
| `authorAvatar` | 頭像 URL | 可能為空，要有 placeholder |
| `authorName` | 作者名稱 | fallback `'匿名旅人'` |
| `likeCount` | 按讚數 | |
| `commentCount` | 留言數 | |
| `createdAt` | Firestore Timestamp | 用 `.toDate()` 轉換 |

## Topic Icon 對照（首頁 section header 用）
```js
美食/餐廳 → 🍜
購物/藥妝 → 🛍️
景點/觀光 → ⛩️
住宿/飯店 → 🏨
交通       → 🚄
優惠       → 🎟️
自然/溫泉 → 🌸
其他       → ✈️
```

## 分享連結格式
```
community.junlando.com/p/<postId>   ← 分享出去的 URL（有 OG tags）
community.junlando.com/post/<postId> ← 實際貼文頁面
```

## Firebase SDK 版本
`firebase-app-compat.js` + `firebase-firestore-compat.js` 版本 `10.12.0`
用 `firebase.firestore()` 存取，不要改用 modular SDK。
