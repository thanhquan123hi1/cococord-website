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
        if (!notification) return;
        this.notifications.unshift(notification);
        if (notification.isRead === false) {
            this.updateUnreadCount(this.unreadCount + 1);
        }
        this.render();
        this.showBrowserNotification(notification);
        this.playNotificationSound();
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
            fallback.play().catch(() => {});
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
        audio.play().catch(() => {});
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
                const href = this.resolveNotificationHref(id);
                this.markAsRead(id).finally(() => {
                    this.close();
                    if (href) window.location.href = href;
                });
            });
        });
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
        const msg = this.escapeHtml((notif && notif.message) || '');
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
