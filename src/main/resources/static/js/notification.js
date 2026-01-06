// Inbox (Notification Center) - Discord-like overlay, realtime via WebSocket.
class InboxManager {
    constructor() {
        this.userId = null;
        this.unreadCount = 0;
        this.notifications = [];
        this.activeTab = 'for-you';
        this.initialLoaded = false;
        this.init();
    }

    async init() {
        this.setupUi();
        this.setupEventListeners();

        // Request browser notification permission (optional)
        if ('Notification' in window && Notification.permission === 'default') {
            try { await Notification.requestPermission(); } catch (_) { /* ignore */ }
        }

        await this.ensureUserId();
        await this.ensureRealtimeSubscriptions();

        // Initial snapshot (no polling).
        await Promise.all([this.loadUnreadCount(), this.loadNotifications(0, 50)]);
        this.initialLoaded = true;
        this.render();
    }

    setupUi() {
        if (document.getElementById('inboxOverlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'inboxOverlay';
        overlay.className = 'inbox-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        overlay.innerHTML = `
            <div class="inbox-panel" role="dialog" aria-label="Hộp thư đến">
                <div class="inbox-header">
                    <div class="inbox-title"><span>Hộp thư đến</span></div>
                    <div class="inbox-actions">
                        <button class="inbox-action-btn" type="button" id="inboxMarkAllReadBtn">Đánh dấu tất cả đã đọc</button>
                        <button class="inbox-action-btn" type="button" id="inboxCloseBtn" aria-label="Đóng">×</button>
                    </div>
                </div>
                <div class="inbox-tabs" role="tablist" aria-label="Inbox tabs">
                    <button class="inbox-tab active" type="button" data-tab="for-you">Dành cho Bạn</button>
                    <button class="inbox-tab" type="button" data-tab="unread">Chưa đọc</button>
                    <button class="inbox-tab" type="button" data-tab="mentions">Đề cập</button>
                </div>
                <div class="inbox-list" id="inboxList"></div>
            </div>
        `;

        document.body.appendChild(overlay);
    }

    setupEventListeners() {
        // Single click handler (capture) so we still work if other handlers stop propagation.
        // Prevents the "open then immediately close" bug by handling toggle + outside click together.
        document.addEventListener('click', (e) => {
            const overlay = document.getElementById('inboxOverlay');
            const panel = overlay ? overlay.querySelector('.inbox-panel') : null;
            const inboxBtn = e.target && e.target.closest ? e.target.closest('.inbox-btn') : null;

            if (inboxBtn) {
                e.preventDefault();
                this.toggle();
                return;
            }

            if (!overlay || !overlay.classList.contains('show')) return;
            if (panel && !panel.contains(e.target)) this.close();
        }, true);

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            const overlay = document.getElementById('inboxOverlay');
            if (overlay && overlay.classList.contains('show')) this.close();
        });

        // Tabs + actions (delegated)
        document.addEventListener('click', (e) => {
            const tab = e.target && e.target.closest ? e.target.closest('.inbox-tab') : null;
            if (tab) {
                this.setTab(tab.getAttribute('data-tab') || 'for-you');
            }
            if (e.target && e.target.id === 'inboxCloseBtn') this.close();
            if (e.target && e.target.id === 'inboxMarkAllReadBtn') this.markAllAsRead();
        });
    }

    isOpen() {
        const overlay = document.getElementById('inboxOverlay');
        return !!(overlay && overlay.classList.contains('show'));
    }

    toggle() {
        if (this.isOpen()) this.close();
        else this.open();
    }

    async ensureUserId() {
        const cached = this.getCachedUserId();
        if (cached) {
            this.userId = String(cached);
            return;
        }

        // One-time fetch (no polling)
        try {
            const app = window.CoCoCordApp;
            const resp = app && typeof app.apiRequest === 'function'
                ? await app.apiRequest('/api/auth/me', { method: 'GET' })
                : await fetch('/api/auth/me', {
                    method: 'GET',
                    headers: { Authorization: 'Bearer ' + (localStorage.getItem('accessToken') || '') }
                });
            if (!resp || !resp.ok) return;
            const me = await resp.json();
            if (me && me.id != null) {
                this.userId = String(me.id);
                try { localStorage.setItem('user', JSON.stringify(me)); } catch (_) { /* ignore */ }
            }
        } catch (_) { /* ignore */ }
    }

    getCachedUserId() {
        try {
            const u = JSON.parse(localStorage.getItem('user') || 'null');
            if (u && u.id != null) return u.id;
        } catch (_) { /* ignore */ }
        return localStorage.getItem('userId');
    }

    async ensureRealtimeSubscriptions() {
        if (!this.userId) return;
        const rt = window.CoCoCordRealtime;
        if (!rt || typeof rt.subscribe !== 'function') return;

        await rt.ensureConnected();

        rt.subscribe(`/topic/user.${this.userId}.notifications`, (message) => {
            try {
                const notification = JSON.parse(message.body);
                this.handleNewNotification(notification);
            } catch (_) { /* ignore */ }
        });

        rt.subscribe(`/topic/user.${this.userId}.notifications.count`, (message) => {
            const count = parseInt(message.body);
            if (Number.isFinite(count)) this.updateUnreadCount(count);
        });

        rt.subscribe(`/topic/user.${this.userId}.mention`, (message) => {
            try {
                const mentionEvent = JSON.parse(message.body);
                this.handleMentionEvent(mentionEvent);
            } catch (_) { /* ignore */ }
        });

        rt.subscribe(`/topic/user.${this.userId}.calls`, (message) => {
            try {
                const callEvent = JSON.parse(message.body);
                if (!Array.isArray(window.__cococordIncomingCallQueue)) window.__cococordIncomingCallQueue = [];
                window.__cococordIncomingCallQueue.push(callEvent);
                window.dispatchEvent(new CustomEvent('incomingCall', { detail: callEvent }));
            } catch (e) {
                console.error('Failed to parse call event:', e);
            }
        });
    }

    async loadUnreadCount() {
        try {
            const app = window.CoCoCordApp;
            const resp = app && typeof app.apiRequest === 'function'
                ? await app.apiRequest('/api/notifications/count', { method: 'GET' })
                : await fetch('/api/notifications/count', {
                    method: 'GET',
                    headers: { Authorization: 'Bearer ' + (localStorage.getItem('accessToken') || '') }
                });
            if (!resp || !resp.ok) return;
            const data = await resp.json();
            this.updateUnreadCount(Number(data && data.count));
        } catch (_) { /* ignore */ }
    }

    async loadNotifications(page = 0, size = 50) {
        try {
            const app = window.CoCoCordApp;
            const resp = app && typeof app.apiRequest === 'function'
                ? await app.apiRequest(`/api/notifications?page=${page}&size=${size}`, { method: 'GET' })
                : await fetch(`/api/notifications?page=${page}&size=${size}`, {
                    method: 'GET',
                    headers: { Authorization: 'Bearer ' + (localStorage.getItem('accessToken') || '') }
                });
            if (!resp || !resp.ok) return;
            const data = await resp.json();
            this.notifications = (data && data.content) ? data.content : [];
        } catch (_) { /* ignore */ }
    }

    open() {
        const overlay = document.getElementById('inboxOverlay');
        if (!overlay) return;
        overlay.classList.add('show');
        overlay.setAttribute('aria-hidden', 'false');
        // Lazy refresh when opened after initial load (still no polling)
        if (this.initialLoaded) {
            this.loadNotifications(0, 50).then(() => this.render());
        }
    }

    close() {
        const overlay = document.getElementById('inboxOverlay');
        if (!overlay) return;
        overlay.classList.remove('show');
        overlay.setAttribute('aria-hidden', 'true');
    }

    setTab(tab) {
        const t = String(tab || '').trim();
        this.activeTab = (t === 'unread' || t === 'mentions') ? t : 'for-you';
        document.querySelectorAll('.inbox-tab').forEach((btn) => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === this.activeTab);
        });
        this.render();
    }

    handleNewNotification(notification) {
        console.log('[INBOX DEBUG] handleNewNotification called:', notification);
        if (!notification) {
            console.warn('[INBOX DEBUG] Notification is null/undefined');
            return;
        }
        console.log('[INBOX DEBUG] Notification type:', notification.type);
        console.log('[INBOX DEBUG] Notification metadata:', notification.metadata);
        this.notifications.unshift(notification);
        if (notification.isRead === false) {
            this.updateUnreadCount(this.unreadCount + 1);
        }
        this.render();
        this.showBrowserNotification(notification);
        this.playNotificationSound();
        console.log('[INBOX DEBUG] Notification added to inbox, total:', this.notifications.length);
    }

    /**
     * Handle mention events for instant badge/sound notification
     * @param {Object} mentionEvent - The mention event from WebSocket
     */
    handleMentionEvent(mentionEvent) {
        console.log('Mention event received:', mentionEvent);

        // Show browser notification for mention
        this.showMentionBrowserNotification(mentionEvent);

        // Play mention sound (usually more prominent than regular notification)
        this.playMentionSound();

        // Update mention badge if exists
        this.updateMentionBadge(mentionEvent);

        // Emit custom event for other components to react
        window.dispatchEvent(new CustomEvent('mention-received', { detail: mentionEvent }));
    }

    /**
     * Show browser notification specifically for mentions
     */
    showMentionBrowserNotification(mentionEvent) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const displayName = mentionEvent.mentionerDisplayName || mentionEvent.mentionerUsername;
            const channelName = mentionEvent.channelName || 'a channel';

            new Notification('Bạn được nhắc đến!', {
                body: `${displayName} đã đề cập đến bạn trong #${channelName}`,
                icon: mentionEvent.mentionerAvatarUrl || '/static/images/logo.png',
                tag: `mention-${mentionEvent.messageId}`,
                requireInteraction: true // Keep notification until user interacts
            });
        }
    }

    /**
     * Play mention sound - slightly louder/different from regular notifications
     */
    playMentionSound() {
        const audio = new Audio('/static/sounds/mention.mp3');
        audio.volume = 0.5; // Louder than regular notification
        audio.play().catch(() => {
            // Fallback to regular notification sound if mention.mp3 doesn't exist
            const fallback = new Audio('/static/sounds/notification.mp3');
            fallback.volume = 0.5;
            fallback.play().catch(() => { });
        });
    }

    /**
     * Update mention badge (e.g., show red dot on channel)
     */
    updateMentionBadge(mentionEvent) {
        // Find channel in sidebar and add mention indicator
        const channelElement = document.querySelector(`[data-channel-id="${mentionEvent.channelId}"]`);
        if (channelElement) {
            let badge = channelElement.querySelector('.mention-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'mention-badge';
                badge.textContent = '@';
                channelElement.appendChild(badge);
            }
            badge.style.display = 'flex';
        }
    }

    showBrowserNotification(notification) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Cococord', {
                body: notification.message,
                icon: '/static/images/logo.png',
                tag: `notif-${notification.id}`
            });
        }
    }

    playNotificationSound() {
        // Optional: Add notification sound
        const audio = new Audio('/static/sounds/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => { });
    }

    updateUnreadCount(count) {
        const n = Number(count);
        this.unreadCount = Number.isFinite(n) && n >= 0 ? n : this.unreadCount;

        // Ensure badges exist on all inbox buttons
        document.querySelectorAll('.inbox-btn').forEach((btn) => {
            let badge = btn.querySelector('.inbox-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'inbox-badge';
                btn.appendChild(badge);
            }
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount > 99 ? '99+' : String(this.unreadCount);
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        });
    }

    getFilteredNotifications() {
        const list = Array.isArray(this.notifications) ? this.notifications : [];
        if (this.activeTab === 'unread') return list.filter((n) => n && n.isRead === false);
        if (this.activeTab === 'mentions') {
            return list.filter((n) => {
                const t = String(n && n.type || '').toUpperCase();
                return t === 'MENTION' || t === 'REPLY';
            });
        }
        return list;
    }

    render() {
        const container = document.getElementById('inboxList');
        if (!container) return;

        const list = this.getFilteredNotifications();
        if (!list.length) {
            container.innerHTML = '<div class="inbox-empty">Không có thông báo</div>';
            return;
        }

        container.innerHTML = list.map((n) => this.createItemHtml(n)).join('');
        container.querySelectorAll('.inbox-item').forEach((el) => {
            el.addEventListener('click', () => {
                const id = el.getAttribute('data-id');
                const notif = this.notifications.find(n => String(n?.id) === String(id));

                // Special handling for SERVER_INVITE - show popup instead of redirect
                if (notif && notif.type === 'SERVER_INVITE') {
                    this.showServerInvitePopup(notif);
                    return;
                }

                const href = this.resolveNotificationHref(id);
                this.markAsRead(id).finally(() => {
                    this.close();
                    if (href) window.location.href = href;
                });
            });
        });
    }
    /**
     * Show accept/decline popup for server invite notification
     */
    showServerInvitePopup(notif) {
        console.log('[INBOX DEBUG] showServerInvitePopup called:', notif);
        // Parse metadata from notification
        let metadata = {};
        try {
            if (notif.metadata) {
                console.log('[INBOX DEBUG] Raw metadata:', notif.metadata);
                metadata = typeof notif.metadata === 'string'
                    ? JSON.parse(notif.metadata)
                    : notif.metadata;
                console.log('[INBOX DEBUG] Parsed metadata:', metadata);
            }
        } catch (e) {
            console.error('[INBOX DEBUG] Metadata parse error:', e);
        }

        const serverName = metadata.serverName || 'Server';
        const serverIconUrl = metadata.serverIconUrl || '/images/default-server.png';
        const senderName = metadata.senderDisplayName || metadata.senderUsername || 'Ai đó';
        const senderAvatarUrl = metadata.senderAvatarUrl || '/images/default-avatar.png';

        // Remove any existing popup
        document.querySelector('.invite-accept-popup')?.remove();

        const popup = document.createElement('div');
        popup.className = 'invite-accept-popup';
        popup.innerHTML = `
            <div class="invite-popup-content">
                <div class="invite-popup-header">
                    <i class="bi bi-envelope-paper-heart"></i>
                    <h3>Lời mời vào Server</h3>
                </div>
                <div class="invite-popup-body">
                    <div class="invite-sender">
                        <img src="${this.escapeHtml(senderAvatarUrl)}" alt="avatar" class="sender-avatar" onerror="this.src='/images/default-avatar.png'">
                        <div class="sender-info">
                            <span class="sender-name">${this.escapeHtml(senderName)}</span>
                            <span class="sender-action">mời bạn tham gia</span>
                        </div>
                    </div>
                    <div class="invite-server">
                        <img src="${this.escapeHtml(serverIconUrl)}" alt="server" class="server-icon" onerror="this.src='/images/default-server.png'">
                        <span class="server-name">${this.escapeHtml(serverName)}</span>
                    </div>
                    <p class="invite-message">Bạn có muốn tham gia server này không?</p>
                </div>
                <div class="invite-popup-actions">
                    <button class="btn-decline" type="button">
                        <i class="bi bi-x-circle"></i> Từ chối
                    </button>
                    <button class="btn-accept" type="button">
                        <i class="bi bi-check-circle"></i> Tham gia
                    </button>
                </div>
            </div>
        `;

        // Add styles if not exists
        this.ensureInvitePopupStyles();

        // Bind events
        popup.querySelector('.btn-accept').addEventListener('click', () => this.acceptServerInvite(notif, popup));
        popup.querySelector('.btn-decline').addEventListener('click', () => this.declineServerInvite(notif, popup));
        popup.addEventListener('click', (e) => {
            if (e.target === popup) popup.remove();
        });

        document.body.appendChild(popup);
        console.log('[INBOX DEBUG] Popup added to DOM');
        requestAnimationFrame(() => {
            popup.classList.add('show');
            console.log('[INBOX DEBUG] Popup show class added');
        });
    }

    async acceptServerInvite(notif, popup) {
        console.log('[INBOX DEBUG] acceptServerInvite called:', notif.id);
        try {
            const token = localStorage.getItem('accessToken') || '';
            console.log('[INBOX DEBUG] Calling accept API for notification:', notif.id);
            const res = await fetch(`/api/invites/${notif.id}/accept`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            popup.remove();
            this.close();

            console.log('[INBOX DEBUG] Accept API response status:', res.status);
            if (res.ok) {
                const data = await res.json();
                console.log('[INBOX DEBUG] Accept response data:', data);
                // Remove from local list
                this.notifications = this.notifications.filter(n => n.id !== notif.id);
                this.updateUnreadCount(Math.max(0, this.unreadCount - 1));
                this.render();

                if (window.ToastManager) {
                    window.ToastManager.show(`Đã tham gia ${data.serverName || 'server'}!`, 'success');
                }
                // Reload servers and navigate
                if (window.loadServers) await window.loadServers();
                if (window.selectServer && data.serverId) window.selectServer(data.serverId);
            } else {
                const err = await res.json().catch(() => ({}));
                if (window.ToastManager) {
                    window.ToastManager.show(err.message || 'Không thể tham gia server', 'error');
                }
            }
        } catch (e) {
            console.error('[Inbox] Accept invite error:', e);
            if (window.ToastManager) window.ToastManager.show('Lỗi khi tham gia server', 'error');
        }
    }

    async declineServerInvite(notif, popup) {
        console.log('[INBOX DEBUG] declineServerInvite called:', notif.id);
        try {
            const token = localStorage.getItem('accessToken') || '';
            console.log('[INBOX DEBUG] Calling decline API for notification:', notif.id);
            await fetch(`/api/invites/${notif.id}/decline`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            popup.remove();
            // Remove from local list
            this.notifications = this.notifications.filter(n => n.id !== notif.id);
            this.updateUnreadCount(Math.max(0, this.unreadCount - 1));
            this.render();
        } catch (e) {
            console.error('[Inbox] Decline invite error:', e);
            popup.remove();
        }
    }

    ensureInvitePopupStyles() {
        if (document.getElementById('invite-popup-styles')) return;
        const style = document.createElement('style');
        style.id = 'invite-popup-styles';
        style.textContent = `
            .invite-accept-popup {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10001;
                opacity: 0;
                transition: opacity 0.2s ease;
            }
            .invite-accept-popup.show { opacity: 1; }
            .invite-popup-content {
                background: #2b2d31;
                border-radius: 12px;
                max-width: 400px;
                width: 90%;
                padding: 24px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                transform: scale(0.9);
                transition: transform 0.2s ease;
            }
            .invite-accept-popup.show .invite-popup-content { transform: scale(1); }
            .invite-popup-header { text-align: center; margin-bottom: 20px; }
            .invite-popup-header i { font-size: 48px; color: #5865f2; display: block; margin-bottom: 12px; }
            .invite-popup-header h3 { color: #fff; margin: 0; font-size: 20px; }
            .invite-sender { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
            .sender-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
            .sender-info { display: flex; flex-direction: column; }
            .sender-name { color: #fff; font-weight: 600; }
            .sender-action { color: #b5bac1; font-size: 13px; }
            .invite-server { display: flex; align-items: center; gap: 12px; background: #1e1f22; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
            .server-icon { width: 48px; height: 48px; border-radius: 12px; object-fit: cover; }
            .server-name { color: #fff; font-weight: 600; font-size: 16px; }
            .invite-message { color: #b5bac1; text-align: center; margin: 0 0 20px; font-size: 14px; }
            .invite-popup-actions { display: flex; gap: 12px; }
            .invite-popup-actions button { flex: 1; padding: 12px 16px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.15s ease; }
            .invite-popup-actions .btn-decline { background: #4e5058; color: #fff; }
            .invite-popup-actions .btn-decline:hover { background: #6c6f78; }
            .invite-popup-actions .btn-accept { background: #248046; color: #fff; }
            .invite-popup-actions .btn-accept:hover { background: #1a6334; }
        `;
        document.head.appendChild(style);
    }

    resolveNotificationHref(notificationId) {
        const notif = (this.notifications || []).find((n) => String(n?.id) === String(notificationId));
        const raw = (notif && notif.link) ? String(notif.link) : '';
        const link = raw.trim();
        if (!link) return '/app';

        // Friends -> in-app tabs (avoid redirect to /login due to missing session cookies)
        if (link === '/friends/requests') return '/app?friendsTab=pending';
        if (link === '/friends') return '/app?friendsTab=all';

        // DM notifications are stored as /dms/{id}, but the app shell expects /app?dmGroupId=
        const dmMatch = link.match(/^\/dms\/([0-9]+)\/?$/);
        if (dmMatch) return `/app?dmGroupId=${encodeURIComponent(dmMatch[1])}`;

        // Mention/channel links: best-effort route into app shell
        const chMatch = link.match(/^\/channels\/([0-9]+)\/?$/);
        if (chMatch) return `/app?channelId=${encodeURIComponent(chMatch[1])}`;

        // Invites already have a dedicated redirect view.
        if (link.startsWith('/invite/')) return link;

        // Default: keep user inside /app
        return '/app';
    }

    createItemHtml(notif) {
        const unreadClass = notif && notif.isRead === false ? 'unread' : '';
        const timeAgo = this.formatTimeAgo(notif && notif.createdAt);
        
        let rawMsg = (notif && notif.message) || '';
        // Fix for GIF/Sticker URLs showing as raw text
        if (rawMsg.includes('media.tenor.com') || rawMsg.endsWith('.gif')) {
            rawMsg = 'Đã gửi một GIF';
        } else if (rawMsg.includes('/stickers/') || rawMsg.includes('sticker') || rawMsg.includes('data:image/svg') || rawMsg.includes('class="message-sticker"')) {
            rawMsg = 'Đã gửi một nhãn dán';
        } else if (rawMsg.match(/^https?:\/\/.+\.(jpg|jpeg|png|webp)$/i)) {
            rawMsg = 'Đã gửi một hình ảnh';
        }

        const msg = this.escapeHtml(rawMsg);
        const link = (notif && notif.link) ? String(notif.link) : '';
        return `
            <div class="inbox-item ${unreadClass}" data-id="${notif && notif.id != null ? String(notif.id) : ''}" data-link="${this.escapeHtml(link)}">
                <div class="dot"></div>
                <div class="inbox-item-content">
                    <div class="inbox-item-message">${msg}</div>
                    <div class="inbox-item-time">${timeAgo}</div>
                </div>
            </div>
        `;
    }

    getNotificationIcon(type) {
        const icons = {
            'FRIEND_REQUEST': 'fas fa-user-plus',
            'FRIEND_ACCEPTED': 'fas fa-user-check',
            'FRIEND_REMOVED': 'fas fa-user-minus',
            'NEW_DIRECT_MESSAGE': 'fas fa-envelope',
            'NEW_GROUP_DM': 'fas fa-users',
            'REMOVED_FROM_GROUP_DM': 'fas fa-user-times',
            'SERVER_INVITE': 'fas fa-server',
            'SERVER_KICKED': 'fas fa-door-open',
            'SERVER_BANNED': 'fas fa-ban',
            'MENTION': 'fas fa-at',
            'REPLY': 'fas fa-reply',
            'ROLE_ASSIGNED': 'fas fa-shield-alt',
            'SYSTEM': 'fas fa-info-circle'
        };
        return icons[type] || 'fas fa-bell';
    }

    getNotificationClass(type) {
        if (type.includes('FRIEND')) return 'notif-friend';
        if (type.includes('MESSAGE') || type.includes('DM')) return 'notif-message';
        if (type.includes('SERVER')) return 'notif-server';
        if (type === 'MENTION' || type === 'REPLY') return 'notif-mention';
        return 'notif-system';
    }

    async markAsRead(id) {
        try {
            if (!id) return;

            const app = window.CoCoCordApp;
            const resp = app && typeof app.apiRequest === 'function'
                ? await app.apiRequest(`/api/notifications/${id}/read`, { method: 'POST' })
                : await fetch(`/api/notifications/${id}/read`, {
                    method: 'POST',
                    headers: { Authorization: 'Bearer ' + (localStorage.getItem('accessToken') || '') }
                });
            if (!resp || !resp.ok) return;

            // Update local state
            const notif = this.notifications.find(n => n.id == id);
            if (notif) {
                notif.isRead = true;
                this.unreadCount = Math.max(0, this.unreadCount - 1);
                this.updateUnreadCount(this.unreadCount);
                this.render();
            }
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    }

    async markAllAsRead() {
        try {
            const app = window.CoCoCordApp;
            const resp = app && typeof app.apiRequest === 'function'
                ? await app.apiRequest('/api/notifications/read-all', { method: 'POST' })
                : await fetch('/api/notifications/read-all', {
                    method: 'POST',
                    headers: { Authorization: 'Bearer ' + (localStorage.getItem('accessToken') || '') }
                });
            if (!resp || !resp.ok) return;

            // Update local state
            this.notifications.forEach(n => n.isRead = true);
            this.updateUnreadCount(0);
            this.render();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    }

    formatTimeAgo(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Vừa xong';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày trước`;
        return date.toLocaleDateString('vi-VN');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.inboxManager = new InboxManager();
});
