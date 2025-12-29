/**
 * User Profile Modal Component
 * Displays full user profile with banner, avatar, bio, roles, mutual servers, and action buttons
 */
const UserProfileModal = (function() {
    'use strict';

    let currentUser = null;
    let viewingUser = null;
    let modalElement = null;

    /**
     * Initialize the profile modal
     */
    function init() {
        createModalElement();
        attachEventListeners();
    }

    /**
     * Create modal DOM element
     */
    function createModalElement() {
        if (document.getElementById('userProfileModal')) {
            modalElement = document.getElementById('userProfileModal');
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'userProfileModal';
        modal.className = 'profile-modal-overlay';
        modal.style.display = 'none';
        document.body.appendChild(modal);
        modalElement = modal;
    }

    /**
     * Show profile modal for a specific user
     * @param {number} userId - User ID to display
     */
    async function show(userId) {
        try {
            // Fetch user profile data
            const response = await fetch(`/api/users/${userId}/profile`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load user profile');
            }

            viewingUser = await response.json();
            
            // Fetch current user if not already loaded
            if (!currentUser) {
                const meResponse = await fetch('/api/users/me/profile', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (meResponse.ok) {
                    currentUser = await meResponse.json();
                }
            }

            render();
            modalElement.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        } catch (error) {
            console.error('Error loading profile:', error);
            alert('Không thể tải hồ sơ người dùng');
        }
    }

    /**
     * Hide the modal
     */
    function hide() {
        modalElement.style.display = 'none';
        document.body.style.overflow = '';
        viewingUser = null;
    }

    /**
     * Render the modal content
     */
    function render() {
        if (!viewingUser) return;

        const isOwnProfile = currentUser && currentUser.id === viewingUser.id;
        const bannerUrl = viewingUser.bannerUrl || '/images/default-banner.jpg';
        const avatarUrl = viewingUser.avatarUrl || '/images/default-avatar.png';
        
        modalElement.innerHTML = `
            <div class="profile-modal-backdrop" onclick="UserProfileModal.hide()"></div>
            <div class="profile-modal-content">
                <button class="profile-modal-close" onclick="UserProfileModal.hide()">
                    <i class="bi bi-x-lg"></i>
                </button>
                
                <!-- Banner -->
                <div class="profile-banner" style="background-image: url('${bannerUrl}')">
                    ${viewingUser.status ? `<div class="profile-badge-container">
                        <span class="profile-status-badge status-${viewingUser.status.toLowerCase()}">${getStatusLabel(viewingUser.status)}</span>
                    </div>` : ''}
                </div>

                <!-- Profile Info -->
                <div class="profile-info-section">
                    <div class="profile-avatar-container">
                        <img src="${avatarUrl}" alt="${viewingUser.username}" class="profile-avatar">
                        <span class="profile-status-indicator status-${viewingUser.status ? viewingUser.status.toLowerCase() : 'offline'}"></span>
                    </div>

                    <!-- User Info -->
                    <div class="profile-user-info">
                        <div class="profile-username-section">
                            <h2 class="profile-username">${viewingUser.displayName || viewingUser.username}</h2>
                            <span class="profile-discriminator">#${viewingUser.discriminator}</span>
                            ${viewingUser.pronouns ? `<span class="profile-pronouns">${viewingUser.pronouns}</span>` : ''}
                        </div>

                        ${viewingUser.customStatus || viewingUser.customStatusEmoji ? `
                            <div class="profile-custom-status">
                                ${viewingUser.customStatusEmoji || ''} ${viewingUser.customStatus || ''}
                            </div>
                        ` : ''}

                        <!-- Badges -->
                        ${viewingUser.badges && viewingUser.badges.length > 0 ? `
                            <div class="profile-badges">
                                ${viewingUser.badges.map(badge => `<span class="profile-badge badge-${badge.toLowerCase()}" title="${badge}">${getBadgeIcon(badge)}</span>`).join('')}
                            </div>
                        ` : ''}

                        <!-- Action Buttons -->
                        ${!isOwnProfile ? `
                            <div class="profile-actions">
                                <button class="profile-action-btn primary" onclick="UserProfileModal.sendMessage(${viewingUser.id})">
                                    <i class="bi bi-chat-fill"></i> Nhắn tin
                                </button>
                                <button class="profile-action-btn secondary" onclick="UserProfileModal.addFriend(${viewingUser.id})">
                                    <i class="bi bi-person-plus-fill"></i> Kết bạn
                                </button>
                                <button class="profile-action-btn danger" onclick="UserProfileModal.blockUser(${viewingUser.id})">
                                    <i class="bi bi-slash-circle"></i> Chặn
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Profile Details -->
                <div class="profile-details">
                    ${viewingUser.bio ? `
                        <div class="profile-section">
                            <h3 class="profile-section-title">VỀ TÔI</h3>
                            <p class="profile-bio">${escapeHtml(viewingUser.bio)}</p>
                        </div>
                    ` : ''}

                    <!-- Mutual Servers -->
                    <div class="profile-section">
                        <h3 class="profile-section-title">MÁY CHỦ CHUNG ${viewingUser.mutualServers ? `(${viewingUser.mutualServers.length})` : ''}</h3>
                        <div class="profile-mutual-servers" id="mutualServers">
                            <div class="loading-spinner">Đang tải...</div>
                        </div>
                    </div>

                    <!-- Private Note -->
                    ${!isOwnProfile ? `
                        <div class="profile-section">
                            <h3 class="profile-section-title">GHI CHÚ</h3>
                            <textarea 
                                class="profile-note-input" 
                                placeholder="Nhấp để thêm ghi chú"
                                maxlength="256"
                                id="userNote"
                            >${viewingUser.note || ''}</textarea>
                            <button class="profile-note-save" onclick="UserProfileModal.saveNote()">Lưu ghi chú</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Load mutual servers
        loadMutualServers();
    }

    /**
     * Load mutual servers
     */
    async function loadMutualServers() {
        if (!viewingUser) return;

        try {
            const response = await fetch(`/api/users/${viewingUser.id}/mutual-servers`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load mutual servers');
            }

            const servers = await response.json();
            const container = document.getElementById('mutualServers');
            
            if (servers.length === 0) {
                container.innerHTML = '<p class="profile-no-data">Không có máy chủ chung</p>';
                return;
            }

            container.innerHTML = servers.map(server => `
                <div class="profile-mutual-server">
                    <img src="${server.iconUrl || '/images/default-server.png'}" alt="${server.name}" class="mutual-server-icon">
                    <div class="mutual-server-info">
                        <div class="mutual-server-name">${escapeHtml(server.name)}</div>
                        <div class="mutual-server-members">${server.memberCount || 0} thành viên</div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading mutual servers:', error);
            const container = document.getElementById('mutualServers');
            container.innerHTML = '<p class="profile-error">Không thể tải máy chủ chung</p>';
        }
    }

    /**
     * Save user note
     */
    async function saveNote() {
        if (!viewingUser) return;

        const noteInput = document.getElementById('userNote');
        const note = noteInput.value.trim();

        try {
            const response = await fetch(`/api/users/${viewingUser.id}/note`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ note: note || null })
            });

            if (!response.ok) {
                throw new Error('Failed to save note');
            }

            alert('Đã lưu ghi chú');
        } catch (error) {
            console.error('Error saving note:', error);
            alert('Không thể lưu ghi chú');
        }
    }

    /**
     * Send message to user
     */
    function sendMessage(userId) {
        // Redirect to messages page with user
        window.location.href = `/messages?user=${userId}`;
    }

    /**
     * Add friend
     */
    async function addFriend(userId) {
        try {
            const response = await fetch('/api/friends/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ receiverId: userId })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to send friend request');
            }

            alert('Đã gửi lời mời kết bạn');
        } catch (error) {
            console.error('Error sending friend request:', error);
            alert(error.message || 'Không thể gửi lời mời kết bạn');
        }
    }

    /**
     * Block user
     */
    async function blockUser(userId) {
        if (!confirm('Bạn có chắc chắn muốn chặn người dùng này?')) {
            return;
        }

        try {
            const response = await fetch(`/api/friends/${userId}/block`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to block user');
            }

            alert('Đã chặn người dùng');
            hide();
        } catch (error) {
            console.error('Error blocking user:', error);
            alert('Không thể chặn người dùng');
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

    /**
     * Get status label
     */
    function getStatusLabel(status) {
        const labels = {
            'ONLINE': 'Trực tuyến',
            'IDLE': 'Vắng mặt',
            'DO_NOT_DISTURB': 'Không làm phiền',
            'OFFLINE': 'Ngoại tuyến',
            'INVISIBLE': 'Ẩn'
        };
        return labels[status] || status;
    }

    /**
     * Get badge icon
     */
    function getBadgeIcon(badge) {
        const icons = {
            'STAFF': '🛡️',
            'PARTNER': '🤝',
            'VERIFIED': '✓',
            'EARLY_SUPPORTER': '⭐',
            'BUG_HUNTER': '🐛',
            'DEVELOPER': '💻'
        };
        return icons[badge] || '🏅';
    }

    /**
     * Escape HTML
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Public API
    return {
        init,
        show,
        hide,
        saveNote,
        sendMessage,
        addFriend,
        blockUser
    };
})();

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', UserProfileModal.init);
} else {
    UserProfileModal.init();
}

// Export to window
window.UserProfileModal = UserProfileModal;
