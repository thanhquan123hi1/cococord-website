/* global SockJS, Stomp, fetchWithAuth, getAccessToken */

(function () {
    const el = {
        serverList: document.getElementById('serverList'),
        serverName: document.getElementById('serverName'),
        channelList: document.getElementById('channelList'),
        channelName: document.getElementById('channelName'),
        messageList: document.getElementById('messageList'),
        chatEmpty: document.getElementById('chatEmpty'),
        chatComposer: document.getElementById('chatComposer'),
        chatInput: document.getElementById('chatInput'),
        ucpAvatar: document.getElementById('ucpAvatar'),
        ucpName: document.getElementById('ucpName'),
        ucpStatus: document.getElementById('ucpStatus')
    };

    let stompClient = null;
    let channelSubscription = null;

    let servers = [];
    let channels = [];

    let activeServerId = null;
    let activeChannelId = null;

    function getQueryParams() {
        const params = new URLSearchParams(window.location.search);
        const serverId = params.get('serverId');
        const channelId = params.get('channelId');
        return {
            serverId: serverId ? Number(serverId) : null,
            channelId: channelId ? Number(channelId) : null
        };
    }

    function setQueryParams(next) {
        const params = new URLSearchParams(window.location.search);
        if (next.serverId != null) params.set('serverId', String(next.serverId));
        if (next.channelId != null) params.set('channelId', String(next.channelId));
        history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    }

    async function apiGet(url) {
        const res = await fetchWithAuth(url);
        if (!res || !res.ok) {
            const text = res ? await res.text().catch(() => '') : '';
            throw new Error(text || `Request failed: ${res ? res.status : 'no response'}`);
        }
        return res.json();
    }

    function formatTime(isoString) {
        if (!isoString) return '';
        const d = new Date(isoString);
        if (Number.isNaN(d.getTime())) return '';
        return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
    }

    function discriminatorFromId(id) {
        const n = Number(id);
        if (!Number.isFinite(n)) return '0000';
        return String(n % 10000).padStart(4, '0');
    }

    function escapeHtml(text) {
        return String(text)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function renderServerList() {
        el.serverList.innerHTML = '';

        if (!servers.length) {
            const div = document.createElement('div');
            div.className = 'server-item';
            div.title = 'No servers';
            div.textContent = '?';
            el.serverList.appendChild(div);
            return;
        }

        for (const s of servers) {
            const btn = document.createElement('div');
            btn.className = 'server-item' + (String(s.id) === String(activeServerId) ? ' active' : '');
            btn.setAttribute('role', 'button');
            btn.setAttribute('tabindex', '0');
            btn.title = s.name || 'Server';

            if (s.iconUrl) {
                const img = document.createElement('img');
                img.alt = s.name || 'Server';
                img.src = s.iconUrl;
                btn.appendChild(img);
            } else {
                const span = document.createElement('span');
                span.className = 'server-initial';
                span.textContent = (s.name || 'S').trim().charAt(0).toUpperCase();
                btn.appendChild(span);
            }

            btn.addEventListener('click', () => selectServer(s.id));
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectServer(s.id);
                }
            });

            el.serverList.appendChild(btn);
        }
    }

    function renderChannelList() {
        el.channelList.innerHTML = '';

        if (!channels.length) {
            const div = document.createElement('div');
            div.style.padding = '8px';
            div.style.color = 'var(--text-muted)';
            div.textContent = 'Chưa có kênh.';
            el.channelList.appendChild(div);
            return;
        }

        for (const c of channels) {
            const item = document.createElement('div');
            item.className = 'channel-item' + (String(c.id) === String(activeChannelId) ? ' active' : '');
            item.setAttribute('role', 'button');
            item.setAttribute('tabindex', '0');

            const hash = document.createElement('span');
            hash.className = 'hash';
            hash.textContent = '#';
            const name = document.createElement('span');
            name.textContent = c.name || 'channel';

            item.appendChild(hash);
            item.appendChild(name);

            item.addEventListener('click', () => selectChannel(c.id));
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectChannel(c.id);
                }
            });

            el.channelList.appendChild(item);
        }
    }

    function clearMessages() {
        el.messageList.innerHTML = '';
        el.chatEmpty.style.display = 'block';
        el.chatComposer.style.display = 'none';
    }

    function appendMessage(msg) {
        el.chatEmpty.style.display = 'none';

        const row = document.createElement('div');
        row.className = 'message-row';

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        if (msg.avatarUrl) {
            const img = document.createElement('img');
            img.alt = msg.displayName || msg.username || 'User';
            img.src = msg.avatarUrl;
            avatar.innerHTML = '';
            avatar.appendChild(img);
        } else {
            const initial = (msg.displayName || msg.username || 'U').trim().charAt(0).toUpperCase();
            avatar.textContent = initial;
        }

        const body = document.createElement('div');

        const meta = document.createElement('div');
        meta.className = 'message-meta';

        const author = document.createElement('span');
        author.className = 'message-author';
        // Show displayName with username#discriminator
        const displayName = msg.displayName || msg.username || 'User';
        const discriminator = discriminatorFromId(msg.userId || msg.senderId);
        author.textContent = displayName;
        author.title = `${msg.username || 'user'}#${discriminator}`; // Full username on hover

        const time = document.createElement('span');
        time.className = 'message-time';
        time.textContent = formatTime(msg.createdAt);

        meta.appendChild(author);
        meta.appendChild(time);

        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = escapeHtml(msg.content || '');

        body.appendChild(meta);
        body.appendChild(content);

        row.appendChild(avatar);
        row.appendChild(body);

        el.messageList.appendChild(row);
    }

    function scrollToBottom() {
        el.messageList.scrollTop = el.messageList.scrollHeight;
    }

    async function loadMe() {
        try {
            const me = await apiGet('/api/auth/me');
            const displayName = me.displayName || me.username || 'User';
            const discriminator = discriminatorFromId(me.id);
            const fullUsername = `${me.username || 'user'}#${discriminator}`;
            
            el.ucpName.textContent = displayName;
            el.ucpName.title = fullUsername;
            el.ucpStatus.textContent = me.customStatus || fullUsername;
            
            if (me.avatarUrl) {
                el.ucpAvatar.innerHTML = `<img src="${me.avatarUrl}" alt="${displayName}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">`;
            } else {
                el.ucpAvatar.textContent = displayName.trim().charAt(0).toUpperCase();
            }
        } catch (e) {
            // ignore
        }
    }

    async function loadServers() {
        servers = await apiGet('/api/servers');
    }

    async function loadChannels(serverId) {
        channels = await apiGet(`/api/channels/servers/${serverId}/channels`);
        // Sort by position if present
        channels.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    }

    async function loadHistory(channelId) {
        const page = await apiGet(`/api/messages/channel/${channelId}?page=0&size=50`);
        const items = Array.isArray(page.content) ? page.content.slice() : [];
        items.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

        el.messageList.innerHTML = '';
        if (!items.length) {
            el.chatEmpty.style.display = 'block';
        } else {
            el.chatEmpty.style.display = 'none';
            for (const m of items) appendMessage(m);
        }
        el.chatComposer.style.display = 'block';
        scrollToBottom();
    }

    function ensureStompConnected() {
        if (stompClient && stompClient.connected) return Promise.resolve();

        return new Promise((resolve, reject) => {
            const token = getAccessToken && getAccessToken();
            if (!token) {
                reject(new Error('Missing access token'));
                return;
            }

            const socket = new SockJS('/ws');
            stompClient = Stomp.over(socket);
            stompClient.debug = null;

            stompClient.connect(
                { Authorization: `Bearer ${token}` },
                () => resolve(),
                (err) => reject(err)
            );
        });
    }

    async function subscribeToChannel(channelId) {
        await ensureStompConnected();

        if (channelSubscription) {
            try {
                channelSubscription.unsubscribe();
            } catch (e) {
                // ignore
            }
            channelSubscription = null;
        }

        channelSubscription = stompClient.subscribe(`/topic/channel/${channelId}`, (message) => {
            try {
                const payload = JSON.parse(message.body);
                if (String(payload.channelId) !== String(activeChannelId)) return;
                appendMessage(payload);
                scrollToBottom();
            } catch (e) {
                // ignore
            }
        });
    }

    async function selectServer(serverId) {
        activeServerId = serverId;
        setQueryParams({ serverId, channelId: null });

        const server = servers.find(s => String(s.id) === String(serverId));
        el.serverName.textContent = server ? (server.name || 'Server') : 'Server';

        renderServerList();
        clearMessages();

        await loadChannels(serverId);
        renderChannelList();

        const nextChannelId = channels.length ? channels[0].id : null;
        if (nextChannelId != null) {
            await selectChannel(nextChannelId);
        }
    }

    async function selectChannel(channelId) {
        activeChannelId = channelId;
        setQueryParams({ serverId: activeServerId, channelId });

        const channel = channels.find(c => String(c.id) === String(channelId));
        el.channelName.textContent = channel ? (channel.name || 'channel') : 'channel';

        renderChannelList();
        await subscribeToChannel(channelId);
        await loadHistory(channelId);
    }

    function wireComposer() {
        el.chatComposer.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = (el.chatInput.value || '').trim();
            if (!text || !activeChannelId) return;

            if (!stompClient || !stompClient.connected) return;

            stompClient.send(
                '/app/chat.sendMessage',
                {},
                JSON.stringify({ channelId: activeChannelId, content: text })
            );

            el.chatInput.value = '';
        });
    }

    async function init() {
        wireComposer();
        await loadMe();

        const qp = getQueryParams();
        await loadServers();

        // Pick server
        activeServerId = qp.serverId || (servers.length ? servers[0].id : null);
        renderServerList();

        if (!activeServerId) {
            clearMessages();
            return;
        }

        const server = servers.find(s => String(s.id) === String(activeServerId));
        el.serverName.textContent = server ? (server.name || 'Server') : 'Server';

        await loadChannels(activeServerId);
        activeChannelId = qp.channelId || (channels.length ? channels[0].id : null);
        renderChannelList();

        if (!activeChannelId) {
            clearMessages();
            return;
        }

        const channel = channels.find(c => String(c.id) === String(activeChannelId));
        el.channelName.textContent = channel ? (channel.name || 'channel') : 'channel';

        await subscribeToChannel(activeChannelId);
        await loadHistory(activeChannelId);
    }

    init().catch((e) => {
        console.error(e);
        clearMessages();
    });
})();
