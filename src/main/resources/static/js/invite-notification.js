/**
 * Server Invite Notification Manager
 * Handles real-time WebSocket notifications for server invites
 * Shows accept/decline dialog when user receives invite
 */

(function (window) {
    'use strict';

    class InviteNotificationManager {
        constructor() {
            this.pendingInvites = [];
            this.currentModal = null;
            this._init();
        }

        _init() {
            // Subscribe to WebSocket notifications when ready
            this._waitForWebSocket();
            // Load pending invites on init
            this._loadPendingInvites();
        }

        _waitForWebSocket() {
            // Check if STOMP client is available
            const checkStomp = () => {
                if (window.stompClient && window.stompClient.connected) {
                    this._subscribeToNotifications();
                } else {
                    setTimeout(checkStomp, 500);
                }
            };
            checkStomp();
        }

        _subscribeToNotifications() {
            // Get current user ID
            const userId = this._getCurrentUserId();
            if (!userId) {
                console.warn('[InviteNotification] No user ID found');
                setTimeout(() => this._subscribeToNotifications(), 1000);
                return;
            }

            // Subscribe to user's notification topic
            const topic = `/topic/user.${userId}.notifications`;
            window.stompClient.subscribe(topic, (message) => {
                try {
                    const data = JSON.parse(message.body);
                    if (data.type === 'SERVER_INVITE') {
                        this._handleInviteNotification(data);
                    }
                } catch (e) {
                    console.error('[InviteNotification] Error parsing message:', e);
                }
            });
            console.log('[InviteNotification] Subscribed to', topic);
        }

        _getCurrentUserId() {
            if (window.currentUser && window.currentUser.id) return window.currentUser.id;
            if (window.state && window.state.currentUser) return window.state.currentUser.id;
            return null;
        }

        _getToken() {
            return localStorage.getItem('accessToken') ||
                document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1] || '';
        }

        async _loadPendingInvites() {
            try {
                const res = await fetch('/api/invites/pending', {
                    headers: { 'Authorization': `Bearer ${this._getToken()}` }
                });
                if (res.ok) {
                    this.pendingInvites = await res.json();
                    if (this.pendingInvites.length > 0) {
                        // Show first pending invite
                        this._showInviteModal(this.pendingInvites[0]);
                    }
                }
            } catch (e) {
                console.error('[InviteNotification] Error loading pending invites:', e);
            }
        }

        _handleInviteNotification(data) {
            console.log('[InviteNotification] Received invite:', data);

            // Add to pending list
            this.pendingInvites.push(data);

            // Show modal immediately
            this._showInviteModal(data);

            // Play notification sound if available
            this._playNotificationSound();

            // Show toast notification as fallback
            if (window.ToastManager) {
                window.ToastManager.show(
                    `${data.senderDisplayName || data.senderUsername} mời bạn vào server ${data.serverName}`,
                    'info'
                );
            }
        }

        _showInviteModal(invite) {
            // Close any existing modal
            this._closeModal();

            const modal = document.createElement('div');
            modal.className = 'invite-notification-modal';
            modal.innerHTML = `
                <div class="invite-modal-content">
                    <div class="invite-modal-header">
                        <i class="bi bi-envelope-paper-heart"></i>
                        <h3>Lời mời vào Server</h3>
                    </div>
                    <div class="invite-modal-body">
                        <div class="invite-sender">
                            <img src="${invite.senderAvatarUrl || '/images/default-avatar.png'}" alt="avatar" class="sender-avatar">
                            <div class="sender-info">
                                <span class="sender-name">${invite.senderDisplayName || invite.senderUsername}</span>
                                <span class="sender-action">mời bạn tham gia</span>
                            </div>
                        </div>
                        <div class="invite-server">
                            <img src="${invite.serverIconUrl || '/images/default-server.png'}" alt="server" class="server-icon">
                            <span class="server-name">${invite.serverName}</span>
                        </div>
                        <p class="invite-message">${invite.message || 'Bạn có muốn tham gia server này không?'}</p>
                    </div>
                    <div class="invite-modal-actions">
                        <button class="btn-decline" data-id="${invite.notificationId}">
                            <i class="bi bi-x-circle"></i> Từ chối
                        </button>
                        <button class="btn-accept" data-id="${invite.notificationId}">
                            <i class="bi bi-check-circle"></i> Tham gia
                        </button>
                    </div>
                </div>
            `;

            // Add styles if not exists
            this._ensureStyles();

            // Bind events
            modal.querySelector('.btn-accept').addEventListener('click', () => {
                this._acceptInvite(invite.notificationId);
            });
            modal.querySelector('.btn-decline').addEventListener('click', () => {
                this._declineInvite(invite.notificationId);
            });

            // Close on background click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this._closeModal();
                }
            });

            document.body.appendChild(modal);
            this.currentModal = modal;

            // Animate in
            requestAnimationFrame(() => {
                modal.classList.add('show');
            });
        }

        _closeModal() {
            if (this.currentModal) {
                this.currentModal.classList.remove('show');
                setTimeout(() => {
                    this.currentModal?.remove();
                    this.currentModal = null;
                }, 200);
            }
        }

        async _acceptInvite(notificationId) {
            try {
                const res = await fetch(`/api/invites/${notificationId}/accept`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this._getToken()}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    this._closeModal();

                    // Remove from pending
                    this.pendingInvites = this.pendingInvites.filter(i => i.notificationId !== notificationId);

                    // Show success toast
                    if (window.ToastManager) {
                        window.ToastManager.show(`Đã tham gia ${data.serverName}!`, 'success');
                    }

                    // Reload server list and navigate to the new server
                    if (window.loadServers) {
                        await window.loadServers();
                    }
                    if (window.selectServer && data.serverId) {
                        window.selectServer(data.serverId);
                    }

                    // Show next pending invite if any
                    if (this.pendingInvites.length > 0) {
                        setTimeout(() => this._showInviteModal(this.pendingInvites[0]), 500);
                    }
                } else {
                    const error = await res.json();
                    if (window.ToastManager) {
                        window.ToastManager.show(error.message || 'Không thể tham gia server', 'error');
                    }
                }
            } catch (e) {
                console.error('[InviteNotification] Error accepting invite:', e);
                if (window.ToastManager) {
                    window.ToastManager.show('Lỗi khi tham gia server', 'error');
                }
            }
        }

        async _declineInvite(notificationId) {
            try {
                await fetch(`/api/invites/${notificationId}/decline`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this._getToken()}`
                    }
                });

                this._closeModal();

                // Remove from pending
                this.pendingInvites = this.pendingInvites.filter(i => i.notificationId !== notificationId);

                // Show next pending invite if any
                if (this.pendingInvites.length > 0) {
                    setTimeout(() => this._showInviteModal(this.pendingInvites[0]), 500);
                }
            } catch (e) {
                console.error('[InviteNotification] Error declining invite:', e);
            }
        }

        _playNotificationSound() {
            try {
                const audio = new Audio('/sounds/notification.mp3');
                audio.volume = 0.3;
                audio.play().catch(() => { }); // Ignore if blocked
            } catch (e) { }
        }

        _ensureStyles() {
            if (document.getElementById('invite-notification-styles')) return;

            const style = document.createElement('style');
            style.id = 'invite-notification-styles';
            style.textContent = `
                .invite-notification-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }
                .invite-notification-modal.show {
                    opacity: 1;
                }
                .invite-modal-content {
                    background: #2b2d31;
                    border-radius: 12px;
                    max-width: 400px;
                    width: 90%;
                    padding: 24px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
                    transform: scale(0.9);
                    transition: transform 0.2s ease;
                }
                .invite-notification-modal.show .invite-modal-content {
                    transform: scale(1);
                }
                .invite-modal-header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .invite-modal-header i {
                    font-size: 48px;
                    color: #5865f2;
                    margin-bottom: 12px;
                    display: block;
                }
                .invite-modal-header h3 {
                    color: #fff;
                    margin: 0;
                    font-size: 20px;
                }
                .invite-sender {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 16px;
                }
                .sender-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    object-fit: cover;
                }
                .sender-info {
                    display: flex;
                    flex-direction: column;
                }
                .sender-name {
                    color: #fff;
                    font-weight: 600;
                }
                .sender-action {
                    color: #b5bac1;
                    font-size: 13px;
                }
                .invite-server {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: #1e1f22;
                    padding: 12px;
                    border-radius: 8px;
                    margin-bottom: 16px;
                }
                .server-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    object-fit: cover;
                }
                .server-name {
                    color: #fff;
                    font-weight: 600;
                    font-size: 16px;
                }
                .invite-message {
                    color: #b5bac1;
                    text-align: center;
                    margin: 0 0 20px;
                    font-size: 14px;
                }
                .invite-modal-actions {
                    display: flex;
                    gap: 12px;
                }
                .invite-modal-actions button {
                    flex: 1;
                    padding: 12px 16px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.15s ease;
                }
                .btn-decline {
                    background: #4e5058;
                    color: #fff;
                }
                .btn-decline:hover {
                    background: #6c6f78;
                }
                .btn-accept {
                    background: #248046;
                    color: #fff;
                }
                .btn-accept:hover {
                    background: #1a6334;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Export globally
    window.InviteNotificationManager = InviteNotificationManager;

    // Auto-initialize on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function () {
        window.inviteNotificationManager = new InviteNotificationManager();
        console.log('[InviteNotification] Manager initialized');
    });

})(window);
