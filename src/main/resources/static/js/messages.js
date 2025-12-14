/* Direct Messages page (Discord-like, desktop-first) */

(() => {
  const state = {
    currentUser: null,
    servers: [],
    dmItems: [],
    presenceByUsername: new Map(),
    dmGroupId: null,
    dmGroup: null,
    messages: [],
    stomp: null,
    dmSearch: ''
  };

  const els = {
    serverList: () => document.getElementById('serverList'),
    dmList: () => document.getElementById('dmList'),
    globalSearch: () => document.getElementById('globalSearch'),
    dmTitle: () => document.getElementById('dmTitle'),
    dmMessages: () => document.getElementById('dmMessages'),
    dmEmpty: () => document.getElementById('dmEmpty'),
    dmComposer: () => document.getElementById('dmComposer'),
    dmInput: () => document.getElementById('dmInput')
  };

  function safeText(value) {
    return (value ?? '').toString();
  }

  function escapeHtml(str) {
    return safeText(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function discriminatorFromId(id) {
    const n = Number(id);
    if (!Number.isFinite(n)) return '0000';
    return String(n % 10000).padStart(4, '0');
  }

  function renderServerBar() {
    const container = els.serverList();
    if (!container) return;

    const servers = (state.servers || []).slice(0, 50);
    container.innerHTML = '';
    if (!servers.length) return;

    for (const s of servers) {
      const name = safeText(s.name || 'Server');
      const id = s.id;

      const a = document.createElement('a');
      a.className = 'server-btn server';
      a.href = `/chat?serverId=${encodeURIComponent(id)}`;
      a.title = name;

      if (s.iconUrl) {
        a.innerHTML = `<img src="${escapeHtml(s.iconUrl)}" alt="${escapeHtml(name)}" />`;
      } else {
        const initial = name.trim().charAt(0).toUpperCase() || 'S';
        a.innerHTML = `<span>${escapeHtml(initial)}</span>`;
      }

      container.appendChild(a);
    }
  }

  function displayName(user) {
    return user?.displayName || user?.username || 'Unknown';
  }

  function isOnline(user) {
    const username = user?.username;
    if (!username) return false;
    const presence = state.presenceByUsername.get(username);
    const p = presence?.status || presence;
    if (p) return String(p).toUpperCase() === 'ONLINE';
    const s = user?.status;
    return String(s || '').toUpperCase() === 'ONLINE';
  }

  async function apiJson(url, options = {}) {
    const response = await (window.CoCoCordApp?.apiRequest
      ? window.CoCoCordApp.apiRequest(url, options)
      : fetch(url, options));

    if (!response) return null;
    if (response.status === 204) return null;
    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login';
        return null;
      }
      const text = await response.text().catch(() => '');
      throw new Error(text || `Request failed: ${response.status}`);
    }
    return response.json();
  }

  async function loadCurrentUser() {
    state.currentUser = await apiJson('/api/auth/me', { method: 'GET' });
    try {
      localStorage.setItem('user', JSON.stringify(state.currentUser || {}));
    } catch (_) {
      // ignore
    }
  }

  async function loadServers() {
    state.servers = (await apiJson('/api/servers', { method: 'GET' })) || [];
  }

  async function loadDmSidebar() {
    state.dmItems = (await apiJson('/api/direct-messages/sidebar', { method: 'GET' })) || [];
  }

  function readQuery() {
    const url = new URL(window.location.href);
    const dmGroupId = url.searchParams.get('dmGroupId');
    if (dmGroupId) state.dmGroupId = dmGroupId;
  }

  function connectPresenceAndDm() {
    const token = localStorage.getItem('accessToken');
    if (!token || !window.SockJS || !window.Stomp) return;

    const socket = new window.SockJS('/ws');
    const stomp = window.Stomp.over(socket);
    stomp.debug = null;

    stomp.connect(
      { Authorization: 'Bearer ' + token },
      () => {
        state.stomp = stomp;

        stomp.subscribe('/topic/presence', (msg) => {
          try {
            const presence = JSON.parse(msg.body);
            if (presence?.username) {
              state.presenceByUsername.set(presence.username, presence);
              renderDmList();
            }
          } catch (_) {
            // ignore
          }
        });

        if (state.dmGroupId) {
          stomp.subscribe(`/topic/dm/${state.dmGroupId}`, (msg) => {
            try {
              const m = JSON.parse(msg.body);
              if (!m) return;
              // Append live message
              state.messages.push(m);
              renderMessages();
              scrollToBottom();
            } catch (_) {
              // ignore
            }
          });
        }

        try {
          stomp.send('/app/presence.update', {}, JSON.stringify({ status: 'ONLINE' }));
        } catch (_) {
          // ignore
        }
      },
      () => {
        // ignore
      }
    );
  }

  function renderDmList() {
    const container = els.dmList();
    if (!container) return;

    const q = state.dmSearch.trim().toLowerCase();
    const items = (state.dmItems || [])
      .filter((it) => {
        if (!q) return true;
        const key = `${it.displayName || ''} ${it.username || ''}`.toLowerCase();
        return key.includes(q);
      })
      .slice(0, 50);

    if (!items.length) {
      container.innerHTML = '<div style="padding: 8px 10px; color:#6a6f77; font-size: 13px;">Không có kết quả</div>';
      return;
    }

    container.innerHTML = items
      .map((it) => {
        const online = isOnline(it);
        const avatar = it.avatarUrl ? `<img src="${it.avatarUrl}" alt="">` : '';
        const unread = Number(it.unreadCount || 0);
        const active = state.dmGroupId && String(it.dmGroupId) === String(state.dmGroupId);
        const unreadText = unread > 99 ? '99+' : String(unread);
        return `
          <div class="dm-row ${active ? 'active' : ''}" role="listitem" data-dm-group-id="${it.dmGroupId}">
            <div class="avatar">${avatar}<span class="status-dot ${online ? 'online' : ''}"></span></div>
            <div class="dm-name">${escapeHtml(it.displayName || it.username || 'Unknown')}</div>
            <div class="dm-right">
              <span class="unread-pill ${unread > 0 ? 'show' : ''}">${escapeHtml(unreadText)}</span>
            </div>
          </div>
        `;
      })
      .join('');

    container.querySelectorAll('.dm-row').forEach((row) => {
      row.addEventListener('click', () => {
        const dmGroupId = row.getAttribute('data-dm-group-id');
        if (!dmGroupId) return;
        localStorage.setItem('activeDmGroupId', String(dmGroupId));
        window.location.href = `/messages?dmGroupId=${encodeURIComponent(dmGroupId)}`;
      });
    });
  }

  async function loadDmGroupAndMessages() {
    if (!state.dmGroupId) return;

    state.dmGroup = await apiJson(`/api/direct-messages/${encodeURIComponent(state.dmGroupId)}`, { method: 'GET' });
    const page = await apiJson(`/api/direct-messages/${encodeURIComponent(state.dmGroupId)}/messages?page=0&size=50`, { method: 'GET' });

    // Spring Data Page
    state.messages = (page && Array.isArray(page.content)) ? page.content.slice().reverse() : [];

    try {
      await apiJson(`/api/direct-messages/${encodeURIComponent(state.dmGroupId)}/read`, { method: 'POST' });
    } catch (_) {
      // ignore
    }
  }

  function renderHeader() {
    const title = els.dmTitle();
    if (!title) return;

    if (!state.dmGroupId) {
      title.textContent = 'Direct Messages';
      return;
    }

    // Best-effort label
    const label = state.dmGroup?.name || `DM #${state.dmGroupId}`;
    title.textContent = label;
  }

  function renderMessages() {
    const container = els.dmMessages();
    if (!container) return;

    const empty = els.dmEmpty();
    const composer = els.dmComposer();

    if (!state.dmGroupId) {
      if (composer) composer.style.display = 'none';
      if (empty) empty.style.display = '';
      container.scrollTop = 0;
      return;
    }

    if (empty) empty.style.display = 'none';
    if (composer) composer.style.display = 'flex';

    const rows = state.messages.map((m) => {
      const avatar = m.senderAvatarUrl ? `<img src="${m.senderAvatarUrl}" alt="">` : '';
      const displayName = m.senderDisplayName || m.senderUsername || 'Unknown';
      const discriminator = discriminatorFromId(m.senderId);
      const fullUsername = `${m.senderUsername || 'user'}#${discriminator}`;
      const text = escapeHtml(m.content || '');
      return `
        <div class="dm-message">
          <div class="avatar">${avatar}</div>
          <div class="msg-body">
            <div class="msg-author" title="${escapeHtml(fullUsername)}">${escapeHtml(displayName)}</div>
            <div class="msg-text">${text}</div>
          </div>
        </div>
      `;
    });

    container.innerHTML = rows.join('');
  }

  function scrollToBottom() {
    const container = els.dmMessages();
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }

  async function sendMessage(text) {
    if (!state.dmGroupId) return;
    const content = (text || '').trim();
    if (!content) return;

    // Use REST for persistence; WebSocket broadcast is handled by server when DM is sent via WS,
    // but REST is reliable for now.
    const msg = await apiJson(`/api/direct-messages/${encodeURIComponent(state.dmGroupId)}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, attachmentUrls: [] })
    });

    if (msg) {
      state.messages.push(msg);
      renderMessages();
      scrollToBottom();
    }
  }

  function wireUi() {
    els.globalSearch()?.addEventListener('input', (e) => {
      state.dmSearch = e.target.value || '';
      renderDmList();
    });

    const form = els.dmComposer();
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = els.dmInput();
      const value = input?.value || '';
      try {
        await sendMessage(value);
        if (input) input.value = '';
      } catch (err) {
        alert(err?.message || 'Gửi tin nhắn thất bại');
      }
    });

    // Prevent placeholder menu items from navigating
    document.querySelectorAll('a.sidebar-item[href="#"]').forEach((a) => {
      a.addEventListener('click', (e) => e.preventDefault());
    });
  }

  async function init() {
    wireUi();
    readQuery();

    await loadCurrentUser();
    if (state.dmGroupId) {
      localStorage.setItem('activeDmGroupId', String(state.dmGroupId));
    }

    await Promise.all([loadServers(), loadDmSidebar()]);
    renderServerBar();
    renderDmList();

    if (state.dmGroupId) {
      await loadDmGroupAndMessages();
    }

    // Refresh sidebar counts after marking as read
    await loadDmSidebar();
    renderDmList();

    renderHeader();
    renderMessages();
    connectPresenceAndDm();

    if (state.dmGroupId) {
      scrollToBottom();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    init().catch((e) => {
      console.error('messages init failed', e);
    });
  });
})();
