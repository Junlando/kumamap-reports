/**
 * share.js — 自訂分享 bottom sheet
 * 使用方式：
 *   1. <script src="/js/share.js"></script>
 *   2. openShareSheet(url, title)
 */
(function () {
  /* ── CSS ─────────────────────────────────────────────── */
  const CSS = `
  .share-sheet-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.45);
    z-index: 400;
    align-items: flex-end;
    justify-content: center;
  }
  .share-sheet-overlay.open { display: flex; }

  .share-sheet {
    background: #fff;
    border-radius: 20px 20px 0 0;
    width: 100%;
    max-width: 680px;
    padding: 20px 20px max(24px, env(safe-area-inset-bottom));
    animation: shareSlideUp 0.22s ease;
  }
  @keyframes shareSlideUp {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }

  .share-sheet-title {
    font-size: 13px;
    font-weight: 600;
    color: #9CA3AF;
    text-align: center;
    margin-bottom: 20px;
    letter-spacing: 0.04em;
  }

  .share-sheet-options {
    display: flex;
    justify-content: center;
    gap: 24px;
    margin-bottom: 20px;
  }

  .share-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    background: none;
    border: none;
    font-family: inherit;
    padding: 0;
    min-width: 60px;
  }
  .share-option:hover .share-option-icon { opacity: 0.82; transform: scale(0.96); }

  .share-option-icon {
    width: 56px; height: 56px;
    border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    transition: opacity 0.15s, transform 0.15s;
    flex-shrink: 0;
    overflow: hidden;
  }
  .share-option-icon svg { width: 28px; height: 28px; display: block; }

  .share-option-label {
    font-size: 12px;
    font-weight: 500;
    color: #374151;
  }

  .share-cancel-btn {
    display: block;
    width: 100%;
    padding: 14px;
    border: none;
    border-radius: 14px;
    background: #F3F4F6;
    color: #374151;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.12s;
  }
  .share-cancel-btn:hover { background: #E5E7EB; }

  .share-copied-toast {
    position: fixed;
    bottom: 90px;
    left: 50%;
    transform: translateX(-50%) translateY(10px);
    background: rgba(17,24,39,0.82);
    color: #fff;
    padding: 10px 20px;
    border-radius: 50px;
    font-size: 14px;
    font-weight: 500;
    opacity: 0;
    transition: opacity 0.2s, transform 0.2s;
    z-index: 500;
    white-space: nowrap;
    pointer-events: none;
  }
  .share-copied-toast.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  /* ── Lazy overlay init (needs document.body) ─────────── */
  let overlay = null;

  function ensureOverlay() {
    if (overlay) return;

    overlay = document.createElement('div');
    overlay.className = 'share-sheet-overlay';
    overlay.innerHTML = `
      <div class="share-sheet" id="share-sheet-inner">
        <div class="share-sheet-title">分享到</div>
        <div class="share-sheet-options" id="share-sheet-options"></div>
        <button class="share-cancel-btn">取消</button>
      </div>`;

    document.body.appendChild(overlay);

    // Close on backdrop click
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeSheet();
    });
    // Prevent inner clicks from closing
    overlay.querySelector('#share-sheet-inner').addEventListener('click', e => e.stopPropagation());
    // Cancel button
    overlay.querySelector('.share-cancel-btn').addEventListener('click', closeSheet);
  }

  function closeSheet() {
    if (overlay) overlay.classList.remove('open');
  }

  function showCopiedToast() {
    let t = document.getElementById('share-copied-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'share-copied-toast';
      t.className = 'share-copied-toast';
      document.body.appendChild(t);
    }
    t.textContent = '連結已複製';
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* ── Options ─────────────────────────────────────────── */
  function buildOptions(url, title) {
    const enc   = encodeURIComponent(url);
    const encT  = encodeURIComponent(title || '');

    return [
      {
        label: 'LINE',
        bg: '#00B900',
        svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <rect width="40" height="40" rx="10" fill="#00B900"/>
          <path d="M20 7C13.37 7 8 11.48 8 17c0 3.56 2.3 6.7 5.8 8.55-.25.9-.9 3.27-.98 3.56-.1.36.14.36.29.26.12-.07 4.78-3.07 6.72-4.32.69.1 1.41.15 2.17.15 6.63 0 12-4.48 12-10S26.63 7 20 7Z" fill="white"/>
        </svg>`,
        action: () => window.open(`https://social-plugins.line.me/lineit/share?url=${enc}`, '_blank', 'noopener'),
      },
      {
        label: 'Messenger',
        bg: '#0084FF',
        svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <rect width="40" height="40" rx="10" fill="#0084FF"/>
          <path d="M20 6C12.27 6 6 11.85 6 19.1c0 3.9 1.67 7.38 4.38 9.84V33l4.32-2.37c1.15.32 2.37.49 3.63.49h.02c7.72 0 14-5.85 14-13.1C32 11.85 27.73 6 20 6zm1.41 17.64-3.57-3.8-6.97 3.8 7.66-8.13 3.66 3.8 6.88-3.8-7.66 8.13z" fill="white"/>
        </svg>`,
        action: () => window.open(`https://www.facebook.com/dialog/send?link=${enc}&app_id=966242223397117&redirect_uri=${enc}`, '_blank', 'noopener'),
      },
      {
        label: 'Facebook',
        bg: '#1877F2',
        svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <rect width="40" height="40" rx="10" fill="#1877F2"/>
          <path d="M27 8h-4c-2.76 0-5 2.24-5 5v3h-3v4h3v12h4V20h3l1-4h-4v-3c0-.55.45-1 1-1h3V8z" fill="white"/>
        </svg>`,
        action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${enc}`, '_blank', 'noopener'),
      },
      {
        label: 'X',
        bg: '#000',
        svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <rect width="40" height="40" rx="10" fill="#000"/>
          <path d="M22.16 18.37 28.93 10h-1.6l-5.87 6.82L16.75 10H11l7.1 10.33L11 30h1.6l6.21-7.21L24.25 30H30l-7.84-11.63zm-2.2 2.56-.72-1.03-5.72-8.18h2.46l4.62 6.6.72 1.03 6 8.57h-2.46l-4.9-6.99z" fill="white"/>
        </svg>`,
        action: () => window.open(`https://twitter.com/intent/tweet?url=${enc}&text=${encT}`, '_blank', 'noopener'),
      },
      {
        label: '複製連結',
        bg: '#F3F4F6',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>`,
        action: () => {
          navigator.clipboard.writeText(url)
            .catch(() => {
              const ta = document.createElement('textarea');
              ta.value = url;
              ta.style.cssText = 'position:fixed;opacity:0';
              document.body.appendChild(ta);
              ta.select();
              document.execCommand('copy');
              ta.remove();
            })
            .finally(() => { showCopiedToast(); closeSheet(); });
          // also handle the case where clipboard returns a resolved promise
          showCopiedToast();
          closeSheet();
        },
      },
    ];
  }

  /* ── Public API ──────────────────────────────────────── */
  window.openShareSheet = function (url, title) {
    ensureOverlay();

    const optionsEl = overlay.querySelector('#share-sheet-options');
    optionsEl.innerHTML = '';

    buildOptions(url, title).forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'share-option';

      const iconWrap = document.createElement('div');
      iconWrap.className = 'share-option-icon';
      iconWrap.style.background = opt.bg;
      iconWrap.innerHTML = opt.svg;

      const label = document.createElement('span');
      label.className = 'share-option-label';
      label.textContent = opt.label;

      btn.appendChild(iconWrap);
      btn.appendChild(label);
      btn.addEventListener('click', opt.action);
      optionsEl.appendChild(btn);
    });

    overlay.classList.add('open');
  };
})();
