/* Friends & Direct Messages (Discord-like) */

(() => {
  const state = {
    currentUser: null,
    servers: [],
    friends: [],
    requests: [],
    dmItems: [],
    activeTab: 'friends',
    presenceByUsername: new Map(),
    stomp: null,
    dmSearch: '',
    friendsSearch: '',
    activeDmGroupId: null
  };

  const els = {
    serverList: () => document.getElementById('serverList'),
    dmList: () => document.getElementById('dmList'),
    globalSearch: () => document.getElementById('globalSearch'),
    friendsSearch: () => document.getElementById('friendsSearch'),
    mainToolbar: () => document.querySelector('.main-toolbar'),
    friendsList: () => document.getElementById('friendsList'),
    addFriendBtn: () => document.getElementById('addFriendBtn'),
    addFriendView: () => document.getElementById('addFriendView'),
    addFriendInput: () => document.getElementById('addFriendInput'),
    sendFriendRequestBtn: () => document.getElementById('sendFriendRequestBtn'),
    addFriendHint: () => document.getElementById('addFriendHint'),
    ucpName: () => document.getElementById('ucpName'),
    ucpStatus: () => document.getElementById('ucpStatus'),
    ucpStatusDot: () => document.getElementById('ucpStatusDot'),
    ucpAvatar: () => document.getElementById('ucpAvatar')
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

  function displayName(user) {
    return user?.displayName || user?.username || 'Unknown';
  }

  function fullUsername(user) {
    const username = user?.username || 'unknown';
    const discriminator = discriminatorFromId(user?.id);
    return `${username}#${discriminator}`;
  }

  function statusText(user) {
    return user?.customStatus || user?.bio || '';
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

    state.activeDmGroupId = localStorage.getItem('activeDmGroupId');
    renderUserPanel();
  }

  function renderUserPanel() {
    const user = state.currentUser;
    const nameEl = els.ucpName();
    const statusEl = els.ucpStatus();
    const dotEl = els.ucpStatusDot();
    const avatarEl = els.ucpAvatar();

    if (nameEl) {
      // Display with username#discriminator below displayName
      const disp = displayName(user);
      const full = fullUsername(user);
      nameEl.textContent = disp;
      nameEl.title = full; // Show full username on hover
    }
    const online = isOnline(user);
    if (statusEl) {
      // Show custom status or username#discriminator
      const customStatus = user?.customStatus;
      if (customStatus) {
        statusEl.textContent = customStatus;
      } else {
        statusEl.textContent = fullUsername(user);
      }
    }
    if (dotEl) dotEl.classList.toggle('online', online);
    if (avatarEl) {
      const url = user?.avatarUrl;
      if (url) {
        avatarEl.innerHTML = `<img src="${escapeHtml(url)}" alt="${escapeHtml(displayName(user))}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">`;
      } else {
        avatarEl.innerHTML = escapeHtml(displayName(user).charAt(0).toUpperCase());
      }
      if (dotEl) avatarEl.appendChild(dotEl);
    }
  }

  async function loadFriends() {
    state.friends = (await apiJson('/api/friends', { method: 'GET' })) || [];
  }

  async function loadServers() {
    state.servers = (await apiJson('/api/servers', { method: 'GET' })) || [];
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
      const href = `/chat?serverId=${encodeURIComponent(id)}`;

      const a = document.createElement('a');
      a.className = 'server-btn server';
      a.href = href;
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

  async function loadRequests() {
    // includes sent+received
    state.requests = (await apiJson('/api/friends/requests', { method: 'GET' })) || [];
  }

  async function loadDmSidebar() {
    state.dmItems = (await apiJson('/api/direct-messages/sidebar', { method: 'GET' })) || [];
  }

  function connectPresence() {
    const token = localStorage.getItem('accessToken');
    if (!token || !window.SockJS || !window.Stomp) return;

    const socket = new window.SockJS('/ws');
    const stomp = window.Stomp.over(socket);
    stomp.debug = null;

    stomp.connect(
      { Authorization: 'Bearer ' + token },
      () => {
        state.stomp = stomp;

        // Subscribe presence broadcast
        stomp.subscribe('/topic/presence', (msg) => {
          try {
            const presence = JSON.parse(msg.body);
            if (presence?.username) {
              state.presenceByUsername.set(presence.username, presence);
              render();
            }
          } catch (_) {
            // ignore
          }
        });

        // Announce our presence
        try {
          stomp.send('/app/presence.update', {}, JSON.stringify({ status: 'ONLINE' }));
        } catch (_) {
          // ignore
        }

        // Best-effort offline
        window.addEventListener('beforeunload', () => {
          try {
            stomp.send('/app/presence.update', {}, JSON.stringify({ status: 'OFFLINE' }));
          } catch (_) {
            // ignore
          }
        });
      },
      () => {
        // ignore
      }
    );
  }

  function setActiveTab(tab) {
    state.activeTab = tab;
    document.querySelectorAll('.tab-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    hideAddFriendView();
    render();
  }

  function showAddFriendView() {
    const list = els.friendsList();
    const view = els.addFriendView();
    const toolbar = els.mainToolbar();
    if (list) list.style.display = 'none';
    if (view) view.style.display = '';
    if (toolbar) toolbar.style.display = 'none';
    const hint = els.addFriendHint();
    if (hint) hint.textContent = '';
    setTimeout(() => els.addFriendInput()?.focus(), 0);
  }

  function hideAddFriendView() {
    const list = els.friendsList();
    const view = els.addFriendView();
    const toolbar = els.mainToolbar();
    if (view) view.style.display = 'none';
    if (list) list.style.display = '';
    if (toolbar) toolbar.style.display = '';
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
        const active = state.activeDmGroupId && String(it.dmGroupId) === String(state.activeDmGroupId);
        const unreadText = unread > 99 ? '99+' : String(unread);
        return `
          <div class="dm-row ${active ? 'active' : ''}" role="listitem" data-dm-group-id="${it.dmGroupId}" data-user-id="${it.userId}">
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
        const userId = row.getAttribute('data-user-id');
        if (dmGroupId) {
          localStorage.setItem('activeDmGroupId', String(dmGroupId));
          state.activeDmGroupId = String(dmGroupId);
          window.location.href = `/messages?dmGroupId=${encodeURIComponent(dmGroupId)}`;
          return;
        }
        if (userId) openDM(userId);
      });
    });
  }

  function renderFriendsList() {
    const container = els.friendsList();
    if (!container) return;

    const q = state.friendsSearch.trim().toLowerCase();

    let list = state.friends.slice();

    if (state.activeTab === 'online') {
      list = list.filter(isOnline);
    } else if (state.activeTab === 'pending') {
      list = []; // handled below
    }

    if (q) {
      list = list.filter((f) => {
        const key = `${displayName(f)} ${f.username || ''} ${statusText(f)}`.toLowerCase();
        return key.includes(q);
      });
    }

    if (state.activeTab === 'pending') {
      const requests = state.requests.slice();

      const reqFiltered = q
        ? requests.filter((r) => {
            const key = `${r.senderUsername || ''} ${r.senderDisplayName || ''} ${r.receiverUsername || ''} ${r.receiverDisplayName || ''} ${r.status || ''}`.toLowerCase();
            return key.includes(q);
          })
        : requests;

      if (!reqFiltered.length) {
        container.innerHTML = emptyMain('Không có lời mời kết bạn');
        return;
      }

      container.innerHTML = reqFiltered
        .map((r) => {
          const isSentByMe = state.currentUser && r.senderUsername === state.currentUser.username;
          const name = isSentByMe
            ? (r.receiverDisplayName || r.receiverUsername || 'Unknown')
            : (r.senderDisplayName || r.senderUsername || 'Unknown');

          const username = isSentByMe ? r.receiverUsername : r.senderUsername;
          const subtitle = `${isSentByMe ? 'Đã gửi' : 'Đã nhận'} • ${safeText(r.status)}`;
          const avatarUrl = isSentByMe ? r.receiverAvatarUrl : r.senderAvatarUrl;
          const id = isSentByMe ? r.receiverId : r.senderId;

          const avatar = avatarUrl ? `<img src="${avatarUrl}" alt="">` : '';

          const actions = !isSentByMe && String(r.status || '').toUpperCase() === 'PENDING'
            ? `
              <button class="icon-btn" type="button" title="Chấp nhận" data-action="accept" data-req-id="${r.id}"><i class="bi bi-check2"></i></button>
              <button class="icon-btn" type="button" title="Từ chối" data-action="decline" data-req-id="${r.id}"><i class="bi bi-x"></i></button>
            `
            : `
              <button class="icon-btn" type="button" title="Hủy" data-action="cancel" data-req-id="${r.id}"><i class="bi bi-x"></i></button>
            `;

          return `
            <div class="friend-row" data-user-id="${id}">
              <div class="friend-left">
                <div class="avatar">${avatar}<span class="status-dot ${username && state.presenceByUsername.get(username)?.status === 'ONLINE' ? 'online' : ''}"></span></div>
                <div class="friend-meta">
                  <div class="friend-title">${escapeHtml(name)}#${escapeHtml(discriminatorFromId(id))}</div>
                  <div class="friend-subtitle">${escapeHtml(subtitle)}</div>
                </div>
              </div>
              <div class="friend-actions">${actions}</div>
            </div>
          `;
        })
        .join('');

      container.querySelectorAll('button[data-action]').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const action = btn.getAttribute('data-action');
          const reqId = btn.getAttribute('data-req-id');
          if (!action || !reqId) return;

          try {
            if (action === 'accept') await apiJson(`/api/friends/requests/${encodeURIComponent(reqId)}/accept`, { method: 'POST' });
            if (action === 'decline') await apiJson(`/api/friends/requests/${encodeURIComponent(reqId)}/decline`, { method: 'POST' });
            if (action === 'cancel') await apiJson(`/api/friends/requests/${encodeURIComponent(reqId)}/cancel`, { method: 'POST' });
            await loadRequests();
            render();
          } catch (err) {
            alert(err?.message || 'Thao tác thất bại');
          }
        });
      });

      return;
    }

    if (!list.length) {
      container.innerHTML = emptyMain('Không có bạn bè');
      return;
    }

    container.innerHTML = list
      .map((f) => {
        const avatar = f.avatarUrl ? `<img src="${f.avatarUrl}" alt="">` : '';
        const online = isOnline(f);
        const title = `${displayName(f)}#${discriminatorFromId(f.id)}`;
        const subtitle = statusText(f) || (online ? 'Đang trực tuyến' : '');
        return `
          <div class="friend-row" data-user-id="${f.id}">
            <div class="friend-left">
              <div class="avatar">${avatar}<span class="status-dot ${online ? 'online' : ''}"></span></div>
              <div class="friend-meta">
                <div class="friend-title">${escapeHtml(title)}</div>
                <div class="friend-subtitle">${escapeHtml(subtitle)}</div>
              </div>
            </div>
            <div class="friend-actions">
              <button class="icon-btn" type="button" title="Mở chat" data-action="chat" data-user-id="${f.id}"><i class="bi bi-chat"></i></button>
              <button class="icon-btn" type="button" title="Menu" data-action="menu" data-user-id="${f.id}"><i class="bi bi-three-dots-vertical"></i></button>
            </div>
          </div>
        `;
      })
      .join('');

    container.querySelectorAll('button[data-action="chat"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const userId = btn.getAttribute('data-user-id');
        if (userId) openDM(userId);
      });
    });

    container.querySelectorAll('.friend-row').forEach((row) => {
      row.addEventListener('click', () => {
        const userId = row.getAttribute('data-user-id');
        if (userId) openDM(userId);
      });
    });
  }

  function emptyMain(text) {
    return `<div style="padding: 16px; color:#6a6f77;">${escapeHtml(text)}</div>`;
  }

  function escapeHtml(str) {
    return safeText(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  async function openDM(userId) {
    try {
      const dmGroup = await apiJson(`/api/direct-messages/create-dm/${encodeURIComponent(userId)}`, { method: 'POST' });
      if (dmGroup?.id) {
        window.location.href = `/messages?dmGroupId=${encodeURIComponent(dmGroup.id)}`;
      }
    } catch (err) {
      alert(err?.message || 'Không thể mở DM');
    }
  }

  async function sendFriendRequestByUsernameOrEmail() {
    const input = els.addFriendInput();
    const hint = els.addFriendHint();
    const value = (input?.value || '').trim();
    if (hint) hint.textContent = '';
    if (!value) return;

    try {
      const results = await apiJson(`/api/users/search?query=${encodeURIComponent(value)}`, { method: 'GET' });
      const users = Array.isArray(results) ? results : [];
      const exact = users.find((u) => String(u.username || '').toLowerCase() === value.toLowerCase())
        || users.find((u) => String(u.email || '').toLowerCase() === value.toLowerCase());

      const target = exact || (users.length === 1 ? users[0] : null);
      if (!target?.id) {
        if (hint) hint.textContent = users.length ? 'Có nhiều kết quả. Hãy nhập chính xác username/email.' : 'Không tìm thấy người dùng.';
        return;
      }

      await apiJson('/api/friends/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverUserId: target.id })
      });

      if (hint) hint.textContent = `Đã gửi lời mời kết bạn tới ${target.displayName || target.username}`;
      if (input) input.value = '';
      await loadRequests();
      setActiveTab('pending');
    } catch (err) {
      if (hint) hint.textContent = err?.message || 'Gửi lời mời thất bại';
    }
  }

  function wireUi() {
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => setActiveTab(btn.dataset.tab));
    });

    els.globalSearch()?.addEventListener('input', (e) => {
      state.dmSearch = e.target.value || '';
      renderDmList();
    });

    els.friendsSearch()?.addEventListener('input', (e) => {
      state.friendsSearch = e.target.value || '';
      renderFriendsList();
    });

    els.addFriendBtn()?.addEventListener('click', showAddFriendView);
    els.sendFriendRequestBtn()?.addEventListener('click', sendFriendRequestByUsernameOrEmail);
    els.addFriendInput()?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendFriendRequestByUsernameOrEmail();
      }
    });

    // Prevent menu items from navigating (placeholders)
    document.querySelectorAll('a.sidebar-item[href="#"]').forEach((a) => {
      a.addEventListener('click', (e) => e.preventDefault());
    });
  }

  function render() {
    renderDmList();
    renderFriendsList();
  }

  async function init() {
    wireUi();

    await loadCurrentUser();
    await Promise.all([loadServers(), loadFriends(), loadRequests(), loadDmSidebar()]);
    renderServerBar();

    connectPresence();
    render();
  }

  document.addEventListener('DOMContentLoaded', () => {
    init().catch((e) => {
      console.error('friends init failed', e);
    });
  });
})();
