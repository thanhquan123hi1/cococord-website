// Notification Handler
class NotificationManager {
    constructor() {
        this.unreadCount = 0;
        this.notifications = [];
        this.stompClient = null;
        this.init();
    }

    init() {
        this.connectWebSocket();
        this.loadUnreadCount();
        this.loadNotifications();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Notification bell click
        const notifBell = document.getElementById('notification-bell');
        if (notifBell) {
            notifBell.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleNotificationDropdown();
            });
        }

        // Mark all as read
        const markAllBtn = document.getElementById('mark-all-read');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', () => this.markAllAsRead());
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('notification-dropdown');
            const bell = document.getElementById('notification-bell');
            if (dropdown && !dropdown.contains(e.target) && !bell?.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    }

    connectWebSocket() {
        // Wait for userId to be available (may be set by app-home.js after API call)
        const userId = this.getCurrentUserId();
        if (!userId) {
            console.log('Notification WebSocket: waiting for userId...');
            setTimeout(() => this.connectWebSocket(), 1000);
            return;
        }

        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.log('Notification WebSocket: waiting for accessToken...');
            setTimeout(() => this.connectWebSocket(), 1000);
            return;
        }

        const socket = new SockJS('/ws');
        this.stompClient = Stomp.over(socket);
        this.stompClient.debug = null; // Disable debug logs

        this.stompClient.connect({ Authorization: 'Bearer ' + token }, () => {
            console.log('Notification WebSocket connected for user:', userId);
            
            // Subscribe to user's notification channel
            if (userId) {
                // New notifications
                this.stompClient.subscribe(`/topic/user.${userId}.notifications`, (message) => {
                    const notification = JSON.parse(message.body);
                    this.handleNewNotification(notification);
                });

                // Notification count updates
                this.stompClient.subscribe(`/topic/user.${userId}.notifications.count`, (message) => {
                    const count = parseInt(message.body);
                    this.updateUnreadCount(count);
                });

                // Mention events - for instant badge/sound when mentioned
                this.stompClient.subscribe(`/topic/user.${userId}.mention`, (message) => {
                    const mentionEvent = JSON.parse(message.body);
                    this.handleMentionEvent(mentionEvent);
                });

                // Incoming call events - for receiving calls anywhere on /app
                this.stompClient.subscribe(`/topic/user.${userId}.calls`, (message) => {
                    try {
                        const callEvent = JSON.parse(message.body);
                        // Buffer events in case app-home.js hasn't attached listeners yet.
                        if (!Array.isArray(window.__cococordIncomingCallQueue)) {
                            window.__cococordIncomingCallQueue = [];
                        }
                        window.__cococordIncomingCallQueue.push(callEvent);
                        // Dispatch a custom event so app-home.js can handle it
                        window.dispatchEvent(new CustomEvent('incomingCall', { detail: callEvent }));
                    } catch (e) {
                        console.error('Failed to parse call event:', e);
                    }
                });
            }
        }, (error) => {
            console.error('Notification WebSocket error:', error);
            // Retry connection after 5 seconds
            setTimeout(() => this.connectWebSocket(), 5000);
        });
    }

    getCurrentUserId() {
        // Get user ID from data attribute, localStorage user object, or userId key
        const userIdElem = document.querySelector('[data-user-id]');
        if (userIdElem) {
            return userIdElem.dataset.userId;
        }
        // Try to get from cached user object (set by app-home.js)
        const userJson = localStorage.getItem('user');
        if (userJson) {
            try {
                const user = JSON.parse(userJson);
                if (user && user.id) {
                    return user.id;
                }
            } catch (_) { /* ignore */ }
        }
        return localStorage.getItem('userId');
    }

    async loadUnreadCount() {
        try {
            const response = await fetch('/api/notifications/count', {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
                }
            });
            const data = await response.json();
            this.updateUnreadCount(data.count);
        } catch (error) {
            console.error('Failed to load unread count:', error);
        }
    }

    async loadNotifications(page = 0, size = 20) {
        try {
            const response = await fetch(`/api/notifications?page=${page}&size=${size}`, {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
                }
            });
            const data = await response.json();
            this.notifications = data.content || [];
            this.renderNotifications();
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    }

    handleNewNotification(notification) {
        // Add to notifications list
        this.notifications.unshift(notification);
        this.unreadCount++;
        this.updateUnreadCount(this.unreadCount);
        this.renderNotifications();
        
        // Show browser notification if permission granted
        this.showBrowserNotification(notification);
        
        // Play notification sound (optional)
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
            
            new Notification('You were mentioned!', {
                body: `${displayName} mentioned you in #${channelName}`,
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
        this.unreadCount = count;
        const badge = document.getElementById('notification-badge');
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    toggleNotificationDropdown() {
        const dropdown = document.getElementById('notification-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
            if (dropdown.classList.contains('show')) {
                this.loadNotifications();
            }
        }
    }

    renderNotifications() {
        const container = document.getElementById('notification-list');
        if (!container) return;

        if (this.notifications.length === 0) {
            container.innerHTML = '<div class="notification-empty">No notifications</div>';
            return;
        }

        container.innerHTML = this.notifications.map(notif => this.createNotificationHTML(notif)).join('');
        
        // Add click handlers
        container.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                const link = item.dataset.link;
                this.markAsRead(id);
                if (link) {
                    window.location.href = link;
                }
            });
        });
    }

    createNotificationHTML(notif) {
        const icon = this.getNotificationIcon(notif.type);
        const timeAgo = this.formatTimeAgo(notif.createdAt);
        const unreadClass = notif.isRead ? '' : 'unread';
        
        return `
            <div class="notification-item ${unreadClass}" data-id="${notif.id}" data-link="${notif.link || ''}">
                <div class="notification-icon ${this.getNotificationClass(notif.type)}">
                    <i class="${icon}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-message">${this.escapeHtml(notif.message)}</div>
                    <div class="notification-time">${timeAgo}</div>
                </div>
                ${!notif.isRead ? '<div class="notification-unread-dot"></div>' : ''}
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
            await fetch(`/api/notifications/${id}/read`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
                }
            });
            
            // Update local state
            const notif = this.notifications.find(n => n.id == id);
            if (notif) {
                notif.isRead = true;
                this.unreadCount = Math.max(0, this.unreadCount - 1);
                this.updateUnreadCount(this.unreadCount);
                this.renderNotifications();
            }
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    }

    async markAllAsRead() {
        try {
            await fetch('/api/notifications/read-all', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
                }
            });
            
            // Update local state
            this.notifications.forEach(n => n.isRead = true);
            this.updateUnreadCount(0);
            this.renderNotifications();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    }

    formatTimeAgo(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Initialize notification manager
    window.notificationManager = new NotificationManager();
});
