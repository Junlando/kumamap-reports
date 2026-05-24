/**
 * analytics-events.js
 * 共用 Analytics 追蹤模組。
 * 用法：
 *   import { initTracking } from './analytics-events.js';
 *   initTracking(getAnalytics(app));
 *
 * 在非 module script 裡直接呼叫 window.track(event, params)
 */

import { logEvent } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-analytics.js";

let _analytics = null;

export function initTracking(analytics) {
  _analytics = analytics;

  // 全域 track()，讓非 module 的 script 也能呼叫
  window.track = (event, params = {}) => {
    if (!_analytics) return;
    try { logEvent(_analytics, event, params); } catch(e) {}
  };

  // 自動捕捉所有有 data-track 屬性的點擊
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-track]');
    if (!el) return;
    const params = el.dataset.trackParams
      ? JSON.parse(el.dataset.trackParams)
      : {};
    window.track(el.dataset.track, params);
    // 第二個細項 event（用於縣市細分）
    if (el.dataset.track2) window.track(el.dataset.track2, {});
  }, { passive: true });
}
