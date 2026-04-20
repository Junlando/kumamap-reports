const {onRequest} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

setGlobalOptions({maxInstances: 10});
initializeApp();
const db = getFirestore();

// Default fallback OG info (shown when post is not found)
const DEFAULT_OG = {
  title: "Junlando – 日本旅遊社群",
  description: "分享日本旅遊資訊、優惠券、景點推薦的社群平台",
  image: "https://share.junlando.com/og-default.png",
};

// Where real users get redirected after seeing OG tags
const POST_BASE_URL = "https://share.junlando.com/post";
const SITE_URL = "https://share.junlando.com";

/**
 * sharePost
 * Handles /p/:postId — returns OG meta tags for social crawlers (LINE, FB),
 * then JS-redirects real users to the full post page.
 */
exports.sharePost = onRequest(async (req, res) => {
  // Extract postId from path, e.g. /p/abc123
  const pathParts = req.path.split("/").filter(Boolean);
  const postId = pathParts[pathParts.length - 1];

  let og = {...DEFAULT_OG};
  let postFound = false;

  if (postId && postId !== "p") {
    try {
      const doc = await db.collection("posts").doc(postId).get();

      if (doc.exists) {
        const data = doc.data();
        const title = data.title || DEFAULT_OG.title;
        const authorName = data.authorName || "";
        const description = data.content ?
          data.content.substring(0, 100).replace(/\n/g, " ") :
          DEFAULT_OG.description;
        const image =
          Array.isArray(data.imageURLs) && data.imageURLs.length > 0 ?
            data.imageURLs[0] :
            DEFAULT_OG.image;

        og = {
          title: authorName ? `${title} – by ${authorName}` : title,
          description,
          image,
        };
        postFound = true;
      }
    } catch (err) {
      logger.error("Firestore error for postId:", postId, err);
    }
  }

  const redirectUrl = postFound ?
    `${POST_BASE_URL}/${encodeURIComponent(postId)}` :
    SITE_URL;

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
  <meta property="og:type"        content="article" />
  <meta property="og:site_name"   content="Junlando" />
  <meta property="og:title"       content="${esc(og.title)}" />
  <meta property="og:description" content="${esc(og.description)}" />
  <meta property="og:image"       content="${esc(og.image)}" />
  <meta property="og:url"         content="${esc(redirectUrl)}" />
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${esc(og.title)}" />
  <meta name="twitter:description" content="${esc(og.description)}" />
  <meta name="twitter:image"       content="${esc(og.image)}" />
  <meta name="description" content="${esc(og.description)}" />
  <title>${esc(og.title)}</title>
  <script>window.location.replace("${esc(redirectUrl)}");</script>
</head>
<body>
  <p>正在跳轉… <a href="${esc(redirectUrl)}">點此前往</a></p>
</body>
</html>`;

  res.set("Cache-Control", "public, max-age=300, s-maxage=300");
  res.status(200).send(html);
});
