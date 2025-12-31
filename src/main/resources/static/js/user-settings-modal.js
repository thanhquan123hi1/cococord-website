/**
 * User Settings Modal Component
 * Multi-tab settings interface for My Account, Profile, Privacy, and Appearance
 */
const UserSettingsModal = (function() {
    'use strict';

    let currentUser = null;
    let modalElement = null;
    let activeTab = 'account';
    let unsavedChanges = false;

    const TABS = {
        account: 'Tài khoản của tôi',
        profile: 'Hồ sơ người dùng',
        privacy: 'Quyền riêng tư',
        appearance: 'Giao diện'
    };

    /**
     * Initialize the settings modal
     */
    function init() {
        createModalElement();
        attachEventListeners();
    }

    /**
     * Create modal DOM element
     */
    function createModalElement() {
        if (document.getElementById('userSettingsModal')) {
            modalElement = document.getElementById('userSettingsModal');
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'userSettingsModal';
        modal.className = 'settings-modal-overlay';
        modal.style.display = 'none';
        document.body.appendChild(modal);
        modalElement = modal;
    }

    /**
     * Show settings modal
     * @param {string} tab - Initial tab to show (optional)
     */
    async function show(tab = 'account') {
        activeTab = tab;
        
        try {
            // Load current user data
            const response = await fetch('/api/users/me/profile', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load user data');
            }

            currentUser = await response.json();
            render();
            modalElement.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            unsavedChanges = false;
        } catch (error) {
            console.error('Error loading settings:', error);
            alert('Không thể tải cài đặt người dùng');
        }
    }

    /**
     * Hide the modal
     */
    function hide() {
        if (unsavedChanges) {
            if (!confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn đóng?')) {
                return;
            }
        }
        modalElement.style.display = 'none';
        document.body.style.overflow = '';
        currentUser = null;
        unsavedChanges = false;
    }

    /**
     * Switch tab
     */
    function switchTab(tab) {
        activeTab = tab;
        render();
    }

    /**
     * Render the modal content
     */
    function render() {
        if (!currentUser) return;

        modalElement.innerHTML = `
            <div class="settings-modal-backdrop" onclick="UserSettingsModal.hide()"></div>
            <div class="settings-modal-content">
                <!-- Sidebar -->
                <div class="settings-sidebar">
                    <div class="settings-sidebar-header">
                        <h2>Cài đặt người dùng</h2>
                    </div>
                    <div class="settings-sidebar-nav">
                        ${Object.entries(TABS).map(([key, label]) => `
                            <button class="settings-nav-item ${activeTab === key ? 'active' : ''}" onclick="UserSettingsModal.switchTab('${key}')">
                                ${label}
                            </button>
                        `).join('')}
                    </div>
                    <div class="settings-sidebar-footer">
                        <button class="settings-logout-btn" onclick="UserSettingsModal.logout()">
                            <i class="bi bi-box-arrow-right"></i> Đăng xuất
                        </button>
                    </div>
                </div>

                <!-- Content -->
                <div class="settings-main">
                    <button class="settings-close-btn" onclick="UserSettingsModal.hide()">
                        <i class="bi bi-x-lg"></i>
                        <span>ESC</span>
                    </button>
                    
                    <div class="settings-content">
                        ${renderTabContent()}
                    </div>
                </div>
            </div>
        `;

        // Attach form listeners after render
        attachFormListeners();
    }

    /**
     * Render tab content based on active tab
     */
    function renderTabContent() {
        switch (activeTab) {
            case 'account':
                return renderAccountTab();
            case 'profile':
                return renderProfileTab();
            case 'privacy':
                return renderPrivacyTab();
            case 'appearance':
                return renderAppearanceTab();
            default:
                return '<p>Tab không tồn tại</p>';
        }
    }

    /**
     * Render Account tab
     */
    function renderAccountTab() {
        return `
            <div class="settings-section">
                <h1 class="settings-title">Tài khoản của tôi</h1>
                
                <!-- User Card -->
                <div class="settings-user-card">
                    <div class="settings-user-avatar">
                        <img src="${currentUser.avatarUrl || '/images/default-avatar.png'}" alt="${currentUser.username}">
                    </div>
                    <div class="settings-user-info">
                        <div class="settings-user-name">${currentUser.displayName || currentUser.username}</div>
                        <div class="settings-user-tag">${currentUser.username}#${currentUser.discriminator}</div>
                    </div>
                    <button class="settings-edit-btn" onclick="UserSettingsModal.switchTab('profile')">Chỉnh sửa</button>
                </div>

                <!-- Account Info -->
                <form id="accountForm" onsubmit="UserSettingsModal.saveAccount(event)">
                    <div class="settings-form-group">
                        <label class="settings-label">Tên người dùng</label>
                        <input type="text" class="settings-input" id="username" value="${currentUser.username}" required minlength="3" maxlength="32" pattern="[a-zA-Z0-9_]+">
                        <p class="settings-hint">Chỉ chữ cái, số và dấu gạch dưới. 3-32 ký tự.</p>
                    </div>

                    <div class="settings-form-group">
                        <label class="settings-label">Email</label>
                        <input type="email" class="settings-input" id="email" value="${currentUser.email}" required>
                        <p class="settings-hint">Email của bạn để khôi phục tài khoản.</p>
                    </div>

                    <div class="settings-form-actions">
                        <button type="button" class="settings-btn secondary" onclick="UserSettingsModal.render()">Hủy</button>
                        <button type="submit" class="settings-btn primary">Lưu thay đổi</button>
                    </div>
                </form>

                <!-- Password Section -->
                <div class="settings-divider"></div>
                <h2 class="settings-subtitle">Mật khẩu</h2>
                <button class="settings-btn secondary" onclick="UserSettingsModal.changePassword()">Đổi mật khẩu</button>
            </div>
        `;
    }

    /**
     * Render Profile tab
     */
    function renderProfileTab() {
        return `
            <div class="settings-section">
                <h1 class="settings-title">Hồ sơ người dùng</h1>

                <!-- Banner Upload -->
                <div class="settings-form-group">
                    <label class="settings-label">Banner</label>
                    <div class="settings-banner-preview" style="background-image: url('${currentUser.bannerUrl || '/images/default-banner.jpg'}')">
                        <button class="settings-upload-btn" onclick="document.getElementById('bannerUpload').click()">
                            <i class="bi bi-upload"></i> Tải lên banner
                        </button>
                    </div>
                    <input type="file" id="bannerUpload" accept="image/*" style="display: none;" onchange="UserSettingsModal.uploadBanner(this)">
                    <p class="settings-hint">Kích thước tối thiểu: 600x240px. Định dạng: JPG, PNG, GIF. Tối đa 8MB.</p>
                </div>

                <!-- Avatar Upload -->
                <div class="settings-form-group">
                    <label class="settings-label">Avatar</label>
                    <div class="settings-avatar-upload">
                        <img src="${currentUser.avatarUrl || '/images/default-avatar.png'}" alt="Avatar" class="settings-avatar-preview">
                        <button class="settings-upload-btn" onclick="document.getElementById('avatarUpload').click()">
                            <i class="bi bi-upload"></i> Tải lên avatar
                        </button>
                    </div>
                    <input type="file" id="avatarUpload" accept="image/*" style="display: none;" onchange="UserSettingsModal.uploadAvatar(this)">
                    <p class="settings-hint">Kích thước tối thiểu: 128x128px. Định dạng: JPG, PNG, GIF. Tối đa 8MB.</p>
                </div>

                <!-- Profile Form -->
                <form id="profileForm" onsubmit="UserSettingsModal.saveProfile(event)">
                    <div class="settings-form-group">
                        <label class="settings-label">Tên hiển thị</label>
                        <input type="text" class="settings-input" id="displayName" value="${currentUser.displayName || ''}" maxlength="50">
                        <p class="settings-hint">Tên này sẽ hiển thị thay vì tên người dùng.</p>
                    </div>

                    <div class="settings-form-group">
                        <label class="settings-label">Đại từ nhân xưng</label>
                        <input type="text" class="settings-input" id="pronouns" value="${currentUser.pronouns || ''}" maxlength="20" placeholder="vd: anh/ấy">
                    </div>

                    <div class="settings-form-group">
                        <label class="settings-label">Tiểu sử</label>
                        <textarea class="settings-textarea" id="bio" maxlength="190" rows="4" placeholder="Viết gì đó về bản thân bạn...">${currentUser.bio || ''}</textarea>
                        <p class="settings-hint">${(currentUser.bio || '').length}/190 ký tự</p>
                    </div>

                    <div class="settings-form-actions">
                        <button type="button" class="settings-btn secondary" onclick="UserSettingsModal.render()">Hủy</button>
                        <button type="submit" class="settings-btn primary">Lưu thay đổi</button>
                    </div>
                </form>
            </div>
        `;
    }

    /**
     * Render Privacy tab
     */
    function renderPrivacyTab() {
        return `
            <div class="settings-section">
                <h1 class="settings-title">Quyền riêng tư & An toàn</h1>

                <form id="privacyForm" onsubmit="UserSettingsModal.savePrivacy(event)">
                    <div class="settings-toggle-group">
                        <div class="settings-toggle-info">
                            <label class="settings-label">Cho phép lời mời kết bạn</label>
                            <p class="settings-hint">Người khác có thể gửi lời mời kết bạn cho bạn.</p>
                        </div>
                        <label class="settings-toggle">
                            <input type="checkbox" id="allowFriendRequests" ${currentUser.allowFriendRequests !== false ? 'checked' : ''}>
                            <span class="settings-toggle-slider"></span>
                        </label>
                    </div>

                    <div class="settings-toggle-group">
                        <div class="settings-toggle-info">
                            <label class="settings-label">Cho phép tin nhắn trực tiếp từ người lạ</label>
                            <p class="settings-hint">Cho phép người không phải bạn bè nhắn tin trực tiếp với bạn. Nếu tắt, chỉ có bạn bè mới có thể nhắn tin cho bạn.</p>
                        </div>
                        <label class="settings-toggle">
                            <input type="checkbox" id="allowDirectMessages" ${currentUser.allowDirectMessages !== false ? 'checked' : ''}>
                            <span class="settings-toggle-slider"></span>
                        </label>
                    </div>

                    <div class="settings-form-actions">
                        <button type="button" class="settings-btn secondary" onclick="UserSettingsModal.render()">Hủy</button>
                        <button type="submit" class="settings-btn primary">Lưu thay đổi</button>
                    </div>
                </form>

                <div class="settings-divider"></div>
                
                <h2 class="settings-subtitle">Người dùng bị chặn</h2>
                <p class="settings-text">Những người dùng bị chặn sẽ không thể gửi tin nhắn, lời mời kết bạn hoặc tương tác với bạn.</p>
                
                <div id="blockedUsersContainer" class="settings-blocked-users-container">
                    <div class="settings-loading">
                        <i class="bi bi-arrow-repeat spin"></i>
                        <span>Đang tải...</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Load blocked users list
     */
    async function loadBlockedUsers() {
        const container = document.getElementById('blockedUsersContainer');
        if (!container) return;

        try {
            const response = await fetch('/api/friends/blocked', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load blocked users');
            }

            const blockedUsers = await response.json();
            renderBlockedUsersList(blockedUsers);
        } catch (error) {
            console.error('Error loading blocked users:', error);
            container.innerHTML = `
                <div class="settings-error">
                    <i class="bi bi-exclamation-circle"></i>
                    <span>Không thể tải danh sách người dùng bị chặn</span>
                    <button class="settings-btn secondary" onclick="UserSettingsModal.loadBlockedUsers()">Thử lại</button>
                </div>
            `;
        }
    }

    /**
     * Render blocked users list
     */
    function renderBlockedUsersList(blockedUsers) {
        const container = document.getElementById('blockedUsersContainer');
        if (!container) return;

        if (!blockedUsers || blockedUsers.length === 0) {
            container.innerHTML = `
                <div class="settings-empty-state">
                    <i class="bi bi-person-x"></i>
                    <p>Bạn chưa chặn người dùng nào</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="settings-blocked-list">
                ${blockedUsers.map(user => `
                    <div class="settings-blocked-user" data-user-id="${user.id}">
                        <div class="settings-blocked-user-info">
                            <img src="${user.avatarUrl || '/images/default-avatar.png'}" alt="${user.username}" class="settings-blocked-avatar">
                            <div class="settings-blocked-details">
                                <span class="settings-blocked-name">${user.displayName || user.username}</span>
                                <span class="settings-blocked-tag">${user.username}#${user.discriminator || '0000'}</span>
                            </div>
                        </div>
                        <button class="settings-btn danger" onclick="UserSettingsModal.unblockUser(${user.id}, '${user.username}')" title="Bỏ chặn">
                            <i class="bi bi-person-check"></i>
                            <span>Bỏ chặn</span>
                        </button>
                    </div>
                `).join('')}
            </div>
            <p class="settings-hint" style="margin-top: 16px;">
                <i class="bi bi-info-circle"></i>
                Tổng cộng ${blockedUsers.length} người dùng bị chặn
            </p>
        `;
    }

    /**
     * Unblock a user
     */
    async function unblockUser(userId, username) {
        if (!confirm(`Bạn có chắc muốn bỏ chặn ${username}?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/friends/blocked/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to unblock user');
            }

            // Remove user from the list with animation
            const userElement = document.querySelector(`.settings-blocked-user[data-user-id="${userId}"]`);
            if (userElement) {
                userElement.classList.add('removing');
                setTimeout(() => {
                    userElement.remove();
                    // Check if list is now empty
                    const list = document.querySelector('.settings-blocked-list');
                    if (list && list.children.length === 0) {
                        loadBlockedUsers(); // Re-render empty state
                    } else {
                        // Update count
                        const hint = document.querySelector('#blockedUsersContainer .settings-hint');
                        if (hint) {
                            const count = list ? list.children.length : 0;
                            hint.innerHTML = `<i class="bi bi-info-circle"></i> Tổng cộng ${count} người dùng bị chặn`;
                        }
                    }
                }, 300);
            }

            // Show success notification
            showNotification(`Đã bỏ chặn ${username}`, 'success');
        } catch (error) {
            console.error('Error unblocking user:', error);
            showNotification('Không thể bỏ chặn người dùng', 'error');
        }
    }

    /**
     * Show notification toast
     */
    function showNotification(message, type = 'info') {
        // Use existing notification system if available
        if (window.Notification && window.Notification.show) {
            window.Notification.show(message, type);
            return;
        }

        // Simple fallback notification
        const toast = document.createElement('div');
        toast.className = `settings-toast ${type}`;
        toast.innerHTML = `
            <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Render Appearance tab
     */
    function renderAppearanceTab() {
        return `
            <div class="settings-section">
                <h1 class="settings-title">Giao diện</h1>

                <form id="appearanceForm" onsubmit="UserSettingsModal.saveAppearance(event)">
                    <div class="settings-form-group">
                        <label class="settings-label">Chủ đề</label>
                        <div class="settings-radio-group">
                            <label class="settings-radio">
                                <input type="radio" name="theme" value="DARK" ${currentUser.theme === 'DARK' ? 'checked' : ''}>
                                <div class="settings-radio-card">
                                    <div class="settings-radio-preview theme-dark"></div>
                                    <span>Tối</span>
                                </div>
                            </label>
                            <label class="settings-radio">
                                <input type="radio" name="theme" value="LIGHT" ${currentUser.theme === 'LIGHT' ? 'checked' : ''}>
                                <div class="settings-radio-card">
                                    <div class="settings-radio-preview theme-light"></div>
                                    <span>Sáng</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div class="settings-form-group">
                        <label class="settings-label">Hiển thị tin nhắn</label>
                        <div class="settings-radio-group">
                            <label class="settings-radio">
                                <input type="radio" name="messageDisplay" value="COZY" ${currentUser.messageDisplay === 'COZY' ? 'checked' : ''}>
                                <div class="settings-radio-card">
                                    <span>🛋️ Thoải mái</span>
                                </div>
                            </label>
                            <label class="settings-radio">
                                <input type="radio" name="messageDisplay" value="COMPACT" ${currentUser.messageDisplay === 'COMPACT' ? 'checked' : ''}>
                                <div class="settings-radio-card">
                                    <span>📝 Thu gọn</span>
                                </div>
                            </label>
                        </div>
                        <p class="settings-hint">Chế độ Thoải mái hiển thị avatar và tên người dùng ở mỗi tin nhắn. Chế độ Thu gọn chỉ hiển thị khi có tin nhắn mới.</p>
                    </div>

                    <div class="settings-form-actions">
                        <button type="button" class="settings-btn secondary" onclick="UserSettingsModal.render()">Hủy</button>
                        <button type="submit" class="settings-btn primary">Lưu thay đổi</button>
                    </div>
                </form>
            </div>
        `;
    }

    /**
     * Attach form listeners
     */
    function attachFormListeners() {
        const forms = modalElement.querySelectorAll('input, textarea, select');
        forms.forEach(input => {
            input.addEventListener('change', () => {
                unsavedChanges = true;
            });
        });

        // Bio character counter
        const bioInput = document.getElementById('bio');
        if (bioInput) {
            bioInput.addEventListener('input', function() {
                const hint = this.closest('.settings-form-group').querySelector('.settings-hint');
                if (hint) {
                    hint.textContent = `${this.value.length}/190 ký tự`;
                }
            });
        }

        // Load blocked users if on privacy tab
        if (activeTab === 'privacy') {
            loadBlockedUsers();
        }
    }

    /**
     * Save account settings
     */
    async function saveAccount(event) {
        event.preventDefault();
        
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;

        try {
            const response = await fetch('/api/users/me/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ username, email })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save settings');
            }

            currentUser = await response.json();
            unsavedChanges = false;
            alert('Đã lưu thay đổi');
            render();

            // Update user panel if exists
            if (window.UserPanel) {
                window.UserPanel.update(currentUser);
            }
        } catch (error) {
            console.error('Error saving account:', error);
            alert(error.message || 'Không thể lưu thay đổi');
        }
    }

    /**
     * Save profile settings
     */
    async function saveProfile(event) {
        event.preventDefault();
        
        const displayName = document.getElementById('displayName').value;
        const pronouns = document.getElementById('pronouns').value;
        const bio = document.getElementById('bio').value;

        try {
            const response = await fetch('/api/users/me/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ displayName, pronouns, bio })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save profile');
            }

            currentUser = await response.json();
            unsavedChanges = false;
            alert('Đã lưu thay đổi');
            render();

            // Update user panel if exists
            if (window.UserPanel) {
                window.UserPanel.update(currentUser);
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            alert(error.message || 'Không thể lưu thay đổi');
        }
    }

    /**
     * Save privacy settings
     */
    async function savePrivacy(event) {
        event.preventDefault();
        
        const allowFriendRequests = document.getElementById('allowFriendRequests').checked;
        const allowDirectMessages = document.getElementById('allowDirectMessages').checked;

        try {
            const response = await fetch('/api/users/me/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ allowFriendRequests, allowDirectMessages })
            });

            if (!response.ok) {
                throw new Error('Failed to save privacy settings');
            }

            currentUser = await response.json();
            unsavedChanges = false;
            alert('Đã lưu thay đổi');
            render();
        } catch (error) {
            console.error('Error saving privacy:', error);
            alert('Không thể lưu thay đổi');
        }
    }

    /**
     * Save appearance settings
     */
    async function saveAppearance(event) {
        event.preventDefault();
        
        const theme = document.querySelector('input[name="theme"]:checked').value;
        const messageDisplay = document.querySelector('input[name="messageDisplay"]:checked').value;

        try {
            const response = await fetch('/api/users/me/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ theme, messageDisplay })
            });

            if (!response.ok) {
                throw new Error('Failed to save appearance settings');
            }

            currentUser = await response.json();
            unsavedChanges = false;
            alert('Đã lưu thay đổi. Làm mới trang để áp dụng thay đổi.');
            render();
        } catch (error) {
            console.error('Error saving appearance:', error);
            alert('Không thể lưu thay đổi');
        }
    }

    /**
     * Upload avatar
     */
    async function uploadAvatar(input) {
        const file = input.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await fetch('/api/users/me/avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to upload avatar');
            }

            const data = await response.json();
            currentUser.avatarUrl = data.avatarUrl;
            alert('Đã tải lên avatar');
            render();

            // Update user panel if exists
            if (window.UserPanel) {
                window.UserPanel.update(currentUser);
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert(error.message || 'Không thể tải lên avatar');
        }

        input.value = '';
    }

    /**
     * Upload banner
     */
    async function uploadBanner(input) {
        const file = input.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('banner', file);

        try {
            const response = await fetch('/api/users/me/banner', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to upload banner');
            }

            const data = await response.json();
            currentUser.bannerUrl = data.bannerUrl;
            alert('Đã tải lên banner');
            render();
        } catch (error) {
            console.error('Error uploading banner:', error);
            alert(error.message || 'Không thể tải lên banner');
        }

        input.value = '';
    }

    /**
     * Change password
     */
    function changePassword() {
        window.location.href = '/change-password';
    }

    /**
     * Logout
     */
    function logout() {
        if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
    }

    /**
     * Attach event listeners
     */
    function attachEventListeners() {
        // Handle escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modalElement.style.display === 'flex') {
                hide();
            }
        });
    }

    // Public API
    return {
        init,
        show,
        hide,
        switchTab,
        render,
        saveAccount,
        saveProfile,
        savePrivacy,
        saveAppearance,
        uploadAvatar,
        uploadBanner,
        changePassword,
        loadBlockedUsers,
        unblockUser,
        logout
    };
})();

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', UserSettingsModal.init);
} else {
    UserSettingsModal.init();
}

// Export to window
window.UserSettingsModal = UserSettingsModal;
