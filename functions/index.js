const functions = require("firebase-functions");
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
const WEB_APP_BASE_URL = "https://junlando.com/junlando";

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
        const title = data.title || DEFAULT_OG.title;
        const authorName = data.authorName || "";
        const content = data.content
          ? data.content.substring(0, 100).replace(/\n/g, " ")
          : DEFAULT_OG.description;
        // Use first image as OG image; fallback to default
        const image =
          Array.isArray(data.imageURLs) && data.imageURLs.length > 0
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
  <meta property="og:url"         content="${esc(redirectUrl)}" />

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
