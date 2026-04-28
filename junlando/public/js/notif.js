/**
 * notif.js — 共用通知中心
 * 使用方式：
 *   1. <script src="/js/notif.js"></script>
 *   2. 在 header 加 <div id="notif-bell-wrap"></div>
 *   3. onAuthStateChanged 裡呼叫 initNotifBell(db, user)
 */
(function () {
  /* ── CSS ─────────────────────────────────────────────── */
  const CSS = `
  .notif-wrap { position: relative; display: flex; align-items: center; }

  .notif-bell-btn {
    position: relative;
    width: 36px; height: 36px;
    border: none; background: none; cursor: pointer;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: #6B7280;
    transition: background 0.12s;
    flex-shrink: 0;
  }
  .notif-bell-btn:hover { background: #F3F4F8; }
  .notif-bell-btn svg { width: 20px; height: 20px; }

  .notif-badge {
    position: absolute;
    top: 2px; right: 2px;
    background: #EF4444;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    min-width: 16px; height: 16px;
    border-radius: 50px;
    display: flex; align-items: center; justify-content: center;
    padding: 0 3px;
    line-height: 1;
    pointer-events: none;
  }

  .notif-dropdown {
    display: none;
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.14);
    border: 1px solid #E5E7EB;
    width: 320px;
    max-height: 420px;
    overflow: hidden;
    display: none;
    flex-direction: column;
    z-index: 300;
  }
  .notif-dropdown.open { display: flex; }

  .notif-dropdown-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px 10px;
    border-bottom: 1px solid #E5E7EB;
    flex-shrink: 0;
  }
  .notif-dropdown-title { font-size: 15px; font-weight: 700; color: #111827; }
  .notif-read-all-btn {
    font-size: 12px; font-weight: 600;
    color: #2B5CE6; background: none; border: none;
    cursor: pointer; font-family: inherit; padding: 4px 0;
  }
  .notif-read-all-btn:hover { opacity: 0.75; }

  .notif-list {
    overflow-y: auto;
    flex: 1;
  }

  .notif-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 16px;
    cursor: pointer;
    transition: background 0.12s;
    text-decoration: none;
    color: inherit;
    border-bottom: 1px solid #F3F4F8;
    position: relative;
  }
  .notif-item:last-child { border-bottom: none; }
  .notif-item:hover { background: #F9FAFB; }
  .notif-item.unread { background: #EEF2FF; }
  .notif-item.unread:hover { background: #E0E7FF; }

  .notif-avatar {
    width: 38px; height: 38px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    background: linear-gradient(135deg, #2B5CE6, #818CF8);
  }
  .notif-avatar-ph {
    width: 38px; height: 38px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2B5CE6, #818CF8);
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 14px; font-weight: 700;
    flex-shrink: 0;
  }
  .notif-icon-badge {
    position: absolute;
    left: 36px; top: 30px;
    width: 18px; height: 18px;
    border-radius: 50%;
    background: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.15);
  }

  .notif-body { flex: 1; min-width: 0; }
  .notif-text {
    font-size: 13px; line-height: 1.45;
    color: #111827;
  }
  .notif-text strong { font-weight: 600; }
  .notif-snippet {
    font-size: 12px; color: #6B7280;
    margin-top: 2px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .notif-time { font-size: 11px; color: #9CA3AF; margin-top: 3px; }

  .notif-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #2B5CE6;
    flex-shrink: 0;
    margin-top: 5px;
  }

  .notif-empty {
    text-align: center;
    padding: 40px 20px;
    color: #9CA3AF;
    font-size: 14px;
  }
  .notif-empty-icon { font-size: 32px; margin-bottom: 8px; }

  @media (max-width: 400px) {
    .notif-dropdown { width: calc(100vw - 24px); right: -8px; }
  }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  /* ── Helpers ──────────────────────────────────────────── */
  const BELL_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;

  function typeIcon(type) {
    return type === 'like' || type === 'comment_like' ? '❤️'
         : type === 'comment' || type === 'reply'    ? '💬'
         : type === 'follow'                          ? '👤'
         : '🔔';
  }

  function typeText(type, fromName) {
    const n = `<strong>${fromName || '有人'}</strong>`;
    return type === 'like'         ? `${n} 按讚了你的貼文`
         : type === 'comment'      ? `${n} 留言了你的貼文`
         : type === 'comment_like' ? `${n} 按讚了你的留言`
         : type === 'reply'        ? `${n} 回覆了你的留言`
         : type === 'follow'       ? `${n} 開始追蹤你`
         : `${n} 與你互動`;
  }

  function relTime(ts) {
    if (!ts) return '';
    const diff = Date.now() - (ts.toDate ? ts.toDate() : new Date(ts)).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return '剛剛';
    if (m < 60) return `${m} 分鐘前`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} 小時前`;
    const d = Math.floor(h / 24);
    return d < 30 ? `${d} 天前` : (ts.toDate ? ts.toDate() : new Date(ts))
      .toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' });
  }

  /* ── State ────────────────────────────────────────────── */
  let _unsubscribe = null;

  /* ── Public API ───────────────────────────────────────── */
  window.initNotifBell = function (db, currentUser) {
    // Cleanup previous listener
    if (_unsubscribe) { _unsubscribe(); _unsubscribe = null; }

    const wrap = document.getElementById('notif-bell-wrap');
    if (!wrap) return;
    if (!currentUser) { wrap.innerHTML = ''; return; }

    const uid = currentUser.uid;

    /* Build DOM */
    wrap.innerHTML = `
      <div class="notif-wrap" id="notif-wrap">
        <button class="notif-bell-btn" id="notif-bell-btn" aria-label="通知">
          ${BELL_SVG}
          <span class="notif-badge" id="notif-badge" style="display:none"></span>
        </button>
        <div class="notif-dropdown" id="notif-dropdown">
          <div class="notif-dropdown-header">
            <span class="notif-dropdown-title">通知</span>
            <button class="notif-read-all-btn" id="notif-read-all">全部已讀</button>
          </div>
          <div class="notif-list" id="notif-list">
            <div class="notif-empty"><div class="notif-empty-icon">🔔</div>暫無通知</div>
          </div>
        </div>
      </div>`;

    const bellBtn   = document.getElementById('notif-bell-btn');
    const dropdown  = document.getElementById('notif-dropdown');
    const badge     = document.getElementById('notif-badge');
    const list      = document.getElementById('notif-list');
    const readAllBtn = document.getElementById('notif-read-all');

    let unreadIds = [];
    let allDocs   = [];

    /* Toggle dropdown */
    bellBtn.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle('open');
      if (isOpen && unreadIds.length) markRead(db, uid, unreadIds);
    });

    /* Close on outside click */
    document.addEventListener('click', () => dropdown.classList.remove('open'));
    dropdown.addEventListener('click', e => e.stopPropagation());

    /* Mark all read button */
    readAllBtn.addEventListener('click', () => {
      if (unreadIds.length) markRead(db, uid, unreadIds);
    });

    /* Firestore listener */
    _unsubscribe = db.collection('users').doc(uid)
      .collection('notifications')
      .orderBy('createdAt', 'desc')
      .limit(30)
      .onSnapshot(snap => {
        allDocs   = snap.docs;
        unreadIds = snap.docs.filter(d => !d.data().isRead).map(d => d.id);

        /* Update badge */
        if (unreadIds.length > 0) {
          badge.textContent = unreadIds.length > 99 ? '99+' : unreadIds.length;
          badge.style.display = 'flex';
        } else {
          badge.style.display = 'none';
        }

        /* Render list */
        if (allDocs.length === 0) {
          list.innerHTML = `<div class="notif-empty"><div class="notif-empty-icon">🔔</div>暫無通知</div>`;
          return;
        }
        list.innerHTML = '';
        allDocs.forEach(doc => list.appendChild(buildItem(doc)));
      }, err => console.error('[notif]', err));
  };

  function buildItem(doc) {
    const d    = doc.data();
    const isUnread = !d.isRead;
    const href = d.type === 'follow'
      ? `/user/${d.fromUID || ''}`
      : `/post/${d.postID || ''}`;

    const item = document.createElement('a');
    item.className = `notif-item${isUnread ? ' unread' : ''}`;
    item.href = href;

    /* Avatar */
    const avatarWrap = document.createElement('div');
    avatarWrap.style.cssText = 'position:relative;flex-shrink:0';
    if (d.fromAvatar) {
      const img = document.createElement('img');
      img.className = 'notif-avatar';
      img.src = d.fromAvatar; img.alt = '';
      const ph = document.createElement('div');
      ph.className = 'notif-avatar-ph';
      ph.textContent = (d.fromName || '？')[0];
      ph.style.display = 'none';
      img.onerror = () => { img.style.display = 'none'; ph.style.display = 'flex'; };
      avatarWrap.appendChild(img);
      avatarWrap.appendChild(ph);
    } else {
      const ph = document.createElement('div');
      ph.className = 'notif-avatar-ph';
      ph.textContent = (d.fromName || '？')[0];
      avatarWrap.appendChild(ph);
    }
    const iconBadge = document.createElement('div');
    iconBadge.className = 'notif-icon-badge';
    iconBadge.textContent = typeIcon(d.type);
    avatarWrap.appendChild(iconBadge);
    item.appendChild(avatarWrap);

    /* Body */
    const body = document.createElement('div');
    body.className = 'notif-body';
    const text = document.createElement('div');
    text.className = 'notif-text';
    text.innerHTML = typeText(d.type, d.fromName);
    body.appendChild(text);
    if (d.postSnippet) {
      const snippet = document.createElement('div');
      snippet.className = 'notif-snippet';
      snippet.textContent = `「${d.postSnippet}」`;
      body.appendChild(snippet);
    }
    const time = document.createElement('div');
    time.className = 'notif-time';
    time.textContent = relTime(d.createdAt);
    body.appendChild(time);
    item.appendChild(body);

    /* Unread dot */
    if (isUnread) {
      const dot = document.createElement('div');
      dot.className = 'notif-dot';
      item.appendChild(dot);
    }

    return item;
  }

  function markRead(db, uid, ids) {
    if (!ids.length) return;
    const batch = db.batch();
    ids.forEach(id => {
      batch.update(
        db.collection('users').doc(uid).collection('notifications').doc(id),
        { isRead: true }
      );
    });
    batch.commit().catch(e => console.error('[notif] markRead:', e));
  }
})();
