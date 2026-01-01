/**
 * User Panel Component
 * Bottom-left panel showing current user's avatar, status, and actions
 * Features a Discord-style User Popout (Mini Profile) when clicking avatar/name
 */

(function() {
    'use strict';

    const UserPanel = {
        // ============================================
        // State
        // ============================================
        currentUser: null,
        isPopoutVisible: false,
        initialized: false,
        isMuted: false,
        isDeafened: false,

        // ============================================
        // SVG Icons
        // ============================================
        icons: {
            micOn: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a3.5 3.5 0 0 0-3.5 3.5v5a3.5 3.5 0 0 0 7 0v-5A3.5 3.5 0 0 0 12 2z"/>
                <path d="M19 10.5a.5.5 0 0 0-1 0 6 6 0 0 1-12 0 .5.5 0 0 0-1 0 7 7 0 0 0 6.5 6.98V20H8.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1H12.5v-2.52A7 7 0 0 0 19 10.5z"/>
            </svg>`,
            micOff: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a3.5 3.5 0 0 0-3.5 3.5v5a3.5 3.5 0 0 0 7 0v-5A3.5 3.5 0 0 0 12 2z"/>
                <path d="M19 10.5a.5.5 0 0 0-1 0 6 6 0 0 1-12 0 .5.5 0 0 0-1 0 7 7 0 0 0 6.5 6.98V20H8.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1H12.5v-2.52A7 7 0 0 0 19 10.5z"/>
                <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>`,
            headphoneOn: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12v8c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2H4v-2c0-4.41 3.59-8 8-8s8 3.59 8 8v2h-2c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-8c0-5.52-4.48-10-10-10z"/>
            </svg>`,
            headphoneOff: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12v8c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2H4v-2c0-4.41 3.59-8 8-8s8 3.59 8 8v2h-2c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-8c0-5.52-4.48-10-10-10z"/>
                <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>`,
            settings: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.04.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
            </svg>`
        },

        // ============================================
        // Initialization
        // ============================================
        init: async function() {
            if (this.initialized) return;
            
            const container = document.getElementById('userPanel');
            if (!container) {
                console.warn('UserPanel: #userPanel container not found');
                return;
            }

            // Load saved audio states from localStorage
            this.isMuted = localStorage.getItem('userPanel_muted') === 'true';
            this.isDeafened = localStorage.getItem('userPanel_deafened') === 'true';

            try {
                await this.loadCurrentUser();
                if (this.currentUser) {
                    this.render();
                    this.attachEventListeners();
                    this.startPresenceHeartbeat();
                    this.initialized = true;
                }
            } catch (error) {
                console.error('UserPanel: Failed to initialize', error);
            }
        },

        // ============================================
        // Data Loading
        // ============================================
        loadCurrentUser: async function() {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) return null;

                const response = await fetch('/api/users/me/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    this.currentUser = await response.json();
                    return this.currentUser;
                }
            } catch (error) {
                console.error('UserPanel: Failed to load user profile:', error);
            }
            return null;
        },

        // ============================================
        // Audio Controls
        // ============================================
        toggleMute: function() {
            this.isMuted = !this.isMuted;
            localStorage.setItem('userPanel_muted', this.isMuted);
            
            // Notify other components (chat.js voice)
            if (window.CoCoCordChat?.toggleMute) {
                window.CoCoCordChat.toggleMute();
            }
            
            // Update UI
            this.updateAudioButtons();
            
            // Dispatch event for other listeners
            document.dispatchEvent(new CustomEvent('userPanel:muteToggle', { 
                detail: { isMuted: this.isMuted } 
            }));
        },

        toggleDeafen: function() {
            this.isDeafened = !this.isDeafened;
            localStorage.setItem('userPanel_deafened', this.isDeafened);
            
            // If deafening, also mute
            if (this.isDeafened && !this.isMuted) {
                this.isMuted = true;
                localStorage.setItem('userPanel_muted', this.isMuted);
            }
            
            // Notify other components (chat.js voice)
            if (window.CoCoCordChat?.toggleDeafen) {
                window.CoCoCordChat.toggleDeafen();
            }
            
            // Update UI
            this.updateAudioButtons();
            
            // Dispatch event for other listeners
            document.dispatchEvent(new CustomEvent('userPanel:deafenToggle', { 
                detail: { isDeafened: this.isDeafened, isMuted: this.isMuted } 
            }));
        },

        updateAudioButtons: function() {
            const micBtn = document.getElementById('userPanelMicBtn');
            const deafenBtn = document.getElementById('userPanelDeafenBtn');
            
            if (micBtn) {
                micBtn.classList.toggle('active', this.isMuted);
                micBtn.innerHTML = this.isMuted ? this.icons.micOff : this.icons.micOn;
                micBtn.title = this.isMuted ? 'Bật tiếng' : 'Tắt tiếng';
            }
            
            if (deafenBtn) {
                deafenBtn.classList.toggle('active', this.isDeafened);
                deafenBtn.innerHTML = this.isDeafened ? this.icons.headphoneOff : this.icons.headphoneOn;
                deafenBtn.title = this.isDeafened ? 'Bật âm thanh' : 'Tắt âm thanh';
            }
        },

        // ============================================
        // Main Panel Rendering
        // ============================================
        render: function() {
            if (!this.currentUser) return;

            const container = document.getElementById('userPanel');
            if (!container) return;

            const { displayName, username, status, customStatus } = this.getUserDisplayData();

            container.innerHTML = `
                <div class="user-panel-content">
                    <!-- Left: Avatar + Info -->
                    <div class="user-panel-left" id="userPanelTrigger">
                        <div class="user-avatar-wrapper">
                            ${this.renderAvatar(32)}
                            <span class="status-indicator status-${status.toLowerCase()}"></span>
                        </div>
                        <div class="user-info">
                            <div class="user-name">${this.escapeHtml(displayName)}</div>
                            <div class="user-status-text">${customStatus || this.getStatusLabel(status)}</div>
                        </div>
                    </div>
                    
                    <!-- Right: Control Buttons -->
                    <div class="panel-buttons">
                        <button class="panel-btn ${this.isMuted ? 'active' : ''}" id="userPanelMicBtn" title="${this.isMuted ? 'Bật tiếng' : 'Tắt tiếng'}">
                            ${this.isMuted ? this.icons.micOff : this.icons.micOn}
                        </button>
                        <button class="panel-btn ${this.isDeafened ? 'active' : ''}" id="userPanelDeafenBtn" title="${this.isDeafened ? 'Bật âm thanh' : 'Tắt âm thanh'}">
                            ${this.isDeafened ? this.icons.headphoneOff : this.icons.headphoneOn}
                        </button>
                        <button class="panel-btn" id="userPanelSettingsBtn" title="Cài đặt người dùng">
                            ${this.icons.settings}
                        </button>
                    </div>
                </div>
            `;

            // Re-attach event listeners after render
            this.attachEventListeners();
        },

        renderAvatar: function(size = 32) {
            const displayName = this.currentUser?.displayName || this.currentUser?.username || 'U';
            const avatarUrl = this.currentUser?.avatarUrl;
            
            if (avatarUrl) {
                return `<img src="${this.escapeHtml(avatarUrl)}" alt="${this.escapeHtml(displayName)}" class="user-avatar" style="width:${size}px;height:${size}px;">`;
            }
            return `<div class="user-avatar-placeholder" style="width:${size}px;height:${size}px;font-size:${size * 0.5}px;">${displayName.charAt(0).toUpperCase()}</div>`;
        },

        getUserDisplayData: function() {
            const user = this.currentUser || {};
            return {
                displayName: user.displayName || user.username || 'User',
                username: user.username || 'user',
                status: user.status || 'OFFLINE',
                customStatus: user.customStatus ? 
                    (user.customStatusEmoji ? `${user.customStatusEmoji} ${user.customStatus}` : user.customStatus) : '',
                discriminator: String((user.id || 0) % 10000).padStart(4, '0'),
                bannerColor: user.bannerColor || '#5865f2'
            };
        },

        getStatusLabel: function(status) {
            const labels = {
                'ONLINE': 'Trực tuyến',
                'IDLE': 'Vắng mặt', 
                'DO_NOT_DISTURB': 'Không làm phiền',
                'OFFLINE': 'Ngoại tuyến',
                'INVISIBLE': 'Ẩn'
            };
            return labels[status] || 'Ngoại tuyến';
        },

        // ============================================
        // Event Listeners
        // ============================================
        attachEventListeners: function() {
            // Avatar/Info trigger - toggle popout
            const panelLeft = document.getElementById('userPanelTrigger');
            if (panelLeft) {
                panelLeft.onclick = (e) => {
                    e.stopPropagation();
                    this.togglePopout();
                };
            }

            // Mic button
            const micBtn = document.getElementById('userPanelMicBtn');
            if (micBtn) {
                micBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.toggleMute();
                };
            }

            // Deafen button
            const deafenBtn = document.getElementById('userPanelDeafenBtn');
            if (deafenBtn) {
                deafenBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.toggleDeafen();
                };
            }

            // Settings button
            const settingsBtn = document.getElementById('userPanelSettingsBtn');
            if (settingsBtn) {
                settingsBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (window.SettingsModal?.open) {
                        window.SettingsModal.open('my-account', this.currentUser);
                    } else {
                        window.location.href = '/settings';
                    }
                };
            }

            // Global click to close popout
            if (!this._documentListenerAttached) {
                document.addEventListener('click', (e) => {
                    if (this.isPopoutVisible) {
                        const popout = document.getElementById('userPopout');
                        if (popout && !popout.contains(e.target)) {
                            this.hidePopout();
                        }
                    }
                });
                this._documentListenerAttached = true;
            }
        },

        // ============================================
        // Popout Logic
        // ============================================
        togglePopout: function() {
            if (this.isPopoutVisible) {
                this.hidePopout();
            } else {
                this.showPopout();
            }
        },

        showPopout: function() {
            // Remove any existing popout
            const existing = document.getElementById('userPopout');
            if (existing) existing.remove();

            if (!this.currentUser) return;

            // Create popout element
            const popout = document.createElement('div');
            popout.id = 'userPopout';
            popout.className = 'user-popout';
            popout.innerHTML = this.renderPopout();

            // Position above user panel
            const userPanel = document.getElementById('userPanel');
            if (userPanel) {
                const rect = userPanel.getBoundingClientRect();
                popout.style.bottom = `${window.innerHeight - rect.top + 8}px`;
                popout.style.left = `${rect.left}px`;
            }

            document.body.appendChild(popout);

            this.isPopoutVisible = true;

            // Prevent clicks inside popout from closing it
            popout.addEventListener('click', (e) => e.stopPropagation());

            // Attach popout menu listeners
            this.attachPopoutListeners();
        },

        hidePopout: function() {
            const popout = document.getElementById('userPopout');
            if (popout) {
                popout.classList.add('closing');
                setTimeout(() => popout.remove(), 150);
            }
            this.isPopoutVisible = false;
        },

        // ============================================
        // Popout Rendering - Discord Mini Profile Style
        // ============================================
        renderPopout: function() {
            const user = this.currentUser;
            if (!user) return '';

            const { displayName, username, status, customStatus, discriminator, bannerColor } = this.getUserDisplayData();
            const avatarUrl = user.avatarUrl;
            const bannerUrl = user.bannerUrl;

            // Banner style
            const bannerStyle = bannerUrl 
                ? `background: url('${this.escapeHtml(bannerUrl)}') center/cover no-repeat;`
                : `background: ${bannerColor};`;

            // Avatar HTML with cutout effect
            const avatarHtml = avatarUrl
                ? `<img src="${this.escapeHtml(avatarUrl)}" alt="${this.escapeHtml(displayName)}" class="popout-avatar">`
                : `<div class="popout-avatar popout-avatar-placeholder">${displayName.charAt(0).toUpperCase()}</div>`;

            // Badges (if any)
            const badgesHtml = user.badges?.length 
                ? `<div class="popout-badges">${user.badges.map(b => 
                    `<span class="popout-badge" title="${this.escapeHtml(b.name || b)}">${b.icon || '🏅'}</span>`
                  ).join('')}</div>` 
                : '';

            // Custom status (emoji + text)
            const hasCustomStatus = user.customStatus || user.customStatusEmoji;
            const customStatusHtml = hasCustomStatus ? `
                <div class="popout-custom-status-box">
                    ${user.customStatusEmoji ? `<span class="popout-emoji">${user.customStatusEmoji}</span>` : ''}
                    <span class="popout-custom-text">${this.escapeHtml(user.customStatus || '')}</span>
                </div>
            ` : `
                <div class="popout-custom-status-box popout-custom-status-placeholder" id="popoutSetStatusBtn">
                    <span class="popout-emoji">😊</span>
                    <span class="popout-custom-text">Cơ chế trực tuyến nào thấy được nhất?</span>
                </div>
            `;

            return `
                <!-- Banner -->
                <div class="popout-banner" style="${bannerStyle}"></div>
                
                <!-- Avatar with cutout border -->
                <div class="popout-avatar-section">
                    <div class="popout-avatar-wrapper">
                        ${avatarHtml}
                        <div class="popout-status-badge status-${status.toLowerCase()}"></div>
                    </div>
                </div>

                <!-- Body Content -->
                <div class="popout-body">
                    <!-- Identity -->
                    <div class="popout-identity">
                        <div class="popout-display-name">
                            <span class="popout-name">${this.escapeHtml(displayName)}</span>
                            ${badgesHtml}
                        </div>
                        <div class="popout-username">${this.escapeHtml(username)}#${discriminator}</div>
                    </div>

                    <!-- Custom Status -->
                    ${customStatusHtml}

                    <!-- Separator -->
                    <div class="popout-separator"></div>

                    <!-- Menu Actions -->
                    <div class="popout-menu">
                        <button class="popout-menu-item" data-action="edit-profile">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                            <span>Sửa hồ sơ</span>
                        </button>
                        
                        <button class="popout-menu-item" data-action="set-status">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                            </svg>
                            <span>Đặt trạng thái</span>
                        </button>

                        <div class="popout-menu-separator"></div>

                        <button class="popout-menu-item" data-action="switch-account">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M16.67 13.13C18.04 14.06 19 15.32 19 17v3h4v-3c0-2.18-3.57-3.47-6.33-3.87zM15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4c-.47 0-.91.1-1.33.24.74.85 1.17 1.95 1.17 3.09s-.43 2.24-1.17 3.09c.42.14.86.58 1.33.58zM9 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 7c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z"/>
                            </svg>
                            <span>Đổi tài khoản</span>
                        </button>

                        <div class="popout-menu-separator"></div>

                        <button class="popout-menu-item popout-menu-danger" data-action="logout">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                            </svg>
                            <span>Đăng xuất</span>
                        </button>
                    </div>
                </div>
            `;
        },

        attachPopoutListeners: function() {
            const popout = document.getElementById('userPopout');
            if (!popout) return;

            // Menu item actions
            popout.querySelectorAll('.popout-menu-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.handlePopoutAction(item.dataset.action);
                });
            });

            // Custom status placeholder click
            const setStatusBtn = popout.querySelector('#popoutSetStatusBtn');
            if (setStatusBtn) {
                setStatusBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.hidePopout();
                    this.openStatusPicker();
                });
            }
        },

        openStatusPicker: function() {
            if (window.StatusPicker?.show) {
                window.StatusPicker.show(this.currentUser, (updatedUser) => {
                    this.currentUser = updatedUser;
                    this.render();
                });
            } else if (window.SettingsModal?.open) {
                window.SettingsModal.open('profiles', this.currentUser);
            }
        },

        handlePopoutAction: function(action) {
            this.hidePopout();

            switch (action) {
                case 'edit-profile':
                    if (window.SettingsModal?.open) {
                        window.SettingsModal.open('profiles', this.currentUser);
                    } else {
                        window.location.href = '/settings/profile';
                    }
                    break;

                case 'set-status':
                    this.openStatusPicker();
                    break;

                case 'switch-account':
                    if (confirm('Đổi sang tài khoản khác? Bạn sẽ bị đăng xuất.')) {
                        this.performLogout();
                    }
                    break;

                case 'logout':
                    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                        this.performLogout();
                    }
                    break;
            }
        },

        performLogout: async function() {
            try {
                const token = localStorage.getItem('accessToken');
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (e) {
                // Ignore logout errors
            }
            
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            localStorage.removeItem('userPanel_muted');
            localStorage.removeItem('userPanel_deafened');
            window.location.href = '/login';
        },

        // ============================================
        // Presence Heartbeat
        // ============================================
        startPresenceHeartbeat: function() {
            // Send presence heartbeat every 30 seconds
            setInterval(() => this.sendHeartbeat(), 30000);
        },

        sendHeartbeat: async function() {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) return;

                await fetch('/api/users/heartbeat', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (error) {
                console.error('UserPanel: Heartbeat failed', error);
            }
        },

        // ============================================
        // Public API
        // ============================================
        update: function(userData) {
            if (userData) {
                this.currentUser = { ...this.currentUser, ...userData };
                this.render();
            }
        },

        // Sync mute/deafen state from external source (e.g., voice channel)
        syncAudioState: function(isMuted, isDeafened) {
            this.isMuted = isMuted;
            this.isDeafened = isDeafened;
            this.updateAudioButtons();
        },

        // ============================================
        // Utilities
        // ============================================
        escapeHtml: function(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    // Export to window
    window.UserPanel = UserPanel;

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => UserPanel.init());
    } else {
        setTimeout(() => UserPanel.init(), 100);
    }
})();
