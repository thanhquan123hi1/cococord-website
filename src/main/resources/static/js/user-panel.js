/**
 * User Panel Component
 * Bottom-left panel showing current user's avatar, status, and custom status
 * Includes status picker dropdown
 */

(function() {
    'use strict';

    const UserPanel = {
        currentUser: null,
        statusPickerVisible: false,

        /**
         * Initialize user panel
         */
        init: async function() {
            await this.loadCurrentUser();
            this.render();
            this.attachEventListeners();
            this.startPresenceHeartbeat();
        },

        /**
         * Load current user profile
         */
        loadCurrentUser: async function() {
            try {
                const response = await fetch('/api/users/me/profile', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                });

                if (response.ok) {
                    this.currentUser = await response.json();
                    return this.currentUser;
                }
            } catch (error) {
                console.error('Failed to load user profile:', error);
            }
            return null;
        },

        /**
         * Render user panel
         */
        render: function() {
            if (!this.currentUser) return;

            const container = document.getElementById('userPanel');
            if (!container) return;

            const displayName = this.currentUser.displayName || this.currentUser.username;
            const discriminator = String(this.currentUser.id % 10000).padStart(4, '0');
            const status = this.currentUser.status || 'OFFLINE';
            const customStatus = this.getCustomStatusText();

            container.innerHTML = `
                <div class="user-panel-content">
                    <div class="user-avatar-wrapper" id="userAvatar">
                        ${this.renderAvatar()}
                        <span class="status-indicator status-${status.toLowerCase()}" 
                              title="${this.getStatusLabel(status)}"></span>
                    </div>
                    <div class="user-info">
                        <div class="user-name" id="userName">${this.escapeHtml(displayName)}</div>
                        <div class="user-discriminator">#${discriminator}</div>
                        ${customStatus ? `<div class="user-custom-status" id="userCustomStatus">${customStatus}</div>` : ''}
                    </div>
                    <div class="user-actions">
                        <button class="user-action-btn" id="statusPickerBtn" title="Set Status">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="12" cy="12" r="10"/>
                            </svg>
                        </button>
                        <button class="user-action-btn" id="settingsBtn" title="User Settings">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        },

        /**
         * Render avatar
         */
        renderAvatar: function() {
            const displayName = this.currentUser.displayName || this.currentUser.username;
            
            if (this.currentUser.avatarUrl) {
                return `<img src="${this.currentUser.avatarUrl}" alt="${this.escapeHtml(displayName)}" class="user-avatar">`;
            } else {
                const initial = displayName.charAt(0).toUpperCase();
                return `<div class="user-avatar-placeholder">${initial}</div>`;
            }
        },

        /**
         * Get custom status text with emoji
         */
        getCustomStatusText: function() {
            if (!this.currentUser.customStatus) return '';
            
            const emoji = this.currentUser.customStatusEmoji || '';
            const text = this.currentUser.customStatus;
            
            return emoji ? `${emoji} ${this.escapeHtml(text)}` : this.escapeHtml(text);
        },

        /**
         * Get status label
         */
        getStatusLabel: function(status) {
            const labels = {
                'ONLINE': 'Online',
                'IDLE': 'Idle',
                'DO_NOT_DISTURB': 'Do Not Disturb',
                'OFFLINE': 'Offline',
                'INVISIBLE': 'Invisible'
            };
            return labels[status] || 'Unknown';
        },

        /**
         * Attach event listeners
         */
        attachEventListeners: function() {
            const statusPickerBtn = document.getElementById('statusPickerBtn');
            const settingsBtn = document.getElementById('settingsBtn');
            const userAvatar = document.getElementById('userAvatar');

            if (statusPickerBtn) {
                statusPickerBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleStatusPicker();
                });
            }

            if (settingsBtn) {
                settingsBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.UserSettingsModal && window.UserSettingsModal.show();
                });
            }

            // Click on user info area to show UCP popup
            const userInfoArea = container.querySelector('.user-panel-content');
            if (userInfoArea) {
                userInfoArea.addEventListener('click', (e) => {
                    // Don't trigger if clicking on action buttons
                    if (e.target.closest('.user-actions')) return;
                    e.stopPropagation();
                    this.toggleUCPPopup();
                });
            }

            // Close status picker when clicking outside
            document.addEventListener('click', () => {
                if (this.statusPickerVisible) {
                    this.hideStatusPicker();
                }
            });
        },

        /**
         * Toggle status picker dropdown
         */
        toggleStatusPicker: function() {
            if (this.statusPickerVisible) {
                this.hideStatusPicker();
            } else {
                this.showStatusPicker();
            }
        },

        /**
         * Show status picker
         */
        showStatusPicker: function() {
            if (this.statusPickerVisible) return;
            
            this.statusPickerVisible = true;
            window.StatusPicker && window.StatusPicker.show(this.currentUser, (updatedStatus) => {
                this.currentUser.status = updatedStatus.status;
                this.currentUser.customStatus = updatedStatus.customStatus;
                this.currentUser.customStatusEmoji = updatedStatus.customStatusEmoji;
                this.render();
            });
        },

        /**
         * Hide status picker
         */
        hideStatusPicker: function() {
            this.statusPickerVisible = false;
            window.StatusPicker && window.StatusPicker.hide();
        },

        /**
         * Update user info
         */
        update: function(userData) {
            this.currentUser = { ...this.currentUser, ...userData };
            this.render();
        },

        /**
         * UCP Popup state
         */
        ucpPopupVisible: false,

        /**
         * Toggle UCP Popup
         */
        toggleUCPPopup: function() {
            if (this.ucpPopupVisible) {
                this.hideUCPPopup();
            } else {
                this.showUCPPopup();
            }
        },

        /**
         * Show UCP Popup
         */
        showUCPPopup: function() {
            if (this.ucpPopupVisible) return;
            this.ucpPopupVisible = true;

            // Hide status picker if visible
            if (this.statusPickerVisible) {
                this.hideStatusPicker();
            }

            // Remove existing popup
            const existing = document.querySelector('.ucp-popup');
            if (existing) existing.remove();

            const popup = document.createElement('div');
            popup.className = 'ucp-popup';
            
            const displayName = this.currentUser.displayName || this.currentUser.username;
            const status = this.currentUser.status || 'OFFLINE';
            const customStatus = this.currentUser.customStatus || '';
            const customEmoji = this.currentUser.customStatusEmoji || '';
            const bannerUrl = this.currentUser.bannerUrl || '';
            const bannerColor = this.currentUser.bannerColor || '#f04747';
            const bio = this.currentUser.bio || '';

            popup.innerHTML = `
                <div class="ucp-popup-banner" style="${bannerUrl ? `background-image: url('${bannerUrl}')` : `background-color: ${bannerColor}`}">
                    <div class="ucp-popup-avatar-container">
                        ${this.renderPopupAvatar()}
                        <span class="ucp-popup-status-ring status-${status.toLowerCase()}"></span>
                        ${this.currentUser.avatarDecorationUrl ? `<img class="ucp-popup-avatar-decoration" src="${this.currentUser.avatarDecorationUrl}" alt="">` : ''}
                    </div>
                    ${customStatus ? `
                        <div class="ucp-popup-custom-bubble">
                            <span class="ucp-bubble-icon">➕</span>
                            <span class="ucp-bubble-text">${this.escapeHtml(customStatus)}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="ucp-popup-body">
                    <div class="ucp-popup-identity">
                        <span class="ucp-popup-displayname">${this.escapeHtml(displayName)}</span>
                        ${this.currentUser.nitro ? `<img class="ucp-popup-badge" src="/images/nitro-badge.svg" alt="Nitro" title="Nitro">` : ''}
                    </div>
                    <div class="ucp-popup-username">${this.escapeHtml(this.currentUser.username)}</div>
                    
                    <div class="ucp-popup-menu">
                        <button class="ucp-menu-item" data-action="edit-profile">
                            <svg class="ucp-menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                            <span class="ucp-menu-text">Sửa Hồ Sơ</span>
                        </button>
                        
                        <button class="ucp-menu-item ucp-menu-expandable" data-action="set-status">
                            <span class="ucp-status-indicator status-${status.toLowerCase()}"></span>
                            <span class="ucp-menu-text">${this.getStatusLabel(status)}</span>
                            <svg class="ucp-menu-arrow" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                            </svg>
                        </button>
                        
                        <div class="ucp-menu-separator"></div>
                        
                        <button class="ucp-menu-item" data-action="switch-account">
                            <svg class="ucp-menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-4.43-.82-6.14-2.88C7.55 15.8 9.68 15 12 15s4.45.8 6.14 2.12C16.43 19.18 14.03 20 12 20z"/>
                            </svg>
                            <span class="ucp-menu-text">Đổi Tài Khoản</span>
                            <svg class="ucp-menu-arrow" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(popup);

            // Position popup above user panel
            const panel = document.getElementById('userPanel');
            if (panel) {
                const rect = panel.getBoundingClientRect();
                popup.style.left = `${rect.left}px`;
                popup.style.bottom = `${window.innerHeight - rect.top + 8}px`;
            }

            // Attach popup events
            popup.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = e.target.closest('[data-action]')?.dataset.action;
                if (action) {
                    this.handleUCPAction(action);
                }
            });

            // Close on outside click
            setTimeout(() => {
                document.addEventListener('click', this.handleOutsideClick);
            }, 10);
        },

        handleOutsideClick: function(e) {
            const popup = document.querySelector('.ucp-popup');
            if (popup && !popup.contains(e.target) && !e.target.closest('.user-panel-content')) {
                UserPanel.hideUCPPopup();
            }
        },

        /**
         * Hide UCP Popup
         */
        hideUCPPopup: function() {
            this.ucpPopupVisible = false;
            const popup = document.querySelector('.ucp-popup');
            if (popup) popup.remove();
            document.removeEventListener('click', this.handleOutsideClick);
        },

        /**
         * Handle UCP menu actions
         */
        handleUCPAction: function(action) {
            this.hideUCPPopup();
            
            switch (action) {
                case 'edit-profile':
                    window.UserSettingsModal && window.UserSettingsModal.show('profile');
                    break;
                case 'set-status':
                    this.showStatusPicker();
                    break;
                case 'switch-account':
                    // Show account switcher or logout
                    if (confirm('Bạn có muốn đăng xuất để đổi tài khoản?')) {
                        localStorage.removeItem('accessToken');
                        window.location.href = '/login';
                    }
                    break;
            }
        },

        /**
         * Render popup avatar
         */
        renderPopupAvatar: function() {
            const displayName = this.currentUser.displayName || this.currentUser.username;
            
            if (this.currentUser.avatarUrl) {
                return `<img src="${this.currentUser.avatarUrl}" alt="${this.escapeHtml(displayName)}" class="ucp-popup-avatar">`;
            } else {
                const initial = displayName.charAt(0).toUpperCase();
                return `<div class="ucp-popup-avatar-placeholder">${initial}</div>`;
            }
        },

        /**
         * Start presence heartbeat (every 5 minutes)
         */
        startPresenceHeartbeat: function() {
            setInterval(async () => {
                try {
                    await fetch('/api/users/me/activity', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                        }
                    });
                } catch (error) {
                    console.error('Failed to send presence heartbeat:', error);
                }
            }, 5 * 60 * 1000); // 5 minutes
        },

        /**
         * Escape HTML
         */
        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    // Export to window
    window.UserPanel = UserPanel;

    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => UserPanel.init());
    } else {
        UserPanel.init();
    }
})();
