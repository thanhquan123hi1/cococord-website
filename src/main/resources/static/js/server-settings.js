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
                                <div class="overview-section">
                                    <p style="color:var(--text-muted)">Tính năng Emoji đang được phát triển...</p>
                                </div>
                            </div>
                            
                            <div class="settings-tab-content" id="stickersTab">
                                <div class="overview-section">
                                    <p style="color:var(--text-muted)">Tính năng Stickers đang được phát triển...</p>
                                </div>
                            </div>
                            
                            <div class="settings-tab-content" id="membersTab">
                                <div class="overview-section">
                                    <p style="color:var(--text-muted)">Quản lý thành viên đang được phát triển...</p>
                                </div>
                            </div>
                            
                            <div class="settings-tab-content" id="invitesTab">
                                <div class="overview-section">
                                    <p style="color:var(--text-muted)">Quản lý lời mời đang được phát triển...</p>
                                </div>
                            </div>
                            
                            <div class="settings-tab-content" id="bansTab">
                                <div class="overview-section">
                                    <p style="color:var(--text-muted)">Danh sách cấm đang được phát triển...</p>
                                </div>
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
            
            container.innerHTML = this.roles.map(role => `
                <div class="role-item ${role.id === this.selectedRoleId ? 'active' : ''}" 
                     data-role-id="${role.id}">
                    <div class="role-color" style="background-color: ${role.color || '#99aab5'}"></div>
                    <span class="role-name">${this._escapeHtml(role.name)}</span>
                    <span class="role-count">${role.memberCount || 0}</span>
                </div>
            `).join('');
            
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
                item.classList.toggle('active', item.dataset.roleId === roleId);
            });
            
            // Show editor
            const empty = this.modal.querySelector('#rolesEditorEmpty');
            const content = this.modal.querySelector('#rolesEditorContent');
            
            empty.style.display = 'none';
            content.style.display = 'flex';
            content.style.flexDirection = 'column';
            content.style.height = '100%';
            
            // Populate editor
            this.modal.querySelector('#editingRoleName').textContent = role.name;
            this.modal.querySelector('#roleNameInput').value = role.name;
            this.modal.querySelector('#roleColorInput').value = role.color || '#99aab5';
            
            // Set permissions
            const permissions = role.permissions || 0;
            this.modal.querySelectorAll('[data-permission]').forEach(checkbox => {
                const permKey = checkbox.dataset.permission;
                // Check if permission bit is set (simplified - you'd need actual bitmask logic)
                checkbox.checked = role.permissionsList?.includes(permKey) || false;
            });
        }

        _createNewRole() {
            const newRole = {
                id: 'new_' + Date.now(),
                name: 'Vai trò mới',
                color: ROLE_COLORS[Math.floor(Math.random() * ROLE_COLORS.length)],
                permissions: 0,
                permissionsList: [],
                memberCount: 0,
                isNew: true
            };
            
            this.roles.push(newRole);
            this._renderRolesList();
            this._selectRole(newRole.id);
            this._checkForChanges();
        }

        _deleteSelectedRole() {
            if (!this.selectedRoleId) return;
            
            const role = this.roles.find(r => String(r.id) === String(this.selectedRoleId));
            if (!role) return;
            
            if (role.name === '@everyone') {
                this._showToast('Không thể xóa vai trò @everyone', 'error');
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
            
            role.name = name;
            this.modal.querySelector('#editingRoleName').textContent = name;
            
            // Update list
            const listItem = this.modal.querySelector(`.role-item[data-role-id="${this.selectedRoleId}"] .role-name`);
            if (listItem) listItem.textContent = name;
            
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
                // Prepare server settings data
                const settingsData = {
                    name: this.modal.querySelector('#settingsServerNameInput')?.value || this.serverData?.name,
                    roles: this.roles.map(role => ({
                        id: role.isNew ? null : role.id,
                        name: role.name,
                        color: role.color,
                        permissions: role.permissionsList || []
                    }))
                };
                
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
                        throw new Error('Failed to upload icon');
                    }
                }
                
                // Save settings
                const response = await fetch(`/api/servers/${this.serverId}/settings`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + (localStorage.getItem('accessToken') || '')
                    },
                    body: JSON.stringify(settingsData)
                });
                
                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
                    throw new Error(error.message || 'Failed to save settings');
                }
                
                // Update original data
                this.originalData = this._collectFormData();
                this.originalRoles = JSON.parse(JSON.stringify(this.roles));
                this.pendingIconFile = null;
                this.removeIcon = false;
                this.hasChanges = false;
                this.saveChangesBar.classList.remove('show');
                
                this._showToast('Đã lưu thay đổi thành công!', 'success');
                
                // Callback
                if (this.onSave) {
                    this.onSave(settingsData);
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
