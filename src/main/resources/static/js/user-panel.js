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
        initialized: false,

        /**
         * Initialize user panel
         */
        init: async function() {
            // Prevent double initialization
            if (this.initialized) return;
            
            // Check if user panel container exists
            const container = document.getElementById('userPanel');
            if (!container) {
                console.log('UserPanel: #userPanel container not found, skipping initialization');
                return;
            }

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

        /**
         * Load current user profile
         */
        loadCurrentUser: async function() {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    console.log('UserPanel: No access token found');
                    return null;
                }

                const response = await fetch('/api/users/me/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    this.currentUser = await response.json();
                    return this.currentUser;
                } else if (response.status === 401) {
                    console.log('UserPanel: Token expired or invalid');
                    return null;
                }
            } catch (error) {
                console.error('UserPanel: Failed to load user profile:', error);
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

            const displayName = this.currentUser.displayName || this.currentUser.username || 'User';
            const discriminator = String((this.currentUser.id || 0) % 10000).padStart(4, '0');
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
                                <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
            
            // Re-attach event listeners after render
            this.attachEventListeners();
        },

        /**
         * Render avatar
         */
        renderAvatar: function() {
            const displayName = this.currentUser.displayName || this.currentUser.username || 'U';
            
            if (this.currentUser.avatarUrl) {
                return `<img src="${this.escapeHtml(this.currentUser.avatarUrl)}" alt="${this.escapeHtml(displayName)}" class="user-avatar">`;
            } else {
                const initial = displayName.charAt(0).toUpperCase();
                return `<div class="user-avatar-placeholder">${initial}</div>`;
            }
        },

        /**
         * Get custom status text with emoji
         */
        getCustomStatusText: function() {
            if (!this.currentUser || !this.currentUser.customStatus) return '';
            
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
                // Remove existing listeners to prevent duplicates
                statusPickerBtn.replaceWith(statusPickerBtn.cloneNode(true));
                const newStatusPickerBtn = document.getElementById('statusPickerBtn');
                if (newStatusPickerBtn) {
                    newStatusPickerBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.toggleStatusPicker();
                    });
                }
            }

            if (settingsBtn) {
                // Remove existing listeners to prevent duplicates
                settingsBtn.replaceWith(settingsBtn.cloneNode(true));
                const newSettingsBtn = document.getElementById('settingsBtn');
                if (newSettingsBtn) {
                    newSettingsBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.showSettingsModal();
                    });
                }
            }

            if (userAvatar) {
                // Remove existing listeners to prevent duplicates
                userAvatar.replaceWith(userAvatar.cloneNode(true));
                const newUserAvatar = document.getElementById('userAvatar');
                if (newUserAvatar) {
                    newUserAvatar.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (this.currentUser && this.currentUser.id) {
                            if (window.UserProfileModal && typeof window.UserProfileModal.show === 'function') {
                                window.UserProfileModal.show(this.currentUser.id);
                            } else if (window.UserProfileModal && typeof window.UserProfileModal.open === 'function') {
                                window.UserProfileModal.open(this.currentUser.id);
                            }
                        }
                    });
                }
            }

            // Close status picker when clicking outside
            document.addEventListener('click', (e) => {
                if (this.statusPickerVisible) {
                    const picker = document.getElementById('statusPickerDropdown');
                    if (picker && !picker.contains(e.target)) {
                        this.hideStatusPicker();
                    }
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
            if (window.StatusPicker && typeof window.StatusPicker.show === 'function') {
                window.StatusPicker.show(this.currentUser, (updatedUser) => {
                    this.currentUser = updatedUser;
                    this.render();
                });
                this.statusPickerVisible = true;
            }
        },

        /**
         * Hide status picker
         */
        hideStatusPicker: function() {
            if (window.StatusPicker && typeof window.StatusPicker.hide === 'function') {
                window.StatusPicker.hide();
            }
            this.statusPickerVisible = false;
        },

        /**
         * Update user data
         */
        update: function(userData) {
            if (userData) {
                this.currentUser = { ...this.currentUser, ...userData };
                this.render();
            }
        },

        /**
         * Start presence heartbeat (every 5 minutes)
         */
        startPresenceHeartbeat: function() {
            // Send initial heartbeat
            this.sendHeartbeat();
            
            // Set up interval
            setInterval(() => {
                this.sendHeartbeat();
            }, 5 * 60 * 1000); // 5 minutes
        },

        /**
         * Send heartbeat to server
         */
        sendHeartbeat: async function() {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) return;

                await fetch('/api/users/me/activity', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            } catch (error) {
                console.error('UserPanel: Failed to send presence heartbeat:', error);
            }
        },

        /**
         * Show settings modal
         */
        showSettingsModal: function() {
            // Remove existing modal if any
            this.hideSettingsModal();

            const modal = document.createElement('div');
            modal.id = 'userSettingsModal';
            modal.className = 'settings-modal-overlay';
            modal.innerHTML = `
                <div class="settings-modal">
                    <div class="settings-modal-header">
                        <h2>Cài đặt người dùng</h2>
                        <button class="settings-close-btn" id="closeSettingsBtn">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="settings-modal-body">
                        <div class="settings-sidebar">
                            <div class="settings-nav-group">
                                <div class="settings-nav-title">CÀI ĐẶT NGƯỜI DÙNG</div>
                                <button class="settings-nav-item active" data-section="account">Tài khoản</button>
                                <button class="settings-nav-item" data-section="profile">Hồ sơ</button>
                                <button class="settings-nav-item" data-section="privacy">Quyền riêng tư</button>
                            </div>
                            <div class="settings-nav-group">
                                <div class="settings-nav-title">CÀI ĐẶT ỨNG DỤNG</div>
                                <button class="settings-nav-item" data-section="appearance">Giao diện</button>
                                <button class="settings-nav-item" data-section="notifications">Thông báo</button>
                                <button class="settings-nav-item" data-section="keybinds">Phím tắt</button>
                                <button class="settings-nav-item" data-section="language">Ngôn ngữ</button>
                            </div>
                            <div class="settings-nav-divider"></div>
                            <button class="settings-nav-item logout-btn" data-section="logout">Đăng xuất</button>
                        </div>
                        <div class="settings-content" id="settingsContent">
                            ${this.renderSettingsSection('account')}
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Attach event listeners
            const closeBtn = document.getElementById('closeSettingsBtn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.hideSettingsModal());
            }

            // Close on overlay click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideSettingsModal();
                }
            });

            // Close on Escape key
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    this.hideSettingsModal();
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);

            // Navigation items
            const navItems = modal.querySelectorAll('.settings-nav-item');
            navItems.forEach(item => {
                item.addEventListener('click', () => {
                    const section = item.dataset.section;
                    if (section === 'logout') {
                        this.handleLogout();
                        return;
                    }
                    navItems.forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                    const content = document.getElementById('settingsContent');
                    if (content) {
                        content.innerHTML = this.renderSettingsSection(section);
                    }
                });
            });
        },

        /**
         * Hide settings modal
         */
        hideSettingsModal: function() {
            const modal = document.getElementById('userSettingsModal');
            if (modal) {
                modal.remove();
            }
        },

        /**
         * Render settings section content
         */
        renderSettingsSection: function(section) {
            const user = this.currentUser || {};
            const displayName = user.displayName || user.username || 'User';
            const email = user.email || 'email@example.com';

            switch (section) {
                case 'account':
                    return `
                        <div class="settings-section">
                            <h3>Tài khoản của tôi</h3>
                            <div class="settings-card">
                                <div class="settings-card-row">
                                    <div class="settings-card-info">
                                        <div class="settings-card-label">TÊN NGƯỜI DÙNG</div>
                                        <div class="settings-card-value">${this.escapeHtml(displayName)}</div>
                                    </div>
                                    <button class="settings-edit-btn">Chỉnh sửa</button>
                                </div>
                                <div class="settings-card-row">
                                    <div class="settings-card-info">
                                        <div class="settings-card-label">EMAIL</div>
                                        <div class="settings-card-value">${this.escapeHtml(email)}</div>
                                    </div>
                                    <button class="settings-edit-btn">Chỉnh sửa</button>
                                </div>
                                <div class="settings-card-row">
                                    <div class="settings-card-info">
                                        <div class="settings-card-label">MẬT KHẨU</div>
                                        <div class="settings-card-value">••••••••</div>
                                    </div>
                                    <button class="settings-edit-btn">Đổi mật khẩu</button>
                                </div>
                            </div>
                        </div>
                    `;
                case 'profile':
                    return `
                        <div class="settings-section">
                            <h3>Hồ sơ của tôi</h3>
                            <div class="settings-card">
                                <div class="settings-card-row">
                                    <div class="settings-card-info">
                                        <div class="settings-card-label">AVATAR</div>
                                        <div class="settings-card-avatar">
                                            ${user.avatarUrl 
                                                ? `<img src="${this.escapeHtml(user.avatarUrl)}" alt="Avatar">` 
                                                : `<div class="avatar-placeholder">${displayName.charAt(0).toUpperCase()}</div>`
                                            }
                                        </div>
                                    </div>
                                    <button class="settings-edit-btn">Đổi avatar</button>
                                </div>
                                <div class="settings-card-row">
                                    <div class="settings-card-info">
                                        <div class="settings-card-label">GIỚI THIỆU</div>
                                        <div class="settings-card-value">${user.bio ? this.escapeHtml(user.bio) : 'Chưa có giới thiệu'}</div>
                                    </div>
                                    <button class="settings-edit-btn">Chỉnh sửa</button>
                                </div>
                            </div>
                        </div>
                    `;
                case 'privacy':
                    return `
                        <div class="settings-section">
                            <h3>Quyền riêng tư & An toàn</h3>
                            <div class="settings-option">
                                <div class="settings-option-info">
                                    <div class="settings-option-title">Tin nhắn trực tiếp</div>
                                    <div class="settings-option-desc">Cho phép tin nhắn trực tiếp từ thành viên server</div>
                                </div>
                                <label class="settings-toggle">
                                    <input type="checkbox" checked>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                            <div class="settings-option">
                                <div class="settings-option-info">
                                    <div class="settings-option-title">Lời mời kết bạn</div>
                                    <div class="settings-option-desc">Cho phép người khác gửi lời mời kết bạn</div>
                                </div>
                                <label class="settings-toggle">
                                    <input type="checkbox" checked>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    `;
                case 'appearance':
                    return `
                        <div class="settings-section">
                            <h3>Giao diện</h3>
                            <div class="settings-option">
                                <div class="settings-option-info">
                                    <div class="settings-option-title">Chủ đề</div>
                                    <div class="settings-option-desc">Chọn giao diện sáng hoặc tối</div>
                                </div>
                                <select class="settings-select">
                                    <option value="dark" selected>Tối</option>
                                    <option value="light">Sáng</option>
                                </select>
                            </div>
                            <div class="settings-option">
                                <div class="settings-option-info">
                                    <div class="settings-option-title">Cỡ chữ tin nhắn</div>
                                    <div class="settings-option-desc">Điều chỉnh cỡ chữ trong tin nhắn</div>
                                </div>
                                <select class="settings-select">
                                    <option value="12">12px</option>
                                    <option value="14" selected>14px</option>
                                    <option value="16">16px</option>
                                    <option value="18">18px</option>
                                </select>
                            </div>
                        </div>
                    `;
                case 'notifications':
                    return `
                        <div class="settings-section">
                            <h3>Thông báo</h3>
                            <div class="settings-option">
                                <div class="settings-option-info">
                                    <div class="settings-option-title">Bật thông báo máy tính</div>
                                    <div class="settings-option-desc">Nhận thông báo trên màn hình</div>
                                </div>
                                <label class="settings-toggle">
                                    <input type="checkbox" checked>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                            <div class="settings-option">
                                <div class="settings-option-info">
                                    <div class="settings-option-title">Âm thanh thông báo</div>
                                    <div class="settings-option-desc">Phát âm thanh khi có tin nhắn mới</div>
                                </div>
                                <label class="settings-toggle">
                                    <input type="checkbox" checked>
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    `;
                case 'keybinds':
                    return `
                        <div class="settings-section">
                            <h3>Phím tắt</h3>
                            <div class="settings-keybind">
                                <span class="keybind-action">Tìm kiếm</span>
                                <span class="keybind-key">Ctrl + K</span>
                            </div>
                            <div class="settings-keybind">
                                <span class="keybind-action">Gửi tin nhắn</span>
                                <span class="keybind-key">Enter</span>
                            </div>
                            <div class="settings-keybind">
                                <span class="keybind-action">Xuống dòng</span>
                                <span class="keybind-key">Shift + Enter</span>
                            </div>
                            <div class="settings-keybind">
                                <span class="keybind-action">Đóng cửa sổ</span>
                                <span class="keybind-key">Escape</span>
                            </div>
                        </div>
                    `;
                case 'language':
                    return `
                        <div class="settings-section">
                            <h3>Ngôn ngữ</h3>
                            <div class="settings-option">
                                <div class="settings-option-info">
                                    <div class="settings-option-title">Ngôn ngữ hiển thị</div>
                                    <div class="settings-option-desc">Chọn ngôn ngữ cho ứng dụng</div>
                                </div>
                                <select class="settings-select">
                                    <option value="vi" selected>Tiếng Việt</option>
                                    <option value="en">English</option>
                                </select>
                            </div>
                        </div>
                    `;
                default:
                    return '<div class="settings-section"><p>Đang phát triển...</p></div>';
            }
        },

        /**
         * Handle logout
         */
        handleLogout: function() {
            if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
            }
        },

        /**
         * Escape HTML
         */
        escapeHtml: function(text) {
            if (!text) return '';
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
        // DOM already ready, but delay slightly to ensure other scripts are loaded
        setTimeout(() => UserPanel.init(), 100);
    }
})();