# Junlando 專案總覽

## 專案說明
Junlando 是一個日本旅遊社群平台，讓用戶分享旅遊資訊、美食、景點推薦。
主體是 React Native App，網頁版架在 Firebase Hosting。

## Domain 架構
| Domain | 用途 | 平台 |
|--------|------|------|
| `junlando.com` | App 行銷頁、靜態頁面 | GitHub Pages |
| `community.junlando.com` | 網頁版社群、貼文分享 | Firebase Hosting |

## Firebase 專案
- Project ID: `japan-community-fb528`
- Region: `us-central1`

## 整體檔案結構
```
kumamap-reports/
├── index.html       ← junlando.com 行銷官網（GitHub Pages）
├── junlando/        ← Firebase 社群平台（community.junlando.com）
│   ├── public/          Firebase Hosting 靜態頁面
│   │   ├── index.html       首頁 feed（依 topic 分組）
│   │   ├── post/index.html  貼文詳細頁
│   │   └── user/index.html  用戶頁
│   ├── functions/       Firebase Cloud Functions
│   │   └── index.js
│   ├── monitoring/      AI 視覺監控腳本（Playwright + Gemini）
│   └── firebase.json    Hosting rewrite 設定
└── .github/workflows/   GitHub Actions（定時監控）
```

## Hosting Rewrite 規則
```
/p/**     → Cloud Function sharePost（OG tags + redirect）
/post/**  → /post/index.html（靜態貼文詳細頁）
/         → index.html（首頁）
```

## 分享連結架構
- 分享 URL：`community.junlando.com/p/<postId>`
- 爬蟲（LINE/FB）打開 → Cloud Function 回傳 OG tags
- 真實用戶 → JS redirect 到 `/post/<postId>`
- `og:url` 必須指回 `/p/<postId>`，不能指到 `/post/`（否則 FB 爬蟲會跟著 redirect 失去 OG tags）

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
  thumbnailURLs: string[]   // 較小的縮圖，優先用於 OG image 和卡片
  rating: number            // 1-5 星
  likeCount: number
  commentCount: number
  createdAt: Timestamp
}
```

### posts/{id}/comments（subcollection）
```ts
Comment {
  authorName: string
  authorAvatar: string
  authorUID: string
  content: string
  createdAt: Timestamp
  postID: string
  postAuthorName: string
  postSnippet: string
}
```

### topics
```ts
Topic {
  title: string
  categoryID: string      // 如: hotels, shopping, food
  topicIcon: string       // SF Symbols 或 Lucide icon name
  hashtags: string[]
  isApproved: boolean
  pinned: boolean
  createdAt: Timestamp
}
```

### users
```ts
User {
  userHandle: string      // @ringotrip123
  displayName: string
  photoURL: string
  bio: string
  email: string
  customEmail: string
  followerCount: number
  handleChangeCount: number
  createdAt: Timestamp
}
```

### users/{uid}/followers, following（subcollection）
```ts
{
  uid: string
  createdAt: Timestamp
}
```

### users/{uid}/notifications（subcollection）
```ts
{
  type: "follow" | "like" | ...
  fromUID: string
  fromName: string
  fromAvatar: string
  postID: string          // follow 時為空字串
  postSnippet: string     // follow 時為空字串
  isRead: boolean
  createdAt: Timestamp
}
```

## Deploy 指令
```bash
# 先 cd 進 junlando/
cd /Users/chenandy/kumamap-reports/junlando

npx firebase deploy                      # 全部
npx firebase deploy --only hosting       # 只有靜態頁面
npx firebase deploy --only functions     # 只有 Cloud Function
```
