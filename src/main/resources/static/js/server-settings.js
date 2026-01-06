/**
 * ServerSettingsManager - Server Settings Modal with Tabs
 * 
 * Features:
 * - Fullscreen modal with sidebar navigation
 * - Overview tab: Server icon upload, name change
 * - Roles tab: Role list, permissions editor
 * - Save Changes bar that appears on data changes
 * - API integration for saving settings
 */

(function(window) {
    'use strict';

    // ==================== PERMISSIONS DEFINITION ====================
    const PERMISSIONS = {
        general: [
            { key: 'VIEW_CHANNELS', name: 'Xem kênh', desc: 'Cho phép thành viên xem các kênh văn bản và nghe các kênh thoại' },
            { key: 'MANAGE_CHANNELS', name: 'Quản lý kênh', desc: 'Cho phép thành viên tạo, chỉnh sửa và xóa kênh' },
            { key: 'MANAGE_ROLES', name: 'Quản lý vai trò', desc: 'Cho phép thành viên tạo và chỉnh sửa vai trò thấp hơn vai trò của họ' },
            { key: 'MANAGE_EMOJIS', name: 'Quản lý emoji', desc: 'Cho phép thành viên thêm hoặc xóa emoji tùy chỉnh' },
            { key: 'VIEW_AUDIT_LOG', name: 'Xem lịch sử', desc: 'Cho phép thành viên xem lịch sử thay đổi của server' },
            { key: 'MANAGE_SERVER', name: 'Quản lý server', desc: 'Cho phép thành viên thay đổi tên, icon và các cài đặt của server' }
        ],
        membership: [
            { key: 'CREATE_INVITE', name: 'Tạo lời mời', desc: 'Cho phép thành viên mời người khác vào server' },
            { key: 'CHANGE_NICKNAME', name: 'Đổi biệt danh', desc: 'Cho phép thành viên thay đổi biệt danh của chính họ' },
            { key: 'MANAGE_NICKNAMES', name: 'Quản lý biệt danh', desc: 'Cho phép thành viên thay đổi biệt danh của người khác' },
            { key: 'KICK_MEMBERS', name: 'Kick thành viên', desc: 'Cho phép kick thành viên ra khỏi server' },
            { key: 'BAN_MEMBERS', name: 'Cấm thành viên', desc: 'Cho phép cấm vĩnh viễn thành viên khỏi server' }
        ],
        textChannel: [
            { key: 'SEND_MESSAGES', name: 'Gửi tin nhắn', desc: 'Cho phép thành viên gửi tin nhắn trong các kênh văn bản' },
            { key: 'EMBED_LINKS', name: 'Nhúng link', desc: 'Cho phép link được nhúng tự động (hiện preview)' },
            { key: 'ATTACH_FILES', name: 'Đính kèm file', desc: 'Cho phép thành viên tải lên file và hình ảnh' },
            { key: 'ADD_REACTIONS', name: 'Thêm reaction', desc: 'Cho phép thành viên thêm reaction vào tin nhắn' },
            { key: 'USE_EMOJIS', name: 'Dùng emoji', desc: 'Cho phép thành viên sử dụng emoji tùy chỉnh của server khác' },
            { key: 'MENTION_EVERYONE', name: 'Mention everyone', desc: 'Cho phép dùng @everyone và @here' },
            { key: 'MANAGE_MESSAGES', name: 'Quản lý tin nhắn', desc: 'Cho phép xóa tin nhắn của người khác và ghim tin nhắn' },
            { key: 'READ_MESSAGE_HISTORY', name: 'Đọc lịch sử', desc: 'Cho phép đọc tin nhắn cũ trong kênh' }
        ],
        voiceChannel: [
            { key: 'CONNECT', name: 'Kết nối', desc: 'Cho phép thành viên tham gia kênh thoại' },
            { key: 'SPEAK', name: 'Nói', desc: 'Cho phép thành viên nói trong kênh thoại' },
            { key: 'VIDEO', name: 'Video', desc: 'Cho phép thành viên chia sẻ video trong kênh thoại' },
            { key: 'MUTE_MEMBERS', name: 'Tắt tiếng thành viên', desc: 'Cho phép tắt tiếng thành viên khác trong kênh thoại' },
            { key: 'DEAFEN_MEMBERS', name: 'Điếc thành viên', desc: 'Cho phép tắt loa thành viên khác trong kênh thoại' },
            { key: 'MOVE_MEMBERS', name: 'Di chuyển thành viên', desc: 'Cho phép di chuyển thành viên sang kênh thoại khác' }
        ]
    };

    // Default role colors
    const ROLE_COLORS = [
        '#99aab5', '#1abc9c', '#2ecc71', '#3498db', '#9b59b6',
        '#e91e63', '#f1c40f', '#e67e22', '#e74c3c', '#95a5a6',
        '#607d8b', '#11806a', '#1f8b4c', '#206694', '#71368a',
        '#ad1457', '#c27c0e', '#a84300', '#992d22', '#979c9f'
    ];

    // ==================== ServerSettingsManager CLASS ====================
    class ServerSettingsManager {
        constructor(options = {}) {
            this.serverId = null;
            this.serverData = null;
            this.roles = [];
            this.selectedRoleId = null;
            
            // Track changes
            this.originalData = null;
            this.hasChanges = false;
            
            // Callbacks
            this.onSave = options.onSave || null;
            this.onClose = options.onClose || null;
            
            // Create modal
            this._createModal();
            this._bindEvents();
            
            console.log('[ServerSettingsManager] Initialized');
        }

        // ==================== MODAL CREATION ====================
        
        _createModal() {
            this.modal = document.createElement('div');
            this.modal.className = 'server-settings-modal';
            this.modal.id = 'serverSettingsModal';
            
            this.modal.innerHTML = `
                <div class="modal-backdrop"></div>
                <div class="server-settings-container">
                    <!-- Sidebar Navigation -->
                    <aside class="server-settings-sidebar">
                        <div class="server-settings-sidebar-header">
                            <h4 id="settingsServerName">Server Settings</h4>
                        </div>
                        <nav class="server-settings-nav">
                            <div class="settings-nav-section">
                                <div class="settings-nav-item active" data-tab="overview">
                                    <i class="bi bi-gear"></i>
                                    <span>Tổng quan</span>
                                </div>
                                <div class="settings-nav-item" data-tab="roles">
                                    <i class="bi bi-shield"></i>
                                    <span>Vai trò</span>
                                </div>
                                <div class="settings-nav-item" data-tab="emoji">
                                    <i class="bi bi-emoji-smile"></i>
                                    <span>Emoji</span>
                                </div>
                                <div class="settings-nav-item" data-tab="stickers">
                                    <i class="bi bi-stickies"></i>
                                    <span>Stickers</span>
                                </div>
                            </div>
                            
                            <div class="settings-nav-divider"></div>
                            
                            <div class="settings-nav-section">
                                <div class="settings-nav-section-title">Quản lý thành viên</div>
                                <div class="settings-nav-item" data-tab="members">
                                    <i class="bi bi-people"></i>
                                    <span>Thành viên</span>
                                </div>
                                <div class="settings-nav-item" data-tab="invites">
                                    <i class="bi bi-link-45deg"></i>
                                    <span>Lời mời</span>
                                </div>
                                <div class="settings-nav-item" data-tab="bans">
                                    <i class="bi bi-person-x"></i>
                                    <span>Danh sách cấm</span>
                                </div>
                            </div>
                            
                            <div class="settings-nav-divider"></div>
                            
                            <div class="settings-nav-section">
                                <div class="settings-nav-item danger" data-action="delete-server">
                                    <i class="bi bi-trash"></i>
                                    <span>Xóa Server</span>
                                </div>
                            </div>
                        </nav>
                    </aside>
                    
                    <!-- Main Content -->
                    <main class="server-settings-content">
                        <button class="server-settings-close" title="Đóng (ESC)">
                            <i class="bi bi-x"></i>
                        </button>
                        <span class="server-settings-close-hint">ESC</span>
                        
                        <header class="server-settings-header">
                            <h2 id="settingsTabTitle">Tổng quan</h2>
                        </header>
                        
                        <div class="server-settings-body">
                            <!-- Overview Tab -->
                            <div class="settings-tab-content active" id="overviewTab">
                                ${this._createOverviewTabHTML()}
                            </div>
                            
                            <!-- Roles Tab -->
                            <div class="settings-tab-content" id="rolesTab">
                                ${this._createRolesTabHTML()}
                            </div>
                            
                            <!-- Placeholder tabs -->
                            <div class="settings-tab-content" id="emojiTab">
                                ${this._createEmojiTabHTML()}
                            </div>
                            
                            <div class="settings-tab-content" id="stickersTab">
                                ${this._createStickersTabHTML()}
                            </div>
                            
                            <div class="settings-tab-content" id="membersTab">
                                ${this._createMembersTabHTML()}
                            </div>
                            
                            <div class="settings-tab-content" id="invitesTab">
                                ${this._createInvitesTabHTML()}
                            </div>
                            
                            <div class="settings-tab-content" id="bansTab">
                                ${this._createBansTabHTML()}
                            </div>
                        </div>
                    </main>
                </div>
                
                <!-- Save Changes Bar -->
                <div class="save-changes-bar" id="saveChangesBar">
                    <span>Bạn có thay đổi chưa lưu!</span>
                    <div>
                        <button class="btn-reset" id="btnResetChanges">Đặt lại</button>
                        <button class="btn-save" id="btnSaveChanges">Lưu thay đổi</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(this.modal);
            
            // Cache elements
            this.saveChangesBar = this.modal.querySelector('#saveChangesBar');
            this.serverNameDisplay = this.modal.querySelector('#settingsServerName');
            this.tabTitle = this.modal.querySelector('#settingsTabTitle');
        }

        _createOverviewTabHTML() {
            return `
                <div class="overview-section">
                    <div class="overview-section-title">Biểu tượng Server</div>
                    <div class="server-icon-upload">
                        <div class="server-icon-preview" id="serverIconPreview">
                            <span class="icon-placeholder" id="serverIconPlaceholder">S</span>
                            <img src="" alt="" style="display:none" id="serverIconImg">
                            <div class="icon-overlay">
                                <i class="bi bi-camera"></i>
                                <span>Thay đổi</span>
                            </div>
                        </div>
                        <input type="file" accept="image/*" id="serverIconInput" style="display:none">
                        <div class="server-icon-info">
                            <h4>Tải lên biểu tượng</h4>
                            <p>Chúng tôi khuyến nghị sử dụng ảnh có kích thước tối thiểu 512x512 để có chất lượng tốt nhất.</p>
                            <div class="server-icon-actions">
                                <button class="btn-upload" id="btnUploadIcon">Tải ảnh lên</button>
                                <button class="btn-remove-icon" id="btnRemoveIcon" style="display:none">Xóa</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="overview-section">
                    <div class="server-name-section">
                        <div class="form-group">
                            <label for="serverNameInput">Tên Server</label>
                            <input type="text" id="settingsServerNameInput" maxlength="100" placeholder="Nhập tên server">
                            <div class="char-count"><span id="serverNameCharCount">0</span>/100</div>
                        </div>
                    </div>
                </div>
            `;
        }

        _createRolesTabHTML() {
            return `
                <div class="roles-container">
                    <!-- Roles List Panel -->
                    <div class="roles-list-panel">
                        <div class="roles-list-header">
                            <h4>Vai trò</h4>
                            <button class="btn-create-role" id="btnCreateRole" title="Tạo vai trò">
                                <i class="bi bi-plus"></i>
                            </button>
                        </div>
                        <div class="roles-list" id="rolesList">
                            <!-- Roles will be rendered here -->
                        </div>
                    </div>
                    
                    <!-- Roles Editor Panel -->
                    <div class="roles-editor-panel" id="rolesEditorPanel">
                        <div class="roles-editor-empty" id="rolesEditorEmpty">
                            <i class="bi bi-shield"></i>
                            <h4>Chọn một vai trò</h4>
                            <p>Chọn một vai trò từ danh sách bên trái để chỉnh sửa</p>
                        </div>
                        
                        <div id="rolesEditorContent" style="display:none">
                            <div class="roles-editor-header">
                                <h4 id="editingRoleName">Role Name</h4>
                                <button class="btn-delete-role" id="btnDeleteRole">
                                    <i class="bi bi-trash"></i> Xóa vai trò
                                </button>
                            </div>
                            
                            <div class="roles-editor-body">
                                <!-- Role Info -->
                                <div class="role-info-section">
                                    <div class="role-color-picker">
                                        <input type="color" id="roleColorInput" value="#99aab5">
                                    </div>
                                    <div class="role-name-input form-group" style="margin:0">
                                        <label for="roleNameInput">Tên vai trò</label>
                                        <input type="text" id="roleNameInput" maxlength="100" placeholder="Nhập tên vai trò">
                                    </div>
                                </div>
                                
                                <!-- Permissions -->
                                <div id="permissionsContainer">
                                    ${this._createPermissionsHTML()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        _createPermissionsHTML() {
            let html = '';
            
            const sections = [
                { key: 'general', title: 'Quyền chung' },
                { key: 'membership', title: 'Quyền thành viên' },
                { key: 'textChannel', title: 'Quyền kênh văn bản' },
                { key: 'voiceChannel', title: 'Quyền kênh thoại' }
            ];
            
            sections.forEach(section => {
                html += `
                    <div class="permissions-section">
                        <div class="permissions-section-title">${section.title}</div>
                        ${PERMISSIONS[section.key].map(perm => `
                            <div class="permission-item">
                                <div class="permission-info">
                                    <div class="permission-name">${perm.name}</div>
                                    <div class="permission-desc">${perm.desc}</div>
                                </div>
                                <label class="toggle-switch">
                                    <input type="checkbox" data-permission="${perm.key}">
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        `).join('')}
                    </div>
                `;
            });
            
            return html;
        }

        _createEmojiTabHTML() {
            return `
                <div class="overview-section">
                    <div class="overview-section-title">Emoji tùy chỉnh</div>
                    <p style="color:var(--text-muted);margin-bottom:16px">Quản lý emoji tùy chỉnh của server</p>
                    <div class="emoji-upload-area">
                        <button class="btn-upload" id="btnUploadEmoji">
                            <i class="bi bi-plus-lg"></i> Tải emoji lên
                        </button>
                        <input type="file" accept="image/png,image/gif,image/jpeg" id="emojiFileInput" style="display:none" multiple>
                    </div>
                    <div class="emoji-list" id="emojiList">
                        <div class="emoji-list-empty">
                            <i class="bi bi-emoji-smile"></i>
                            <p>Chưa có emoji nào</p>
                        </div>
                    </div>
                </div>
            `;
        }

        _createStickersTabHTML() {
            return `
                <div class="overview-section">
                    <div class="overview-section-title">Stickers tùy chỉnh</div>
                    <p style="color:var(--text-muted);margin-bottom:16px">Quản lý stickers của server</p>
                    <div class="sticker-upload-area">
                        <button class="btn-upload" id="btnUploadSticker">
                            <i class="bi bi-plus-lg"></i> Tải sticker lên
                        </button>
                        <input type="file" accept="image/png,image/gif,image/jpeg" id="stickerFileInput" style="display:none">
                    </div>
                    <div class="sticker-list" id="stickerList">
                        <div class="sticker-list-empty">
                            <i class="bi bi-stickies"></i>
                            <p>Chưa có sticker nào</p>
                        </div>
                    </div>
                </div>
            `;
        }

        _createMembersTabHTML() {
            return `
                <div class="overview-section">
                    <div class="members-header">
                        <div class="overview-section-title">Thành viên Server</div>
                        <div class="members-search">
                            <i class="bi bi-search"></i>
                            <input type="text" id="memberSearchInput" placeholder="Tìm kiếm thành viên...">
                        </div>
                    </div>
                    <div class="members-list" id="membersList">
                        <div class="members-loading">
                            <div class="spinner"></div>
                            <p>Đang tải danh sách thành viên...</p>
                        </div>
                    </div>
                </div>
            `;
        }

        _createInvitesTabHTML() {
            return `
                <div class="overview-section">
                    <div class="invites-header">
                        <div class="overview-section-title">Link mời</div>
                        <button class="btn-create-invite" id="btnCreateInvite">
                            <i class="bi bi-plus-lg"></i> Tạo link mời
                        </button>
                    </div>
                    <div class="invites-list" id="invitesList">
                        <div class="invites-loading">
                            <div class="spinner"></div>
                            <p>Đang tải danh sách link mời...</p>
                        </div>
                    </div>
                </div>
            `;
        }

        _createBansTabHTML() {
            return `
                <div class="overview-section">
                    <div class="overview-section-title">Danh sách cấm</div>
                    <p style="color:var(--text-muted);margin-bottom:16px">Các thành viên đã bị cấm khỏi server</p>
                    <div class="bans-list" id="bansList">
                        <div class="bans-loading">
                            <div class="spinner"></div>
                            <p>Đang tải danh sách...</p>
                        </div>
                    </div>
                </div>
            `;
        }

        // ==================== EVENT BINDING ====================
        
        _bindEvents() {
            // Close button
            this.modal.querySelector('.server-settings-close').addEventListener('click', () => {
                this.close();
            });
            
            // Backdrop click
            this.modal.querySelector('.modal-backdrop').addEventListener('click', () => {
                this.close();
            });
            
            // Tab navigation
            this.modal.querySelectorAll('.settings-nav-item[data-tab]').forEach(item => {
                item.addEventListener('click', () => {
                    this._switchTab(item.dataset.tab);
                });
            });
            
            // Delete server action
            this.modal.querySelector('[data-action="delete-server"]')?.addEventListener('click', () => {
                this._handleDeleteServer();
            });
            
            // Server icon upload
            const iconPreview = this.modal.querySelector('#serverIconPreview');
            const iconInput = this.modal.querySelector('#serverIconInput');
            const btnUpload = this.modal.querySelector('#btnUploadIcon');
            const btnRemove = this.modal.querySelector('#btnRemoveIcon');
            
            iconPreview?.addEventListener('click', () => iconInput?.click());
            btnUpload?.addEventListener('click', () => iconInput?.click());
            
            iconInput?.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    this._handleIconUpload(e.target.files[0]);
                }
            });
            
            btnRemove?.addEventListener('click', () => {
                this._handleIconRemove();
            });
            
            // Server name input
            const nameInput = this.modal.querySelector('#settingsServerNameInput');
            const charCount = this.modal.querySelector('#serverNameCharCount');
            
            nameInput?.addEventListener('input', () => {
                charCount.textContent = nameInput.value.length;
                this._checkForChanges();
            });
            
            // Create role button
            this.modal.querySelector('#btnCreateRole')?.addEventListener('click', () => {
                this._createNewRole();
            });
            
            // Delete role button
            this.modal.querySelector('#btnDeleteRole')?.addEventListener('click', () => {
                this._deleteSelectedRole();
            });
            
            // Role name input
            const roleNameInput = this.modal.querySelector('#roleNameInput');
            roleNameInput?.addEventListener('input', () => {
                this._updateSelectedRoleName(roleNameInput.value);
            });
            
            // Role color input
            const roleColorInput = this.modal.querySelector('#roleColorInput');
            roleColorInput?.addEventListener('input', () => {
                this._updateSelectedRoleColor(roleColorInput.value);
            });
            
            // Permission toggles
            this.modal.querySelectorAll('[data-permission]').forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    this._updateSelectedRolePermission(checkbox.dataset.permission, checkbox.checked);
                });
            });
            
            // Save changes
            this.modal.querySelector('#btnSaveChanges')?.addEventListener('click', () => {
                this._saveChanges();
            });
            
            // Reset changes
            this.modal.querySelector('#btnResetChanges')?.addEventListener('click', () => {
                this._resetChanges();
            });
            
            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                    this.close();
                }
            });

            // ==================== NEW TAB EVENT BINDINGS ====================

            // Emoji upload
            this.modal.querySelector('#btnUploadEmoji')?.addEventListener('click', () => {
                this.modal.querySelector('#emojiFileInput')?.click();
            });
            this.modal.querySelector('#emojiFileInput')?.addEventListener('change', (e) => {
                if (e.target.files) {
                    this._handleEmojiUpload(e.target.files);
                }
            });

            // Sticker upload
            this.modal.querySelector('#btnUploadSticker')?.addEventListener('click', () => {
                this.modal.querySelector('#stickerFileInput')?.click();
            });
            this.modal.querySelector('#stickerFileInput')?.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    this._handleStickerUpload(e.target.files[0]);
                }
            });

            // Member search
            const memberSearchInput = this.modal.querySelector('#memberSearchInput');
            memberSearchInput?.addEventListener('input', this._debounce(() => {
                this._filterMembers(memberSearchInput.value);
            }, 300));

            // Create invite
            this.modal.querySelector('#btnCreateInvite')?.addEventListener('click', () => {
                this._createInviteLink();
            });
        }

        // ==================== TAB SWITCHING ====================
        
        _switchTab(tabId) {
            // Update nav items
            this.modal.querySelectorAll('.settings-nav-item').forEach(item => {
                item.classList.toggle('active', item.dataset.tab === tabId);
            });
            
            // Update tab content
            this.modal.querySelectorAll('.settings-tab-content').forEach(content => {
                content.classList.toggle('active', content.id === tabId + 'Tab');
            });
            
            // Update title
            const titles = {
                overview: 'Tổng quan',
                roles: 'Vai trò',
                emoji: 'Emoji',
                stickers: 'Stickers',
                members: 'Thành viên',
                invites: 'Lời mời',
                bans: 'Danh sách cấm'
            };
            this.tabTitle.textContent = titles[tabId] || tabId;

            // Load data for specific tabs
            if (tabId === 'members' && !this.membersLoaded) {
                this._loadMembers();
            } else if (tabId === 'invites' && !this.invitesLoaded) {
                this._loadInvites();
            } else if (tabId === 'bans' && !this.bansLoaded) {
                this._loadBans();
            } else if (tabId === 'emoji' && !this.emojiLoaded) {
                this._loadEmoji();
            } else if (tabId === 'stickers' && !this.stickersLoaded) {
                this._loadStickers();
            }
        }

        // ==================== OVERVIEW TAB HANDLERS ====================
        
        _handleIconUpload(file) {
            if (!file.type.startsWith('image/')) {
                this._showToast('Vui lòng chọn file ảnh', 'error');
                return;
            }
            
            if (file.size > 8 * 1024 * 1024) {
                this._showToast('File quá lớn (tối đa 8MB)', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = this.modal.querySelector('#serverIconImg');
                const placeholder = this.modal.querySelector('#serverIconPlaceholder');
                const btnRemove = this.modal.querySelector('#btnRemoveIcon');
                
                img.src = e.target.result;
                img.style.display = 'block';
                placeholder.style.display = 'none';
                btnRemove.style.display = 'inline-block';
                
                // Store the file for upload
                this.pendingIconFile = file;
                this._checkForChanges();
            };
            reader.readAsDataURL(file);
        }

        _handleIconRemove() {
            const img = this.modal.querySelector('#serverIconImg');
            const placeholder = this.modal.querySelector('#serverIconPlaceholder');
            const btnRemove = this.modal.querySelector('#btnRemoveIcon');
            
            img.src = '';
            img.style.display = 'none';
            placeholder.style.display = 'block';
            btnRemove.style.display = 'none';
            
            this.pendingIconFile = null;
            this.removeIcon = true;
            this._checkForChanges();
        }

        // ==================== ROLES TAB HANDLERS ====================
        
        _renderRolesList() {
            const container = this.modal.querySelector('#rolesList');
            if (!container) return;
            
            // Sort roles: @Admin first, @everyone last, others in between
            const sortedRoles = [...this.roles].sort((a, b) => {
                if (a.name === '@Admin') return -1;
                if (b.name === '@Admin') return 1;
                if (a.name === '@everyone') return 1;
                if (b.name === '@everyone') return -1;
                return (b.position || 0) - (a.position || 0);
            });
            
            container.innerHTML = sortedRoles.map(role => {
                const isLocked = role.name === '@Admin' || role.name === '@everyone';
                return `
                <div class="role-item ${String(role.id) === String(this.selectedRoleId) ? 'active' : ''} ${isLocked ? 'locked' : ''}" 
                     data-role-id="${role.id}" data-locked="${isLocked}">
                    <div class="role-color" style="background-color: ${role.color || '#99aab5'}"></div>
                    <span class="role-name">${this._escapeHtml(role.name)}</span>
                    ${isLocked ? '<i class="bi bi-lock-fill role-lock-icon" title="Vai trò mặc định"></i>' : ''}
                    <span class="role-count">${role.memberCount || 0}</span>
                </div>
            `}).join('');
            
            // Bind click events
            container.querySelectorAll('.role-item').forEach(item => {
                item.addEventListener('click', () => {
                    this._selectRole(item.dataset.roleId);
                });
            });
        }

        _selectRole(roleId) {
            this.selectedRoleId = roleId;
            const role = this.roles.find(r => String(r.id) === String(roleId));
            
            if (!role) return;
            
            // Update list selection
            this.modal.querySelectorAll('.role-item').forEach(item => {
                item.classList.toggle('active', String(item.dataset.roleId) === String(roleId));
            });
            
            // Show editor
            const empty = this.modal.querySelector('#rolesEditorEmpty');
            const content = this.modal.querySelector('#rolesEditorContent');
            
            empty.style.display = 'none';
            content.style.display = 'flex';
            content.style.flexDirection = 'column';
            content.style.height = '100%';
            
            // Check if role is locked (@Admin or @everyone)
            const isAdmin = role.name === '@Admin';
            const isLocked = isAdmin || role.name === '@everyone';
            
            // Populate editor
            this.modal.querySelector('#editingRoleName').textContent = role.name;
            
            const roleNameInput = this.modal.querySelector('#roleNameInput');
            const roleColorInput = this.modal.querySelector('#roleColorInput');
            const deleteRoleBtn = this.modal.querySelector('#btnDeleteRole');
            
            roleNameInput.value = role.name.replace(/^@/, ''); // Remove @ prefix for display
            roleColorInput.value = role.color || '#99aab5';
            
            // Disable inputs for locked roles
            roleNameInput.disabled = isLocked;
            roleColorInput.disabled = isAdmin; // @Admin color cannot change
            deleteRoleBtn.style.display = isLocked ? 'none' : 'flex';
            
            // Show lock notice for @Admin
            let lockNotice = this.modal.querySelector('.role-lock-notice');
            if (isAdmin) {
                if (!lockNotice) {
                    lockNotice = document.createElement('div');
                    lockNotice.className = 'role-lock-notice';
                    content.querySelector('.roles-editor-header').insertAdjacentElement('afterend', lockNotice);
                }
                lockNotice.innerHTML = '<i class="bi bi-shield-lock"></i> Vai trò @Admin có tất cả quyền và không thể chỉnh sửa';
                lockNotice.style.display = 'block';
            } else if (lockNotice) {
                lockNotice.style.display = 'none';
            }
            
            // Set permissions
            this.modal.querySelectorAll('[data-permission]').forEach(checkbox => {
                const permKey = checkbox.dataset.permission;
                if (isAdmin) {
                    // @Admin has ALL permissions, always checked and disabled
                    checkbox.checked = true;
                    checkbox.disabled = true;
                } else {
                    checkbox.checked = role.permissionsList?.includes(permKey) || false;
                    checkbox.disabled = false;
                }
            });
        }

        _createNewRole() {
            const newRole = {
                id: 'new_' + Date.now(),
                name: '@VaiTroMoi',
                color: ROLE_COLORS[Math.floor(Math.random() * ROLE_COLORS.length)],
                permissions: 0,
                permissionsList: ['VIEW_CHANNELS', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'],
                memberCount: 0,
                isNew: true
            };
            
            this.roles.push(newRole);
            this._renderRolesList();
            this._selectRole(newRole.id);
            this._checkForChanges();
        }

        // Validate role name - only letters, numbers, Vietnamese characters allowed
        _validateRoleName(name) {
            // Remove @ prefix if present
            const cleanName = name.replace(/^@/, '').trim();
            
            // Check for empty name
            if (!cleanName) {
                return { valid: false, error: 'Tên vai trò không được để trống' };
            }
            
            // Only allow letters, numbers, Vietnamese chars, spaces
            // No special characters or SQL injection patterns
            const validPattern = /^[a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF\s]+$/;
            if (!validPattern.test(cleanName)) {
                return { valid: false, error: 'Tên vai trò chỉ được chứa chữ cái và số, không có ký tự đặc biệt' };
            }
            
            // Check length
            if (cleanName.length < 2 || cleanName.length > 50) {
                return { valid: false, error: 'Tên vai trò phải từ 2-50 ký tự' };
            }
            
            return { valid: true, cleanName };
        }

        _deleteSelectedRole() {
            if (!this.selectedRoleId) return;
            
            const role = this.roles.find(r => String(r.id) === String(this.selectedRoleId));
            if (!role) return;
            
            // Cannot delete default roles
            if (role.name === '@everyone' || role.name === '@Admin') {
                this._showToast(`Không thể xóa vai trò mặc định ${role.name}`, 'error');
                return;
            }
            
            if (!confirm(`Bạn có chắc muốn xóa vai trò "${role.name}"?`)) return;
            
            this.roles = this.roles.filter(r => String(r.id) !== String(this.selectedRoleId));
            this.selectedRoleId = null;
            
            // Hide editor
            const empty = this.modal.querySelector('#rolesEditorEmpty');
            const content = this.modal.querySelector('#rolesEditorContent');
            empty.style.display = 'flex';
            content.style.display = 'none';
            
            this._renderRolesList();
            this._checkForChanges();
        }

        _updateSelectedRoleName(name) {
            const role = this.roles.find(r => String(r.id) === String(this.selectedRoleId));
            if (!role) return;
            
            // Don't allow editing locked roles
            if (role.name === '@Admin' || role.name === '@everyone') {
                return;
            }
            
            // Validate name
            const validation = this._validateRoleName(name);
            if (!validation.valid) {
                // Show validation error but don't block typing
                const input = this.modal.querySelector('#roleNameInput');
                input.classList.add('invalid');
                input.title = validation.error;
                return;
            }
            
            // Clear validation error
            const input = this.modal.querySelector('#roleNameInput');
            input.classList.remove('invalid');
            input.title = '';
            
            // Auto-prefix with @ if not already present
            const formattedName = '@' + validation.cleanName;
            role.name = formattedName;
            this.modal.querySelector('#editingRoleName').textContent = formattedName;
            
            // Update list
            const listItem = this.modal.querySelector(`.role-item[data-role-id="${this.selectedRoleId}"] .role-name`);
            if (listItem) listItem.textContent = formattedName;
            
            this._checkForChanges();
        }

        _updateSelectedRoleColor(color) {
            const role = this.roles.find(r => String(r.id) === String(this.selectedRoleId));
            if (!role) return;
            
            role.color = color;
            
            // Update list
            const colorDot = this.modal.querySelector(`.role-item[data-role-id="${this.selectedRoleId}"] .role-color`);
            if (colorDot) colorDot.style.backgroundColor = color;
            
            this._checkForChanges();
        }

        _updateSelectedRolePermission(permKey, enabled) {
            const role = this.roles.find(r => String(r.id) === String(this.selectedRoleId));
            if (!role) return;
            
            if (!role.permissionsList) role.permissionsList = [];
            
            if (enabled) {
                if (!role.permissionsList.includes(permKey)) {
                    role.permissionsList.push(permKey);
                }
            } else {
                role.permissionsList = role.permissionsList.filter(p => p !== permKey);
            }
            
            this._checkForChanges();
        }

        // ==================== EMOJI/STICKERS TAB HANDLERS ====================

        async _loadEmoji() {
            const container = this.modal.querySelector('#emojiList');
            if (!container) return;

            try {
                const response = await fetch(`/api/servers/${this.serverId}/emoji`, {
                    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('accessToken') || '') }
                });

                if (!response.ok) {
                    this.emojiList = [];
                } else {
                    this.emojiList = await response.json();
                }

                this._renderEmojiList();
                this.emojiLoaded = true;
            } catch (error) {
                console.error('[ServerSettings] Load emoji failed:', error);
                this.emojiList = [];
                this._renderEmojiList();
            }
        }

        _renderEmojiList() {
            const container = this.modal.querySelector('#emojiList');
            if (!container) return;

            if (!this.emojiList || this.emojiList.length === 0) {
                container.innerHTML = `
                    <div class="emoji-list-empty">
                        <i class="bi bi-emoji-smile"></i>
                        <p>Chưa có emoji nào</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = this.emojiList.map(emoji => `
                <div class="emoji-item" data-emoji-id="${emoji.id}">
                    <img src="${emoji.imageUrl}" alt="${emoji.name}" class="emoji-img">
                    <span class="emoji-name">:${emoji.name}:</span>
                    <button class="btn-delete-emoji" data-id="${emoji.id}" title="Xóa emoji">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `).join('');

            // Bind delete events
            container.querySelectorAll('.btn-delete-emoji').forEach(btn => {
                btn.addEventListener('click', () => this._deleteEmoji(btn.dataset.id));
            });
        }

        async _handleEmojiUpload(files) {
            for (const file of files) {
                if (!file.type.startsWith('image/')) {
                    this._showToast('Chỉ chấp nhận file ảnh', 'error');
                    continue;
                }
                if (file.size > 256 * 1024) {
                    this._showToast('File quá lớn (tối đa 256KB)', 'error');
                    continue;
                }

                try {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('name', file.name.split('.')[0].replace(/[^a-zA-Z0-9_]/g, '_'));

                    const response = await fetch(`/api/servers/${this.serverId}/emoji`, {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('accessToken') || '') },
                        body: formData
                    });

                    if (!response.ok) throw new Error('Upload failed');

                    this._showToast('Đã tải emoji lên!', 'success');
                    await this._loadEmoji();
                } catch (error) {
                    console.error('[ServerSettings] Emoji upload failed:', error);
                    this._showToast('Không thể tải emoji lên', 'error');
                }
            }
        }

        async _deleteEmoji(emojiId) {
            if (!confirm('Bạn có chắc muốn xóa emoji này?')) return;

            try {
                const response = await fetch(`/api/servers/${this.serverId}/emoji/${emojiId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('accessToken') || '') }
                });

                if (!response.ok) throw new Error('Delete failed');

                this._showToast('Đã xóa emoji', 'success');
                await this._loadEmoji();
            } catch (error) {
                console.error('[ServerSettings] Delete emoji failed:', error);
                this._showToast('Không thể xóa emoji', 'error');
            }
        }

        async _loadStickers() {
            const container = this.modal.querySelector('#stickerList');
            if (!container) return;

            try {
                const response = await fetch(`/api/servers/${this.serverId}/stickers`, {
                    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('accessToken') || '') }
                });

                if (!response.ok) {
                    this.stickerList = [];
                } else {
                    this.stickerList = await response.json();
                }

                this._renderStickerList();
                this.stickersLoaded = true;
            } catch (error) {
                console.error('[ServerSettings] Load stickers failed:', error);
                this.stickerList = [];
                this._renderStickerList();
            }
        }

        _renderStickerList() {
            const container = this.modal.querySelector('#stickerList');
            if (!container) return;

            if (!this.stickerList || this.stickerList.length === 0) {
                container.innerHTML = `
                    <div class="sticker-list-empty">
                        <i class="bi bi-stickies"></i>
                        <p>Chưa có sticker nào</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = this.stickerList.map(sticker => `
                <div class="sticker-item" data-sticker-id="${sticker.id}">
                    <img src="${sticker.imageUrl}" alt="${sticker.name}" class="sticker-img">
                    <span class="sticker-name">${sticker.name}</span>
                    <button class="btn-delete-sticker" data-id="${sticker.id}" title="Xóa sticker">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `).join('');

            // Bind delete events
            container.querySelectorAll('.btn-delete-sticker').forEach(btn => {
                btn.addEventListener('click', () => this._deleteSticker(btn.dataset.id));
            });
        }

        async _handleStickerUpload(file) {
            if (!file.type.startsWith('image/')) {
                this._showToast('Chỉ chấp nhận file ảnh', 'error');
                return;
            }

            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('name', file.name.split('.')[0]);

                const response = await fetch(`/api/servers/${this.serverId}/stickers`, {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('accessToken') || '') },
                    body: formData
                });

                if (!response.ok) throw new Error('Upload failed');

                this._showToast('Đã tải sticker lên!', 'success');
                await this._loadStickers();
            } catch (error) {
                console.error('[ServerSettings] Sticker upload failed:', error);
                this._showToast('Không thể tải sticker lên', 'error');
            }
        }

        async _deleteSticker(stickerId) {
            if (!confirm('Bạn có chắc muốn xóa sticker này?')) return;

            try {
                const response = await fetch(`/api/servers/${this.serverId}/stickers/${stickerId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('accessToken') || '') }
                });

                if (!response.ok) throw new Error('Delete failed');

                this._showToast('Đã xóa sticker', 'success');
                await this._loadStickers();
            } catch (error) {
                console.error('[ServerSettings] Delete sticker failed:', error);
                this._showToast('Không thể xóa sticker', 'error');
            }
        }

        // ==================== MEMBERS TAB HANDLERS ====================

        async _loadMembers() {
            const container = this.modal.querySelector('#membersList');
            if (!container) return;

            try {
                const response = await fetch(`/api/servers/${this.serverId}/members`, {
                    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('accessToken') || '') }
                });

                if (!response.ok) throw new Error('Failed to load members');

                this.membersList = await response.json();
                this.filteredMembers = [...this.membersList];
                this._renderMembersList();
                this.membersLoaded = true;
            } catch (error) {
                console.error('[ServerSettings] Load members failed:', error);
                container.innerHTML = `
                    <div class="members-error">
                        <p>Không thể tải danh sách thành viên</p>
                    </div>
                `;
            }
        }

        _filterMembers(query) {
            if (!query) {
                this.filteredMembers = [...this.membersList];
            } else {
                const q = query.toLowerCase();
                this.filteredMembers = this.membersList.filter(m =>
                    m.username.toLowerCase().includes(q) ||
                    (m.displayName && m.displayName.toLowerCase().includes(q)) ||
                    (m.nickname && m.nickname.toLowerCase().includes(q))
                );
            }
            this._renderMembersList();
        }

        _renderMembersList() {
            const container = this.modal.querySelector('#membersList');
            if (!container) return;

            if (!this.filteredMembers || this.filteredMembers.length === 0) {
                container.innerHTML = `
                    <div class="members-empty">
                        <p>Không tìm thấy thành viên nào</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = this.filteredMembers.map(member => {
                const isAdmin = member.roleName === '@Admin';
                const isOwner = this.serverData && String(member.userId) === String(this.serverData.ownerId);
                const canChangeRole = !isOwner; // Owner's role cannot be changed
                
                // Filter roles for non-owners: they can't be assigned @Admin
                const availableRoles = isOwner 
                    ? this.roles 
                    : this.roles.filter(r => r.name !== '@Admin' || r.name === member.roleName);
                
                return `
                <div class="member-item ${isAdmin ? 'is-admin' : ''} ${isOwner ? 'is-owner' : ''}" data-user-id="${member.userId}" data-member-id="${member.id}">
                    <div class="member-info">
                        <img src="${member.avatarUrl || '/images/default-avatar.png'}" alt="" class="member-avatar">
                        <div class="member-details">
                            <span class="member-name">
                                ${this._escapeHtml(member.displayName || member.username)}
                                ${isOwner ? '<i class="bi bi-crown-fill owner-crown" title="Chủ server"></i>' : ''}
                            </span>
                            <span class="member-username">@${this._escapeHtml(member.username)}</span>
                        </div>
                    </div>
                    <div class="member-role-wrapper">
                        ${canChangeRole ? `
                            <select class="member-role-select" data-member-id="${member.id}" data-user-id="${member.userId}">
                                ${availableRoles.map(role => `
                                    <option value="${role.id}" ${role.name === member.roleName ? 'selected' : ''}>
                                        ${this._escapeHtml(role.name)}
                                    </option>
                                `).join('')}
                            </select>
                        ` : `
                            <span class="member-role-locked" title="Vai trò của chủ server không thể thay đổi">
                                <i class="bi bi-lock-fill"></i> ${this._escapeHtml(member.roleName)}
                            </span>
                        `}
                    </div>
                    <!-- Hide action buttons for @Admin members (Admin is king) -->
                    ${!isAdmin ? `
                    <div class="member-actions">
                        <button class="btn-member-action" title="Cấm chat" data-action="mute" data-user-id="${member.userId}">
                            <i class="bi bi-mic-mute"></i>
                        </button>
                        <button class="btn-member-action btn-danger" title="Kick" data-action="kick" data-user-id="${member.userId}">
                            <i class="bi bi-box-arrow-right"></i>
                        </button>
                        <button class="btn-member-action btn-danger" title="Ban" data-action="ban" data-user-id="${member.userId}">
                            <i class="bi bi-person-x"></i>
                        </button>
                    </div>
                    ` : `
                    <div class="member-actions admin-protected">
                        <span class="admin-badge" title="Admin không thể bị xử phạt"><i class="bi bi-shield-fill"></i></span>
                    </div>
                    `}
                </div>
            `}).join('');

            // Bind action events
            container.querySelectorAll('.btn-member-action').forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    const userId = btn.dataset.userId;
                    if (action === 'mute') this._showMuteDialog(userId);
                    else if (action === 'kick') this._kickMember(userId);
                    else if (action === 'ban') this._showBanDialog(userId);
                });
            });

            // Bind role change events
            container.querySelectorAll('.member-role-select').forEach(select => {
                select.addEventListener('change', async (e) => {
                    const memberId = e.target.dataset.memberId;
                    const roleId = e.target.value;
                    await this._updateMemberRole(memberId, roleId);
                });
            });
        }

        async _updateMemberRole(memberId, roleId) {
            try {
                const response = await fetch(`/api/servers/${this.serverId}/members/${memberId}/role?roleId=${roleId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': 'Bearer ' + (localStorage.getItem('accessToken') || '')
                    }
                });

                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
                    throw new Error(error.message || 'Không thể thay đổi vai trò');
                }

                this._showToast('Đã cập nhật vai trò thành viên', 'success');
                await this._loadMembers(); // Refresh list
            } catch (error) {
                console.error('[ServerSettings] Update member role failed:', error);
                this._showToast(error.message || 'Không thể thay đổi vai trò', 'error');
                await this._loadMembers(); // Reset to original state
            }
        }

        _showMuteDialog(userId) {
            const member = this.membersList.find(m => String(m.userId) === String(userId));
            const memberName = member ? (member.displayName || member.username) : 'thành viên';

            const duration = prompt(
                `Chọn thời gian cấm chat cho ${memberName}:\n\n` +
                `1 = 1 ngày\n` +
                `7 = 1 tuần\n` +
                `30 = 1 tháng\n` +
                `0 = Vĩnh viễn\n\n` +
                `Nhập số ngày:`
            );

            if (duration === null) return;

            const days = parseInt(duration);
            if (isNaN(days) || days < 0) {
                this._showToast('Vui lòng nhập số hợp lệ', 'error');
                return;
            }

            const durationMinutes = days === 0 ? null : days * 24 * 60;
            this._muteMember(userId, durationMinutes);
        }

        async _muteMember(userId, durationMinutes) {
            try {
                const response = await fetch(`/api/servers/${this.serverId}/mute`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + (localStorage.getItem('accessToken') || '')
                    },
                    body: JSON.stringify({
                        userId: parseInt(userId),
                        durationMinutes: durationMinutes,
                        reason: 'Cấm chat từ cài đặt server'
                    })
                });

                if (!response.ok) {
                    const err = await response.json().catch(() => ({}));
                    throw new Error(err.message || 'Failed to mute');
                }

                this._showToast('Đã cấm chat thành viên', 'success');
            } catch (error) {
                console.error('[ServerSettings] Mute failed:', error);
                this._showToast('Không thể cấm chat: ' + error.message, 'error');
            }
        }

        async _kickMember(userId) {
            const member = this.membersList.find(m => String(m.userId) === String(userId));
            const memberName = member ? (member.displayName || member.username) : 'thành viên';

            if (!confirm(`Bạn có chắc muốn kick ${memberName} khỏi server?`)) return;

            try {
                const response = await fetch(`/api/servers/${this.serverId}/kick`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + (localStorage.getItem('accessToken') || '')
                    },
                    body: JSON.stringify({
                        userId: parseInt(userId),
                        reason: 'Kick từ cài đặt server'
                    })
                });

                if (!response.ok) {
                    const err = await response.json().catch(() => ({}));
                    throw new Error(err.message || 'Failed to kick');
                }

                this._showToast('Đã kick thành viên', 'success');
                await this._loadMembers();
            } catch (error) {
                console.error('[ServerSettings] Kick failed:', error);
                this._showToast('Không thể kick: ' + error.message, 'error');
            }
        }

        _showBanDialog(userId) {
            const member = this.membersList.find(m => String(m.userId) === String(userId));
            const memberName = member ? (member.displayName || member.username) : 'thành viên';

            if (!confirm(`Bạn có chắc muốn ban ${memberName} khỏi server? Họ sẽ không thể tham gia lại.`)) return;

            const reason = prompt('Lý do ban (tùy chọn):');
            this._banMember(userId, reason || null);
        }

        async _banMember(userId, reason) {
            try {
                const response = await fetch(`/api/servers/${this.serverId}/ban`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + (localStorage.getItem('accessToken') || '')
                    },
                    body: JSON.stringify({
                        userId: parseInt(userId),
                        reason: reason,
                        deleteMessageDays: 0
                    })
                });

                if (!response.ok) {
                    const err = await response.json().catch(() => ({}));
                    throw new Error(err.message || 'Failed to ban');
                }

                this._showToast('Đã ban thành viên', 'success');
                await this._loadMembers();
            } catch (error) {
                console.error('[ServerSettings] Ban failed:', error);
                this._showToast('Không thể ban: ' + error.message, 'error');
            }
        }

        // ==================== INVITES TAB HANDLERS ====================

        async _loadInvites() {
            const container = this.modal.querySelector('#invitesList');
            if (!container) return;

            try {
                const response = await fetch(`/api/servers/${this.serverId}/invites`, {
                    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('accessToken') || '') }
                });

                if (!response.ok) throw new Error('Failed to load invites');

                this.invitesList = await response.json();
                this._renderInvitesList();
                this.invitesLoaded = true;
            } catch (error) {
                console.error('[ServerSettings] Load invites failed:', error);
                container.innerHTML = `
                    <div class="invites-error">
                        <p>Không thể tải danh sách link mời</p>
                    </div>
                `;
            }
        }

        _renderInvitesList() {
            const container = this.modal.querySelector('#invitesList');
            if (!container) return;

            if (!this.invitesList || this.invitesList.length === 0) {
                container.innerHTML = `
                    <div class="invites-empty">
                        <i class="bi bi-link-45deg"></i>
                        <p>Chưa có link mời nào</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = this.invitesList.map(invite => {
                const inviteUrl = `${window.location.origin}/invite/${invite.code}`;
                const expiresText = invite.expiresAt
                    ? `Hết hạn: ${new Date(invite.expiresAt).toLocaleDateString('vi-VN')}`
                    : 'Không hết hạn';
                const usesText = invite.maxUses > 0
                    ? `${invite.currentUses}/${invite.maxUses} lượt`
                    : `${invite.currentUses} lượt`;

                return `
                    <div class="invite-item" data-invite-id="${invite.id}">
                        <div class="invite-info">
                            <div class="invite-code">
                                <input type="text" value="${inviteUrl}" readonly class="invite-url-input">
                                <button class="btn-copy-invite" data-url="${inviteUrl}" title="Sao chép link">
                                    <i class="bi bi-clipboard"></i>
                                </button>
                            </div>
                            <div class="invite-meta">
                                <span><i class="bi bi-person"></i> ${invite.createdBy}</span>
                                <span><i class="bi bi-clock"></i> ${expiresText}</span>
                                <span><i class="bi bi-people"></i> ${usesText}</span>
                            </div>
                        </div>
                        <button class="btn-delete-invite" data-id="${invite.id}" title="Xóa link mời">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                `;
            }).join('');

            // Bind events
            container.querySelectorAll('.btn-copy-invite').forEach(btn => {
                btn.addEventListener('click', () => {
                    navigator.clipboard.writeText(btn.dataset.url).then(() => {
                        this._showToast('Đã sao chép link!', 'success');
                    });
                });
            });

            container.querySelectorAll('.btn-delete-invite').forEach(btn => {
                btn.addEventListener('click', () => this._deleteInvite(btn.dataset.id));
            });
        }

        async _createInviteLink() {
            const expiresInDays = prompt('Link mời hết hạn sau bao nhiêu ngày? (0 = không hết hạn):', '7');
            if (expiresInDays === null) return;

            const days = parseInt(expiresInDays) || 0;

            try {
                const response = await fetch(`/api/servers/${this.serverId}/invites`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + (localStorage.getItem('accessToken') || '')
                    },
                    body: JSON.stringify({
                        expiresInDays: days > 0 ? days : null,
                        maxUses: 0
                    })
                });

                if (!response.ok) throw new Error('Failed to create invite');

                this._showToast('Đã tạo link mời mới!', 'success');
                await this._loadInvites();
            } catch (error) {
                console.error('[ServerSettings] Create invite failed:', error);
                this._showToast('Không thể tạo link mời', 'error');
            }
        }

        async _deleteInvite(inviteId) {
            if (!confirm('Bạn có chắc muốn xóa link mời này?')) return;

            try {
                const response = await fetch(`/api/servers/${this.serverId}/invites/${inviteId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('accessToken') || '') }
                });

                if (!response.ok) throw new Error('Failed to delete invite');

                this._showToast('Đã xóa link mời', 'success');
                await this._loadInvites();
            } catch (error) {
                console.error('[ServerSettings] Delete invite failed:', error);
                this._showToast('Không thể xóa link mời', 'error');
            }
        }

        // ==================== BANS TAB HANDLERS ====================

        async _loadBans() {
            const container = this.modal.querySelector('#bansList');
            if (!container) return;

            try {
                const response = await fetch(`/api/servers/${this.serverId}/bans`, {
                    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('accessToken') || '') }
                });

                if (!response.ok) throw new Error('Failed to load bans');

                this.bansList = await response.json();
                this._renderBansList();
                this.bansLoaded = true;
            } catch (error) {
                console.error('[ServerSettings] Load bans failed:', error);
                container.innerHTML = `
                    <div class="bans-error">
                        <p>Không thể tải danh sách cấm</p>
                    </div>
                `;
            }
        }

        _renderBansList() {
            const container = this.modal.querySelector('#bansList');
            if (!container) return;

            if (!this.bansList || this.bansList.length === 0) {
                container.innerHTML = `
                    <div class="bans-empty">
                        <i class="bi bi-person-check"></i>
                        <p>Không có ai bị cấm</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = this.bansList.map(ban => {
                const bannedDate = new Date(ban.bannedAt).toLocaleDateString('vi-VN');
                return `
                    <div class="ban-item" data-ban-id="${ban.id}">
                        <div class="ban-info">
                            <img src="${ban.avatarUrl || '/images/default-avatar.png'}" alt="" class="ban-avatar">
                            <div class="ban-details">
                                <span class="ban-name">${this._escapeHtml(ban.displayName || ban.username)}</span>
                                <span class="ban-username">@${this._escapeHtml(ban.username)}</span>
                                <span class="ban-meta">
                                    Bị cấm bởi ${ban.bannedByUsername} vào ${bannedDate}
                                    ${ban.reason ? ` - Lý do: ${this._escapeHtml(ban.reason)}` : ''}
                                </span>
                            </div>
                        </div>
                        <button class="btn-unban" data-user-id="${ban.userId}" title="Bỏ cấm">
                            <i class="bi bi-person-plus"></i> Bỏ cấm
                        </button>
                    </div>
                `;
            }).join('');

            // Bind unban events
            container.querySelectorAll('.btn-unban').forEach(btn => {
                btn.addEventListener('click', () => this._unbanMember(btn.dataset.userId));
            });
        }

        async _unbanMember(userId) {
            const ban = this.bansList.find(b => String(b.userId) === String(userId));
            const memberName = ban ? (ban.displayName || ban.username) : 'thành viên';

            if (!confirm(`Bạn có chắc muốn bỏ cấm ${memberName}?`)) return;

            try {
                const response = await fetch(`/api/servers/${this.serverId}/bans/${userId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('accessToken') || '') }
                });

                if (!response.ok) {
                    const err = await response.json().catch(() => ({}));
                    throw new Error(err.message || 'Failed to unban');
                }

                this._showToast('Đã bỏ cấm thành viên', 'success');
                await this._loadBans();
            } catch (error) {
                console.error('[ServerSettings] Unban failed:', error);
                this._showToast('Không thể bỏ cấm: ' + error.message, 'error');
            }
        }

        // ==================== UTILITY ====================

        _debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        // ==================== SAVE/RESET ====================
        
        _checkForChanges() {
            // Compare current state with original
            const currentData = this._collectFormData();
            this.hasChanges = JSON.stringify(currentData) !== JSON.stringify(this.originalData);
            
            // Also check for pending icon or role changes
            if (this.pendingIconFile || this.removeIcon) {
                this.hasChanges = true;
            }
            
            // Check roles changes
            if (JSON.stringify(this.roles) !== JSON.stringify(this.originalRoles)) {
                this.hasChanges = true;
            }
            
            // Show/hide save bar
            this.saveChangesBar.classList.toggle('show', this.hasChanges);
        }

        _collectFormData() {
            return {
                name: this.modal.querySelector('#settingsServerNameInput')?.value || '',
                iconUrl: this.serverData?.iconUrl || null
            };
        }

        async _saveChanges() {
            const btn = this.modal.querySelector('#btnSaveChanges');
            btn.disabled = true;
            btn.textContent = 'Đang lưu...';
            
            try {
                // If there's a pending icon, upload it first
                if (this.pendingIconFile) {
                    const formData = new FormData();
                    formData.append('icon', this.pendingIconFile);
                    
                    const iconResponse = await fetch(`/api/servers/${this.serverId}/icon`, {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'Authorization': 'Bearer ' + (localStorage.getItem('accessToken') || '')
                        }
                    });
                    
                    if (!iconResponse.ok) {
                        throw new Error('Không thể tải icon lên');
                    }
                }

                // Update server name if changed
                const newName = this.modal.querySelector('#settingsServerNameInput')?.value;
                if (newName && newName !== this.originalData?.name) {
                    const response = await fetch(`/api/servers/${this.serverId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + (localStorage.getItem('accessToken') || '')
                        },
                        body: JSON.stringify({ name: newName })
                    });
                    
                    if (!response.ok) {
                        const error = await response.json().catch(() => ({}));
                        throw new Error(error.message || 'Không thể cập nhật tên server');
                    }
                }

                // Save role changes
                for (const role of this.roles) {
                    const originalRole = this.originalRoles?.find(r => String(r.id) === String(role.id));
                    const hasChanged = !originalRole || 
                        role.name !== originalRole.name ||
                        role.color !== originalRole.color ||
                        JSON.stringify(role.permissionsList) !== JSON.stringify(originalRole.permissionsList);

                    if (hasChanged) {
                        if (role.isNew) {
                            // Create new role
                            const response = await fetch(`/api/servers/${this.serverId}/roles`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': 'Bearer ' + (localStorage.getItem('accessToken') || '')
                                },
                                body: JSON.stringify({
                                    name: role.name,
                                    color: role.color,
                                    permissions: role.permissionsList || []
                                })
                            });

                            if (!response.ok) {
                                throw new Error(`Không thể tạo vai trò "${role.name}"`);
                            }
                        } else {
                            // Update existing role
                            const response = await fetch(`/api/servers/${this.serverId}/roles/${role.id}`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': 'Bearer ' + (localStorage.getItem('accessToken') || '')
                                },
                                body: JSON.stringify({
                                    name: role.name,
                                    color: role.color,
                                    permissionsList: role.permissionsList || []
                                })
                            });

                            if (!response.ok) {
                                throw new Error(`Không thể cập nhật vai trò "${role.name}"`);
                            }
                        }
                    }
                }

                // Delete removed roles
                if (this.originalRoles) {
                    for (const originalRole of this.originalRoles) {
                        const stillExists = this.roles.some(r => String(r.id) === String(originalRole.id));
                        if (!stillExists && !originalRole.isDefault) {
                            await fetch(`/api/servers/${this.serverId}/roles/${originalRole.id}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': 'Bearer ' + (localStorage.getItem('accessToken') || '')
                                }
                            });
                        }
                    }
                }
                
                // Update original data
                this.originalData = this._collectFormData();
                this.originalRoles = JSON.parse(JSON.stringify(this.roles));
                this.pendingIconFile = null;
                this.removeIcon = false;
                this.hasChanges = false;
                this.saveChangesBar.classList.remove('show');
                
                this._showToast('Đã lưu thay đổi thành công!', 'success');
                
                // Refresh roles to get new IDs
                await this._loadRoles();
                
                // Callback
                if (this.onSave) {
                    this.onSave({ name: newName });
                }
                
            } catch (error) {
                console.error('[ServerSettings] Save failed:', error);
                this._showToast('Không thể lưu: ' + error.message, 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Lưu thay đổi';
            }
        }

        _resetChanges() {
            // Reset form to original data
            if (this.originalData) {
                this.modal.querySelector('#settingsServerNameInput').value = this.originalData.name || '';
                this.modal.querySelector('#serverNameCharCount').textContent = (this.originalData.name || '').length;
            }
            
            // Reset icon
            if (this.serverData?.iconUrl) {
                const img = this.modal.querySelector('#serverIconImg');
                const placeholder = this.modal.querySelector('#serverIconPlaceholder');
                img.src = this.serverData.iconUrl;
                img.style.display = 'block';
                placeholder.style.display = 'none';
            } else {
                const img = this.modal.querySelector('#serverIconImg');
                const placeholder = this.modal.querySelector('#serverIconPlaceholder');
                img.style.display = 'none';
                placeholder.style.display = 'block';
            }
            
            // Reset roles
            this.roles = JSON.parse(JSON.stringify(this.originalRoles || []));
            this._renderRolesList();
            
            // Reset selected role
            if (this.selectedRoleId) {
                this._selectRole(this.selectedRoleId);
            }
            
            this.pendingIconFile = null;
            this.removeIcon = false;
            this.hasChanges = false;
            this.saveChangesBar.classList.remove('show');
        }

        // ==================== DELETE SERVER ====================
        
        _handleDeleteServer() {
            const serverName = this.serverData?.name || 'this server';
            const confirmName = prompt(`Nhập "${serverName}" để xác nhận xóa server:`);
            
            if (confirmName !== serverName) {
                if (confirmName !== null) {
                    this._showToast('Tên server không khớp', 'error');
                }
                return;
            }
            
            this._deleteServer();
        }

        async _deleteServer() {
            try {
                const response = await fetch(`/api/servers/${this.serverId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': 'Bearer ' + (localStorage.getItem('accessToken') || '')
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to delete server');
                }
                
                this._showToast('Đã xóa server', 'success');
                this.close();
                
                // Redirect or refresh
                window.location.reload();
                
            } catch (error) {
                console.error('[ServerSettings] Delete failed:', error);
                this._showToast('Không thể xóa server: ' + error.message, 'error');
            }
        }

        // ==================== PUBLIC API ====================
        
        async open(serverId) {
            this.serverId = serverId;
            
            // Reset state
            this.selectedRoleId = null;
            this.pendingIconFile = null;
            this.removeIcon = false;
            this.hasChanges = false;

            // Reset loaded flags for tabs
            this.membersLoaded = false;
            this.invitesLoaded = false;
            this.bansLoaded = false;
            this.emojiLoaded = false;
            this.stickersLoaded = false;
            
            // Show modal
            this.modal.classList.add('show');
            
            // Load server data
            await this._loadServerData();
            
            // Switch to overview tab
            this._switchTab('overview');
        }

        async _loadServerData() {
            try {
                // Fetch server details
                const response = await fetch(`/api/servers/${this.serverId}`, {
                    headers: {
                        'Authorization': 'Bearer ' + (localStorage.getItem('accessToken') || '')
                    }
                });
                
                if (!response.ok) throw new Error('Failed to load server');
                
                this.serverData = await response.json();
                
                // Update UI
                this.serverNameDisplay.textContent = this.serverData.name;
                this.modal.querySelector('#settingsServerNameInput').value = this.serverData.name;
                this.modal.querySelector('#serverNameCharCount').textContent = this.serverData.name.length;
                
                // Server icon
                const img = this.modal.querySelector('#serverIconImg');
                const placeholder = this.modal.querySelector('#serverIconPlaceholder');
                const btnRemove = this.modal.querySelector('#btnRemoveIcon');
                
                if (this.serverData.iconUrl) {
                    img.src = this.serverData.iconUrl;
                    img.style.display = 'block';
                    placeholder.style.display = 'none';
                    btnRemove.style.display = 'inline-block';
                } else {
                    img.style.display = 'none';
                    placeholder.textContent = (this.serverData.name || 'S').charAt(0).toUpperCase();
                    placeholder.style.display = 'block';
                    btnRemove.style.display = 'none';
                }
                
                // Store original data
                this.originalData = this._collectFormData();
                
                // Load roles
                await this._loadRoles();
                
            } catch (error) {
                console.error('[ServerSettings] Load failed:', error);
                this._showToast('Không thể tải thông tin server', 'error');
            }
        }

        async _loadRoles() {
            try {
                const response = await fetch(`/api/servers/${this.serverId}/roles`, {
                    headers: {
                        'Authorization': 'Bearer ' + (localStorage.getItem('accessToken') || '')
                    }
                });
                
                if (!response.ok) {
                    // If API doesn't exist yet, use mock data
                    this.roles = [
                        { id: 1, name: '@everyone', color: '#99aab5', permissions: 0, permissionsList: ['VIEW_CHANNELS', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'], memberCount: 10 },
                        { id: 2, name: 'Admin', color: '#e74c3c', permissions: 0, permissionsList: ['VIEW_CHANNELS', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'MANAGE_SERVER', 'KICK_MEMBERS', 'BAN_MEMBERS'], memberCount: 2 },
                        { id: 3, name: 'Moderator', color: '#3498db', permissions: 0, permissionsList: ['VIEW_CHANNELS', 'MANAGE_MESSAGES', 'KICK_MEMBERS'], memberCount: 3 }
                    ];
                } else {
                    this.roles = await response.json();
                }
                
                this.originalRoles = JSON.parse(JSON.stringify(this.roles));
                this._renderRolesList();
                
            } catch (error) {
                console.error('[ServerSettings] Load roles failed:', error);
                // Use mock data
                this.roles = [
                    { id: 1, name: '@everyone', color: '#99aab5', permissions: 0, permissionsList: ['VIEW_CHANNELS', 'SEND_MESSAGES'], memberCount: 10 }
                ];
                this.originalRoles = JSON.parse(JSON.stringify(this.roles));
                this._renderRolesList();
            }
        }

        close() {
            if (this.hasChanges) {
                if (!confirm('Bạn có thay đổi chưa lưu. Bạn có chắc muốn đóng?')) {
                    return;
                }
            }
            
            this.modal.classList.remove('show');
            this.saveChangesBar.classList.remove('show');
            
            if (this.onClose) {
                this.onClose();
            }
        }

        destroy() {
            this.modal?.remove();
        }

        // ==================== UTILITIES ====================
        
        _escapeHtml(str) {
            if (!str) return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }

        _showToast(message, type = 'info') {
            const existingToast = document.querySelector('.chat-toast');
            if (existingToast) existingToast.remove();
            
            const toast = document.createElement('div');
            toast.className = `chat-toast chat-toast-${type}`;
            toast.textContent = message;
            document.body.appendChild(toast);
            
            requestAnimationFrame(() => toast.classList.add('show'));
            
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    }

    // Export to global scope
    window.ServerSettingsManager = ServerSettingsManager;

})(window);
