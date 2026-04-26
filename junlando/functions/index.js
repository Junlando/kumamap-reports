const functions = require("firebase-functions");
const { onDocumentCreated, onDocumentDeleted, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// Default fallback OG info (shown when post is not found)
const DEFAULT_OG = {
  title: "Junlando – 日本旅遊社群",
  description: "分享日本旅遊資訊、優惠券、景點推薦的社群平台",
  image: "https://junlando.com/assets/og-default.png",
};

// The base URL of your web app (where real users get redirected)
const WEB_APP_BASE_URL = "https://community.junlando.com";

/**
 * sharePost
 * Handles requests to /junlando/p/:postId
 * - Returns OG meta tags for social media crawlers (LINE, FB, Twitter)
 * - Redirects real users to the full post page via JS
 */
exports.sharePost = functions.https.onRequest(async (req, res) => {
  // Extract postId from the URL path: /junlando/p/<postId>
  // req.path will be something like /p/abc123 (after hosting strips the prefix)
  const pathParts = req.path.split("/").filter(Boolean);
  // pathParts example: ["p", "abc123"] or ["junlando", "p", "abc123"]
  const postId = pathParts[pathParts.length - 1];

  let og = { ...DEFAULT_OG };
  let postFound = false;

  if (postId && postId !== "p") {
    try {
      const doc = await db.collection("posts").doc(postId).get();

      if (doc.exists) {
        const data = doc.data();
        const title = data.title || data.restaurantName || DEFAULT_OG.title;
        const authorName = data.authorName || "";
        const content = data.content
          ? data.content.substring(0, 100).replace(/\n/g, " ")
          : DEFAULT_OG.description;
        // Prefer thumbnailURLs for faster OG image loading
        const image =
          (Array.isArray(data.thumbnailURLs) && data.thumbnailURLs.length > 0)
            ? data.thumbnailURLs[0]
            : (Array.isArray(data.imageURLs) && data.imageURLs.length > 0)
              ? data.imageURLs[0]
              : DEFAULT_OG.image;

        og = {
          title: authorName ? `${title} – by ${authorName}` : title,
          description: content,
          image,
        };
        postFound = true;
      }
    } catch (err) {
      // Firestore error: fall through to default OG
      functions.logger.error("Firestore error for postId:", postId, err);
    }
  }

  // Redirect destination for real users
  const redirectUrl = postFound
    ? `${WEB_APP_BASE_URL}/post/${encodeURIComponent(postId)}`
    : WEB_APP_BASE_URL;

  // Canonical share URL (always points back to /p/... itself, NOT the redirect)
  // og:url must NOT point to a different page, or FB will follow it and lose OG tags
  const canonicalUrl = postId && postId !== "p"
    ? `${WEB_APP_BASE_URL}/p/${encodeURIComponent(postId)}`
    : WEB_APP_BASE_URL;

  // Escape helper to prevent XSS in meta content
  const esc = (str) =>
    String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!-- Primary OG tags -->
  <meta property="og:type"        content="article" />
  <meta property="og:site_name"   content="Junlando" />
  <meta property="og:title"       content="${esc(og.title)}" />
  <meta property="og:description" content="${esc(og.description)}" />
  <meta property="og:image"       content="${esc(og.image)}" />
  <meta property="og:url"         content="${esc(canonicalUrl)}" />

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${esc(og.title)}" />
  <meta name="twitter:description" content="${esc(og.description)}" />
  <meta name="twitter:image"       content="${esc(og.image)}" />

  <!-- General meta -->
  <meta name="description" content="${esc(og.description)}" />
  <title>${esc(og.title)}</title>

  <!--
    Redirect real users to the actual page.
    Social media crawlers (LINE, FB bot) do NOT execute JavaScript,
    so they will only read the <meta> tags above.
  -->
  <script>
    window.location.replace("${esc(redirectUrl)}");
  </script>
</head>
<body>
  <p>正在跳轉… <a href="${esc(redirectUrl)}">點此前往</a></p>
</body>
</html>`;

  res.set("Cache-Control", "public, max-age=300, s-maxage=300");
  res.status(200).send(html);
});

// ─────────────────────────────────────────────
// followUser
// 觸發：Callable function（Gen 1）
// 動作：toggle 追蹤 / 取消追蹤
// ─────────────────────────────────────────────
exports.followUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be logged in.");
  }

  const myUID = context.auth.uid;
  const { targetUID } = data;

  if (!targetUID || typeof targetUID !== "string") {
    throw new functions.https.HttpsError("invalid-argument", "targetUID is required.");
  }
  if (targetUID === myUID) {
    throw new functions.https.HttpsError("invalid-argument", "Cannot follow yourself.");
  }

  const followerRef  = db.collection("users").doc(targetUID).collection("followers").doc(myUID);
  const followingRef = db.collection("users").doc(myUID).collection("following").doc(targetUID);
  const targetUserRef = db.collection("users").doc(targetUID);
  const myUserRef    = db.collection("users").doc(myUID);

  const followerSnap = await followerRef.get();
  const isFollowing  = followerSnap.exists;

  const batch = db.batch();
  const now   = admin.firestore.FieldValue.serverTimestamp();

  if (isFollowing) {
    batch.delete(followerRef);
    batch.delete(followingRef);
    batch.update(targetUserRef, { followerCount:  admin.firestore.FieldValue.increment(-1) });
    batch.update(myUserRef,     { followingCount: admin.firestore.FieldValue.increment(-1) });
  } else {
    const myUserSnap = await myUserRef.get();
    const myData     = myUserSnap.exists ? myUserSnap.data() : {};

    batch.set(followerRef,  { uid: myUID,     createdAt: now });
    batch.set(followingRef, { uid: targetUID, createdAt: now });
    batch.update(targetUserRef, { followerCount:  admin.firestore.FieldValue.increment(1) });
    batch.update(myUserRef,     { followingCount: admin.firestore.FieldValue.increment(1) });

    const notifRef = db.collection("users").doc(targetUID).collection("notifications").doc();
    batch.set(notifRef, {
      type:        "follow",
      fromUID:     myUID,
      fromName:    myData.displayName || "",
      fromAvatar:  myData.photoURL    || "",
      postID:      "",
      postSnippet: "",
      isRead:      false,
      createdAt:   now,
    });
  }

  await batch.commit();
  return { following: !isFollowing };
});

// ─────────────────────────────────────────────
// likePost
// 觸發：Callable function（Gen 1）
// 動作：toggle 按讚 / 取消按讚
// ─────────────────────────────────────────────
exports.likePost = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be logged in.");
  }

  const myUID = context.auth.uid;
  const { postId } = data;

  if (!postId || typeof postId !== "string") {
    throw new functions.https.HttpsError("invalid-argument", "postId is required.");
  }

  const postRef  = db.collection("posts").doc(postId);
  const likeRef  = postRef.collection("likes").doc(myUID);
  const myUserRef = db.collection("users").doc(myUID);

  const [likeSnap, postSnap, myUserSnap] = await Promise.all([
    likeRef.get(),
    postRef.get(),
    myUserRef.get(),
  ]);

  const alreadyLiked = likeSnap.exists;
  const batch = db.batch();
  const now   = admin.firestore.FieldValue.serverTimestamp();

  if (alreadyLiked) {
    batch.delete(likeRef);
    batch.update(postRef, { likeCount: admin.firestore.FieldValue.increment(-1) });
  } else {
    const postData   = postSnap.exists ? postSnap.data() : {};
    const myData     = myUserSnap.exists ? myUserSnap.data() : {};
    const authorUID  = postData.authorUID || "";
    const postSnippet = (postData.content || "").substring(0, 50).replace(/\n/g, " ");

    batch.set(likeRef, { uid: myUID, createdAt: now });
    batch.update(postRef, { likeCount: admin.firestore.FieldValue.increment(1) });

    if (authorUID && authorUID !== myUID) {
      const notifRef = db.collection("users").doc(authorUID).collection("notifications").doc();
      batch.set(notifRef, {
        type:        "like",
        fromUID:     myUID,
        fromName:    myData.displayName || "",
        fromAvatar:  myData.photoURL    || "",
        postID:      postId,
        postSnippet: postSnippet,
        isRead:      false,
        createdAt:   now,
      });
    }
  }

  await batch.commit();
  return { liked: !alreadyLiked };
});

// ─────────────────────────────────────────────
// addComment
// 觸發：Callable function（Gen 1）
// 動作：新增留言，更新 commentCount，通知作者
// ─────────────────────────────────────────────
exports.addComment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be logged in.");
  }

  const myUID = context.auth.uid;
  const { postId, content } = data;

  if (!postId || typeof postId !== "string") {
    throw new functions.https.HttpsError("invalid-argument", "postId is required.");
  }
  if (!content || typeof content !== "string" || content.trim() === "") {
    throw new functions.https.HttpsError("invalid-argument", "content is required.");
  }
  if (content.length > 500) {
    throw new functions.https.HttpsError("invalid-argument", "content must be 500 characters or fewer.");
  }

  const postRef   = db.collection("posts").doc(postId);
  const myUserRef = db.collection("users").doc(myUID);

  const [postSnap, myUserSnap] = await Promise.all([
    postRef.get(),
    myUserRef.get(),
  ]);

  const postData      = postSnap.exists ? postSnap.data() : {};
  const myData        = myUserSnap.exists ? myUserSnap.data() : {};
  const authorUID     = postData.authorUID || "";
  const postAuthorName = postData.authorName || "";
  const postSnippet   = (postData.content || "").substring(0, 50).replace(/\n/g, " ");
  const now           = admin.firestore.FieldValue.serverTimestamp();

  const commentRef = postRef.collection("comments").doc();
  const batch      = db.batch();

  batch.set(commentRef, {
    authorUID:      myUID,
    authorName:     myData.displayName || "",
    authorAvatar:   myData.photoURL    || "",
    content:        content.trim(),
    createdAt:      now,
    postID:         postId,
    postAuthorName: postAuthorName,
    postSnippet:    postSnippet,
  });

  batch.update(postRef, { commentCount: admin.firestore.FieldValue.increment(1) });

  if (authorUID && authorUID !== myUID) {
    const notifRef = db.collection("users").doc(authorUID).collection("notifications").doc();
    batch.set(notifRef, {
      type:        "comment",
      fromUID:     myUID,
      fromName:    myData.displayName || "",
      fromAvatar:  myData.photoURL    || "",
      postID:      postId,
      postSnippet: postSnippet,
      isRead:      false,
      createdAt:   now,
    });
  }

  await batch.commit();
  return { success: true, commentId: commentRef.id };
});

// ─────────────────────────────────────────────
// editComment
// 觸發：Callable function（Gen 1）
// 動作：編輯自己的留言
// ─────────────────────────────────────────────
exports.editComment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be logged in.");
  }

  const myUID = context.auth.uid;
  const { postId, commentId, content } = data;

  if (!postId || typeof postId !== "string") {
    throw new functions.https.HttpsError("invalid-argument", "postId is required.");
  }
  if (!commentId || typeof commentId !== "string") {
    throw new functions.https.HttpsError("invalid-argument", "commentId is required.");
  }
  if (!content || typeof content !== "string" || content.trim() === "") {
    throw new functions.https.HttpsError("invalid-argument", "content is required.");
  }
  if (content.length > 500) {
    throw new functions.https.HttpsError("invalid-argument", "content must be 500 characters or fewer.");
  }

  const commentRef = db.collection("posts").doc(postId).collection("comments").doc(commentId);
  const commentSnap = await commentRef.get();

  if (!commentSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Comment not found.");
  }
  if (commentSnap.data().authorUID !== myUID) {
    throw new functions.https.HttpsError("permission-denied", "Not the author.");
  }

  await commentRef.update({
    content:  content.trim(),
    editedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
});

// ─────────────────────────────────────────────
// deleteComment
// 觸發：Callable function（Gen 1）
// 動作：刪除自己的留言，commentCount -1
// ─────────────────────────────────────────────
exports.deleteComment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be logged in.");
  }

  const myUID = context.auth.uid;
  const { postId, commentId } = data;

  if (!postId || typeof postId !== "string") {
    throw new functions.https.HttpsError("invalid-argument", "postId is required.");
  }
  if (!commentId || typeof commentId !== "string") {
    throw new functions.https.HttpsError("invalid-argument", "commentId is required.");
  }

  const postRef    = db.collection("posts").doc(postId);
  const commentRef = postRef.collection("comments").doc(commentId);
  const commentSnap = await commentRef.get();

  if (!commentSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Comment not found.");
  }
  if (commentSnap.data().authorUID !== myUID) {
    throw new functions.https.HttpsError("permission-denied", "Not the author.");
  }

  const batch = db.batch();
  batch.delete(commentRef);
  batch.update(postRef, { commentCount: admin.firestore.FieldValue.increment(-1) });
  await batch.commit();

  return { success: true };
});

// ─────────────────────────────────────────────
// createPost
// 觸發：Callable function（Gen 1）
// 動作：建立新貼文
// ─────────────────────────────────────────────
exports.createPost = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be logged in.");
  }

  const { title, content, topicTitle, topicCategory, rating, imageURLs, tags } = data;

  if (!title || typeof title !== "string" || title.trim() === "") {
    throw new functions.https.HttpsError("invalid-argument", "title is required.");
  }
  if (!content || typeof content !== "string" || content.trim() === "") {
    throw new functions.https.HttpsError("invalid-argument", "content is required.");
  }
  if (!topicTitle || typeof topicTitle !== "string" || topicTitle.trim() === "") {
    throw new functions.https.HttpsError("invalid-argument", "topicTitle is required.");
  }
  if (!topicCategory || typeof topicCategory !== "string" || topicCategory.trim() === "") {
    throw new functions.https.HttpsError("invalid-argument", "topicCategory is required.");
  }
  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    throw new functions.https.HttpsError("invalid-argument", "rating must be between 1 and 5.");
  }

  const myUID      = context.auth.uid;
  const myUserRef  = db.collection("users").doc(myUID);
  const myUserSnap = await myUserRef.get();
  const myData     = myUserSnap.exists ? myUserSnap.data() : {};

  const postRef = db.collection("posts").doc();
  await postRef.set({
    title:         title.trim(),
    content:       content.trim(),
    topicTitle:    topicTitle.trim(),
    topicCategory: topicCategory.trim(),
    rating:        rating,
    imageURLs:     Array.isArray(imageURLs) ? imageURLs : [],
    tags:          Array.isArray(tags) ? tags.filter((t) => typeof t === "string" && t.trim()) : [],
    authorUID:     myUID,
    authorName:    myData.displayName || "",
    authorAvatar:  myData.photoURL    || "",
    likeCount:     0,
    commentCount:  0,
    createdAt:     admin.firestore.FieldValue.serverTimestamp(),
  });

  return { id: postRef.id };
});

// ─────────────────────────────────────────────
// onUserCreated
// 觸發：新用戶第一次註冊時（Firebase Auth）
// 動作：在 users/{uid} 建立初始文件
// ─────────────────────────────────────────────
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  const { uid, displayName, photoURL, email } = user;

  // userHandle = Gmail 前綴（去掉特殊字元，全小寫）
  const emailPrefix = email ? email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "") : "";
  const userHandle = emailPrefix || uid.substring(0, 8);

  // displayName = Google 名稱 → userHandle
  const name = displayName || userHandle;

  await db.collection("users").doc(uid).set({
    displayName: name,
    userHandle: userHandle,
    photoURL: photoURL || "",
    email: email || "",
    bio: "",
    followerCount: 0,
    followingCount: 0,
    handleChangeCount: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
});

// ─────────────────────────────────────────────
// sendNotificationPush
// 觸發：users/{userUID}/notifications/{notifID} 建立時
// 動作：透過 OneSignal 推送 Push Notification
// ─────────────────────────────────────────────
const ONESIGNAL_REST_KEY = defineSecret("ONESIGNAL_REST_KEY");
const ONESIGNAL_APP_ID   = "a640801b-7b61-43ea-ba2a-ce743b76c44b";

exports.sendNotificationPush = onDocumentCreated(
  {
    document: "users/{userUID}/notifications/{notifID}",
    secrets:  [ONESIGNAL_REST_KEY],
  },
  async (event) => {
    const data      = event.data.data();
    const toUserUID = event.params.userUID;
    const { type, fromName, postSnippet } = data;

    // 不推送給自己
    if (data.fromUID === toUserUID) return;

    const title   = "Junlando";
    const message = type === "like"
      ? `${fromName} 按讚了你的貼文`
      : type === "follow"
        ? `${fromName} 開始追蹤你`
        : `${fromName} 回覆了你的貼文`;
    const body = (type !== "follow" && postSnippet) ? `「${postSnippet}」` : "";

    try {
      const res = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Basic ${ONESIGNAL_REST_KEY.value()}`,
        },
        body: JSON.stringify({
          app_id:          ONESIGNAL_APP_ID,
          include_aliases: { external_id: [toUserUID] },
          target_channel:  "push",
          headings:        { en: title, "zh-TW": title },
          contents:        {
            en:      `${message}${body ? "\n" + body : ""}`,
            "zh-TW": `${message}${body ? "\n" + body : ""}`,
          },
          data: {
            postID: data.postID,
            type:   type,
          },
          ios_badgeType:  "Increase",
          ios_badgeCount: 1,
        }),
      });

      if (!res.ok) {
        functions.logger.error("[OneSignal] error:", await res.text());
      } else {
        functions.logger.log(`[OneSignal] push sent to ${toUserUID} (${type})`);
      }
    } catch (err) {
      functions.logger.error("[OneSignal] fetch failed:", err);
    }
  }
);

// ─────────────────────────────────────────────
// onPostCreated — post 新增時更新 tags collection
// ─────────────────────────────────────────────
exports.onPostCreated = onDocumentCreated(
  { document: "posts/{postId}", region: "us-central1" },
  async (event) => {
    const tags = event.data.data().tags;
    if (!Array.isArray(tags) || tags.length === 0) return;

    const now = admin.firestore.FieldValue.serverTimestamp();
    const batch = db.batch();

    for (const tag of tags) {
      if (typeof tag !== "string" || !tag.trim()) continue;
      const tagRef = db.collection("tags").doc(tag.trim());
      batch.set(tagRef, {
        name:      tag.trim(),
        postCount: admin.firestore.FieldValue.increment(1),
        updatedAt: now,
        createdAt: now,
      }, { merge: true });
    }

    await batch.commit();
  }
);

// ─────────────────────────────────────────────
// onPostDeleted — post 刪除時更新 tags collection
// ─────────────────────────────────────────────
exports.onPostDeleted = onDocumentDeleted(
  { document: "posts/{postId}", region: "us-central1" },
  async (event) => {
    const tags = event.data.data().tags;
    if (!Array.isArray(tags) || tags.length === 0) return;

    const now = admin.firestore.FieldValue.serverTimestamp();

    await Promise.all(tags.map(async (tag) => {
      if (typeof tag !== "string" || !tag.trim()) return;
      const tagRef = db.collection("tags").doc(tag.trim());
      const snap = await tagRef.get();
      if (!snap.exists) return;

      const current = snap.data().postCount || 0;
      await tagRef.update({
        postCount: Math.max(0, current - 1),
        updatedAt: now,
      });
    }));
  }
);

// ─────────────────────────────────────────────
// onPostUpdated — post 編輯時，只更新有變動的 tags
// ─────────────────────────────────────────────
exports.onPostUpdated = onDocumentUpdated(
  { document: "posts/{postId}", region: "us-central1" },
  async (event) => {
    const before = event.data.before.data().tags || [];
    const after  = event.data.after.data().tags  || [];

    if (!Array.isArray(before) || !Array.isArray(after)) return;

    const beforeSet = new Set(before.filter((t) => typeof t === "string" && t.trim()));
    const afterSet  = new Set(after.filter((t) => typeof t === "string" && t.trim()));

    const added   = [...afterSet].filter((t) => !beforeSet.has(t));
    const removed = [...beforeSet].filter((t) => !afterSet.has(t));

    if (added.length === 0 && removed.length === 0) return;

    const now = admin.firestore.FieldValue.serverTimestamp();
    const batch = db.batch();

    for (const tag of added) {
      const tagRef = db.collection("tags").doc(tag);
      batch.set(tagRef, {
        name:      tag,
        postCount: admin.firestore.FieldValue.increment(1),
        updatedAt: now,
        createdAt: now,
      }, { merge: true });
    }

    for (const tag of removed) {
      const tagRef = db.collection("tags").doc(tag);
      const snap = await tagRef.get();
      if (!snap.exists) continue;
      const current = snap.data().postCount || 0;
      batch.update(tagRef, {
        postCount: Math.max(0, current - 1),
        updatedAt: now,
      });
    }

    await batch.commit();
  }
);
