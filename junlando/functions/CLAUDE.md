# Firebase Backend Agent

## 你的職責
只負責 `functions/` 資料夾和根目錄的 `firebase.json`。
**不要動** `public/` 資料夾的任何檔案。

## Cloud Function 說明

### `sharePost`（唯一的 function）
- **觸發**：`/p/<postId>` 的 HTTP request
- **用途**：社群分享的 OG tags 頁面
- **邏輯**：
  1. 從 URL path 取得 `postId`
  2. 去 Firestore `posts` collection 查詢該貼文
  3. 回傳包含 OG meta tags 的 HTML
  4. HTML 裡有 JS redirect，把真實用戶導向 `/post/<postId>`
  5. 爬蟲（LINE/FB）不執行 JS，只讀 meta tags

### 重要：`og:url` 的設定
```
og:url 必須 = community.junlando.com/p/<postId>
og:url 不能 = community.junlando.com/post/<postId>
```
原因：FB 爬蟲會 follow `og:url`，若指向 `/post/`（靜態頁，無 OG tags），
爬蟲會再抓一次靜態頁，導致 OG tags 失效。

## Firebase 設定
```
Project ID: japan-community-fb528
Region: us-central1
Runtime: Node.js 20（Gen 1）
Base URL: https://community.junlando.com
```

## firebase.json Rewrite 規則
```json
{
  "rewrites": [
    { "source": "/p/**",    "function": "sharePost" },
    { "source": "/post/**", "destination": "/post/index.html" }
  ]
}
```
**順序很重要**：`/p/**` 必須在前面。

## Firestore Schema

### posts
```ts
Post {
  id: string
  title: string
  content: string
  authorName: string
  authorAvatar: string
  authorUID: string
  categoryID: string
  topicID: string
  topicTitle: string
  imageURLs: string[]
  thumbnailURLs: string[]   // 優先用於 OG image（較小、載入快）
  rating: number
  likeCount: number
  commentCount: number
  createdAt: Timestamp
}
```

### OG Image 優先順序
```js
thumbnailURLs[0] → imageURLs[0] → DEFAULT_OG.image
```

### OG Title 組成
```js
authorName ? `${title} – by ${authorName}` : title
title = data.title || DEFAULT_OG.title
```

## Default OG（找不到貼文時的 fallback）
```js
title: "Junlando – 日本旅遊社群"
description: "分享日本旅遊資訊、優惠券、景點推薦的社群平台"
image: "https://junlando.com/assets/og-default.png"
```

## Cache 設定
```
Cache-Control: public, max-age=300, s-maxage=300
```
（5 分鐘 cache，避免 function 被過度呼叫）

## Deploy 指令
```bash
firebase deploy --only functions    # 只部署 function
firebase deploy                     # 全部部署
```

## 注意事項
- 使用 Gen 1 Cloud Functions（`functions.https.onRequest`），不是 Gen 2
- ESLint 規則：雙引號、`const`/`let` 不用 `var`
- 避免 `functions.logger` 以外的 console.log（production 環境）
