/**
 * Invite Modal Manager
 * Handles UI for inviting friends to the current server
 */

(function (window) {
    'use strict';

    class InviteModalManager {
        constructor() {
            this.currentServerId = null;
            this.friends = [];
            this.modal = null;
            this.isSending = false;
        }

        /**
         * Open the invite modal for a specific server
         * @param {number|string} serverId 
         * @param {string} serverName 
         */
        async openModal(serverId, serverName) {
            this.currentServerId = serverId;
            this._createModal(serverName);
            await this._fetchFriends();
        }

        _createModal(serverName) {
            // Remove existing modal if any
            if (this.modal) {
                this.modal.remove();
            }

            const modalHtml = `
                <div class="invite-modal-backdrop">
                    <div class="invite-modal-container">
                        <div class="invite-modal-header">
                            <div>
                                <h3>Mời bạn bè vào ${serverName}</h3>
                                <p class="invite-subtitle"># ${serverName}</p>
                            </div>
                            <button class="btn-close-modal"><i class="bi bi-x-lg"></i></button>
                        </div>
                        
                        <div class="invite-search-container">
                            <input type="text" id="inviteSearchInput" placeholder="Tìm kiếm bạn bè" autocomplete="off">
                            <i class="bi bi-search"></i>
                        </div>

                        <div class="invite-friends-list" id="inviteFriendsList">
                            <div class="invite-loading">
                                <span class="spinner"></span> Đang tải danh sách bạn bè...
                            </div>
                        </div>

                        <div class="invite-modal-footer">
                            <div class="invite-link-container">
                                <span class="invite-link-label">HOẶC GỬI LIÊN KẾT MỜI SERVER</span>
                                <div class="invite-link-box">
                                    <input type="text" id="serverInviteLink" readonly value="Đang tạo link...">
                                    <button class="btn-copy-link">Sao chép</button>
                                </div>
                                <span class="invite-link-note">Link mời của bạn sẽ hết hạn sau 7 ngày. <a href="#">Chỉnh sửa link mời</a>.</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);
            this.modal = document.querySelector('.invite-modal-backdrop');

            // Add styles dynamically
            this._ensureStyles();

            // Event listeners
            this.modal.querySelector('.btn-close-modal').addEventListener('click', () => this.closeModal());
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.closeModal();
            });

            const searchInput = this.modal.querySelector('#inviteSearchInput');
            searchInput.addEventListener('input', (e) => this._filterFriends(e.target.value));

            // Focus search
            setTimeout(() => searchInput.focus(), 100);

            // Fetch invite link (optional enhancement)
            this._fetchInviteLink(this.currentServerId);
        }

        closeModal() {
            if (this.modal) {
                this.modal.classList.add('closing');
                setTimeout(() => {
                    this.modal.remove();
                    this.modal = null;
                }, 200);
            }
        }

        async _fetchFriends() {
            const listContainer = this.modal.querySelector('#inviteFriendsList');
            try {
                const res = await fetch(`/api/friends/not-in-server/${this.currentServerId}`, {
                    headers: {
                        'Authorization': `Bearer ${this._getToken()}`
                    }
                });

                if (res.ok) {
                    this.friends = await res.json();
                    this._renderFriends(this.friends);
                } else {
                    listContainer.innerHTML = '<div class="invite-error">Không thể tải danh sách bạn bè</div>';
                }
            } catch (e) {
                console.error(e);
                listContainer.innerHTML = '<div class="invite-error">Lỗi kết nối</div>';
            }
        }

        _renderFriends(friends) {
            const listContainer = this.modal.querySelector('#inviteFriendsList');

            if (friends.length === 0) {
                listContainer.innerHTML = `
                    <div class="invite-empty-state">
                        <i class="bi bi-people"></i>
                        <p>Không tìm thấy bạn bè nào chưa tham gia server này.</p>
                    </div>
                `;
                return;
            }

            let html = '';
            friends.forEach(friend => {
                html += `
                    <div class="invite-friend-item">
                        <div class="friend-info">
                            <img src="${friend.avatarUrl || '/images/default-avatar.png'}" alt="avatar">
                            <div class="friend-names">
                                <span class="friend-display-name">${friend.displayName}</span>
                                <span class="friend-username">${friend.username}</span>
                            </div>
                        </div>
                        <button class="btn-invite" data-id="${friend.id}">Mời</button>
                    </div>
                `;
            });

            listContainer.innerHTML = html;

            // Bind invite buttons
            listContainer.querySelectorAll('.btn-invite').forEach(btn => {
                btn.addEventListener('click', (e) => this._sendInvite(e.target, e.target.dataset.id));
            });
        }

        _filterFriends(query) {
            const lowerQuery = query.toLowerCase();
            const filtered = this.friends.filter(f =>
                f.username.toLowerCase().includes(lowerQuery) ||
                f.displayName.toLowerCase().includes(lowerQuery)
            );
            this._renderFriends(filtered);
        }

        async _sendInvite(btn, friendId) {
            if (btn.classList.contains('sent')) return;

            const originalText = btn.textContent;
            btn.textContent = '...';
            btn.disabled = true;

            try {
                // Get or create invite code first (handled by backend or we need to pass it)
                // The backend endpoint /api/invites/send expects specific payload

                // Note: The backend logic in InviteNotificationController handles invite code generation if null.
                // So we don't need to generate it here.

                const payload = {
                    recipientId: friendId,
                    serverId: Number(this.currentServerId)
                };
                console.log('[INVITE DEBUG] Sending invite from modal:', JSON.stringify(payload));

                const res = await fetch('/api/invites/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this._getToken()}`
                    },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    btn.textContent = 'Đã gửi';
                    btn.classList.add('sent');
                    btn.classList.remove('btn-invite');
                    btn.classList.add('btn-invite-sent');
                } else {
                    const error = await res.json();
                    btn.textContent = 'Lỗi';
                    btn.disabled = false;
                    console.error('Invite error:', error);
                    // Show toast?
                }
            } catch (e) {
                console.error(e);
                btn.textContent = 'Lỗi';
                btn.disabled = false;
            }
        }

        async _fetchInviteLink(serverId) {
            // Placeholder: Assume checking existing invites or generating one via another API
            // For now, we'll leave it as "Generating..." or implement if needed.
            // But the prompt focused on "Direct Invite" to friends. 
            // So this is just UI polish.
        }

        _getToken() {
            return localStorage.getItem('accessToken') || '';
        }

        _ensureStyles() {
            if (document.getElementById('invite-modal-styles')) return;

            const style = document.createElement('style');
            style.id = 'invite-modal-styles';
            style.textContent = `
                .invite-modal-backdrop {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    opacity: 0;
                    animation: fadeIn 0.2s forwards;
                }
                @keyframes fadeIn { to { opacity: 1; } }
                
                .invite-modal-container {
                    background: #313338;
                    width: 440px;
                    max-height: 80vh;
                    border-radius: 4px;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 0 0 1px rgba(32,34,37,.6), 0 2px 10px 0 rgba(0,0,0,.2);
                    transform: scale(0.9);
                    animation: scaleIn 0.2s forwards;
                }
                @keyframes scaleIn { to { transform: scale(1); } }

                .invite-modal-header {
                    padding: 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }
                .invite-modal-header h3 {
                    color: #fff;
                    font-size: 16px;
                    font-weight: 600;
                    margin: 0;
                    text-transform: uppercase;
                }
                .invite-subtitle {
                    color: #b5bac1;
                    font-size: 12px;
                    margin-top: 8px;
                }
                .btn-close-modal {
                    background: none;
                    border: none;
                    color: #b5bac1;
                    cursor: pointer;
                    font-size: 20px;
                }
                .btn-close-modal:hover { color: #dbdee1; }

                .invite-search-container {
                    padding: 0 16px 16px;
                    position: relative;
                    border-bottom: 1px solid #1e1f22;
                }
                #inviteSearchInput {
                    width: 100%;
                    background: #1e1f22;
                    border: 1px solid #1e1f22;
                    border-radius: 4px;
                    padding: 8px 32px 8px 8px;
                    color: #dbdee1;
                    font-size: 14px;
                }
                #inviteSearchInput:focus {
                    outline: none;
                }
                .invite-search-container i {
                    position: absolute;
                    right: 24px;
                    top: 8px;
                    color: #b5bac1;
                }

                .invite-friends-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 8px 0;
                    min-height: 200px;
                }
                .invite-friend-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 16px;
                    cursor: pointer;
                }
                .invite-friend-item:hover {
                    background: rgba(78, 80, 88, 0.3);
                }
                .friend-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .friend-info img {
                    width: 32px; height: 32px;
                    border-radius: 50%;
                }
                .friend-names {
                    display: flex;
                    flex-direction: column;
                }
                .friend-display-name {
                    color: #f2f3f5;
                    font-weight: 500;
                    font-size: 14px;
                }
                .friend-username {
                    color: #b5bac1;
                    font-size: 12px;
                }

                .btn-invite {
                    background: none;
                    border: 1px solid #248046;
                    color: #248046;
                    padding: 4px 16px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    transition: all 0.2s;
                    min-width: 60px;
                }
                .btn-invite:hover {
                    background: #248046;
                    color: #fff;
                }
                .btn-invite-sent {
                    background: none;
                    border: 1px solid #b5bac1;
                    color: #b5bac1;
                    cursor: default;
                    padding: 4px 16px;
                    border-radius: 3px;
                    font-size: 12px;
                }

                .invite-modal-footer {
                    padding: 16px;
                    background: #2b2d31;
                    border-radius: 0 0 4px 4px;
                }
                .invite-link-label {
                    color: #b5bac1;
                    font-size: 12px;
                    font-weight: 700;
                    margin-bottom: 8px;
                    display: block;
                }
                .invite-link-box {
                    display: flex;
                    background: #1e1f22;
                    border-radius: 3px;
                    padding: 2px;
                    margin-bottom: 8px;
                }
                #serverInviteLink {
                    flex: 1;
                    background: none;
                    border: none;
                    color: #dbdee1;
                    padding: 8px;
                    font-size: 14px;
                }
                .btn-copy-link {
                    background: #5865f2;
                    color: #fff;
                    border: none;
                    padding: 4px 16px;
                    border-radius: 3px;
                    cursor: pointer;
                    margin: 4px;
                }
                .invite-link-note {
                    color: #949ba4;
                    font-size: 12px;
                }
                .invite-link-note a { color: #00a8fc; text-decoration: none; }

                /* Scrollbar */
                .invite-friends-list::-webkit-scrollbar { width: 8px; }
                .invite-friends-list::-webkit-scrollbar-track { background: #2b2d31; }
                .invite-friends-list::-webkit-scrollbar-thumb { background: #1a1b1e; border-radius: 4px; }
            `;
            document.head.appendChild(style);
        }
    }

    // Export globally
    window.InviteModalManager = new InviteModalManager();

})(window);
