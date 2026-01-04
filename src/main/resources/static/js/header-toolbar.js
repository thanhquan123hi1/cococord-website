/**
 * HeaderToolbar - Chat Header Controls & Panel Management
 * 
 * Features:
 * - Member list toggle (show/hide members sidebar)
 * - Threads sidebar (slide from right)
 * - Pinned messages popup
 * - Notification toggle (mute/unmute)
 * - Help modal
 * - Channel sidebar context menu (create category)
 */

(function(window) {
    'use strict';

    // ==================== HeaderToolbar CLASS ====================
    class HeaderToolbar {
        constructor(options = {}) {
            // Main container
            this.chatApp = document.getElementById('chatApp');
            
            // Header buttons
            this.membersToggleBtn = document.getElementById('membersToggleBtn');
            this.threadBtn = document.getElementById('threadBtn');
            this.pinBtn = document.getElementById('pinBtn');
            this.notifyBtn = document.getElementById('notifyBtn');
            this.helpBtn = document.getElementById('helpBtn');
            
            // Sidebars
            this.membersSidebar = document.getElementById('membersSidebar');
            this.channelSidebar = document.querySelector('.channel-sidebar');
            
            // State
            this.isMembersVisible = true;
            this.isChannelMuted = false;
            this.threadsOverlay = null;
            this.pinnedPopup = null;
            this.helpModal = null;
            this.channelContextMenu = null;
            
            // Callbacks
            this.onLoadThreads = options.onLoadThreads || null;
            this.onLoadPinnedMessages = options.onLoadPinnedMessages || null;
            this.onToggleMute = options.onToggleMute || null;
            this.onCreateCategory = options.onCreateCategory || null;
            
            // Initialize
            this._init();
        }

        _init() {
            this._createThreadsOverlay();
            this._createPinnedPopup();
            this._createHelpModal();
            this._createChannelContextMenu();
            this._bindEvents();
            
            console.log('[HeaderToolbar] Initialized');
        }

        // ==================== MEMBER LIST TOGGLE ====================
        
        toggleMembersList() {
            this.isMembersVisible = !this.isMembersVisible;
            
            if (this.isMembersVisible) {
                this.chatApp.classList.remove('members-hidden');
                this.membersToggleBtn?.classList.add('active');
            } else {
                this.chatApp.classList.add('members-hidden');
                this.membersToggleBtn?.classList.remove('active');
            }
            
            // Save preference
            localStorage.setItem('cococord_members_visible', this.isMembersVisible);
        }

        // ==================== THREADS SIDEBAR ====================
        
        _createThreadsOverlay() {
            // Backdrop
            this.threadsBackdrop = document.createElement('div');
            this.threadsBackdrop.className = 'threads-overlay-backdrop';
            document.body.appendChild(this.threadsBackdrop);
            
            // Overlay panel
            this.threadsOverlay = document.createElement('div');
            this.threadsOverlay.className = 'threads-overlay';
            this.threadsOverlay.innerHTML = `
                <div class="threads-header">
                    <h3><i class="bi bi-chat-square-text"></i> Threads</h3>
                    <button class="threads-close-btn" title="Đóng">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
                <div class="threads-content" id="threadsContent">
                    <div class="threads-empty">
                        <i class="bi bi-chat-square-text"></i>
                        <h4>Chưa có thread nào</h4>
                        <p>Các cuộc trò chuyện thread sẽ xuất hiện ở đây</p>
                    </div>
                </div>
            `;
            document.body.appendChild(this.threadsOverlay);
        }

        showThreadsOverlay() {
            this.threadsBackdrop.classList.add('show');
            this.threadsOverlay.classList.add('show');
            this.threadBtn?.classList.add('active');
            
            // Load threads if callback provided
            if (this.onLoadThreads) {
                this._loadThreads();
            }
        }

        hideThreadsOverlay() {
            this.threadsBackdrop.classList.remove('show');
            this.threadsOverlay.classList.remove('show');
            this.threadBtn?.classList.remove('active');
        }

        async _loadThreads() {
            const content = this.threadsOverlay.querySelector('#threadsContent');
            content.innerHTML = '<div class="threads-loading" style="text-align:center;padding:20px;color:var(--text-muted)"><i class="bi bi-arrow-repeat spin"></i> Đang tải...</div>';
            
            try {
                const threads = await this.onLoadThreads();
                
                if (!threads || threads.length === 0) {
                    content.innerHTML = `
                        <div class="threads-empty">
                            <i class="bi bi-chat-square-text"></i>
                            <h4>Chưa có thread nào</h4>
                            <p>Các cuộc trò chuyện thread sẽ xuất hiện ở đây</p>
                        </div>
                    `;
                    return;
                }
                
                content.innerHTML = threads.map(thread => `
                    <div class="thread-item" data-thread-id="${thread.id}">
                        <div class="thread-item-header">
                            <span class="thread-item-title">${this._escapeHtml(thread.name)}</span>
                            <span class="thread-item-count">${thread.messageCount || 0} tin nhắn</span>
                        </div>
                        <div class="thread-item-preview">${this._escapeHtml(thread.lastMessage || '')}</div>
                    </div>
                `).join('');
            } catch (error) {
                console.error('[HeaderToolbar] Failed to load threads:', error);
                content.innerHTML = `
                    <div class="threads-empty">
                        <i class="bi bi-exclamation-triangle"></i>
                        <h4>Không thể tải threads</h4>
                        <p>${error.message || 'Vui lòng thử lại sau'}</p>
                    </div>
                `;
            }
        }

        // ==================== PINNED MESSAGES POPUP ====================
        
        _createPinnedPopup() {
            this.pinnedPopup = document.createElement('div');
            this.pinnedPopup.className = 'pinned-popup';
            this.pinnedPopup.style.display = 'none';
            this.pinnedPopup.innerHTML = `
                <div class="pinned-header">
                    <h3><i class="bi bi-pin-angle-fill"></i> Tin nhắn đã ghim</h3>
                    <button class="pinned-close-btn" title="Đóng">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
                <div class="pinned-content" id="pinnedContent">
                    <div class="pinned-empty">
                        <i class="bi bi-pin-angle"></i>
                        <h4>Chưa có tin nhắn ghim</h4>
                        <p>Nhấp chuột phải vào tin nhắn để ghim</p>
                    </div>
                </div>
            `;
            
            // Append to main content area for proper positioning
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.appendChild(this.pinnedPopup);
            } else {
                document.body.appendChild(this.pinnedPopup);
            }
        }

        togglePinnedPopup() {
            const isVisible = this.pinnedPopup.style.display !== 'none';
            
            if (isVisible) {
                this.hidePinnedPopup();
            } else {
                this.showPinnedPopup();
            }
        }

        showPinnedPopup() {
            this.pinnedPopup.style.display = 'flex';
            this.pinBtn?.classList.add('active');
            
            // Load pinned messages if callback provided
            if (this.onLoadPinnedMessages) {
                this._loadPinnedMessages();
            }
        }

        hidePinnedPopup() {
            this.pinnedPopup.style.display = 'none';
            this.pinBtn?.classList.remove('active');
        }

        async _loadPinnedMessages() {
            const content = this.pinnedPopup.querySelector('#pinnedContent');
            content.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted)"><i class="bi bi-arrow-repeat spin"></i> Đang tải...</div>';
            
            try {
                const messages = await this.onLoadPinnedMessages();
                
                if (!messages || messages.length === 0) {
                    content.innerHTML = `
                        <div class="pinned-empty">
                            <i class="bi bi-pin-angle"></i>
                            <h4>Chưa có tin nhắn ghim</h4>
                            <p>Nhấp chuột phải vào tin nhắn để ghim</p>
                        </div>
                    `;
                    return;
                }
                
                content.innerHTML = messages.map(msg => `
                    <div class="pinned-message" data-message-id="${msg.id}">
                        <div class="pinned-message-header">
                            <div class="pinned-message-avatar">
                                ${msg.avatarUrl 
                                    ? `<img src="${this._escapeHtml(msg.avatarUrl)}" alt="">` 
                                    : (msg.displayName || msg.username || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span class="pinned-message-author">${this._escapeHtml(msg.displayName || msg.username)}</span>
                            <span class="pinned-message-time">${this._formatTime(msg.createdAt)}</span>
                        </div>
                        <div class="pinned-message-content">${this._escapeHtml(msg.content)}</div>
                        <div class="pinned-message-jump">Nhảy đến tin nhắn</div>
                    </div>
                `).join('');
            } catch (error) {
                console.error('[HeaderToolbar] Failed to load pinned messages:', error);
                content.innerHTML = `
                    <div class="pinned-empty">
                        <i class="bi bi-exclamation-triangle"></i>
                        <h4>Không thể tải tin nhắn ghim</h4>
                        <p>${error.message || 'Vui lòng thử lại sau'}</p>
                    </div>
                `;
            }
        }

        // ==================== NOTIFICATION TOGGLE ====================
        
        toggleChannelNotification() {
            this.isChannelMuted = !this.isChannelMuted;
            
            if (this.isChannelMuted) {
                this.notifyBtn?.classList.add('muted');
                this.notifyBtn.querySelector('i')?.classList.replace('bi-bell', 'bi-bell-slash');
                this.notifyBtn.title = 'Bật thông báo';
            } else {
                this.notifyBtn?.classList.remove('muted');
                this.notifyBtn.querySelector('i')?.classList.replace('bi-bell-slash', 'bi-bell');
                this.notifyBtn.title = 'Tắt thông báo';
            }
            
            // Callback
            if (this.onToggleMute) {
                this.onToggleMute(this.isChannelMuted);
            }
            
            // Show toast
            this._showToast(this.isChannelMuted ? 'Đã tắt thông báo kênh' : 'Đã bật thông báo kênh');
        }

        // ==================== HELP MODAL ====================
        
        _createHelpModal() {
            this.helpModalOverlay = document.createElement('div');
            this.helpModalOverlay.className = 'help-modal-overlay';
            this.helpModalOverlay.innerHTML = `
                <div class="help-modal">
                    <div class="help-modal-header">
                        <h3><i class="bi bi-question-circle"></i> Trợ giúp</h3>
                        <button class="help-modal-close" title="Đóng">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
                    <div class="help-modal-body">
                        <p>Bạn cần hỗ trợ? Chúng tôi luôn sẵn sàng giúp đỡ!</p>
                        <div class="help-links">
                            <a href="/support" class="help-link" target="_blank">
                                <i class="bi bi-headset"></i>
                                <span>Trung tâm hỗ trợ</span>
                            </a>
                            <a href="/docs" class="help-link" target="_blank">
                                <i class="bi bi-book"></i>
                                <span>Tài liệu hướng dẫn</span>
                            </a>
                            <a href="/feedback" class="help-link" target="_blank">
                                <i class="bi bi-chat-dots"></i>
                                <span>Gửi phản hồi</span>
                            </a>
                            <a href="https://discord.gg/cococord" class="help-link" target="_blank">
                                <i class="bi bi-discord"></i>
                                <span>Tham gia Discord cộng đồng</span>
                            </a>
                        </div>
                    </div>
                    <div class="help-modal-footer">
                        <button class="btn-primary help-modal-done">Đã hiểu</button>
                    </div>
                </div>
            `;
            document.body.appendChild(this.helpModalOverlay);
        }

        showHelpModal() {
            this.helpModalOverlay.classList.add('show');
            this.helpBtn?.classList.add('active');
        }

        hideHelpModal() {
            this.helpModalOverlay.classList.remove('show');
            this.helpBtn?.classList.remove('active');
        }

        // ==================== CHANNEL CONTEXT MENU ====================
        
        _createChannelContextMenu() {
            this.channelContextMenu = document.createElement('div');
            this.channelContextMenu.className = 'channel-context-menu';
            this.channelContextMenu.style.display = 'none';
            this.channelContextMenu.innerHTML = `
                <div class="context-item" data-action="create-channel">
                    <i class="bi bi-hash"></i>
                    <span>Tạo Kênh</span>
                </div>
                <div class="context-item" data-action="create-category">
                    <i class="bi bi-folder-plus"></i>
                    <span>Tạo Danh mục</span>
                </div>
                <div class="context-divider"></div>
                <div class="context-item" data-action="invite">
                    <i class="bi bi-person-plus"></i>
                    <span>Mời mọi người</span>
                </div>
                <div class="context-item" data-action="server-settings">
                    <i class="bi bi-gear"></i>
                    <span>Cài đặt Server</span>
                </div>
            `;
            document.body.appendChild(this.channelContextMenu);
        }

        showChannelContextMenu(x, y) {
            this.channelContextMenu.style.display = 'block';
            
            // Position the menu
            const menuRect = this.channelContextMenu.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Adjust position if menu goes off screen
            if (x + menuRect.width > viewportWidth) {
                x = viewportWidth - menuRect.width - 10;
            }
            if (y + menuRect.height > viewportHeight) {
                y = viewportHeight - menuRect.height - 10;
            }
            
            this.channelContextMenu.style.left = x + 'px';
            this.channelContextMenu.style.top = y + 'px';
        }

        hideChannelContextMenu() {
            this.channelContextMenu.style.display = 'none';
        }

        // ==================== EVENT BINDING ====================
        
        _bindEvents() {
            // Member list toggle
            this.membersToggleBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMembersList();
            });
            
            // Threads button
            this.threadBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showThreadsOverlay();
            });
            
            // Threads overlay close
            this.threadsOverlay?.querySelector('.threads-close-btn')?.addEventListener('click', () => {
                this.hideThreadsOverlay();
            });
            this.threadsBackdrop?.addEventListener('click', () => {
                this.hideThreadsOverlay();
            });
            
            // Pin button
            this.pinBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePinnedPopup();
            });
            
            // Pinned popup close
            this.pinnedPopup?.querySelector('.pinned-close-btn')?.addEventListener('click', () => {
                this.hidePinnedPopup();
            });
            
            // Notification button
            this.notifyBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleChannelNotification();
            });
            
            // Help button
            this.helpBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showHelpModal();
            });
            
            // Help modal close
            this.helpModalOverlay?.querySelector('.help-modal-close')?.addEventListener('click', () => {
                this.hideHelpModal();
            });
            this.helpModalOverlay?.querySelector('.help-modal-done')?.addEventListener('click', () => {
                this.hideHelpModal();
            });
            this.helpModalOverlay?.addEventListener('click', (e) => {
                if (e.target === this.helpModalOverlay) {
                    this.hideHelpModal();
                }
            });
            
            // Channel sidebar context menu
            this.channelSidebar?.addEventListener('contextmenu', (e) => {
                // Only show context menu on empty area or channel list
                const channelItem = e.target.closest('.channel-item');
                if (!channelItem) {
                    e.preventDefault();
                    this.showChannelContextMenu(e.clientX, e.clientY);
                }
            });
            
            // Context menu item clicks
            this.channelContextMenu?.addEventListener('click', (e) => {
                const item = e.target.closest('.context-item');
                if (!item) return;
                
                const action = item.dataset.action;
                this.hideChannelContextMenu();
                
                switch (action) {
                    case 'create-channel':
                        this._triggerCreateChannel();
                        break;
                    case 'create-category':
                        this._triggerCreateCategory();
                        break;
                    case 'invite':
                        this._triggerInvite();
                        break;
                    case 'server-settings':
                        this._triggerServerSettings();
                        break;
                }
            });
            
            // Hide context menu on click outside
            document.addEventListener('click', (e) => {
                if (!this.channelContextMenu.contains(e.target)) {
                    this.hideChannelContextMenu();
                }
            });
            
            // Hide pinned popup on click outside
            document.addEventListener('click', (e) => {
                if (this.pinnedPopup.style.display !== 'none' &&
                    !this.pinnedPopup.contains(e.target) &&
                    !this.pinBtn?.contains(e.target)) {
                    this.hidePinnedPopup();
                }
            });
            
            // Jump to pinned message
            this.pinnedPopup?.addEventListener('click', (e) => {
                const jumpBtn = e.target.closest('.pinned-message-jump');
                if (jumpBtn) {
                    const msgId = jumpBtn.closest('.pinned-message')?.dataset.messageId;
                    if (msgId) {
                        this._jumpToMessage(msgId);
                        this.hidePinnedPopup();
                    }
                }
            });
            
            // Restore member list visibility preference
            const savedPref = localStorage.getItem('cococord_members_visible');
            if (savedPref === 'false') {
                this.isMembersVisible = true; // Will be toggled to false
                this.toggleMembersList();
            }
            
            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                // Escape to close overlays
                if (e.key === 'Escape') {
                    if (this.threadsOverlay?.classList.contains('show')) {
                        this.hideThreadsOverlay();
                    } else if (this.pinnedPopup?.style.display !== 'none') {
                        this.hidePinnedPopup();
                    } else if (this.helpModalOverlay?.classList.contains('show')) {
                        this.hideHelpModal();
                    }
                }
            });
        }

        // ==================== TRIGGER ACTIONS ====================
        
        _triggerCreateChannel() {
            // Trigger existing create channel modal
            const createChannelBtn = document.getElementById('createChannelBtn');
            createChannelBtn?.click();
        }

        _triggerCreateCategory() {
            // Show create category modal
            const modal = document.getElementById('createCategoryModal');
            if (modal) {
                modal.style.display = 'flex';
                const input = document.getElementById('categoryNameInput');
                input?.focus();
            }
            
            // Callback if provided
            if (this.onCreateCategory) {
                this.onCreateCategory();
            }
        }

        _triggerInvite() {
            // Trigger existing invite modal
            const inviteBtn = document.getElementById('invitePeopleBtn');
            inviteBtn?.click();
        }

        _triggerServerSettings() {
            // Trigger existing server settings
            const settingsBtn = document.getElementById('serverSettingsBtn');
            settingsBtn?.click();
        }

        _jumpToMessage(messageId) {
            const messageEl = document.querySelector(`.message-row[data-message-id="${messageId}"]`);
            if (messageEl) {
                messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                messageEl.classList.add('highlight');
                setTimeout(() => messageEl.classList.remove('highlight'), 2000);
            }
        }

        // ==================== UTILITIES ====================
        
        _escapeHtml(str) {
            if (!str) return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }

        _formatTime(timestamp) {
            if (!timestamp) return '';
            const date = new Date(timestamp);
            const now = new Date();
            const diff = now - date;
            
            if (diff < 60000) return 'Vừa xong';
            if (diff < 3600000) return Math.floor(diff / 60000) + ' phút trước';
            if (diff < 86400000) return Math.floor(diff / 3600000) + ' giờ trước';
            
            return date.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }

        _showToast(message, type = 'info') {
            // Use existing toast system if available
            const existingToast = document.querySelector('.chat-toast');
            if (existingToast) {
                existingToast.remove();
            }
            
            const toast = document.createElement('div');
            toast.className = `chat-toast chat-toast-${type}`;
            toast.textContent = message;
            document.body.appendChild(toast);
            
            requestAnimationFrame(() => {
                toast.classList.add('show');
            });
            
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }

        // ==================== PUBLIC API ====================
        
        setChannelMuted(muted) {
            this.isChannelMuted = muted;
            if (muted) {
                this.notifyBtn?.classList.add('muted');
                this.notifyBtn.querySelector('i')?.classList.replace('bi-bell', 'bi-bell-slash');
            } else {
                this.notifyBtn?.classList.remove('muted');
                this.notifyBtn.querySelector('i')?.classList.replace('bi-bell-slash', 'bi-bell');
            }
        }

        destroy() {
            // Remove created elements
            this.threadsBackdrop?.remove();
            this.threadsOverlay?.remove();
            this.pinnedPopup?.remove();
            this.helpModalOverlay?.remove();
            this.channelContextMenu?.remove();
        }
    }

    // Export to global scope
    window.HeaderToolbar = HeaderToolbar;

})(window);
