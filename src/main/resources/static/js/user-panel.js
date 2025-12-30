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
            const discriminator = this.currentUser.discriminator || String(this.currentUser.id % 10000).padStart(4, '0');
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
                settingsBtn.addEventListener('click', () => {
                    window.UserSettingsModal && window.UserSettingsModal.open();
                });
            }

            if (userAvatar) {
                userAvatar.addEventListener('click', () => {
                    window.UserProfileModal && window.UserProfileModal.open(this.currentUser.id);
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
